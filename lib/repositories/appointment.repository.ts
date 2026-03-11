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
    skip?: number;
    take?: number;
  }) {
    return prisma.appointment.findMany({
      where: {
        ...(params.patientId && { patientId: params.patientId }),
        ...(params.status && { status: params.status }),
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
  }) {
    return prisma.appointment.count({
      where: {
        ...(params.patientId && { patientId: params.patientId }),
        ...(params.status && { status: params.status }),
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

  async create(data: Prisma.AppointmentCreateInput) {
    return prisma.appointment.create({ data, include: appointmentWithPatient });
  },

  async update(id: string, data: Prisma.AppointmentUpdateInput) {
    return prisma.appointment.update({ where: { id }, data, include: appointmentWithPatient });
  },

  async delete(id: string) {
    return prisma.appointment.delete({ where: { id } });
  },
};
