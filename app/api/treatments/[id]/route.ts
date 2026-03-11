import { handleApiError, successResponse } from "@/lib/api-response";
import { treatmentService } from "@/lib/services";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const treatment = await treatmentService.getById(id);
    return successResponse(treatment);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const treatment = await treatmentService.update(id, body);
    return successResponse(treatment);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await treatmentService.delete(id);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
