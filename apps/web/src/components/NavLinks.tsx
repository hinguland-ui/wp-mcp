'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, BarChart3, CreditCard, Globe, Layers, LayoutDashboard, Shield, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

import { APP_NAV, type NavIcon, type NavItem } from './nav-config';

const ICONS: Record<NavIcon, React.ElementType> = { overview: LayoutDashboard, websites: Globe, activity: Activity, billing: CreditCard, users: Users, plans: Layers, admin: Shield, stats: BarChart3 };

export function NavLinks({ items = APP_NAV, className, horizontal }: { items?: NavItem[]; className?: string; horizontal?: boolean }) {
  const path = usePathname();
  return (
    <nav className={cn(horizontal ? 'flex gap-1 overflow-x-auto' : 'space-y-0.5', className)}>
      {items.map(({ href, label, icon, exact }) => {
        const Icon = ICONS[icon];
        const active = exact ? path === href : path === href || path.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'group flex items-center gap-2.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors',
              active ? 'bg-white text-zinc-950 shadow-[0_1px_2px_rgba(16,24,40,0.06)] ring-1 ring-zinc-200/80' : 'text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-950',
            )}
          >
            <Icon className={cn('h-4 w-4', active ? 'text-indigo-600' : 'text-zinc-400 group-hover:text-zinc-600')} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
