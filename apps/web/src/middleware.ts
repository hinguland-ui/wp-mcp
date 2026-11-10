import { NextRequest, NextResponse } from 'next/server';
import { homeFor, roleFromToken } from '@/lib/role';

// "/" (the landing page) is always public and is what visitors see first.
const PUBLIC = ['/', '/login', '/register', '/forgot-password'];
const AUTH_PAGES = ['/login', '/register', '/forgot-password'];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get('wpc_session')?.value;

  if (!token && !PUBLIC.includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  // Already signed in → skip the login/register pages and go to the right home for the role.
  if (token && AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL(homeFor(roleFromToken(token)), req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next|favicon.ico|api).*)'] };
