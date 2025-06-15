import { DbAdapter, createDbAdapter } from './adapter.js';

let dbAdapter: DbAdapter | null = null;

export async function initDatabase(connectionInfo: any, dbType: string = 'sqlite'): Promise<void> {
  if (typeof connectionInfo === 'string') {
    connectionInfo = { path: connectionInfo };
  }
  dbAdapter = createDbAdapter(dbType, connectionInfo);
  console.log('Tipo de base de datos:', dbType);
  console.log('Información de conexión:', JSON.stringify(connectionInfo, null, 2));
  await dbAdapter.init();
}

export function dbAll(query: string, params: any[] = []): Promise<any[]> {
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
