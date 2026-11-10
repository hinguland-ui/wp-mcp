import Link from 'next/link';
import { cn } from '@/lib/utils';

export const card = 'rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]';

const tone: Record<string, string> = {
  // roles / plans
  ADMIN: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  USER: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  // website status
  CONNECTED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  VERIFIED: 'bg-sky-50 text-sky-700 ring-sky-200',
  PENDING: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  DISCONNECTED: 'bg-red-50 text-red-700 ring-red-200',
  SUSPENDED: 'bg-amber-50 text-amber-800 ring-amber-200',
  // activity / subscription
  SUCCESS: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  DENIED: 'bg-amber-50 text-amber-800 ring-amber-200',
  ERROR: 'bg-red-50 text-red-700 ring-red-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  TRIALING: 'bg-sky-50 text-sky-700 ring-sky-200',
  CANCELED: 'bg-zinc-100 text-zinc-500 ring-zinc-200',
  EXPIRED: 'bg-zinc-100 text-zinc-500 ring-zinc-200',
  PAST_DUE: 'bg-amber-50 text-amber-800 ring-amber-200',
};

export function Pill({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ring-1', tone[value] ?? tone.USER, className)}>
      {value.toLowerCase().replace('_', ' ')}
    </span>
  );
}

export function Table({ head, children, empty }: { head: React.ReactNode[]; children: React.ReactNode; empty?: React.ReactNode }) {
  return (
    <div className={cn(card, 'overflow-hidden')}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50/60">
            <tr>{head.map((h, i) => <th key={i} className="whitespace-nowrap px-4 py-3 text-xs font-medium text-zinc-500">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">{children}</tbody>
        </table>
      </div>
      {empty}
    </div>
  );
}

export const Td = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td className={cn('whitespace-nowrap px-4 py-3 text-zinc-700', className)}>{children}</td>
);

export function EmptyRow({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-12 text-center text-sm text-zinc-500">{children}</div>;
}

export function SearchBar({ q, placeholder, hidden }: { q?: string; placeholder: string; hidden?: Record<string, string | undefined> }) {
  return (
    <form className="relative w-full sm:w-72">
      {Object.entries(hidden ?? {}).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/[0.06]"
      />
    </form>
  );
}

export function FilterTabs({ value, options, param, base, keep }: {
  value?: string;
  options: { value?: string; label: string }[];
  param: string;
  base: string;
  keep?: Record<string, string | undefined>;
}) {
  const href = (v?: string) => {
    const sp = new URLSearchParams();
    Object.entries(keep ?? {}).forEach(([k, val]) => val && sp.set(k, val));
    if (v) sp.set(param, v);
    const s = sp.toString();
    return s ? `${base}?${s}` : base;
  };
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl border border-zinc-200 bg-white p-1">
      {options.map((o) => (
        <Link
          key={o.label}
          href={href(o.value)}
          className={cn('rounded-lg px-2.5 py-1 text-[13px] font-medium transition-colors', (value ?? undefined) === o.value ? 'bg-zinc-950 text-white' : 'text-zinc-600 hover:bg-zinc-100')}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}

export const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
export const fmtDateTime = (d: string | Date) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
export const money = (cents: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
