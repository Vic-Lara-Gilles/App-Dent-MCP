import { handleApiError, successResponse } from "@/lib/api-response";
import { patientService } from "@/lib/services";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

// ─── Patient Detail Routes (Thin Controller) ─────────
// SRP: Only responsible for HTTP parsing and response delegation

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const patient = await patientService.getById(id);
    return successResponse(patient);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const patient = await patientService.update(id, body);
    return successResponse(patient);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const result = await patientService.delete(id);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
