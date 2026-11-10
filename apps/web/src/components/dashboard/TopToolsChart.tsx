'use client';

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { EmptyChart } from './ChartCard';
import { fmtInt, fmtPct } from './format';
import { viz, type Analytics } from './theme';

/** Horizontal bars: most-used MCP tools (single series). */
export function TopToolsChart({ tools }: { tools: Analytics['topTools'] }) {
  if (!tools.length) return <EmptyChart height={240}>Tool usage shows up here after the first calls.</EmptyChart>;
  const height = Math.max(160, tools.length * 38);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={tools} layout="vertical" margin={{ top: 0, right: 44, bottom: 0, left: 0 }} barCategoryGap="28%">
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tickLine={false}
            axisLine={false}
            tick={{ fill: viz.inkSecondary, fontSize: 12 }}
            tickFormatter={(v: string) => (v.length > 20 ? `${v.slice(0, 19)}…` : v)}
          />
          <Tooltip
            cursor={{ fill: 'rgba(15,23,42,0.04)' }}
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null;
              const t = payload[0].payload as Analytics['topTools'][number];
              return (
                <ChartTooltip
                  title={t.name}
                  rows={[
                    { label: 'Calls', value: fmtInt(t.calls), color: viz.series1 },
                    { label: 'Failed or denied', value: `${fmtInt(t.errors)} (${fmtPct(t.calls ? t.errors / t.calls : 0, 0)})` },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="calls" fill={viz.series1} radius={[0, 4, 4, 0]} maxBarSize={18} animationDuration={700}>
            <LabelList dataKey="calls" position="right" formatter={(v: any) => fmtInt(Number(v))} style={{ fill: viz.inkSecondary, fontSize: 12 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
