import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wpCall } from './api-client.js';

interface Ctx {
  token: string;
  scopes: Set<string>;
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface ToolDef<S extends z.ZodRawShape> {
  name: string;
  description: string;
  scope: string;
  readOnly: boolean;
  input: S;
  build: (a: z.infer<z.ZodObject<S>>) => { method: Method; path: string; body?: unknown };
}

const id = z.number().int().positive();
const qs = (o: Record<string, unknown>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined) p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
};

function def<S extends z.ZodRawShape>(d: ToolDef<S>) {
  return d;
}

const TOOLS = [
  def({
    name: 'get_site_info',
    description: 'Basic information about the connected WordPress site (name, versions, active integrations).',
    scope: 'settings:read',
    readOnly: true,
    input: {},
    build: () => ({ method: 'GET', path: '/site' }),
  }),
  def({
    name: 'list_posts',
    description: 'List posts or pages with optional search and pagination.',
    scope: 'content:read',
    readOnly: true,
    input: {
      post_type: z.enum(['post', 'page']).default('post'),
      search: z.string().max(200).optional(),
      page: z.number().int().min(1).default(1),
      per_page: z.number().int().min(1).max(50).default(10),
    },
    build: (a) => ({ method: 'GET', path: '/content' + qs(a) }),
  }),
  def({
    name: 'get_post',
    description: 'Get a single post or page by ID, including content.',
    scope: 'content:read',
    readOnly: true,
    input: { id },
    build: (a) => ({ method: 'GET', path: `/content/${a.id}` }),
  }),
  def({
    name: 'create_post',
    description: 'Create a post or page. Defaults to draft.',
    scope: 'content:write',
    readOnly: false,
    input: {
      title: z.string().min(1).max(300),
      content: z.string().max(200_000),
      post_type: z.enum(['post', 'page']).default('post'),
      status: z.enum(['draft', 'pending', 'publish']).default('draft'),
    },
    build: (a) => ({ method: 'POST', path: '/content', body: a }),
  }),
  def({
    name: 'update_post',
    description: 'Update fields of an existing post or page.',
    scope: 'content:write',
    readOnly: false,
    input: {
      id,
      title: z.string().max(300).optional(),
      content: z.string().max(200_000).optional(),
      status: z.enum(['draft', 'pending', 'publish']).optional(),
    },
    build: ({ id: pid, ...rest }) => ({ method: 'PUT', path: `/content/${pid}`, body: rest }),
  }),
  def({
    name: 'list_media',
    description: 'List items from the media library.',
    scope: 'media:read',
    readOnly: true,
    input: { page: z.number().int().min(1).default(1), per_page: z.number().int().min(1).max(50).default(20) },
    build: (a) => ({ method: 'GET', path: '/media' + qs(a) }),
  }),
  def({
    name: 'get_elementor_page',
    description: 'Get the Elementor JSON data of a page.',
    scope: 'elementor:read',
    readOnly: true,
    input: { id },
    build: (a) => ({ method: 'GET', path: `/elementor/${a.id}` }),
  }),
  def({
    name: 'update_elementor_page',
    description: 'Replace the Elementor JSON data of a page. A revision is saved by WordPress first.',
    scope: 'elementor:write',
    readOnly: false,
    input: { id, elements: z.array(z.record(z.unknown())).max(2000) },
    build: ({ id: pid, elements }) => ({ method: 'PUT', path: `/elementor/${pid}`, body: { elements } }),
  }),
  def({
    name: 'list_products',
    description: 'List WooCommerce products.',
    scope: 'woocommerce:read',
    readOnly: true,
    input: { search: z.string().max(200).optional(), page: z.number().int().min(1).default(1), per_page: z.number().int().min(1).max(50).default(10) },
    build: (a) => ({ method: 'GET', path: '/woocommerce/products' + qs(a) }),
  }),
  def({
    name: 'update_product',
    description: 'Update a WooCommerce product (name, price, stock).',
    scope: 'woocommerce:write',
    readOnly: false,
    input: {
      id,
      name: z.string().max(300).optional(),
      regular_price: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
      stock_quantity: z.number().int().min(0).optional(),
    },
    build: ({ id: pid, ...rest }) => ({ method: 'PUT', path: `/woocommerce/products/${pid}`, body: rest }),
  }),
];

/**
 * Registers only the tools whose scope the token holds, so clients never see tools they can't use.
 * The API re-checks the scope on every call (the token may be narrowed after listing).
 */
export function registerTools(server: McpServer, ctx: Ctx, sessionId?: string) {
  for (const t of TOOLS) {
    if (!ctx.scopes.has(t.scope)) continue;
    server.registerTool(
      t.name,
      {
        description: `${t.description} (requires ${t.scope})`,
        inputSchema: t.input,
        annotations: { readOnlyHint: t.readOnly, destructiveHint: false, openWorldHint: false },
      },
      async (args: any, extra: any) => {
        const spec = t.build(args);
        const r = await wpCall({
          token: ctx.token,
          requiredScope: t.scope,
          toolName: t.name,
          sessionId,
          jsonRpcId: extra?.requestId != null ? String(extra.requestId) : undefined,
          ...spec,
        });
        if (!r.ok) {
          return { isError: true, content: [{ type: 'text' as const, text: `${r.code}${r.message ? `: ${r.message}` : ''}` }] };
        }
        return { content: [{ type: 'text' as const, text: JSON.stringify(r.data, null, 2).slice(0, 100_000) }] };
      },
    );
  }
}
