import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ExternalLink, Globe, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChartCard, EmptyChart } from './ChartCard';
import { fmtInt, timeAgo } from './format';
import { viz, type Analytics } from './theme';

const statusStyle: Record<string, string> = {
  CONNECTED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  VERIFIED: 'bg-sky-50 text-sky-700 ring-sky-200',
  PENDING: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  DISCONNECTED: 'bg-red-50 text-red-700 ring-red-200',
  SUSPENDED: 'bg-amber-50 text-amber-800 ring-amber-200',
};

/** Requests per website as a ranked list with inline bars. */
export function WebsiteBreakdown({ sites }: { sites: Analytics['byWebsite'] }) {
  const max = Math.max(1, ...sites.map((s) => s.requests));
  return (
    <ChartCard title="Requests by website" description="Traffic per connected site" action={<Link href="/websites" className="text-[13px] font-medium text-zinc-600 hover:text-zinc-950">View all</Link>}>
      {sites.length === 0 ? (
        <EmptyChart height={180}>
          <span>No websites yet. <Link href="/websites" className="font-medium text-zinc-950 underline-offset-4 hover:underline">Add your first site</Link></span>
        </EmptyChart>
      ) : (
        <ul className="space-y-4">
          {sites.slice(0, 6).map((s) => (
            <li key={s.id}>
              <div className="mb-1.5 flex items-center gap-2 text-sm">
                <Globe className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <Link href={`/websites/${s.id}`} className="truncate font-medium text-zinc-900 hover:underline">{s.name}</Link>
                <span className={cn('rounded-full px-1.5 py-px text-[10px] font-medium uppercase tracking-wide ring-1', statusStyle[s.status] ?? statusStyle.PENDING)}>
                  {s.status.toLowerCase()}
                </span>
                <span className="ml-auto tabular-nums text-zinc-600">{fmtInt(s.requests)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(s.requests / max) * 100}%`, background: viz.series1 }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}

/** Monthly quota meter. */
export function UsageMeter({ used, limit, plan }: { used: number; limit: number; plan: string | null }) {
  const pct = limit ? Math.min(100, (used / limit) * 100) : 0;
  const tone = pct >= 90 ? viz.critical : pct >= 75 ? viz.warning : viz.series1;
  return (
    <ChartCard
      title="Monthly usage"
      description={plan ? <>Plan <span className="font-medium uppercase text-zinc-700">{plan}</span></> : 'No active plan'}
      action={<Link href="/billing" className="text-[13px] font-medium text-zinc-600 hover:text-zinc-950">Billing</Link>}
    >
      <p className="text-[1.75rem] font-semibold leading-none tracking-tight text-zinc-950">
        {fmtInt(used)} <span className="text-base font-normal text-zinc-400">/ {limit ? fmtInt(limit) : '—'}</span>
      </p>
      <p className="mt-1.5 text-xs text-zinc-500">MCP requests this month</p>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-100" role="meter" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Quota used">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: tone }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-zinc-500">
        <span>{pct.toFixed(0)}% used</span>
        <span>{limit ? `${fmtInt(Math.max(0, limit - used))} left` : 'Choose a plan to start'}</span>
      </div>
      {pct >= 90 && <p className="mt-3 flex items-center gap-1.5 text-xs text-red-700"><AlertTriangle className="h-3.5 w-3.5" />You are close to your monthly limit.</p>}
    </ChartCard>
  );
}

type ActivityRow = { id: string; action: string; status: string; createdAt: string };

const statusIcon = {
  SUCCESS: <CheckCircle2 className="h-4 w-4" style={{ color: viz.good }} />,
  DENIED: <AlertTriangle className="h-4 w-4" style={{ color: '#b7791f' }} />,
  ERROR: <XCircle className="h-4 w-4" style={{ color: viz.critical }} />,
} as Record<string, React.ReactNode>;

const pretty = (a: string) => a.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function RecentActivity({ rows }: { rows: ActivityRow[] }) {
  return (
    <ChartCard title="Recent activity" description="Latest account and connection events" action={<Link href="/activity" className="text-[13px] font-medium text-zinc-600 hover:text-zinc-950">View all</Link>}>
      {rows.length === 0 ? (
        <EmptyChart height={180}>No activity yet.</EmptyChart>
      ) : (
        <ul className="-my-2 divide-y divide-zinc-100">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-50 ring-1 ring-zinc-100">{statusIcon[r.status] ?? statusIcon.SUCCESS}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900">{pretty(r.action)}</p>
                <p className="text-xs text-zinc-500">{r.status.toLowerCase()}</p>
              </div>
              <span className="shrink-0 text-xs text-zinc-400">{timeAgo(r.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}

export function OnboardingBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-6">
      <div className="max-w-xl">
        <h2 className="text-base font-semibold text-zinc-950">Connect your first WordPress site</h2>
        <p className="mt-1 text-sm text-zinc-600">Add the site, install the WPConnect plugin, and paste the pairing code. Your charts fill in as soon as an AI app makes its first request.</p>
        <Link href="/websites" className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-950 px-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800">
          Add website <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
