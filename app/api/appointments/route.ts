import { serviceErrorResponse } from "@/lib/api-route";
import { appointmentService } from "@/services";

export async function GET() {
  const appointments = await appointmentService.getAll();
  return Response.json(appointments);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const appointment = await appointmentService.create(body);
    return Response.json(appointment, { status: 201 });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
