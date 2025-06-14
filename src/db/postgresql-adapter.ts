import { DbAdapter } from "./adapter.js";
import pg from 'pg';

export class PostgresqlAdapter implements DbAdapter {
  private client: pg.Client | null = null;
  private config: pg.ClientConfig;
  private host: string;
  private database: string;

  constructor(connectionInfo: {
    host: string;
    database: string;
    user?: string;
    password?: string;
    port?: number;
    ssl?: boolean | object;
    options?: any;
    connectionTimeout?: number;
  }) {
    this.host = connectionInfo.host;
    this.database = connectionInfo.database;
    this.config = {
      host: connectionInfo.host,
      database: connectionInfo.database,
      port: connectionInfo.port || 5432,
      user: connectionInfo.user,
      password: connectionInfo.password,
      ssl: connectionInfo.ssl,
      connectionTimeoutMillis: connectionInfo.connectionTimeout || 30000,
    };
  }

  async init(): Promise<void> {
    this.client = new pg.Client(this.config);
    await this.client.connect();
  }

  async all(query: string, params: any[] = []): Promise<any[]> {
    if (!this.client) throw new Error("Database not initialized");
    const preparedQuery = query.replace(/\?/g, (_, i) => `$${i + 1}`);
    const result = await this.client.query(preparedQuery, params);
    return result.rows;
  }

  async run(query: string, params: any[] = []): Promise<{ changes: number, lastID: number }> {
    if (!this.client) throw new Error("Database not initialized");
    const preparedQuery = query.replace(/\?/g, (_, i) => `$${i + 1}`);
    let lastID = 0;
    let changes = 0;
    if (query.trim().toUpperCase().startsWith('INSERT')) {
      const returningQuery = preparedQuery.includes('RETURNING') 
        ? preparedQuery 
        : `${preparedQuery} RETURNING id`;
      const result = await this.client.query(returningQuery, params);
      changes = result.rowCount || 0;
      lastID = result.rows[0]?.id || 0;
    } else {
      const result = await this.client.query(preparedQuery, params);
      changes = result.rowCount || 0;
    }
    return { changes, lastID };
  }

  async exec(query: string): Promise<void> {
    if (!this.client) throw new Error("Database not initialized");
    await this.client.query(query);
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
  }

  getMetadata() {
    return {
      name: "PostgreSQL",
      type: "postgresql",
      server: this.host,
      database: this.database
    };
  }

  getListTablesQuery(): string {
    return "SELECT table_name as name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name";
  }

  getDescribeTableQuery(tableName: string): string {
    return `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${tableName}'`;
  }
} 