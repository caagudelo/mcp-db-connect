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

import { DatabaseConfig } from './types/index.js';
import fs from 'fs';
import path from 'path';
import {
  initDatabase,
  dbAll,
  getListTablesQuery,
  getDescribeTableQuery,
  getDatabaseMetadata
} from './db/index.js';
import { registerAllTools, getAllTools } from './tools/index.js';
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

// Función para logging que solo escribe a archivo, no a stdio
function logToFile(message: string, ...optionalParams: any[]) {
  const timestamp = getTimestamp();
  const logMessage = `[${timestamp}] ${message} ${optionalParams.join(' ')}`;
  logStream.write(logMessage + '\n');
}

// Función para logging de debug que solo escribe a archivo
function debugLog(message: string, ...optionalParams: any[]) {
  const timestamp = getTimestamp();
  const logMessage = `[${timestamp}] DEBUG: ${message} ${optionalParams.join(' ')}`;
  logStream.write(logMessage + '\n');
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
// Cargar dotenv de forma silenciosa para evitar interferir con stdio
try {
  // Suprimir temporalmente stdout y stderr
  const originalStdout = process.stdout.write;
  const originalStderr = process.stderr.write;
  
  process.stdout.write = () => true;
  process.stderr.write = () => true;
  
  // Cargar dotenv silenciosamente
  dotenv.config();
  
  // Restaurar stdout y stderr
  process.stdout.write = originalStdout;
  process.stderr.write = originalStderr;
  
  debugLog('Variables de entorno cargadas desde dotenv');
} catch (error) {
  debugLog('Error al cargar dotenv:', error);
}

// Verificar si existe archivo .env y mostrar información útil
const envPath = path.join(process.cwd(), '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  debugLog('No se encontró archivo .env');
  debugLog('Creando archivo .env de ejemplo...');
  
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
    debugLog('Archivo .env creado exitosamente');
    debugLog('Edita el archivo .env con tu configuración real');
    debugLog('Luego ejecuta: mcp-db-connect');
    process.exit(0);
  } catch (error) {
    debugLog('Error al crear archivo .env:', error);
    debugLog('Crea manualmente un archivo .env con tu configuración');
  }
}

// Parsear argumentos de línea de comandos usando minimist

const args = minimist(process.argv.slice(2));

// Obtener si se usa autenticación integrada de Windows
function getBooleanConfigValue(envKey: string, argKey: string, defaultValue = false): boolean {
  const envValue = process.env[envKey];
  if (envValue !== undefined) {
    return envValue === 'true' || envValue === '1';
  }
  const argValue = args[argKey];
  if (argValue !== undefined && argValue !== true) {
    return argValue === 'true' || argValue === '1';
  }
  return defaultValue;
}

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
  debugLog(`mcp-db-connect versión ${appVersion}`);
  process.exit(0);
}

