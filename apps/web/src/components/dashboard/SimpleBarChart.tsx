'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { EmptyChart } from './ChartCard';
import { fmtCompact, fmtDay, fmtInt } from './format';
import { viz } from './theme';

/** Single-series daily bar chart (e.g. signups per day). */
export function SimpleBarChart({ data, label, height = 240, empty }: {
  data: { date: string; count: number }[];
  label: string;
  height?: number;
  empty?: string;
}) {
  if (!data.some((d) => d.count > 0)) return <EmptyChart height={height}>{empty ?? 'No data in this period yet.'}</EmptyChart>;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke={viz.grid} />
          <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fill: viz.axis, fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#c3c2b7' }} minTickGap={28} />
          <YAxis allowDecimals={false} tickFormatter={fmtCompact} tick={{ fill: viz.axis, fontSize: 12 }} tickLine={false} axisLine={false} width={44} />
          <Tooltip
            cursor={{ fill: 'rgba(15,23,42,0.04)' }}
            content={({ active, payload, label: l }: any) =>
              active && payload?.length ? <ChartTooltip title={fmtDay(String(l))} rows={[{ label, value: fmtInt(payload[0].value), color: viz.series1 }]} /> : null
            }
          />
          <Bar dataKey="count" name={label} fill={viz.series1} radius={[4, 4, 0, 0]} maxBarSize={28} animationDuration={700} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
