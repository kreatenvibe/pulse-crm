import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-cookie";

/**
 * Route gating ONLY — does a plausibly-valid session cookie exist? No DB
 * query, no tenant/role logic (that's `requireSession` in every API route,
 * per plan.md §8). `/api/**` is excluded from `config.matcher` entirely so
 * unauthenticated API callers get a real 401 JSON body from their route's
 * own `requireSession` call, not an HTML redirect a `fetch()` can't follow.
 *
 * Named `proxy` (not `middleware`) — Next.js 16 renamed the file convention;
 * see node_modules/next/dist/docs/.../file-conventions/proxy.md.
 */

const PUBLIC_PATHS = new Set(["/", "/login", "/signup"]);

export function proxy(request: NextRequest): NextResponse {
  if (PUBLIC_PATHS.has(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (!request.cookies.has(SESSION_COOKIE_NAME)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
