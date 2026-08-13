import { assertFound, ok, withApiErrors } from "@/lib/api-route";
import { leadService } from "@/services";

type Params = Promise<{ id: string }>;

export const GET = withApiErrors(
  async (_request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    const details = assertFound(
      await leadService.getDetails(id),
      "Lead not found",
    );
    return ok(details);
  },
);
