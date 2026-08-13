import { created, ok, readJson, withApiErrors } from "@/lib/api-route";
import { taskService } from "@/services";

export const GET = withApiErrors(async () => {
  const tasks = await taskService.getAll();
  return ok(tasks);
});

export const POST = withApiErrors(async (request: Request) => {
  const body = await readJson(request);
  const task = await taskService.create(body);
  return created(task);
});
