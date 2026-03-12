import type { Prisma, TreatmentStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";

const treatmentWithPayments = {
  payments: { orderBy: { createdAt: "desc" as const } },
  patient: { select: { id: true, firstName: true, lastName: true, rut: true, phone: true, avatarUrl: true } },
  dentist: { select: { id: true, firstName: true, lastName: true, specialty: true } },
} satisfies Prisma.TreatmentInclude;

export const treatmentRepository = {
  async findMany(params: {
    patientId?: string;
    status?: TreatmentStatus;
    dentistId?: string;
    skip?: number;
    take?: number;
  }) {
    return prisma.treatment.findMany({
      where: {
        ...(params.patientId && { patientId: params.patientId }),
        ...(params.status && { status: params.status }),
        ...(params.dentistId && { dentistId: params.dentistId }),
      },
      include: treatmentWithPayments,
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
    });
  },

  async count(params: { patientId?: string; status?: TreatmentStatus; dentistId?: string }) {
    return prisma.treatment.count({
      where: {
        ...(params.patientId && { patientId: params.patientId }),
        ...(params.status && { status: params.status }),
        ...(params.dentistId && { dentistId: params.dentistId }),
      },
    });
  },

  async findById(id: string) {
    return prisma.treatment.findUnique({
      where: { id },
      include: treatmentWithPayments,
    });
  },

  async create(data: Prisma.TreatmentCreateInput) {
    return prisma.treatment.create({ data, include: treatmentWithPayments });
  },

  async update(id: string, data: Prisma.TreatmentUpdateInput) {
    return prisma.treatment.update({ where: { id }, data, include: treatmentWithPayments });
  },

  async delete(id: string) {
    return prisma.treatment.delete({ where: { id } });
  },
};
