import { NextResponse, type NextRequest } from 'next/server';
import { REFRESH_COOKIE_NAME } from '@/lib/constants';

/**
 * Auth gating (Node runtime): dashboard routes require the refresh cookie.
 * Missing → /login?next=… Fine-grained gating via hasPermission() from /me.
 */
export default function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/billing');
  if (!isDashboard) return NextResponse.next();
  const hasSession = request.cookies.has(REFRESH_COOKIE_NAME);
  if (hasSession) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/dashboard/:path*', '/billing/:path*'],
};
