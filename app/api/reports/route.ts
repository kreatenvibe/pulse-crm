import { ok, withApiErrors } from "@/lib/api-route";
import { requireSession } from "@/lib/session";
import { reportService } from "@/services";

export const GET = withApiErrors(async (request: Request) => {
  const { organizationId } = await requireSession(request);
  const summary = await reportService.getSummary(organizationId);
  return ok(summary);
});
