#!/usr/bin/env node


/**
 * @file index.ts
 * @description Servidor MCP (Model Context Protocol) para acceso a bases de datos
 * @version 1.0.0
 * @author Camilo Andres Agudelo
 * 
 * Este servidor implementa un protocolo MCP que permite la interacción con diferentes
 * tipos de bases de datos (MySQL, SQL Server, PostgreSQL y SQLite) a través de una
 * interfaz estandarizada. Proporciona herramientas para realizar operaciones CRUD,
 * gestión de esquemas y exportación de datos.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { DatabaseConfig, Tool, DatabaseResource } from './types/index.js';
import { isSelectQuery, isModificationQuery, formatSuccessResponse, formatErrorResponse,convertToCSV } from './utils/helpers.js';
import fs from 'fs';
import path from 'path';
import {
  initDatabase,
  dbAll,
  dbRun,
  dbExec,
  getListTablesQuery,
  getDescribeTableQuery,
  getListProceduresQuery,
  closeDatabase,
  getDatabaseMetadata,
  getListViewsQuery,
  getDescribeViewQuery,
  getListIndexesQuery,
  getDescribeIndexQuery,
  getSearchInDatabaseQuery
} from './db/index.js';
import minimist from 'minimist';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configura el sistema de logging de la aplicación
 * Crea un archivo de log en el directorio actual y configura los handlers
 * para console.log y console.error
 */
