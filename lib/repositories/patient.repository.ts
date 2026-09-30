import { ConflictError, NotFoundError } from "@/lib/errors";
import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";

// ─── Patient Repository ──────────────────────────────
// SRP: Only responsible for data access operations
// DIP: API/services depend on this abstraction, not directly on Prisma

const patientWithTreatments = (dentistId?: string) => ({
  treatments: {
    where: dentistId ? { dentistId } : undefined,
    include: { payments: true },
  },
} satisfies Prisma.PatientInclude);

const patientFullDetail = (dentistId?: string) => ({
  treatments: {
    where: dentistId ? { dentistId } : undefined,
    include: { payments: { orderBy: { createdAt: "desc" as const } } },
    orderBy: { createdAt: "desc" as const },
  },
  dentists: { select: { dentistId: true } },
  appointments: {
    where: dentistId ? { dentistId } : undefined,
    orderBy: { date: "desc" as const },
  },
  photos: {
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.PatientInclude);

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
        dentists: { some: { dentistId: params.dentistId } },
      }),
    };

    return prisma.patient.findMany({
      where,
      include: patientWithTreatments(params.dentistId),
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
    });
  },

  async count(where?: Prisma.PatientWhereInput, dentistId?: string) {
    const fullWhere: Prisma.PatientWhereInput = {
      ...where,
      ...(dentistId && {
        dentists: { some: { dentistId } },
      }),
    };
    return prisma.patient.count({ where: fullWhere });
  },

  async findById(id: string, dentistId?: string) {
    return prisma.patient.findUnique({
      where: { id, ...(dentistId && { dentists: { some: { dentistId } } }) },
      include: patientFullDetail(dentistId),
    });
  },

  async findByPhone(phone: string) {
    return prisma.patient.findUnique({ where: { phone } });
  },

  async create(data: Prisma.PatientCreateInput) {
    return prisma.patient.create({ data });
  },

  async update(id: string, data: Prisma.PatientUpdateInput, dentistId?: string) {
    return prisma.patient.update({ where: { id, ...(dentistId && { dentists: { some: { dentistId } } }) }, data });
  },

  async delete(id: string) {
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Patient" WHERE "id" = ${id} FOR UPDATE`;
      if (await tx.payment.count({ where: { treatment: { patientId: id } } })) {
        throw new ConflictError("No se puede eliminar un paciente con pagos registrados");
      }
      return tx.patient.delete({ where: { id } });
    });
  },

  async setDentists(patientId: string, dentistIds: string[]) {
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Patient" WHERE "id" = ${patientId} FOR UPDATE`;
      const treatments = await tx.treatment.findMany({ where: { patientId, dentistId: { not: null } }, select: { dentistId: true } });
      const appointments = await tx.appointment.findMany({ where: { patientId, dentistId: { not: null } }, select: { dentistId: true } });
      const count = await tx.dentist.count({ where: { id: { in: dentistIds } } });
      if (count !== dentistIds.length) throw new NotFoundError("Dentista");
      if ([...treatments, ...appointments].some(row => row.dentistId && !dentistIds.includes(row.dentistId))) {
        throw new ConflictError("No se puede retirar un vínculo con citas o tratamientos registrados");
      }
      await tx.patientDentist.deleteMany({ where: { patientId, dentistId: { notIn: dentistIds } } });
      await tx.patientDentist.createMany({ data: dentistIds.map(dentistId => ({ patientId, dentistId })), skipDuplicates: true });
      return tx.patientDentist.findMany({ where: { patientId } });
    });
  },

  async createPhotos(patientId: string, files: { id: string; url: string; label: string | null }[], avatar: boolean, dentistId?: string) {
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Patient" WHERE "id" = ${patientId} FOR UPDATE`;
      if (!await tx.patient.findUnique({ where: { id: patientId, ...(dentistId && { dentists: { some: { dentistId } } }) } })) throw new NotFoundError("Paciente");
      const photos = [];
      for (const file of files) photos.push(await tx.patientPhoto.create({ data: { ...file, patientId } }));
      if (avatar) await tx.patient.update({ where: { id: patientId }, data: { avatarUrl: photos[0].url } });
      return photos;
    });
  },

  async findPhoto(photoId: string) {
    return prisma.patientPhoto.findUnique({ where: { id: photoId } });
  },

  async deletePhoto(photoId: string) {
    return prisma.$transaction(async tx => {
      const photo = await tx.patientPhoto.findUniqueOrThrow({ where: { id: photoId } });
      await tx.patient.updateMany({ where: { id: photo.patientId, avatarUrl: photo.url }, data: { avatarUrl: null } });
      return tx.patientPhoto.delete({ where: { id: photoId } });
    });
  },

  async listPhotos(patientId: string) {
    return prisma.patientPhoto.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });
  },
};
