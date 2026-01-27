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
- **Nuevo:** Soporte para variables de entorno (.env) para configuración segura
- **Nuevo:** Sistema de configuración híbrido (variables de entorno + argumentos de línea de comandos)
- **Nuevo:** Creación automática de archivo .env de ejemplo
- **Nuevo:** Validaciones robustas de configuración con mensajes informativos
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

## Configuración

### 🆕 Sistema de Variables de Entorno (.env) - RECOMENDADO

La nueva versión incluye soporte completo para variables de entorno, lo que hace la configuración más segura y fácil de gestionar.

#### Configuración Automática

1. **Ejecuta el servidor por primera vez:**
   ```bash
   npm start
   ```

2. **Se creará automáticamente un archivo `.env` de ejemplo** con esta estructura:
   ```env
   # Configuración de Base de Datos para mcp-db-connect
   # Copia este archivo como .env y configura tus valores

   # Tipo de base de datos (mysql, sqlserver, postgresql, sqlite)
   DB_TYPE=sqlserver

   # Configuración general de conexión
   DB_HOST=localhost
   DB_NAME=test
   DB_USER=sa
   DB_PASSWORD=tu_contraseña
   DB_PORT=1433

   # Configuración específica para SQL Server
   DB_INSTANCE=SQLEXPRESS

   # Configuración de seguridad
   DB_SSL=false
   DB_TRUST_SERVER_CERTIFICATE=true

   # Ejemplos para diferentes bases de datos:

   # MySQL
   # DB_TYPE=mysql
   # DB_HOST=localhost
   # DB_NAME=mi_base_datos
   # DB_USER=root
   # DB_PASSWORD=mi_contraseña
   # DB_PORT=3306
   # DB_SSL=false

   # PostgreSQL
   # DB_TYPE=postgresql
   # DB_HOST=localhost
   # DB_NAME=mi_base_datos
   # DB_USER=postgres
   # DB_PASSWORD=mi_contraseña
   # DB_PORT=5432
   # DB_SSL=false

   # SQLite
   # DB_TYPE=sqlite
   # DB_PATH=/ruta/completa/a/mi_base.db
   ```

3. **Edita el archivo `.env`** con tu configuración real
4. **Ejecuta nuevamente:** `npm start`

#### Variables de Entorno Disponibles

| Variable | Descripción | Requerido | Ejemplo |
|----------|-------------|-----------|---------|
| `DB_TYPE` | Tipo de base de datos | ✅ | `mysql`, `sqlserver`, `postgresql`, `sqlite` |
| `DB_HOST` | Host del servidor | ✅ (excepto SQLite) | `localhost`, `192.168.1.100` |
| `DB_NAME` | Nombre de la base de datos | ✅ (excepto SQLite) | `test`, `production` |
| `DB_USER` | Usuario de la base de datos | ✅ (excepto SQLite) | `root`, `sa`, `postgres` |
| `DB_PASSWORD` | Contraseña de la base de datos | ✅ (excepto SQLite) | `mi_contraseña_segura` |
| `DB_PORT` | Puerto de conexión | ❌ (usa valores por defecto) | `3306`, `1433`, `5432` |
| `DB_PATH` | Ruta al archivo SQLite | ✅ (solo SQLite) | `/ruta/a/mi_base.db` |
| `DB_INSTANCE` | Instancia de SQL Server | ❌ | `SQLEXPRESS`, `MSSQLSERVER` |
| `DB_SSL` | Habilitar SSL | ❌ | `true`, `false` |
| `DB_TRUST_SERVER_CERTIFICATE` | Trust server certificate (SQL Server) | ❌ | `true`, `false` |
| `DB_INTEGRATED_SECURITY` | Habilitar autenticación integrada de Windows (SQL Server) | ❌ | `true`, `false` |

#### Ejemplos de Configuración por Tipo de Base de Datos

**MySQL:**
```env
DB_TYPE=mysql
DB_HOST=localhost
DB_NAME=mi_base_datos
DB_USER=root
DB_PASSWORD=mi_contraseña
DB_PORT=3306
DB_SSL=false
```

**SQL Server:**
```env
DB_TYPE=sqlserver
DB_HOST=localhost
DB_NAME=test
DB_USER=sa
DB_PASSWORD=mi_contraseña
DB_PORT=1433
DB_INSTANCE=SQLEXPRESS
DB_TRUST_SERVER_CERTIFICATE=true
```

**PostgreSQL:**
```env
DB_TYPE=postgresql
DB_HOST=localhost
DB_NAME=mi_base_datos
DB_USER=postgres
DB_PASSWORD=mi_contraseña
DB_PORT=5432
DB_SSL=true
```

