import { notFound } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { deleteWebsiteAction } from '@/lib/actions';
import { PairingPanel } from '@/components/PairingPanel';
import { PermissionsForm } from '@/components/PermissionsForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function WebsiteDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let site: any;
  try {
    site = await api(`/v1/websites/${encodeURIComponent(id)}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  const [perms, scopes, presets] = await Promise.all([
    api<{ scopes: string[] }>(`/v1/websites/${encodeURIComponent(id)}/permissions`),
    api<{ name: string; description?: string }[]>('/v1/scopes'),
    api<{ id: string; name: string; scopes: string[] }[]>('/v1/permission-presets'),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{site.name}</h1>
          <p className="text-sm text-muted-foreground">{site.url}</p>
          {site.connection && (
            <p className="mt-1 text-xs text-muted-foreground">
              Plugin {site.connection.pluginVersion ?? '?'} · WP {site.connection.wpVersion ?? '?'}
              {site.connection.hasElementor && ' · Elementor'}
              {site.connection.hasWooCommerce && ' · WooCommerce'}
            </p>
          )}
        </div>
        <Badge variant={site.status === 'CONNECTED' ? 'success' : 'warning'}>{site.status.toLowerCase()}</Badge>
      </div>

      {site.status !== 'CONNECTED' && <PairingPanel websiteId={site.id} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permissions</CardTitle>
          <CardDescription>AI clients can never exceed these scopes. Changes apply to existing tokens immediately.</CardDescription>
        </CardHeader>
        <CardContent><PermissionsForm websiteId={site.id} scopes={scopes} presets={presets} current={perms.scopes} /></CardContent>
      </Card>

      <form action={deleteWebsiteAction.bind(null, site.id)}>
        <Button variant="outline" className="text-destructive"><Trash2 className="h-4 w-4" />Remove website</Button>
      </form>
    </div>
  );
}
