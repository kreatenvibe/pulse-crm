import { ok, withApiErrors } from "@/lib/api-route";
import { reportService } from "@/services";

export const GET = withApiErrors(async () => {
  const summary = await reportService.getSummary();
  return ok(summary);
});
