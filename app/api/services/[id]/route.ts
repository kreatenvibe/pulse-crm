import {
  assertFound,
  noContent,
  ok,
  readJson,
  withApiErrors,
} from "@/lib/api-route";
import { requireSession } from "@/lib/session";
import { serviceService } from "@/services";

type Params = Promise<{ id: string }>;

export const GET = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { organizationId } = await requireSession(request);
    const { id } = await params;
    const service = assertFound(
      await serviceService.getById(organizationId, id),
      "Service not found",
    );
    return ok(service);
  },
);

export const PATCH = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { organizationId } = await requireSession(request);
    const { id } = await params;
    const body = await readJson(request);
    const service = assertFound(
      await serviceService.update(organizationId, id, body),
      "Service not found",
    );
    return ok(service);
  },
);

export const DELETE = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { organizationId } = await requireSession(request);
    const { id } = await params;
    assertFound(await serviceService.delete(organizationId, id), "Service not found");
    return noContent();
  },
);
