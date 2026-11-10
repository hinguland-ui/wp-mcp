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
import { existsSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
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

const log = (...a) => {
  console.log('[server]', ...a);
  pushLog('server', a.join(' '));
};

// Hosting panels (LiteSpeed/Passenger etc.) sometimes inject a NODE_OPTIONS hook that hijacks
// `listen()` in every Node process. The children must bind their own private ports, so drop it.
const { NODE_OPTIONS: _hostHook, ...cleanEnv } = childEnv;

const logs = { server: [], build: [], db: [], api: [], mcp: [], web: [] };
function pushLog(name, text) {
  const lines = String(text).split(/\r?\n/).filter(Boolean).map((l) => `${new Date().toISOString().slice(11, 19)} ${l}`);
  logs[name].push(...lines);
  const max = name === 'build' ? 200 : 80;
  if (logs[name].length > max) logs[name].splice(0, logs[name].length - max);
}

// `npm` is often not on PATH inside a hosting runtime. When started via `npm start`, npm tells us
// where it lives (npm_execpath), so call it through the current node binary instead.
const NODE_DIR = process.execPath.replace(/[\\/][^\\/]+$/, '');
const npmCli = [
  process.env.npm_execpath,
  `${NODE_DIR}/../lib/node_modules/npm/bin/npm-cli.js`, // Linux / CloudLinux alt-nodejs layout
  `${NODE_DIR}/node_modules/npm/bin/npm-cli.js`, // Windows layout
].find((p) => p && /npm-cli\.js$/.test(p) && existsSync(p));
const NPM = npmCli ? `"${process.execPath}" "${npmCli}"` : null;
const pathSep = process.platform === 'win32' ? ';' : ':';
// Make sure scripts run by npm (tsc, nest, next, prisma) find this same node binary.
// npm's own bin folder too, because the root "build" script calls `npm run …` again.
const NPM_DIR = npmCli ? npmCli.replace(/[\\/][^\\/]+$/, '') : '';
const PATH_KEY = Object.keys(cleanEnv).find((k) => k.toUpperCase() === 'PATH') ?? 'PATH'; // "Path" on Windows
cleanEnv[PATH_KEY] = [NODE_DIR, NPM_DIR, `${process.cwd()}/node_modules/.bin`, cleanEnv[PATH_KEY] ?? ''].filter(Boolean).join(pathSep);

/** Run a shell command, stream its output to the console and into logs[name]. Resolves with the exit code. */
function run(name, cmd, env = cleanEnv) {
  return new Promise((resolve) => {
    pushLog(name, `$ ${cmd}`);
    const p = spawn(cmd, { shell: true, env, stdio: ['ignore', 'pipe', 'pipe'] });
    for (const s of [p.stdout, p.stderr]) s.on('data', (b) => (process.stdout.write(b), pushLog(name, b.toString('utf8'))));
    p.on('error', (e) => (pushLog(name, `error: ${e.message}`), resolve(1)));
    p.on('exit', (code) => resolve(code ?? 1));
  });
}

let phase = 'starting';

// ── The three apps, each on a private port (auto-restart if one crashes) ──
const nextBin = require.resolve('next/dist/bin/next');
const apps = {
  api: { cmd: process.execPath, args: ['apps/api/dist/main.js'], env: { PORT: String(PORTS.api) }, port: PORTS.api, build: 'apps/api/dist/main.js' },
  mcp: { cmd: process.execPath, args: ['apps/mcp/dist/index.js'], env: { PORT: String(PORTS.mcp) }, port: PORTS.mcp, build: 'apps/mcp/dist/index.js' },
  web: { cmd: process.execPath, args: [nextBin, 'start', 'apps/web', '-p', String(PORTS.web), '-H', '127.0.0.1'], env: {}, port: PORTS.web, build: 'apps/web/.next/BUILD_ID' },
};
const children = new Map();
const status = Object.fromEntries(Object.keys(apps).map((n) => [n, { running: false, restarts: 0, lastExit: null, built: false }]));
let stopping = false;

function capture(name, stream, out) {
  stream.on('data', (buf) => {
    out.write(buf);
    pushLog(name, buf.toString('utf8'));
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

// ── Boot sequence (runs after the port is open, so the host sees the app as "up") ──
const missingBuilds = () => Object.keys(apps).filter((n) => !existsSync(apps[n].build));
const hasBuildTools = () => ['node_modules/typescript', 'node_modules/prisma', 'node_modules/tailwindcss', 'node_modules/@types/node'].every((p) => existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LOCK = '.build.lock';

async function ensureBuilt() {
  if (!missingBuilds().length) return true;
  log(`build output missing for: ${missingBuilds().join(', ')} — building now (first start can take a few minutes)…`);

  // Another instance already building? Wait for it instead of building twice.
  if (existsSync(LOCK) && Date.now() - statSync(LOCK).mtimeMs < 20 * 60_000) {
    phase = 'waiting-for-build';
    while (existsSync(LOCK) && missingBuilds().length) await sleep(5000);
    return !missingBuilds().length;
  }
  writeFileSync(LOCK, String(process.pid));
  phase = 'building';
  try {
    if (!hasBuildTools()) {
      if (!NPM) {
        log('✖ build tools are not installed and npm was not found on this host. Redeploy so the host runs "npm install" (build tools are regular dependencies now).');
        return false;
      }
      log('build tools not installed — installing them…');
      if ((await run('build', `${NPM} install --include=dev --no-audit --no-fund`, { ...cleanEnv, NODE_ENV: 'development' })) !== 0) {
        log('✖ npm install failed — see /healthz logs');
        return false;
      }
    }
    // Build with node only (no npm needed).
    if ((await run('build', `"${process.execPath}" scripts/build.mjs`, { ...cleanEnv, NODE_ENV: 'production' })) !== 0) {
      log('✖ build failed — see /healthz?key=… logs.build');
      return false;
    }
    log('✔ build finished');
    return true;
  } finally {
    try { unlinkSync(LOCK); } catch {}
  }
}

async function syncDatabase() {
  if (process.env.AUTO_MIGRATE === 'false') return;
  phase = 'database';
  log('syncing database schema…');
  const prismaCli = 'node node_modules/prisma/build/index.js';
  if (!existsSync('node_modules/prisma/build/index.js')) {
    log('⚠ prisma CLI not installed — skipping database sync.');
    return;
  }
  const code = await run('db', `${prismaCli} db push --schema prisma/schema.prisma --skip-generate`);
  if (code !== 0) {
    log('⚠ database sync failed — check DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD (details in /healthz?key=… logs.db). Continuing.');
    return;
  }
  const tsx = existsSync('node_modules/tsx/dist/cli.mjs') ? 'node node_modules/tsx/dist/cli.mjs' : 'npx tsx';
  if ((await run('db', `${tsx} prisma/seed.ts`)) === 0) log('✔ database ready');
  else log('⚠ seeding default plans/scopes failed (details in logs.db).');
}

async function boot() {
  const built = await ensureBuilt();
  for (const n of Object.keys(apps)) status[n].built = existsSync(apps[n].build);
  if (!built) {
    phase = 'build-failed';
    return;
  }
  await syncDatabase();
  phase = 'running';
  Object.keys(apps).forEach((n) => start(n));
}

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
  const body = { status: ok ? 'ok' : 'degraded', phase, node: process.version, apps: appsState };
  // When setup failed, show the tail of the build/db output publicly (secrets redacted) so it can be fixed.
  if (phase === 'build-failed') body.buildError = [...logs.server.slice(-8), ...logs.build.slice(-30)].map(redact);
  if (phase === 'running' && logs.db.some((l) => /error/i.test(l))) body.databaseError = logs.db.slice(-15).map(redact);
  body.env = {
    PUBLIC_URL: !!process.env.PUBLIC_URL,
    DB_HOST: !!process.env.DB_HOST,
    DB_NAME: !!process.env.DB_NAME,
    DB_USER: !!process.env.DB_USER,
    DB_PASSWORD: !!process.env.DB_PASSWORD,
    JWT_SECRET: !!process.env.JWT_SECRET,
    INTERNAL_API_KEY: !!process.env.INTERNAL_API_KEY,
    SITE_SECRET_ENCRYPTION_KEY: !!process.env.SITE_SECRET_ENCRYPTION_KEY,
  };
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
    if (!res.headersSent) res.writeHead(phase === 'running' ? 502 : 503, { 'content-type': 'text/plain; charset=utf-8', 'retry-after': '15' });
    res.end(
      phase === 'building' || phase === 'waiting-for-build' ? 'Setting up the app (first start builds it, a few minutes). Please refresh shortly.'
      : phase === 'build-failed' ? 'The app could not be built. Check /healthz for details.'
      : 'Service is starting, please retry in a few seconds.',
    );
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
  boot().catch((e) => {
    phase = 'build-failed';
    log(`✖ boot failed: ${e?.stack || e}`);
  });
});

function shutdown() {
  stopping = true;
  for (const c of children.values()) c.kill('SIGTERM');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 8000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
