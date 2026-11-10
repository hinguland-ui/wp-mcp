import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, SessionUser } from '../../common/guards';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Read-only billing surface. Payment-provider webhooks should be added here and must
 * write BillingEvent rows keyed by providerEventId (unique) so retries are idempotent.
 */
@UseGuards(JwtAuthGuard)
@Controller('v1/billing')
export class BillingController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('plans')
  plans() {
    return this.prisma.plan.findMany({ where: { isActive: true }, orderBy: { priceCents: 'asc' } });
  }

  @Get('subscription')
  subscription(@CurrentUser() u: SessionUser) {
    return this.prisma.subscription.findFirst({
      where: { userId: u.sub },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
