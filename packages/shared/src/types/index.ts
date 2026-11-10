export const SCOPES = [
  'content:read',
  'content:write',
  'media:read',
  'media:write',
  'elementor:read',
  'elementor:write',
  'woocommerce:read',
  'woocommerce:write',
  'users:read',
  'settings:read',
  'settings:write',
] as const;
export type Scope = (typeof SCOPES)[number];

export type WebsiteStatus = 'PENDING' | 'VERIFIED' | 'CONNECTED' | 'DISCONNECTED' | 'SUSPENDED';

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface TokenIntrospection {
  active: boolean;
  scope?: string;
  client_id?: string;
  sub?: string;
  website_id?: string;
  exp?: number;
}
