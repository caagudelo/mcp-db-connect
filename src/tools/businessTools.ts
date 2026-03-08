import { z } from "zod";
import { tool } from "../types/index.js";
import { dbRun, dbAll, getDatabaseMetadata } from "../db/index.js";

/**
 * Genera el DDL de CREATE TABLE para mcp_insights según el motor de BD
 */
function getCreateInsightsTableQuery(dbType: string): string {
  switch (dbType) {
    case 'sqlserver':
      return `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'mcp_insights')
        CREATE TABLE mcp_insights (
          id INT IDENTITY(1,1) PRIMARY KEY,
          insight NVARCHAR(MAX) NOT NULL,
          created_at DATETIME DEFAULT GETDATE()
        )`;
    case 'mysql':
      return `CREATE TABLE IF NOT EXISTS mcp_insights (
          id INT AUTO_INCREMENT PRIMARY KEY,
          insight TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
    case 'postgresql':
      return `CREATE TABLE IF NOT EXISTS mcp_insights (
          id SERIAL PRIMARY KEY,
          insight TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
    default:
      throw new Error(`Motor de base de datos no soportado para insights: ${dbType}`);
  }
}

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
      const metadata = getDatabaseMetadata();
      await dbRun(getCreateInsightsTableQuery(metadata.type));
      
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
