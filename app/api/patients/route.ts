import { handleApiError, successResponse } from "@/lib/api-response";
import { withAuth } from "@/lib/auth";
import { patientService } from "@/lib/services";

export const GET = withAuth(async (request, { dentistId }) => {
  try {
    const { searchParams } = new URL(request.url);
    const result = await patientService.list({
      search: searchParams.get("search") || undefined,
      page: Number(searchParams.get("page")) || undefined,
      limit: Number(searchParams.get("limit")) || undefined,
      dentistId: dentistId || undefined,
    });
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();
    const patient = await patientService.create(body);
    return successResponse(patient, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
