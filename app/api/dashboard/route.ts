import { dashboardService } from "@/services";

export async function GET() {
  const summary = await dashboardService.getSummary();
  return Response.json(summary);
}
