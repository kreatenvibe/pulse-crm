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
  } catch {
    return Response.json({ error: "Bad Request" }, { status: 400 });
  }
}
