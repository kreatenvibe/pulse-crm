import { cookies } from "next/headers";

/**
 * httpOnly session cookie mechanics for the three auth routes (signup,
 * login, logout) — set on signup/login, cleared on logout.
 *
 * Reading this cookie to authenticate *other* routes (`requireSession`,
 * `middleware.ts`) is a later milestone; this file only knows how to
 * get/set/clear the cookie itself, mirroring how `lib/api-route.ts` is the
 * one place HTTP-response concerns live for the rest of the API.
 */

export const SESSION_COOKIE_NAME = "pulse_session";

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

export async function getSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value;
}
