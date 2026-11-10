'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api, ApiError } from './api';

export type AdminResult = { ok: true } | { ok: false; error: string };

const fail = (e: unknown): AdminResult => {
  console.error('[admin action failed]', e instanceof ApiError ? { status: e.status, body: e.body } : e);
  if (e instanceof ApiError) {
    const b = e.body;
    const issues = b?.issues?.fieldErrors ? Object.entries(b.issues.fieldErrors).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join('; ') : '';
    return { ok: false, error: issues || String(b?.message ?? 'Request failed') };
  }
  return { ok: false, error: 'Something went wrong' };
};

export async function updateUserAction(id: string, input: { role?: 'USER' | 'ADMIN'; planCode?: string }): Promise<AdminResult> {
  try {
    await api(`/v1/admin/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) });
  } catch (e) {
    return fail(e);
  }
  revalidatePath('/admin', 'layout');
  return { ok: true };
}

export async function deleteUserAction(id: string): Promise<AdminResult> {
  try {
    await api(`/v1/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch (e) {
    return fail(e);
  }
  revalidatePath('/admin', 'layout');
  redirect('/admin/users');
}

export type PlanForm = {
  code?: string;
  name: string;
  priceCents: number;
  currency: string;
  interval: 'MONTHLY' | 'YEARLY';
  maxWebsites: number;
  monthlyRequests: number;
  features: string[] | null;
  isActive: boolean;
};

export async function savePlanAction(id: string | null, input: PlanForm): Promise<AdminResult> {
  try {
    if (id) {
      const { code: _code, ...rest } = input;
      await api(`/v1/admin/plans/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(rest) });
    } else {
      await api('/v1/admin/plans', { method: 'POST', body: JSON.stringify(input) });
    }
  } catch (e) {
    return fail(e);
  }
  revalidatePath('/admin/plans');
  revalidatePath('/');
  return { ok: true };
}
