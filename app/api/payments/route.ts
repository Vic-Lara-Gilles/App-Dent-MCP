import { handleApiError, successResponse } from "@/lib/api-response";
import { withAuth } from "@/lib/auth";
import { treatmentService } from "@/lib/services";

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();
    const payment = await treatmentService.addPayment(body);
    return successResponse(payment, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
