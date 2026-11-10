import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SCOPES, UpdatePermissionsInput } from '@wpconnect/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async assertOwner(userId: string, websiteId: string) {
    const w = await this.prisma.website.findUnique({ where: { id: websiteId }, select: { userId: true } });
    if (!w) throw new NotFoundException('Website not found');
    if (w.userId !== userId) throw new ForbiddenException();
  }

  /**
   * Effective scopes = website ALLOW rules, minus per-client DENY rules.
   * This is the single source of truth used at consent time and at every tool call.
   */
  async effectiveScopes(websiteId: string, mcpClientId?: string | null): Promise<string[]> {
    const site = await this.prisma.websitePermission.findMany({
      where: { websiteId, effect: 'ALLOW' },
      select: { scope: true },
    });
    let allowed = new Set(site.map((p) => p.scope));
    if (mcpClientId) {
      const denies = await this.prisma.clientPermission.findMany({
        where: { websiteId, mcpClientId, effect: 'DENY' },
        select: { scope: true },
      });
      for (const d of denies) allowed.delete(d.scope);
    }
    return [...allowed];
  }

  list(websiteId: string) {
    return this.effectiveScopes(websiteId);
  }

  async setWebsiteScopes(userId: string, websiteId: string, input: UpdatePermissionsInput) {
    await this.assertOwner(userId, websiteId);
    const wanted = new Set<string>(input.scopes);
    await this.prisma.$transaction(async (tx) => {
      await tx.websitePermission.deleteMany({ where: { websiteId, scope: { notIn: [...wanted] } } });
      for (const scope of wanted) {
        await tx.websitePermission.upsert({
          where: { websiteId_scope: { websiteId, scope } },
          update: { effect: 'ALLOW', presetId: input.presetId ?? null },
          create: { websiteId, scope, effect: 'ALLOW', presetId: input.presetId ?? null },
        });
      }
      // Narrowing permissions must immediately narrow live tokens.
      const tokens = await tx.accessToken.findMany({ where: { websiteId, revokedAt: null }, select: { id: true, scope: true } });
      for (const t of tokens) {
        const kept = t.scope.split(' ').filter((s) => wanted.has(s));
        await tx.accessToken.update({ where: { id: t.id }, data: { scope: kept.join(' ') } });
      }
    });
    return this.effectiveScopes(websiteId);
  }

  listPresets(userId: string) {
    return this.prisma.permissionPreset.findMany({
      where: { OR: [{ userId: null }, { userId }] },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
  }

  allScopes() {
    return this.prisma.oAuthScope.findMany({ orderBy: { name: 'asc' } }).then((r) => (r.length ? r : SCOPES.map((name) => ({ name }))));
  }
}
