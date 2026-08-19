import { ok, withApiErrors } from "@/lib/api-route";
import { requireSession } from "@/lib/session";
import { userService } from "@/services";

export const GET = withApiErrors(async (request: Request) => {
  const { organizationId } = await requireSession(request);
  // Org-scoped collection for assignment pickers (assignedTo comboboxes).
  const users = await userService.getAll(organizationId);
  return ok(users);
});
