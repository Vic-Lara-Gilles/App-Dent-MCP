import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPatch, apiPost } from "../client.js";

export function registerDentistTools(server: McpServer): void {
  server.tool(
    "list_dentists",
    "Lista dentistas registrados. Permite buscar por nombre o teléfono.",
    {
      search: z.string().optional().describe("Buscar por nombre o teléfono"),
      page: z.number().int().min(1).optional().describe("Número de página"),
      limit: z.number().int().min(1).max(50).optional().describe("Resultados por página"),
    },
    async ({ search, page, limit }) => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (page) params.page = String(page);
      if (limit) params.limit = String(limit);
      const data = await apiGet("/api/dentists", params);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_dentist",
    "Obtiene el perfil de un dentista con sus tratamientos y citas recientes.",
    { id: z.string().describe("ID del dentista (cuid)") },
    async ({ id }) => {
      const data = await apiGet(`/api/dentists/${id}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_dentist",
    "Registra un nuevo dentista en el sistema.",
    {
      firstName: z.string().min(1).describe("Nombre del dentista"),
      lastName: z.string().min(1).describe("Apellido del dentista"),
      phone: z.string().min(1).describe("Teléfono (único)"),
      email: z.string().email().optional().describe("Correo electrónico (opcional)"),
      specialty: z.string().optional().describe("Especialidad (opcional, ej: Ortodoncia)"),
    },
    async (input) => {
      const data = await apiPost("/api/dentists", input);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_dentist",
    "Actualiza los datos de un dentista existente.",
    {
      id: z.string().describe("ID del dentista"),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      specialty: z.string().optional(),
    },
    async ({ id, ...body }) => {
      const data = await apiPatch(`/api/dentists/${id}`, body);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
