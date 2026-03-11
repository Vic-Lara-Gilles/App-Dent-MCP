import { AppError } from "@/lib/errors";
import { NextResponse } from "next/server";

// ─── API Response Helpers ────────────────────────────
// SRP: Centralized HTTP response formatting and error handling
// OCP: New error types are handled automatically via AppError hierarchy

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    const body: Record<string, unknown> = { error: error.message };
    if (error.details) body.details = error.details;
    return NextResponse.json(body, { status: error.statusCode });
  }

  console.error("Unhandled error:", error);
  return NextResponse.json(
    { error: "Error interno del servidor" },
    { status: 500 }
  );
}
