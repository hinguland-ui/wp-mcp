'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { AuthorizeQuery } from '@wpconnect/shared';
import { approveConsentAction } from '@/lib/actions';
import { FormError, SubmitButton } from '@/components/auth/fields';

interface Form { websiteId: string; scopes: string[] }

export function ConsentForm({ authorize, websites, requested }: {
  authorize: AuthorizeQuery;
  websites: { id: string; name: string; url: string }[];
  requested: string[];
}) {
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const { register, handleSubmit } = useForm<Form>({ defaultValues: { websiteId: websites[0].id, scopes: requested.filter((s) => s.endsWith(':read')) } });
  const deny = `${authorize.redirect_uri}${authorize.redirect_uri.includes('?') ? '&' : '?'}error=access_denied${authorize.state ? `&state=${encodeURIComponent(authorize.state)}` : ''}`;

  return (
    <form className="space-y-6" onSubmit={handleSubmit((v) => start(async () => {
      setError(undefined);
      const scopes = Array.isArray(v.scopes) ? v.scopes : v.scopes ? [v.scopes] : [];
      if (!scopes.length) return setError('Select at least one permission');
      const r = await approveConsentAction(authorize, v.websiteId, scopes);
      if (r && !r.ok) setError(r.error);
    }))}>
      <div className="space-y-1.5">
        <label htmlFor="site" className="text-[13px] font-medium text-zinc-700">Website</label>
        <div className="group relative">
          <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900" />
          <select
            id="site"
            className="h-11 w-full appearance-none rounded-xl border border-zinc-200 bg-white pl-10 pr-10 text-sm text-zinc-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-all hover:border-zinc-300 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/[0.06]"
            {...register('websiteId')}
          >
            {websites.map((w) => <option key={w.id} value={w.id}>{w.name} — {w.url}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-[13px] font-medium text-zinc-700">Permissions to grant</legend>
        {requested.length === 0 && <p className="text-sm text-zinc-500">This app did not request specific permissions.</p>}
        {requested.map((s) => {
          const write = s.endsWith(':write');
          return (
            <label key={s} className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 p-3.5 text-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50">
              <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                <input type="checkbox" value={s} className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-zinc-300 bg-white transition-colors checked:border-zinc-900 checked:bg-zinc-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10" {...register('scopes')} />
                <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} />
              </span>
              <span className="font-mono text-[13px] font-medium text-zinc-800">{s}</span>
              <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium ${write ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' : 'bg-zinc-100 text-zinc-600'}`}>
                {write ? 'Can make changes' : 'Read only'}
              </span>
            </label>
          );
        })}
      </fieldset>

      <FormError message={error} />

      <div className="grid grid-cols-2 gap-3">
        <a href={deny} className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-700 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors hover:bg-zinc-50">Deny</a>
        <SubmitButton pending={pending} busy="Authorizing…">Authorize</SubmitButton>
      </div>
      <p className="text-center text-xs text-zinc-500">You can revoke access at any time from the website settings.</p>
    </form>
  );
}
