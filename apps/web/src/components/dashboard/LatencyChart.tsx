'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { EmptyChart, Legend } from './ChartCard';
import { fmtDay, fmtMs } from './format';
import { viz, type Analytics } from './theme';

/** Average and p95 response time per day (same unit → one axis). */
export function LatencyChart({ series }: { series: Analytics['series'] }) {
  if (!series.some((d) => d.avgMs != null)) return <EmptyChart height={240}>Response times appear once requests come in.</EmptyChart>;

  return (
    <div>
      <div className="mb-3"><Legend items={[{ label: 'Average', color: viz.series1 }, { label: 'p95', color: viz.series2, dashed: true }]} /></div>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 6, right: 6, bottom: 0, left: -6 }}>
            <CartesianGrid vertical={false} stroke={viz.grid} />
            <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fill: viz.axis, fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#c3c2b7' }} minTickGap={28} />
            <YAxis tickFormatter={(v) => fmtMs(v)} tick={{ fill: viz.axis, fontSize: 12 }} tickLine={false} axisLine={false} width={52} />
            <Tooltip
              cursor={{ stroke: '#c3c2b7', strokeWidth: 1 }}
              content={({ active, payload, label }: any) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as Analytics['series'][number];
                return (
                  <ChartTooltip
                    title={fmtDay(String(label))}
                    rows={[
                      { label: 'Average', value: fmtMs(d.avgMs), color: viz.series1 },
                      { label: 'p95', value: fmtMs(d.p95Ms), color: viz.series2, dashed: true },
                    ]}
                  />
                );
              }}
            />
            <Line type="monotone" dataKey="avgMs" stroke={viz.series1} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: viz.surface, strokeWidth: 2 }} connectNulls animationDuration={700} />
            <Line type="monotone" dataKey="p95Ms" stroke={viz.series2} strokeWidth={2} strokeDasharray="5 4" dot={false} activeDot={{ r: 4, stroke: viz.surface, strokeWidth: 2 }} connectNulls animationDuration={700} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
