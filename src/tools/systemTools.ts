import { z } from "zod";
import { tool } from "../types/index.js";
import { getDatabaseMetadata } from "../db/index.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Herramienta: get_database_info - Para obtener información de la base de datos
const getDatabaseInfo: tool<{}> = {
  name: "get_database_info",
  description: "Obtiene información general de la base de datos",
  schema: {},
  handler: async () => {
    try {
      const metadata = await getDatabaseMetadata();
      return {
        content: [
          { type: "text", text: JSON.stringify(metadata, null, 2) }
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

// Herramienta: ping - Para verificar conectividad
const ping: tool<{}> = {
  name: "ping",
  description: "Verifica la conectividad del servidor MCP",
  schema: {},
  handler: async () => {
    try {
      return {
        content: [
          { type: "text", text: "pong - Servidor MCP funcionando correctamente" }
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

// Herramienta: get_server_version - Para obtener la versión del servidor
const getServerVersion: tool<{}> = {
  name: "get_server_version",
  description: "Obtiene la versión actual del servidor MCP y información del autor",
  schema: {},
  handler: async () => {
    try {
      // Obtener la información desde package.json
      const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
      let version = 'desconocida';
      let authorInfo = 'Información del autor no disponible';
      
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Obtener versión
        version = pkg.version || 'desconocida';
        
        // Obtener información del autor
        if (pkg.author) {
          if (typeof pkg.author === 'object') {
            // Formato objeto: { name, email, url }
            const author = pkg.author;
            const authorParts = [];
            
            if (author.name) authorParts.push(author.name);
            if (author.email) authorParts.push(author.email);
            if (author.url) authorParts.push(author.url);
            
            authorInfo = authorParts.join(' | ');
          } else {
            // Formato string: "Nombre <email> <url>"
            authorInfo = pkg.author;
          }
        }
        
      } catch (e) {
        // Si falla la lectura, usar valores por defecto
        version = 'desconocida';
        authorInfo = 'Información del autor no disponible';
      }
      
      return {
        content: [
          { type: "text", text: `🚀 Servidor MCP: mcp-db-connect` },
          { type: "text", text: `📦 Versión: ${version}` },
          { type: "text", text: `👨‍💻 Autor: ${authorInfo}` },
          { type: "text", text: `📄 Descripción: Servidor MCP para acceso a bases de datos` },
          { type: "text", text: `🔗 Repositorio: https://github.com/cagudelo/mcp-db-connect` }
        ],
        isError: false
      };
    } catch (e: any) {
      return {
        content: [
          { type: "text", text: `Error al obtener información: ${e.message}` }
        ],
        isError: true
      };
    }
  }
};

// Herramienta: get_help - Para obtener ayuda sobre las herramientas disponibles
const getHelp: tool<{}> = {
  name: "get_help",
  description: "Muestra información de ayuda sobre las herramientas disponibles",
  schema: {},
  handler: async () => {
    try {
      const helpText = `
# Ayuda del Servidor MCP de Base de Datos

## Herramientas de Consulta:
- **read_query**: Ejecuta consultas SELECT
- **write_query**: Ejecuta consultas de modificación (INSERT, UPDATE, DELETE, etc.)

## Herramientas de Estructura:
- **list_tables**: Lista todas las tablas
- **describe_table**: Describe la estructura de una tabla
- **list_views**: Lista todas las vistas
- **describe_view**: Describe la estructura de una vista
- **list_indexes**: Lista índices de una tabla
- **describe_index**: Describe la estructura de un índice
- **list_procedures**: Lista procedimientos almacenados

## Herramientas de Gestión:
- **create_table**: Crea nuevas tablas
- **alter_table**: Modifica tablas existentes
- **drop_table**: Elimina tablas (requiere confirmación)

## Herramientas de Utilidad:
- **search_in_database**: Busca términos en la base de datos
- **export_to_csv**: Exporta resultados a formato CSV
- **get_database_info**: Obtiene información general de la BD
- **ping**: Verifica conectividad del servidor
- **get_server_version**: Obtiene versión del servidor
- **get_help**: Muestra esta ayuda

## Uso:
Cada herramienta tiene parámetros específicos. Usa get_help para obtener información detallada.
      `;
      
      return {
        content: [
          { type: "text", text: helpText }
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

// Exportar todas las herramientas del sistema
export const systemTools = [
  getDatabaseInfo,
  ping,
  getServerVersion,
  getHelp
];
