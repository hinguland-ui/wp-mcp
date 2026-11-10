import { Plus } from 'lucide-react';
import { Container, SectionHeading } from './primitives';

const faqs = [
  { q: 'What is MCP?', a: 'The Model Context Protocol is an open standard that lets AI apps such as Claude and ChatGPT use external tools. WPConnect AI is an MCP server that exposes your WordPress site as a set of safe, permissioned tools.' },
  { q: 'Can the AI change my site without my permission?', a: 'No. Each tool is tied to a permission scope you turn on per website, and an AI app only gets access after you approve it on the consent screen. Anything outside those scopes is denied and logged.' },
  { q: 'Do I need to share my WordPress password?', a: 'Never. You pair the site with a one-time code generated in the dashboard. Your WordPress login stays on your site.' },
  { q: 'Which AI apps does it work with?', a: 'Any app that supports MCP — including Claude, ChatGPT, Cursor, VS Code and Windsurf. Add the server URL and approve access.' },
  { q: 'Does it work with Elementor and WooCommerce?', a: 'Yes. There are tools to read and update Elementor pages and to list and update WooCommerce products, each behind its own permission.' },
  { q: 'What happens when I hit my monthly limit?', a: 'Further AI requests are declined until the next month starts or you move to a larger plan. Your site keeps working normally.' },
  { q: 'Can I remove a site any time?', a: 'Yes. Remove a site from the dashboard whenever you like — its connection and AI access go with it.' },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-zinc-100 bg-zinc-50/60 py-24 sm:py-32">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <SectionHeading eyebrow="FAQ" title="Questions, answered" description="Can’t find what you’re looking for? Reach out and we’ll help." />
          <div className="divide-y divide-zinc-200 border-y border-zinc-200">
            {faqs.map((f) => (
              <details key={f.q} className="group py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left text-[15px] font-medium text-zinc-950">
                  {f.q}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ring-zinc-200 transition-transform duration-300 group-open:rotate-45">
                    <Plus className="h-3.5 w-3.5 text-zinc-500" />
                  </span>
                </summary>
                <p className="mt-3 pr-12 text-[15px] leading-relaxed text-zinc-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
