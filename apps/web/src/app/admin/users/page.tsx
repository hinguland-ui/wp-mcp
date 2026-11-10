import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/AppShell';
import { EmptyRow, Pill, SearchBar, Table, Td, fmtDate } from '@/components/admin/ui';
import { fmtInt } from '@/components/dashboard/format';

type Res = {
  total: number;
  page: number;
  pageSize: number;
  users: { id: string; email: string; name: string; role: string; createdAt: string; websites: number; plan: { code: string; name: string } | null; requestsThisMonth: number }[];
};

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q, page } = await searchParams;
  const sp = new URLSearchParams();
  if (q) sp.set('q', q);
  if (page) sp.set('page', page);
  const r = await api<Res>(`/v1/admin/users?${sp}`);
  const pages = Math.max(1, Math.ceil(r.total / r.pageSize));
  const link = (p: number) => `/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;

  return (
    <div>
      <PageHeader title="Users" description={`${fmtInt(r.total)} ${r.total === 1 ? 'account' : 'accounts'}${q ? ` matching “${q}”` : ''}`} action={<SearchBar q={q} placeholder="Search name or email" />} />

      <Table
        head={['User', 'Plan', 'Role', 'Websites', 'Requests (month)', 'Joined']}
        empty={r.users.length === 0 && <EmptyRow>No users found.</EmptyRow>}
      >
        {r.users.map((u) => (
          <tr key={u.id} className="transition-colors hover:bg-zinc-50/70">
            <Td>
              <Link href={`/admin/users/${u.id}`} className="group block">
                <span className="block font-medium text-zinc-950 group-hover:underline">{u.name}</span>
                <span className="text-xs text-zinc-500">{u.email}</span>
              </Link>
            </Td>
            <Td>{u.plan ? <span className="font-medium text-zinc-800">{u.plan.name}</span> : <span className="text-zinc-400">None</span>}</Td>
            <Td><Pill value={u.role} /></Td>
            <Td className="tabular-nums">{u.websites}</Td>
            <Td className="tabular-nums">{fmtInt(u.requestsThisMonth)}</Td>
            <Td className="text-zinc-500">{fmtDate(u.createdAt)}</Td>
          </tr>
        ))}
      </Table>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
          <span>Page {r.page} of {pages}</span>
          <div className="flex gap-2">
            {r.page > 1 && <Link href={link(r.page - 1)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 font-medium text-zinc-700 hover:bg-zinc-50"><ChevronLeft className="h-4 w-4" />Previous</Link>}
            {r.page < pages && <Link href={link(r.page + 1)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 font-medium text-zinc-700 hover:bg-zinc-50">Next<ChevronRight className="h-4 w-4" /></Link>}
          </div>
        </div>
      )}
    </div>
  );
}
