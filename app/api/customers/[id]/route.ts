import {
  assertFound,
  noContent,
  ok,
  readJson,
  withApiErrors,
} from "@/lib/api-route";
import { customerService } from "@/services";

type Params = Promise<{ id: string }>;

export const GET = withApiErrors(
  async (_request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    const customer = assertFound(
      await customerService.getById(id),
      "Customer not found",
    );
    return ok(customer);
  },
);

export const PATCH = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    const body = await readJson(request);
    const customer = assertFound(
      await customerService.update(id, body),
      "Customer not found",
    );
    return ok(customer);
  },
);

export const DELETE = withApiErrors(
  async (_request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    assertFound(await customerService.delete(id), "Customer not found");
    return noContent();
  },
);
