import { z } from "zod";
import { tool } from "../types/index.js";
import { dbRun, dbAll } from "../db/index.js";

// Herramienta: append_insight - Para agregar insights de negocio
const appendInsight: tool<{
  insight: z.ZodString;
}> = {
  name: "append_insight",
  description: "Agregar un insight de negocio a la base de datos",
  schema: {
    insight: z.string().describe("Insight de negocio a agregar")
  },
  handler: async ({ insight }) => {
    try {
      await dbRun(`
        CREATE TABLE IF NOT EXISTS mcp_insights (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          insight TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await dbRun(
        "INSERT INTO mcp_insights (insight) VALUES (?)",
        [insight]
      );
      
      return {
        content: [
          { type: "text", text: JSON.stringify({ success: true, message: "Insight agregado" }, null, 2) }
        ],
        isError: false
      };
    } catch (e: any) {
      return {
        content: [
          { type: "text", text: e.message }
        ],
        isError: true
      };
    }
  }
};

// Herramienta: list_insights - Para listar insights de negocio
const listInsights: tool<{}> = {
  name: "list_insights",
  description: "Listar todos los insights de negocio",
  schema: {},
  handler: async () => {
    try {
      const result = await dbAll('SELECT * FROM mcp_insights ORDER BY created_at DESC');
      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ],
        isError: false
      };
    } catch (e: any) {
      return {
        content: [
          { type: "text", text: e.message }
        ],
        isError: true
      };
    }
  }
};

// Exportar todas las herramientas de negocio
export const businessTools = [
  appendInsight,
  listInsights
];
