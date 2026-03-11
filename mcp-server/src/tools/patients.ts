import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPatch, apiPost } from "../client.js";

export function registerPatientTools(server: McpServer): void {
  server.tool(
    "list_patients",
    "Lista pacientes registrados. Permite buscar por nombre o teléfono.",
    {
      search: z.string().optional().describe("Buscar por nombre o teléfono"),
      page: z.number().int().min(1).optional().describe("Número de página (default: 1)"),
      limit: z.number().int().min(1).max(50).optional().describe("Resultados por página (default: 20)"),
    },
    async ({ search, page, limit }) => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (page) params.page = String(page);
      if (limit) params.limit = String(limit);
      const data = await apiGet("/api/patients", params);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_patient",
    "Obtiene el perfil completo de un paciente: datos personales, tratamientos, pagos históricos y citas.",
    { id: z.string().describe("ID del paciente (cuid)") },
    async ({ id }) => {
      const data = await apiGet(`/api/patients/${id}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_patient",
    "Registra un nuevo paciente en el sistema.",
    {
      firstName: z.string().min(1).describe("Nombre del paciente"),
      lastName: z.string().min(1).describe("Apellido del paciente"),
      phone: z.string().min(1).describe("Teléfono (único, se usa para WhatsApp)"),
      email: z.string().email().optional().describe("Correo electrónico (opcional)"),
      notes: z.string().optional().describe("Observaciones clínicas generales (opcional)"),
    },
    async (input) => {
      const data = await apiPost("/api/patients", input);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_patient",
    "Actualiza los datos de un paciente existente.",
    {
      id: z.string().describe("ID del paciente"),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      notes: z.string().optional(),
    },
    async ({ id, ...body }) => {
      const data = await apiPatch(`/api/patients/${id}`, body);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
