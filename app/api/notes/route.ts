import { created, ok, readJson, withApiErrors } from "@/lib/api-route";
import { noteService } from "@/services";

export const GET = withApiErrors(async () => {
  const notes = await noteService.getAll();
  return ok(notes);
});

export const POST = withApiErrors(async (request: Request) => {
  const body = await readJson(request);
  const note = await noteService.create(body);
  return created(note);
});
