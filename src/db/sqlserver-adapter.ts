import { DbAdapter } from "./adapter.js";
import sql from 'mssql';

export class SqlServerAdapter implements DbAdapter {
  private pool: sql.ConnectionPool | null = null;
  private config: sql.config;
  private server: string;
  private database: string;

  constructor(connectionInfo: {
    server: string;
    database: string;
    user?: string;
    password?: string;
    port?: number;
    trustServerCertificate?: boolean;
    options?: any;
  }) {
    this.server = connectionInfo.server;
    this.database = connectionInfo.database;
    this.config = {
      server: connectionInfo.server,
      database: connectionInfo.database,
      port: connectionInfo.port || 1433,
      options: {
        trustServerCertificate: connectionInfo.trustServerCertificate ?? true,
        ...connectionInfo.options
      }
    };
    if (connectionInfo.user && connectionInfo.password) {
      this.config.user = connectionInfo.user;
      this.config.password = connectionInfo.password;
    } else {
      this.config.options!.trustedConnection = true;
      this.config.options!.enableArithAbort = true;
    }
  }

  async init(): Promise<void> {
    this.pool = await new sql.ConnectionPool(this.config).connect();
  }

  async all(query: string, params: any[] = []): Promise<any[]> {
    if (!this.pool) throw new Error("Database not initialized");
    const request = this.pool.request();
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });
    const preparedQuery = query.replace(/\?/g, (_, i) => `@param${i}`);
    const result = await request.query(preparedQuery);
    return result.recordset;
  }

  async run(query: string, params: any[] = []): Promise<{ changes: number, lastID: number }> {
    if (!this.pool) throw new Error("Database not initialized");
    const request = this.pool.request();
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });
    const preparedQuery = query.replace(/\?/g, (_, i) => `@param${i}`);
    const result = await request.query(preparedQuery);
    return { changes: result.rowsAffected[0] || 0, lastID: 0 };
  }

  async exec(query: string): Promise<void> {
    if (!this.pool) throw new Error("Database not initialized");
    const request = this.pool.request();
    await request.batch(query);
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
    }
  }

  getMetadata() {
    return {
      name: "SQL Server",
      type: "sqlserver",
      server: this.server,
      database: this.database
    };
  }

  getListTablesQuery(): string {
    return "SELECT TABLE_NAME as name FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME";
  }

  getDescribeTableQuery(tableName: string): string {
    return `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${tableName}'`;
  }
} 