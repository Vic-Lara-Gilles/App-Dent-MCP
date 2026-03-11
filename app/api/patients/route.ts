import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createPatientSchema } from "@/lib/schemas";

// GET /api/patients — List patients with optional search
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
        ],
      }
    : {};

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      include: {
        treatments: {
          include: { payments: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.patient.count({ where }),
  ]);

  // Calculate pending balance for each patient
  const data = patients.map((patient) => {
    const totalDebt = patient.treatments.reduce((sum, t) => {
      const paid = t.payments.reduce((s, p) => s + Number(p.amount), 0);
      return sum + (Number(t.totalAmount) - paid);
    }, 0);
    return {
      ...patient,
      totalDebt: Math.max(0, totalDebt),
    };
  });

  return NextResponse.json({ data, total, page, limit });
}

// POST /api/patients — Create patient
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createPatientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const existing = await prisma.patient.findUnique({
    where: { phone: parsed.data.phone },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Ya existe un paciente con este teléfono" },
      { status: 409 }
    );
  }

  const patient = await prisma.patient.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      notes: parsed.data.notes || null,
    },
  });

  return NextResponse.json(patient, { status: 201 });
}
