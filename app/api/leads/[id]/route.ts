import { serviceErrorResponse } from "@/lib/api-route";
import { leadService } from "@/services";

type Params = Promise<{ id: string }>;

export async function GET(
  _request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  const lead = await leadService.getById(id);
  if (!lead) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }
  return Response.json(lead);
}

export async function PATCH(
  request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const lead = await leadService.update(id, body);
    if (!lead) {
      return Response.json({ error: "Not Found" }, { status: 404 });
    }
    return Response.json(lead);
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  try {
    const deleted = await leadService.delete(id);
    if (!deleted) {
      return Response.json({ error: "Not Found" }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
