# ¿Qué es un servidor MCP?

Un **servidor MCP** (Model Context Protocol) es un software que actúa como intermediario entre aplicaciones (como editores de código o asistentes inteligentes) y bases de datos. Su función principal es recibir solicitudes (por ejemplo, ejecutar una consulta SQL), procesarlas y devolver los resultados de manera estructurada y segura.

## ¿Cómo funciona un servidor MCP?

- El servidor MCP se ejecuta en tu computadora o en un servidor remoto.
- Recibe comandos o consultas desde una aplicación cliente (por ejemplo, Claude Desktop, un editor de código como Cursor o Visual Studio Code, o una API).
- Procesa estos comandos, accediendo a la base de datos que tengas configurada (puede ser SQLite, SQL Server, PostgreSQL, MySQL, etc.).
- Devuelve los resultados al cliente en un formato fácil de usar (como JSON o CSV).


## Finalidad de esta aplicación

La finalidad principal de este proyecto es **integrar el servidor MCP con editores de código como Cursor y Visual Studio Code**. Esto permite a los usuarios interactuar con bases de datos utilizando modelos de inteligencia artificial (IA) y lenguaje natural. Así, puedes escribir instrucciones en español o inglés (por ejemplo, "muéstrame todos los usuarios registrados este mes") y el sistema las traduce en consultas SQL, facilitando el trabajo con bases de datos incluso si no dominas SQL.

## Configuración en editores de código

A continuación, algunos recursos y enlaces oficiales para configurar MCP en los editores más populares:

