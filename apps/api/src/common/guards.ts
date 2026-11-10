import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { safeEqual } from './crypto';

export interface SessionUser {
  sub: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

/** Dashboard session: Bearer JWT issued by /auth/login (held server-side by Next.js). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const h: string | undefined = req.headers.authorization;
    if (!h?.startsWith('Bearer ')) throw new UnauthorizedException();
    try {
      req.user = await this.jwt.verifyAsync<SessionUser>(h.slice(7));
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}

/** Service-to-service: MCP server -> API. */
@Injectable()
export class InternalKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const key = req.headers['x-internal-key'];
    if (typeof key !== 'string' || !safeEqual(key, this.config.getOrThrow<string>('INTERNAL_API_KEY'))) {
      throw new UnauthorizedException();
    }
    return true;
  }
}

export const CurrentUser = createParamDecorator(
  (_d: unknown, ctx: ExecutionContext): SessionUser => ctx.switchToHttp().getRequest().user,
);
