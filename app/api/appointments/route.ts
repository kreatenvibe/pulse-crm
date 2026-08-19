import { created, ok, readJson, withApiErrors } from "@/lib/api-route";
import { requireSession } from "@/lib/session";
import { appointmentService } from "@/services";

export const GET = withApiErrors(async (request: Request) => {
  const { organizationId } = await requireSession(request);
  const appointments = await appointmentService.getAll(organizationId);
  return ok(appointments);
});

export const POST = withApiErrors(async (request: Request) => {
  const { organizationId } = await requireSession(request);
  const body = await readJson(request);
  const appointment = await appointmentService.create(organizationId, body);
  return created(appointment);
});
