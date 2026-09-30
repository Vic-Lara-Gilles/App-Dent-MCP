import type { AuthContext } from "@/lib/auth/middleware";
import { dentistScope, assertOwned, assignedDentist } from "@/lib/auth/access";
import type { AppointmentStatus } from "@/app/generated/prisma/client";
import { NotFoundError, ValidationError, ForbiddenError } from "@/lib/errors";
import { appointmentRepository } from "@/lib/repositories/appointment.repository";
import { patientRepository } from "@/lib/repositories/patient.repository";
import { createAppointmentSchema, updateAppointmentSchema, appointmentSearchSchema } from "@/lib/schemas";

export const appointmentService = {
  async list(params: {
    patientId?: string;
    status?: AppointmentStatus;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }, auth: AuthContext) {
    const dentistId = dentistScope(auth);
    const pagination = appointmentSearchSchema.safeParse(params);
    if (!pagination.success) throw new ValidationError(pagination.error.issues);
    const { page, limit } = pagination.data;
    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      appointmentRepository.findMany({ ...params, dentistId, skip, take: limit }),
      appointmentRepository.count({ ...params, dentistId }),
    ]);

    return { data: appointments, total, page, limit };
  },

  async getById(id: string, auth: AuthContext) {
    const appointment = await appointmentRepository.findById(id);
    if (!appointment) throw new NotFoundError("Cita");
    assertOwned(auth, appointment.dentistId, "Cita");
    return appointment;
  },

  async create(input: unknown, auth: AuthContext) {
    dentistScope(auth);
    const parsed = createAppointmentSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const patient = await patientRepository.findById(parsed.data.patientId, dentistScope(auth));
    if (!patient) throw new NotFoundError("Paciente");

    const dentistId = assignedDentist(auth, parsed.data.dentistId);
    return appointmentRepository.create({
      title: parsed.data.title,
      description: parsed.data.description || null,
      date: parsed.data.date,
      duration: parsed.data.duration,
      patient: { connect: { id: parsed.data.patientId } },
      ...(dentistId && { dentist: { connect: { id: dentistId } } }),
    }, dentistScope(auth));
  },

  async update(id: string, input: unknown, auth: AuthContext) {
    const parsed = updateAppointmentSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    await this.getById(id, auth);
    if (parsed.data.dentistId !== undefined) assignedDentist(auth, parsed.data.dentistId ?? undefined);
    if (parsed.data.dentistId === null && dentistScope(auth)) throw new ForbiddenError();

    return appointmentRepository.update(id, {
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.date !== undefined && { date: parsed.data.date }),
      ...(parsed.data.duration !== undefined && { duration: parsed.data.duration }),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
      ...(parsed.data.dentistId !== undefined && (
        parsed.data.dentistId ? { dentist: { connect: { id: parsed.data.dentistId } } } : { dentist: { disconnect: true } }
      )),
    }, dentistScope(auth));
  },

  async delete(id: string, auth: AuthContext) {
    await this.getById(id, auth);
    await appointmentRepository.delete(id, dentistScope(auth));
    return { message: "Cita eliminada" };
  },
};
