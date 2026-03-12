import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";

export const paymentRepository = {
  async create(data: Prisma.PaymentCreateInput) {
    return prisma.payment.create({ data });
  },

  async findRecent(params: { dentistId?: string; take?: number }) {
    return prisma.payment.findMany({
      where: params.dentistId ? { treatment: { dentistId: params.dentistId } } : undefined,
      include: {
        treatment: {
          select: {
            description: true,
            patient: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: params.take ?? 8,
    });
  },

  async sumToday(dentistId?: string) {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: todayStart },
        ...(dentistId ? { treatment: { dentistId } } : {}),
      },
      select: { amount: true },
    });
    return payments.reduce((s, p) => s + Number(p.amount), 0);
  },
};
