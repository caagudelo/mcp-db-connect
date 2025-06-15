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
node dist/index.js --sqlserver --host <host_sqlserver> --database <nombre_base_datos> --port <puerto> --user <usuario> --password "<contraseña>" --trustServerCertificate true
```

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
    }
  }
}
```
> **Nota importante sobre contraseñas y caracteres especiales:**
>
> Si tu contraseña (o cualquier argumento) contiene caracteres especiales como `|`, `*`, `&`, etc., ponla entre comillas al ejecutar el comando:
>
> ```bash
> node dist/index.js --mysql --password "MiContraseña|Con*Especiales"
> ```
>
> Si configuras los argumentos en un editor o archivo y no puedes usar comillas, asegúrate de escapar los caracteres especiales según tu sistema operativo:
> - En Linux/Mac: `MiContraseña\|Con\*Especiales`
> - En Windows PowerShell: `MiContraseña`|Con`*Especiales`
>
> Si la contraseña se pasa como un argumento separado (por ejemplo, en un array de argumentos), la terminal normalmente la tratará como un solo argumento, pero si tienes problemas, revisa la documentación de tu editor.

## Notas adicionales

- Puedes seguir usando el sistema antiguo de argumentos posicionales, pero se recomienda el uso de argumentos nombrados para mayor claridad y seguridad.
- Mantén seguras tus contraseñas y evita compartir archivos de configuración con datos sensibles.
- Considera el uso de variables de entorno o archivos de configuración seguros para manejar contraseñas en entornos de producción.

## Herramientas Disponibles

| Herramienta | Descripción | Parámetros Requeridos |
|-------------|-------------|----------------------|
| `read_query` | Ejecutar consultas SELECT | `query`: Consulta SQL SELECT |
| `write_query` | Ejecutar consultas INSERT, UPDATE o DELETE | `query`: Consulta SQL de modificación |
| `create_table` | Crear nuevas tablas | `query`: Sentencia CREATE TABLE |
| `alter_table` | Modificar esquema de tablas | `query`: Sentencia ALTER TABLE |
| `drop_table` | Eliminar tablas | `table_name`: Nombre de la tabla<br>`confirm`: Bandera de seguridad |
| `export_query` | Exportar resultados | `query`: Consulta SQL SELECT<br>`format`: "csv" o "json" |
| `list_tables` | Listar todas las tablas | Ninguno |
| `describe_table` | Ver esquema de una tabla | `table_name`: Nombre de la tabla |

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

Puedes ejecutar el CLI directamente con npx:

```json
"mysql": {
  "command": "npx",
  "args": [
    "@cagudelo/mcp-db-connect",
    "--mysql",
    "--host", "<host_mysql>",
    "--database", "<nombre_base_datos>",
    "--port", "<puerto>",
    "--user", "<usuario>",
    "--password", "<contraseña>"
  ]
}
```


### Recomendaciones

- **Para usuarios finales o equipos:** Instala globalmente y usa el comando (`mcp-db-connect`).
- **Para pruebas rápidas:** Usa `npx @cagudelo/mcp-db-connect ...`.
- **Para desarrollo local:** Usa la ruta directa al archivo.

> Si tu contraseña contiene caracteres especiales, revisa la sección de recomendaciones de seguridad en este README.

