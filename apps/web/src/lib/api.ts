import 'server-only';
import { cookies } from 'next/headers';

/**
 * Server-side only. API_INTERNAL_URL and the session cookie never reach the browser;
 * the browser talks to Next.js, and Next.js talks to NestJS.
 */
const BASE = process.env.API_INTERNAL_URL!;
export const SESSION_COOKIE = 'wpc_session';

export async function sessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export class ApiError extends Error {
  constructor(public status: number, public body: any) {
    super(body?.message ?? `API ${status}`);
  }
}

export async function api<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  if (init.auth !== false) {
    const t = await sessionToken();
    if (t) headers.set('authorization', `Bearer ${t}`);
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers, cache: 'no-store' });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}
