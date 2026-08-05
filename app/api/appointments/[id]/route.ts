import { serviceErrorResponse } from "@/lib/api-route";
import { appointmentService } from "@/services";

type Params = Promise<{ id: string }>;

export async function GET(
  _request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  const appointment = await appointmentService.getById(id);
  if (!appointment) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }
  return Response.json(appointment);
}

export async function PATCH(
  request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const appointment = await appointmentService.update(id, body);
    if (!appointment) {
      return Response.json({ error: "Not Found" }, { status: 404 });
    }
    return Response.json(appointment);
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  const deleted = await appointmentService.delete(id);
  if (!deleted) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
