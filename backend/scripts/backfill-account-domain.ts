import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const slugify = (value: string): string => {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return cleaned.length ? cleaned : 'account';
};

const random_suffix = () => Math.random().toString(36).slice(2, 8);

const ensure_unique_slug = async (base_seed: string): Promise<string> => {
  const base = slugify(base_seed);
  let candidate = base;
  for (let i = 0; i < 10; i += 1) {
    const exists = await prisma.tenant.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!exists) return candidate;
    candidate = `${base}-${random_suffix()}`;
  }
  return `${base}-${Date.now().toString(36).slice(-4)}`;
};

async function run() {
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true },
  });
  for (const tenant of tenants) {
    if (!tenant.name.trim()) continue;
    const current = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      select: { slug: true },
    });
    if (current?.slug) continue;
    const slug = await ensure_unique_slug(tenant.name);
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { slug },
    });
  }

  await prisma.tenantMember.updateMany({
    where: {
      role: {
        notIn: ['owner', 'admin', 'member'],
      },
    },
    data: { role: 'owner' },
  });

  const users = await prisma.user.findMany({
    select: { id: true, active_tenant_id: true },
  });
  for (const user of users) {
    if (user.active_tenant_id) continue;
    const membership = await prisma.tenantMember.findFirst({
      where: { user_id: user.id },
      orderBy: { created_at: 'asc' },
      select: { tenant_id: true },
    });
    if (!membership) continue;
    await prisma.user.update({
      where: { id: user.id },
      data: { active_tenant_id: membership.tenant_id },
    });
  }
}

run()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
