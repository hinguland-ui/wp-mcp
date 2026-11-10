'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, Plug, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#security', label: 'Security' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

export function Navbar({ signedIn, home = "/dashboard" }: { signedIn: boolean; home?: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <header className={cn('sticky top-0 z-50 transition-all duration-300', scrolled || open ? 'border-b border-zinc-200/70 bg-white/80 backdrop-blur-xl' : 'border-b border-transparent')}>
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-8 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-zinc-950">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-950 text-white"><Plug className="h-3.5 w-3.5" /></span>
          WPConnect AI
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-[13.5px] font-medium text-zinc-600 transition-colors hover:text-zinc-950">{l.label}</a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {signedIn ? (
            <Link href={home} className="inline-flex h-9 items-center rounded-lg bg-zinc-950 px-3.5 text-[13.5px] font-medium text-white transition-colors hover:bg-zinc-800">{home === "/admin" ? "Open admin" : "Open dashboard"}</Link>
          ) : (
            <>
              <Link href="/login" className="inline-flex h-9 items-center rounded-lg px-3 text-[13.5px] font-medium text-zinc-700 transition-colors hover:text-zinc-950">Sign in</Link>
              <Link href="/register" className="inline-flex h-9 items-center rounded-lg bg-zinc-950 px-3.5 text-[13.5px] font-medium text-white shadow-sm transition-colors hover:bg-zinc-800">Start free</Link>
            </>
          )}
        </div>

        <button onClick={() => setOpen((o) => !o)} className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-zinc-700 md:hidden" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-zinc-100 bg-white px-5 pb-5 pt-2 md:hidden">
          <nav className="flex flex-col">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-2 py-2.5 text-[15px] font-medium text-zinc-700">{l.label}</a>
            ))}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {signedIn ? (
              <Link href={home} className="col-span-2 inline-flex h-10 items-center justify-center rounded-lg bg-zinc-950 text-sm font-medium text-white">{home === "/admin" ? "Open admin" : "Open dashboard"}</Link>
            ) : (
              <>
                <Link href="/login" className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 text-sm font-medium text-zinc-800">Sign in</Link>
                <Link href="/register" className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-950 text-sm font-medium text-white">Start free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
