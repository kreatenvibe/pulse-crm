import {
  assertFound,
  noContent,
  ok,
  readJson,
  withApiErrors,
} from "@/lib/api-route";
import { noteService } from "@/services";

type Params = Promise<{ id: string }>;

export const GET = withApiErrors(
  async (_request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    const note = assertFound(await noteService.getById(id), "Note not found");
    return ok(note);
  },
);

export const PATCH = withApiErrors(
  async (request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    const body = await readJson(request);
    const note = assertFound(
      await noteService.update(id, body),
      "Note not found",
    );
    return ok(note);
  },
);

export const DELETE = withApiErrors(
  async (_request: Request, { params }: { params: Params }) => {
    const { id } = await params;
    assertFound(await noteService.delete(id), "Note not found");
    return noContent();
  },
);
