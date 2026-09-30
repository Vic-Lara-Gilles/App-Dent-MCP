import { handleApiError, successResponse } from "@/lib/api-response";
import { withAuth } from "@/lib/auth/middleware";
import { patientService } from "@/lib/services/patient.service";

export const GET = withAuth(async (_request, auth) => {
  try {
    const id = auth.params!.id;
    const patient = await patientService.getById(id, auth);
    return successResponse(patient);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = withAuth(async (request, auth) => {
  try {
    const id = auth.params!.id;
    const body = await request.json();
    const patient = await patientService.update(id, body, auth);
    return successResponse(patient);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (_request, auth) => {
  try {
    const id = auth.params!.id;
    const result = await patientService.delete(id, auth);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
});
