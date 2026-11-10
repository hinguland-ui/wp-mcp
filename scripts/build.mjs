// Production build that needs only `node` — no npm/npx on PATH required.
//   node scripts/build.mjs        (also: npm run build)
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { loadEnv } from './env.mjs';

loadEnv();
const require = createRequire(import.meta.url);
const tsc = require.resolve('typescript/bin/tsc');
const prisma = require.resolve('prisma/build/index.js');
const next = require.resolve('next/dist/bin/next');

const steps = [
  ['shared package', [tsc, '-p', 'packages/shared/tsconfig.json']],
  ['prisma client', [prisma, 'generate', '--schema', 'prisma/schema.prisma']],
  ['api', [tsc, '-p', 'apps/api/tsconfig.json'], () => rmSync('apps/api/dist', { recursive: true, force: true })],
  ['mcp server', [tsc, '-p', 'apps/mcp/tsconfig.json'], () => rmSync('apps/mcp/dist', { recursive: true, force: true })],
  // Run inside apps/web: Tailwind/PostCSS look for their config in the current directory.
  ['web (Next.js)', [next, 'build'], null, 'apps/web'],
];

for (const [name, args, before, cwd] of steps) {
  console.log(`\n▶ building ${name}…`);
  before?.();
  const r = spawnSync(process.execPath, args, { stdio: 'inherit', cwd, env: { ...process.env, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' } });
  if (r.status !== 0) {
    console.error(`\n✖ build step failed: ${name} (exit ${r.status ?? r.signal})`);
    process.exit(r.status || 1);
  }
}
console.log('\n✔ build complete');
