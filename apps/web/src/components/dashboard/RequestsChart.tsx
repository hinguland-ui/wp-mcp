'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { EmptyChart, Legend } from './ChartCard';
import { fmtCompact, fmtDay, fmtInt } from './format';
import { viz, type Analytics } from './theme';

const SERIES = [
  { key: 'success', label: 'Success', color: viz.good },
  { key: 'denied', label: 'Denied', color: viz.warning },
  { key: 'error', label: 'Error', color: viz.critical },
] as const;

/** Stacked daily bars of MCP requests by outcome. */
export function RequestsChart({ series }: { series: Analytics['series'] }) {
  if (!series.some((d) => d.total > 0)) return <EmptyChart height={300}>No MCP requests in this period yet. Connect an AI app to see traffic here.</EmptyChart>;

  return (
    <div>
      <div className="mb-3"><Legend items={SERIES.map((s) => ({ label: s.label, color: s.color }))} /></div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: -12 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke={viz.grid} strokeDasharray="0" />
            <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fill: viz.axis, fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#c3c2b7' }} minTickGap={28} />
            <YAxis allowDecimals={false} tickFormatter={fmtCompact} tick={{ fill: viz.axis, fontSize: 12 }} tickLine={false} axisLine={false} width={44} />
            <Tooltip
              cursor={{ fill: 'rgba(15,23,42,0.04)' }}
              content={({ active, payload, label }: any) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as Analytics['series'][number];
                return (
                  <ChartTooltip
                    title={fmtDay(String(label))}
                    rows={SERIES.map((s) => ({ label: s.label, value: fmtInt(d[s.key]), color: s.color }))}
                    footer={<span className="flex justify-between"><span>Total</span><span className="font-medium text-zinc-950">{fmtInt(d.total)}</span></span>}
                  />
                );
              }}
            />
            {SERIES.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stackId="r"
                fill={s.color}
                stroke={viz.surface}
                strokeWidth={1}
                maxBarSize={28}
                radius={i === SERIES.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                animationDuration={700}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
