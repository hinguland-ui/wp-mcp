import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { AddWebsiteForm } from '@/components/AddWebsiteForm';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const variant = { CONNECTED: 'success', PENDING: 'warning', SUSPENDED: 'destructive' } as const;

export default async function Websites() {
  const sites = await api<{ id: string; name: string; url: string; status: string }[]>('/v1/websites');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Websites</h1>
        <p className="text-sm text-muted-foreground">Sites you can connect to AI assistants.</p>
      </div>
      <AddWebsiteForm />
      <Card className="divide-y">
        {sites.length === 0 && <p className="p-6 text-sm text-muted-foreground">No websites yet.</p>}
        {sites.map((s) => (
          <Link key={s.id} href={`/websites/${s.id}`} className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50">
            <div className="min-w-0">
              <p className="truncate font-medium">{s.name}</p>
              <p className="truncate text-sm text-muted-foreground">{s.url}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={variant[s.status as keyof typeof variant] ?? 'secondary'}>{s.status.toLowerCase()}</Badge>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </Card>
    </div>
  );
}
