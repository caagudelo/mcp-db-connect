import { z } from "zod";
import { tool } from "../types/index.js";
import {
  dbAll, 
  dbRun, 
  getListTablesQuery, 
  getDescribeTableQuery, 
  getListProceduresQuery, 
  getListViewsQuery, 
  getDescribeViewQuery, 
  getListIndexesQuery, 
  getDescribeIndexQuery, 
  getSearchInDatabaseQuery
} from "../db/index.js";
import {
  isSelectQuery, 
  isModificationQuery, 
  formatSuccessResponse, 
  formatErrorResponse, 
  convertToCSV
} from "../utils/helpers.js";

// Herramienta: read_query - Para consultas SELECT
const readQuery: tool<{
  query: z.ZodString;
}> = {
  name: "read_query",
  description: "Consulta SQL SELECT",
  schema: {
    query: z.string().describe("Consulta SQL SELECT")
  },
  handler: async ({ query }) => {
    try {
      if (!isSelectQuery(query)) {
        throw new Error("Solo se permiten consultas SELECT");
      }
      const result = await dbAll(query);
      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ],
        isError: false
      };
    } catch (e: any) {
      return {
        content: [
          { type: "text", text: e.message }
        ],
        isError: true
      };
    }
  }
};

// Herramienta: write_query - Para consultas de modificación
const writeQuery: tool<{
  query: z.ZodString;
}> = {
  name: "write_query",
  description: "Ejecuta una consulta SQL de tipo (INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, EXEC, CALL, etc.)",
  schema: {
    query: z.string().describe("Consulta SQL de tipo (INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, EXEC, CALL, etc.)")
  },
  handler: async ({ query }) => {
    try {
      const result = await dbRun(query);
      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ],
        isError: false
      };
    } catch (e: any) {
      return {
        content: [
          { type: "text", text: e.message }
        ],
        isError: true
      };
    }
  }
};

// Herramienta: create_table - Para crear tablas
const createTable: tool<{
  query: z.ZodString;
}> = {
  name: "create_table",
  description: "Sentencia CREATE TABLE",
  schema: {
    query: z.string().describe("Sentencia CREATE TABLE")
  },
  handler: async ({ query }) => {
    try {
      if (!(query.toLowerCase().includes('create table'))) {
        throw new Error('Solo se permiten sentencias CREATE TABLE');
      }
      const result = await dbRun(query);
      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ],
        isError: false
      };
    } catch (e: any) {
      return {
        content: [
          { type: "text", text: e.message }
        ],
        isError: true
      };
    }
  }
};

// Herramienta: alter_table - Para modificar tablas
const alterTable: tool<{
  query: z.ZodString;
}> = {
  name: "alter_table",
  description: "Sentencia ALTER TABLE",
  schema: {
    query: z.string().describe("Sentencia ALTER TABLE")
  },
  handler: async ({ query }) => {
    try {
      if (!(query.toLowerCase().includes('alter table'))) {
        throw new Error('Solo se permiten sentencias ALTER TABLE');
      }
      const result = await dbRun(query);
      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ],
        isError: false
      };
    } catch (e: any) {
      return {
        content: [
          { type: "text", text: e.message }
        ],
        isError: true
      };
    }
  }
};

// Herramienta: drop_table - Para eliminar tablas
const dropTable: tool<{
  table_name: z.ZodString;
  confirm: z.ZodBoolean;
}> = {
  name: "drop_table",
  description: "Eliminar una tabla",
  schema: {
    table_name: z.string().describe("Nombre de la tabla"),
    confirm: z.boolean().describe("Confirmar eliminación")
  },
  handler: async ({ table_name, confirm }) => {
    try {
      if (!confirm) {
        throw new Error('Se requiere confirmación para eliminar una tabla');
      }
      const result = await dbRun(`DROP TABLE ${table_name}`);
      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ],
        isError: false
      };
    } catch (e: any) {
      return {
        content: [
          { type: "text", text: e.message }
        ],
        isError: true
      };
    }
  }
};

// Herramienta: list_tables - Para listar tablas
const listTables: tool<{}> = {
  name: "list_tables",
  description: "Lista todas las tablas de la base de datos",
  schema: {},
  handler: async () => {
    try {
      const result = await dbAll(getListTablesQuery());
      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ],
        isError: false
      };
    } catch (e: any) {
      return {
        content: [
          { type: "text", text: e.message }
        ],
        isError: true
      };
    }
  }
};

// Herramienta: describe_table - Para describir estructura de tabla
const describeTable: tool<{
  table_name: z.ZodString;
}> = {
  name: "describe_table",
  description: "Describe la estructura de una tabla",
  schema: {
    table_name: z.string().describe("Nombre de la tabla")
  },
  handler: async ({ table_name }) => {
    try {
      const result = await dbAll(getDescribeTableQuery(table_name));
      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ],
        isError: false
      };
    } catch (e: any) {
      return {
        content: [
          { type: "text", text: e.message }
        ],
        isError: true
      };
    }
  }
};

