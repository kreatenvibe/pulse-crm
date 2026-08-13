import { created, ok, okPaginated, readJson, withApiErrors } from "@/lib/api-route";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { leadService } from "@/services";

export const GET = withApiErrors(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");

  // Paginated contract: GET /api/leads?page=1&pageSize=10 → { data, pagination }
  if (pageParam !== null || pageSizeParam !== null) {
    const page = pageParam !== null ? Number(pageParam) : 1;
    const pageSize =
      pageSizeParam !== null ? Number(pageSizeParam) : DEFAULT_PAGE_SIZE;
    const result = await leadService.list({ page, pageSize });
    return okPaginated(result);
  }

  // Full collection kept for client-side filters and related-entity lookups.
  const leads = await leadService.getAll();
  return ok(leads);
});

export const POST = withApiErrors(async (request: Request) => {
  const body = await readJson(request);
  const lead = await leadService.create(body);
  return created(lead);
});
