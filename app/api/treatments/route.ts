import { handleApiError, successResponse } from "@/lib/api-response";
import { withAuth } from "@/lib/auth";
import { treatmentService } from "@/lib/services";

export const GET = withAuth(async (request, { dentistId }) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | null;
    const result = await treatmentService.list({
      patientId: searchParams.get("patientId") || undefined,
      status: status || undefined,
      dentistId: dentistId || undefined,
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
    const treatment = await treatmentService.create(body);
    return successResponse(treatment, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
