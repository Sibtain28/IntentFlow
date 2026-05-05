import { AiChatProvider, AppRole, CampaignVersionStatus, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { prisma } from '../src/shared/utils/prisma';

const TARGET_EMAIL = 'nakul.2024@nst.rishihood.edu.in';
const CAMPAIGN_NAME = 'Dummy SEO Intelligence Campaign';
const DOMAIN_URL = 'https://rishihood.edu.in';

const providers: AiChatProvider[] = ['chatgpt', 'claude', 'gemini', 'perplexity', 'grok'];

const website_pool = [
  'https://rishihood.edu.in/',
  'https://www.shiksha.com/university/rishihood-university-sonipat-58421',
  'https://www.careers360.com/university/rishihood-university-sonipat',
  'https://collegedunia.com/university/18461-rishihood-university-sonipat',
  'https://www.collegepravesh.com/',
  'https://www.vidyavision.com/college/rishihood-university',
  'https://www.ambitionbox.com/',
  'https://www.getmyuni.com/',
  'https://www.sarvgyan.com/',
  'https://www.collegesearch.in/',
];

const prompt_topics = [
  'admissions',
  'placement trends',
  'fee structure',
  'scholarships',
  'student reviews',
  'campus life',
  'curriculum quality',
  'faculty profile',
  'industry exposure',
  'entrepreneurship program',
];

const keyword_topics = [
  'rishihood university',
  'private university haryana',
  'bba admission india',
  'design school india',
  'best entrepreneurship college',
  'placement report university',
  'scholarship criteria',
  'college fees comparison',
];

const random_int = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const pick_many = <T>(items: T[], count: number): T[] => {
  const copy = [...items];
  const out: T[] = [];
  while (copy.length && out.length < count) {
    const idx = random_int(0, copy.length - 1);
    out.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return out;
};

const normalize_host = (url: string) => {
  try {
    return new URL(url).host.replace(/^www\./i, '').toLowerCase();
  } catch {
    return 'unknown.host';
  }
};

const generate_prompt_pool = (count: number) =>
  Array.from({ length: count }, () => {
    const topic = faker.helpers.arrayElement(prompt_topics);
    const intent = faker.helpers.arrayElement([
      'best',
      'compare',
      'top',
      'latest',
      'detailed',
    ]);
    return `${intent} ${topic} for ${faker.helpers.arrayElement(['Rishihood University', 'private universities in India'])}`;
  });

const generate_keyword_pool = (count: number) =>
  Array.from({ length: count }, () => {
    const head = faker.helpers.arrayElement(keyword_topics);
    const modifier = faker.helpers.arrayElement([
      '2026',
      'in india',
      'near delhi',
      'for undergraduate',
      'with placement',
      'fees',
    ]);
    return `${head} ${modifier}`.toLowerCase();
  });

async function ensure_user() {
  const existing = await prisma.user.findUnique({ where: { email: TARGET_EMAIL } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      email: TARGET_EMAIL,
      name: 'Nakul (Seeded)',
      app_role: AppRole.user,
    },
  });
}

async function ensure_tenant(user_id: string) {
  const membership = await prisma.tenantMember.findFirst({
    where: { user_id },
    include: { tenant: true },
    orderBy: { created_at: 'asc' },
  });
  if (membership?.tenant) {
    await prisma.user.update({
      where: { id: user_id },
      data: { active_tenant_id: membership.tenant_id },
    });
    return membership.tenant;
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Nakul Demo Workspace',
      slug: `nakul-demo-${Date.now().toString(36)}`,
      owner_user_id: user_id,
      userId: user_id,
      members: {
        create: {
          user_id,
          role: 'owner',
        },
      },
    },
  });

  await prisma.user.update({
    where: { id: user_id },
    data: { active_tenant_id: tenant.id },
  });

  return tenant;
}

async function ensure_domain(tenant_id: string, user_id: string) {
  const normalized_domain = normalize_host(DOMAIN_URL);
  const existing = await prisma.domain.findFirst({
    where: { tenant_id, normalized_domain },
  });
  if (existing) return existing;

  return prisma.domain.create({
    data: {
      tenant_id,
      created_by_user_id: user_id,
      normalized_domain,
      display_domain: normalized_domain,
      source_url: DOMAIN_URL,
      scrape_status: 'completed',
      last_scraped_at: new Date(),
      context: {
        create: {
          context_json: {
            summary: 'Seeded domain context for analytics exploration.',
            business_overview: 'Rishihood positioning and brand summary.',
          },
          pages_json: [],
        },
      },
    },
  });
}

async function ensure_campaign(tenant_id: string, user_id: string, domain_id: string) {
  const existing = await prisma.campaign.findFirst({
    where: { tenant_id, name: CAMPAIGN_NAME },
  });
  if (existing) return existing;

  return prisma.campaign.create({
    data: {
      tenant_id,
      domain_id,
      created_by_user_id: user_id,
      name: CAMPAIGN_NAME,
      description: 'Seeded analytics campaign for prompt and website insights',
      primary_goal: 'Discover top ranking websites and keyword opportunities',
      target_location: 'India',
      industry_tag: 'Education',
      business_type: 'University',
    },
  });
}

async function upsert_active_version(tenant_id: string, campaign_id: string, user_id: string) {
  const latest = await prisma.campaignVersion.findFirst({
    where: { tenant_id, campaign_id },
    orderBy: { version_number: 'desc' },
  });
  if (latest) {
    await prisma.campaignVersion.updateMany({
      where: { campaign_id },
      data: { is_active: false },
    });
    return prisma.campaignVersion.update({
      where: { id: latest.id },
      data: { is_active: true, status: CampaignVersionStatus.active },
    });
  }

  return prisma.campaignVersion.create({
    data: {
      tenant_id,
      campaign_id,
      created_by_user_id: user_id,
      version_number: 1,
      status: CampaignVersionStatus.active,
      is_active: true,
      label: 'Seed baseline',
    },
  });
}

