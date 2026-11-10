// ─────────────────────────────────────────────────────────────────────────────
// Single-entry production server — ONE process, ONE port, ONE domain.
//
//   npm run build   (once per deploy)
//   npm start       (this file)
//
// It starts the three apps on private localhost ports and routes by URL path:
//
//   https://your-domain/mcp, /.well-known/oauth-protected-resource*   → MCP server
//   https://your-domain/v1/*, /oauth/{register,authorize,token,revoke},
//                       /.well-known/oauth-authorization-server        → API
//   everything else (landing, login, dashboard, admin, /oauth/consent) → Next.js
//
// Set PUBLIC_URL=https://your-domain and the three public URLs are derived from it.
// ─────────────────────────────────────────────────────────────────────────────
import http from 'node:http';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { loadEnv } from './scripts/env.mjs';

loadEnv();
const require = createRequire(import.meta.url);

const PORT = Number(process.env.PORT || 3000);
const PORTS = {
  web: Number(process.env.WEB_INTERNAL_PORT || 3101),
  api: Number(process.env.API_INTERNAL_PORT || 3102),
  mcp: Number(process.env.MCP_INTERNAL_PORT || 3103),
};

const PUBLIC_URL = (process.env.PUBLIC_URL || process.env.WEB_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');
const childEnv = {
  ...process.env,
  NODE_ENV: process.env.NODE_ENV || 'production',
  WEB_URL: process.env.PUBLIC_URL ? PUBLIC_URL : process.env.WEB_URL || PUBLIC_URL,
  API_PUBLIC_URL: process.env.PUBLIC_URL ? PUBLIC_URL : process.env.API_PUBLIC_URL || PUBLIC_URL,
  MCP_PUBLIC_URL: process.env.PUBLIC_URL ? `${PUBLIC_URL}/mcp` : process.env.MCP_PUBLIC_URL || `${PUBLIC_URL}/mcp`,
  API_INTERNAL_URL: `http://127.0.0.1:${PORTS.api}`,
  // hosting proxy + this gateway
  TRUST_PROXY_HOPS: process.env.TRUST_PROXY_HOPS || '2',
};

const log = (...a) => console.log('[server]', ...a);

// ── 1. Database: create/upgrade tables and add default plans/scopes (safe to repeat) ──
if (process.env.AUTO_MIGRATE !== 'false') {
  log('syncing database schema…');
  const push = spawnSync('npx prisma db push --schema prisma/schema.prisma --skip-generate', { stdio: 'inherit', shell: true, env: childEnv });
  if (push.status === 0) spawnSync('npx tsx prisma/seed.ts', { stdio: 'inherit', shell: true, env: childEnv });
  else log('⚠ database sync failed — check DB_HOST / DB_USER / DB_PASSWORD / DB_NAME. Continuing anyway.');
}

// ── 2. Start the three apps on private ports (auto-restart if one crashes) ──
const nextBin = require.resolve('next/dist/bin/next');
const apps = {
  api: { cmd: process.execPath, args: ['apps/api/dist/main.js'], env: { PORT: String(PORTS.api) } },
  mcp: { cmd: process.execPath, args: ['apps/mcp/dist/index.js'], env: { PORT: String(PORTS.mcp) } },
  web: { cmd: process.execPath, args: [nextBin, 'start', 'apps/web', '-p', String(PORTS.web), '-H', '127.0.0.1'], env: {} },
};
const children = new Map();
let stopping = false;

function start(name, attempt = 0) {
  const a = apps[name];
  const child = spawn(a.cmd, a.args, { stdio: 'inherit', env: { ...childEnv, ...a.env } });
  children.set(name, child);
  const startedAt = Date.now();
  child.on('exit', (code, signal) => {
    if (stopping) return;
    const quick = Date.now() - startedAt < 10_000;
    const delay = Math.min(30_000, quick ? 1000 * 2 ** attempt : 1000);
    log(`${name} exited (${signal ?? code}) — restarting in ${delay / 1000}s`);
    setTimeout(() => start(name, quick ? attempt + 1 : 0), delay);
  });
}
Object.keys(apps).forEach((n) => start(n));

// ── 3. Route requests by path ──
function route(url = '/') {
  const p = url.split('?')[0];
  if (p === '/mcp' || p.startsWith('/mcp/') || p.startsWith('/.well-known/oauth-protected-resource')) return PORTS.mcp;
  if (p.startsWith('/internal/')) return null; // service-to-service only, never public
  if (
    p.startsWith('/v1/') ||
    p === '/.well-known/oauth-authorization-server' ||
    /^\/oauth\/(register|authorize|token|revoke)\/?$/.test(p) ||
    p.startsWith('/socket.io/')
  ) return PORTS.api;
  return PORTS.web;
}

function forwardedHeaders(req) {
  const ip = req.socket.remoteAddress || '';
  const xff = req.headers['x-forwarded-for'];
  return {
    ...req.headers,
    'x-forwarded-for': xff ? `${xff}, ${ip}` : ip,
    'x-forwarded-proto': req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http'),
    'x-forwarded-host': req.headers['x-forwarded-host'] || req.headers.host || '',
  };
}

const server = http.createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok' }));
  }
  const port = route(req.url);
  if (!port) {
    res.writeHead(404, { 'content-type': 'application/json' });
    return res.end('{"message":"Not found"}');
  }
  const upstream = http.request(
    { host: '127.0.0.1', port, method: req.method, path: req.url, headers: forwardedHeaders(req) },
    (up) => {
      res.writeHead(up.statusCode || 502, up.statusMessage, up.headers);
      up.pipe(res);
    },
  );
  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain' });
    res.end('Service is starting, please retry in a few seconds.');
  });
  req.on('aborted', () => upstream.destroy());
  req.pipe(upstream);
});

// WebSocket / upgrade requests (socket.io)
server.on('upgrade', (req, socket, head) => {
  const port = route(req.url);
  if (!port) return socket.destroy();
  const up = net.connect(port, '127.0.0.1', () => {
    const h = forwardedHeaders(req);
    up.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n` + Object.entries(h).map(([k, v]) => `${k}: ${v}`).join('\r\n') + '\r\n\r\n');
    if (head?.length) up.write(head);
    up.pipe(socket).pipe(up);
  });
  up.on('error', () => socket.destroy());
  socket.on('error', () => up.destroy());
});

server.listen(PORT, () => {
  log(`listening on :${PORT}`);
  log(`site  ${childEnv.WEB_URL}`);
  log(`api   ${childEnv.API_PUBLIC_URL}/v1`);
  log(`mcp   ${childEnv.MCP_PUBLIC_URL}`);
});

function shutdown() {
  stopping = true;
  for (const c of children.values()) c.kill('SIGTERM');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 8000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
