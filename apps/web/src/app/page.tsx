import type { Metadata } from 'next';
import { sessionToken } from '@/lib/api';
import { homeFor, roleFromToken } from '@/lib/role';
import { Faq } from '@/components/landing/Faq';
import { Features } from '@/components/landing/Features';
import { FinalCta } from '@/components/landing/FinalCta';
import { Footer } from '@/components/landing/Footer';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { LogoStrip } from '@/components/landing/LogoStrip';
import { Navbar } from '@/components/landing/Navbar';
import { Pricing, type PublicPlan } from '@/components/landing/Pricing';
import { Security } from '@/components/landing/Security';
import { Tools } from '@/components/landing/Tools';

export const metadata: Metadata = {
  title: 'WPConnect AI — Safe AI access to your WordPress sites',
  description: 'Connect Claude, ChatGPT and other MCP apps to WordPress with scoped permissions, OAuth consent and a full activity log.',
};

// Used only if the API is unreachable, so the page still renders. Real values come from the database.
const FALLBACK_PLANS: PublicPlan[] = [
  { code: 'free', name: 'Free', priceCents: 0, currency: 'USD', interval: 'MONTHLY', maxWebsites: 1, monthlyRequests: 1000, features: null },
  { code: 'pro', name: 'Pro', priceCents: 1900, currency: 'USD', interval: 'MONTHLY', maxWebsites: 10, monthlyRequests: 50000, features: null },
  { code: 'agency', name: 'Agency', priceCents: 7900, currency: 'USD', interval: 'MONTHLY', maxWebsites: 100, monthlyRequests: 500000, features: null },
];

async function getPlans(): Promise<PublicPlan[]> {
  try {
    const res = await fetch(`${process.env.API_INTERNAL_URL}/v1/public/plans`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(String(res.status));
    const plans = (await res.json()) as PublicPlan[];
    return plans.length ? plans : FALLBACK_PLANS;
  } catch {
    return FALLBACK_PLANS;
  }
}

export default async function Home() {
  const [plans, token] = await Promise.all([getPlans(), sessionToken()]);
  return (
    <div className="min-h-screen bg-white text-zinc-950">
      <Navbar signedIn={!!token} home={homeFor(roleFromToken(token))} />
      <main>
        <Hero />
        <LogoStrip />
        <Features />
        <HowItWorks />
        <Tools />
        <Security />
        <Pricing plans={plans} />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
