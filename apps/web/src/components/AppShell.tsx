import Link from 'next/link';
import { LogOut, Plug } from 'lucide-react';
import { logoutAction } from '@/lib/actions';
import { NavLinks } from '@/components/NavLinks';
import type { NavItem } from '@/components/nav-config';

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('') || '?';

/** Sidebar + sticky header layout shared by the customer app and the admin panel. */
export function AppShell({ me, sections, badge, headerAction, children }: {
  me: { name: string; email: string };
  sections: { title: string; items: NavItem[] }[];
  badge?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  const all = sections.flatMap((s) => s.items);
  return (
    <div className="flex min-h-screen bg-[#f6f7f9]">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-zinc-200/80 bg-[#f6f7f9] px-3 py-4 md:flex">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2.5 px-2.5 text-[15px] font-semibold tracking-tight text-zinc-950">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-950 text-white shadow-sm"><Plug className="h-3.5 w-3.5" /></span>
          WPConnect AI
          {badge && <span className="ml-auto rounded-md bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">{badge}</span>}
        </Link>

        <div className="space-y-6">
          {sections.map((s) => (
            <div key={s.title}>
              <p className="mb-1.5 px-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">{s.title}</p>
              <NavLinks items={s.items} />
            </div>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-2.5 rounded-xl border border-zinc-200/80 bg-white p-2.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xs font-semibold text-white">{initials(me.name)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-zinc-950">{me.name}</p>
            <p className="truncate text-[11px] text-zinc-500">{me.email}</p>
          </div>
          <form action={logoutAction}>
            <button className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900" aria-label="Sign out" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-zinc-200/80 bg-[#f6f7f9]/80 px-4 backdrop-blur md:px-8">
          <NavLinks items={all} horizontal className="md:hidden" />
          <div className="ml-auto flex items-center gap-2">
            {headerAction}
            <form action={logoutAction} className="md:hidden">
              <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500" aria-label="Sign out"><LogOut className="h-4 w-4" /></button>
            </form>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
