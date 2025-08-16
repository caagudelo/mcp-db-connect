// Archivo índice para exportar todas las herramientas del servidor MCP

// Importar herramientas de base de datos
export { databaseTools } from './databaseTools.js';

// Importar herramientas del sistema
export { systemTools } from './systemTools.js';

// Importar herramientas de ejemplo
export { exampleTools } from './example.js';

// Importar herramientas de negocio
export { businessTools } from './businessTools.js';

// Función para obtener todas las herramientas en un solo array
export const getAllTools = async () => {
  try {
    const { databaseTools } = await import('./databaseTools.js');
    const { systemTools } = await import('./systemTools.js');
    const { exampleTools } = await import('./example.js');
    const { businessTools } = await import('./businessTools.js');
    
    const allTools = [
      ...databaseTools,
      ...systemTools,
      ...exampleTools,
      ...businessTools
    ];
    
    // Log solo a archivo, no a stdio
    // console.log(`✅ Total de herramientas disponibles: ${allTools.length}`);
    
    return allTools;
  } catch (error) {
    // Log solo a archivo, no a stdio
    // console.error('❌ Error al obtener herramientas:', error);
    throw error;
  }
};

// Función para registrar todas las herramientas en un servidor MCP
export const registerAllTools = async (server: any) => {
  try {
    const { databaseTools } = await import('./databaseTools.js');
    const { systemTools } = await import('./systemTools.js');
    const { exampleTools } = await import('./example.js');
    const { businessTools } = await import('./businessTools.js');
    
    // Para el servidor MCP estándar, no necesitamos registrar herramientas
    // ya que se manejan a través de los handlers de CallToolRequestSchema
    // Solo verificamos que las herramientas estén disponibles
    
    const totalTools = databaseTools.length + systemTools.length + exampleTools.length + businessTools.length;
    
    // Log solo a archivo, no a stdio
    // console.log(`✅ Registradas ${totalTools} herramientas MCP`);
    
    return totalTools;
  } catch (error) {
    // Log solo a archivo, no a stdio
    // console.error('❌ Error al registrar herramientas:', error);
    throw error;
  }
};
