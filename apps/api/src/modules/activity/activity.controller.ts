import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, SessionUser } from '../../common/guards';
import { ActivityService } from './activity.service';

@UseGuards(JwtAuthGuard)
@Controller('v1/activity')
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Get()
  list(@CurrentUser() u: SessionUser, @Query('websiteId') websiteId?: string, @Query('take') take?: string) {
    return this.activity.list(u.sub, websiteId, take ? Number(take) : 50);
  }
}
