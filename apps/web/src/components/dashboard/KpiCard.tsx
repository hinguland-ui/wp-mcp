'use client';

import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { viz } from './theme';

/**
 * Stat tile: label, hero value, delta vs previous period, and a small trend line.
 * `higherIsBetter` decides whether an increase is shown as good or bad.
 */
export function KpiCard({ label, value, delta, higherIsBetter = true, spark, hint }: {
  label: string;
  value: string;
  delta: number | null;
  higherIsBetter?: boolean;
  spark?: number[];
  hint?: string;
}) {
  const up = delta != null && delta > 0;
  const flat = delta == null || Math.abs(delta) < 0.0005;
  const good = flat ? null : up === higherIsBetter;
  const id = `spark-${label.replace(/\W/g, '')}`;
  const data = (spark ?? []).map((v, i) => ({ i, v }));
  const hasSpark = data.some((d) => d.v > 0);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-shadow hover:shadow-[0_4px_16px_rgba(16,24,40,0.06)]">
      <p className="text-[13px] font-medium text-zinc-500">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-[1.75rem] font-semibold leading-none tracking-tight text-zinc-950">{value}</p>
        {!flat && (
          <span
            className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium"
            style={{ color: good ? viz.deltaGood : viz.deltaBad, background: good ? '#0ca30c14' : '#d03b3b12' }}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta! * 100).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="mt-1.5 text-xs text-zinc-400">{hint ?? (flat ? 'No change vs previous period' : 'vs previous period')}</p>

      <div className="mt-4 h-12">
        {hasSpark ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={viz.series1} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={viz.series1} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={viz.series1} strokeWidth={2} fill={`url(#${id})`} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-end"><div className="h-px w-full bg-zinc-200" /></div>
        )}
      </div>
    </div>
  );
}
