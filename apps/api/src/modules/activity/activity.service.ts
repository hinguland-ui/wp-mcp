import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface LogInput {
  userId?: string | null;
  websiteId?: string | null;
  action: string;
  status?: 'SUCCESS' | 'DENIED' | 'ERROR';
  ip?: string;
  userAgent?: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class ActivityService {
  private readonly log = new Logger(ActivityService.name);
  constructor(private readonly prisma: PrismaService) {}

  /** Audit logging must never break the request that triggered it. */
  async record(input: LogInput) {
    try {
      await this.prisma.activityLog.create({
        data: { ...input, status: input.status ?? 'SUCCESS', userAgent: input.userAgent?.slice(0, 255) },
      });
    } catch (e) {
      this.log.warn(`activity log failed: ${(e as Error).message}`);
    }
  }

  list(userId: string, websiteId?: string, take = 50) {
    return this.prisma.activityLog.findMany({
      where: { userId, ...(websiteId ? { websiteId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: Math.min(take, 200),
    });
  }
}
