/**
 * Reads the role claim from the session JWT WITHOUT verifying it.
 * Only for choosing where to send someone (routing / UI). Real access control
 * happens in the API (AdminGuard) and in the /admin layout, which ask the server.
 */
export function roleFromToken(token?: string | null): 'USER' | 'ADMIN' | null {
  if (!token) return null;
  try {
    const part = token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(part.padEnd(part.length + ((4 - (part.length % 4)) % 4), '=')));
    return json.role === 'ADMIN' ? 'ADMIN' : 'USER';
  } catch {
    return null;
  }
}

export const homeFor = (role: 'USER' | 'ADMIN' | null) => (role === 'ADMIN' ? '/admin' : '/dashboard');
