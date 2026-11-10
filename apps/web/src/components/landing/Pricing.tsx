import Link from 'next/link';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container, SectionHeading } from './primitives';

export type PublicPlan = {
  code: string;
  name: string;
  priceCents: number;
  currency: string;
  interval: string;
  maxWebsites: number;
  monthlyRequests: number;
  features: unknown;
};

const blurbs: Record<string, string> = {
  free: 'For trying it out on a single site.',
  pro: 'For creators and businesses running a few sites.',
  agency: 'For agencies managing many client sites.',
};

const common = ['Scoped permissions per site', 'OAuth 2.1 consent & revocation', 'Full activity log', 'Usage analytics'];

const fmtNum = (n: number) => new Intl.NumberFormat('en-US', { notation: n >= 10000 ? 'compact' : 'standard' }).format(n);

function featuresOf(p: PublicPlan) {
  const custom = Array.isArray(p.features) ? (p.features as unknown[]).filter((f): f is string => typeof f === 'string') : [];
  return [
    `${fmtNum(p.maxWebsites)} ${p.maxWebsites === 1 ? 'website' : 'websites'}`,
    `${fmtNum(p.monthlyRequests)} AI requests / month`,
    ...common,
    ...custom,
  ];
}

export function Pricing({ plans }: { plans: PublicPlan[] }) {
  // Highlight the middle paid plan (or the first paid one).
  const paid = plans.filter((p) => p.priceCents > 0);
  const featured = paid[Math.floor((paid.length - 1) / 2)]?.code;

  return (
    <section id="pricing" className="scroll-mt-20 py-24 sm:py-32">
      <Container>
        <SectionHeading center eyebrow="Pricing" title="Simple pricing that grows with you" description="Start free with one website. Upgrade when you need more sites or more requests." />

        <div className={cn('mx-auto mt-16 grid max-w-5xl gap-5', plans.length >= 3 ? 'lg:grid-cols-3' : 'md:grid-cols-2')}>
          {plans.map((p) => {
            const hot = p.code === featured;
            const price = p.priceCents / 100;
            return (
              <div
                key={p.code}
                className={cn(
                  'relative flex flex-col rounded-2xl p-7',
                  hot ? 'bg-zinc-950 text-white shadow-[0_30px_60px_-20px_rgba(15,23,42,0.45)] ring-1 ring-zinc-950 lg:-my-3 lg:py-10' : 'border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]',
                )}
              >
                {hot && <span className="absolute -top-3 left-7 rounded-full bg-indigo-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">Most popular</span>}
                <h3 className={cn('text-[15px] font-semibold', hot ? 'text-white' : 'text-zinc-950')}>{p.name}</h3>
                <p className={cn('mt-1 text-sm', hot ? 'text-zinc-400' : 'text-zinc-500')}>{blurbs[p.code] ?? `Up to ${fmtNum(p.maxWebsites)} websites.`}</p>

                <p className="mt-6 flex items-baseline gap-1">
                  <span className="text-[2.75rem] font-semibold leading-none tracking-tight">
                    {price === 0 ? 'Free' : new Intl.NumberFormat('en-US', { style: 'currency', currency: p.currency, maximumFractionDigits: price % 1 ? 2 : 0 }).format(price)}
                  </span>
                  {price > 0 && <span className={cn('text-sm', hot ? 'text-zinc-400' : 'text-zinc-500')}>/ {p.interval === 'YEARLY' ? 'year' : 'month'}</span>}
                </p>

                <Link
                  href="/register"
                  className={cn(
                    'mt-7 inline-flex h-11 items-center justify-center rounded-xl text-sm font-medium transition-colors',
                    hot ? 'bg-white text-zinc-950 hover:bg-zinc-100' : price === 0 ? 'bg-zinc-950 text-white hover:bg-zinc-800' : 'border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50',
                  )}
                >
                  {price === 0 ? 'Start free' : `Get ${p.name}`}
                </Link>

                <ul className="mt-8 space-y-3 text-sm">
                  {featuresOf(p).map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <Check className={cn('mt-0.5 h-4 w-4 shrink-0', hot ? 'text-indigo-300' : 'text-zinc-900')} />
                      <span className={hot ? 'text-zinc-300' : 'text-zinc-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-[13px] text-zinc-500">Every account starts on the Free plan. Prices in {plans[0]?.currency ?? 'USD'}, billed monthly.</p>
      </Container>
    </section>
  );
}
