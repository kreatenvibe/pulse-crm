import { serviceErrorResponse } from "@/lib/api-route";
import { taskService } from "@/services";

type Params = Promise<{ id: string }>;

export async function GET(
  _request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  const task = await taskService.getById(id);
  if (!task) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }
  return Response.json(task);
}

export async function PATCH(
  request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const task = await taskService.update(id, body);
    if (!task) {
      return Response.json({ error: "Not Found" }, { status: 404 });
    }
    return Response.json(task);
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  const deleted = await taskService.delete(id);
  if (!deleted) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
