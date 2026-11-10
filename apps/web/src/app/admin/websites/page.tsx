import Link from 'next/link';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/AppShell';
import { EmptyRow, FilterTabs, Pill, SearchBar, Table, Td, fmtDate } from '@/components/admin/ui';
import { fmtInt } from '@/components/dashboard/format';

type Site = { id: string; name: string; url: string; status: string; createdAt: string; requests30d: number; user: { id: string; email: string; name: string } };

const STATUSES = ['CONNECTED', 'VERIFIED', 'PENDING', 'DISCONNECTED', 'SUSPENDED'];

export default async function AdminWebsites({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q, status } = await searchParams;
  const st = status && STATUSES.includes(status) ? status : undefined;
  const sp = new URLSearchParams();
  if (q) sp.set('q', q);
  if (st) sp.set('status', st);
  const sites = await api<Site[]>(`/v1/admin/websites?${sp}`);

  return (
    <div>
      <PageHeader title="Websites" description={`${fmtInt(sites.length)} ${sites.length === 1 ? 'website' : 'websites'} across all users`} action={<SearchBar q={q} placeholder="Search site, URL or owner" hidden={{ status: st }} />} />

      <div className="mb-4">
        <FilterTabs value={st} param="status" base="/admin/websites" keep={{ q }} options={[{ label: 'All' }, ...STATUSES.map((s) => ({ value: s, label: s[0] + s.slice(1).toLowerCase() }))]} />
      </div>

      <Table head={['Website', 'Owner', 'Status', 'Requests (30d)', 'Added']} empty={sites.length === 0 && <EmptyRow>No websites found.</EmptyRow>}>
        {sites.map((s) => (
          <tr key={s.id} className="transition-colors hover:bg-zinc-50/70">
            <Td>
              <span className="block font-medium text-zinc-950">{s.name}</span>
              <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-zinc-500 hover:underline">{s.url}</a>
            </Td>
            <Td><Link href={`/admin/users/${s.user.id}`} className="hover:underline">{s.user.email}</Link></Td>
            <Td><Pill value={s.status} /></Td>
            <Td className="tabular-nums">{fmtInt(s.requests30d)}</Td>
            <Td className="text-zinc-500">{fmtDate(s.createdAt)}</Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
