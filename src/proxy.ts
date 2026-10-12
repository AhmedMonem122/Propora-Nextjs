import { NextResponse } from 'next/server';

/**
 * Auth gating note: the backend is a FROZEN cross-origin API
 * (`https://propora-nestjs-postegresql.vercel.app`). Its refresh cookie
 * (`propora_refresh_token`) is host-bound to the API domain, so this
 * frontend origin (localhost / another Vercel host) can NEVER see it —
 * gating dashboard routes on that cookie would bounce even logged-in users
 * back to /login on every navigation (verified live).
 *
 * Route protection therefore lives in the client dashboard layout
 * (`src/app/(dashboard)/layout.tsx`: unauthenticated → `/login?next=…`),
 * backed by `/auth/me` + `hasPermission()`. UI gating is UX only —
 * authorization is enforced by the backend on every request.
 *
 * If the frontend and API ever share one domain, re-enable cookie gating here.
 */
export default function proxy(): NextResponse {
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/billing/:path*'],
};
