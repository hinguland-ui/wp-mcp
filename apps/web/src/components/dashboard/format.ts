export const fmtInt = (n: number) => n.toLocaleString('en-US');

export const fmtCompact = (n: number) =>
  n >= 1000 ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n) : String(n);

export const fmtMs = (n: number | null) => (n == null ? '—' : n >= 1000 ? `${(n / 1000).toFixed(2)}s` : `${n}ms`);

export const fmtPct = (n: number | null, digits = 1) => (n == null ? '—' : `${(n * 100).toFixed(digits)}%`);

export const fmtDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

/** Relative change; null when there is no previous value to compare against. */
export function change(cur: number | null, prev: number | null) {
  if (cur == null || prev == null || prev === 0) return null;
  return (cur - prev) / prev;
}

export function timeAgo(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
