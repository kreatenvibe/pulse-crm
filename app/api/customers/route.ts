import { created, ok, readJson, withApiErrors } from "@/lib/api-route";
import { customerService } from "@/services";

export const GET = withApiErrors(async () => {
  const customers = await customerService.getAll();
  return ok(customers);
});

export const POST = withApiErrors(async (request: Request) => {
  const body = await readJson(request);
  const customer = await customerService.create(body);
  return created(customer);
});
