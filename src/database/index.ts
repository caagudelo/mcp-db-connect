import { DatabaseConfig, QueryResult } from '../types/index.js';
import { createErrorResult, createSuccessResult } from '../utils/helpers.js';
import sqlite3 from 'sqlite3';
import sql from 'mssql';
import mysql from 'mysql2/promise';
import pg from 'pg';

export class Database {
  private config: DatabaseConfig;
  private connection: any;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  /**
   * Inicializa la conexión a la base de datos según el tipo especificado
   */
  async connect(): Promise<void> {
    try {
      switch (this.config.type) {
        case 'sqlite':
          if (!this.config.path) {
            throw new Error('SQLite requiere una ruta de archivo');
          }
          this.connection = new sqlite3.Database(this.config.path);
          break;

        case 'sqlserver':
          this.connection = await sql.connect({
            server: this.config.host || 'localhost',
            port: this.config.port || 1433,
            database: this.config.database,
            user: this.config.user,
            password: this.config.password,
            options: {
              encrypt: this.config.ssl === true,
              trustServerCertificate: this.config.ssl === false,
              connectTimeout: this.config.connectionTimeout || 30000
            }
          });
          break;

        case 'postgresql':
          this.connection = new pg.Pool({
            host: this.config.host || 'localhost',
            port: this.config.port || 5432,
            database: this.config.database,
            user: this.config.user,
            password: this.config.password,
            ssl: this.config.ssl === true ? { rejectUnauthorized: false } : false
          });
          break;

        case 'mysql':
          this.connection = await mysql.createConnection({
            host: this.config.host || 'localhost',
            port: this.config.port || 3306,
            database: this.config.database,
            user: this.config.user,
            password: this.config.password,
            ssl: this.config.ssl === true ? { rejectUnauthorized: false } : undefined
          });
          break;

        default:
          throw new Error(`Tipo de base de datos no soportado: ${this.config.type}`);
      }
    } catch (error) {
      throw new Error(`Error al conectar a la base de datos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Ejecuta una consulta SELECT
   * @param query Consulta SQL
   * @param params Parámetros de la consulta
   */
  async query(query: string, params: any[] = []): Promise<QueryResult> {
    try {
      switch (this.config.type) {
        case 'sqlite':
          return await this.querySQLite(query, params);
        case 'sqlserver':
          return await this.querySQLServer(query, params);
        case 'postgresql':
          return await this.queryPostgreSQL(query, params);
        case 'mysql':
          return await this.queryMySQL(query, params);
        default:
          throw new Error(`Tipo de base de datos no soportado: ${this.config.type}`);
      }
    } catch (error) {
      return createErrorResult(`Error al ejecutar la consulta: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Ejecuta una consulta que modifica datos (INSERT, UPDATE, DELETE)
   * @param query Consulta SQL
   * @param params Parámetros de la consulta
   */
  async execute(query: string, params: any[] = []): Promise<QueryResult> {
    try {
      switch (this.config.type) {
        case 'sqlite':
          return await this.executeSQLite(query, params);
        case 'sqlserver':
          return await this.executeSQLServer(query, params);
        case 'postgresql':
          return await this.executePostgreSQL(query, params);
        case 'mysql':
          return await this.executeMySQL(query, params);
        default:
          throw new Error(`Tipo de base de datos no soportado: ${this.config.type}`);
      }
    } catch (error) {
      return createErrorResult(`Error al ejecutar la consulta: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Cierra la conexión a la base de datos
   */
  async close(): Promise<void> {
    try {
      switch (this.config.type) {
        case 'sqlite':
          this.connection.close();
          break;
        case 'sqlserver':
          await this.connection.close();
          break;
        case 'postgresql':
          await this.connection.end();
          break;
        case 'mysql':
          await this.connection.end();
          break;
      }
    } catch (error) {
      throw new Error(`Error al cerrar la conexión: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Métodos privados para cada tipo de base de datos
  private async querySQLite(query: string, params: any[]): Promise<QueryResult> {
    return new Promise((resolve, reject) => {
      this.connection.all(query, params, (err: Error | null, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(createSuccessResult(rows));
        }
      });
    });
  }

  private async querySQLServer(query: string, params: any[]): Promise<QueryResult> {
    const result = await this.connection.request()
      .input('params', params)
      .query(query);
    return createSuccessResult(result.recordset);
  }

  private async queryPostgreSQL(query: string, params: any[]): Promise<QueryResult> {
    const result = await this.connection.query(query, params);
    return createSuccessResult(result.rows);
  }

  private async queryMySQL(query: string, params: any[]): Promise<QueryResult> {
    const [rows] = await this.connection.execute(query, params);
    return createSuccessResult(rows);
  }

  private async executeSQLite(query: string, params: any[]): Promise<QueryResult> {
    return new Promise((resolve, reject) => {
      this.connection.run(query, params, function(this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve(createSuccessResult([{ affectedRows: this.changes }]));
        }
      });
    });
  }

  private async executeSQLServer(query: string, params: any[]): Promise<QueryResult> {
    const result = await this.connection.request()
      .input('params', params)
      .query(query);
    return createSuccessResult([{ affectedRows: result.rowsAffected[0] }]);
  }

  private async executePostgreSQL(query: string, params: any[]): Promise<QueryResult> {
    const result = await this.connection.query(query, params);
    return createSuccessResult([{ affectedRows: result.rowCount }]);
  }

  private async executeMySQL(query: string, params: any[]): Promise<QueryResult> {
    const [result] = await this.connection.execute(query, params);
    return createSuccessResult([{ affectedRows: (result as any).affectedRows }]);
  }
} 