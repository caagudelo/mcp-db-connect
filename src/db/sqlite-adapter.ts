import sqlite3 from "sqlite3";
import { DbAdapter } from "./adapter.js";

export class SqliteAdapter implements DbAdapter {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async all(query: string, params: any[] = []): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized");
    return new Promise((resolve, reject) => {
      this.db!.all(query, params, (err: Error | null, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async run(query: string, params: any[] = []): Promise<{ changes: number, lastID: number }> {
    if (!this.db) throw new Error("Database not initialized");
    return new Promise((resolve, reject) => {
      this.db!.run(query, params, function(this: sqlite3.RunResult, err: Error | null) {
        if (err) reject(err);
        else resolve({ changes: this.changes, lastID: this.lastID });
      });
    });
  }

  async exec(query: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    return new Promise((resolve, reject) => {
      this.db!.exec(query, (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) { resolve(); return; }
      this.db.close((err: Error | null) => {
        if (err) reject(err);
        else { this.db = null; resolve(); }
      });
    });
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
} 