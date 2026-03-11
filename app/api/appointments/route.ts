import type { AppointmentStatus } from "@/app/generated/prisma/client";
import { handleApiError, successResponse } from "@/lib/api-response";
import { appointmentService } from "@/lib/services";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as AppointmentStatus | null;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const result = await appointmentService.list({
      patientId: searchParams.get("patientId") || undefined,
      status: status || undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
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
    const appointment = await appointmentService.create(body);
    return successResponse(appointment, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
