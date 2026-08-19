import {
  assertFound,
  noContent,
  ok,
  readJson,
  withApiErrors,
} from "@/lib/api-route";
import { requireSession } from "@/lib/session";
import { leadService } from "@/services";

type Params = Promise<{ id: string }>;

export const GET = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { organizationId } = await requireSession(request);
    const { id } = await params;
    const lead = assertFound(
      await leadService.getById(organizationId, id),
      "Lead not found",
    );
    return ok(lead);
  },
);

export const PATCH = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { organizationId } = await requireSession(request);
    const { id } = await params;
    const body = await readJson(request);
    const lead = assertFound(
      await leadService.update(organizationId, id, body),
      "Lead not found",
    );
    return ok(lead);
  },
);

export const DELETE = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { organizationId } = await requireSession(request);
    const { id } = await params;
    assertFound(await leadService.delete(organizationId, id), "Lead not found");
    return noContent();
  },
);
