import { handleApiError, successResponse } from "@/lib/api-response";
import { withAuth } from "@/lib/auth/middleware";
import { appointmentService } from "@/lib/services/appointment.service";

export const GET = withAuth(async (_request, auth) => {
  try {
    const id = auth.params!.id;
    const appointment = await appointmentService.getById(id, auth);
    return successResponse(appointment);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = withAuth(async (request, auth) => {
  try {
    const id = auth.params!.id;
    const body = await request.json();
    const appointment = await appointmentService.update(id, body, auth);
    return successResponse(appointment);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (_request, auth) => {
  try {
    const id = auth.params!.id;
    const result = await appointmentService.delete(id, auth);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
});
