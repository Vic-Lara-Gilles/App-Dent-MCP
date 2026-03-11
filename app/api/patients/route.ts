import { handleApiError, successResponse } from "@/lib/api-response";
import { patientService } from "@/lib/services";
import { NextRequest } from "next/server";

// ─── Patient Routes (Thin Controller) ────────────────
// SRP: Only responsible for HTTP parsing and response delegation

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await patientService.list({
      search: searchParams.get("search") || undefined,
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
    const patient = await patientService.create(body);
    return successResponse(patient, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
