import { NotFoundError } from "@/lib/errors";
import type { AppointmentStatus, Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";

const appointmentWithPatient = {
  patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
  dentist: { select: { id: true, firstName: true, lastName: true, specialty: true } },
} satisfies Prisma.AppointmentInclude;

export const appointmentRepository = {
  async findMany(params: {
    patientId?: string;
    status?: AppointmentStatus;
    dateFrom?: Date;
    dateTo?: Date;
    dentistId?: string;
    skip?: number;
    take?: number;
  }) {
    return prisma.appointment.findMany({
      where: {
        ...(params.patientId && { patientId: params.patientId }),
        ...(params.status && { status: params.status }),
        ...(params.dentistId && { dentistId: params.dentistId }),
        ...(params.dateFrom || params.dateTo
          ? {
            date: {
              ...(params.dateFrom && { gte: params.dateFrom }),
              ...(params.dateTo && { lte: params.dateTo }),
            },
          }
          : {}),
      },
      include: appointmentWithPatient,
      orderBy: { date: "asc" },
      skip: params.skip,
      take: params.take,
    });
  },

  async count(params: {
    patientId?: string;
    status?: AppointmentStatus;
    dateFrom?: Date;
    dateTo?: Date;
    dentistId?: string;
  }) {
    return prisma.appointment.count({
      where: {
        ...(params.patientId && { patientId: params.patientId }),
        ...(params.status && { status: params.status }),
        ...(params.dentistId && { dentistId: params.dentistId }),
        ...(params.dateFrom || params.dateTo
          ? {
            date: {
              ...(params.dateFrom && { gte: params.dateFrom }),
              ...(params.dateTo && { lte: params.dateTo }),
            },
          }
          : {}),
      },
    });
  },

  async findById(id: string) {
    return prisma.appointment.findUnique({
      where: { id },
      include: appointmentWithPatient,
    });
  },

  async create(data: Prisma.AppointmentCreateInput, scope?: string) {
    return prisma.$transaction(async tx => {
      const patientId = data.patient.connect!.id!;
      await tx.$queryRaw`SELECT "id" FROM "Patient" WHERE "id" = ${patientId} FOR UPDATE`;
      if (!await tx.patient.findUnique({ where: { id: patientId, ...(scope && { dentists: { some: { dentistId: scope } } }) } })) throw new NotFoundError("Paciente");
      const appointment = await tx.appointment.create({ data, include: appointmentWithPatient });
      if (appointment.dentistId) await tx.patientDentist.upsert({
        where: { patientId_dentistId: { patientId, dentistId: appointment.dentistId } },
        create: { patientId, dentistId: appointment.dentistId }, update: {},
      });
      return appointment;
    });
  },

  async update(id: string, data: Prisma.AppointmentUpdateInput, scope?: string) {
    return prisma.$transaction(async tx => {
      const existing = await tx.appointment.findUniqueOrThrow({ where: { id } });
      const patientId = existing.patientId;
      await tx.$queryRaw`SELECT "id" FROM "Patient" WHERE "id" = ${patientId} FOR UPDATE`;
      const current = await tx.appointment.findUnique({ where: { id, ...(scope && { dentistId: scope }) } });
      if (!current) throw new NotFoundError("Cita");
      const appointment = await tx.appointment.update({ where: { id }, data, include: appointmentWithPatient });
      if (appointment.dentistId) await tx.patientDentist.upsert({
        where: { patientId_dentistId: { patientId, dentistId: appointment.dentistId } },
        create: { patientId, dentistId: appointment.dentistId }, update: {},
      });
      return appointment;
    });
  },

  async delete(id: string, scope?: string) {
    return prisma.appointment.delete({ where: { id, ...(scope && { dentistId: scope }) } });
  },
};
