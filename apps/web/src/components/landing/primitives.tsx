import { cn } from '@/lib/utils';

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-5 sm:px-8', className)}>{children}</div>;
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-[13px] font-semibold uppercase tracking-[0.12em] text-indigo-600', className)}>{children}</p>;
}

export function SectionHeading({ eyebrow, title, description, center, dark }: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  center?: boolean;
  dark?: boolean;
}) {
  return (
    <div className={cn('max-w-2xl', center && 'mx-auto text-center')}>
      {eyebrow && <Eyebrow className={dark ? 'text-indigo-300' : undefined}>{eyebrow}</Eyebrow>}
      <h2 className={cn('mt-3 text-3xl font-semibold tracking-[-0.025em] sm:text-[2.6rem] sm:leading-[1.1]', dark ? 'text-white' : 'text-zinc-950')}>{title}</h2>
      {description && <p className={cn('mt-4 text-[17px] leading-relaxed', dark ? 'text-zinc-400' : 'text-zinc-600')}>{description}</p>}
    </div>
  );
}

export function PrimaryLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={href}
      className={cn(
        'group inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-5 text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all hover:bg-zinc-800 active:scale-[0.99]',
        className,
      )}
    >
      {children}
    </a>
  );
}

export function SecondaryLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={href}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-800 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors hover:bg-zinc-50',
        className,
      )}
    >
      {children}
    </a>
  );
}
