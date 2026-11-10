'use client';

import { useState, useTransition } from 'react';
import { Loader2, Pencil, Plus, X } from 'lucide-react';
import { savePlanAction, type PlanForm } from '@/lib/admin-actions';
import { cn } from '@/lib/utils';
import { card, money } from './ui';

export type AdminPlan = PlanForm & { id: string; code: string; subscribers: number };

const input = 'h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none transition-all focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/[0.06] disabled:bg-zinc-50 disabled:text-zinc-500';

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      <span className="text-[13px] font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}

/** Create (plan = null) or edit a plan. */
function PlanFormView({ plan, onDone }: { plan: AdminPlan | null; onDone: () => void }) {
  const [f, setF] = useState({
    code: plan?.code ?? '',
    name: plan?.name ?? '',
    price: plan ? String(plan.priceCents / 100) : '0',
    currency: plan?.currency ?? 'USD',
    interval: plan?.interval ?? 'MONTHLY',
    maxWebsites: String(plan?.maxWebsites ?? 1),
    monthlyRequests: String(plan?.monthlyRequests ?? 1000),
    features: Array.isArray(plan?.features) ? plan!.features!.join('\n') : '',
    isActive: plan?.isActive ?? true,
  });
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const submit = () =>
    start(async () => {
      setError(undefined);
      const features = f.features.split('\n').map((s) => s.trim()).filter(Boolean);
      const body: PlanForm = {
        ...(plan ? {} : { code: f.code.trim().toLowerCase() }),
        name: f.name.trim(),
        priceCents: Math.round(Number(f.price) * 100),
        currency: f.currency.trim().toUpperCase(),
        interval: f.interval as 'MONTHLY' | 'YEARLY',
        maxWebsites: Number(f.maxWebsites),
        monthlyRequests: Number(f.monthlyRequests),
        features: features.length ? features : null,
        isActive: f.isActive,
      };
      if ([body.priceCents, body.maxWebsites, body.monthlyRequests].some((n) => !Number.isFinite(n) || n < 0)) return setError('Price and limits must be zero or more.');
      const r = await savePlanAction(plan?.id ?? null, body);
      if (r.ok) onDone();
      else setError(r.error);
    });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Code (used in URLs, can’t change)"><input className={input} value={f.code} onChange={set('code')} disabled={!!plan} placeholder="e.g. starter" /></Field>
        <Field label="Display name"><input className={input} value={f.name} onChange={set('name')} placeholder="Starter" /></Field>
        <Field label="Price"><input className={input} type="number" min={0} step="0.01" value={f.price} onChange={set('price')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Currency"><input className={input} value={f.currency} maxLength={3} onChange={set('currency')} /></Field>
          <Field label="Billed">
            <select className={input} value={f.interval} onChange={set('interval')}><option value="MONTHLY">Monthly</option><option value="YEARLY">Yearly</option></select>
          </Field>
        </div>
        <Field label="Max websites"><input className={input} type="number" min={0} value={f.maxWebsites} onChange={set('maxWebsites')} /></Field>
        <Field label="AI requests / month"><input className={input} type="number" min={0} value={f.monthlyRequests} onChange={set('monthlyRequests')} /></Field>
      </div>
      <Field label="Extra features shown on pricing (one per line)">
        <textarea className={cn(input, 'h-24 py-2')} value={f.features} onChange={set('features')} placeholder={'Priority support\nWhite-label reports'} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input type="checkbox" checked={f.isActive} onChange={set('isActive')} className="h-4 w-4 accent-zinc-950" />
        Active — visible on the pricing page and selectable
      </label>
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={pending} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-950 px-3.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}{plan ? 'Save plan' : 'Create plan'}
        </button>
        <button onClick={onDone} className="inline-flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button>
      </div>
    </div>
  );
}

export function PlanCard({ plan }: { plan: AdminPlan }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className={cn(card, 'p-5', !plan.isActive && 'opacity-70')}>
      {editing ? (
        <PlanFormView plan={plan} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-[17px] font-semibold text-zinc-950">
                {plan.name}
                {!plan.isActive && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">Inactive</span>}
              </h3>
              <code className="text-xs text-zinc-400">{plan.code}</code>
            </div>
            <button onClick={() => setEditing(true)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50">
              <Pencil className="h-3.5 w-3.5" />Edit
            </button>
          </div>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
            {plan.priceCents === 0 ? 'Free' : money(plan.priceCents, plan.currency)}
            {plan.priceCents > 0 && <span className="text-sm font-normal text-zinc-500"> / {plan.interval === 'YEARLY' ? 'year' : 'month'}</span>}
          </p>
          <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-zinc-100 pt-4 text-sm">
            <div><dt className="text-xs text-zinc-500">Websites</dt><dd className="font-medium text-zinc-900">{plan.maxWebsites.toLocaleString()}</dd></div>
            <div><dt className="text-xs text-zinc-500">Requests/mo</dt><dd className="font-medium text-zinc-900">{plan.monthlyRequests.toLocaleString()}</dd></div>
            <div><dt className="text-xs text-zinc-500">Subscribers</dt><dd className="font-medium text-zinc-900">{plan.subscribers.toLocaleString()}</dd></div>
          </dl>
          {Array.isArray(plan.features) && plan.features.length > 0 && (
            <ul className="mt-4 space-y-1 text-[13px] text-zinc-600">{plan.features.map((x) => <li key={x}>• {x}</li>)}</ul>
          )}
        </div>
      )}
    </div>
  );
}

export function NewPlan() {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-950 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-800">
        <Plus className="h-4 w-4" />New plan
      </button>
    );
  }
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/40 p-4 pt-[10vh] backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className={cn(card, 'w-full max-w-xl p-6 shadow-2xl')} onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-950">New plan</h2>
          <button onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <PlanFormView plan={null} onDone={() => setOpen(false)} />
      </div>
    </div>
  );
}
