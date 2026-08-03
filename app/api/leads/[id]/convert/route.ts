import { leadService } from "@/services";

type Params = Promise<{ id: string }>;

export async function POST(
  _request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;

  try {
    const result = await leadService.convert(id);
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not convert lead";

    if (message === "Lead not found") {
      return Response.json({ error: "Not Found" }, { status: 404 });
    }

    return Response.json({ error: message }, { status: 400 });
  }
}
