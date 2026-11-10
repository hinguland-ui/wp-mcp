import { BadGatewayException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hmacHex, open, sha256Hex } from '../../common/crypto';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Signed server-to-server calls to the WordPress plugin REST namespace /wp-json/wpconnect/v1.
 * Signature: HMAC-SHA256(siteSecret, `${ts}.${METHOD}.${path}.${sha256(body)}`)
 */
@Injectable()
export class WordPressClient {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async call(websiteId: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown) {
    const [site, conn] = await Promise.all([
      this.prisma.website.findUnique({ where: { id: websiteId } }),
      this.prisma.websiteConnection.findUnique({ where: { websiteId } }),
    ]);
    if (!site || !conn?.encryptedSiteSecret) throw new NotFoundException('Website is not connected');

    const secret = open(conn.encryptedSiteSecret, this.config.getOrThrow('SITE_SECRET_ENCRYPTION_KEY'));
    const payload = body === undefined ? '' : JSON.stringify(body);
    const ts = Math.floor(Date.now() / 1000).toString();
    const sig = hmacHex(secret, `${ts}.${method}.${path}.${sha256Hex(payload)}`);

    const res = await fetch(`${site.url}/wp-json/wpconnect/v1${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        'x-wpconnect-site': websiteId,
        'x-wpconnect-timestamp': ts,
        'x-wpconnect-signature': sig,
      },
      body: payload || undefined,
      signal: AbortSignal.timeout(20_000),
      redirect: 'error', // never follow redirects with a signed request
    }).catch((e) => {
      throw new BadGatewayException(`WordPress unreachable: ${(e as Error).message}`);
    });

    const text = await res.text();
    const json = text ? safeJson(text) : null;
    if (!res.ok) throw new BadGatewayException({ message: 'WordPress error', status: res.status, body: json });
    return json;
  }
}

function safeJson(t: string) {
  try {
    return JSON.parse(t);
  } catch {
    return { raw: t.slice(0, 2000) };
  }
}
