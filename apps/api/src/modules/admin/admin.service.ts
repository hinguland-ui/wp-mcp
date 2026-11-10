import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const DAY = 86_400_000;
const period = (d = new Date()) => d.toISOString().slice(0, 7);
const LIVE = ['ACTIVE', 'TRIALING'] as const;

function dayKeys(days: number) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = new Date(today.getTime() - (days - 1) * DAY);
  return { start, keys: Array.from({ length: days }, (_, i) => new Date(start.getTime() + i * DAY).toISOString().slice(0, 10)) };
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ───────────── Overview ─────────────

  async overview(days = 30) {
    const d = Math.min(Math.max(Math.trunc(days) || 30, 1), 90);
    const { start, keys } = dayKeys(d);

    const [users, admins, websitesByStatus, subs, newUsers, requests, plans] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.website.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.subscription.findMany({ where: { status: { in: [...LIVE] } }, select: { userId: true, plan: { select: { code: true, name: true, priceCents: true, interval: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
      this.prisma.mCPRequest.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true, status: true, durationMs: true }, take: 500_000 }),
      this.prisma.plan.findMany({ orderBy: { priceCents: 'asc' }, select: { code: true, name: true } }),
    ]);

    // One live subscription per user (latest wins).
    const perUser = new Map<string, (typeof subs)[number]['plan']>();
    for (const s of subs) if (!perUser.has(s.userId)) perUser.set(s.userId, s.plan);
    const planCounts = new Map<string, number>();
    let mrrCents = 0;
    for (const p of perUser.values()) {
      planCounts.set(p.code, (planCounts.get(p.code) ?? 0) + 1);
      mrrCents += p.interval === 'YEARLY' ? Math.round(p.priceCents / 12) : p.priceCents;
    }

    const signups = new Map(keys.map((k) => [k, 0]));
    for (const u of newUsers) {
      const k = u.createdAt.toISOString().slice(0, 10);
      if (signups.has(k)) signups.set(k, signups.get(k)! + 1);
    }

    const req = new Map(keys.map((k) => [k, { success: 0, denied: 0, error: 0, ms: [] as number[] }]));
    for (const r of requests) {
      const b = req.get(r.createdAt.toISOString().slice(0, 10));
      if (!b) continue;
      if (r.status === 'SUCCESS') b.success++;
      else if (r.status === 'DENIED') b.denied++;
      else b.error++;
      if (r.durationMs != null) b.ms.push(r.durationMs);
    }
    const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
    const p95 = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(xs.length * 0.95))] : null);

    const sites = Object.fromEntries(websitesByStatus.map((w) => [w.status, w._count._all])) as Record<string, number>;
    const ok = requests.filter((r) => r.status === 'SUCCESS').length;

    return {
      days: d,
      totals: {
        users,
        admins,
        newUsers: newUsers.length,
        websites: Object.values(sites).reduce((a, b) => a + b, 0),
        connectedWebsites: sites.CONNECTED ?? 0,
        paidUsers: [...perUser.values()].filter((p) => p.priceCents > 0).length,
        mrrCents,
        requests: requests.length,
        successRate: requests.length ? ok / requests.length : null,
      },
      websitesByStatus: sites,
      planDistribution: plans.map((p) => ({ code: p.code, name: p.name, users: planCounts.get(p.code) ?? 0 })),
      signups: [...signups].map(([date, count]) => ({ date, count })),
      requests: [...req].map(([date, b]) => ({ date, success: b.success, denied: b.denied, error: b.error, total: b.success + b.denied + b.error, avgMs: avg(b.ms), p95Ms: p95(b.ms) })),
    };
  }

  // ───────────── Users ─────────────

  async listUsers(q?: string, page = 1, pageSize = 25) {
    const where: Prisma.UserWhereInput = q ? { OR: [{ email: { contains: q } }, { name: { contains: q } }] } : {};
    const take = Math.min(Math.max(pageSize, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;
    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true, email: true, name: true, role: true, createdAt: true,
          _count: { select: { websites: true } },
          subscriptions: { where: { status: { in: [...LIVE] } }, orderBy: { createdAt: 'desc' }, take: 1, select: { plan: { select: { code: true, name: true } } } },
        },
      }),
    ]);
    const usage = await this.prisma.usageRecord.groupBy({
      by: ['userId'],
      where: { userId: { in: users.map((u) => u.id) }, period: period(), metric: 'mcp_requests' },
      _sum: { quantity: true },
    });
    const used = new Map(usage.map((u) => [u.userId, u._sum.quantity ?? 0]));
    return {
      total,
      page: Math.max(page, 1),
      pageSize: take,
      users: users.map((u) => ({
        id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.createdAt,
        websites: u._count.websites,
        plan: u.subscriptions[0]?.plan ?? null,
        requestsThisMonth: used.get(u.id) ?? 0,
      })),
    };
  }

  async getUser(id: string) {
    const u = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, name: true, role: true, createdAt: true,
        websites: { orderBy: { createdAt: 'desc' }, select: { id: true, name: true, url: true, status: true, createdAt: true } },
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, status: true, currentPeriodStart: true, currentPeriodEnd: true, createdAt: true, plan: { select: { code: true, name: true, priceCents: true } } } },
        activityLogs: { orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, action: true, status: true, ip: true, createdAt: true } },
      },
    });
    if (!u) throw new NotFoundException('User not found');
    const usage = await this.prisma.usageRecord.aggregate({ where: { userId: id, period: period(), metric: 'mcp_requests' }, _sum: { quantity: true } });
    return { ...u, requestsThisMonth: usage._sum.quantity ?? 0 };
  }

  async updateUser(actorId: string, id: string, input: { role?: 'USER' | 'ADMIN'; planCode?: string; name?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (input.role && id === actorId && input.role !== 'ADMIN') throw new BadRequestException('You cannot remove your own admin role');

    await this.prisma.$transaction(async (tx) => {
      if (input.role || input.name) {
        await tx.user.update({ where: { id }, data: { ...(input.role ? { role: input.role } : {}), ...(input.name ? { name: input.name } : {}) } });
      }
      if (input.planCode) {
        const plan = await tx.plan.findUnique({ where: { code: input.planCode } });
        if (!plan) throw new BadRequestException('Unknown plan');
        await tx.subscription.updateMany({ where: { userId: id, status: { in: [...LIVE] } }, data: { status: 'CANCELED' } });
        const now = new Date();
        await tx.subscription.create({
          data: { userId: id, planId: plan.id, status: 'ACTIVE', currentPeriodStart: now, currentPeriodEnd: new Date(now.getTime() + (plan.interval === 'YEARLY' ? 365 : 30) * DAY) },
        });
      }
    });
    return this.getUser(id);
  }

  async deleteUser(actorId: string, id: string) {
    if (id === actorId) throw new BadRequestException('You cannot delete your own account here');
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') throw new NotFoundException('User not found');
      throw e;
    }
    return { ok: true };
  }

  // ───────────── Websites ─────────────

  async listWebsites(q?: string, status?: string) {
    const since = new Date(Date.now() - 30 * DAY);
    const sites = await this.prisma.website.findMany({
      where: {
        ...(q ? { OR: [{ name: { contains: q } }, { url: { contains: q } }, { user: { email: { contains: q } } }] } : {}),
        ...(status ? { status: status as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: { id: true, name: true, url: true, status: true, createdAt: true, user: { select: { id: true, email: true, name: true } } },
    });
    const counts = await this.prisma.mCPRequest.groupBy({ by: ['websiteId'], where: { websiteId: { in: sites.map((s) => s.id) }, createdAt: { gte: since } }, _count: { _all: true } });
    const m = new Map(counts.map((c) => [c.websiteId, c._count._all]));
    return sites.map((s) => ({ ...s, requests30d: m.get(s.id) ?? 0 }));
  }

  // ───────────── Plans ─────────────

  async listPlans() {
    const [plans, counts] = await Promise.all([
      this.prisma.plan.findMany({ orderBy: { priceCents: 'asc' } }),
      this.prisma.subscription.groupBy({ by: ['planId'], where: { status: { in: [...LIVE] } }, _count: { _all: true } }),
    ]);
    const m = new Map(counts.map((c) => [c.planId, c._count._all]));
    return plans.map((p) => ({ ...p, subscribers: m.get(p.id) ?? 0 }));
  }

  createPlan(input: PlanInput & { code: string }) {
    return this.prisma.plan.create({ data: { ...input, features: input.features ?? Prisma.JsonNull } }).catch((e) => {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw new BadRequestException('A plan with this code already exists');
      throw e;
    });
  }

  async updatePlan(id: string, input: Partial<PlanInput>) {
    const { features, ...rest } = input;
    try {
      return await this.prisma.plan.update({ where: { id }, data: { ...rest, ...(features !== undefined ? { features: features ?? Prisma.JsonNull } : {}) } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') throw new NotFoundException('Plan not found');
      throw e;
    }
  }

  // ───────────── Activity ─────────────

  activity(take = 100, status?: string) {
    return this.prisma.activityLog.findMany({
      where: status ? { status: status as any } : {},
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(take, 1), 500),
      select: { id: true, action: true, status: true, ip: true, createdAt: true, user: { select: { id: true, email: true } }, website: { select: { id: true, name: true } } },
    });
  }
}

export type PlanInput = {
  name: string;
  priceCents: number;
  currency: string;
  interval: 'MONTHLY' | 'YEARLY';
  maxWebsites: number;
  monthlyRequests: number;
  features: string[] | null;
  isActive: boolean;
};
