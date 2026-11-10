// Loads .env (+ builds DATABASE_URL from DB_* values), then runs the given command:
//   node scripts/run.mjs <command...>
import { spawn } from 'node:child_process';
import { loadEnv } from './env.mjs';

loadEnv();

const child = spawn(process.argv.slice(2).map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(' '), { stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code ?? 0));
