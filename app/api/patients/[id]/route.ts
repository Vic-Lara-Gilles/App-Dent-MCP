import { handleApiError, successResponse } from "@/lib/api-response";
import { withAuth } from "@/lib/auth";
import { patientService } from "@/lib/services/patient.service";

export const GET = withAuth(async (_request, { params }) => {
  try {
    const id = params!.id;
    const patient = await patientService.getById(id);
    return successResponse(patient);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = withAuth(async (request, { params }) => {
  try {
    const id = params!.id;
    const body = await request.json();
    const patient = await patientService.update(id, body);
    return successResponse(patient);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (_request, { params }) => {
  try {
    const id = params!.id;
    const result = await patientService.delete(id);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
});
