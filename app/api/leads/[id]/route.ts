import {
  assertFound,
  noContent,
  ok,
  readJson,
  withApiErrors,
} from "@/lib/api-route";
import { leadService } from "@/services";

type Params = Promise<{ id: string }>;

export const GET = withApiErrors(
  async (_request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    const lead = assertFound(await leadService.getById(id), "Lead not found");
    return ok(lead);
  },
);

export const PATCH = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    const body = await readJson(request);
    const lead = assertFound(
      await leadService.update(id, body),
      "Lead not found",
    );
    return ok(lead);
  },
);

export const DELETE = withApiErrors(
  async (_request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    assertFound(await leadService.delete(id), "Lead not found");
    return noContent();
  },
);
