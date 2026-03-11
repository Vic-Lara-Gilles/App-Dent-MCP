import { handleApiError, successResponse } from "@/lib/api-response";
import { appointmentService } from "@/lib/services";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const appointment = await appointmentService.getById(id);
    return successResponse(appointment);
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
    const appointment = await appointmentService.update(id, body);
    return successResponse(appointment);
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
    const result = await appointmentService.delete(id);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
