import { serviceErrorResponse } from "@/lib/api-route";
import { noteService } from "@/services";

export async function GET() {
  const notes = await noteService.getAll();
  return Response.json(notes);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const note = await noteService.create(body);
    return Response.json(note, { status: 201 });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
