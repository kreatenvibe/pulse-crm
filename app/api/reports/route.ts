import { reportService } from "@/services";

export async function GET() {
  const summary = await reportService.getSummary();
  return Response.json(summary);
}
