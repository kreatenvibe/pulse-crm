import {
  assertFound,
  noContent,
  ok,
  readJson,
  withApiErrors,
} from "@/lib/api-route";
import { serviceService } from "@/services";

type Params = Promise<{ id: string }>;

export const GET = withApiErrors(
  async (_request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    const service = assertFound(
      await serviceService.getById(id),
      "Service not found",
    );
    return ok(service);
  },
);

export const PATCH = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    const body = await readJson(request);
    const service = assertFound(
      await serviceService.update(id, body),
      "Service not found",
    );
    return ok(service);
  },
);

export const DELETE = withApiErrors(
  async (_request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    assertFound(await serviceService.delete(id), "Service not found");
    return noContent();
  },
);
