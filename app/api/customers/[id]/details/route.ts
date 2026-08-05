import { customerService } from "@/services";

type Params = Promise<{ id: string }>;

export async function GET(
  _request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  const details = await customerService.getDetails(id);

  if (!details) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  return Response.json(details);
}
