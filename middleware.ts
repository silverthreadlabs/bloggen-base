// middleware.ts

import { getSessionCookie } from 'better-auth/cookies';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/accept-invitation')
  ) {
    const sessionCookie = getSessionCookie(req);
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/settings/:path*',
    '/accept-invitation/:path*',
  ],
};
