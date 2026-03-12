import { handleApiError, successResponse } from "@/lib/api-response";
import { withAuth } from "@/lib/auth/middleware";
import { appointmentService } from "@/lib/services/appointment.service";
import { dentistService } from "@/lib/services/dentist.service";
import { patientService } from "@/lib/services/patient.service";
import { treatmentService } from "@/lib/services/treatment.service";
import { openai } from "@ai-sdk/openai";
import { generateText, stepCountIs, tool } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod/v4";

export const dynamic = "force-dynamic";

export const POST = withAuth(async (req) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY no configurada en .env" },
        { status: 503 }
      );
    }

    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message requerido" }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: `Eres el asistente de voz de DentAI, un sistema de gestión para una clínica dental.
Hoy es ${today}.
Responde siempre en español, de forma concisa y amigable.
Usa las herramientas disponibles para consultar datos reales de la clínica.
Si el usuario pide algo que no puedes hacer con las herramientas, explícalo brevemente.`,
      prompt: message,
      tools: {
        buscarPacientes: tool({
          description: "Busca pacientes por nombre o teléfono, o lista todos",
          inputSchema: z.object({
            search: z.string().optional().describe("Nombre o teléfono a buscar"),
          }),
          execute: async ({ search }) => {
            const result = await patientService.list({ search, limit: 5 });
            return result;
          },
        }),

        obtenerPaciente: tool({
          description: "Obtiene el perfil completo de un paciente con tratamientos, pagos y citas",
          inputSchema: z.object({
            id: z.string().describe("ID del paciente"),
          }),
          execute: async ({ id }) => {
            return await patientService.getById(id);
          },
        }),

        buscarDentistas: tool({
          description: "Lista o busca dentistas registrados",
          inputSchema: z.object({
            search: z.string().optional(),
          }),
          execute: async ({ search }) => {
            return await dentistService.list({ search, limit: 10 });
          },
        }),

        citasDeHoy: tool({
          description: "Obtiene las citas programadas para hoy u otra fecha",
          inputSchema: z.object({
            fecha: z.string().optional().describe("Fecha en formato YYYY-MM-DD. Default: hoy"),
          }),
          execute: async ({ fecha }) => {
            const day = fecha || today;
            return await appointmentService.list({
              dateFrom: new Date(day + "T00:00:00"),
              dateTo: new Date(day + "T23:59:59"),
              limit: 20,
            });
          },
        }),

        resumenFinanciero: tool({
          description: "Obtiene el resumen financiero: total de pacientes y tratamientos",
          inputSchema: z.object({}),
          execute: async () => {
            const [patients, treatments] = await Promise.all([
              patientService.list({ limit: 1 }),
              treatmentService.list({ limit: 1 }),
            ]);
            return {
              totalPacientes: patients.total,
              totalTratamientos: treatments.total,
            };
          },
        }),
      },
      stopWhen: stepCountIs(3),
    });

    return successResponse({ reply: text });
  } catch (error) {
    return handleApiError(error);
  }
});
