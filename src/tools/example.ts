import { z } from "zod";
import { tool } from "../types/index.js";

// Ejemplo de herramienta personalizada: hello_world
const helloWorld: tool<{}> = {
  name: "hello_world",
  description: "Devuelve un saludo de prueba",
  schema: {},
  handler: async () => {
    try {
      return {
        content: [
          { type: "text", text: "¡Hola mundo! Servidor MCP funcionando correctamente." }
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

// Ejemplo de herramienta con parámetros: calculate
const calculate: tool<{
  operation: z.ZodEnum<["add", "subtract", "multiply", "divide"]>;
  a: z.ZodNumber;
  b: z.ZodNumber;
}> = {
  name: "calculate",
  description: "Realiza operaciones matemáticas básicas",
  schema: {
    operation: z.enum(["add", "subtract", "multiply", "divide"]).describe("Operación a realizar"),
    a: z.number().describe("Primer número"),
    b: z.number().describe("Segundo número")
  },
  handler: async ({ operation, a, b }) => {
    try {
      let result: number;
      
      switch (operation) {
        case "add":
          result = a + b;
          break;
        case "subtract":
          result = a - b;
          break;
        case "multiply":
          result = a * b;
          break;
        case "divide":
          if (b === 0) {
            throw new Error("No se puede dividir por cero");
          }
          result = a / b;
          break;
        default:
          throw new Error("Operación no soportada");
      }
      
      return {
        content: [
          { type: "text", text: `Resultado de ${operation}(${a}, ${b}) = ${result}` }
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

// Ejemplo de herramienta que interactúa con el sistema: get_system_info
const getSystemInfo: tool<{}> = {
  name: "get_system_info",
  description: "Obtiene información del sistema",
  schema: {},
  handler: async () => {
    try {
      const systemInfo = {
        platform: process.platform,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        pid: process.pid
      };
      
      return {
        content: [
          { type: "text", text: JSON.stringify(systemInfo, null, 2) }
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

// Exportar herramientas de ejemplo
export const exampleTools = [
  helloWorld,
  calculate,
  getSystemInfo
];

// Función para registrar herramientas de ejemplo
export const registerExampleTools = (server: any) => {
  exampleTools.forEach((tool) => {
    server.tool(tool.name, tool.description, tool.schema, tool.handler);
  });
  
  // Log solo a archivo, no a stdio
  // console.log(`✅ Registradas ${exampleTools.length} herramientas de ejemplo`);
};
