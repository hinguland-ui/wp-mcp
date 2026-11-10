import Link from 'next/link';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/AppShell';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { RangeTabs } from '@/components/dashboard/RangeTabs';
import { RequestsChart } from '@/components/dashboard/RequestsChart';
import { SimpleBarChart } from '@/components/dashboard/SimpleBarChart';
import { fmtInt, fmtPct } from '@/components/dashboard/format';
import type { Analytics } from '@/components/dashboard/theme';
import { money } from '@/components/admin/ui';

type Overview = {
  days: number;
  totals: { users: number; admins: number; newUsers: number; websites: number; connectedWebsites: number; paidUsers: number; mrrCents: number; requests: number; successRate: number | null };
  websitesByStatus: Record<string, number>;
  planDistribution: { code: string; name: string; users: number }[];
  signups: { date: string; count: number }[];
  requests: Analytics['series'];
};

const STATUS_COLORS: Record<string, string> = { CONNECTED: '#0ca30c', VERIFIED: '#2a78d6', PENDING: '#a1a1aa', DISCONNECTED: '#d03b3b', SUSPENDED: '#fab219' };

export default async function AdminOverview({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days: raw } = await searchParams;
  const days = [7, 30, 90].includes(Number(raw)) ? Number(raw) : 30;
  const o = await api<Overview>(`/v1/admin/overview?days=${days}`);
  const t = o.totals;
  const maxPlan = Math.max(1, ...o.planDistribution.map((p) => p.users));
  const statusEntries = Object.entries(o.websitesByStatus).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <PageHeader title="Platform overview" description={`Everything happening across WPConnect AI in the last ${days} days.`} action={<RangeTabs days={days} />} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total users" value={fmtInt(t.users)} delta={null} hint={`+${fmtInt(t.newUsers)} new in ${days} days · ${t.admins} admin${t.admins === 1 ? '' : 's'}`} spark={o.signups.map((s) => s.count)} />
        <KpiCard label="Monthly recurring revenue" value={money(t.mrrCents)} delta={null} hint={`${fmtInt(t.paidUsers)} paying ${t.paidUsers === 1 ? 'user' : 'users'}`} />
        <KpiCard label="Websites" value={`${fmtInt(t.connectedWebsites)} / ${fmtInt(t.websites)}`} delta={null} hint="Connected / total" />
        <KpiCard label="MCP requests" value={fmtInt(t.requests)} delta={null} hint={`Success rate ${fmtPct(t.successRate)}`} spark={o.requests.map((r) => r.total)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="New signups" description={`${fmtInt(t.newUsers)} accounts created`}>
          <SimpleBarChart data={o.signups} label="Signups" empty="No new signups in this period." />
        </ChartCard>
        <ChartCard title="Platform MCP requests" description="All websites, by outcome">
          <RequestsChart series={o.requests} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Users by plan" description="Active subscriptions" action={<Link href="/admin/plans" className="text-[13px] font-medium text-zinc-600 hover:text-zinc-950">Manage plans</Link>}>
          <ul className="space-y-4">
            {o.planDistribution.map((p) => (
              <li key={p.code}>
                <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium text-zinc-900">{p.name}</span><span className="tabular-nums text-zinc-600">{fmtInt(p.users)}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-[#2a78d6]" style={{ width: `${(p.users / maxPlan) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard title="Websites by status" description={`${fmtInt(t.websites)} websites in total`} action={<Link href="/admin/websites" className="text-[13px] font-medium text-zinc-600 hover:text-zinc-950">View all</Link>}>
          {t.websites === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-500">No websites yet.</p>
          ) : (
            <>
              <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
                {statusEntries.map(([s, n]) => <span key={s} style={{ flexGrow: n, background: STATUS_COLORS[s] ?? '#a1a1aa' }} title={`${s}: ${n}`} />)}
              </div>
              <ul className="mt-5 grid grid-cols-2 gap-3">
                {statusEntries.map(([s, n]) => (
                  <li key={s} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: STATUS_COLORS[s] ?? '#a1a1aa' }} />
                    <span className="capitalize text-zinc-600">{s.toLowerCase()}</span>
                    <span className="ml-auto tabular-nums font-medium text-zinc-900">{fmtInt(n)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
