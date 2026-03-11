import { prisma } from "@/lib/db";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { treatmentRepository } from "@/lib/repositories";
import {
  createPaymentSchema,
  createTreatmentSchema,
  updateTreatmentSchema,
} from "@/lib/schemas";

function calcBalance(treatment: {
  totalAmount: unknown;
  payments: { amount: unknown }[];
}): number {
  const paid = treatment.payments.reduce((s, p) => s + Number(p.amount), 0);
  return Math.max(0, Number(treatment.totalAmount) - paid);
}

export const treatmentService = {
  async list(params: {
    patientId?: string;
    status?: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const [treatments, total] = await Promise.all([
      treatmentRepository.findMany({ ...params, skip, take: limit }),
      treatmentRepository.count(params),
    ]);

    const data = treatments.map((t) => ({ ...t, balance: calcBalance(t) }));
    return { data, total, page, limit };
  },

  async getById(id: string) {
    const treatment = await treatmentRepository.findById(id);
    if (!treatment) throw new NotFoundError("Tratamiento");
    return { ...treatment, balance: calcBalance(treatment) };
  },

  async create(input: unknown) {
    const parsed = createTreatmentSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const patient = await prisma.patient.findUnique({ where: { id: parsed.data.patientId } });
    if (!patient) throw new NotFoundError("Paciente");

    return treatmentRepository.create({
      description: parsed.data.description,
      totalAmount: parsed.data.totalAmount,
      patient: { connect: { id: parsed.data.patientId } },
    });
  },

  async update(id: string, input: unknown) {
    const parsed = updateTreatmentSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const treatment = await treatmentRepository.findById(id);
    if (!treatment) throw new NotFoundError("Tratamiento");

    // Business rule: can only mark COMPLETED if balance = 0
    if (parsed.data.status === "COMPLETED" && calcBalance(treatment) > 0) {
      throw new ConflictError(
        "No se puede completar el tratamiento mientras tenga saldo pendiente"
      );
    }

    return treatmentRepository.update(id, {
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.totalAmount !== undefined && { totalAmount: parsed.data.totalAmount }),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
    });
  },

  async delete(id: string) {
    const treatment = await treatmentRepository.findById(id);
    if (!treatment) throw new NotFoundError("Tratamiento");
    await treatmentRepository.delete(id);
    return { message: "Tratamiento eliminado" };
  },

  async addPayment(input: unknown) {
    const parsed = createPaymentSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const treatment = await treatmentRepository.findById(parsed.data.treatmentId);
    if (!treatment) throw new NotFoundError("Tratamiento");

    if (treatment.status === "CANCELLED") {
      throw new ConflictError("No se puede registrar un abono en un tratamiento cancelado");
    }

    const balance = calcBalance(treatment);
    if (parsed.data.amount > balance) {
      throw new ConflictError(
        `El monto excede el saldo pendiente ($${balance.toFixed(2)})`
      );
    }

    const payment = await prisma.payment.create({
      data: {
        amount: parsed.data.amount,
        method: parsed.data.method,
        note: parsed.data.note || null,
        treatment: { connect: { id: parsed.data.treatmentId } },
      },
    });

    // Auto-complete treatment if fully paid
    const newBalance = balance - parsed.data.amount;
    if (newBalance === 0 && treatment.status === "IN_PROGRESS") {
      await treatmentRepository.update(parsed.data.treatmentId, { status: "COMPLETED" });
    }

    return payment;
  },
};
