import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { AuthorizeQuery, RegisterClientInput, TokenIntrospection, TokenRequest } from '@wpconnect/shared';
import { randomToken, safeEqual, sha256Base64Url, sha256Hex } from '../../common/crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { PermissionsService } from '../permissions/permissions.service';

export class OAuthError extends BadRequestException {
  constructor(error: string, description?: string) {
    super({ error, error_description: description });
  }
}

const isLoopback = (u: URL) => u.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname);

@Injectable()
export class OAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly perms: PermissionsService,
    private readonly activity: ActivityService,
  ) {}

  metadata() {
    const issuer = this.config.getOrThrow<string>('API_PUBLIC_URL');
    return {
      issuer,
      authorization_endpoint: `${issuer}/oauth/authorize`,
      token_endpoint: `${issuer}/oauth/token`,
      registration_endpoint: `${issuer}/oauth/register`,
      revocation_endpoint: `${issuer}/oauth/revoke`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none', 'client_secret_basic'],
      scopes_supported: ['content:read', 'content:write', 'media:read', 'media:write', 'elementor:read', 'elementor:write', 'woocommerce:read', 'woocommerce:write', 'users:read', 'settings:read', 'settings:write'],
    };
  }

  /** RFC 7591 dynamic client registration (public PKCE clients; MCP clients rely on this). */
  async registerClient(input: RegisterClientInput) {
    for (const r of input.redirect_uris) {
      const u = new URL(r);
      if (u.protocol !== 'https:' && !isLoopback(u)) throw new OAuthError('invalid_redirect_uri', 'Redirect URIs must be https or loopback');
      if (u.hash) throw new OAuthError('invalid_redirect_uri', 'Fragments are not allowed');
    }
    const clientId = 'wpc_' + randomToken(18);
    await this.prisma.oAuthClient.create({
      data: {
        clientId,
        name: input.client_name,
        redirectUris: input.redirect_uris,
        grantTypes: input.grant_types ?? ['authorization_code', 'refresh_token'],
        authMethod: 'none',
        isDynamic: true,
      },
    });
    return {
      client_id: clientId,
      client_name: input.client_name,
      redirect_uris: input.redirect_uris,
      grant_types: input.grant_types ?? ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    };
  }

  private async getClient(clientId: string) {
    const c = await this.prisma.oAuthClient.findUnique({ where: { clientId } });
    if (!c) throw new OAuthError('invalid_client');
    return c;
  }

  private assertRedirect(client: { redirectUris: unknown }, uri: string) {
    // Exact string match (OAuth 2.1). Loopback port may vary per RFC 8252.
    const registered = client.redirectUris as string[];
    const u = new URL(uri);
    const ok = registered.some((r) => {
      if (r === uri) return true;
      const ru = new URL(r);
      return isLoopback(ru) && isLoopback(u) && ru.hostname === u.hostname && ru.pathname === u.pathname;
    });
    if (!ok) throw new OAuthError('invalid_request', 'redirect_uri not registered');
  }

  /** Data shown on the consent screen. */
  async preview(userId: string, q: AuthorizeQuery) {
    const client = await this.getClient(q.client_id);
    this.assertRedirect(client, q.redirect_uri);
    const websites = await this.prisma.website.findMany({
      where: { userId, status: 'CONNECTED' },
      select: { id: true, name: true, url: true },
    });
    const requested = (q.scope ?? '').split(' ').filter(Boolean);
    return { client: { name: client.name, clientId: client.clientId }, requestedScopes: requested, websites };
  }

  /** User approved: bind the code to user + client + website + PKCE challenge. */
  async approve(userId: string, q: AuthorizeQuery, websiteId: string, grantedScopes: string[]) {
    const client = await this.getClient(q.client_id);
    this.assertRedirect(client, q.redirect_uri);

    const site = await this.prisma.website.findFirst({ where: { id: websiteId, userId, status: 'CONNECTED' } });
    if (!site) throw new NotFoundException('Website not found or not connected');

    const requested = new Set((q.scope ?? '').split(' ').filter(Boolean));
    const allowedBySite = new Set(await this.perms.effectiveScopes(websiteId));
    // Never grant more than: requested ∩ user-selected ∩ site-allowed.
    const scope = grantedScopes.filter((s) => requested.has(s) && allowedBySite.has(s));
    if (!scope.length) throw new ForbiddenException('No permitted scopes selected');

    if (q.resource && q.resource !== this.mcpResource()) throw new OAuthError('invalid_target', 'Unknown resource');

    const code = randomToken(32);
    await this.prisma.oAuthAuthorization.create({
      data: {
        userId,
        oauthClientId: client.id,
        websiteId,
        codeHash: sha256Hex(code),
        codeChallenge: q.code_challenge,
        codeChallengeMethod: 'S256',
        redirectUri: q.redirect_uri,
        scope: scope.join(' '),
        resource: q.resource,
        expiresAt: new Date(Date.now() + this.config.get<number>('AUTH_CODE_TTL_SECONDS', 300) * 1000),
      },
    });
    await this.activity.record({ userId, websiteId, action: 'oauth.authorized', metadata: { client: client.name, scope } });

    const redirect = new URL(q.redirect_uri);
    redirect.searchParams.set('code', code);
    if (q.state) redirect.searchParams.set('state', q.state);
    redirect.searchParams.set('iss', this.config.getOrThrow('API_PUBLIC_URL'));
    return { redirectTo: redirect.toString() };
  }

  async token(req: TokenRequest, basicClientId?: string) {
    return req.grant_type === 'authorization_code' ? this.exchangeCode(req, basicClientId) : this.rotate(req);
  }

  private mcpResource() {
    return this.config.getOrThrow<string>('MCP_PUBLIC_URL');
  }

  private async exchangeCode(req: Extract<TokenRequest, { grant_type: 'authorization_code' }>, _basic?: string) {
    const client = await this.getClient(req.client_id);
    const codeHash = sha256Hex(req.code);

    const result = await this.prisma.$transaction(async (tx) => {
      const auth = await tx.oAuthAuthorization.findUnique({ where: { codeHash } });
      if (!auth || auth.oauthClientId !== client.id) throw new OAuthError('invalid_grant');

      // Single use: atomically claim the code. A concurrent replay updates 0 rows.
      const claimed = await tx.oAuthAuthorization.updateMany({
        where: { id: auth.id, consumedAt: null, expiresAt: { gt: new Date() } },
        data: { consumedAt: new Date() },
      });
      if (claimed.count !== 1) {
        // Replay of a used code: revoke tokens it produced.
        await tx.accessToken.updateMany({ where: { authorizationId: auth.id }, data: { revokedAt: new Date() } });
        throw new OAuthError('invalid_grant', 'Code expired or already used');
      }
      if (auth.redirectUri !== req.redirect_uri) throw new OAuthError('invalid_grant', 'redirect_uri mismatch');
      if (!safeEqual(sha256Base64Url(req.code_verifier), auth.codeChallenge)) {
        throw new OAuthError('invalid_grant', 'PKCE verification failed');
      }
      return this.issue(tx, auth.userId, client.id, auth.websiteId, auth.scope, auth.resource, auth.id);
    });
    return result;
  }

  private async rotate(req: Extract<TokenRequest, { grant_type: 'refresh_token' }>) {
    const client = await this.getClient(req.client_id);
    const hash = sha256Hex(req.refresh_token);
    const outcome = await this.prisma.$transaction(async (tx) => {
      const rt = await tx.refreshToken.findUnique({ where: { tokenHash: hash }, include: { accessToken: true } });
      if (!rt || rt.oauthClientId !== client.id) return { error: 'invalid_grant' as const };

      if (rt.rotatedAt || rt.revokedAt) {
        // Reuse detected -> kill the whole grant.
        await tx.accessToken.updateMany({
          where: { userId: rt.userId, oauthClientId: client.id, websiteId: rt.accessToken.websiteId },
          data: { revokedAt: new Date() },
        });
        await tx.refreshToken.updateMany({
          where: { userId: rt.userId, oauthClientId: client.id },
          data: { revokedAt: new Date() },
        });
        return { error: 'invalid_grant' as const };
      }
      if (rt.expiresAt < new Date()) return { error: 'invalid_grant' as const };

      const claimed = await tx.refreshToken.updateMany({ where: { id: rt.id, rotatedAt: null }, data: { rotatedAt: new Date() } });
      if (claimed.count !== 1) return { error: 'invalid_grant' as const };
      await tx.accessToken.update({ where: { id: rt.accessTokenId }, data: { revokedAt: new Date() } });

      // Rotated tokens keep the *current* site permissions, never more than before.
      const current = new Set(await this.perms.effectiveScopes(rt.accessToken.websiteId));
      const scope = rt.accessToken.scope.split(' ').filter((s) => current.has(s)).join(' ');
      return {
        ok: await this.issue(tx, rt.userId, client.id, rt.accessToken.websiteId, scope, rt.accessToken.audience, rt.accessToken.authorizationId),
      };
    });
    if ('ok' in outcome && outcome.ok) return outcome.ok;
    throw new OAuthError(('error' in outcome && outcome.error) || 'invalid_grant');
  }

  private async issue(
    tx: Prisma.TransactionClient,
    userId: string,
    oauthClientId: string,
    websiteId: string,
    scope: string,
    audience: string | null,
    authorizationId: string | null,
  ) {
    const access = randomToken(32);
    const refresh = randomToken(32);
    const atl = this.config.get<number>('ACCESS_TOKEN_TTL_SECONDS', 3600);
    const rtl = this.config.get<number>('REFRESH_TOKEN_TTL_SECONDS', 2592000);

    const at = await tx.accessToken.create({
      data: {
        tokenHash: sha256Hex(access),
        userId,
        oauthClientId,
        websiteId,
        authorizationId,
        scope,
        audience,
        expiresAt: new Date(Date.now() + atl * 1000),
      },
    });
    await tx.refreshToken.create({
      data: {
        tokenHash: sha256Hex(refresh),
        accessTokenId: at.id,
        userId,
        oauthClientId,
        expiresAt: new Date(Date.now() + rtl * 1000),
      },
    });
    return { access_token: access, token_type: 'Bearer', expires_in: atl, refresh_token: refresh, scope };
  }

  async revoke(token: string) {
    const hash = sha256Hex(token);
    const now = new Date();
    await this.prisma.accessToken.updateMany({ where: { tokenHash: hash }, data: { revokedAt: now } });
    const rt = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
    if (rt) {
      await this.prisma.refreshToken.update({ where: { id: rt.id }, data: { revokedAt: now } });
      await this.prisma.accessToken.update({ where: { id: rt.accessTokenId }, data: { revokedAt: now } });
    }
    return {}; // RFC 7009: always 200
  }

  /** Used by the MCP server on every request. Scope is intersected with live site permissions. */
  async introspect(token: string): Promise<TokenIntrospection> {
    const at = await this.prisma.accessToken.findUnique({ where: { tokenHash: sha256Hex(token) } });
    if (!at || at.revokedAt || at.expiresAt < new Date()) return { active: false };
    const site = await this.prisma.website.findUnique({ where: { id: at.websiteId }, select: { status: true } });
    if (site?.status !== 'CONNECTED') return { active: false };
    const live = new Set(await this.perms.effectiveScopes(at.websiteId));
    return {
      active: true,
      scope: at.scope.split(' ').filter((s) => live.has(s)).join(' '),
      client_id: at.oauthClientId,
      sub: at.userId,
      website_id: at.websiteId,
      exp: Math.floor(at.expiresAt.getTime() / 1000),
    };
  }
}
