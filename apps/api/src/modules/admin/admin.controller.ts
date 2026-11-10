import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser, JwtAuthGuard, SessionUser } from '../../common/guards';
import { ZodPipe } from '../../common/zod.pipe';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

const planFields = {
  name: z.string().trim().min(1).max(80),
  priceCents: z.number().int().min(0).max(100_000_000),
  currency: z.string().trim().length(3).transform((s) => s.toUpperCase()),
  interval: z.enum(['MONTHLY', 'YEARLY']),
  maxWebsites: z.number().int().min(0).max(1_000_000),
  monthlyRequests: z.number().int().min(0).max(1_000_000_000),
  features: z.array(z.string().trim().min(1).max(120)).max(30).nullable(),
  isActive: z.boolean(),
};
const createPlanSchema = z.object({ code: z.string().trim().toLowerCase().regex(/^[a-z0-9_-]{2,32}$/, 'Use 2–32 lowercase letters, numbers, - or _'), ...planFields });
const updatePlanSchema = z.object(planFields).partial();
const updateUserSchema = z.object({
  role: z.enum(['USER', 'ADMIN']).optional(),
  planCode: z.string().min(1).max(32).optional(),
  name: z.string().trim().min(1).max(120).optional(),
});

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('v1/admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('overview')
  overview(@Query('days') days?: string) {
    return this.admin.overview(days ? Number(days) : 30);
  }

  @Get('users')
  users(@Query('q') q?: string, @Query('page') page?: string) {
    return this.admin.listUsers(q?.trim() || undefined, page ? Number(page) : 1);
  }

  @Get('users/:id')
  user(@Param('id') id: string) {
    return this.admin.getUser(id);
  }

  @Patch('users/:id')
  updateUser(@CurrentUser() me: SessionUser, @Param('id') id: string, @Body(new ZodPipe(updateUserSchema)) body: any) {
    return this.admin.updateUser(me.sub, id, body);
  }

  @Delete('users/:id')
  deleteUser(@CurrentUser() me: SessionUser, @Param('id') id: string) {
    return this.admin.deleteUser(me.sub, id);
  }

  @Get('websites')
  websites(@Query('q') q?: string, @Query('status') status?: string) {
    return this.admin.listWebsites(q?.trim() || undefined, status || undefined);
  }

  @Get('plans')
  plans() {
    return this.admin.listPlans();
  }

  @Post('plans')
  createPlan(@Body(new ZodPipe(createPlanSchema)) body: any) {
    return this.admin.createPlan(body);
  }

  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body(new ZodPipe(updatePlanSchema)) body: any) {
    return this.admin.updatePlan(id, body);
  }

  @Get('activity')
  activity(@Query('take') take?: string, @Query('status') status?: string) {
    return this.admin.activity(take ? Number(take) : 100, status || undefined);
  }
}
