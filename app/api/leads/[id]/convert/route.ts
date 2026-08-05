import { serviceErrorResponse } from "@/lib/api-route";
import { leadService } from "@/services";

type Params = Promise<{ id: string }>;

export async function POST(
  _request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;

  try {
    const result = await leadService.convert(id);
    return Response.json(result);
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
