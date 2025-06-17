import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import {
  dbAll, dbRun, getListTablesQuery, getDescribeTableQuery, getListProceduresQuery, getListViewsQuery, getDescribeViewQuery, getListIndexesQuery, getDescribeIndexQuery, getSearchInDatabaseQuery
} from "./db/index.js";
import {
  isSelectQuery, isModificationQuery, formatSuccessResponse, formatErrorResponse, convertToCSV
} from "./utils/helpers.js";
import minimist from 'minimist';
import { initDatabase, getDatabaseMetadata } from "./db/index.js";

const args = minimist(process.argv.slice(2));
let dbType = '';
let connectionInfo: any = {};

if (args.mysql) {
  dbType = 'mysql';
  connectionInfo = {
    host: args.host,
    database: args.database,
    user: args.user,
    password: String(args.password),
    port: parseInt(args.port),
    ssl: args.ssl === 'true'
  };
} else if (args.sqlserver) {
  dbType = 'sqlserver';
  connectionInfo = {
    server: args.host,
    database: args.database,
    user: args.user,
    password: String(args.password),
    port: parseInt(args.port),
    trustServerCertificate: args.trustServerCertificate === 'true',
    options: {}
  };
  if (args.instance) {
    connectionInfo.options.instanceName = args.instance;
  }
} else if (args.postgresql) {
  dbType = 'postgresql';
  connectionInfo = {
    host: args.host,
    database: args.database,
    user: args.user,
    password: String(args.password),
    port: parseInt(args.port),
    ssl: args.ssl === 'true'
  };
} else if (args.sqlite) {
  dbType = 'sqlite';
  connectionInfo = { path: args.path };
} else {
  throw new Error('Tipo de base de datos no soportado. Usa --mysql, --sqlserver, --postgresql o --sqlite');
}

const server = new McpServer({
  name: "mcp-db-connect-http",
  version: "1.0.0",
});

