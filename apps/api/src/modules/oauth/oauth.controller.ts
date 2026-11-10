import { Body, Controller, Get, Header, HttpCode, Post, Query, Redirect, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import {
  authorizeQuerySchema,
  registerClientSchema,
  tokenRequestSchema,
} from '@wpconnect/shared';
import { z } from 'zod';
import { CurrentUser, JwtAuthGuard, SessionUser } from '../../common/guards';
import { ZodPipe } from '../../common/zod.pipe';
import { OAuthService } from './oauth.service';

/** RFC 8414 metadata – served at the origin root (no /v1 prefix). */
@Controller('.well-known')
export class OAuthMetadataController {
  constructor(private readonly oauth: OAuthService) {}
  @Get('oauth-authorization-server')
  meta() {
    return this.oauth.metadata();
  }
}

@Controller('oauth')
export class OAuthController {
  constructor(private readonly oauth: OAuthService, private readonly config: ConfigService) {}

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('register')
  register(@Body(new ZodPipe(registerClientSchema)) body: any) {
    return this.oauth.registerClient(body);
  }

  /** Browser entry point: validate, then hand off to the dashboard consent page. */
  @Get('authorize')
  @Redirect()
  authorize(@Query(new ZodPipe(authorizeQuerySchema)) q: any) {
    const url = new URL('/oauth/consent', this.config.getOrThrow<string>('WEB_URL'));
    Object.entries(q).forEach(([k, v]) => v != null && url.searchParams.set(k, String(v)));
    return { url: url.toString(), statusCode: 302 };
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('token')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @Header('Pragma', 'no-cache')
  token(@Body(new ZodPipe(tokenRequestSchema)) body: any) {
    return this.oauth.token(body);
  }

  @Post('revoke')
  @HttpCode(200)
  revoke(@Body('token') token: string) {
    return this.oauth.revoke(token ?? '');
  }
}

const approveSchema = z.object({
  authorize: authorizeQuerySchema,
  websiteId: z.string().min(1),
  scopes: z.array(z.string()).min(1),
});

/** Called by the Next.js consent page with the user's session JWT. */
@UseGuards(JwtAuthGuard)
@Controller('v1/oauth/consent')
export class OAuthConsentController {
  constructor(private readonly oauth: OAuthService) {}

  @Post('preview')
  @HttpCode(200)
  preview(@CurrentUser() u: SessionUser, @Body(new ZodPipe(authorizeQuerySchema)) q: any) {
    return this.oauth.preview(u.sub, q);
  }

  @Post('approve')
  @HttpCode(200)
  approve(@CurrentUser() u: SessionUser, @Body(new ZodPipe(approveSchema)) b: any) {
    return this.oauth.approve(u.sub, b.authorize, b.websiteId, b.scopes);
  }
}
