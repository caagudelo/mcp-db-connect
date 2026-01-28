import Database from "better-sqlite3";
import { DbAdapter } from "./adapter.js";

export class SqliteAdapter implements DbAdapter {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  async init(): Promise<void> {
    try {
      this.db = new Database(this.dbPath, { fileMustExist: false });
    } catch (err) {
      throw err;
    }
  }

  async all(query: string, params: any[] = []): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      const stmt = this.db.prepare(query);
      return stmt.all(...params);
    } catch (err) {
      throw err;
    }
  }

  async run(query: string, params: any[] = []): Promise<{ changes: number, lastID: number }> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      const stmt = this.db.prepare(query);
      const info = stmt.run(...params);
      return { changes: info.changes, lastID: Number(info.lastInsertRowid) };
    } catch (err) {
      throw err;
    }
  }

  async exec(query: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      this.db.exec(query);
    } catch (err) {
      throw err;
    }
  }

  async close(): Promise<void> {
    if (!this.db) return;
    try {
      this.db.close();
      this.db = null;
    } catch (err) {
      throw err;
    }
  }

  getMetadata() {
    return { name: "SQLite", type: "sqlite", path: this.dbPath };
  }

  getListTablesQuery(): string {
    return "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'";
  }

  getListProceduresQuery(): string {
    throw new Error("Procedures not supported in this database engine");
  }

  getDescribeTableQuery(tableName: string): string {
    return `PRAGMA table_info(${tableName})`;
  }

  getListViewsQuery(): string {
    return "SELECT name FROM sqlite_master WHERE type='view'";
  }

  getDescribeViewQuery(viewName: string): string {
    return `SELECT sql FROM sqlite_master WHERE type='view' AND name='${viewName}'`;
  }

  getListIndexesQuery(tableName?: string): string {
    if (tableName) {
      return `PRAGMA index_list('${tableName}')`;
    }
    return "SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'";
  }

  getDescribeIndexQuery(indexName: string, tableName?: string): string {
    if (tableName) {
      return `PRAGMA index_info('${indexName}')`;
    }
    return `SELECT sql FROM sqlite_master WHERE type='index' AND name='${indexName}'`;
  }

  getSearchInDatabaseQuery(search: string): string {
    // SQLite no tiene búsqueda global, pero podemos buscar en todas las tablas y columnas con un script externo
    // Aquí solo devolvemos un placeholder
    return `-- Implementar búsqueda global manualmente para SQLite`;
  }
} 