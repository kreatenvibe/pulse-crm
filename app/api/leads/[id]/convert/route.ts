import { ok, withApiErrors } from "@/lib/api-route";
import { requireSession } from "@/lib/session";
import { leadService } from "@/services";

type Params = Promise<{ id: string }>;

export const POST = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { organizationId } = await requireSession(request);
    const { id } = await params;
    const result = await leadService.convert(organizationId, id);
    return ok(result);
  },
);
