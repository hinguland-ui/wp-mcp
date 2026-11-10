import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(4100),
  /** Public URL of this MCP server, e.g. https://mcp.example.com (also the OAuth `resource`). */
  MCP_PUBLIC_URL: z.string().url(),
  /** Public issuer URL of the OAuth authorization server (the NestJS API). */
  API_PUBLIC_URL: z.string().url(),
  /** Private URL used for service-to-service calls, e.g. http://127.0.0.1:4000 */
  API_INTERNAL_URL: z.string().url(),
  INTERNAL_API_KEY: z.string().min(32),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid MCP environment', parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const config = parsed.data;