**SQLite:**
```env
DB_TYPE=sqlite
DB_PATH=/ruta/completa/a/mi_base.db
```

### Sistema de Argumentos de Línea de Comandos

También puedes seguir usando argumentos de línea de comandos como antes:

#### Argumentos Disponibles

| Argumento | Descripción | Requerido | Ejemplo |
|-----------|-------------|-----------|---------|
| `--mysql` | Seleccionar MySQL | ✅ (uno de los tipos) | `--mysql` |
| `--sqlserver` | Seleccionar SQL Server | ✅ (uno de los tipos) | `--sqlserver` |
| `--postgresql` | Seleccionar PostgreSQL | ✅ (uno de los tipos) | `--postgresql` |
| `--sqlite` | Seleccionar SQLite | ✅ (uno de los tipos) | `--sqlite` |
| `--host` | Host del servidor | ✅ (excepto SQLite) | `--host localhost` |
| `--database` | Nombre de la base de datos | ✅ (excepto SQLite) | `--database test` |
| `--user` | Usuario de la base de datos | ✅ (excepto SQLite) | `--user root` |
| `--password` | Contraseña de la base de datos | ✅ (excepto SQLite) | `--password "mi_clave"` |
| `--port` | Puerto de conexión | ❌ | `--port 3306` |
| `--path` | Ruta al archivo SQLite | ✅ (solo SQLite) | `--path /ruta/a/base.db` |
| `--instance` | Instancia de SQL Server | ❌ | `--instance SQLEXPRESS` |
| `--ssl` | Habilitar SSL | ❌ | `--ssl true` |
| `--trustServerCertificate` | Trust server certificate (SQL Server) | ❌ | `--trustServerCertificate true` |
| `--integratedSecurity` | Habilitar autenticación integrada de Windows (SQL Server) | ❌ | `--integratedSecurity true` |

#### Ejemplos de Uso con Argumentos

**MySQL:**
```bash
node dist/index.js --mysql --host localhost --database test --port 3306 --user root --password "miClave"
```

**SQL Server:**
```bash
node dist/index.js --sqlserver --host localhost --instance SQLEXPRESS --database test --port 1433 --user sa --password "miClave" --trustServerCertificate true
```

**PostgreSQL:**
```bash
node dist/index.js --postgresql --host localhost --database test --port 5432 --user postgres --password "miClave" --ssl true
```

**SQLite:**
```bash
node dist/index.js --sqlite --path /ruta/a/tu/base.db
```

### 🎯 Prioridad de Configuración

El sistema utiliza un orden de prioridad inteligente:

1. **Variables de entorno (.env)** - Máxima prioridad
2. **Argumentos de línea de comandos** - Prioridad media
3. **Valores por defecto** - Prioridad mínima

Esto significa que puedes:
- Usar solo variables de entorno (más seguro)
- Usar solo argumentos de línea de comandos (más flexible)
- Combinar ambos (variables de entorno como base, argumentos para sobrescribir)

## Configuración del MCP en el Editor

### Configuración con Variables de Entorno (Recomendado)

1. **Crea un archivo `.env`** en tu directorio de trabajo con tu configuración
2. **Configura tu editor** para usar solo el comando sin argumentos:

```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": [
        "/ruta/absoluta/a/mcp-db-connect/dist/index.js"
      ]
    }
  }
}
```

### Configuración con Argumentos de Línea de Comandos

