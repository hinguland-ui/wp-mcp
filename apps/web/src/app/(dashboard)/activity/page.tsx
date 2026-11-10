import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Row { id: string; action: string; status: string; createdAt: string; ip?: string | null }

export default async function Activity() {
  const rows = await api<Row[]>('/v1/activity?take=100');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="text-sm text-muted-foreground">Recent account and connection events.</p>
      </div>
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Action</TableHead><TableHead>Status</TableHead><TableHead>IP</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={4} className="text-muted-foreground">No activity yet.</TableCell></TableRow>}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</TableCell>
                <TableCell>{r.action}</TableCell>
                <TableCell><Badge variant={r.status === 'SUCCESS' ? 'success' : r.status === 'DENIED' ? 'warning' : 'destructive'}>{r.status.toLowerCase()}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{r.ip ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
