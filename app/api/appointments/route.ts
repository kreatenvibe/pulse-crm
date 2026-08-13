import { created, ok, readJson, withApiErrors } from "@/lib/api-route";
import { appointmentService } from "@/services";

export const GET = withApiErrors(async () => {
  const appointments = await appointmentService.getAll();
  return ok(appointments);
});

export const POST = withApiErrors(async (request: Request) => {
  const body = await readJson(request);
  const appointment = await appointmentService.create(body);
  return created(appointment);
});
