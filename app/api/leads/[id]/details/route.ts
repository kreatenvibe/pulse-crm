import { assertFound, ok, withApiErrors } from "@/lib/api-route";
import { requireSession } from "@/lib/session";
import { leadService } from "@/services";

type Params = Promise<{ id: string }>;

export const GET = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { organizationId } = await requireSession(request);
    const { id } = await params;
    const details = assertFound(
      await leadService.getDetails(organizationId, id),
      "Lead not found",
    );
    return ok(details);
  },
);
