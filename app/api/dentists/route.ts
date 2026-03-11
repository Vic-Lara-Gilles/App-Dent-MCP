import { handleApiError, successResponse } from "@/lib/api-response";
import { withAuth } from "@/lib/auth";
import { dentistService } from "@/lib/services/dentist.service";

export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const result = await dentistService.list({
      search: searchParams.get("search") || undefined,
      page: Number(searchParams.get("page")) || undefined,
      limit: Number(searchParams.get("limit")) || undefined,
    });
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();
    const dentist = await dentistService.create(body);
    return successResponse(dentist, 201);
  } catch (error) {
    return handleApiError(error);
  }
}, ["ADMIN"]);
