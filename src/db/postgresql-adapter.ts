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

  getListProceduresQuery(): string {
    return `
      SELECT 
        n.nspname as schema_name,
        p.proname as procedure_name,
        p.prosrc as source_code
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.prokind = 'p'
      ORDER BY n.nspname, p.proname
    `;
  }

  getDescribeTableQuery(tableName: string): string {
    return `
      SELECT 
        c.column_name as name,
        c.data_type as type,
        CASE WHEN c.is_nullable = 'NO' THEN 1 ELSE 0 END as notnull,
        CASE WHEN pk.constraint_name IS NOT NULL THEN 1 ELSE 0 END as pk,
        c.column_default as dflt_value
      FROM 
        information_schema.columns c
      LEFT JOIN 
        information_schema.key_column_usage kcu 
        ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
      LEFT JOIN 
        information_schema.table_constraints pk 
        ON kcu.constraint_name = pk.constraint_name AND pk.constraint_type = 'PRIMARY KEY'
      WHERE 
        c.table_name = '${tableName}'
        AND c.table_schema = 'public'
      ORDER BY 
        c.ordinal_position
    `;
  }

  getListViewsQuery(): string {
    return `SELECT table_name FROM information_schema.views WHERE table_schema = 'public'`;
  }

  getDescribeViewQuery(viewName: string): string {
    return `SELECT definition FROM pg_views WHERE viewname = '${viewName}' AND schemaname = 'public'`;
  }

  getListIndexesQuery(tableName?: string): string {
    if (tableName) {
      return `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = '${tableName}' AND schemaname = 'public'`;
    }
    return `SELECT indexname, tablename, indexdef FROM pg_indexes WHERE schemaname = 'public'`;
  }

  getDescribeIndexQuery(indexName: string, tableName?: string): string {
    return `SELECT indexdef FROM pg_indexes WHERE indexname = '${indexName}' AND schemaname = 'public'`;
  }

  getSearchInDatabaseQuery(search: string): string {
    // Búsqueda global: genera una consulta para buscar en todas las tablas y columnas
    return `Metodo no soportado para PostgreSQL`;
  }
} 