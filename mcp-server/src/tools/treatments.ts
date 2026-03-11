import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPatch, apiPost } from "../client.js";

export function registerTreatmentTools(server: McpServer): void {
  server.tool(
    "list_treatments",
    "Lista tratamientos. Filtra por paciente y/o estado.",
    {
      patientId: z.string().optional().describe("ID del paciente para filtrar"),
      status: z
        .enum(["IN_PROGRESS", "COMPLETED", "CANCELLED"])
        .optional()
        .describe("Estado del tratamiento"),
    },
    async ({ patientId, status }) => {
      const params: Record<string, string> = {};
      if (patientId) params.patientId = patientId;
      if (status) params.status = status;
      const data = await apiGet("/api/treatments", params);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_treatment",
    "Crea un nuevo tratamiento (bono de deuda) para un paciente con su monto total.",
    {
      patientId: z.string().describe("ID del paciente"),
      description: z
        .string()
        .min(1)
        .describe("Descripción del tratamiento (ej: 'Ortodoncia', 'Corona dental', 'Limpieza')"),
      totalAmount: z.number().positive().describe("Monto total del tratamiento a pagar"),
    },
    async (input) => {
      const data = await apiPost("/api/treatments", input);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_treatment",
    "Actualiza el estado o descripción de un tratamiento existente.",
    {
      id: z.string().describe("ID del tratamiento"),
      status: z
        .enum(["IN_PROGRESS", "COMPLETED", "CANCELLED"])
        .optional()
        .describe("Nuevo estado (COMPLETED solo si saldo = 0)"),
      description: z.string().optional().describe("Nueva descripción"),
    },
    async ({ id, ...body }) => {
      const data = await apiPatch(`/api/treatments/${id}`, body);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_balance",
    "Consulta el saldo pendiente de un tratamiento o todos los de un paciente.",
    {
      treatmentId: z.string().optional().describe("ID del tratamiento específico"),
      patientId: z
        .string()
        .optional()
        .describe("ID del paciente (retorna perfil con todos sus saldos y deuda total)"),
    },
    async ({ treatmentId, patientId }) => {
      if (treatmentId) {
        const data = await apiGet(`/api/treatments/${treatmentId}`);
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      }
      if (patientId) {
        const data = await apiGet(`/api/patients/${patientId}`);
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      }
      return {
        content: [
          { type: "text" as const, text: "Error: proporciona treatmentId o patientId" },
        ],
      };
    }
  );

  server.tool(
    "add_payment",
    "Registra un abono (pago parcial) a un tratamiento. Se completa automáticamente si el saldo llega a cero.",
    {
      treatmentId: z.string().describe("ID del tratamiento"),
      amount: z.number().positive().describe("Monto del abono"),
      method: z
        .enum(["CASH", "TRANSFER", "CARD", "OTHER"])
        .optional()
        .describe("Método de pago (default: CASH)"),
      note: z
        .string()
        .optional()
        .describe("Nota del abono (ej: 'Primer abono', 'Abono de marzo')"),
    },
    async (input) => {
      const data = await apiPost("/api/payments", input);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
