# Estructura de Herramientas MCP

Este directorio contiene todas las herramientas del servidor MCP organizadas de manera modular y reutilizable.

## Estructura de Archivos

```
src/tools/
├── index.ts              # Archivo índice principal
├── databaseTools.ts      # Herramientas de base de datos
├── systemTools.ts        # Herramientas del sistema
├── example.ts            # Herramientas de ejemplo
└── README.md             # Este archivo
```

## Cómo Funciona

### 1. Definición de Herramientas

Cada herramienta sigue este patrón:

```typescript
const miHerramienta: tool<{
  parametro1: z.ZodString;
  parametro2: z.ZodNumber;
}> = {
  name: "mi_herramienta",
  description: "Descripción de la herramienta",
  schema: {
    parametro1: z.string().describe("Descripción del parámetro"),
    parametro2: z.number().describe("Descripción del parámetro")
  },
  handler: async ({ parametro1, parametro2 }) => {
    try {
      // Lógica de la herramienta
      const resultado = await hacerAlgo(parametro1, parametro2);
      
      return {
        content: [
          { type: "text", text: JSON.stringify(resultado, null, 2) }
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
```

### 2. Exportación de Herramientas

Cada archivo exporta un array de herramientas:

```typescript
export const databaseTools = [
  herramienta1,
  herramienta2,
  herramienta3
];
```

### 3. Registro Automático

En el archivo principal del servidor, solo necesitas una línea:

```typescript
import { registerAllTools } from "./tools/index.js";

// ... configuración del servidor ...

// Registrar todas las herramientas MCP
await registerAllTools(server);
```

## Ventajas de Esta Estructura

1. **Organización**: Cada tipo de herramienta tiene su propio archivo
2. **Reutilización**: Puedes importar herramientas específicas donde las necesites
3. **Mantenimiento**: Es más fácil encontrar y modificar herramientas
4. **Escalabilidad**: Agregar nuevas herramientas no satura el archivo principal
5. **Testing**: Puedes probar herramientas individuales
6. **Documentación**: Cada herramienta está bien documentada

## Agregar Nuevas Herramientas

### Paso 1: Crear la Herramienta

```typescript
// En databaseTools.ts, systemTools.ts, o crear un nuevo archivo
const nuevaHerramienta: tool<{
  // parámetros aquí
}> = {
  name: "nueva_herramienta",
  description: "Descripción",
  schema: {
    // esquema aquí
  },
  handler: async (params) => {
    // lógica aquí
  }
};
```

### Paso 2: Exportar la Herramienta

```typescript
export const databaseTools = [
  // ... herramientas existentes ...
  nuevaHerramienta
];
```

### Paso 3: Registrar (Automático)

La herramienta se registrará automáticamente cuando llames a `registerAllTools(server)`.

## Tipos de Herramientas Disponibles

### Base de Datos (`databaseTools.ts`)
- `read_query`: Consultas SELECT
- `write_query`: Consultas de modificación
- `create_table`: Crear tablas
- `alter_table`: Modificar tablas
- `drop_table`: Eliminar tablas
- `list_tables`: Listar tablas
- `describe_table`: Describir estructura de tabla
- `list_procedures`: Listar procedimientos
- `list_views`: Listar vistas
- `describe_view`: Describir estructura de vista
- `list_indexes`: Listar índices
- `describe_index`: Describir estructura de índice
- `search_in_database`: Buscar en la base de datos
- `export_to_csv`: Exportar a CSV

### Sistema (`systemTools.ts`)
- `get_database_info`: Información de la base de datos
- `ping`: Verificar conectividad
- `get_server_version`: Versión del servidor
- `get_help`: Ayuda sobre herramientas

### Ejemplo (`example.ts`)
- `hello_world`: Saludo de prueba
- `calculate`: Operaciones matemáticas
- `get_system_info`: Información del sistema

## Uso Avanzado

### Importar Herramientas Específicas

```typescript
import { databaseTools } from './tools/databaseTools.js';
import { systemTools } from './tools/systemTools.js';

// Usar herramientas específicas
const readQueryTool = databaseTools.find(t => t.name === 'read_query');
```

### Crear Herramientas Personalizadas

```typescript
import { tool } from '../types/index.js';

const miHerramientaPersonalizada: tool<{}> = {
  name: "mi_herramienta",
  description: "Descripción",
  schema: {},
  handler: async () => {
    // Lógica personalizada
  }
};
```

## Mejores Prácticas

1. **Nombres descriptivos**: Usa nombres claros para las herramientas
2. **Documentación**: Siempre incluye descripciones útiles
3. **Manejo de errores**: Siempre usa try-catch y retorna `isError: true` en caso de error
4. **Validación**: Usa Zod para validar parámetros de entrada
5. **Consistencia**: Mantén el mismo formato en todas las herramientas
6. **Testing**: Escribe pruebas para tus herramientas

## Solución de Problemas

### Error: "Cannot find module './tools/index.js'"
- Asegúrate de que el archivo `index.ts` existe en el directorio `tools`
- Verifica que la ruta de importación sea correcta

### Error: "registerAllTools is not a function"
- Asegúrate de que estás importando la función correcta
- Verifica que la función esté siendo exportada correctamente

### Herramientas no se registran
- Verifica que `registerAllTools(server)` se esté llamando después de crear el servidor
- Revisa la consola para mensajes de error
- Asegúrate de que todas las importaciones en los archivos de herramientas sean correctas
