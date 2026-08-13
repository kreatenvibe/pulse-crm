import {
  assertFound,
  noContent,
  ok,
  readJson,
  withApiErrors,
} from "@/lib/api-route";
import { appointmentService } from "@/services";

type Params = Promise<{ id: string }>;

export const GET = withApiErrors(
  async (_request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    const appointment = assertFound(
      await appointmentService.getById(id),
      "Appointment not found",
    );
    return ok(appointment);
  },
);

export const PATCH = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    const body = await readJson(request);
    const appointment = assertFound(
      await appointmentService.update(id, body),
      "Appointment not found",
    );
    return ok(appointment);
  },
);

export const DELETE = withApiErrors(
  async (_request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    assertFound(await appointmentService.delete(id), "Appointment not found");
    return noContent();
  },
);
