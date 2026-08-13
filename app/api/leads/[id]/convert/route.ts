import { ok, withApiErrors } from "@/lib/api-route";
import { leadService } from "@/services";

type Params = Promise<{ id: string }>;

export const POST = withApiErrors(
  async (_request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    const result = await leadService.convert(id);
    return ok(result);
  },
);
