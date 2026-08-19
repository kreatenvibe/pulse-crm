import { authService, type SessionContext } from "@/services";
import { SESSION_COOKIE_NAME } from "./auth-cookie";

export type { SessionContext };

/**
 * Resolve the authenticated session for an incoming API request.
 *
 * Reads the opaque session cookie straight off `request.headers` (works for
 * the plain `Request` every route handler in this codebase is typed with),
 * looks it up in PostgreSQL via `authService.getSessionContext`, and returns
 * `{ userId, organizationId, role }`. Throws `ServiceError("UNAUTHORIZED")`
 * for a missing, unknown, expired, or deactivated-user session — the
 * existing `withApiErrors` wrapper turns that into a 401 with no extra code
 * at the call site, exactly like every other `ServiceError` today.
 *
 * This is the one place that turns "a cookie was sent" into "a real,
 * currently-valid session" for API routes; `proxy.ts` only checks that a
 * cookie is *present* (no DB query) before letting a dashboard page render.
 */
export async function requireSession(request: Request): Promise<SessionContext> {
  const token = readSessionCookie(request);
  return authService.getSessionContext(token);
}

function readSessionCookie(request: Request): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;

  for (const pair of header.split(";")) {
    const separatorIndex = pair.indexOf("=");
    if (separatorIndex === -1) continue;
    const name = pair.slice(0, separatorIndex).trim();
    if (name === SESSION_COOKIE_NAME) {
      return decodeURIComponent(pair.slice(separatorIndex + 1).trim());
    }
  }
  return undefined;
}
