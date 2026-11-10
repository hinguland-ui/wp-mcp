import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Super-admin only. Runs after JwtAuthGuard and re-reads the role from the database,
 * so demoting someone takes effect immediately (not when their JWT expires).
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const id = req.user?.sub;
    const u = id ? await this.prisma.user.findUnique({ where: { id }, select: { role: true } }) : null;
    if (u?.role !== 'ADMIN') throw new ForbiddenException('Admins only');
    return true;
  }
}
