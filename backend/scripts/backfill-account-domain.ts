/// <reference types="node" />

import { PrismaClient } from '@prisma/client';

/**
 * ===============================
 * SlugService (Encapsulation + SRP)
 * ===============================
 * - Encapsulation: internal methods (slugify, randomSuffix) are private
 * - SRP: only responsible for slug generation
 */
class SlugService {
  constructor(private prisma: PrismaClient) {} // Dependency Injection (DIP)

  // Private helper → Encapsulation
  private slugify(value: string): string {
    const cleaned = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);

    return cleaned.length ? cleaned : 'account';
  }

  // Private helper → Encapsulation
  private randomSuffix(): string {
    return Math.random().toString(36).slice(2, 8);
  }

  /**
   * Strategy-like behavior:
   * - Try base slug
   * - Retry with suffix
   * - Fallback with timestamp
   */
  async ensureUniqueSlug(baseSeed: string): Promise<string> {
    const base = this.slugify(baseSeed);
    let candidate = base;

    for (let i = 0; i < 10; i += 1) {
      const exists = await this.prisma.tenant.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });

      if (!exists) return candidate;

      candidate = `${base}-${this.randomSuffix()}`;
    }

    return `${base}-${Date.now().toString(36).slice(-4)}`;
  }
}

/**
 * ===============================
 * TenantService (SRP + Service Layer Pattern)
 * ===============================
 * - Handles tenant-related operations
 * - Uses SlugService → Composition (preferred over inheritance)
 */
class TenantService {
  constructor(
    private prisma: PrismaClient,
    private slugService: SlugService
  ) {}

  /**
   * Idempotent operation:
   * Running multiple times is safe
   */
  async backfillSlugs(): Promise<void> {
    const tenants = await this.prisma.tenant.findMany({
      select: { id: true, name: true },
    });

    for (const tenant of tenants) {
      if (!tenant.name.trim()) continue;

      const current = await this.prisma.tenant.findUnique({
        where: { id: tenant.id },
        select: { slug: true },
      });

      // Guard clause → Defensive Programming
      if (current?.slug) continue;

      const slug = await this.slugService.ensureUniqueSlug(tenant.name);

      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: { slug },
      });
    }
  }

  /**
   * Data normalization pattern:
   * Fix invalid roles → ensures consistency
   */
  async normalizeRoles(): Promise<void> {
    await this.prisma.tenantMember.updateMany({
      where: {
        role: {
          notIn: ['owner', 'admin', 'member'],
        },
      },
      data: { role: 'owner' },
    });
  }
}

/**
 * ===============================
 * UserService (SRP)
 * ===============================
 * - Responsible only for user-related fixes
 */
class UserService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Batch Processing Pattern
   * - Iterates over all users
   * - Fixes missing active tenant
   */
  async fixActiveTenant(): Promise<void> {
    const users = await this.prisma.user.findMany({
      select: { id: true, active_tenant_id: true },
    });

    for (const user of users) {
      if (user.active_tenant_id) continue;

      const membership = await this.prisma.tenantMember.findFirst({
        where: { user_id: user.id },
        orderBy: { created_at: 'asc' },
        select: { tenant_id: true },
      });

      if (!membership) continue;

      await this.prisma.user.update({
        where: { id: user.id },
        data: { active_tenant_id: membership.tenant_id },
      });
    }
  }
}

/**
 * ===============================
 * BackfillRunner (Facade Pattern)
 * ===============================
 * - Orchestrates multiple services
 * - Provides a single entry point
 */
class BackfillRunner {
  private prisma: PrismaClient;
  private slugService: SlugService;
  private tenantService: TenantService;
  private userService: UserService;

  constructor() {
    this.prisma = new PrismaClient(); // Object creation
    this.slugService = new SlugService(this.prisma);
    this.tenantService = new TenantService(this.prisma, this.slugService);
    this.userService = new UserService(this.prisma);
  }

  /**
   * High-level workflow (Abstraction)
   */
  async run(): Promise<void> {
    await this.tenantService.backfillSlugs();
    await this.tenantService.normalizeRoles();
    await this.userService.fixActiveTenant();
  }

  /**
   * Resource cleanup → Reliability
   */
  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

/**
 * ===============================
 * Entry Point
 * ===============================
 * - Handles execution lifecycle
 * - Graceful shutdown pattern
 */
const runner = new BackfillRunner();

runner
  .run()
  .then(async () => {
    await runner.cleanup();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    await runner.cleanup();
    process.exit(1);
  });