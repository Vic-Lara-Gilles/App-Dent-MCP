import { handleApiError, successResponse } from "@/lib/api-response";
import { withAuth } from "@/lib/auth";
import { treatmentService } from "@/lib/services/treatment.service";

export const GET = withAuth(async (_request, { params }) => {
  try {
    const id = params!.id;
    const treatment = await treatmentService.getById(id);
    return successResponse(treatment);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = withAuth(async (request, { params }) => {
  try {
    const id = params!.id;
    const body = await request.json();
    const treatment = await treatmentService.update(id, body);
    return successResponse(treatment);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (_request, { params }) => {
  try {
    const id = params!.id;
    const result = await treatmentService.delete(id);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
});
