// One-time setup:  npm run setup
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

if (!existsSync('.env')) {
  copyFileSync('.env.example', '.env');
  let env = readFileSync('.env', 'utf8');
  env = env
    .replace('JWT_SECRET=CHANGE_ME', `JWT_SECRET=${randomBytes(48).toString('base64url')}`)
    .replace('INTERNAL_API_KEY=CHANGE_ME', `INTERNAL_API_KEY=${randomBytes(48).toString('base64url')}`)
    .replace('SITE_SECRET_ENCRYPTION_KEY=CHANGE_ME', `SITE_SECRET_ENCRYPTION_KEY=${randomBytes(32).toString('base64')}`);
  writeFileSync('.env', env);
  console.log('✔ .env created with fresh random secrets');
}

run('npm run build:shared');
run('npm run db:generate');
try {
  run('npm run db:push');
} catch {
  console.error('\n✖ Could not reach MySQL. Start your local MySQL and check the DB_* values in .env, then run: npm run setup');
  process.exit(1);
}
run('npm run db:seed');
console.log('\n✔ Setup done. Start everything with:  npm run web');
