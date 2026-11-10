/** Chart tokens (light surface). Status colors are reserved for request outcome only. */
export const viz = {
  surface: '#ffffff',
  grid: '#eceae4',
  axis: '#898781',
  ink: '#0b0b0b',
  inkSecondary: '#52514e',
  series1: '#2a78d6', // blue – single-series & primary line
  series2: '#eb6834', // orange – second line
  good: '#0ca30c', // success
  warning: '#fab219', // denied
  critical: '#d03b3b', // error
  deltaGood: '#006300',
  deltaBad: '#d03b3b',
} as const;

export type Analytics = {
  days: number;
  from: string;
  current: Stats;
  previous: Stats;
  series: { date: string; success: number; denied: number; error: number; total: number; avgMs: number | null; p95Ms: number | null }[];
  topTools: { name: string; calls: number; errors: number }[];
  byWebsite: { id: string; name: string; url: string; status: string; requests: number }[];
  websites: { total: number; connected: number };
};

export type Stats = { requests: number; successRate: number | null; errors: number; denied: number; avgMs: number | null; p95Ms: number | null };
