import { customerService } from "@/services";

type Params = Promise<{ id: string }>;

export async function GET(
  _request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  const customer = await customerService.getById(id);
  if (!customer) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }
  return Response.json(customer);
}

export async function PATCH(
  request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const customer = await customerService.update(id, body);
    if (!customer) {
      return Response.json({ error: "Not Found" }, { status: 404 });
    }
    return Response.json(customer);
  } catch {
    return Response.json({ error: "Bad Request" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  const deleted = await customerService.delete(id);
  if (!deleted) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
