import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import type { NavItem } from '@/components/nav-config';

export const metadata = { title: 'Super admin · WPConnect AI' };

const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: 'stats', exact: true },
  { href: '/admin/users', label: 'Users', icon: 'users' },
  { href: '/admin/websites', label: 'Websites', icon: 'websites' },
  { href: '/admin/plans', label: 'Plans', icon: 'plans' },
  { href: '/admin/activity', label: 'Activity', icon: 'activity' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let me: { name: string; email: string; role: 'USER' | 'ADMIN' };
  try {
    me = await api('/v1/auth/me');
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect('/login?next=/admin');
    throw e;
  }
  if (me.role !== 'ADMIN') notFound(); // don't reveal the admin area to normal users

  return (
    <AppShell
      me={me}
      badge="Admin"
      sections={[{ title: 'Super admin', items: ADMIN_NAV }]}
      headerAction={
        <Link href="/dashboard" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-[13px] font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to app
        </Link>
      }
    >
      {children}
    </AppShell>
  );
}
