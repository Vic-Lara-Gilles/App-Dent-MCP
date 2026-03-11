import { handleApiError, successResponse } from "@/lib/api-response";
import { withAuth } from "@/lib/auth";
import { appointmentService } from "@/lib/services";

export const GET = withAuth(async (_request, { params }) => {
  try {
    const id = params!.id;
    const appointment = await appointmentService.getById(id);
    return successResponse(appointment);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = withAuth(async (request, { params }) => {
  try {
    const id = params!.id;
    const body = await request.json();
    const appointment = await appointmentService.update(id, body);
    return successResponse(appointment);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (_request, { params }) => {
  try {
    const id = params!.id;
    const result = await appointmentService.delete(id);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
});
