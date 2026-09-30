import { Prisma } from "@/app/generated/prisma/client";
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

  if (error instanceof SyntaxError) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    if (["P2002", "P2003"].includes(error.code)) return NextResponse.json({ error: "Conflicto con los datos registrados" }, { status: 409 });
  }
  console.error("Unhandled error:", error);
  return NextResponse.json(
    { error: "Error interno del servidor" },
    { status: 500 }
  );
}
