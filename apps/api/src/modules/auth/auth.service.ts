import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { LoginInput, RegisterInput } from '@wpconnect/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async register(input: RegisterInput) {
    const email = input.email.toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });

    // User + free-plan subscription must succeed or fail together.
    const user = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({ data: { email, name: input.name, passwordHash } });
      const free = await tx.plan.findUnique({ where: { code: 'free' } });
      if (free) {
        const now = new Date();
        await tx.subscription.create({
          data: {
            userId: u.id,
            planId: free.id,
            status: 'ACTIVE',
            currentPeriodStart: now,
            currentPeriodEnd: new Date(now.getTime() + 30 * 864e5),
          },
        });
      }
      return u;
    });
    return this.session(user);
  }

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    // Same error for unknown user and bad password.
    if (!user || !(await argon2.verify(user.passwordHash, input.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.session(user);
  }

  async me(userId: string) {
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return { id: u.id, email: u.email, name: u.name, role: u.role };
  }

  private async session(user: { id: string; email: string; name: string; role: 'USER' | 'ADMIN' }) {
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role });
    return { accessToken, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  }
}
