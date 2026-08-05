import { serviceErrorResponse } from "@/lib/api-route";
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
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
