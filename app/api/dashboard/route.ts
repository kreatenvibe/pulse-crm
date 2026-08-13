import { ok, withApiErrors } from "@/lib/api-route";
import { dashboardService } from "@/services";

export const GET = withApiErrors(async () => {
  const summary = await dashboardService.getSummary();
  return ok(summary);
});
