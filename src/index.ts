#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { DatabaseConfig, Tool, DatabaseResource } from './types/index.js';
import { isSelectQuery, isModificationQuery } from './utils/helpers.js';
import fs from 'fs';
import path from 'path';
import {
  initDatabase,
  dbAll,
  dbRun,
  dbExec,
  getListTablesQuery,
  getDescribeTableQuery,
  closeDatabase,
  getDatabaseMetadata
} from './db/index.js';
import minimist from 'minimist';

// Configurar el sistema de logs
const logFile = path.join(process.cwd(), 'server.log');
console.log('Iniciando servidor. Los logs se guardarán en:', logFile);

const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Función para formatear la fecha
function getTimestamp() {
  return new Date().toISOString();
}

// Sobrescribir console.log y console.error
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function (message, ...optionalParams) {
  const timestamp = getTimestamp();
  const logMessage = `[${timestamp}] ${message} ${optionalParams.join(' ')}`;
  logStream.write(logMessage + '\n');
  originalConsoleLog.call(console, logMessage);
};

console.error = function (message, ...optionalParams) {
  const timestamp = getTimestamp();
  const logMessage = `[${timestamp}] ERROR: ${message} ${optionalParams.join(' ')}`;
  logStream.write(logMessage + '\n');
  originalConsoleError.call(console, logMessage);
};

// Manejar el cierre del stream de logs
process.on('exit', () => {
  logStream.end();
});

process.on('SIGINT', () => {
  logStream.end();
  process.exit(0);
});

// Configurar el servidor
const server = new Server(
  {
    name: "db-connect",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  },
);

// Parsear argumentos de línea de comandos usando minimist
const args = minimist(process.argv.slice(2));

// Ejemplo: node index.js --mysql --host srv869.hstgr.io --database u210803106_citygps --port 3306 --user u210803106_citygps --password CityGps2024*

if (args.help || args.h) {
  console.log(`
mcp-db-connect - Servidor MCP para acceso a bases de datos

Uso:
  mcp-db-connect --mysql --host <host> --database <db> --port <puerto> --user <usuario> --password "<contraseña>"
  mcp-db-connect --sqlserver --host <host> --database <db> --port <puerto> --user <usuario> --password "<contraseña>" --trustServerCertificate true
  mcp-db-connect --postgresql --host <host> --database <db> --port <puerto> --user <usuario> --password "<contraseña>" --ssl true
  mcp-db-connect --sqlite --path /ruta/a/tu/base.db

Opciones:
  --mysql, --sqlserver, --postgresql, --sqlite   Selecciona el motor de base de datos
  --host         Host del servidor de base de datos
  --database     Nombre de la base de datos
  --port         Puerto de conexión
  --user         Usuario de la base de datos
  --password     Contraseña de la base de datos
  --path         Ruta al archivo SQLite
  --help, -h     Muestra esta ayuda

Ejemplo:
  mcp-db-connect --mysql --host localhost --database test --port 3306 --user root --password "miClave"
  `);
  process.exit(0);
}

let dbType = '';
let connectionInfo: any = {};

if (args.mysql) {
  dbType = 'mysql';
  connectionInfo = {
    host: args.host,
    database: args.database,
    user: args.user,
    password: args.password,
    port: parseInt(args.port),
    ssl: args.ssl === 'true'
  };
} else if (args.sqlserver) {
  dbType = 'sqlserver';
  connectionInfo = {
    server: args.host,
    database: args.database,
    user: args.user,
    password: args.password,
    port: parseInt(args.port),
    trustServerCertificate: args.trustServerCertificate === 'true'
  };
} else if (args.postgresql) {
  dbType = 'postgresql';
  connectionInfo = {
    host: args.host,
    database: args.database,
    user: args.user,
    password: args.password,
    port: parseInt(args.port),
    ssl: args.ssl === 'true'
  };
} else if (args.sqlite) {
  dbType = 'sqlite';
  connectionInfo = { path: args.path };
} else {
  throw new Error('Tipo de base de datos no soportado. Usa --mysql, --sqlserver, --postgresql o --sqlite');
}

