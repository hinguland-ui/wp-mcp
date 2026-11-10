import { FileText, Image as ImageIcon, Info, LayoutTemplate, ShoppingBag } from 'lucide-react';
import { Container, SectionHeading } from './primitives';

const groups = [
  { icon: FileText, title: 'Posts & pages', tools: ['list_posts', 'get_post', 'create_post', 'update_post'], text: 'Draft articles, fix typos, update SEO copy and publish on your schedule.' },
  { icon: LayoutTemplate, title: 'Elementor', tools: ['get_elementor_page', 'update_elementor_page'], text: 'Read and adjust Elementor layouts without opening the editor.' },
  { icon: ShoppingBag, title: 'WooCommerce', tools: ['list_products', 'update_product'], text: 'Review your catalog and update product details and pricing.' },
  { icon: ImageIcon, title: 'Media', tools: ['list_media'], text: 'Find the right images and files across your media library.' },
  { icon: Info, title: 'Site info', tools: ['get_site_info'], text: 'Give the AI context about your site before it starts working.' },
];

export function Tools() {
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              eyebrow="What AI can do"
              title="Real tools for real WordPress work"
              description="Each tool maps to a permission you control. If a scope is off, the AI simply can't use that tool — and the attempt is logged."
            />
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {groups.map(({ icon: Icon, title, tools, text }) => (
              <li key={title} className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 text-zinc-500" />
                  <h3 className="text-[15px] font-semibold text-zinc-950">{title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{text}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tools.map((t) => <code key={t} className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11.5px] text-zinc-700">{t}</code>)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
