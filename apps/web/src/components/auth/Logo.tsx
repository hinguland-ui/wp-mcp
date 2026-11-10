import Link from 'next/link';
import { Plug } from 'lucide-react';
import { cn } from '@/lib/utils';
import { brand } from './content';

export function Logo({ light, className }: { light?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn('inline-flex items-center gap-2.5 text-[15px] font-semibold tracking-tight', light ? 'text-white' : 'text-zinc-900', className)}>
      <span className={cn('flex h-8 w-8 items-center justify-center rounded-full', light ? 'bg-white text-zinc-950' : 'bg-zinc-950 text-white')}>
        <Plug className="h-4 w-4" />
      </span>
      {brand.name}
    </Link>
  );
}
