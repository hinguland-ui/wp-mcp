import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const period = (d = new Date()) => d.toISOString().slice(0, 7);

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  record(userId: string, websiteId: string | null, metric = 'mcp_requests', quantity = 1) {
    return this.prisma.usageRecord.create({ data: { userId, websiteId, metric, quantity, period: period() } });
  }

  async summary(userId: string) {
    const p = period();
    const agg = await this.prisma.usageRecord.aggregate({
      where: { userId, period: p, metric: 'mcp_requests' },
      _sum: { quantity: true },
    });
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
    return {
      period: p,
      used: agg._sum.quantity ?? 0,
      limit: sub?.plan.monthlyRequests ?? 0,
      plan: sub?.plan.code ?? null,
    };
  }

  /**
   * Dashboard analytics over the last `days` days (UTC), plus the previous period for deltas.
   * Built from MCPRequest rows of the user's websites.
   */
  async analytics(userId: string, days = 30) {
    const d = Math.min(Math.max(Math.trunc(days) || 30, 1), 90);
    const DAY = 86_400_000;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const start = new Date(today.getTime() - (d - 1) * DAY);
    const prevStart = new Date(start.getTime() - d * DAY);

    const websites = await this.prisma.website.findMany({ where: { userId }, select: { id: true, name: true, url: true, status: true } });
    const rows = websites.length
      ? await this.prisma.mCPRequest.findMany({
          where: { websiteId: { in: websites.map((w) => w.id) }, createdAt: { gte: prevStart } },
          select: { createdAt: true, status: true, durationMs: true, toolName: true, websiteId: true },
          orderBy: { createdAt: 'asc' },
          take: 200_000,
        })
      : [];

    const cur = rows.filter((r) => r.createdAt >= start);
    const prev = rows.filter((r) => r.createdAt < start);

    const pct = (xs: number[], p: number) => {
      if (!xs.length) return null;
      const s = [...xs].sort((a, b) => a - b);
      return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
    };
    const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
    const stats = (rs: typeof rows) => {
      const ms = rs.map((r) => r.durationMs).filter((x): x is number => x != null);
      const ok = rs.filter((r) => r.status === 'SUCCESS').length;
      return {
        requests: rs.length,
        successRate: rs.length ? ok / rs.length : null,
        errors: rs.filter((r) => r.status === 'ERROR').length,
        denied: rs.filter((r) => r.status === 'DENIED').length,
        avgMs: avg(ms),
        p95Ms: pct(ms, 95),
      };
    };

    // Daily series
    const buckets = new Map<string, { success: number; denied: number; error: number; ms: number[] }>();
    for (let i = 0; i < d; i++) {
      buckets.set(new Date(start.getTime() + i * DAY).toISOString().slice(0, 10), { success: 0, denied: 0, error: 0, ms: [] });
    }
    for (const r of cur) {
      const b = buckets.get(r.createdAt.toISOString().slice(0, 10));
      if (!b) continue;
      if (r.status === 'SUCCESS') b.success++;
      else if (r.status === 'DENIED') b.denied++;
      else b.error++;
      if (r.durationMs != null) b.ms.push(r.durationMs);
    }
    const series = [...buckets].map(([date, b]) => ({
      date,
      success: b.success,
      denied: b.denied,
      error: b.error,
      total: b.success + b.denied + b.error,
      avgMs: avg(b.ms),
      p95Ms: pct(b.ms, 95),
    }));

    // Top tools
    const tools = new Map<string, { calls: number; errors: number }>();
    for (const r of cur) {
      const k = r.toolName ?? 'unknown';
      const t = tools.get(k) ?? { calls: 0, errors: 0 };
      t.calls++;
      if (r.status !== 'SUCCESS') t.errors++;
      tools.set(k, t);
    }
    const topTools = [...tools].map(([name, t]) => ({ name, ...t })).sort((a, b) => b.calls - a.calls).slice(0, 8);

    // Per website
    const perSite = new Map<string, number>();
    for (const r of cur) perSite.set(r.websiteId, (perSite.get(r.websiteId) ?? 0) + 1);
    const byWebsite = websites
      .map((w) => ({ id: w.id, name: w.name, url: w.url, status: w.status, requests: perSite.get(w.id) ?? 0 }))
      .sort((a, b) => b.requests - a.requests);

    return {
      days: d,
      from: start.toISOString(),
      current: stats(cur),
      previous: stats(prev),
      series,
      topTools,
      byWebsite,
      websites: {
        total: websites.length,
        connected: websites.filter((w) => w.status === 'CONNECTED').length,
      },
    };
  }

  /** True when the user may make another MCP request this month. */
  async withinQuota(userId: string) {
    const s = await this.summary(userId);
    return s.limit > 0 && s.used < s.limit;
  }
}
