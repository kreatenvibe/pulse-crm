import {
  assertFound,
  noContent,
  ok,
  readJson,
  withApiErrors,
} from "@/lib/api-route";
import { requireSession } from "@/lib/session";
import { activityService } from "@/services";

type Params = Promise<{ id: string }>;

export const GET = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { organizationId } = await requireSession(request);
    const { id } = await params;
    const activity = assertFound(
      await activityService.getById(organizationId, id),
      "Activity not found",
    );
    return ok(activity);
  },
);

export const PATCH = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { organizationId } = await requireSession(request);
    const { id } = await params;
    const body = await readJson(request);
    const activity = assertFound(
      await activityService.update(organizationId, id, body),
      "Activity not found",
    );
    return ok(activity);
  },
);

export const DELETE = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { organizationId } = await requireSession(request);
    const { id } = await params;
    assertFound(await activityService.delete(organizationId, id), "Activity not found");
    return noContent();
  },
);
