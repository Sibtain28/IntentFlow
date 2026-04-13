/// <reference types="node" />

import { prisma } from '../src/utils/prisma';
import { hashPassword } from '../src/utils/bcrypt';

/**
 * ===============================
 * UserService (SRP + Service Layer)
 * ===============================
 * - Single Responsibility Principle (SRP)
 *   → Handles only user-related logic
 * - Encapsulation
 *   → Internal logic hidden inside class
 */
class UserService {
  constructor(
    private prismaClient: typeof prisma // Dependency Injection (DIP)
  ) {}

  /**
   * Abstraction:
   * High-level method to create/update admin
   */
  async upsertAdmin(
    email: string,
    name: string,
    password: string,
    role: string
  ) {
    console.log(`Creating/updating admin account for ${email}...`);

    try {
      /**
       * Strategy-like behavior:
       * Password hashing can be replaced with another strategy
       */
      const hashedPassword = await hashPassword(password);

      /**
       * Repository Pattern (via Prisma)
       * - Abstracts DB operations
       */
      const user = await this.prismaClient.user.upsert({
        where: { email },

        /**
         * Idempotent operation:
         * - Running multiple times gives same result
         */
        update: {
          name,
          password: hashedPassword,
          app_role: role as any,
        },

        create: {
          email,
          name,
          password: hashedPassword,
          app_role: role as any,
        },
      });

      console.log(`Successfully configured admin account!`);
      console.log(`User ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.app_role}`);

    } catch (error) {
      /**
       * Defensive Programming:
       * - Handle failures gracefully
       */
      console.error('Failed to create admin account:', error);
    }
  }
}

/**
 * ===============================
 * AdminSetupRunner (Facade Pattern)
 * ===============================
 * - Provides single entry point
 * - Orchestrates services
 */
class AdminSetupRunner {
  private userService: UserService;

  constructor() {
    /**
     * Dependency Injection
     */
    this.userService = new UserService(prisma);
  }

  /**
   * Abstraction:
   * Defines high-level workflow
   */
  async run(): Promise<void> {
    const email = 'admin@relicwave.com';
    const name = 'admin';
    const password = 'admin1234';
    const app_role = 'admin';

    await this.userService.upsertAdmin(
      email,
      name,
      password,
      app_role
    );
  }

  /**
   * Resource cleanup → Reliability
   */
  async cleanup(): Promise<void> {
    await prisma.$disconnect();
  }
}

/**
 * ===============================
 * Entry Point
 * ===============================
 * - Graceful shutdown pattern
 */
const runner = new AdminSetupRunner();

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