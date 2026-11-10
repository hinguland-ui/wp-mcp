import { api } from '@/lib/api';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { LatencyChart } from '@/components/dashboard/LatencyChart';
import { OnboardingBanner, RecentActivity, UsageMeter, WebsiteBreakdown } from '@/components/dashboard/Panels';
import { RangeTabs } from '@/components/dashboard/RangeTabs';
import { RequestsChart } from '@/components/dashboard/RequestsChart';
import { TopToolsChart } from '@/components/dashboard/TopToolsChart';
import { change, fmtInt, fmtMs, fmtPct } from '@/components/dashboard/format';
import type { Analytics } from '@/components/dashboard/theme';

export default async function Overview({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days: raw } = await searchParams;
  const days = [7, 30, 90].includes(Number(raw)) ? Number(raw) : 30;

  const [a, usage, me, activity] = await Promise.all([
    api<Analytics>(`/v1/usage/analytics?days=${days}`),
    api<{ used: number; limit: number; plan: string | null }>('/v1/usage'),
    api<{ name: string }>('/v1/auth/me'),
    api<{ id: string; action: string; status: string; createdAt: string }[]>('/v1/activity?take=6'),
  ]);

  const { current: c, previous: p, series } = a;
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">{greet}, {me.name.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-zinc-500">Here&apos;s how your connected sites performed over the last {days} days.</p>
        </div>
        <RangeTabs days={days} />
      </div>

      {a.websites.total === 0 && <OnboardingBanner />}

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total requests" value={fmtInt(c.requests)} delta={change(c.requests, p.requests)} spark={series.map((d) => d.total)} />
        <KpiCard label="Success rate" value={fmtPct(c.successRate)} delta={change(c.successRate, p.successRate)} spark={series.map((d) => (d.total ? d.success / d.total : 0))} />
        <KpiCard label="Avg response time" value={fmtMs(c.avgMs)} delta={change(c.avgMs, p.avgMs)} higherIsBetter={false} spark={series.map((d) => d.avgMs ?? 0)} hint={c.p95Ms != null ? `p95 ${fmtMs(c.p95Ms)}` : undefined} />
        <KpiCard label="Connected sites" value={`${a.websites.connected} / ${a.websites.total}`} delta={null} hint={`${fmtInt(c.errors + c.denied)} failed or denied requests`} />
      </div>

      {/* Main chart */}
      <ChartCard
        title="MCP requests"
        description={<>{fmtInt(c.requests)} requests · {fmtInt(c.errors)} errors · {fmtInt(c.denied)} denied</>}
      >
        <RequestsChart series={series} />
      </ChartCard>

      {/* Two-up */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Response time" description="Daily average and 95th percentile">
          <LatencyChart series={series} />
        </ChartCard>
        <ChartCard title="Top tools" description="Most-called MCP tools in this period">
          <TopToolsChart tools={a.topTools} />
        </ChartCard>
      </div>

      {/* Three-up */}
      <div className="grid gap-6 lg:grid-cols-3">
        <WebsiteBreakdown sites={a.byWebsite} />
        <UsageMeter used={usage.used} limit={usage.limit} plan={usage.plan} />
        <RecentActivity rows={activity} />
      </div>
    </div>
  );
}
