import { Body, Controller, HttpCode, Module, Post, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { z } from 'zod';
import { InternalKeyGuard } from '../../common/guards';
import { ZodPipe } from '../../common/zod.pipe';
import { PrismaService } from '../../prisma/prisma.service';
import { OAuthService } from '../oauth/oauth.service';
import { UsageService } from '../usage/usage.service';
import { WordPressClient } from '../websites/wordpress.client';

const introspectSchema = z.object({ token: z.string().min(1) });
const callSchema = z.object({
  token: z.string().min(1),
  requiredScope: z.string(),
  toolName: z.string().max(120),
  sessionId: z.string().max(64).optional(),
  jsonRpcId: z.string().max(64).optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
  path: z.string().startsWith('/'),
  body: z.unknown().optional(),
});

/**
 * Service-to-service surface for the MCP server. Never exposed through Nginx's public vhost
 * (see deploy/nginx) and additionally protected by X-Internal-Key.
 *
 * The MCP server never talks to WordPress directly: every tool call is re-authorised here
 * (token, live scopes, quota) and then signed with the per-site secret that only the API holds.
 */
@SkipThrottle()
@UseGuards(InternalKeyGuard)
@Controller('internal')
class InternalController {
  constructor(
    private readonly oauth: OAuthService,
    private readonly wp: WordPressClient,
    private readonly usage: UsageService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('oauth/introspect')
  @HttpCode(200)
  introspect(@Body(new ZodPipe(introspectSchema)) b: any) {
    return this.oauth.introspect(b.token);
  }

  @Post('wp/call')
  @HttpCode(200)
  async call(@Body(new ZodPipe(callSchema)) b: any) {
    const started = Date.now();
    const info = await this.oauth.introspect(b.token);
    if (!info.active || !info.website_id || !info.sub) return { ok: false, code: 'unauthorized' };

    const log = (status: 'SUCCESS' | 'DENIED' | 'ERROR', errorCode?: number) =>
      this.prisma.mCPRequest
        .create({
          data: {
            websiteId: info.website_id!,
            sessionId: b.sessionId,
            jsonRpcId: b.jsonRpcId,
            method: 'tools/call',
            toolName: b.toolName,
            status,
            durationMs: Date.now() - started,
            errorCode,
          },
        })
        .catch(() => undefined);

    if (!(info.scope ?? '').split(' ').includes(b.requiredScope)) {
      await log('DENIED', 403);
      return { ok: false, code: 'forbidden', message: `Missing scope ${b.requiredScope}` };
    }
    if (!(await this.usage.withinQuota(info.sub))) {
      await log('DENIED', 429);
      return { ok: false, code: 'quota_exceeded' };
    }
    try {
      const data = await this.wp.call(info.website_id, b.method, b.path, b.body);
      await Promise.all([log('SUCCESS'), this.usage.record(info.sub, info.website_id)]);
      return { ok: true, data };
    } catch (e) {
      await log('ERROR', 502);
      return { ok: false, code: 'upstream_error', message: (e as Error).message };
    }
  }
}

@Module({ controllers: [InternalController] })
export class InternalModule {}
