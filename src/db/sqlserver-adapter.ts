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
    authentication?: any;
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
    if (connectionInfo.authentication) {
      // Soporte robusto para autenticación integrada (NTLM)
      (this.config as any).authentication = connectionInfo.authentication;
    } else if (connectionInfo.user && connectionInfo.password) {
      this.config.user = connectionInfo.user;
      this.config.password = connectionInfo.password;
    } else {
      // Fallback legacy: trustedConnection para compatibilidad antigua
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

  getListViewsQuery(): string {
    return `SELECT TABLE_NAME as name FROM INFORMATION_SCHEMA.VIEWS ORDER BY TABLE_NAME`;
  }

  getDescribeViewQuery(viewName: string): string {
    return `SELECT VIEW_DEFINITION FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_NAME = '${viewName}'`;
  }

  getListIndexesQuery(tableName?: string): string {
    if (tableName) {
      return `SELECT name, type_desc FROM sys.indexes WHERE object_id = OBJECT_ID('${tableName}')`;
    }
    return `SELECT i.name, t.name as table_name, i.type_desc FROM sys.indexes i JOIN sys.tables t ON i.object_id = t.object_id`;
  }

  getDescribeIndexQuery(indexName: string, tableName?: string): string {
    return `SELECT * FROM sys.indexes WHERE name = '${indexName}'`;
  }

  getSearchInDatabaseQuery(search: string): string {
    // Esta consulta genera SQL dinámico para buscar el valor en todas las columnas de tipo texto
    return `
      DECLARE @search NVARCHAR(MAX) = N'${search.replace(/'/g, "''")}'
      DECLARE @sql NVARCHAR(MAX) = N''

      SELECT @sql = @sql + 
        CASE WHEN @sql = N'' THEN '' ELSE ' UNION ALL ' END +
        'SELECT ''' + t.name + ''' AS TableName, ''' + c.name + ''' AS ColumnName, [' + c.name + '] AS Value
        FROM [' + s.name + '].[' + t.name + ']
        WHERE [' + c.name + '] LIKE ''%' + @search + '%'''
      FROM sys.tables t
      JOIN sys.columns c ON t.object_id = c.object_id
      JOIN sys.types ty ON c.user_type_id = ty.user_type_id
      JOIN sys.schemas s ON t.schema_id = s.schema_id
      WHERE ty.name IN ('varchar', 'nvarchar', 'text', 'ntext', 'char', 'nchar')

      EXEC sp_executesql @sql, N'@search NVARCHAR(MAX)', @search
    `;
  }
} 