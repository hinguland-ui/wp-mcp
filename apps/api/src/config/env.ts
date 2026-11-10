import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().startsWith('mysql://'),
  WEB_URL: z.string().url(),
  API_PUBLIC_URL: z.string().url(),
  MCP_PUBLIC_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  /** 32 bytes, base64. Seals per-site secrets at rest (AES-256-GCM). */
  SITE_SECRET_ENCRYPTION_KEY: z.string().min(40),
  /** Shared secret for MCP server -> API calls. */
  INTERNAL_API_KEY: z.string().min(32),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().default(3600),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().default(60 * 60 * 24 * 30),
  AUTH_CODE_TTL_SECONDS: z.coerce.number().default(300),
});

export type Env = z.infer<typeof schema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error('Invalid API environment: ' + JSON.stringify(parsed.error.flatten().fieldErrors));
  }
  return parsed.data;
}
