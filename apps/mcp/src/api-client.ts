import { config } from './config.js';

export interface Introspection {
  active: boolean;
  scope?: string;
  sub?: string;
  website_id?: string;
  client_id?: string;
  exp?: number;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${config.API_INTERNAL_URL}/internal${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-internal-key': config.INTERNAL_API_KEY },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`API ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

export const introspect = (token: string) => post<Introspection>('/oauth/introspect', { token });

export type CallResult = { ok: true; data: unknown } | { ok: false; code: string; message?: string };

export const wpCall = (args: {
  token: string;
  requiredScope: string;
  toolName: string;
  sessionId?: string;
  jsonRpcId?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
}) => post<CallResult>('/wp/call', args);
