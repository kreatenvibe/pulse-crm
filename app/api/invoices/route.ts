import { invoiceService } from "@/services";

export async function GET() {
  const invoices = await invoiceService.getAll();
  return Response.json(invoices);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const invoice = await invoiceService.create(body);
    return Response.json(invoice, { status: 201 });
  } catch {
    return Response.json({ error: "Bad Request" }, { status: 400 });
  }
}