const logFile = path.join(process.cwd(), 'server.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

/**
 * Genera un timestamp en formato ISO para los logs
 * @returns {string} Timestamp en formato ISO
 */
function getTimestamp() {
  return new Date().toISOString();
}

// Sobrescribir console.log y console.error
// const originalConsoleLog = console.log;
// const originalConsoleError = console.error;

// console.log = function (message, ...optionalParams) {
//   const timestamp = getTimestamp();
//   const logMessage = `[${timestamp}] ${message} ${optionalParams.join(' ')}`;
//   logStream.write(logMessage + '\n');
//   originalConsoleLog.call(console, logMessage);
// };

// console.error = function (message, ...optionalParams) {
//   const timestamp = getTimestamp();
//   const logMessage = `[${timestamp}] ERROR: ${message} ${optionalParams.join(' ')}`;
//   logStream.write(logMessage + '\n');
//   originalConsoleError.call(console, logMessage);
// };

// Manejar el cierre del stream de logs
process.on('exit', () => {
  logStream.end();
});

process.on('SIGINT', () => {
  logStream.end();
  process.exit(0);
});

// Obtener la versión desde package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
let appVersion = 'desconocida';
try {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  appVersion = pkg.version;
} catch (e) {
  // Si falla, deja la versión como 'desconocida'
}

// Configurar el servidor
const server = new Server(
  {
    name: "mcp-db-connect",
    version: "1.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  },
);

// Cargar variables de entorno desde archivo .env
dotenv.config();

// Verificar si existe archivo .env y mostrar información útil
const envPath = path.join(process.cwd(), '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('📝 No se encontró archivo .env');
  console.log('💡 Creando archivo .env de ejemplo...');
  
  const exampleEnvContent = `# Configuración de Base de Datos para mcp-db-connect
# Copia este archivo como .env y configura tus valores

# Tipo de base de datos (mysql, sqlserver, postgresql, sqlite)
DB_TYPE=sqlserver

# Configuración general de conexión
DB_HOST=localhost
DB_NAME=test
DB_USER=sa
DB_PASSWORD=tu_contraseña
DB_PORT=1433

# Configuración específica para SQL Server
DB_INSTANCE=SQLEXPRESS

# Configuración de seguridad
DB_SSL=false
DB_TRUST_SERVER_CERTIFICATE=true

# Ejemplos para diferentes bases de datos:

# MySQL
# DB_TYPE=mysql
# DB_HOST=localhost
# DB_NAME=mi_base_datos
# DB_USER=root
# DB_PASSWORD=mi_contraseña
# DB_PORT=3306
# DB_SSL=false

# PostgreSQL
# DB_TYPE=postgresql
# DB_HOST=localhost
# DB_NAME=mi_base_datos
# DB_USER=postgres
# DB_PASSWORD=mi_contraseña
# DB_PORT=5432
# DB_SSL=false

# SQLite
# DB_TYPE=sqlite
# DB_PATH=/ruta/completa/a/mi_base.db`;

  try {
    fs.writeFileSync(envPath, exampleEnvContent);
    console.log('✅ Archivo .env creado exitosamente');
    console.log('🔧 Edita el archivo .env con tu configuración real');
    console.log('💡 Luego ejecuta: mcp-db-connect');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear archivo .env:', error);
    console.log('💡 Crea manualmente un archivo .env con tu configuración');
  }
}

// Parsear argumentos de línea de comandos usando minimist
const args = minimist(process.argv.slice(2));

/**
 * Obtiene el valor de configuración desde variables de entorno o argumentos
 * Prioriza las variables de entorno sobre los argumentos de línea de comandos
 * @param envKey - Clave de la variable de entorno
 * @param argKey - Clave del argumento de línea de comandos
 * @param defaultValue - Valor por defecto si no se encuentra
 * @returns El valor de configuración
 */
function getConfigValue(envKey: string, argKey: string, defaultValue?: string): string | undefined {
  // Primero intenta obtener desde variables de entorno
  const envValue = process.env[envKey];
  if (envValue !== undefined) {
    return envValue;
  }
  
  // Si no existe en variables de entorno, usa el argumento
  const argValue = args[argKey];
  if (argValue !== undefined && argValue !== true) {
    return String(argValue);
  }
  
  // Si no existe en ninguno, usa el valor por defecto
  return defaultValue;
}



if (args.v || args.version) {
  console.log(`mcp-db-connect versión ${appVersion}`);
  process.exit(0);
}

if (args.help || args.h) {
  console.log(`
mcp-db-connect - Servidor MCP para acceso a bases de datos

CONFIGURACIÓN:
  La aplicación puede configurarse usando variables de entorno (archivo .env) o argumentos de línea de comandos.
  Las variables de entorno tienen prioridad sobre los argumentos.

VARIABLES DE ENTORNO (.env):
  DB_TYPE                    Tipo de base de datos (mysql, sqlserver, postgresql, sqlite)
  DB_HOST                    Host del servidor de base de datos
  DB_NAME                    Nombre de la base de datos
  DB_USER                    Usuario de la base de datos
  DB_PASSWORD                Contraseña de la base de datos
  DB_PORT                    Puerto de conexión
  DB_PATH                    Ruta al archivo SQLite (solo para SQLite)
  DB_INSTANCE                Nombre de la instancia de SQL Server (opcional)
  DB_SSL                     Habilitar SSL (true/false)
  DB_TRUST_SERVER_CERTIFICATE Trust server certificate para SQL Server (true/false)

ARGUMENTOS DE LÍNEA DE COMANDOS:
  --mysql, --sqlserver, --postgresql, --sqlite   Selecciona el motor de base de datos
  --host         Host del servidor de base de datos
  --database     Nombre de la base de datos
  --port         Puerto de conexión
  --user         Usuario de la base de datos
  --password     Contraseña de la base de datos
  --path         Ruta al archivo SQLite
  --instance     Nombre de la instancia de SQL Server (opcional)
  --ssl          Habilitar SSL (true/false)
  --trustServerCertificate Trust server certificate para SQL Server (true/false)
  --help, -h     Muestra esta ayuda

EJEMPLOS:

Usando variables de entorno (.env):
  DB_TYPE=mysql
  DB_HOST=localhost
  DB_NAME=test
  DB_USER=root
  DB_PASSWORD=miClave
  DB_PORT=3306

Usando argumentos de línea de comandos:
  mcp-db-connect --mysql --host localhost --database test --port 3306 --user root --password "miClave"
  mcp-db-connect --sqlserver --host localhost --instance SQLEXPRESS --database test --port 1433 --user sa --password "miClave" --trustServerCertificate true
  mcp-db-connect --postgresql --host localhost --database test --port 5432 --user postgres --password "miClave" --ssl true
  mcp-db-connect --sqlite --path /ruta/a/tu/base.db
  `);
  process.exit(0);
}

let dbType = '';
let connectionInfo: any = {};

// Determinar el tipo de base de datos desde variables de entorno o argumentos
const dbTypeFromEnv = getConfigValue('DB_TYPE', 'db-type');
const dbTypeFromArgs = args.mysql ? 'mysql' : args.sqlserver ? 'sqlserver' : args.postgresql ? 'postgresql' : args.sqlite ? 'sqlite' : null;

console.log('Debug - dbTypeFromEnv:', dbTypeFromEnv);
console.log('Debug - dbTypeFromArgs:', dbTypeFromArgs);

dbType = dbTypeFromEnv || dbTypeFromArgs || '';

console.log('Debug - dbType final:', dbType);

if (!dbType) {
  console.error('❌ Error: Tipo de base de datos no especificado');
  console.error('');
  console.error('📋 Opciones de configuración:');
  console.error('   1. Crear un archivo .env con DB_TYPE=sqlserver');
  console.error('   2. Usar argumentos: --sqlserver --host localhost --database test --user sa --password "tu_password"');
  console.error('');
  console.error('🔧 Ejemplo de archivo .env:');
  console.error('   DB_TYPE=sqlserver');
  console.error('   DB_HOST=localhost');
  console.error('   DB_NAME=test');
  console.error('   DB_USER=sa');
  console.error('   DB_PASSWORD=tu_password');
  console.error('   DB_INSTANCE=SQLEXPRESS');
  console.error('');
  console.error('💡 Para más información, ejecuta: mcp-db-connect --help');
  throw new Error('Tipo de base de datos no especificado. Usa DB_TYPE en .env o --mysql, --sqlserver, --postgresql o --sqlite');
}

// Configurar la información de conexión según el tipo de base de datos
console.log('Debug - Tipo de base de datos:', dbType);
console.log('Debug - Argumentos recibidos:', JSON.stringify(args, null, 2));

if (dbType === 'mysql') {
  connectionInfo = {
    host: getConfigValue('DB_HOST', 'host'),
    database: getConfigValue('DB_NAME', 'database'),
    user: getConfigValue('DB_USER', 'user'),
    password: getConfigValue('DB_PASSWORD', 'password'),
    port: parseInt(getConfigValue('DB_PORT', 'port') || '3306'),
    ssl: getConfigValue('DB_SSL', 'ssl') === 'true'
  };
} else if (dbType === 'sqlserver') {
  const hostValue = getConfigValue('DB_HOST', 'host');
  const databaseValue = getConfigValue('DB_NAME', 'database');
  const userValue = getConfigValue('DB_USER', 'user');
  const passwordValue = getConfigValue('DB_PASSWORD', 'password');
  
  console.log('Debug - SQL Server valores:', {
    host: hostValue,
    database: databaseValue,
    user: userValue,
    password: passwordValue ? '[HIDDEN]' : 'undefined'
  });
  
  connectionInfo = {
    server: hostValue,
    database: databaseValue,
    user: userValue,
    password: passwordValue,
    port: parseInt(getConfigValue('DB_PORT', 'port') || '1433'),
    trustServerCertificate: getConfigValue('DB_TRUST_SERVER_CERTIFICATE', 'trustServerCertificate') === 'true',
    options: {}
  };
  
  const instance = getConfigValue('DB_INSTANCE', 'instance');
  if (instance) {
    connectionInfo.options.instanceName = instance;
  }
} else if (dbType === 'postgresql') {
  connectionInfo = {
    host: getConfigValue('DB_HOST', 'host'),
    database: getConfigValue('DB_NAME', 'database'),
    user: getConfigValue('DB_USER', 'user'),
    password: getConfigValue('DB_PASSWORD', 'password'),
    port: parseInt(getConfigValue('DB_PORT', 'port') || '5432'),
    ssl: getConfigValue('DB_SSL', 'ssl') === 'true'
  };
} else if (dbType === 'sqlite') {
  connectionInfo = { 
    path: getConfigValue('DB_PATH', 'path') 
  };
} else {
  throw new Error(`Tipo de base de datos no soportado: ${dbType}`);
}

// Validar que los campos requeridos estén presentes
const requiredFields = dbType === 'sqlite' ? ['path'] : dbType === 'sqlserver' ? ['server', 'database', 'user', 'password'] : ['host', 'database', 'user', 'password'];

console.log('Debug - Tipo de base de datos:', dbType);
console.log('Debug - Campos requeridos:', requiredFields);
console.log('Debug - Información de conexión:', JSON.stringify(connectionInfo, null, 2));

for (const field of requiredFields) {
  if (!connectionInfo[field]) {
    console.error(`❌ Error: Campo requerido faltante: ${field}`);
    console.error('');
    console.error(`📋 Para ${dbType}, necesitas configurar:`);
    if (dbType === 'sqlserver') {
      console.error('   DB_HOST o --host (servidor SQL Server)');
      console.error('   DB_NAME o --database (nombre de la base de datos)');
      console.error('   DB_USER o --user (usuario)');
      console.error('   DB_PASSWORD o --password (contraseña)');
      console.error('   DB_INSTANCE o --instance (opcional, nombre de la instancia)');
    } else if (dbType === 'mysql') {
      console.error('   DB_HOST o --host (servidor MySQL)');
      console.error('   DB_NAME o --database (nombre de la base de datos)');
      console.error('   DB_USER o --user (usuario)');
      console.error('   DB_PASSWORD o --password (contraseña)');
    } else if (dbType === 'postgresql') {
      console.error('   DB_HOST o --host (servidor PostgreSQL)');
      console.error('   DB_NAME o --database (nombre de la base de datos)');
      console.error('   DB_USER o --user (usuario)');
      console.error('   DB_PASSWORD o --password (contraseña)');
    } else if (dbType === 'sqlite') {
      console.error('   DB_PATH o --path (ruta al archivo SQLite)');
    }
    console.error('');
    console.error('💡 Para más información, ejecuta: mcp-db-connect --help');
    throw new Error(`Campo requerido faltante: ${field}. Configúralo en .env o como argumento de línea de comandos.`);
  }
}

/**
 * Inicializa y ejecuta el servidor MCP
 * Configura los handlers para las diferentes solicitudes y establece la conexión
 * con la base de datos especificada
 */
async function runServer() {
  try {
    // Inicializar la base de datos
    await initDatabase(connectionInfo, dbType);
    logToFile('Adaptador seleccionado:', JSON.stringify(getDatabaseMetadata(), null, 2));
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
        logToFile('Error al listar recursos:', error);
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
        logToFile('Error al leer recurso:', error);
        throw error;
      }
    });

    server.setRequestHandler(ListToolsRequestSchema, async () => {
      //console.log('Solicitud de herramientas recibida');
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
          description: 'Ejecutar una consulta de tipo INSERT, UPDATE o DELETE, CREATE, ALTER, EXEC, CALL, SP_',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'query de tipo INSERT, UPDATE o DELETE, CREATE, ALTER, EXEC, CALL, SP_'
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
          name: "list_procedures",
          description: "Obtener una lista de todos los procedimientos almacenados en la base de datos",
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
        {
          name: "list_views",
          description: "Obtener una lista de todas las vistas (views) en la base de datos",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        },
        {
          name: "describe_view",
          description: "Ver la definición SQL de una vista específica",
          parameters: {
            type: "object",
            properties: {
              view_name: { type: "string" }
            },
            required: ["view_name"]
          }
        },
        {
          name: "list_indexes",
          description: "Obtener una lista de todos los índices en la base de datos o de una tabla específica",
          parameters: {
            type: "object",
            properties: {
              table_name: { type: "string", description: "(Opcional) Nombre de la tabla" }
            },
            required: []
          }
        },
        {
          name: "describe_index",
          description: "Ver la definición de un índice específico",
          parameters: {
            type: "object",
            properties: {
              index_name: { type: "string" },
              table_name: { type: "string", description: "(Opcional) Nombre de la tabla" }
            },
            required: ["index_name"]
          }
        },
        {
          name: "search_in_database",
          description: "Buscar un valor en todas las tablas y columnas de la base de datos",
          parameters: {
            type: "object",
            properties: {
              search: { type: "string", description: "Valor a buscar" }
            },
            required: ["search"]
          }
        },
      ];
      //console.log('Tools enviados:', JSON.stringify(tools, null, 2));
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
            return formatSuccessResponse(readResult);


          case 'write_query':
            //if (!isModificationQuery(args.query as string)) {
            //  throw new Error('Solo se permiten consultas INSERT, UPDATE o DELETE o CREATE, ALTER, EXEC, CALL, SP_');
            //}
            const writeResult = await dbRun(args.query as string);
            return formatSuccessResponse(writeResult);

          case 'create_table':
            if (!(args.query as string).toLowerCase().includes('create table')) {
              throw new Error('Solo se permiten sentencias CREATE TABLE');
            }
            const createResult = await dbRun(args.query as string);
            return formatSuccessResponse(createResult);


          case 'alter_table':
            if (!(args.query as string).toLowerCase().includes('alter table')) {
              throw new Error('Solo se permiten sentencias ALTER TABLE');
            }
            const alterResult = await dbRun(args.query as string);
            return formatSuccessResponse(alterResult);


          case 'drop_table':
            if (!args.confirm) {
              throw new Error('Se requiere confirmación para eliminar una tabla');
            }
            const dropResult = await dbRun(`DROP TABLE ${args.table_name as string}`);
            return formatSuccessResponse(dropResult);

          case 'export_query':
            if (!isSelectQuery(args.query as string)) {
              throw new Error('Solo se permiten consultas SELECT para exportar');
            }
            const exportResult = await dbAll(args.query as string);

            if (args.format === 'csv') {
              // Implementar exportación a CSV
              const csvContent = convertToCSV(exportResult);
              return {
                content: [{ type: "text", text: csvContent }],
                isError: false
              };
            } else if (args.format === 'json') {
              return formatSuccessResponse(exportResult);
            }
            throw new Error('Formato de exportación no soportado');

          case "list_tables": {
            const result = await dbAll(getListTablesQuery());
            return formatSuccessResponse(result);
          }

          case "list_procedures": {
            const result = await dbAll(getListProceduresQuery());
            return formatSuccessResponse(result);  
          }
          case "describe_table": {
            const tableName = args.table_name as string;
            const query = getDescribeTableQuery(tableName);
            const result = await dbAll(query);
            return formatSuccessResponse(result);
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
            return formatSuccessResponse({ success: true, message: "Insight agregado" });

          }

          case "list_insights": {
            const result = await dbAll('SELECT * FROM mcp_insights ORDER BY created_at DESC');
            return formatSuccessResponse(result);
          }

          case "list_views": {
            const result = await dbAll(getListViewsQuery());
            return formatSuccessResponse(result);
          }
          case "describe_view": {
            const viewName = args.view_name as string;
            const result = await dbAll(getDescribeViewQuery(viewName));
            return formatSuccessResponse(result);
          }
          case "list_indexes": {
            const tableName = args.table_name as string | undefined;
            const result = await dbAll(getListIndexesQuery(tableName));
            return formatSuccessResponse(result);
          }
          case "describe_index": {
            const indexName = args.index_name as string;
            const tableName = args.table_name as string | undefined;
            const result = await dbAll(getDescribeIndexQuery(indexName, tableName));
            return formatSuccessResponse(result);
          }
          case "search_in_database": {
            const search = args.search as string;
            if (dbType === 'sqlserver') {
              const result = await dbAll(getSearchInDatabaseQuery(search));
              return formatSuccessResponse(result);
            } else {
              return formatErrorResponse('Metodo no soportado para esta base de datos');
            }
          }

          default:
            throw new Error(`Herramienta no soportada: ${request.params.name}`);
        }
      } catch (error) {
        logToFile('Error al llamar herramienta:', error);
        return formatErrorResponse(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    // Iniciar el servidor MCP
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logToFile('Servidor MCP iniciado y escuchando en stdio');
  } catch (error) {
    logToFile('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

runServer(); 

function logToFile(message: string, ...optionalParams: any[]) {
  const timestamp = getTimestamp();
  const logMessage = `[${timestamp}] ${message} ${optionalParams.join(' ')}`;
  logStream.write(logMessage + '\n');
} 