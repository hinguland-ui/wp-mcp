import { testimonials, type Testimonial } from './content';

function QuoteCard({ quote, name, role, initials }: Testimonial) {
  return (
    <figure className="flex w-[300px] shrink-0 flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
      <blockquote className="text-[14px] leading-relaxed text-white/85">“{quote}”</blockquote>
      <figcaption className="mt-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-white">{name}</p>
          <p className="text-xs text-white/45">{role}</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400/80 to-fuchsia-400/80 text-[11px] font-semibold text-white ring-2 ring-white/15">
          {initials}
        </span>
      </figcaption>
    </figure>
  );
}

/** Infinite, edge-faded scroller of quote cards. Pauses on hover. */
export function TestimonialMarquee() {
  return (
    <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="motion-safe-only flex w-max gap-4 animate-marquee group-hover:[animation-play-state:paused]">
        {[...testimonials, ...testimonials].map((t, i) => <QuoteCard key={i} {...t} />)}
      </div>
    </div>
  );
}
