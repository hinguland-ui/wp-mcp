import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Globe } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { UserControls } from '@/components/admin/UserControls';
import { Pill, card, fmtDate, fmtDateTime, money } from '@/components/admin/ui';
import { fmtInt } from '@/components/dashboard/format';
import { cn } from '@/lib/utils';

type UserDetail = {
  id: string; email: string; name: string; role: 'USER' | 'ADMIN'; createdAt: string; requestsThisMonth: number;
  websites: { id: string; name: string; url: string; status: string; createdAt: string }[];
  subscriptions: { id: string; status: string; currentPeriodStart: string; currentPeriodEnd: string; createdAt: string; plan: { code: string; name: string; priceCents: number } }[];
  activityLogs: { id: string; action: string; status: string; ip: string | null; createdAt: string }[];
};

export default async function AdminUser({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let u: UserDetail;
  try {
    u = await api<UserDetail>(`/v1/admin/users/${encodeURIComponent(id)}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  const [plans, me] = await Promise.all([
    api<{ code: string; name: string; isActive: boolean }[]>('/v1/admin/plans'),
    api<{ id: string }>('/v1/auth/me'),
  ]);
  const live = u.subscriptions.find((s) => s.status === 'ACTIVE' || s.status === 'TRIALING');

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-950"><ArrowLeft className="h-4 w-4" />All users</Link>

      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-base font-semibold text-white">
          {u.name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')}
        </span>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-950">{u.name} <Pill value={u.role} /></h1>
          <p className="text-sm text-zinc-500">{u.email} · joined {fmtDate(u.createdAt)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Current plan', live ? `${live.plan.name} · ${money(live.plan.priceCents)}/mo` : 'None'],
          ['Websites', fmtInt(u.websites.length)],
          ['Requests this month', fmtInt(u.requestsThisMonth)],
        ].map(([k, v]) => (
          <div key={k} className={cn(card, 'p-5')}>
            <p className="text-[13px] font-medium text-zinc-500">{k}</p>
            <p className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">{v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section className={cn(card, 'p-5')}>
            <h2 className="mb-4 text-[15px] font-semibold text-zinc-950">Websites</h2>
            {u.websites.length === 0 ? <p className="text-sm text-zinc-500">No websites.</p> : (
              <ul className="divide-y divide-zinc-100">
                {u.websites.map((w) => (
                  <li key={w.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <Globe className="h-4 w-4 text-zinc-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-zinc-900">{w.name}</p>
                      <a href={w.url} target="_blank" rel="noreferrer" className="truncate text-xs text-zinc-500 hover:underline">{w.url}</a>
                    </div>
                    <Pill value={w.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={cn(card, 'p-5')}>
            <h2 className="mb-4 text-[15px] font-semibold text-zinc-950">Subscription history</h2>
            <ul className="divide-y divide-zinc-100">
              {u.subscriptions.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="font-medium text-zinc-900">{s.plan.name}</span>
                  <Pill value={s.status} />
                  <span className="ml-auto text-xs text-zinc-500">{fmtDate(s.currentPeriodStart)} → {fmtDate(s.currentPeriodEnd)}</span>
                </li>
              ))}
              {u.subscriptions.length === 0 && <li className="text-sm text-zinc-500">No subscriptions.</li>}
            </ul>
          </section>

          <section className={cn(card, 'p-5')}>
            <h2 className="mb-4 text-[15px] font-semibold text-zinc-950">Recent activity</h2>
            <ul className="divide-y divide-zinc-100">
              {u.activityLogs.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <code className="text-[12.5px] text-zinc-800">{a.action}</code>
                  <Pill value={a.status} />
                  <span className="ml-auto text-xs text-zinc-500">{a.ip ?? ''} · {fmtDateTime(a.createdAt)}</span>
                </li>
              ))}
              {u.activityLogs.length === 0 && <li className="text-sm text-zinc-500">No activity.</li>}
            </ul>
          </section>
        </div>

        <UserControls user={{ id: u.id, email: u.email, role: u.role, planCode: live?.plan.code ?? null }} plans={plans} isSelf={me.id === u.id} />
      </div>
    </div>
  );
}
