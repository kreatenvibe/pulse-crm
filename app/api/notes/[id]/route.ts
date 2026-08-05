import { serviceErrorResponse } from "@/lib/api-route";
import { noteService } from "@/services";

type Params = Promise<{ id: string }>;

export async function GET(
  _request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  const note = await noteService.getById(id);
  if (!note) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }
  return Response.json(note);
}

export async function PATCH(
  request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const note = await noteService.update(id, body);
    if (!note) {
      return Response.json({ error: "Not Found" }, { status: 404 });
    }
    return Response.json(note);
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  const deleted = await noteService.delete(id);
  if (!deleted) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
