import Link from 'next/link';
import { Plug } from 'lucide-react';
import { Container } from './primitives';

const cols = [
  { title: 'Product', links: [['Features', '#features'], ['How it works', '#how-it-works'], ['Security', '#security'], ['Pricing', '#pricing']] },
  { title: 'Account', links: [['Sign in', '/login'], ['Create account', '/register'], ['Dashboard', '/dashboard']] },
  { title: 'Resources', links: [['FAQ', '#faq']] },
];

export function Footer() {
  return (
    <footer className="py-14">
      <Container>
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-zinc-950">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-950 text-white"><Plug className="h-3.5 w-3.5" /></span>
              WPConnect AI
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500">Safe, permissioned AI access to your WordPress sites.</p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-[13px] font-semibold text-zinc-950">{c.title}</p>
              <ul className="mt-3 space-y-2">
                {c.links.map(([label, href]) => (
                  <li key={label}><a href={href} className="text-sm text-zinc-500 transition-colors hover:text-zinc-950">{label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-zinc-100 pt-6 text-[13px] text-zinc-400 sm:flex-row">
          <p>© {new Date().getFullYear()} WPConnect AI. All rights reserved.</p>
          <p>WordPress is a trademark of the WordPress Foundation.</p>
        </div>
      </Container>
    </footer>
  );
}
