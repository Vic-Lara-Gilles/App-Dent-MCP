import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";

export const dentistRepository = {
  async findMany(params: { where?: Prisma.DentistWhereInput; skip?: number; take?: number }) {
    return prisma.dentist.findMany({
      where: params.where,
      orderBy: { lastName: "asc" },
      skip: params.skip,
      take: params.take,
    });
  },

  async count(where?: Prisma.DentistWhereInput) {
    return prisma.dentist.count({ where });
  },

  async findById(id: string) {
    return prisma.dentist.findUnique({
      where: { id },
      include: {
        treatments: { include: { patient: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: "desc" }, take: 10 },
        appointments: { include: { patient: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { date: "desc" }, take: 10 },
      },
    });
  },

  async create(data: Prisma.DentistCreateInput) {
    return prisma.dentist.create({ data });
  },

  async update(id: string, data: Prisma.DentistUpdateInput) {
    return prisma.dentist.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.dentist.delete({ where: { id } });
  },
};
