import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAppointmentTools } from "./tools/appointments.js";
import { registerDashboardTools } from "./tools/dashboard.js";
import { registerPatientTools } from "./tools/patients.js";
import { registerTreatmentTools } from "./tools/treatments.js";

const server = new McpServer({
  name: "dent-ai",
  version: "1.0.0",
});

registerPatientTools(server);
registerTreatmentTools(server);
registerAppointmentTools(server);
registerDashboardTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
