import { handleApiError, successResponse } from "@/lib/api-response";
import { treatmentService } from "@/lib/services";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payment = await treatmentService.addPayment(body);
    return successResponse(payment, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
