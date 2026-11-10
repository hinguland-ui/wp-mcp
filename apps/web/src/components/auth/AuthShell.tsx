import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AuroraBackground } from './AuroraBackground';
import { BrandPanel } from './BrandPanel';
import { Logo } from './Logo';
import { brand, footerLinks } from './content';

export { Logo };

/** Split layout: animated brand panel on the left, form on the right. */
export function AuthShell({ title, description, children, footer }: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <BrandPanel />

      <section className="flex min-h-screen flex-col px-5 py-8 sm:px-10">
        <Logo className="lg:hidden" />

        <div className="mx-auto my-auto w-full max-w-[400px] py-10 animate-fade-up">
          <div className="mb-8 text-center">
            <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-zinc-950">{title}</h1>
            <p className="mt-1.5 text-sm text-zinc-500">{description}</p>
          </div>
          {children}
          {footer && <p className="mt-8 text-center text-sm text-zinc-500">{footer}</p>}
        </div>

        <nav className="flex items-center justify-center gap-6 text-[13px] text-zinc-500">
          {footerLinks.map((l) => (
            <Link key={l.label} href={l.href} className="transition-colors hover:text-zinc-900">{l.label}</Link>
          ))}
        </nav>
      </section>
    </main>
  );
}

/** Full-screen aurora with a centered card (consent / status pages). */
export function CenteredAuthShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <AuroraBackground />
      <Logo light className="relative mb-8 animate-fade-up" />
      <div className={cn('relative w-full max-w-lg rounded-2xl border border-white/15 bg-white p-7 shadow-2xl shadow-black/40 animate-fade-up [animation-delay:80ms] sm:p-8', className)}>
        {children}
      </div>
      <p className="relative mt-8 text-xs text-white/40">© {new Date().getFullYear()} {brand.name}</p>
    </main>
  );
}
