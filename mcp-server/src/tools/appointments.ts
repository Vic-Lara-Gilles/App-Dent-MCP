import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPatch, apiPost } from "../client.js";

export function registerAppointmentTools(server: McpServer): void {
  server.tool(
    "list_appointments",
    "Lista citas. Filtra por paciente, estado y/o rango de fechas.",
    {
      patientId: z.string().optional().describe("ID del paciente"),
      status: z
        .enum(["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"])
        .optional()
        .describe("Estado de la cita"),
      dateFrom: z
        .string()
        .optional()
        .describe("Fecha inicio ISO 8601 (ej: '2025-03-01T00:00:00')"),
      dateTo: z.string().optional().describe("Fecha fin ISO 8601"),
      limit: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Máximo de resultados (default: 20)"),
    },
    async ({ patientId, status, dateFrom, dateTo, limit }) => {
      const params: Record<string, string> = {};
      if (patientId) params.patientId = patientId;
      if (status) params.status = status;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (limit) params.limit = String(limit);
      const data = await apiGet("/api/appointments", params);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_appointment",
    "Obtiene el detalle completo de una cita incluyendo datos del paciente.",
    { id: z.string().describe("ID de la cita") },
    async ({ id }) => {
      const data = await apiGet(`/api/appointments/${id}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_appointment",
    "Agenda una nueva cita para un paciente con fecha, hora y duración.",
    {
      patientId: z.string().describe("ID del paciente"),
      title: z
        .string()
        .min(1)
        .describe("Título de la cita (ej: 'Limpieza dental', 'Control ortodoncia')"),
      date: z
        .string()
        .describe("Fecha y hora en ISO 8601 (ej: '2025-03-15T10:00:00')"),
      duration: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Duración en minutos (default: 30)"),
      description: z.string().optional().describe("Observaciones adicionales opcionales"),
    },
    async (input) => {
      const data = await apiPost("/api/appointments", input);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_appointment",
    "Actualiza el estado u otros datos de una cita (confirmar, cancelar, completar, no-show).",
    {
      id: z.string().describe("ID de la cita"),
      status: z
        .enum(["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"])
        .optional()
        .describe("Nuevo estado de la cita"),
      title: z.string().optional().describe("Nuevo título"),
      date: z.string().optional().describe("Nueva fecha y hora ISO 8601"),
      duration: z.number().int().positive().optional().describe("Nueva duración en minutos"),
      description: z.string().optional().describe("Nueva descripción"),
      whatsappSent: z
        .boolean()
        .optional()
        .describe("Marcar si ya se envió el recordatorio por WhatsApp"),
    },
    async ({ id, ...body }) => {
      const data = await apiPatch(`/api/appointments/${id}`, body);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
