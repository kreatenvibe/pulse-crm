import { assertFound, ok, withApiErrors } from "@/lib/api-route";
import { customerService } from "@/services";

type Params = Promise<{ id: string }>;

export const GET = withApiErrors(
  async (_request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    const details = assertFound(
      await customerService.getDetails(id),
      "Customer not found",
    );
    return ok(details);
  },
);
