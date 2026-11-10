import { ArrowRight } from 'lucide-react';
import { Container, PrimaryLink, SecondaryLink } from './primitives';
import { ProductPreview } from './ProductPreview';

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-16 sm:pt-24">
      {/* Background: faint grid fading out + soft top light */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,black_30%,transparent_75%)]" />
        <div className="absolute left-1/2 top-0 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.12),transparent)]" />
      </div>

      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <a href="#how-it-works" className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 py-1 pl-1 pr-3 text-[13px] text-zinc-600 shadow-[0_1px_2px_rgba(16,24,40,0.04)] backdrop-blur transition-colors hover:border-zinc-300 animate-fade-up">
            <span className="rounded-full bg-zinc-950 px-2 py-0.5 text-[11px] font-medium text-white">New</span>
            MCP server for WordPress
            <ArrowRight className="h-3.5 w-3.5" />
          </a>

          <h1 className="mt-7 text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.035em] text-zinc-950 sm:text-6xl lg:text-[4.25rem] animate-fade-up [animation-delay:60ms]">
            Let AI work on your WordPress site.
            <span className="block text-zinc-400">On your terms.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-zinc-600 sm:text-lg animate-fade-up [animation-delay:120ms]">
            WPConnect AI gives Claude, ChatGPT and other AI apps safe, permissioned access to your posts, pages, media and products — with every action logged.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-up [animation-delay:180ms]">
            <PrimaryLink href="/register" className="w-full sm:w-auto">
              Start free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </PrimaryLink>
            <SecondaryLink href="#how-it-works" className="w-full sm:w-auto">See how it works</SecondaryLink>
          </div>
          <p className="mt-4 text-[13px] text-zinc-500 animate-fade-up [animation-delay:220ms]">Free plan · 1 website · No credit card</p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl animate-fade-up [animation-delay:280ms] sm:mt-20">
          <ProductPreview />
        </div>
      </Container>
    </section>
  );
}
