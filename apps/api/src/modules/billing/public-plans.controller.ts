import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Unauthenticated, read-only plan list for the marketing / pricing page. */
@Controller('v1/public')
export class PublicPlansController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('plans')
  plans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceCents: 'asc' },
      select: { code: true, name: true, priceCents: true, currency: true, interval: true, maxWebsites: true, monthlyRequests: true, features: true },
    });
  }
}
