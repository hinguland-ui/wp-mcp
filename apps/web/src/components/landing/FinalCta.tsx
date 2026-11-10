import { ArrowRight } from 'lucide-react';
import { AuroraBackground } from '@/components/auth/AuroraBackground';
import { Container } from './primitives';

export function FinalCta() {
  return (
    <section className="px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="relative overflow-hidden rounded-3xl">
        <AuroraBackground />
        <Container className="relative py-24 text-center sm:py-32">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-[-0.025em] text-white sm:text-5xl sm:leading-[1.08]">
            Give your AI a safe way into WordPress.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-[17px] leading-relaxed text-white/60">Connect your first site free in a few minutes. No credit card required.</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="/register" className="group inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-white px-5 text-sm font-medium text-zinc-950 shadow-sm transition-colors hover:bg-zinc-100 sm:w-auto">
              Start free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a href="#pricing" className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/10 sm:w-auto">
              Compare plans
            </a>
          </div>
        </Container>
      </div>
    </section>
  );
}
