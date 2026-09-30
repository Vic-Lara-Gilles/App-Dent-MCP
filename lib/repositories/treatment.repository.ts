import { NotFoundError } from "@/lib/errors";
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

  async create(data: Prisma.TreatmentCreateInput, scope?: string) {
    return prisma.$transaction(async tx => {
      const patientId = data.patient.connect!.id!;
      await tx.$queryRaw`SELECT "id" FROM "Patient" WHERE "id" = ${patientId} FOR UPDATE`;
      if (!await tx.patient.findUnique({ where: { id: patientId, ...(scope && { dentists: { some: { dentistId: scope } } }) } })) throw new NotFoundError("Paciente");
      const treatment = await tx.treatment.create({ data, include: treatmentWithPayments });
      if (treatment.dentistId) await tx.patientDentist.upsert({
        where: { patientId_dentistId: { patientId, dentistId: treatment.dentistId } },
        create: { patientId, dentistId: treatment.dentistId }, update: {},
      });
      return treatment;
    });
  },

  async withLocked<T>(id: string, execute: (
    treatment: Prisma.TreatmentGetPayload<{ include: typeof treatmentWithPayments }>,
    operations: {
      update: (data: Prisma.TreatmentUpdateInput) => Promise<Prisma.TreatmentGetPayload<{ include: typeof treatmentWithPayments }>>;
      addPayment: (data: { amount: number; method: "CASH" | "TRANSFER" | "CARD" | "OTHER"; note?: string }) => Promise<import("@/app/generated/prisma/client").Payment>;
      delete: () => Promise<void>;
    },
  ) => Promise<T>): Promise<T> {
    return prisma.$transaction(async tx => {
      const existing = await tx.treatment.findUnique({ where: { id }, select: { patientId: true } });
      if (!existing) throw new NotFoundError("Tratamiento");
      await tx.$queryRaw`SELECT "id" FROM "Patient" WHERE "id" = ${existing.patientId} FOR UPDATE`;
      await tx.$queryRaw`SELECT "id" FROM "Treatment" WHERE "id" = ${id} FOR UPDATE`;
      const treatment = await tx.treatment.findUnique({ where: { id }, include: treatmentWithPayments });
      if (!treatment) throw new NotFoundError("Tratamiento");
      return execute(treatment, {
        update: data => tx.treatment.update({ where: { id }, data, include: treatmentWithPayments }),
        addPayment: data => tx.payment.create({ data: { ...data, treatmentId: id } }),
        delete: async () => { await tx.treatment.delete({ where: { id } }); },
      });
    });
  },
};