async function runServer() {
  try {
    // Inicializar la base de datos
    await initDatabase(connectionInfo, dbType);
    console.log('Adaptador seleccionado:', JSON.stringify(getDatabaseMetadata(), null, 2));
    // Configurar manejadores de solicitudes
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
      try {
        const result = await dbAll(getListTablesQuery());
        return {
          resources: result.map((resource: any) => ({
            uri: `table://${resource.name}`,
            mimeType: "application/json",
            name: resource.name,
          }))
        };
      } catch (error) {
        console.error('Error al listar recursos:', error);
        return { resources: [] };
      }
    });

    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      try {
        const tableName = request.params.uri.split('://')[1];
        const result = await dbAll(getDescribeTableQuery(tableName));
        return {
          contents: [{
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        console.error('Error al leer recurso:', error);
        throw error;
      }
    });

    server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.log('Solicitud de herramientas recibida');
      const tools: Tool[] = [
        {
          name: 'read_query',
          description: 'Ejecutar una consulta SELECT',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Consulta SQL SELECT' }
            },
            required: ['query']
          }
        },
        {
          name: 'write_query',
          description: 'Ejecutar una consulta INSERT, UPDATE o DELETE',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Consulta SQL de modificación'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'create_table',
          description: 'Crear una nueva tabla',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Sentencia CREATE TABLE'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'alter_table',
          description: 'Modificar el esquema de una tabla',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Sentencia ALTER TABLE'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'drop_table',
          description: 'Eliminar una tabla',
          parameters: {
            type: 'object',
            properties: {
              table_name: {
                type: 'string',
                description: 'Nombre de la tabla'
              },
              confirm: {
                type: 'boolean',
                description: 'Confirmar eliminación'
              }
            },
            required: ['table_name', 'confirm']
          }
        },
        {
          name: 'export_query',
          description: 'Exportar resultados de una consulta',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Consulta SQL SELECT'
              },
              format: {
                type: 'string',
                description: 'Formato de exportación (csv o json)',
                enum: ['csv', 'json']
              }
            },
            required: ['query', 'format']
          }
        },
        {
          name: "list_tables",
          description: "Obtener una lista de todas las tablas en la base de datos",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        },
        {
          name: "describe_table",
          description: "Ver información del esquema de una tabla específica",
          parameters: {
            type: "object",
            properties: {
              table_name: { type: "string" }
            },
            required: ["table_name"]
          }
        },
        {
          name: "append_insight",
          description: "Agregar un insight de negocio a la base de datos",
          parameters: {
            type: "object",
            properties: {
              insight: { type: "string" },
            },
            required: ["insight"],
          },
        },
        {
          name: "list_insights",
          description: "Listar todos los insights de negocio",
          parameters: {
            type: "object",
            properties: {},
            required: []
          },
        },
      ];
      console.log('Tools enviados:', JSON.stringify(tools, null, 2));
      return {
        tools: tools.map(({ parameters, ...rest }) => ({
          ...rest,
          inputSchema: parameters
        }))
      };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const args = request.params.arguments as Record<string, any>;
        
        switch (request.params.name) {
          case 'read_query':
            if (!isSelectQuery(args.query as string)) {
              throw new Error('Solo se permiten consultas SELECT');
            }
            const readResult = await dbAll(args.query as string);
            return {
              content: [{ type: "text", text: JSON.stringify(readResult, null, 2) }],
              isError: false
            };

          case 'write_query':
            if (!isModificationQuery(args.query as string)) {
              throw new Error('Solo se permiten consultas INSERT, UPDATE o DELETE');
            }
            const writeResult = await dbRun(args.query as string);
            return {
              content: [{ type: "text", text: JSON.stringify(writeResult, null, 2) }],
              isError: false
            };

          case 'create_table':
            if (!(args.query as string).toLowerCase().includes('create table')) {
              throw new Error('Solo se permiten sentencias CREATE TABLE');
            }
            const createResult = await dbRun(args.query as string);
            return {
              content: [{ type: "text", text: JSON.stringify(createResult, null, 2) }],
              isError: false
            };

          case 'alter_table':
            if (!(args.query as string).toLowerCase().includes('alter table')) {
              throw new Error('Solo se permiten sentencias ALTER TABLE');
            }
            const alterResult = await dbRun(args.query as string);
            return {
              content: [{ type: "text", text: JSON.stringify(alterResult, null, 2) }],
              isError: false
            };

          case 'drop_table':
            if (!args.confirm) {
              throw new Error('Se requiere confirmación para eliminar una tabla');
            }
            const dropResult = await dbRun(`DROP TABLE ${args.table_name as string}`);
            return {
              content: [{ type: "text", text: JSON.stringify(dropResult, null, 2) }],
              isError: false
            };

          case 'export_query':
            if (!isSelectQuery(args.query as string)) {
              throw new Error('Solo se permiten consultas SELECT para exportar');
            }
            const exportResult = await dbAll(args.query as string);
            if (args.format === 'csv') {
              // Implementar exportación a CSV
              return {
                content: [{ type: "text", text: JSON.stringify(exportResult, null, 2) }],
                isError: false
              };
            } else if (args.format === 'json') {
              return {
                content: [{ type: "text", text: JSON.stringify(exportResult, null, 2) }],
                isError: false
              };
            }
            throw new Error('Formato de exportación no soportado');

          case "list_tables": {
            const result = await dbAll(getListTablesQuery());
            return {
              content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
              isError: false,
            };
          }

          case "describe_table": {
            const tableName = args.table_name as string;
            const result = await dbAll(`PRAGMA table_info("${tableName}")`);
            return {
              content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
              isError: false,
            };
          }

          case "append_insight": {
            const insight = args.insight as string;
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
              content: [{ type: "text", text: JSON.stringify({ success: true, message: "Insight agregado" }, null, 2) }],
              isError: false,
            };
          }

          case "list_insights": {
            const result = await dbAll('SELECT * FROM mcp_insights ORDER BY created_at DESC');
            return {
              content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
              isError: false,
            };
          }

          default:
            throw new Error(`Herramienta no soportada: ${request.params.name}`);
        }
      } catch (error) {
        console.error('Error al llamar herramienta:', error);
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    });

    // Iniciar el servidor MCP
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('Servidor MCP iniciado y escuchando en stdio');
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

runServer(); 