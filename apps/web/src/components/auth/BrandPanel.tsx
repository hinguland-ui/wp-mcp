import { AuroraBackground } from './AuroraBackground';
import { Logo } from './Logo';
import { TestimonialMarquee } from './TestimonialMarquee';
import { brand, worksWith } from './content';

/** Left half of the auth layout: aurora, headline, quote cards, "works with" row. */
export function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden lg:flex lg:flex-col">
      <AuroraBackground />

      <div className="relative px-10 pt-9 xl:px-12">
        <Logo light />
      </div>

      <div className="relative px-10 pt-14 xl:px-12 animate-fade-up">
        <h2 className="max-w-lg text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.025em] text-white">
          {brand.headline[0]} {brand.headline[1]}
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60">{brand.subhead}</p>
      </div>

      <div className="relative mt-12 animate-fade-up [animation-delay:120ms]">
        <TestimonialMarquee />
      </div>

      <div className="relative mt-auto px-10 pb-9 pt-12 xl:px-12 animate-fade-up [animation-delay:200ms]">
        <p className="text-center text-[13px] text-white/50">{worksWith.title}</p>
        <ul className="mx-auto mt-5 flex max-w-md flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {worksWith.items.map((n) => (
            <li key={n} className="text-[15px] font-semibold tracking-tight text-white/40 transition-colors hover:text-white/70">{n}</li>
          ))}
        </ul>
        <p className="mt-12 text-xs text-white/35">© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
      </div>
    </aside>
  );
}
