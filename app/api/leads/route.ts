import { leadService } from "@/services";

export async function GET() {
  const leads = await leadService.getAll();
  return Response.json(leads);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lead = await leadService.create(body);
    return Response.json(lead, { status: 201 });
  } catch {
    return Response.json({ error: "Bad Request" }, { status: 400 });
  }
}
