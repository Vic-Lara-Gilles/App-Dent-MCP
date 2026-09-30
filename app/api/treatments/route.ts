import { handleApiError, successResponse } from "@/lib/api-response";
import { withAuth } from "@/lib/auth/middleware";
import { treatmentService } from "@/lib/services/treatment.service";

export const GET = withAuth(async (request, auth) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | null;
    const result = await treatmentService.list({
      patientId: searchParams.get("patientId") || undefined,
      status: status || undefined,
      page: Number(searchParams.get("page")) || undefined,
      limit: Number(searchParams.get("limit")) || undefined,
    }, auth);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request, auth) => {
  try {
    const body = await request.json();
    const treatment = await treatmentService.create(body, auth);
    return successResponse(treatment, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
