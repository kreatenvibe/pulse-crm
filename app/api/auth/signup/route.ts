import { created, readJson, withApiErrors } from "@/lib/api-route";
import { setSessionCookie } from "@/lib/auth-cookie";
import { authService } from "@/services";

export const POST = withApiErrors(async (request: Request) => {
  const body = await readJson(request);
  const { user, token, expiresAt } = await authService.signup(body);
  await setSessionCookie(token, expiresAt);
  return created(user);
});
