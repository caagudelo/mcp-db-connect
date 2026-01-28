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
  getListViewsQuery(): string;
  getDescribeViewQuery(viewName: string): string;
  getListIndexesQuery(tableName?: string): string;
  getDescribeIndexQuery(indexName: string, tableName?: string): string;
  getSearchInDatabaseQuery(search: string): string;
}

// Importa los adaptadores (se crearán en los siguientes archivos)
import { SqlServerAdapter } from './sqlserver-adapter.js';
import { PostgresqlAdapter } from './postgresql-adapter.js';
import { MysqlAdapter } from './mysql-adapter.js';

// Fábrica para crear el adaptador correcto
export function createDbAdapter(type: string, connectionInfo: any): DbAdapter {
  switch (type.toLowerCase()) {
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