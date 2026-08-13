import { created, ok, readJson, withApiErrors } from "@/lib/api-route";
import { serviceService } from "@/services";

export const GET = withApiErrors(async () => {
  const services = await serviceService.getAll();
  return ok(services);
});

export const POST = withApiErrors(async (request: Request) => {
  const body = await readJson(request);
  const service = await serviceService.create(body);
  return created(service);
});
