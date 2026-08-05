import { serviceErrorResponse } from "@/lib/api-route";
import { activityService } from "@/services";

export async function GET() {
  const activities = await activityService.getAll();
  return Response.json(activities);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const activity = await activityService.create(body);
    return Response.json(activity, { status: 201 });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
