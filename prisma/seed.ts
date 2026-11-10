import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SCOPES: Array<[string, string, boolean]> = [
  ['content:read', 'Read posts, pages and taxonomies', true],
  ['content:write', 'Create and edit posts and pages', false],
  ['media:read', 'Read the media library', true],
  ['media:write', 'Upload and edit media', false],
  ['elementor:read', 'Read Elementor layouts', false],
  ['elementor:write', 'Edit Elementor layouts', false],
  ['woocommerce:read', 'Read products and orders', false],
  ['woocommerce:write', 'Edit products and orders', false],
  ['users:read', 'Read user list (no emails)', false],
  ['settings:read', 'Read site settings', false],
  ['settings:write', 'Change site settings', false],
];

const PRESETS: Array<[string, string, string[]]> = [
  ['Read only', 'Safe browsing of content', ['content:read', 'media:read']],
  ['Content editor', 'Create and edit content', ['content:read', 'content:write', 'media:read', 'media:write']],
  ['Store manager', 'Content plus WooCommerce', ['content:read', 'content:write', 'media:read', 'woocommerce:read', 'woocommerce:write']],
];

async function main() {
  for (const [name, description, isDefault] of SCOPES) {
    await prisma.oAuthScope.upsert({
      where: { name },
      update: { description, isDefault },
      create: { name, description, isDefault },
    });
  }

  for (const [name, description, scopes] of PRESETS) {
    const existing = await prisma.permissionPreset.findFirst({ where: { userId: null, name } });
    if (!existing) {
      await prisma.permissionPreset.create({ data: { name, description, scopes, isSystem: true } });
    }
  }

  const plans = [
    { code: 'free', name: 'Free', priceCents: 0, maxWebsites: 1, monthlyRequests: 1000 },
    { code: 'pro', name: 'Pro', priceCents: 1900, maxWebsites: 10, monthlyRequests: 50000 },
    { code: 'agency', name: 'Agency', priceCents: 7900, maxWebsites: 100, monthlyRequests: 500000 },
  ];
  // Create-only: never overwrite prices/limits a super admin has edited.
  for (const p of plans) {
    await prisma.plan.upsert({ where: { code: p.code }, update: {}, create: p });
  }
}

main().finally(() => prisma.$disconnect());
