import { created, ok, readJson, withApiErrors } from "@/lib/api-route";
import { requireSession } from "@/lib/session";
import { activityService } from "@/services";

export const GET = withApiErrors(async (request: Request) => {
  const { organizationId } = await requireSession(request);
  const activities = await activityService.getAll(organizationId);
  return ok(activities);
});

export const POST = withApiErrors(async (request: Request) => {
  const { organizationId } = await requireSession(request);
  const body = await readJson(request);
  const activity = await activityService.create(organizationId, body);
  return created(activity);
});
