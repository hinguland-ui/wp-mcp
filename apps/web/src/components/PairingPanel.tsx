'use client';

import { useState, useTransition } from 'react';
import { KeyRound } from 'lucide-react';
import { startPairingAction } from '@/lib/actions';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function PairingPanel({ websiteId }: { websiteId: string }) {
  const [code, setCode] = useState<{ pairingCode: string; apiUrl: string }>();
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Connect the plugin</CardTitle>
        <CardDescription>Install the WPConnect AI plugin, open Settings → WPConnect AI, then paste the details below (code valid 15 minutes, single use).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button disabled={pending} onClick={() => start(async () => {
          const r = await startPairingAction(websiteId);
          if (r.ok) { setCode(r.data); setError(undefined); } else setError(r.error);
        })}>
          <KeyRound className="h-4 w-4" />{pending ? 'Generating…' : 'Generate pairing code'}
        </Button>
        {error && <Alert variant="destructive">{error}</Alert>}
        {code && (
          <div className="space-y-2 rounded-lg border bg-muted/50 p-4 text-sm">
            <div><span className="text-muted-foreground">API URL: </span><code className="font-mono">{code.apiUrl}</code></div>
            <div><span className="text-muted-foreground">Pairing code: </span><code className="break-all font-mono font-semibold">{code.pairingCode}</code></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
