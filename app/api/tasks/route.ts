import { taskService } from "@/services";

export async function GET() {
  const tasks = await taskService.getAll();
  return Response.json(tasks);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const task = await taskService.create(body);
    return Response.json(task, { status: 201 });
  } catch {
    return Response.json({ error: "Bad Request" }, { status: 400 });
  }
}
