import { authorizeQuerySchema } from '@wpconnect/shared';
import Link from 'next/link';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { ConsentForm } from '@/components/ConsentForm';
import { CenteredAuthShell } from '@/components/auth/AuthShell';

export default async function Consent({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const parsed = authorizeQuerySchema.safeParse(await searchParams);
  if (!parsed.success) return <Status title="Invalid request">This authorization link is missing information. Please start again from your AI app.</Status>;

  try {
    const data = await api<{
      client: { name: string };
      requestedScopes: string[];
      websites: { id: string; name: string; url: string }[];
    }>('/v1/oauth/consent/preview', { method: 'POST', body: JSON.stringify(parsed.data) });

    if (!data.websites.length) {
      return (
        <Status title="No connected sites" action={<Link href="/websites" className="text-sm font-medium text-zinc-900 underline-offset-4 hover:underline">Connect a website →</Link>}>
          Connect a WordPress site first, then retry from your AI app.
        </Status>
      );
    }
    return (
      <CenteredAuthShell>
        <div className="mb-6 flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-sm"><ShieldCheck className="h-5 w-5" /></span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Authorize {data.client.name}</h1>
            <p className="mt-0.5 text-sm text-zinc-500">This app is asking for access to one of your WordPress sites.</p>
          </div>
        </div>
        <ConsentForm authorize={parsed.data} websites={data.websites} requested={data.requestedScopes} />
      </CenteredAuthShell>
    );
  } catch (e) {
    return (
      <Status title={e instanceof ApiError ? 'Request not valid' : 'Something went wrong'}>
        {e instanceof ApiError ? 'This authorization request is not valid or has expired.' : 'We could not load this request. Please try again in a moment.'}
      </Status>
    );
  }
}

function Status({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <CenteredAuthShell className="max-w-md text-center">
      <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200"><AlertTriangle className="h-5 w-5" /></span>
      <h1 className="text-lg font-semibold tracking-tight text-zinc-900">{title}</h1>
      <p className="mt-1.5 text-sm text-zinc-500">{children}</p>
      {action && <div className="mt-5">{action}</div>}
    </CenteredAuthShell>
  );
}