Si prefieres usar argumentos, aquí tienes ejemplos para cada tipo de base de datos:

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
    }
  }
}
```

### Configuración con npx

Si usas `npx` en la configuración del editor, asegúrate de incluir el argumento `--` antes de los parámetros:

```json
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
```

> **Importante:** Si usas `npx` en la configuración del editor, asegúrate de incluir el argumento `--` antes de los parámetros de tu script y el flag `-y` para evitar preguntas interactivas.

### 🆕 Configuración con Variables de Entorno Directas en el Editor

**NUEVA FUNCIONALIDAD:** Puedes configurar las variables de entorno directamente en la configuración del editor usando la propiedad `env`. Esto es especialmente útil cuando:

- Quieres mantener toda la configuración en un solo lugar
- No quieres crear archivos `.env` separados
- Necesitas diferentes configuraciones para diferentes entornos de desarrollo
- Quieres que la configuración sea portable entre equipos

#### Ejemplo de Configuración con `env`:

```json
{
  "mcpServers": {
    "sqlserverdev": {
      "command": "node",
      "args": [
        "E:/Equipo/Documentos/GitHub/mcp-db-connect/dist/index.js"
      ],
      "env": {
        "DB_TYPE": "sqlserver",
        "DB_HOST": "ROCKA",
        "DB_NAME": "db_test",
        "DB_USER": "sa",
        "DB_PASSWORD": "12345",
        "DB_PORT": "1433",
        "DB_INSTANCE": "PRB0",
        "DB_TRUST_SERVER_CERTIFICATE": "true"
      }
    },
    "mysqldev": {
      "command": "npx",
      "args": [
        "-y",
        "@cagudelo/mcp-db-connect"
      ],
      "env": {
        "DB_TYPE": "mysql",
        "DB_HOST": "localhost",
        "DB_NAME": "test_db",
        "DB_USER": "root",
        "DB_PASSWORD": "mi_contraseña",
        "DB_PORT": "3306",
        "DB_SSL": "false"
      }
    },
    "postgresqldev": {
      "command": "npx",
      "args": [
        "-y",
        "@cagudelo/mcp-db-connect"
      ],
      "env": {
        "DB_TYPE": "postgresql",
        "DB_HOST": "localhost",
        "DB_NAME": "test_db",
        "DB_USER": "postgres",
        "DB_PASSWORD": "mi_contraseña",
        "DB_PORT": "5432",
        "DB_SSL": "true"
      }
    },
    "sqlitedev": {
      "command": "npx",
      "args": [
        "-y",
        "@cagudelo/mcp-db-connect"
      ],
      "env": {
        "DB_TYPE": "sqlite",
        "DB_PATH": "E:/Equipo/Documentos/GitHub/mcp-db-connect/test.db"
      }
    }
  }
}
```

#### Ventajas de usar `env` en la configuración del editor:

✅ **Configuración centralizada**: Todo en un solo archivo de configuración
✅ **Portabilidad**: Fácil de compartir entre equipos (sin credenciales reales)
✅ **Múltiples entornos**: Puedes tener configuraciones para dev, staging, production
✅ **Sin archivos externos**: No necesitas crear archivos `.env` separados
✅ **Control de versiones**: Puedes versionar la estructura (sin credenciales reales)
✅ **Fácil switching**: Cambiar entre configuraciones es solo cambiar el servidor MCP

#### Consideraciones de Seguridad:

⚠️ **IMPORTANTE**: Si usas esta configuración en un repositorio compartido:
1. **NUNCA incluyas contraseñas reales** en el control de versiones
2. **Usa contraseñas de ejemplo** o placeholders
3. **Documenta** qué valores deben ser reemplazados
4. **Considera usar variables de entorno del sistema** para credenciales sensibles

#### Ejemplo de Configuración Segura para Control de Versiones:

```json
{
  "mcpServers": {
    "sqlserver-template": {
      "command": "node",
      "args": [
        "E:/Equipo/Documentos/GitHub/mcp-db-connect/dist/index.js"
      ],
      "env": {
        "DB_TYPE": "sqlserver",
        "DB_HOST": "YOUR_SERVER_NAME",
        "DB_NAME": "YOUR_DATABASE_NAME",
        "DB_USER": "YOUR_USERNAME",
        "DB_PASSWORD": "YOUR_PASSWORD",
        "DB_PORT": "1433",
        "DB_INSTANCE": "YOUR_INSTANCE_NAME",
        "DB_TRUST_SERVER_CERTIFICATE": "true"
      }
    }
  }
}
```

#### Comparación de Métodos de Configuración:

| Método | Ventajas | Desventajas | Uso Recomendado |
|--------|----------|-------------|-----------------|
| **Variables de entorno (.env)** | ✅ Seguro, fácil de gestionar | ❌ Archivo separado | Producción, desarrollo individual |
| **Propiedad `env` en editor** | ✅ Centralizado, portable | ⚠️ Riesgo de commitear credenciales | Desarrollo en equipo, múltiples entornos |
| **Argumentos de línea de comandos** | ✅ Flexible, sin archivos | ❌ Difícil de gestionar, menos seguro | Pruebas rápidas, scripts |
| **Combinación híbrida** | ✅ Máxima flexibilidad | ❌ Puede ser confuso | Configuraciones complejas |

## Uso

### Comandos de Ayuda

**Ver versión:**
```bash
npm start -- --version
# o
npm start -- -v
```

**Ver ayuda completa:**
```bash
npm start -- --help
# o
npm start -- -h
```

### Ejecución del Servidor

**Con variables de entorno (recomendado):**
```bash
npm start
```

**Con argumentos de línea de comandos:**
```bash
npm start -- --sqlserver --host localhost --database test --user sa --password "tu_password"
```

## Herramientas Disponibles

| Herramienta | Descripción | Parámetros Requeridos |
|-------------|-------------|----------------------|
| `read_query` | Ejecutar consultas SELECT | `query`: Consulta SQL SELECT |
| `write_query` | Ejecutar consultas INSERT, UPDATE, DELETE, CREATE, ALTER, EXEC, CALL, SP_ | `query`: Consulta SQL de modificación |
| `create_table` | Crear nuevas tablas | `query`: Sentencia CREATE TABLE |
| `alter_table` | Modificar esquema de tablas | `query`: Sentencia ALTER TABLE |
| `drop_table` | Eliminar tablas | `table_name`: Nombre de la tabla<br>`confirm`: Bandera de seguridad |
| `export_query` | Exportar resultados | `query`: Consulta SQL SELECT<br>`format`: "csv" o "json" |
| `list_tables` | Listar todas las tablas | Ninguno |
| `list_procedures` | Listar todos los procedimientos almacenados | Ninguno |
| `describe_table` | Ver esquema de una tabla | `table_name`: Nombre de la tabla |
| `append_insight` | Agregar un insight de negocio | `insight`: Texto del insight |
| `list_insights` | Listar todos los insights de negocio | Ninguno |
| `list_views` | Listar todas las vistas (views) de la base de datos | Ninguno |
| `describe_view` | Ver la definición SQL de una vista específica | `view_name`: Nombre de la vista |
| `list_indexes` | Listar todos los índices o los de una tabla específica | `table_name` (opcional): Nombre de la tabla |
| `describe_index` | Ver la definición de un índice específico | `index_name`: Nombre del índice<br>`table_name` (opcional): Nombre de la tabla |
| `search_in_database` | Buscar un valor en todas las tablas y columnas de la base de datos | `search`: Valor a buscar |

## Desarrollo

Para ejecutar el servidor en modo desarrollo:

```bash
npm run dev
```

## Uso en el Editor: Opciones de Configuración

Puedes configurar el CLI en tu editor de diferentes maneras, según tus necesidades y preferencias:

### 🆕 Opción 1: Usar Variables de Entorno (.env) - RECOMENDADO

1. **Crea un archivo `.env`** en tu directorio de trabajo
2. **Configura tu editor** para usar solo el comando:

```json
"mysql": {
  "command": "node",
  "args": [
    "/ruta/absoluta/a/mcp-db-connect/dist/index.js"
  ]
}
```

**Ventajas:**
- ✅ Más seguro (contraseñas no en comandos)
- ✅ Fácil de gestionar múltiples configuraciones
- ✅ No hay riesgo de exponer credenciales en logs
- ✅ Configuración centralizada

### Opción 2: Usar el comando global

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

### Opción 3: Usar npx (sin instalación global)

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

- **🆕 Para usuarios finales o equipos:** Usa variables de entorno (.env) - más seguro y fácil de gestionar
- **Para usuarios avanzados:** Instala globalmente y usa el comando (`mcp-db-connect`)
- **Para pruebas rápidas:** Usa `npx @cagudelo/mcp-db-connect ...`
- **Para desarrollo local:** Usa la ruta directa al archivo

# Autenticación integrada de Windows (SQL Server)

Si deseas conectarte a SQL Server usando la cuenta de Windows que ejecuta el proceso (sin usuario ni contraseña), puedes habilitar la autenticación integrada:

## Configuración en `.env`:

```
DB_TYPE=sqlserver
DB_HOST=localhost
DB_NAME=NombreDeTuBase
DB_PORT=1433
DB_INSTANCE=SQLEXPRESS         # Opcional
DB_TRUST_SERVER_CERTIFICATE=true
DB_INTEGRATED_SECURITY=true    # <--- Habilita autenticación integrada
```

No incluyas `DB_USER` ni `DB_PASSWORD`.

## Configuración por línea de comandos:

```
mcp-db-connect --sqlserver --host localhost --database NombreDeTuBase --port 1433 --integratedSecurity true --trustServerCertificate true
```

No incluyas los flags `--user` ni `--password`.

## Notas:
- El proceso debe ejecutarse con un usuario de Windows que tenga permisos en SQL Server.
- Si usas una instancia nombrada, especifica `DB_INSTANCE` o `--instance`.
- Si necesitas un dominio específico, puedes ajustar la variable de entorno `USERDOMAIN` antes de ejecutar el proceso.

---






