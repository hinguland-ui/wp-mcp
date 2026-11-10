'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  AuthorizeQuery,
  CreateWebsiteInput,
  LoginInput,
  RegisterInput,
  UpdatePermissionsInput,
  createWebsiteSchema,
  loginSchema,
  registerSchema,
  updatePermissionsSchema,
} from '@wpconnect/shared';
import { api, ApiError, SESSION_COOKIE } from './api';

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const fail = (e: unknown): { ok: false; error: string } => {
  // Debug: shows the real cause in the `npm run web` terminal ([web] lines).
  console.error('[action failed]', e instanceof ApiError ? { status: e.status, body: e.body } : e);
  if (e instanceof ApiError) {
    const msg = e.body?.message;
    return { ok: false, error: Array.isArray(msg) ? msg.join(', ') : String(msg ?? 'Request failed') };
  }
  const code = (e as { cause?: { code?: string } })?.cause?.code;
  if (code === 'ECONNREFUSED' || (e instanceof TypeError && e.message === 'fetch failed')) {
    return { ok: false, error: 'Cannot reach the API server (port 4000). Is it running? Check the [api] lines in the terminal.' };
  }
  return { ok: false, error: 'Something went wrong' };
};

/** remember=false -> browser-session cookie (cleared when the browser closes). */
async function setSession(token: string, remember = true) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(remember ? { maxAge: 60 * 60 } : {}),
  });
}

export async function loginAction(input: LoginInput, next?: string, remember = true): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  let role: 'USER' | 'ADMIN' = 'USER';
  try {
    const r = await api<{ accessToken: string; user: { role: 'USER' | 'ADMIN' } }>('/v1/auth/login', { method: 'POST', body: JSON.stringify(parsed.data), auth: false });
    await setSession(r.accessToken, remember);
    role = r.user.role;
  } catch (e) {
    return fail(e);
  }
  // Role-based landing: admins go to /admin, users to /dashboard.
  // A ?next= target wins, but only same-site relative paths (prevents open redirect),
  // and a normal user is never sent into /admin.
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') && !(role !== 'ADMIN' && next.startsWith('/admin')) ? next : null;
  redirect(safeNext ?? (role === 'ADMIN' ? '/admin' : '/dashboard'));
}

export async function registerAction(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  try {
    const r = await api<{ accessToken: string }>('/v1/auth/register', { method: 'POST', body: JSON.stringify(parsed.data), auth: false });
    await setSession(r.accessToken);
  } catch (e) {
    return fail(e);
  }
  redirect('/dashboard');
}

export async function logoutAction() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect('/login');
}

export async function createWebsiteAction(input: CreateWebsiteInput): Promise<ActionResult<{ id: string }>> {
  const parsed = createWebsiteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  try {
    const w = await api<{ id: string }>('/v1/websites', { method: 'POST', body: JSON.stringify(parsed.data) });
    revalidatePath('/websites');
    return { ok: true, data: { id: w.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function startPairingAction(websiteId: string): Promise<ActionResult<{ pairingCode: string; apiUrl: string }>> {
  try {
    const r = await api<{ pairingCode: string; apiUrl: string }>(`/v1/websites/${encodeURIComponent(websiteId)}/pairing`, { method: 'POST' });
    return { ok: true, data: r };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteWebsiteAction(websiteId: string) {
  await api(`/v1/websites/${encodeURIComponent(websiteId)}`, { method: 'DELETE' });
  revalidatePath('/websites');
  redirect('/websites');
}

export async function savePermissionsAction(websiteId: string, input: UpdatePermissionsInput): Promise<ActionResult> {
  const parsed = updatePermissionsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  try {
    await api(`/v1/websites/${encodeURIComponent(websiteId)}/permissions`, { method: 'PUT', body: JSON.stringify(parsed.data) });
    revalidatePath(`/websites/${websiteId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function approveConsentAction(authorize: AuthorizeQuery, websiteId: string, scopes: string[]): Promise<ActionResult> {
  let redirectTo: string;
  try {
    const r = await api<{ redirectTo: string }>('/v1/oauth/consent/approve', {
      method: 'POST',
      body: JSON.stringify({ authorize, websiteId, scopes }),
    });
    redirectTo = r.redirectTo;
  } catch (e) {
    return fail(e);
  }
  redirect(redirectTo); // API already validated this against the client's registered redirect URIs
}
