import { serviceService } from "@/services";

type Params = Promise<{ id: string }>;

export async function GET(
  _request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  const service = await serviceService.getById(id);
  if (!service) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }
  return Response.json(service);
}

export async function PATCH(
  request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const service = await serviceService.update(id, body);
    if (!service) {
      return Response.json({ error: "Not Found" }, { status: 404 });
    }
    return Response.json(service);
  } catch {
    return Response.json({ error: "Bad Request" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  const deleted = await serviceService.delete(id);
  if (!deleted) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
