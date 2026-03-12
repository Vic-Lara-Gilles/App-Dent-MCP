import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { calcBalance } from "@/lib/finance";

// ─── Dashboard Service ───────────────────────────────
// SRP: Encapsulates dashboard aggregation queries
// DIP: Isolates prisma from the page component

export const dashboardService = {
  async getStats(dentistId: string | null) {
    const dentistFilter: Prisma.TreatmentWhereInput = dentistId ? { dentistId } : {};
    const appointmentDentistFilter: Prisma.AppointmentWhereInput = dentistId ? { dentistId } : {};
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

    const [patientCount, treatmentCount, appointmentCount, todayPayments, activeTreatments, recentPayments] =
      await Promise.all([
        prisma.patient.count(dentistId ? { where: { treatments: { some: { dentistId } } } } : undefined),
        prisma.treatment.count({ where: { status: "IN_PROGRESS", ...dentistFilter } }),
        prisma.appointment.count({
          where: {
            date: { gte: new Date() },
            status: { in: ["SCHEDULED", "CONFIRMED"] },
            ...appointmentDentistFilter,
          },
        }),
        prisma.payment.findMany({
          where: {
            createdAt: { gte: todayStart },
            ...(dentistId ? { treatment: { dentistId } } : {}),
          },
          select: { amount: true },
        }),
        prisma.patient.findMany({
          where: {
            treatments: { some: { status: "IN_PROGRESS", ...dentistFilter } },
          },
          include: {
            treatments: {
              where: { status: "IN_PROGRESS", ...dentistFilter },
              include: { payments: { select: { amount: true } } },
            },
          },
        }),
        prisma.payment.findMany({
          where: dentistId ? { treatment: { dentistId } } : undefined,
          include: {
            treatment: {
              select: {
                description: true,
                patient: { select: { firstName: true, lastName: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),
      ]);

    const incomesToday = todayPayments.reduce((s, p) => s + Number(p.amount), 0);

    const debtors = activeTreatments
      .map((patient) => {
        const debt = patient.treatments.reduce((sum, t) => sum + calcBalance(t), 0);
        return { id: patient.id, firstName: patient.firstName, lastName: patient.lastName, debt };
      })
      .filter((p) => p.debt > 0)
      .sort((a, b) => b.debt - a.debt)
      .slice(0, 5);

    const totalOutstanding = debtors.reduce((s, p) => s + p.debt, 0);

    return {
      patientCount,
      treatmentCount,
      appointmentCount,
      incomesToday,
      debtors,
      totalOutstanding,
      recentPayments,
    };
  },
};
