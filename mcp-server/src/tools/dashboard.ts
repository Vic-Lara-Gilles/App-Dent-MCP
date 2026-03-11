import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet } from "../client.js";

export function registerDashboardTools(server: McpServer): void {
  server.tool(
    "get_dashboard",
    "Resumen financiero del consultorio: pacientes con mayor deuda, tratamientos en curso y próximas citas.",
    {},
    async () => {
      const now = new Date().toISOString();
      const [patients, inProgressTreatments, upcomingAppointments] = await Promise.all([
        apiGet("/api/patients", { limit: "10" }),
        apiGet("/api/treatments", { status: "IN_PROGRESS" }),
        apiGet("/api/appointments", { dateFrom: now, limit: "10" }),
      ]);

      const summary = {
        retrievedAt: now,
        patients,
        inProgressTreatments,
        upcomingAppointments,
      };

      return { content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }] };
    }
  );

  server.tool(
    "get_calendar",
    "Obtiene las citas en un rango de fechas para vista de agenda. Por defecto muestra los próximos 7 días.",
    {
      dateFrom: z
        .string()
        .optional()
        .describe("Fecha inicio ISO 8601 (default: ahora)"),
      dateTo: z
        .string()
        .optional()
        .describe("Fecha fin ISO 8601 (default: +7 días desde dateFrom)"),
      patientId: z.string().optional().describe("Filtrar citas por paciente"),
    },
    async ({ dateFrom, dateTo, patientId }) => {
      const from = dateFrom ?? new Date().toISOString();
      const to =
        dateTo ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const params: Record<string, string> = { dateFrom: from, dateTo: to, limit: "50" };
      if (patientId) params.patientId = patientId;
      const data = await apiGet("/api/appointments", params);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
