import Link from 'next/link';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/AppShell';
import { EmptyRow, FilterTabs, Pill, Table, Td, fmtDateTime } from '@/components/admin/ui';

type Row = { id: string; action: string; status: string; ip: string | null; createdAt: string; user: { id: string; email: string } | null; website: { id: string; name: string } | null };

export default async function AdminActivity({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const st = ['SUCCESS', 'DENIED', 'ERROR'].includes(status ?? '') ? status : undefined;
  const rows = await api<Row[]>(`/v1/admin/activity?take=200${st ? `&status=${st}` : ''}`);

  return (
    <div>
      <PageHeader title="Activity" description="The latest 200 events across the platform." />
      <div className="mb-4">
        <FilterTabs value={st} param="status" base="/admin/activity" options={[{ label: 'All' }, { value: 'SUCCESS', label: 'Success' }, { value: 'DENIED', label: 'Denied' }, { value: 'ERROR', label: 'Error' }]} />
      </div>
      <Table head={['When', 'Action', 'Status', 'User', 'Website', 'IP']} empty={rows.length === 0 && <EmptyRow>No activity.</EmptyRow>}>
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-zinc-50/70">
            <Td className="text-zinc-500">{fmtDateTime(r.createdAt)}</Td>
            <Td><code className="text-[12.5px] text-zinc-900">{r.action}</code></Td>
            <Td><Pill value={r.status} /></Td>
            <Td>{r.user ? <Link href={`/admin/users/${r.user.id}`} className="hover:underline">{r.user.email}</Link> : <span className="text-zinc-400">—</span>}</Td>
            <Td>{r.website?.name ?? <span className="text-zinc-400">—</span>}</Td>
            <Td className="text-zinc-500">{r.ip ?? '—'}</Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
