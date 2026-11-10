'use client';

/** Shared tooltip body for all Recharts charts. */
export function ChartTooltip({ title, rows, footer }: {
  title: string;
  rows: { label: string; value: string; color?: string; dashed?: boolean }[];
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-w-[180px] rounded-xl border border-zinc-200 bg-white/95 p-3 text-xs shadow-xl shadow-zinc-900/10 backdrop-blur">
      <p className="mb-2 font-medium text-zinc-950">{title}</p>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-2">
            {r.color && (r.dashed
              ? <span className="h-0 w-3 border-t-2 border-dashed" style={{ borderColor: r.color }} />
              : <span className="h-2 w-2 rounded-[2px]" style={{ background: r.color }} />)}
            <span className="text-zinc-500">{r.label}</span>
            <span className="ml-auto pl-4 font-medium tabular-nums text-zinc-950">{r.value}</span>
          </li>
        ))}
      </ul>
      {footer && <div className="mt-2 border-t border-zinc-100 pt-2 text-zinc-500">{footer}</div>}
    </div>
  );
}
