import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, SessionUser } from '../../common/guards';
import { UsageService } from './usage.service';

@UseGuards(JwtAuthGuard)
@Controller('v1/usage')
export class UsageController {
  constructor(private readonly usage: UsageService) {}

  @Get()
  summary(@CurrentUser() u: SessionUser) {
    return this.usage.summary(u.sub);
  }

  @Get('analytics')
  analytics(@CurrentUser() u: SessionUser, @Query('days') days?: string) {
    return this.usage.analytics(u.sub, days ? Number(days) : 30);
  }
}
