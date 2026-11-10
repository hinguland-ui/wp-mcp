import { Container, SectionHeading } from './primitives';

const steps = [
  { n: '01', title: 'Add your site', text: 'Create a free account and add your WordPress site URL in the dashboard.' },
  { n: '02', title: 'Install the plugin & pair', text: 'Install the WPConnect plugin, paste the one-time pairing code, and choose what AI may access.' },
  { n: '03', title: 'Connect your AI app', text: 'Add the MCP server URL to Claude, ChatGPT or any MCP client and approve the consent screen.' },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-y border-zinc-100 bg-zinc-50/60 py-24 sm:py-32">
      <Container>
        <SectionHeading center eyebrow="How it works" title="Up and running in three steps" description="No code, no server setup. Most sites are connected in under five minutes." />

        <ol className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-6">
          <div aria-hidden className="absolute left-0 right-0 top-5 hidden h-px bg-[linear-gradient(to_right,transparent,#d4d4d8_15%,#d4d4d8_85%,transparent)] md:block" />
          {steps.map((s) => (
            <li key={s.n} className="relative text-center">
              <span className="relative mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white font-mono text-[13px] font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-200">{s.n}</span>
              <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-zinc-950">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-zinc-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
