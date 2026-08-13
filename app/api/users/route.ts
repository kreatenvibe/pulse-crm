import { ok, withApiErrors } from "@/lib/api-route";
import { userService } from "@/services";

export const GET = withApiErrors(async () => {
  // Full collection for assignment pickers (assignedTo comboboxes).
  const users = await userService.getAll();
  return ok(users);
});
