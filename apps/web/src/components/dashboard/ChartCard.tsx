import { cn } from '@/lib/utils';

export function ChartCard({ title, description, action, children, className }: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-6', className)}>
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-zinc-950">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-zinc-500">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function EmptyChart({ height = 260, children = 'No requests in this period yet.' }: { height?: number; children?: React.ReactNode }) {
  return (
    <div style={{ height }} className="flex items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 text-center text-sm text-zinc-500">
      {children}
    </div>
  );
}

/** Legend row: swatch + label in ink color (never the series color). */
export function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5 text-xs text-zinc-600">
          {i.dashed
            ? <span className="h-0 w-3.5 border-t-2 border-dashed" style={{ borderColor: i.color }} />
            : <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: i.color }} />}
          {i.label}
        </li>
      ))}
    </ul>
  );
}