if (args.help || args.h) {
  debugLog(`
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

debugLog('dbTypeFromEnv:', dbTypeFromEnv);
debugLog('dbTypeFromArgs:', dbTypeFromArgs);

dbType = dbTypeFromEnv || dbTypeFromArgs || '';

debugLog('dbType final:', dbType);

if (!dbType) {
  debugLog('Error: Tipo de base de datos no especificado');
  debugLog('');
  debugLog('Opciones de configuración:');
  debugLog('   1. Crear un archivo .env con DB_TYPE=sqlserver');
  debugLog('   2. Usar argumentos: --sqlserver --host localhost --database test --user sa --password "tu_password"');
  debugLog('');
  debugLog('Ejemplo de archivo .env:');
  debugLog('   DB_TYPE=sqlserver');
  debugLog('   DB_HOST=localhost');
  debugLog('   DB_NAME=test');
  debugLog('   DB_USER=sa');
  debugLog('   DB_PASSWORD=tu_password');
  debugLog('   DB_INSTANCE=SQLEXPRESS');
  debugLog('');
  debugLog('Para más información, ejecuta: mcp-db-connect --help');
  throw new Error('Tipo de base de datos no especificado. Usa DB_TYPE en .env o --mysql, --sqlserver, --postgresql o --sqlite');
}

// Configurar la información de conexión según el tipo de base de datos
debugLog('Tipo de base de datos:', dbType);
debugLog('Argumentos recibidos:', JSON.stringify(args, null, 2));


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
  const integratedSecurity = getBooleanConfigValue('DB_INTEGRATED_SECURITY', 'integratedSecurity');
  debugLog('SQL Server valores:', {
    host: hostValue,
    database: databaseValue,
    user: userValue,
    password: passwordValue ? '[HIDDEN]' : 'undefined',
    integratedSecurity
  });
  const instance = getConfigValue('DB_INSTANCE', 'instance');
  if (integratedSecurity) {
    // Permitir pasar el dominio por variable de entorno o argumento de línea de comandos
    const domainValue = getConfigValue('DB_DOMAIN', 'domain', process.env.USERDOMAIN || '');
    connectionInfo = {
      server: hostValue,
      database: databaseValue,
      port: parseInt(getConfigValue('DB_PORT', 'port') || '1433'),
      options: {
        trustServerCertificate: getConfigValue('DB_TRUST_SERVER_CERTIFICATE', 'trustServerCertificate') === 'true',
        instanceName: instance || undefined
      },
      authentication: {
        type: 'ntlm',
        options: {
          domain: domainValue,
          userName: '', // Usar usuario actual
          password: ''  // Usar usuario actual
        }
      }
    };
  } else {
    connectionInfo = {
      server: hostValue,
      database: databaseValue,
      user: userValue,
      password: passwordValue,
      port: parseInt(getConfigValue('DB_PORT', 'port') || '1433'),
      trustServerCertificate: getConfigValue('DB_TRUST_SERVER_CERTIFICATE', 'trustServerCertificate') === 'true',
      options: {}
    };
    if (instance) {
      connectionInfo.options.instanceName = instance;
    }
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
let requiredFields: string[] = [];
if (dbType === 'sqlite') {
  requiredFields = ['path'];
} else if (dbType === 'sqlserver') {
  const integratedSecurity = getBooleanConfigValue('DB_INTEGRATED_SECURITY', 'integratedSecurity');
  if (integratedSecurity) {
    requiredFields = ['server', 'database']; // No requiere user/password
  } else {
    requiredFields = ['server', 'database', 'user', 'password'];
  }
} else {
  requiredFields = ['host', 'database', 'user', 'password'];
}

debugLog('Tipo de base de datos:', dbType);
debugLog('Campos requeridos:', requiredFields);
debugLog('Información de conexión:', JSON.stringify(connectionInfo, null, 2));

for (const field of requiredFields) {
  if (!connectionInfo[field]) {
    debugLog(`Error: Campo requerido faltante: ${field}`);
    debugLog('');
    debugLog(`Para ${dbType}, necesitas configurar:`);
    if (dbType === 'sqlserver') {
      const integratedSecurity = getBooleanConfigValue('DB_INTEGRATED_SECURITY', 'integratedSecurity');
      if (integratedSecurity) {
        debugLog('   DB_HOST o --host (servidor SQL Server)');
        debugLog('   DB_NAME o --database (nombre de la base de datos)');
        debugLog('   DB_INSTANCE o --instance (opcional, nombre de la instancia)');
        debugLog('   DB_INTEGRATED_SECURITY=true o --integratedSecurity true (autenticación integrada de Windows)');
      } else {
        debugLog('   DB_HOST o --host (servidor SQL Server)');
        debugLog('   DB_NAME o --database (nombre de la base de datos)');
        debugLog('   DB_USER o --user (usuario)');
        debugLog('   DB_PASSWORD o --password (contraseña)');
        debugLog('   DB_INSTANCE o --instance (opcional, nombre de la instancia)');
      }
    } else if (dbType === 'mysql') {
      debugLog('   DB_HOST o --host (servidor MySQL)');
      debugLog('   DB_NAME o --database (nombre de la base de datos)');
      debugLog('   DB_USER o --user (usuario)');
      debugLog('   DB_PASSWORD o --password (contraseña)');
    } else if (dbType === 'postgresql') {
      debugLog('   DB_HOST o --host (servidor PostgreSQL)');
      debugLog('   DB_NAME o --database (nombre de la base de datos)');
      debugLog('   DB_USER o --user (usuario)');
      debugLog('   DB_PASSWORD o --password (contraseña)');
    } else if (dbType === 'sqlite') {
      debugLog('   DB_PATH o --path (ruta al archivo SQLite)');
    }
    debugLog('');
    debugLog('Para más información, ejecuta: mcp-db-connect --help');
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
    
    // Registrar todas las herramientas MCP usando la arquitectura modular
    logToFile('Iniciando registro de herramientas...');
    const totalTools = await registerAllTools(server);
    logToFile(`Herramientas verificadas: ${totalTools}`);
    
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
      try {
        // Obtener todas las herramientas desde la arquitectura modular
        logToFile('Intentando obtener herramientas...');
        const allTools = await getAllTools();
        logToFile(`Herramientas obtenidas: ${allTools.length}`);
        
        const toolsList = allTools.map((tool: any) => {
          // Convertir el esquema de Zod a un esquema JSON compatible con MCP
          const inputSchema: any = {
            type: "object",
            properties: {},
            required: []
          };
          
          // Mapear las propiedades del esquema de Zod
          if (tool.schema && typeof tool.schema === 'object') {
            Object.keys(tool.schema).forEach(key => {
              const zodSchema = tool.schema[key];
              if (zodSchema && typeof zodSchema === 'object') {
                // Mapear tipos básicos de Zod a JSON Schema
                if (zodSchema._def && zodSchema._def.typeName) {
                  switch (zodSchema._def.typeName) {
                    case 'ZodString':
                      inputSchema.properties[key] = { type: "string" };
                      break;
                    case 'ZodNumber':
                      inputSchema.properties[key] = { type: "number" };
                      break;
                    case 'ZodBoolean':
                      inputSchema.properties[key] = { type: "boolean" };
                      break;
                    case 'ZodEnum':
                      inputSchema.properties[key] = { 
                        type: "string",
                        enum: zodSchema._def.values
                      };
                      break;
                    default:
                      inputSchema.properties[key] = { type: "string" };
                  }
                } else {
                  // Fallback para esquemas complejos
                  inputSchema.properties[key] = { type: "string" };
                }
                
                // Agregar descripción si está disponible
                if (zodSchema.description) {
                  inputSchema.properties[key].description = zodSchema.description;
                }
              }
            });
          }
          
          return {
            name: tool.name,
            description: tool.description,
            inputSchema: inputSchema
          };
        });
        
        logToFile('Lista de herramientas preparada:', JSON.stringify(toolsList.map(t => t.name)));
        
        // Log del esquema de la primera herramienta para debug
        if (toolsList.length > 0) {
          logToFile('Esquema de primera herramienta:', JSON.stringify(toolsList[0].inputSchema, null, 2));
        }
        
        return {
          tools: toolsList
        };
      } catch (error) {
        if (error instanceof Error) {
          logToFile('Error al obtener herramientas:', error.stack);
          console.error('Error al obtener herramientas:', error.stack);
        } else {
          logToFile('Error al obtener herramientas:', error);
          console.error('Error al obtener herramientas:', error);
        }
        throw error;
      }
    });

    // Handler para llamadas a herramientas
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        logToFile(`Llamada a herramienta: ${request.params.name}`);
        logToFile(`Argumentos: ${JSON.stringify(request.params.arguments)}`);
        
        const allTools = await getAllTools();
        logToFile(`Total de herramientas disponibles: ${allTools.length}`);
        
        const tool = allTools.find((t: any) => t.name === request.params.name);
        
        if (!tool) {
          logToFile(`Herramienta no encontrada: ${request.params.name}`);
          throw new Error(`Herramienta no encontrada: ${request.params.name}`);
        }
        
        logToFile(`Herramienta encontrada: ${tool.name}`);
        
        // Ejecutar la herramienta con los argumentos proporcionados
        const result = await tool.handler(request.params.arguments);
        logToFile(`Resultado de herramienta ${tool.name}:`, JSON.stringify(result));
        return result;
      } catch (error) {
        if (error instanceof Error) {
          logToFile('Error al llamar herramienta:', error.stack);
          console.error('Error al llamar herramienta:', error.stack);
        } else {
          logToFile('Error al llamar herramienta:', error);
          console.error('Error al llamar herramienta:', error);
        }
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    });

    // Iniciar el servidor MCP
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logToFile('Servidor MCP iniciado y escuchando en stdio');
  } catch (error) {
    if (error instanceof Error) {
      logToFile('Error al iniciar el servidor:', error.stack);
      console.error('Error al iniciar el servidor:', error.stack);
    } else {
      logToFile('Error al iniciar el servidor:', error);
      console.error('Error al iniciar el servidor:', error);
    }
    process.exit(1);
  }
}

runServer(); 