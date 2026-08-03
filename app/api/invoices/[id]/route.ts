import { invoiceService } from "@/services";

type Params = Promise<{ id: string }>;

export async function GET(
  _request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  const invoice = await invoiceService.getById(id);
  if (!invoice) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }
  return Response.json(invoice);
}

export async function PATCH(
  request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const invoice = await invoiceService.update(id, body);
    if (!invoice) {
      return Response.json({ error: "Not Found" }, { status: 404 });
    }
    return Response.json(invoice);
  } catch {
    return Response.json({ error: "Bad Request" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  const deleted = await invoiceService.delete(id);
  if (!deleted) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
