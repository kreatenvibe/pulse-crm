import { created, ok, readJson, withApiErrors } from "@/lib/api-route";
import { requireSession } from "@/lib/session";
import { customerService } from "@/services";

export const GET = withApiErrors(async (request: Request) => {
  const { organizationId } = await requireSession(request);
  const customers = await customerService.getAll(organizationId);
  return ok(customers);
});

export const POST = withApiErrors(async (request: Request) => {
  const { organizationId } = await requireSession(request);
  const body = await readJson(request);
  const customer = await customerService.create(organizationId, body);
  return created(customer);
});
