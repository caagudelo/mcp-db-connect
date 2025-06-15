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

  getListProceduresQuery(): string {
    return `
    SELECT 
    s.name AS schema_name,
    p.name AS procedure_name,
    p.create_date,
    p.modify_date
    FROM sys.procedures p
    JOIN sys.schemas s ON p.schema_id = s.schema_id
    ORDER BY s.name, p.name
    `;
  }

  getDescribeTableQuery(tableName: string): string {
    return `
    SELECT 
        c.COLUMN_NAME as name,
        c.DATA_TYPE as type,
        CASE WHEN c.IS_NULLABLE = 'YES' THEN 1 ELSE 0 END as notnull,
        CASE WHEN pk.CONSTRAINT_TYPE = 'PRIMARY KEY' THEN 1 ELSE 0 END as pk,
        c.COLUMN_DEFAULT as dflt_value
      FROM 
        INFORMATION_SCHEMA.COLUMNS c
      LEFT JOIN 
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu ON c.TABLE_NAME = kcu.TABLE_NAME AND c.COLUMN_NAME = kcu.COLUMN_NAME
      LEFT JOIN 
        INFORMATION_SCHEMA.TABLE_CONSTRAINTS pk ON kcu.CONSTRAINT_NAME = pk.CONSTRAINT_NAME AND pk.CONSTRAINT_TYPE = 'PRIMARY KEY'
      WHERE 
        c.TABLE_NAME = '${tableName}'
      ORDER BY 
        c.ORDINAL_POSITION
    `;
  }
} 