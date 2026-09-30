import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";

export const dashboardRepository = {
  async getData(dentistId?: string) {
    const dentistFilter: Prisma.TreatmentWhereInput = dentistId ? { dentistId } : {};
    const appointmentDentistFilter: Prisma.AppointmentWhereInput = dentistId ? { dentistId } : {};
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

    const [patientCount, treatmentCount, appointmentCount, todayPayments, activeTreatments, recentPayments] =
      await Promise.all([
        prisma.patient.count(dentistId ? { where: { dentists: { some: { dentistId } } } } : undefined),
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

    return { patientCount, treatmentCount, appointmentCount, todayPayments, activeTreatments, recentPayments };
  },
};
