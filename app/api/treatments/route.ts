import { handleApiError, successResponse } from "@/lib/api-response";
import { treatmentService } from "@/lib/services";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | null;
    const result = await treatmentService.list({
      patientId: searchParams.get("patientId") || undefined,
      status: status || undefined,
      page: Number(searchParams.get("page")) || undefined,
      limit: Number(searchParams.get("limit")) || undefined,
    });
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const treatment = await treatmentService.create(body);
    return successResponse(treatment, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
