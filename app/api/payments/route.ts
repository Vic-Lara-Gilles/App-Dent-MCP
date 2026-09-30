import { handleApiError, successResponse } from "@/lib/api-response";
import { withAuth } from "@/lib/auth/middleware";
import { treatmentService } from "@/lib/services/treatment.service";

export const POST = withAuth(async (request, auth) => {
  try {
    const body = await request.json();
    const payment = await treatmentService.addPayment(body, auth);
    return successResponse(payment, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
