import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { APP_NAV } from '@/components/nav-config';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let me: { name: string; email: string; role: 'USER' | 'ADMIN' };
  try {
    me = await api('/v1/auth/me');
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect('/login');
    throw e;
  }
  const sections = [{ title: 'Workspace', items: APP_NAV }];
  if (me.role === 'ADMIN') sections.push({ title: 'Platform', items: [{ href: '/admin', label: 'Super admin', icon: 'admin' }] });

  return (
    <AppShell
      me={me}
      sections={sections}
      headerAction={
        <Link href="/websites" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-zinc-950 px-3 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-zinc-800">
          <Plus className="h-3.5 w-3.5" /> Add website
        </Link>
      }
    >
      {children}
    </AppShell>
  );
}