// Herramienta: list_procedures - Para listar procedimientos almacenados
const listProcedures: tool<{}> = {
  name: "list_procedures",
  description: "Lista todos los procedimientos almacenados",
  schema: {},
  handler: async () => {
    try {
      const result = await dbAll(getListProceduresQuery());
      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ],
        isError: false
      };
    } catch (e: any) {
      return {
        content: [
          { type: "text", text: e.message }
        ],
        isError: true
      };
    }
  }
};

// Herramienta: list_views - Para listar vistas
const listViews: tool<{}> = {
  name: "list_views",
  description: "Lista todas las vistas de la base de datos",
  schema: {},
  handler: async () => {
    try {
      const result = await dbAll(getListViewsQuery());
      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ],
        isError: false
      };
    } catch (e: any) {
      return {
        content: [
          { type: "text", text: e.message }
        ],
        isError: true
      };
    }
  }
};

// Herramienta: describe_view - Para describir estructura de vista
const describeView: tool<{
  view_name: z.ZodString;
}> = {
  name: "describe_view",
  description: "Describe la estructura de una vista",
  schema: {
    view_name: z.string().describe("Nombre de la vista")
  },
  handler: async ({ view_name }) => {
    try {
      const result = await dbAll(getDescribeViewQuery(view_name));
      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ],
        isError: false
      };
    } catch (e: any) {
      return {
        content: [
          { type: "text", text: e.message }
        ],
        isError: true
      };
    }
  }
};

// Herramienta: list_indexes - Para listar índices
const listIndexes: tool<{
  table_name: z.ZodString;
}> = {
  name: "list_indexes",
  description: "Lista todos los índices de una tabla",
  schema: {
    table_name: z.string().describe("Nombre de la tabla")
  },
  handler: async ({ table_name }) => {
    try {
      const result = await dbAll(getListIndexesQuery(table_name));
      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ],
        isError: false
      };
    } catch (e: any) {
      return {
        content: [
          { type: "text", text: e.message }
        ],
        isError: true
      };
    }
  }
};

// Herramienta: describe_index - Para describir estructura de índice
const describeIndex: tool<{
  index_name: z.ZodString;
}> = {
  name: "describe_index",
  description: "Describe la estructura de un índice",
  schema: {
    index_name: z.string().describe("Nombre del índice")
  },
  handler: async ({ index_name }) => {
    try {
      const result = await dbAll(getDescribeIndexQuery(index_name));
      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ],
        isError: false
      };
    } catch (e: any) {
      return {
        content: [
          { type: "text", text: e.message }
        ],
        isError: true
      };
    }
  }
};

// Herramienta: search_in_database - Para buscar en la base de datos
const searchInDatabase: tool<{
  search_term: z.ZodString;
}> = {
  name: "search_in_database",
  description: "Busca un término en la base de datos",
  schema: {
    search_term: z.string().describe("Término de búsqueda")
  },
  handler: async ({ search_term }) => {
    try {
      const result = await dbAll(getSearchInDatabaseQuery(search_term));
      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ],
        isError: false
      };
    } catch (e: any) {
      return {
        content: [
          { type: "text", text: e.message }
        ],
        isError: true
      };
    }
  }
};

// Herramienta: export_to_csv - Para exportar datos a CSV
const exportToCSV: tool<{
  query: z.ZodString;
  filename: z.ZodString;
}> = {
  name: "export_to_csv",
  description: "Exporta el resultado de una consulta a un archivo CSV",
  schema: {
    query: z.string().describe("Consulta SQL SELECT"),
    filename: z.string().describe("Nombre del archivo CSV")
  },
  handler: async ({ query, filename }) => {
    try {
      if (!isSelectQuery(query)) {
        throw new Error("Solo se permiten consultas SELECT para exportar");
      }
      const result = await dbAll(query);
      const csvContent = convertToCSV(result);
      
      // Aquí podrías implementar la lógica para guardar el archivo
      // Por ahora solo retornamos el contenido CSV
      return {
        content: [
          { type: "text", text: `CSV generado para ${filename}:\n\n${csvContent}` }
        ],
        isError: false
      };
    } catch (e: any) {
      return {
        content: [
          { type: "text", text: e.message }
        ],
        isError: true
      };
    }
  }
};

// Exportar todas las herramientas de base de datos
export const databaseTools = [
  readQuery,
  writeQuery,
  createTable,
  alterTable,
  dropTable,
  listTables,
  describeTable,
  listProcedures,
  listViews,
  describeView,
  listIndexes,
  describeIndex,
  searchInDatabase,
  exportToCSV
];
