import { assertFound, ok, withApiErrors } from "@/lib/api-route";
import { requireSession } from "@/lib/session";
import { userService } from "@/services";

export const GET = withApiErrors(async (request: Request) => {
  const { userId, organizationId } = await requireSession(request);
  const user = assertFound(await userService.getById(organizationId, userId));
  return ok(user);
});
