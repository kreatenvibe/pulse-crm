import {
  assertFound,
  noContent,
  ok,
  readJson,
  withApiErrors,
} from "@/lib/api-route";
import { activityService } from "@/services";

type Params = Promise<{ id: string }>;

export const GET = withApiErrors(
  async (_request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    const activity = assertFound(
      await activityService.getById(id),
      "Activity not found",
    );
    return ok(activity);
  },
);

export const PATCH = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    const body = await readJson(request);
    const activity = assertFound(
      await activityService.update(id, body),
      "Activity not found",
    );
    return ok(activity);
  },
);

export const DELETE = withApiErrors(
  async (_request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    assertFound(await activityService.delete(id), "Activity not found");
    return noContent();
  },
);
