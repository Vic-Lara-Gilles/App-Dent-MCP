import type { Prisma, TreatmentStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";

const treatmentWithPayments = {
  payments: { orderBy: { createdAt: "desc" as const } },
  patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
} satisfies Prisma.TreatmentInclude;

export const treatmentRepository = {
  async findMany(params: {
    patientId?: string;
    status?: TreatmentStatus;
    skip?: number;
    take?: number;
  }) {
    return prisma.treatment.findMany({
      where: {
        ...(params.patientId && { patientId: params.patientId }),
        ...(params.status && { status: params.status }),
      },
      include: treatmentWithPayments,
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
    });
  },

  async count(params: { patientId?: string; status?: TreatmentStatus }) {
    return prisma.treatment.count({
      where: {
        ...(params.patientId && { patientId: params.patientId }),
        ...(params.status && { status: params.status }),
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
