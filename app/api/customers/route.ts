import { customerService } from "@/services";

export async function GET() {
  const customers = await customerService.getAll();
  return Response.json(customers);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const customer = await customerService.create(body);
    return Response.json(customer, { status: 201 });
  } catch {
    return Response.json({ error: "Bad Request" }, { status: 400 });
  }
}