async function reset_version_data(version_id: string) {
  await prisma.captureTurn.deleteMany({
    where: { capture_session: { campaign_version_id: version_id } },
  });
  await prisma.captureSession.deleteMany({ where: { campaign_version_id: version_id } });
  await prisma.semrushSnapshot.deleteMany({ where: { campaign_version_id: version_id } });
  await prisma.promptNode.deleteMany({ where: { campaign_version_id: version_id } });
  await prisma.generationRun.deleteMany({ where: { campaign_version_id: version_id } });
}

async function seed_prompt_nodes(tenant_id: string, version_id: string) {
  const base_prompts = generate_prompt_pool(12);
  await prisma.promptNode.createMany({
    data: base_prompts.map((prompt, idx) => ({
      tenant_id,
      campaign_version_id: version_id,
      type: 'prompt',
      content: prompt,
      depth: 0,
      metadata: { source: idx % 2 === 0 ? 'manual' : 'auto', selected: true },
      created_at: new Date(Date.now() - (idx + 1) * 60 * 60 * 1000),
    })),
  });
}

async function seed_capture_and_turns(tenant_id: string, version_id: string) {
  const base_prompts = generate_prompt_pool(18);
  const keyword_pool = generate_keyword_pool(36);
  const sessions = await Promise.all(
    providers.map((provider, idx) =>
      prisma.captureSession.create({
        data: {
          tenant_id,
          campaign_version_id: version_id,
          chat_provider: provider,
          conversation_id: `seed-conv-${provider}-${Date.now()}-${idx}`,
          chat_title: `Seeded ${provider} conversation`,
          status: 'complete',
          started_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          last_event_at: new Date(),
        },
      }),
    ),
  );

  const turn_creates: Prisma.PrismaPromise<unknown>[] = [];
  for (let day = 0; day < 14; day += 1) {
    const day_anchor = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
    for (const session of sessions) {
      const prompts_today = random_int(1, 3);
      for (let p = 0; p < prompts_today; p += 1) {
        const prompt = base_prompts[random_int(0, base_prompts.length - 1)];
        const discovered_sites = pick_many(website_pool, random_int(2, 5));
        const discovered_keywords = pick_many(keyword_pool, random_int(3, 5));
        const failed = Math.random() < 0.18;
        const timestamp = new Date(day_anchor.getTime() + random_int(8, 21) * 60 * 60 * 1000 + random_int(0, 59) * 60 * 1000);

        turn_creates.push(
          prisma.captureTurn.create({
            data: {
              tenant_id,
              capture_session_id: session.id,
              prompt,
              finished_reason: failed ? 'failed' : 'completed',
              prompt_detected_at: timestamp,
              response_finished_at: new Date(timestamp.getTime() + random_int(20, 120) * 1000),
              created_at: timestamp,
              metadata: {
                workflow_discovery: {
                  searchedKeywords: discovered_keywords.map((query) => ({
                    query,
                    sourceProvider: session.chat_provider,
                    firstSeenAt: timestamp.toISOString(),
                  })),
                  crawledWebsites: discovered_sites.map((url) => ({
                    url,
                    host: normalize_host(url),
                    source: 'assistant_search',
                    firstSeenAt: timestamp.toISOString(),
                  })),
                },
              },
            },
          }),
        );
      }
    }
  }

  await prisma.$transaction(turn_creates);
}

async function seed_seo_snapshots(tenant_id: string, version_id: string) {
  const keyword_pool = generate_keyword_pool(50);
  const targets = pick_many(website_pool, 5);
  const snapshots = targets.flatMap((url, idx) => {
    const host = normalize_host(url);
    const records: Prisma.SemrushSnapshotCreateManyInput[] = [];
    for (let i = 0; i < 3; i += 1) {
      const fetched_at = new Date(Date.now() - (idx * 3 + i) * 24 * 60 * 60 * 1000);
      records.push({
        tenant_id,
        campaign_version_id: version_id,
        query_text: `site-keywords:${host}`,
        fetched_at,
        summary_metrics: {
          target_type: 'domain',
          target: host,
          host,
          page_url: url,
        },
        raw_response: {
          top_queries: pick_many(keyword_pool, 4).map((query) => ({
            query,
            volume: random_int(100, 2500),
            traffic: random_int(20, 800),
            position: random_int(1, 25),
            sourceTimestamp: fetched_at.toISOString(),
          })),
        },
      });
    }
    return records;
  });

  await prisma.semrushSnapshot.createMany({ data: snapshots });
}

async function main() {
  const user = await ensure_user();
  const tenant = await ensure_tenant(user.id);
  const domain = await ensure_domain(tenant.id, user.id);
  const campaign = await ensure_campaign(tenant.id, user.id, domain.id);
  const version = await upsert_active_version(tenant.id, campaign.id, user.id);

  await reset_version_data(version.id);
  await seed_prompt_nodes(tenant.id, version.id);
  await seed_capture_and_turns(tenant.id, version.id);
  await seed_seo_snapshots(tenant.id, version.id);

  console.log('Dummy seed complete');
  console.log(`User: ${user.email}`);
  console.log(`Tenant: ${tenant.name} (${tenant.id})`);
  console.log(`Campaign: ${campaign.name} (${campaign.id})`);
  console.log(`Version: ${version.id}`);
}

main()
  .catch((error) => {
    console.error('Dummy seed failed:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
