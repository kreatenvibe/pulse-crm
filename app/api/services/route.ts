import { created, ok, readJson, withApiErrors } from "@/lib/api-route";
import { requireSession } from "@/lib/session";
import { serviceService } from "@/services";

export const GET = withApiErrors(async (request: Request) => {
  const { organizationId } = await requireSession(request);
  const services = await serviceService.getAll(organizationId);
  return ok(services);
});

export const POST = withApiErrors(async (request: Request) => {
  const { organizationId } = await requireSession(request);
  const body = await readJson(request);
  const service = await serviceService.create(organizationId, body);
  return created(service);
});
