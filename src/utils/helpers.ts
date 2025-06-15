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
    normalizedQuery.startsWith('select') ||
    normalizedQuery.startsWith('exec') ||
    normalizedQuery.startsWith('call') ||
    normalizedQuery.startsWith('sp_')
  );
}

/**
 * Verifica si una consulta SQL es de tipo modificación (INSERT, UPDATE, DELETE)
 * @param {string} query - La consulta SQL a verificar
 * @returns {boolean} true si la consulta es de modificación, false en caso contrario
 */
export function isModificationQuery(query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  return (
    normalizedQuery.startsWith('insert') ||
    normalizedQuery.startsWith('update') ||
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
 * @returns {boolean} true si la configuración es válida, false en caso contrario
 */
export function validateDatabaseConfig(config: any): boolean {
  if (!config) return false;
  
  // Validar configuración para SQLite
  if (config.path) {
    return typeof config.path === 'string';
  }
  
  // Validar configuración para otros motores
  return (
    typeof config.host === 'string' &&
    typeof config.database === 'string' &&
    typeof config.user === 'string' &&
    typeof config.password === 'string' &&
    (!config.port || typeof config.port === 'number')
  );
} 