import { activityService } from "@/services";

type Params = Promise<{ id: string }>;

export async function GET(
  _request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  const activity = await activityService.getById(id);
  if (!activity) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }
  return Response.json(activity);
}

export async function PATCH(
  request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const activity = await activityService.update(id, body);
    if (!activity) {
      return Response.json({ error: "Not Found" }, { status: 404 });
    }
    return Response.json(activity);
  } catch {
    return Response.json({ error: "Bad Request" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  const deleted = await activityService.delete(id);
  if (!deleted) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
