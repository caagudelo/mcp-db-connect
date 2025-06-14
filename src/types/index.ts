// Tipos para la configuración de la base de datos
export interface DatabaseConfig {
  type: 'sqlite' | 'sqlserver' | 'postgresql' | 'mysql';
  path?: string; // Para SQLite
  host?: string;
  port?: number;
  database: string;
  user?: string;
  password?: string;
  ssl?: boolean | string | SslOptions;
  connectionTimeout?: number;
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
export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required: string[];
  };
}

// Tipos para los recursos de la base de datos
export interface DatabaseResource {
  name: string;
  type: 'table';
  description: string;
} 