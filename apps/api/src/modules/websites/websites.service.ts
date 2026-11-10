import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateWebsiteInput } from '@wpconnect/shared';
import { hmacHex, open, randomToken, safeEqual, seal, sha256Hex } from '../../common/crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class WebsitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly activity: ActivityService,
  ) {}

  list(userId: string) {
    return this.prisma.website.findMany({
      where: { userId },
      include: { connection: { select: { pluginVersion: true, lastSeenAt: true, hasElementor: true, hasWooCommerce: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(userId: string, id: string) {
    const w = await this.prisma.website.findFirst({ where: { id, userId }, include: { connection: true } });
    if (!w) throw new NotFoundException();
    const { connection, ...rest } = w;
    return {
      ...rest,
      connection: connection && {
        pluginVersion: connection.pluginVersion,
        wpVersion: connection.wpVersion,
        lastSeenAt: connection.lastSeenAt,
        hasElementor: connection.hasElementor,
        hasWooCommerce: connection.hasWooCommerce,
      },
    };
  }

  /** Enforces plan.maxWebsites inside the same transaction as the insert. */
  async create(userId: string, input: CreateWebsiteInput) {
    const url = new URL(input.url);
    const host = url.host.toLowerCase();

    const site = await this.prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.findFirst({
        where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      });
      const count = await tx.website.count({ where: { userId } });
      if (!sub || count >= sub.plan.maxWebsites) throw new BadRequestException('Website limit reached for your plan');
      if (await tx.website.findUnique({ where: { userId_host: { userId, host } } })) {
        throw new ConflictException('Website already added');
      }
      return tx.website.create({
        data: { userId, name: input.name, url: url.origin + url.pathname.replace(/\/$/, ''), host },
      });
    });

    await this.activity.record({ userId, websiteId: site.id, action: 'website.created' });
    return site;
  }

  async remove(userId: string, id: string) {
    const r = await this.prisma.website.deleteMany({ where: { id, userId } });
    if (!r.count) throw new NotFoundException();
    await this.activity.record({ userId, action: 'website.deleted', metadata: { websiteId: id } });
  }

  /**
   * Step 1 of connecting: dashboard asks for a one-time pairing code, user pastes it into the plugin.
   * Only the hash is stored.
   */
  async startPairing(userId: string, websiteId: string) {
    const w = await this.prisma.website.findFirst({ where: { id: websiteId, userId } });
    if (!w) throw new NotFoundException();
    const code = randomToken(24);
    await this.prisma.websiteVerification.create({
      data: {
        websiteId,
        method: 'PLUGIN_HANDSHAKE',
        tokenHash: sha256Hex(code),
        expiresAt: new Date(Date.now() + 15 * 60_000),
      },
    });
    return { pairingCode: code, expiresInSeconds: 900, apiUrl: this.config.getOrThrow('API_PUBLIC_URL') };
  }

  /**
   * Step 2: the plugin presents the pairing code. We mint a per-site secret, return it ONCE,
   * and keep a sealed copy for signing outbound requests to the plugin.
   */
  async completePairing(input: {
    pairingCode: string;
    siteUrl: string;
    pluginVersion?: string;
    wpVersion?: string;
    phpVersion?: string;
    hasElementor?: boolean;
    hasWooCommerce?: boolean;
  }) {
    const ver = await this.prisma.websiteVerification.findUnique({ where: { tokenHash: sha256Hex(input.pairingCode) } });
    if (!ver || ver.status !== 'PENDING' || ver.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired pairing code');
    }
    const website = await this.prisma.website.findUniqueOrThrow({ where: { id: ver.websiteId } });
    if (new URL(input.siteUrl).host.toLowerCase() !== website.host) {
      throw new BadRequestException('Site URL does not match the registered website');
    }

    const siteSecret = randomToken(32);
    const key = this.config.getOrThrow<string>('SITE_SECRET_ENCRYPTION_KEY');
    const data = {
      siteSecretHash: sha256Hex(siteSecret),
      encryptedSiteSecret: seal(siteSecret, key),
      pluginVersion: input.pluginVersion,
      wpVersion: input.wpVersion,
      phpVersion: input.phpVersion,
      hasElementor: !!input.hasElementor,
      hasWooCommerce: !!input.hasWooCommerce,
      lastSeenAt: new Date(),
      connectedAt: new Date(),
    };
    await this.prisma.$transaction([
      this.prisma.websiteVerification.update({ where: { id: ver.id }, data: { status: 'VERIFIED', verifiedAt: new Date() } }),
      this.prisma.websiteConnection.upsert({ where: { websiteId: website.id }, update: data, create: { websiteId: website.id, ...data } }),
      this.prisma.website.update({ where: { id: website.id }, data: { status: 'CONNECTED' } }),
    ]);
    await this.activity.record({ userId: website.userId, websiteId: website.id, action: 'website.connected' });
    return { websiteId: website.id, siteSecret };
  }

  /** Verifies the plugin's signed heartbeat: HMAC(secret, `${ts}.${websiteId}`). */
  async heartbeat(websiteId: string, ts: string, signature: string, meta: Record<string, string | undefined>) {
    const skew = Math.abs(Date.now() / 1000 - Number(ts));
    if (!Number.isFinite(skew) || skew > 300) throw new BadRequestException('Stale timestamp');
    const conn = await this.prisma.websiteConnection.findUnique({ where: { websiteId } });
    if (!conn?.encryptedSiteSecret) throw new NotFoundException();
    const secret = open(conn.encryptedSiteSecret, this.config.getOrThrow('SITE_SECRET_ENCRYPTION_KEY'));
    if (!safeEqual(hmacHex(secret, `${ts}.${websiteId}`), signature)) throw new BadRequestException('Bad signature');
    await this.prisma.websiteConnection.update({
      where: { websiteId },
      data: { lastSeenAt: new Date(), pluginVersion: meta.pluginVersion, wpVersion: meta.wpVersion },
    });
    return { ok: true };
  }
}
