// Plain data module (no 'use client'), so Server Components get the real array.
// Exporting this from a 'use client' file would hand Server Components a client
// reference instead of the array, which breaks .flatMap / .map on the server.

export type NavIcon = 'overview' | 'websites' | 'activity' | 'billing' | 'users' | 'plans' | 'admin' | 'stats';
export type NavItem = { href: string; label: string; icon: NavIcon; exact?: boolean };

export const APP_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: 'overview' },
  { href: '/websites', label: 'Websites', icon: 'websites' },
  { href: '/activity', label: 'Activity', icon: 'activity' },
  { href: '/billing', label: 'Billing', icon: 'billing' },
];
