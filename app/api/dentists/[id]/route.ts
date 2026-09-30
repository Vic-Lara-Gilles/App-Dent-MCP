import { handleApiError, successResponse } from "@/lib/api-response";
import { withAuth } from "@/lib/auth/middleware";
import { dentistService } from "@/lib/services/dentist.service";

export const GET = withAuth(async (_request, auth) => {
  try {
    const id = auth.params!.id;
    const dentist = await dentistService.getById(id, auth);
    return successResponse(dentist);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = withAuth(async (request, auth) => {
  try {
    const id = auth.params!.id;
    const body = await request.json();
    const dentist = await dentistService.update(id, body, auth);
    return successResponse(dentist);
  } catch (error) {
    return handleApiError(error);
  }
}, ["ADMIN"]);

export const DELETE = withAuth(async (_request, auth) => {
  try {
    const id = auth.params!.id;
    const result = await dentistService.delete(id, auth);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}, ["ADMIN"]);
