import { created, ok, readJson, withApiErrors } from "@/lib/api-route";
import { invoiceService } from "@/services";

export const GET = withApiErrors(async () => {
  const invoices = await invoiceService.getAll();
  return ok(invoices);
});

export const POST = withApiErrors(async (request: Request) => {
  const body = await readJson(request);
  const invoice = await invoiceService.create(body);
  return created(invoice);
});
