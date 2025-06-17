import { DbAdapter, createDbAdapter } from './adapter.js';
//import { validateDatabaseConfig } from '../utils/helpers';

let dbAdapter: DbAdapter | null = null;

export async function initDatabase(connectionInfo: any, dbType: string = 'sqlite'): Promise<void> {
  if (typeof connectionInfo === 'string') {
    connectionInfo = { path: connectionInfo };
  }

  // Validar la configuración antes de inicializar la base de datos
/*  const validation = validateDatabaseConfig(connectionInfo);
  if (!validation.isValid) {
    console.log("Configuración inválida:\n" + validation.errors.join('\n'));
    process.exit(1);
  }*/

  dbAdapter = createDbAdapter(dbType, connectionInfo);
  await dbAdapter.init();
}

export function dbAll(query: string, params: any[] = []): Promise<any[]> {
 // console.log("[dbAll] Query recibido:", query, "Params:", params);
  if (!dbAdapter) throw new Error("Database not initialized");
  return dbAdapter.all(query, params);
}

export function dbRun(query: string, params: any[] = []): Promise<{ changes: number, lastID: number }> {
  if (!dbAdapter) throw new Error("Database not initialized");
  return dbAdapter.run(query, params);
}

export function dbExec(query: string): Promise<void> {
  if (!dbAdapter) throw new Error("Database not initialized");
  return dbAdapter.exec(query);
}

export function closeDatabase(): Promise<void> {
  if (!dbAdapter) return Promise.resolve();
  return dbAdapter.close();
}

export function getDatabaseMetadata() {
  if (!dbAdapter) throw new Error("Database not initialized");
  return dbAdapter.getMetadata();
}

export function getListTablesQuery(): string {
  if (!dbAdapter) throw new Error("Database not initialized");
  return dbAdapter.getListTablesQuery();
}

export function getDescribeTableQuery(tableName: string): string {
  if (!dbAdapter) throw new Error("Database not initialized");
  return dbAdapter.getDescribeTableQuery(tableName);
} 

export function getListProceduresQuery(): string {
  if (!dbAdapter) throw new Error("Database not initialized");
  return dbAdapter.getListProceduresQuery();
}

export function getListViewsQuery(): string {
  if (!dbAdapter) throw new Error("Database not initialized");
  return dbAdapter.getListViewsQuery();
}

export function getDescribeViewQuery(viewName: string): string {
  if (!dbAdapter) throw new Error("Database not initialized");
  return dbAdapter.getDescribeViewQuery(viewName);
}

export function getListIndexesQuery(tableName?: string): string {
  if (!dbAdapter) throw new Error("Database not initialized");
  return dbAdapter.getListIndexesQuery(tableName);
}

export function getDescribeIndexQuery(indexName: string, tableName?: string): string {
  if (!dbAdapter) throw new Error("Database not initialized");
  return dbAdapter.getDescribeIndexQuery(indexName, tableName);
}

export function getSearchInDatabaseQuery(search: string): string {
  if (!dbAdapter) throw new Error("Database not initialized");
  return dbAdapter.getSearchInDatabaseQuery(search);
}
