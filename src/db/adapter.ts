export interface DbAdapter {
  init(): Promise<void>;
  close(): Promise<void>;
  all(query: string, params?: any[]): Promise<any[]>;
  run(query: string, params?: any[]): Promise<{ changes: number, lastID: number }>;
  exec(query: string): Promise<void>;
  getMetadata(): { name: string, type: string, path?: string, server?: string, database?: string };
  getListTablesQuery(): string;
  getDescribeTableQuery(tableName: string): string;
  getListProceduresQuery(): string;
}

// Importa los adaptadores (se crearán en los siguientes archivos)
import { SqliteAdapter } from './sqlite-adapter.js';
import { SqlServerAdapter } from './sqlserver-adapter.js';
import { PostgresqlAdapter } from './postgresql-adapter.js';
import { MysqlAdapter } from './mysql-adapter.js';

// Fábrica para crear el adaptador correcto
export function createDbAdapter(type: string, connectionInfo: any): DbAdapter {
  switch (type.toLowerCase()) {
    case 'sqlite':
      if (typeof connectionInfo === 'string') {
        return new SqliteAdapter(connectionInfo);
      } else {
        return new SqliteAdapter(connectionInfo.path);
      }
    case 'sqlserver':
      return new SqlServerAdapter(connectionInfo);
    case 'postgresql':
    case 'postgres':
      return new PostgresqlAdapter(connectionInfo);
    case 'mysql':
      return new MysqlAdapter(connectionInfo);
    default:
      throw new Error(`Unsupported database type: ${type}`);
  }
} 