import { handleApiError, successResponse } from "@/lib/api-response";
import { withAuth } from "@/lib/auth";
import { dentistService } from "@/lib/services/dentist.service";

export const GET = withAuth(async (_request, { params }) => {
  try {
    const id = params!.id;
    const dentist = await dentistService.getById(id);
    return successResponse(dentist);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = withAuth(async (request, { params }) => {
  try {
    const id = params!.id;
    const body = await request.json();
    const dentist = await dentistService.update(id, body);
    return successResponse(dentist);
  } catch (error) {
    return handleApiError(error);
  }
}, ["ADMIN"]);

export const DELETE = withAuth(async (_request, { params }) => {
  try {
    const id = params!.id;
    const result = await dentistService.delete(id);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}, ["ADMIN"]);
