import { created, ok, readJson, withApiErrors } from "@/lib/api-route";
import { activityService } from "@/services";

export const GET = withApiErrors(async () => {
  const activities = await activityService.getAll();
  return ok(activities);
});

export const POST = withApiErrors(async (request: Request) => {
  const body = await readJson(request);
  const activity = await activityService.create(body);
  return created(activity);
});
