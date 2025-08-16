import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import minimist from 'minimist';
import { initDatabase, getDatabaseMetadata } from "./db/index.js";
import { registerAllTools } from "./tools/index.js";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

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
    console.log('💡 Luego ejecuta: npm run start:sse');
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

// Mostrar ayuda si se solicita
if (args.help || args.h) {
  console.log(`
mcp-db-connect-sse - Servidor MCP SSE para acceso a bases de datos

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
  npm run start:sse -- --mysql --host localhost --database test --port 3306 --user root --password "miClave"
  npm run start:sse -- --sqlserver --host localhost --instance SQLEXPRESS --database test --port 1433 --user sa --password "miClave" --trustServerCertificate true
  npm run start:sse -- --postgresql --host localhost --database test --port 5432 --user postgres --password "miClave" --ssl true
  npm run start:sse -- --sqlite --path /ruta/a/tu/base.db
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
  console.error('💡 Para más información, ejecuta: npm run start:sse -- --help');
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
    console.error('💡 Para más información, ejecuta: npm run start:sse -- --help');
    throw new Error(`Campo requerido faltante: ${field}. Configúralo en .env o como argumento de línea de comandos.`);
  }
}

// Create a new SSEServerTransport instance
let transport: SSEServerTransport;

const server = new McpServer({
  name: "mcp-db-connect-sse",
  version: "1.0.0",
});

// Registrar todas las herramientas MCP
await registerAllTools(server);

const app = express();

const setupServer = async () => {
  await initDatabase(connectionInfo, dbType);
  console.log('Conectado a:', getDatabaseMetadata());
  // No conectamos aquí, se conectará cuando se establezca la conexión SSE
};

// Middleware to parse JSON request bodies
app.get("/sse", async (req, res) => {
  console.log("Received SSE connection 🔗");

  transport = new SSEServerTransport("/message", res);
  await server.connect(transport);
});

// Middleware to handle POST requests
app.post("/message", async (req, res) => {
  console.log(`Received POST message 💌`);

  await transport.handlePostMessage(req, res);
});

const PORT = process.env.PORT || 3001;
setupServer()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`MCP SSE Server listening on port ${PORT}`);
      console.log(`📡 Endpoint SSE: http://localhost:${PORT}/sse`);
      console.log(`📨 Endpoint POST: http://localhost:${PORT}/message`);
    });
  })
  .catch((error) => {
    console.error("Failed to set up the server:", error);
    process.exit(1);
  });

// Prueba con:
// curl -X POST http://localhost:3001/message -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"call_tool","params":{"name":"hello_world","arguments":{}}}' 
