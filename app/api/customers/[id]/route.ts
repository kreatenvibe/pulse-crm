import {
  assertFound,
  noContent,
  ok,
  readJson,
  withApiErrors,
} from "@/lib/api-route";
import { requireSession } from "@/lib/session";
import { customerService } from "@/services";

type Params = Promise<{ id: string }>;

export const GET = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { organizationId } = await requireSession(request);
    const { id } = await params;
    const customer = assertFound(
      await customerService.getById(organizationId, id),
      "Customer not found",
    );
    return ok(customer);
  },
);

export const PATCH = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { organizationId } = await requireSession(request);
    const { id } = await params;
    const body = await readJson(request);
    const customer = assertFound(
      await customerService.update(organizationId, id, body),
      "Customer not found",
    );
    return ok(customer);
  },
);

export const DELETE = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { organizationId } = await requireSession(request);
    const { id } = await params;
    assertFound(await customerService.delete(organizationId, id), "Customer not found");
    return noContent();
  },
);
