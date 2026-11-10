'use client';

import { useState, useTransition } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { deleteUserAction, updateUserAction } from '@/lib/admin-actions';
import { cn } from '@/lib/utils';
import { card } from './ui';

const select = 'h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/[0.06]';
const btn = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 text-sm font-medium transition-colors disabled:opacity-60';

export function UserControls({ user, plans, isSelf }: {
  user: { id: string; email: string; role: 'USER' | 'ADMIN'; planCode: string | null };
  plans: { code: string; name: string; isActive: boolean }[];
  isSelf: boolean;
}) {
  const [plan, setPlan] = useState(user.planCode ?? '');
  const [role, setRole] = useState(user.role);
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();
  const [confirm, setConfirm] = useState('');
  const [pending, start] = useTransition();

  const save = () =>
    start(async () => {
      setMsg(undefined);
      const input: { role?: 'USER' | 'ADMIN'; planCode?: string } = {};
      if (role !== user.role) input.role = role;
      if (plan && plan !== user.planCode) input.planCode = plan;
      if (!Object.keys(input).length) return setMsg({ ok: true, text: 'Nothing to change.' });
      const r = await updateUserAction(user.id, input);
      setMsg(r.ok ? { ok: true, text: 'Saved.' } : { ok: false, text: r.error });
    });

  return (
    <div className="space-y-6">
      <section className={cn(card, 'p-5')}>
        <h2 className="text-[15px] font-semibold text-zinc-950">Plan & role</h2>
        <p className="mt-0.5 text-[13px] text-zinc-500">Changing the plan cancels the current subscription and starts a new one immediately.</p>
        <div className="mt-4 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-[13px] font-medium text-zinc-700">Plan</span>
            <select className={select} value={plan} onChange={(e) => setPlan(e.target.value)}>
              {!user.planCode && <option value="">No plan</option>}
              {plans.map((p) => <option key={p.code} value={p.code}>{p.name}{p.isActive ? '' : ' (inactive)'}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-[13px] font-medium text-zinc-700">Role</span>
            <select className={select} value={role} onChange={(e) => setRole(e.target.value as 'USER' | 'ADMIN')} disabled={isSelf}>
              <option value="USER">User</option>
              <option value="ADMIN">Super admin</option>
            </select>
            {isSelf && <span className="text-xs text-zinc-400">You can’t change your own role.</span>}
          </label>
          <div className="flex items-center gap-3">
            <button onClick={save} disabled={pending} className={cn(btn, 'bg-zinc-950 text-white hover:bg-zinc-800')}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}Save changes
            </button>
            {msg && <span className={cn('text-[13px]', msg.ok ? 'text-emerald-700' : 'text-red-600')}>{msg.text}</span>}
          </div>
        </div>
      </section>

      {!isSelf && (
        <section className="rounded-2xl border border-red-200 bg-red-50/40 p-5">
          <h2 className="text-[15px] font-semibold text-red-800">Delete user</h2>
          <p className="mt-0.5 text-[13px] text-red-700/80">Permanently deletes the account, its websites, tokens and usage. This cannot be undone.</p>
          <label className="mt-4 block space-y-1.5">
            <span className="text-[13px] text-red-800">Type <b>{user.email}</b> to confirm</span>
            <input value={confirm} onChange={(e) => setConfirm(e.target.value)} className={cn(select, 'border-red-200 focus:border-red-500 focus:ring-red-500/10')} />
          </label>
          <button
            disabled={pending || confirm.trim().toLowerCase() !== user.email.toLowerCase()}
            onClick={() => start(async () => { const r = await deleteUserAction(user.id); if (r && !r.ok) setMsg({ ok: false, text: r.error }); })}
            className={cn(btn, 'mt-3 bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed')}
          >
            <Trash2 className="h-4 w-4" />Delete user
          </button>
        </section>
      )}
    </div>
  );
}
