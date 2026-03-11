import { handleApiError, successResponse } from "@/lib/api-response";
import { dentistService } from "@/lib/services/dentist.service";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dentist = await dentistService.getById(id);
    return successResponse(dentist);
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
    const dentist = await dentistService.update(id, body);
    return successResponse(dentist);
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
    const result = await dentistService.delete(id);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
