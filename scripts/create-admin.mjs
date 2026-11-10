// Create a super admin, or set a new password for one:   npm run create-admin
// Asks for email, name and password (password is hidden while typing).
// If the email already exists, that account is made admin and its password is replaced.
import { createInterface } from 'node:readline';
import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';

const tty = process.stdin.isTTY;
let rl;
let nextLine;
if (tty) {
  rl = createInterface({ input: process.stdin, output: process.stdout });
} else {
  // Piped input (e.g. CI): buffer every line so none are lost before we ask for it.
  rl = createInterface({ input: process.stdin });
  const queue = [];
  const waiting = [];
  rl.on('line', (l) => (waiting.length ? waiting.shift()(l) : queue.push(l)));
  rl.on('close', () => waiting.splice(0).forEach((w) => w('')));
  nextLine = () => (queue.length ? Promise.resolve(queue.shift()) : new Promise((r) => waiting.push(r)));
}
const ask = (q) => (tty ? new Promise((res) => rl.question(q, (a) => res(a.trim()))) : (process.stdout.write(q + '\n'), nextLine().then((a) => a.trim())));

function askHidden(q) {
  if (!tty) return (process.stdout.write(q + '\n'), nextLine());
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(q);
    rl.pause();
    stdin.setRawMode(true);
    stdin.resume();
    let value = '';
    const onData = (buf) => {
      for (const ch of buf.toString('utf8')) {
        if (ch === '\r' || ch === '\n') {
          stdin.setRawMode(false);
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          rl.resume();
          return resolve(value);
        }
        if (ch === '\u0003') { process.stdout.write('\n'); process.exit(130); } // Ctrl+C
        if (ch === '\u0008' || ch === '\u007f') { if (value) { value = value.slice(0, -1); process.stdout.write('\b \b'); } continue; }
        value += ch;
        process.stdout.write('*');
      }
    };
    stdin.on('data', onData);
  });
}

const prisma = new PrismaClient();
try {
  console.log('\nCreate a WPConnect AI super admin\n');
  const email = (await ask('Admin email: ')).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('That is not a valid email address.');

  const existing = await prisma.user.findUnique({ where: { email } });
  const name = existing ? existing.name : (await ask('Full name: ')) || 'Admin';
  if (existing) console.log(`An account for ${email} already exists — it will be made admin and given this new password.`);

  const password = await askHidden('Password (min 12 characters): ');
  if (password.length < 12) throw new Error('Password must be at least 12 characters.');
  if (password !== (await askHidden('Repeat password: '))) throw new Error('Passwords do not match.');

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  if (existing) {
    await prisma.user.update({ where: { email }, data: { role: 'ADMIN', passwordHash } });
  } else {
    await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({ data: { email, name, passwordHash, role: 'ADMIN' } });
      const free = await tx.plan.findUnique({ where: { code: 'free' } });
      if (free) {
        const now = new Date();
        await tx.subscription.create({
          data: { userId: u.id, planId: free.id, status: 'ACTIVE', currentPeriodStart: now, currentPeriodEnd: new Date(now.getTime() + 30 * 864e5) },
        });
      }
    });
  }
  console.log(`\n✔ Super admin ready: ${email}\n  Sign in at http://localhost:3000/login — you will land on /admin.\n`);
} catch (e) {
  console.error(`\n✖ ${e.message}\n`);
  process.exitCode = 1;
} finally {
  rl.close();
  await prisma.$disconnect();
}
