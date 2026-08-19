import { created, ok, readJson, withApiErrors } from "@/lib/api-route";
import { requireSession } from "@/lib/session";
import { taskService } from "@/services";

export const GET = withApiErrors(async (request: Request) => {
  const { organizationId } = await requireSession(request);
  const tasks = await taskService.getAll(organizationId);
  return ok(tasks);
});

export const POST = withApiErrors(async (request: Request) => {
  const { organizationId } = await requireSession(request);
  const body = await readJson(request);
  const task = await taskService.create(organizationId, body);
  return created(task);
});
