// Shared env loader for scripts/run.mjs and server.mjs.
// - Reads .env if it exists. Variables already set (e.g. in the hosting panel) win over the file.
// - Builds DATABASE_URL from DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD unless DATABASE_URL is given.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadEnv(file = resolve(process.cwd(), '.env')) {
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      if (line.trim().startsWith('#')) continue;
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!m || process.env[m[1]] !== undefined) continue;
      process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
  if (!process.env.DATABASE_URL) {
    const { DB_HOST = '127.0.0.1', DB_PORT = '3306', DB_NAME = 'wpconnect', DB_USER = 'root', DB_PASSWORD = '' } = process.env;
    process.env.DATABASE_URL = `mysql://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
  }
  return process.env;
}
