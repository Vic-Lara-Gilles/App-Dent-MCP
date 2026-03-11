import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updatePatientSchema } from "@/lib/schemas";

type Params = { params: Promise<{ id: string }> };

// GET /api/patients/[id] — Get patient detail with treatments & appointments
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      treatments: {
        include: { payments: { orderBy: { createdAt: "desc" } } },
        orderBy: { createdAt: "desc" },
      },
      appointments: {
        orderBy: { date: "desc" },
      },
    },
  });

  if (!patient) {
    return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
  }

  const totalDebt = patient.treatments.reduce((sum, t) => {
    const paid = t.payments.reduce((s, p) => s + Number(p.amount), 0);
    return sum + (Number(t.totalAmount) - paid);
  }, 0);

  return NextResponse.json({ ...patient, totalDebt: Math.max(0, totalDebt) });
}

// PATCH /api/patients/[id] — Update patient
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const parsed = updatePatientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const existing = await prisma.patient.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
  }

  // Check phone uniqueness if being changed
  if (parsed.data.phone && parsed.data.phone !== existing.phone) {
    const phoneExists = await prisma.patient.findUnique({
      where: { phone: parsed.data.phone },
    });
    if (phoneExists) {
      return NextResponse.json(
        { error: "Ya existe un paciente con este teléfono" },
        { status: 409 }
      );
    }
  }

  const patient = await prisma.patient.update({
    where: { id },
    data: {
      ...(parsed.data.firstName !== undefined && { firstName: parsed.data.firstName }),
      ...(parsed.data.lastName !== undefined && { lastName: parsed.data.lastName }),
      ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
      ...(parsed.data.email !== undefined && { email: parsed.data.email || null }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes || null }),
    },
  });

  return NextResponse.json(patient);
}

// DELETE /api/patients/[id] — Delete patient
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const existing = await prisma.patient.findUnique({
    where: { id },
    include: {
      treatments: {
        include: { payments: true },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
  }

  await prisma.patient.delete({ where: { id } });

  return NextResponse.json({ message: "Paciente eliminado" });
}