// Herramienta: read_query
server.tool(
  "read_query",
  "Consulta SQL SELECT",
  {
    query: z.string().describe("Consulta SQL SELECT")
  },
  async ({ query }, extra) => {
    try {
      if (!isSelectQuery(query)) throw new Error("Solo se permiten consultas SELECT");
      const result = await dbAll(query);
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
);

// Herramienta: write_query
server.tool(
  "write_query",
  "Ejecuta una consulta SQL de tipo (INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, EXEC, CALL, etc.).",
  {
    query: z.string().describe("Consulta SQL de tipo (INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, EXEC, CALL, etc.)")
  },
  async ({ query }, extra) => {
    try {
      //if (!isModificationQuery(query)) throw new Error("Solo se permiten consultas de modificación (INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, EXEC, CALL, etc.)");
      const result = await dbRun(query);
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
);

// Herramienta: create_table
server.tool(
  "create_table",
  "Sentencia CREATE TABLE",
  {
    query: z.string().describe("Sentencia CREATE TABLE")
  },
  async ({ query }, extra) => {
    try {
      if (!(query.toLowerCase().includes('create table'))) throw new Error('Solo se permiten sentencias CREATE TABLE');
      const result = await dbRun(query);
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
);

// Herramienta: alter_table
server.tool(
  "alter_table",
  "Sentencia ALTER TABLE",
  {
    query: z.string().describe("Sentencia ALTER TABLE")
  },
  async ({ query }, extra) => {
    try {
      if (!(query.toLowerCase().includes('alter table'))) throw new Error('Solo se permiten sentencias ALTER TABLE');
      const result = await dbRun(query);
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
);

// Herramienta: drop_table
server.tool(
  "drop_table",
  "Eliminar una tabla",
  {
    table_name: z.string().describe("Nombre de la tabla"),
    confirm: z.boolean().describe("Confirmar eliminación")
  },
  async ({ table_name, confirm }, extra) => {
    try {
      if (!confirm) throw new Error('Se requiere confirmación para eliminar una tabla');
      const result = await dbRun(`DROP TABLE ${table_name}`);
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
);

// Herramienta: export_query
server.tool(
  "export_query",
  "Exportar resultados de una consulta",
  {
    query: z.string().describe("Consulta SQL SELECT"),
    format: z.enum(["csv", "json"]).describe("Formato de exportación (csv o json)")
  },
  async ({ query, format }, extra) => {
    try {
      if (!isSelectQuery(query)) throw new Error('Solo se permiten consultas SELECT para exportar');
      const exportResult = await dbAll(query);
      if (format === 'csv') {
        const csvContent = convertToCSV(exportResult);
        return {
          content: [
            { type: "text", text: csvContent }
          ],
          isError: false
        };
      } else if (format === 'json') {
        return {
          content: [
            { type: "text", text: JSON.stringify(exportResult, null, 2) }
          ],
          isError: false
        };
      }
      throw new Error('Formato de exportación no soportado');
    } catch (e: any) {
      return {
        content: [
          { type: "text", text: e.message }
        ],
        isError: true
      };
    }
  }
);

// Herramienta: list_tables
server.tool(
  "list_tables",
  "Obtener una lista de todas las tablas en la base de datos",
  {
    type: "object",
    properties: {},
    required: []
  },
  async (args, extra) => {
    try {
      //console.log("Handler 'list_tables' invocado. args:", args);
      const result = await dbAll(getListTablesQuery());
      //console.log("Resultado de dbAll(getListTablesQuery()):", result);

      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ],
        isError: false
      };
    } catch (e: any) {
      console.error("Error en 'list_tables':", e);
      return {
        content: [
          { type: "text", text: e.message }
        ],
        isError: true
      };
    }
  }
);

// Herramienta: list_procedures
server.tool(
  "list_procedures",
  "Obtener una lista de todos los procedimientos almacenados en la base de datos",
  {
    type: "object",
    properties: {},
    required: []
  },
  async (args, extra) => {
    try {
      const result = await dbAll(getListProceduresQuery());
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
);

// Herramienta: describe_table
server.tool(
  "describe_table",
  "Ver información del esquema de una tabla específica",
  {
    table_name: z.string().describe("Nombre de la tabla")
  },
  async ({ table_name }, extra) => {
    console.log("[DEBUG describe_table] table_name:", table_name);
    try {
      const query = getDescribeTableQuery(table_name);
      const result = await dbAll(query);
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
);

// Herramienta: append_insight
server.tool(
  "append_insight",
  "Agregar un insight de negocio a la base de datos",
  {
    insight: z.string().describe("Insight de negocio")
  },
  async ({ insight }, extra) => {
    try {
      await dbRun(`CREATE TABLE IF NOT EXISTS mcp_insights (id INTEGER PRIMARY KEY AUTOINCREMENT, insight TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
      await dbRun("INSERT INTO mcp_insights (insight) VALUES (?)", [insight]);
      return {
        content: [
          { type: "text", text: "Insight agregado" }
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
);

// Herramienta: list_insights
server.tool(
  "list_insights",
  "Listar todos los insights de negocio almacenados en la base de datos",
  {
    type: "object",
    properties: {},
    required: []
  },
  async (args, extra) => {
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
);

// Herramienta: list_views
server.tool(
  "list_views",
  "Obtener una lista de todas las vistas (views) en la base de datos",
  {
    type: "object",
    properties: {},
    required: []
  },
  async (args, extra) => {
    try {
      const result = await dbAll(getListViewsQuery());
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
);

// Herramienta: describe_view
server.tool(
  "describe_view",
  "Ver la definición SQL de una vista específica",
  {
    view_name: z.string().describe("Nombre de la vista")
  },
  async ({ view_name }, extra) => {
    try {
      const result = await dbAll(getDescribeViewQuery(view_name));
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
);

// Herramienta: list_indexes
server.tool(
  "list_indexes",
  "Obtener una lista de todos los índices en la base de datos o de una tabla específica",
  {
    table_name: z.string().describe("(Opcional) Nombre de la tabla").optional()
  },
  async ({ table_name }, extra) => {
    try {
      const result = await dbAll(getListIndexesQuery(table_name));
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
);

// Herramienta: describe_index
server.tool(
  "describe_index",
  "Ver la definición de un índice específico",
  {
    index_name: z.string().describe("Nombre del índice"),
    table_name: z.string().describe("(Opcional) Nombre de la tabla").optional()
  },
  async ({ index_name, table_name }, extra) => {
    try {
      const result = await dbAll(getDescribeIndexQuery(index_name, table_name));
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
);

// Herramienta: search_in_database
server.tool(
  "search_in_database",
  "Buscar un valor en todas las tablas y columnas de la base de datos",
  {
    search: z.string().describe("Valor a buscar")
  },
  async ({ search }, extra) => {
    try {
      if (dbType === 'sqlserver') {
        const result = await dbAll(getSearchInDatabaseQuery(search));
        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) }
          ],
          isError: false
        };
      } else {
        throw new Error('Metodo no soportado para esta base de datos');
      }
    } catch (e: any) {
      return {
        content: [
          { type: "text", text: e.message }
        ],
        isError: true
      };
    }
  }
);

// Herramienta de prueba para depuración
server.tool(
  "hello_world",
  "Devuelve un saludo de prueba",
  {},
  async () => ({
    content: [{ type: "text", text: "¡Hola mundo!" }],
    isError: false
  })
);

const app = express();
app.use(express.json());

// Inicialización del transporte y conexión del servidor
const transport: StreamableHTTPServerTransport =
  new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // set to undefined for stateless servers
  });
const setupServer = async () => {
  await initDatabase(connectionInfo, dbType);
  console.log('Conectado a:', getDatabaseMetadata());
  await server.connect(transport);
};

app.post("/mcp", async (req: Request, res: Response) => {
  console.log("\n=== Nueva Petición MCP ===");
  console.log("Headers:", req.headers);
  console.log("Body:", JSON.stringify(req.body, null, 2));
  console.log("Method:", req.body.method);
  console.log("Params:", req.body.params);
  console.log("========================\n");
  
  await transport.handleRequest(req, res, req.body);
});

app.get("/mcp", (req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
});
app.delete("/mcp", (req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
});

// Endpoint raíz para evitar HTML por defecto
app.get('/', (req, res) => {
  res.type('text/plain').send('MCP DB Connect HTTP server is running. Use POST /mcp for MCP requests.');
});

const PORT = process.env.PORT || 3000;
setupServer()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`MCP HTTP Server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to set up the server:", error);
    process.exit(1);
  });


// Prueba con:
// curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"call_tool","params":{"name":"hello_world","arguments":{}}}' 