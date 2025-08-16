// Archivo índice para exportar todas las herramientas del servidor MCP

// Importar herramientas de base de datos
export { databaseTools } from './databaseTools.js';

// Importar herramientas del sistema
export { systemTools } from './systemTools.js';

// Importar herramientas de ejemplo
export { exampleTools } from './example.js';

// Función para obtener todas las herramientas en un solo array
export const getAllTools = async () => {
  const { databaseTools } = await import('./databaseTools.js');
  const { systemTools } = await import('./systemTools.js');
  const { exampleTools } = await import('./example.js');
  
  return [
    ...databaseTools,
    ...systemTools,
    ...exampleTools
  ];
};

// Función para registrar todas las herramientas en un servidor MCP
export const registerAllTools = async (server: any) => {
  const { databaseTools } = await import('./databaseTools.js');
  const { systemTools } = await import('./systemTools.js');
  const { exampleTools } = await import('./example.js');
  
  // Registrar herramientas de base de datos
  databaseTools.forEach((tool) => {
    server.tool(tool.name, tool.description, tool.schema, tool.handler);
  });
  
  // Registrar herramientas del sistema
  systemTools.forEach((tool) => {
    server.tool(tool.name, tool.description, tool.schema, tool.handler);
  });
  
  // Registrar herramientas de ejemplo
  exampleTools.forEach((tool) => {
    server.tool(tool.name, tool.description, tool.schema, tool.handler);
  });
  
  console.log(`✅ Registradas ${databaseTools.length + systemTools.length + exampleTools.length} herramientas MCP`);
};
