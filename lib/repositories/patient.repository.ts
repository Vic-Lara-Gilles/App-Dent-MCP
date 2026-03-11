import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";

// ─── Patient Repository ──────────────────────────────
// SRP: Only responsible for data access operations
// DIP: API/services depend on this abstraction, not directly on Prisma

const patientWithTreatments = {
  treatments: {
    include: { payments: true },
  },
} satisfies Prisma.PatientInclude;

const patientFullDetail = {
  treatments: {
    include: { payments: { orderBy: { createdAt: "desc" as const } } },
    orderBy: { createdAt: "desc" as const },
  },
  appointments: {
    orderBy: { date: "desc" as const },
  },
} satisfies Prisma.PatientInclude;

export const patientRepository = {
  async findMany(params: {
    where?: Prisma.PatientWhereInput;
    skip?: number;
    take?: number;
    dentistId?: string;
  }) {
    const where: Prisma.PatientWhereInput = {
      ...params.where,
      ...(params.dentistId && {
        treatments: { some: { dentistId: params.dentistId } },
      }),
    };

    return prisma.patient.findMany({
      where,
      include: patientWithTreatments,
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
    });
  },

  async count(where?: Prisma.PatientWhereInput, dentistId?: string) {
    const fullWhere: Prisma.PatientWhereInput = {
      ...where,
      ...(dentistId && {
        treatments: { some: { dentistId } },
      }),
    };
    return prisma.patient.count({ where: fullWhere });
  },

  async findById(id: string) {
    return prisma.patient.findUnique({
      where: { id },
      include: patientFullDetail,
    });
  },

  async findByPhone(phone: string) {
    return prisma.patient.findUnique({ where: { phone } });
  },

  async create(data: Prisma.PatientCreateInput) {
    return prisma.patient.create({ data });
  },

  async update(id: string, data: Prisma.PatientUpdateInput) {
    return prisma.patient.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.patient.delete({ where: { id } });
  },
};
