import { serviceService } from "@/services";

export async function GET() {
  const services = await serviceService.getAll();
  return Response.json(services);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const service = await serviceService.create(body);
    return Response.json(service, { status: 201 });
  } catch {
    return Response.json({ error: "Bad Request" }, { status: 400 });
  }
}
