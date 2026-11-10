import { Body, Controller, Delete, Get, Headers, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { createWebsiteSchema } from '@wpconnect/shared';
import { z } from 'zod';
import { CurrentUser, JwtAuthGuard, SessionUser } from '../../common/guards';
import { ZodPipe } from '../../common/zod.pipe';
import { WebsitesService } from './websites.service';

@UseGuards(JwtAuthGuard)
@Controller('v1/websites')
export class WebsitesController {
  constructor(private readonly sites: WebsitesService) {}

  @Get() list(@CurrentUser() u: SessionUser) { return this.sites.list(u.sub); }

  @Get(':id') get(@CurrentUser() u: SessionUser, @Param('id') id: string) { return this.sites.get(u.sub, id); }

  @Post() create(@CurrentUser() u: SessionUser, @Body(new ZodPipe(createWebsiteSchema)) body: any) {
    return this.sites.create(u.sub, body);
  }

  @Post(':id/pairing') pairing(@CurrentUser() u: SessionUser, @Param('id') id: string) {
    return this.sites.startPairing(u.sub, id);
  }

  @Delete(':id') @HttpCode(204) async remove(@CurrentUser() u: SessionUser, @Param('id') id: string) {
    await this.sites.remove(u.sub, id);
  }
}

const pairSchema = z.object({
  pairingCode: z.string().min(20),
  siteUrl: z.string().url(),
  pluginVersion: z.string().max(32).optional(),
  wpVersion: z.string().max(32).optional(),
  phpVersion: z.string().max(32).optional(),
  hasElementor: z.boolean().optional(),
  hasWooCommerce: z.boolean().optional(),
});

/** Endpoints called by the WordPress plugin (not by browsers). */
@Controller('v1/plugin')
export class PluginController {
  constructor(private readonly sites: WebsitesService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('pair')
  pair(@Body(new ZodPipe(pairSchema)) body: any) {
    return this.sites.completePairing(body);
  }

  @Post('heartbeat')
  heartbeat(
    @Headers('x-wpconnect-site') site: string,
    @Headers('x-wpconnect-timestamp') ts: string,
    @Headers('x-wpconnect-signature') sig: string,
    @Body() body: { pluginVersion?: string; wpVersion?: string },
  ) {
    return this.sites.heartbeat(site, ts, sig, body ?? {});
  }
}