- **Visual Studio Code:**
  - [Guía oficial de integración de MCP con VS Code (Claude Desktop)](https://docs.anthropic.com/claude/docs/database-mcp)
  - [Extensión Claude Desktop para VS Code](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-desktop)

- **Cursor:**
  - [Documentación oficial de Cursor sobre integración con MCP](https://docs.cursor.so/ai-database)
  - [Página principal de Cursor](https://www.cursor.so/)

## Documentación oficial y recursos

- [Documentación oficial del protocolo MCP (en inglés)](https://github.com/anthropic-ai/model-context-protocol)
- [Repositorio oficial de mcp-db-connect](https://github.com/caagudelo/mcp-db-connect)
- [Guía de uso de Claude Desktop con MCP](https://docs.anthropic.com/claude/docs/database-mcp)

# mcp-db-connect

Un servidor MCP (Model Context Protocol) que proporciona capacidades de acceso a bases de datos para Claude, soportando SQLite, SQL Server, PostgreSQL y MySQL.

## Características

- Soporte para múltiples motores de base de datos:
  - SQLite
  - SQL Server
  - PostgreSQL
  - MySQL
- Ejecución de consultas SQL (SELECT, INSERT, UPDATE, DELETE)
- Creación y modificación de tablas
- Exportación de resultados en formatos CSV y JSON
- Descripción de esquemas de tablas
- Listado de tablas disponibles

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/caagudelo/mcp-db-connect.git
cd mcp-db-connect
```

2. Instalar dependencias:
```bash
npm install
```

3. Compilar el proyecto:
```bash
npm run build
```

4. (Opcional) Ejecutar el CLI directamente con npx (sin instalación global):

```bash
npx -y @cagudelo/mcp-db-connect -- --sqlserver --host <host_sqlserver> --instance <nombre_instancia> --database <nombre_base_datos> --port <puerto> --user <usuario> --password <contraseña> --trustServerCertificate true
```

> **Importante:** El doble guion `--` es necesario para que todos los argumentos sean pasados correctamente a tu script y no sean interpretados por npx.

## Configuración del MCP en el Editor

Para configurar mcp-db-connect en tu editor, edita el archivo de configuración de Claude Desktop. Ejemplo moderno para MySQL:

```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": [
        "/ruta/absoluta/a/mcp-db-connect/dist/index.js",
        "--mysql",
        "--host", "<host_mysql>",
        "--database", "<nombre_base_datos>",
        "--port", "<puerto>",
        "--user", "<usuario>",
        "--password", "<contraseña>"
      ]
    },
    "sqlserver": {
      "command": "node",
      "args": [
        "/ruta/absoluta/a/mcp-db-connect/dist/index.js",
        "--sqlserver",
        "--host", "<host_sqlserver>",
        "--instance", "<nombre_instancia>",
        "--database", "<nombre_base_datos>",
        "--port", "<puerto>",
        "--user", "<usuario>",
        "--password", "<contraseña>",
        "--trustServerCertificate", "true"
      ]
    },
    "postgresql": {
      "command": "node",
      "args": [
        "/ruta/absoluta/a/mcp-db-connect/dist/index.js",
        "--postgresql",
        "--host", "<host_postgres>",
        "--database", "<nombre_base_datos>",
        "--port", "<puerto>",
        "--user", "<usuario>",
        "--password", "<contraseña>",
        "--ssl", "true"
      ]
    },
    "sqlite": {
      "command": "node",
      "args": [
        "/ruta/absoluta/a/mcp-db-connect/dist/index.js",
        "--sqlite",
        "--path", "/ruta/a/tu/base.db"
      ]
    },
    "sqlserver-npx": {
      "command": "npx",
      "args": [
        "-y",
        "@cagudelo/mcp-db-connect",
        "--",
        "--sqlserver",
        "--host", "<host_sqlserver>",
        "--instance", "<nombre_instancia>",
        "--database", "<nombre_base_datos>",
        "--port", "<puerto>",
        "--user", "<usuario>",
        "--password", "<contraseña>",
        "--trustServerCertificate", "true"
      ]
    }
  }
}
```
> **Importante:** Si usas `npx` en la configuración del editor, asegúrate de incluir el argumento `--` antes de los parámetros de tu script y el flag `-y` para evitar preguntas interactivas. Esto previene errores de interpretación de argumentos.

## Uso

### Nuevo sistema de argumentos nombrados (recomendado)

Ahora puedes usar argumentos nombrados para mayor claridad y flexibilidad. Ejemplo para MySQL:

```bash
node dist/index.js --mysql --host <host_mysql> --database <nombre_base_datos> --port <puerto> --user <usuario> --password "<contraseña>"
```

Puedes usar los siguientes flags según el motor:
- `--mysql`
- `--sqlserver`
- `--postgresql`
- `--sqlite`

#### Ejemplo para SQL Server:

```bash
node dist/index.js --sqlserver --host <host_sqlserver> --instance <nombre_instancia> --database <nombre_base_datos> --port <puerto> --user <usuario> --password "<contraseña>" --trustServerCertificate true
```

> **Nota:** El parámetro `--instance` es opcional y solo se usa si necesitas conectarte a una instancia nombrada de SQL Server. Si no lo especificas, se conectará a la instancia predeterminada.

#### Ejemplo para PostgreSQL:

```bash
node dist/index.js --postgresql --host <host_postgres> --database <nombre_base_datos> --port <puerto> --user <usuario> --password "<contraseña>" --ssl true
```

#### Ejemplo para SQLite:

```bash
node dist/index.js --sqlite --path /ruta/a/tu/base.db
```

### ¿Cómo se procesan los argumentos?

A partir de la versión actual, el proyecto utiliza la librería [`minimist`](https://www.npmjs.com/package/minimist) para procesar los argumentos de la línea de comandos. Esto permite que los argumentos sean nombrados y opcionales, facilitando la configuración y el uso del servidor.

- El archivo principal (`src/index.ts`) importa y utiliza `minimist` para convertir los argumentos en un objeto fácil de usar.
- Esto permite que los parámetros como `--host`, `--user`, `--password`, etc., sean reconocidos automáticamente.
- Si quieres modificar o extender los argumentos soportados, revisa la sección donde se usa `minimist` en el código fuente.

> **Nota:** Si usas TypeScript, asegúrate de instalar los tipos de minimist con:
> ```bash
> npm install --save-dev @types/minimist
> ```

## Notas adicionales

- Puedes seguir usando el sistema antiguo de argumentos posicionales, pero se recomienda el uso de argumentos nombrados para mayor claridad y seguridad.
- Mantén seguras tus contraseñas y evita compartir archivos de configuración con datos sensibles.
- Considera el uso de variables de entorno o archivos de configuración seguros para manejar contraseñas en entornos de producción.

## Herramientas Disponibles

| Herramienta | Descripción | Parámetros Requeridos |
|-------------|-------------|----------------------|
| `read_query` | Ejecuta una consulta SQL SELECT para leer datos de la base de datos. | `query`: Consulta SQL SELECT |
| `write_query` | Ejecuta una consulta SQL de modificación (INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, EXEC, CALL, etc.). No permite SELECT ni consultas de solo lectura. | `query`: Consulta SQL de modificación |
| `create_table` | Crea una nueva tabla en la base de datos utilizando una sentencia CREATE TABLE. | `query`: Sentencia CREATE TABLE |
| `alter_table` | Modifica el esquema de una tabla existente utilizando una sentencia ALTER TABLE. | `query`: Sentencia ALTER TABLE |
| `drop_table` | Elimina una tabla de la base de datos. Requiere confirmación para evitar eliminaciones accidentales. | `table_name`: Nombre de la tabla<br>`confirm`: Bandera de seguridad |
| `export_query` | Exporta los resultados de una consulta SELECT en formato CSV o JSON. | `query`: Consulta SQL SELECT<br>`format`: "csv" o "json" |
| `list_tables` | Obtiene una lista de todas las tablas en la base de datos. | Ninguno |
| `list_procedures` | Obtiene una lista de todos los procedimientos almacenados en la base de datos. | Ninguno |
| `describe_table` | Muestra información detallada del esquema de una tabla específica. | `table_name`: Nombre de la tabla |
| `append_insight` | Agrega un insight de negocio a la base de datos. | `insight`: Texto del insight |
| `list_insights` | Lista todos los insights de negocio almacenados en la base de datos. | Ninguno |
| `list_views` | Obtiene una lista de todas las vistas (views) en la base de datos. | Ninguno |
| `describe_view` | Muestra la definición SQL de una vista específica. | `view_name`: Nombre de la vista |
| `list_indexes` | Obtiene una lista de todos los índices en la base de datos o de una tabla específica. | `table_name` (opcional): Nombre de la tabla |
| `describe_index` | Muestra la definición de un índice específico. | `index_name`: Nombre del índice<br>`table_name` (opcional): Nombre de la tabla |
| `search_in_database` | Busca un valor en todas las tablas y columnas de la base de datos. | `search`: Valor a buscar |


## Desarrollo

Para ejecutar el servidor en modo desarrollo:

```bash
npm run dev
```

## Uso en el Editor: Opciones de Configuración

Puedes configurar el CLI en tu editor de diferentes maneras, según tus necesidades y preferencias:

### Opción 1: Usar el comando global (recomendado)

Instala el paquete globalmente:

```bash
npm install -g @cagudelo/mcp-db-connect
```

Configura tu editor para usar el comando directamente:

```json
"mysql": {
  "command": "mcp-db-connect",
  "args": [
    "--mysql",
    "--host", "<host_mysql>",
    "--database", "<nombre_base_datos>",
    "--port", "<puerto>",
    "--user", "<usuario>",
    "--password", "<contraseña>"
  ]
}
```

### Opción 2: Usar npx (sin instalación global)

Puedes ejecutar el CLI directamente con npx. **IMPORTANTE:** Para evitar errores con los argumentos, agrega `--` antes de los parámetros de tu script:

```json
"mysql": {
  "command": "npx",
  "args": [
    "@cagudelo/mcp-db-connect",
    "--",
    "--mysql",
    "--host", "<host_mysql>",
    "--database", "<nombre_base_datos>",
    "--port", "<puerto>",
    "--user", "<usuario>",
    "--password", "<contraseña>"
  ]
}
```

> **Nota:** Si ejecutas el comando desde la terminal, usa el doble guion `--` para separar los argumentos de npx y los de tu script. Ejemplo:
>
> ```bash
> npx -y @cagudelo/mcp-db-connect -- --sqlserver --host <host_sqlserver> --instance <nombre_instancia> --database <nombre_base_datos> --port <puerto> --user <usuario> --password <contraseña> --trustServerCertificate true
> ```

Esto asegura que todos los argumentos sean interpretados correctamente por tu script y no por npx.


### Recomendaciones

- **Para usuarios finales o equipos:** Instala globalmente y usa el comando (`mcp-db-connect`).
- **Para pruebas rápidas:** Usa `npx @cagudelo/mcp-db-connect ...`.
- **Para desarrollo local:** Usa la ruta directa al archivo.




