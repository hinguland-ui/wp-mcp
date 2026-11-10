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
import { existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { loadEnv } from './scripts/env.mjs';

loadEnv();
const require = createRequire(import.meta.url);

// Some hosts pass a socket path instead of a number in PORT — listen() accepts both.
const PORT = /^\d+$/.test(process.env.PORT ?? '') ? Number(process.env.PORT) : process.env.PORT || 3000;
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
// Hosting panels (LiteSpeed/Passenger etc.) sometimes inject a NODE_OPTIONS hook that hijacks
// `listen()` in every Node process. The children must bind their own private ports, so drop it.
const { NODE_OPTIONS: _hostHook, ...cleanEnv } = childEnv;

const nextBin = require.resolve('next/dist/bin/next');
const apps = {
  api: { cmd: process.execPath, args: ['apps/api/dist/main.js'], env: { PORT: String(PORTS.api) }, port: PORTS.api, build: 'apps/api/dist/main.js' },
  mcp: { cmd: process.execPath, args: ['apps/mcp/dist/index.js'], env: { PORT: String(PORTS.mcp) }, port: PORTS.mcp, build: 'apps/mcp/dist/index.js' },
  web: { cmd: process.execPath, args: [nextBin, 'start', 'apps/web', '-p', String(PORTS.web), '-H', '127.0.0.1'], env: {}, port: PORTS.web, build: 'apps/web/.next/BUILD_ID' },
};
const children = new Map();
const status = Object.fromEntries(Object.keys(apps).map((n) => [n, { running: false, restarts: 0, lastExit: null, built: existsSync(apps[n].build) }]));
const logs = Object.fromEntries(Object.keys(apps).map((n) => [n, []]));
let stopping = false;

for (const [n, s] of Object.entries(status)) if (!s.built) log(`⚠ ${n}: build output missing (${apps[n].build}) — did "npm run build" run on the host?`);

function capture(name, stream, out) {
  stream.on('data', (buf) => {
    out.write(buf);
    const lines = buf.toString('utf8').split(/\r?\n/).filter(Boolean).map((l) => `${new Date().toISOString().slice(11, 19)} ${l}`);
    logs[name].push(...lines);
    if (logs[name].length > 80) logs[name].splice(0, logs[name].length - 80);
  });
}

function start(name, attempt = 0) {
  const a = apps[name];
  const child = spawn(a.cmd, a.args, { stdio: ['ignore', 'pipe', 'pipe'], env: { ...cleanEnv, ...a.env } });
  capture(name, child.stdout, process.stdout);
  capture(name, child.stderr, process.stderr);
  children.set(name, child);
  status[name].running = true;
  const startedAt = Date.now();
  child.on('error', (e) => logs[name].push(`spawn error: ${e.message}`));
  child.on('exit', (code, signal) => {
    status[name].running = false;
    status[name].lastExit = { code, signal, at: new Date().toISOString() };
    if (stopping) return;
    status[name].restarts++;
    const quick = Date.now() - startedAt < 10_000;
    const delay = Math.min(30_000, quick ? 1000 * 2 ** attempt : 1000);
    log(`${name} exited (${signal ?? code}) — restarting in ${delay / 1000}s`);
    setTimeout(() => start(name, quick ? attempt + 1 : 0), delay);
  });
}
Object.keys(apps).forEach((n) => start(n));

const isListening = (port) =>
  new Promise((res) => {
    const s = net.connect(port, '127.0.0.1');
    s.setTimeout(800);
    s.once('connect', () => (s.destroy(), res(true)));
    s.once('error', () => res(false));
    s.once('timeout', () => (s.destroy(), res(false)));
  });

// Hide secret values if they ever show up in a log line.
const secrets = ['DB_PASSWORD', 'JWT_SECRET', 'INTERNAL_API_KEY', 'SITE_SECRET_ENCRYPTION_KEY', 'DATABASE_URL']
  .map((k) => process.env[k])
  .filter((v) => v && v.length >= 4);
const redact = (s) => secrets.reduce((acc, v) => acc.split(v).join('***'), s);

async function health(req, res) {
  const url = new URL(req.url, 'http://x');
  const appsState = {};
  for (const n of Object.keys(apps)) appsState[n] = { ...status[n], listening: await isListening(apps[n].port) };
  const ok = Object.values(appsState).every((a) => a.listening);
  const body = { status: ok ? 'ok' : 'degraded', node: process.version, apps: appsState };
  // Logs only with the secret key: /healthz?key=<INTERNAL_API_KEY>
  if (process.env.INTERNAL_API_KEY && url.searchParams.get('key') === process.env.INTERNAL_API_KEY) {
    body.logs = Object.fromEntries(Object.entries(logs).map(([n, l]) => [n, l.map(redact)]));
  }
  res.writeHead(ok ? 200 : 503, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body, null, 2));
}

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
  if (req.url === '/healthz' || req.url?.startsWith('/healthz?')) return void health(req, res);
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
