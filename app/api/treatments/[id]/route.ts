import { handleApiError, successResponse } from "@/lib/api-response";
import { withAuth } from "@/lib/auth/middleware";
import { treatmentService } from "@/lib/services/treatment.service";

export const GET = withAuth(async (_request, auth) => {
  try {
    const id = auth.params!.id;
    const treatment = await treatmentService.getById(id, auth);
    return successResponse(treatment);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = withAuth(async (request, auth) => {
  try {
    const id = auth.params!.id;
    const body = await request.json();
    const treatment = await treatmentService.update(id, body, auth);
    return successResponse(treatment);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (_request, auth) => {
  try {
    const id = auth.params!.id;
    const result = await treatmentService.delete(id, auth);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
});
