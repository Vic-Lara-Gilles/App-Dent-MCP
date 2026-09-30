import type { AuthContext } from "@/lib/auth/middleware";
import { assertOwned, assignedDentist, dentistScope } from "@/lib/auth/access";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { balanceDecimal, calcBalance, calcDebt, decimal, sumMoney } from "@/lib/finance";
import { patientRepository } from "@/lib/repositories/patient.repository";
import { treatmentRepository } from "@/lib/repositories/treatment.repository";
import { createPaymentSchema, createTreatmentSchema, updateTreatmentSchema, treatmentSearchSchema } from "@/lib/schemas";

export const treatmentService = {
  async getOverview(auth: AuthContext) {
    const treatments = await treatmentRepository.findMany({ dentistId: dentistScope(auth) });
    const groups = new Map<string, typeof treatments>();
    for (const treatment of treatments) {
      const group = groups.get(treatment.patientId) ?? [];
      group.push(treatment);
      groups.set(treatment.patientId, group);
    }
    return [...groups.values()].map(group => ({
      patient: group[0].patient,
      treatments: group,
      totalAmount: sumMoney(group.map(treatment => treatment.totalAmount)),
      totalPaid: sumMoney(group.flatMap(treatment => treatment.payments.map(payment => payment.amount))),
      balance: calcDebt(group),
    }));
  },
  async list(params: { patientId?: string; status?: "IN_PROGRESS" | "COMPLETED" | "CANCELLED"; page?: number; limit?: number }, auth: AuthContext) {
    const dentistId = dentistScope(auth);
    const parsed = treatmentSearchSchema.safeParse(params);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);
    const { page, limit } = parsed.data;
    const [treatments, total] = await Promise.all([
      treatmentRepository.findMany({ ...params, dentistId, skip: (page - 1) * limit, take: limit }),
      treatmentRepository.count({ ...params, dentistId }),
    ]);
    return { data: treatments.map(t => ({ ...t, balance: calcBalance(t) })), total, page, limit };
  },
  async getById(id: string, auth: AuthContext) {
    dentistScope(auth);
    const treatment = await treatmentRepository.findById(id);
    if (!treatment) throw new NotFoundError("Tratamiento");
    assertOwned(auth, treatment.dentistId, "Tratamiento");
    return { ...treatment, balance: calcBalance(treatment) };
  },
  async create(input: unknown, auth: AuthContext) {
    dentistScope(auth);
    const parsed = createTreatmentSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);
    const patient = await patientRepository.findById(parsed.data.patientId, dentistScope(auth));
    if (!patient) throw new NotFoundError("Paciente");
    const dentistId = assignedDentist(auth, parsed.data.dentistId);
    return treatmentRepository.create({
      description: parsed.data.description,
      totalAmount: parsed.data.totalAmount,
      patient: { connect: { id: parsed.data.patientId } },
      ...(dentistId && { dentist: { connect: { id: dentistId } } }),
    }, dentistScope(auth));
  },
  async update(id: string, input: unknown, auth: AuthContext) {
    dentistScope(auth);
    const parsed = updateTreatmentSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);
    return treatmentRepository.withLocked(id, async (treatment, operations) => {
      assertOwned(auth, treatment.dentistId, "Tratamiento");
      const total = parsed.data.totalAmount ?? treatment.totalAmount;
      const paid = sumMoney(treatment.payments.map(p => p.amount));
      if (decimal(total).lessThan(paid)) throw new ConflictError("El total no puede ser menor que lo pagado");
      const status = parsed.data.status ?? treatment.status;
      if (status === "COMPLETED" && decimal(total).greaterThan(paid)) {
        throw new ConflictError("No se puede completar el tratamiento mientras tenga saldo pendiente");
      }
      return operations.update(parsed.data);
    });
  },
  async delete(id: string, auth: AuthContext) {
    dentistScope(auth);
    return treatmentRepository.withLocked(id, async (treatment, operations) => {
      assertOwned(auth, treatment.dentistId, "Tratamiento");
      if (treatment.payments.length) throw new ConflictError("No se puede eliminar un tratamiento con pagos registrados");
      await operations.delete();
      return { message: "Tratamiento eliminado" };
    });
  },
  async addPayment(input: unknown, auth: AuthContext) {
    dentistScope(auth);
    const parsed = createPaymentSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);
    return treatmentRepository.withLocked(parsed.data.treatmentId, async (treatment, operations) => {
      assertOwned(auth, treatment.dentistId, "Tratamiento");
      if (treatment.status === "CANCELLED") throw new ConflictError("No se puede registrar un abono en un tratamiento cancelado");
      const balance = balanceDecimal(treatment);
      const amount = decimal(parsed.data.amount);
      if (amount.greaterThan(balance)) throw new ConflictError(`El monto excede el saldo pendiente ($${balance.toFixed(2)})`);
      const payment = await operations.addPayment({ amount: parsed.data.amount, method: parsed.data.method, note: parsed.data.note });
      if (balance.equals(amount) && treatment.status === "IN_PROGRESS") await operations.update({ status: "COMPLETED" });
      return payment;
    });
  },
};
