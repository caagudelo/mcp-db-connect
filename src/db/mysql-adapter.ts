import { DbAdapter } from "./adapter.js";
import mysql from "mysql2/promise";

export class MysqlAdapter implements DbAdapter {
  private connection: mysql.Connection | null = null;
  private config: mysql.ConnectionOptions;
  private host: string;
  private database: string;

  constructor(connectionInfo: {
    host: string;
    database: string;
    user?: string;
    password?: string;
    port?: number;
    ssl?: boolean | object;
    connectionTimeout?: number;
  }) {
    this.host = connectionInfo.host;
    this.database = connectionInfo.database;
    this.config = {
      host: connectionInfo.host,
      database: connectionInfo.database,
      port: connectionInfo.port || 3306,
      user: connectionInfo.user,
      password: connectionInfo.password,
      connectTimeout: connectionInfo.connectionTimeout || 30000,
      multipleStatements: true,
    };
    if (typeof connectionInfo.ssl === 'object' || typeof connectionInfo.ssl === 'string') {
      this.config.ssl = connectionInfo.ssl;
    } else if (connectionInfo.ssl === true) {
      this.config.ssl = {};
    }
  }

  async init(): Promise<void> {
    this.connection = await mysql.createConnection(this.config);
  }

  async all(query: string, params: any[] = []): Promise<any[]> {
    if (!this.connection) throw new Error("Database not initialized");
    const [rows] = await this.connection.execute(query, params);
    return Array.isArray(rows) ? rows : [];
  }

  async run(query: string, params: any[] = []): Promise<{ changes: number, lastID: number }> {
    if (!this.connection) throw new Error("Database not initialized");
    const [result]: any = await this.connection.execute(query, params);
    return { changes: result.affectedRows || 0, lastID: result.insertId || 0 };
  }

  async exec(query: string): Promise<void> {
    if (!this.connection) throw new Error("Database not initialized");
    await this.connection.query(query);
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }

  getMetadata() {
    return {
      name: "MySQL",
      type: "mysql",
      server: this.host,
      database: this.database,
    };
  }

  getListTablesQuery() {
    return "SHOW TABLES";
  }

  getDescribeTableQuery(tableName: string) {
    return `DESCRIBE \`${tableName}\``;
  }
} 