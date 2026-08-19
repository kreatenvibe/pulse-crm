import {
  assertFound,
  noContent,
  ok,
  readJson,
  withApiErrors,
} from "@/lib/api-route";
import { requireSession } from "@/lib/session";
import { invoiceService } from "@/services";

type Params = Promise<{ id: string }>;

export const GET = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { organizationId } = await requireSession(request);
    const { id } = await params;
    const invoice = assertFound(
      await invoiceService.getById(organizationId, id),
      "Invoice not found",
    );
    return ok(invoice);
  },
);

export const PATCH = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { organizationId } = await requireSession(request);
    const { id } = await params;
    const body = await readJson(request);
    const invoice = assertFound(
      await invoiceService.update(organizationId, id, body),
      "Invoice not found",
    );
    return ok(invoice);
  },
);

export const DELETE = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { organizationId } = await requireSession(request);
    const { id } = await params;
    assertFound(await invoiceService.delete(organizationId, id), "Invoice not found");
    return noContent();
  },
);
