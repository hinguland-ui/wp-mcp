import { randomUUID } from 'node:crypto';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { config } from './config.js';
import { introspect } from './api-client.js';
import { registerTools } from './tools.js';

const app = express();
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));
app.use(helmet());
app.use(express.json({ limit: '2mb' }));

// RFC 9728: metadata lives at <origin>/.well-known/oauth-protected-resource<resource path>.
// Works both for a dedicated host (https://mcp.example.com) and a path (https://example.com/mcp).
const mcpUrl = new URL(config.MCP_PUBLIC_URL);
const resourcePath = mcpUrl.pathname.replace(/\/+$/, '');
const resourceMetadataUrl = `${mcpUrl.origin}/.well-known/oauth-protected-resource${resourcePath}`;
const metadataRoutes = [...new Set(['/.well-known/oauth-protected-resource', `/.well-known/oauth-protected-resource${resourcePath}`])];

// RFC 9728 – tells MCP clients which authorization server to use.
app.get(metadataRoutes, (_req, res) => {
  res.json({
    resource: config.MCP_PUBLIC_URL,
    authorization_servers: [config.API_PUBLIC_URL],
    bearer_methods_supported: ['header'],
    scopes_supported: ['content:read', 'content:write', 'media:read', 'media:write', 'elementor:read', 'elementor:write', 'woocommerce:read', 'woocommerce:write', 'settings:read'],
  });
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

declare module 'express-serve-static-core' {
  interface Request {
    wpc?: { token: string; scopes: Set<string>; userId: string; websiteId: string };
  }
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  const challenge = (error?: string) =>
    res
      .status(401)
      .set('WWW-Authenticate', `Bearer resource_metadata="${resourceMetadataUrl}"${error ? `, error="${error}"` : ''}`)
      .json({ jsonrpc: '2.0', error: { code: -32001, message: 'Unauthorized' }, id: null });

  if (!h?.startsWith('Bearer ')) return challenge();
  const token = h.slice(7);
  try {
    const info = await introspect(token);
    if (!info.active || !info.sub || !info.website_id) return challenge('invalid_token');
    req.wpc = { token, scopes: new Set((info.scope ?? '').split(' ').filter(Boolean)), userId: info.sub, websiteId: info.website_id };
    next();
  } catch {
    res.status(503).json({ jsonrpc: '2.0', error: { code: -32002, message: 'Auth service unavailable' }, id: null });
  }
}

/**
 * Stateless Streamable HTTP: a fresh McpServer + transport per request, so any instance can serve
 * any request and nothing needs sticky routing. Per-request auth means scopes are always live.
 */
app.post('/mcp', requireAuth, async (req, res) => {
  const sessionId = randomUUID();
  const server = new McpServer({ name: 'wpconnect-ai', version: '0.1.0' });
  registerTools(server, req.wpc!, sessionId);

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on('close', () => {
    transport.close();
    server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (e) {
    console.error('mcp error', e);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal error' }, id: null });
    }
  }
});

// Stateless mode has no server-initiated stream or session to terminate.
const notAllowed = (_req: Request, res: Response) =>
  res.status(405).set('Allow', 'POST').json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed' }, id: null });
app.get('/mcp', notAllowed);
app.delete('/mcp', notAllowed);

app.listen(config.PORT, '127.0.0.1', () => console.log(`WPConnect MCP listening on :${config.PORT}`));
