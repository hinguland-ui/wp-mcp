import { z } from 'zod';
import { SCOPES } from '../types';

export const scopeSchema = z.enum(SCOPES);

export const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  password: z.string().min(12, 'Use at least 12 characters').max(128),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const createWebsiteSchema = z.object({
  name: z.string().min(1).max(120),
  url: z
    .string()
    .url()
    .refine((u) => u.startsWith('https://') || u.startsWith('http://localhost'), {
      message: 'Website URL must use HTTPS',
    }),
});
export type CreateWebsiteInput = z.infer<typeof createWebsiteSchema>;

export const updatePermissionsSchema = z.object({
  scopes: z.array(scopeSchema).min(0),
  presetId: z.string().optional(),
});
export type UpdatePermissionsInput = z.infer<typeof updatePermissionsSchema>;

export const authorizeQuerySchema = z.object({
  response_type: z.literal('code'),
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  scope: z.string().optional(),
  state: z.string().optional(),
  code_challenge: z.string().min(43).max(128),
  code_challenge_method: z.literal('S256'),
  resource: z.string().url().optional(),
});
export type AuthorizeQuery = z.infer<typeof authorizeQuerySchema>;

export const tokenRequestSchema = z.discriminatedUnion('grant_type', [
  z.object({
    grant_type: z.literal('authorization_code'),
    code: z.string().min(1),
    redirect_uri: z.string().url(),
    client_id: z.string().min(1),
    code_verifier: z.string().min(43).max(128),
  }),
  z.object({
    grant_type: z.literal('refresh_token'),
    refresh_token: z.string().min(1),
    client_id: z.string().min(1),
  }),
]);
export type TokenRequest = z.infer<typeof tokenRequestSchema>;

export const registerClientSchema = z.object({
  client_name: z.string().min(1).max(120),
  redirect_uris: z.array(z.string().url()).min(1),
  grant_types: z.array(z.enum(['authorization_code', 'refresh_token'])).optional(),
  token_endpoint_auth_method: z.enum(['none', 'client_secret_basic']).optional(),
});
export type RegisterClientInput = z.infer<typeof registerClientSchema>;
