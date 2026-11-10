import Link from 'next/link';
import { cn } from '@/lib/utils';

const RANGES = [
  { days: 7, label: '7D' },
  { days: 30, label: '30D' },
  { days: 90, label: '90D' },
];

/** Segmented date-range control; the selection lives in the URL (?days=). */
export function RangeTabs({ days }: { days: number }) {
  return (
    <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1 shadow-[0_1px_2px_rgba(16,24,40,0.04)]" role="tablist" aria-label="Date range">
      {RANGES.map((r) => (
        <Link
          key={r.days}
          href={`?days=${r.days}`}
          scroll={false}
          role="tab"
          aria-selected={days === r.days}
          className={cn(
            'rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
            days === r.days ? 'bg-zinc-950 text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950',
          )}
        >
          {r.label}
        </Link>
      ))}
    </div>
  );
}
