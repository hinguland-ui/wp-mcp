import { Injectable, Logger, Module } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
class CleanupJobs {
  private readonly log = new Logger('CleanupJobs');
  constructor(private readonly prisma: PrismaService) {}

  /** Purge expired/consumed auth codes, expired tokens and stale verifications. */
  @Cron(CronExpression.EVERY_HOUR)
  async purge() {
    const now = new Date();
    const [codes, access, refresh, ver] = await Promise.all([
      this.prisma.oAuthAuthorization.deleteMany({ where: { expiresAt: { lt: now } } }),
      this.prisma.accessToken.deleteMany({ where: { expiresAt: { lt: new Date(now.getTime() - 7 * 864e5) } } }),
      this.prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: now } } }),
      this.prisma.websiteVerification.updateMany({
        where: { status: 'PENDING', expiresAt: { lt: now } },
        data: { status: 'EXPIRED' },
      }),
    ]);
    this.log.log(`purged codes=${codes.count} access=${access.count} refresh=${refresh.count} expiredVer=${ver.count}`);
  }
}

@Module({ providers: [CleanupJobs] })
export class JobsModule {}
