/**
 * @file types/index.ts
 * @description Definiciones de tipos para el servidor MCP de base de datos
 */

// Tipos para la configuración de la base de datos
/**
 * Configuración de la base de datos
 * @interface DatabaseConfig
 */
export interface DatabaseConfig {
  /** Host del servidor de base de datos */
  host?: string;
  /** Nombre de la base de datos */
  database?: string;
  /** Usuario de la base de datos */
  user?: string;
  /** Contraseña de la base de datos */
  password?: string;
  /** Puerto de conexión */
  port?: number;
  /** Ruta al archivo de base de datos (para SQLite) */
  path?: string;
  /** Configuración SSL */
  ssl?: boolean;
  /** Confiar en el certificado del servidor (para SQL Server) */
  trustServerCertificate?: boolean;
}

export interface SslOptions {
  rejectUnauthorized?: boolean;
  ca?: string;
  cert?: string;
  key?: string;
}

// Tipos para los resultados de las consultas
export interface QueryResult {
  success: boolean;
  data?: any[];
  error?: string;
  affectedRows?: number;
  lastId?: number;
}

// Tipos para las herramientas disponibles
/**
 * Herramienta disponible en el servidor MCP
 * @interface Tool
 */
export interface Tool {
  /** Nombre de la herramienta */
  name: string;
  /** Descripción de la herramienta */
  description: string;
  /** Esquema de parámetros de la herramienta */
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

// Tipo para herramientas MCP con Zod schema
export interface McpTool<T = any> {
  /** Nombre de la herramienta */
  name: string;
  /** Descripción de la herramienta */
  description: string;
  /** Esquema Zod para validación de parámetros */
  schema: T;
  /** Función que maneja la ejecución de la herramienta */
  handler: (params: any, extra?: any) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError: boolean;
  }>;
}

// Alias para compatibilidad
export type tool<T> = McpTool<T>;

// Tipos para los recursos de la base de datos
/**
 * Recurso de base de datos
 * @interface DatabaseResource
 */
export interface DatabaseResource {
  /** URI del recurso */
  uri: string;
  /** Tipo MIME del recurso */
  mimeType: string;
  /** Nombre del recurso */
  name: string;
} 