import {
  assertFound,
  noContent,
  ok,
  readJson,
  withApiErrors,
} from "@/lib/api-route";
import { invoiceService } from "@/services";

type Params = Promise<{ id: string }>;

export const GET = withApiErrors(
  async (_request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    const invoice = assertFound(
      await invoiceService.getById(id),
      "Invoice not found",
    );
    return ok(invoice);
  },
);

export const PATCH = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    const body = await readJson(request);
    const invoice = assertFound(
      await invoiceService.update(id, body),
      "Invoice not found",
    );
    return ok(invoice);
  },
);

export const DELETE = withApiErrors(
  async (_request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    assertFound(await invoiceService.delete(id), "Invoice not found");
    return noContent();
  },
);
