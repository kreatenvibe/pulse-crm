import { serviceErrorResponse } from "@/lib/api-route";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { leadService } from "@/services";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");

  // Paginated contract: GET /api/leads?page=1&pageSize=10 → { data, pagination }
  if (pageParam !== null || pageSizeParam !== null) {
    const page = pageParam !== null ? Number(pageParam) : 1;
    const pageSize =
      pageSizeParam !== null ? Number(pageSizeParam) : DEFAULT_PAGE_SIZE;
    const result = await leadService.list({ page, pageSize });
    return Response.json(result);
  }

  // Full collection kept for client-side filters and related-entity lookups.
  const leads = await leadService.getAll();
  return Response.json(leads);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lead = await leadService.create(body);
    return Response.json(lead, { status: 201 });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
