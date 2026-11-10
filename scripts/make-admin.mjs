// Promote an existing account to super admin:   npm run make-admin -- you@example.com
// Demote:                                        npm run make-admin -- you@example.com --remove
import { PrismaClient } from '@prisma/client';

const email = process.argv[2]?.toLowerCase();
const remove = process.argv.includes('--remove');
if (!email || email.startsWith('--')) {
  console.error('Usage: npm run make-admin -- <email> [--remove]');
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`✖ No account with email ${email}. Register it first, then run this again.`);
    process.exit(1);
  }
  await prisma.user.update({ where: { email }, data: { role: remove ? 'USER' : 'ADMIN' } });
  console.log(remove ? `✔ ${email} is no longer an admin.` : `✔ ${email} is now a super admin. Open /admin in the dashboard.`);
} finally {
  await prisma.$disconnect();
}
