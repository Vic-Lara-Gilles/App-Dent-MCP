import { handleApiError, successResponse } from "@/lib/api-response";
import { dentistService } from "@/lib/services/dentist.service";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await dentistService.list({
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
    const dentist = await dentistService.create(body);
    return successResponse(dentist, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
