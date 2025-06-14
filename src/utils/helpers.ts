import { QueryResult } from '../types/index.js';

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
 * Valida si una consulta SQL es un SELECT
 */
export function isSelectQuery(query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  return normalizedQuery.startsWith('select') && 
         !normalizedQuery.includes('insert') && 
         !normalizedQuery.includes('update') && 
         !normalizedQuery.includes('delete');
}

/**
 * Valida si una consulta SQL es una modificación (INSERT, UPDATE, DELETE)
 */
export function isModificationQuery(query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  return normalizedQuery.startsWith('insert') || 
         normalizedQuery.startsWith('update') || 
         normalizedQuery.startsWith('delete');
} 