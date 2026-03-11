import type { AppointmentStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { appointmentRepository } from "@/lib/repositories";
import { createAppointmentSchema, updateAppointmentSchema } from "@/lib/schemas";

export const appointmentService = {
  async list(params: {
    patientId?: string;
    status?: AppointmentStatus;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      appointmentRepository.findMany({ ...params, skip, take: limit }),
      appointmentRepository.count(params),
    ]);

    return { data: appointments, total, page, limit };
  },

  async getById(id: string) {
    const appointment = await appointmentRepository.findById(id);
    if (!appointment) throw new NotFoundError("Cita");
    return appointment;
  },

  async create(input: unknown) {
    const parsed = createAppointmentSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const patient = await prisma.patient.findUnique({ where: { id: parsed.data.patientId } });
    if (!patient) throw new NotFoundError("Paciente");

    return appointmentRepository.create({
      title: parsed.data.title,
      description: parsed.data.description || null,
      date: parsed.data.date,
      duration: parsed.data.duration,
      patient: { connect: { id: parsed.data.patientId } },
      ...(parsed.data.dentistId && { dentist: { connect: { id: parsed.data.dentistId } } }),
    });
  },

  async update(id: string, input: unknown) {
    const parsed = updateAppointmentSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const appointment = await appointmentRepository.findById(id);
    if (!appointment) throw new NotFoundError("Cita");

    return appointmentRepository.update(id, {
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.date !== undefined && { date: parsed.data.date }),
      ...(parsed.data.duration !== undefined && { duration: parsed.data.duration }),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
      ...(parsed.data.dentistId !== undefined && (
        parsed.data.dentistId ? { dentist: { connect: { id: parsed.data.dentistId } } } : { dentist: { disconnect: true } }
      )),
    });
  },

  async delete(id: string) {
    const appointment = await appointmentRepository.findById(id);
    if (!appointment) throw new NotFoundError("Cita");
    await appointmentRepository.delete(id);
    return { message: "Cita eliminada" };
  },
};
