# WPConnect AI – Web

Next.js dashboard + NestJS API + MCP server + MySQL 8 (no Docker). Requires Node 20+.

## Local development

```bash
npm install
npm run setup        # creates .env with secrets, creates tables, seeds plans/scopes
npm run web          # web :3000, api :4000, mcp :4100 with hot reload
npm run create-admin # create a super admin (asks for email + password)
```

## Production — one repo, one domain, one process

Works on any Node.js host that deploys from Git (Hostinger Node.js apps, Render, Railway, a VPS…).

| Setting on the host | Value |
|---|---|
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Node version | 20 or newer |

Environment variables (hosting panel or a `.env` file):

```
PUBLIC_URL=https://yourdomain.com
DB_HOST=...   DB_PORT=3306   DB_NAME=...   DB_USER=...   DB_PASSWORD=...
JWT_SECRET=<48+ random chars>
INTERNAL_API_KEY=<48+ random chars>
SITE_SECRET_ENCRYPTION_KEY=<32 random bytes, base64>
```

Generate the secrets locally with:

```bash
node -e "const c=require('crypto');console.log('JWT_SECRET='+c.randomBytes(48).toString('base64url'));console.log('INTERNAL_API_KEY='+c.randomBytes(48).toString('base64url'));console.log('SITE_SECRET_ENCRYPTION_KEY='+c.randomBytes(32).toString('base64'))"
```

`npm start` runs `server.mjs`: it syncs the database, starts the three apps on private ports
and serves everything on the host's `PORT`:

| URL | Goes to |
|---|---|
| `https://yourdomain.com/` | Landing page, login, dashboard, `/admin` |
| `https://yourdomain.com/v1/...` | API (the WordPress plugin pairs here) |
| `https://yourdomain.com/mcp` | MCP server — add this URL in Claude / ChatGPT |

The site must be served over **HTTPS** (login cookies are `Secure` in production).
Set `AUTO_MIGRATE=false` to skip the automatic database sync on start.
