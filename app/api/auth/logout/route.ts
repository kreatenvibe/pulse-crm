import { noContent, withApiErrors } from "@/lib/api-route";
import { clearSessionCookie, getSessionToken } from "@/lib/auth-cookie";
import { authService } from "@/services";

export const POST = withApiErrors(async () => {
  const token = await getSessionToken();
  await authService.logout(token);
  await clearSessionCookie();
  return noContent();
});
