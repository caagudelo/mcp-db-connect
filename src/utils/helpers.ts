import { QueryResult } from '../types/index.js';

/**
 * @file utils/helpers.ts
 * @description Funciones de utilidad para el servidor MCP de base de datos
 */

/**
 * Convierte un array de objetos a formato CSV
 */
export function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => 
    headers.map(header => {
      const value = obj[header];
      // Escapar comillas y envolver en comillas si contiene comas o comillas
      return typeof value === 'string' && (value.includes(',') || value.includes('"'))
        ? `"${value.replace(/"/g, '""')}"`
        : value;
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Crea un resultado de consulta exitoso
 */
export function createSuccessResult(data: any[]): QueryResult {
  return {
    success: true,
    data
  };
}

/**
 * Crea un resultado de consulta con error
 */
export function createErrorResult(error: string): QueryResult {
  return {
    success: false,
    error
  };
}

/**
 * Verifica si una consulta SQL es de tipo SELECT
 * @param {string} query - La consulta SQL a verificar
 * @returns {boolean} true si la consulta es SELECT, false en caso contrario
 */
export function isSelectQuery(query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  return (
    normalizedQuery.startsWith('select')
  );
}

/**
 * Verifica si una consulta SQL es de tipo modificación (INSERT, UPDATE, DELETE, CREATE, ALTER, EXEC, CALL, SP_, DELETE)  
 * @param {string} query - La consulta SQL a verificar
 * @returns {boolean} true si la consulta es de modificación, false en caso contrario
 */
export function isModificationQuery(query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  return (
    normalizedQuery.startsWith('insert') ||
    normalizedQuery.startsWith('update') ||
    normalizedQuery.startsWith('create') ||
    normalizedQuery.startsWith('alter') ||
    normalizedQuery.startsWith('exec') ||
    normalizedQuery.startsWith('call') ||
    normalizedQuery.startsWith('sp_') ||
    normalizedQuery.startsWith('delete')
  );
}

/**
 * Obtiene la consulta SQL para listar todas las tablas
 * @returns {string} Consulta SQL para listar tablas
 */
export function getListTablesQuery(): string {
  return `
    SELECT name 
    FROM sqlite_master 
    WHERE type='table' 
    AND name NOT LIKE 'sqlite_%'
  `;
}

/**
 * Obtiene la consulta SQL para describir una tabla
 * @param {string} tableName - Nombre de la tabla
 * @returns {string} Consulta SQL para describir la tabla
 */
export function getDescribeTableQuery(tableName: string): string {
  return `PRAGMA table_info("${tableName}")`;
}

/**
 * Formatea un error para su presentación
 * @param {Error} error - El error a formatear
 * @returns {string} Mensaje de error formateado
 */
export function formatError(error: Error): string {
  return `Error: ${error.message}`;
}

/**
 * Valida los parámetros de conexión a la base de datos
 * @param {any} config - Configuración de la base de datos
 * @returns {{ isValid: boolean, errors: string[] }} Resultado de la validación
 */
export function validateDatabaseConfig(config: any): { isValid: boolean, errors: string[] } {
  const errors: string[] = [];

  if (!config) {
    errors.push("No se proporcionó configuración.");
    return { isValid: false, errors };
  }

  // SQLite
  if (config.path) {
    if (typeof config.path !== 'string' || !config.path) {
      errors.push("El campo 'path' debe ser una cadena no vacía para SQLite.");
    }
    return { isValid: errors.length === 0, errors };
  }

  // MySQL/PostgreSQL
  if (config.host && config.database && config.user && config.password) {
    if (typeof config.host !== 'string' || !config.host) errors.push("El campo 'host' es obligatorio y debe ser una cadena.");
    if (typeof config.database !== 'string' || !config.database) errors.push("El campo 'database' es obligatorio y debe ser una cadena.");
    if (typeof config.user !== 'string' || !config.user) errors.push("El campo 'user' es obligatorio y debe ser una cadena.");
    if (typeof config.password !== 'string' || !config.password) errors.push("El campo 'password' es obligatorio y debe ser una cadena.");
    if (config.port && typeof config.port !== 'number') errors.push("El campo 'port' debe ser un número.");
    return { isValid: errors.length === 0, errors };
  }

  // SQL Server
  if (config.server && config.database && config.user && config.password) {
    if (typeof config.server !== 'string' || !config.server) errors.push("El campo 'server' es obligatorio y debe ser una cadena.");
    if (typeof config.database !== 'string' || !config.database) errors.push("El campo 'database' es obligatorio y debe ser una cadena.");
    if (typeof config.user !== 'string' || !config.user) errors.push("El campo 'user' es obligatorio y debe ser una cadena.");
    if (typeof config.password !== 'string' || !config.password) errors.push("El campo 'password' es obligatorio y debe ser una cadena.");
    if (config.port && typeof config.port !== 'number') errors.push("El campo 'port' debe ser un número.");
    return { isValid: errors.length === 0, errors };
  }

  errors.push("Faltan campos obligatorios para la configuración de la base de datos.");
  return { isValid: false, errors };
}

export function formatErrorResponse(error: Error | string): { content: Array<{type: string, text: string}>, isError: boolean } {
  const message = error instanceof Error ? error.message : error;
  return {
    content: [{ 
      type: "text", 
      text: JSON.stringify({ error: message }, null, 2) 
    }],
    isError: true
  };
}

/**
 * Format success response
 * @param data Data to format
 * @returns Formatted success response object
 */
export function formatSuccessResponse(data: any): { content: Array<{type: string, text: string}>, isError: boolean } {
  return {
    content: [{ 
      type: "text", 
      text: JSON.stringify(data, null, 2) 
    }],
    isError: false
  };
} 