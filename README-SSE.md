# Servidor MCP SSE (Server-Sent Events)

Este es el servidor MCP que utiliza Server-Sent Events (SSE) para comunicación en tiempo real con bases de datos.

## 🚀 Características

- **Comunicación en tiempo real** usando Server-Sent Events
- **Soporte para múltiples bases de datos**: MySQL, SQL Server, PostgreSQL, SQLite
- **Configuración flexible** mediante variables de entorno o argumentos de línea de comandos
- **Herramientas MCP organizadas** en módulos separados
- **Validación automática** de configuración
- **Mensajes de error claros** y ayuda integrada

## 📋 Requisitos

- Node.js >= 18.0.0
- Base de datos compatible (MySQL, SQL Server, PostgreSQL, o SQLite)

## 🛠️ Instalación

1. **Clona el repositorio**:
   ```bash
   git clone <tu-repositorio>
   cd mcp-db-connect
   ```

2. **Instala las dependencias**:
   ```bash
   npm install
   ```

3. **Compila el proyecto**:
   ```bash
   npm run build
   ```

## ⚙️ Configuración

### Opción 1: Variables de Entorno (Recomendado)

Crea un archivo `.env` en la raíz del proyecto:

```env
# Tipo de base de datos
DB_TYPE=sqlserver

# Configuración de conexión
DB_HOST=localhost
DB_NAME=test
DB_USER=sa
DB_PASSWORD=tu_contraseña
DB_PORT=1433

# Configuración específica para SQL Server
DB_INSTANCE=SQLEXPRESS
DB_TRUST_SERVER_CERTIFICATE=true
```

### Opción 2: Argumentos de Línea de Comandos

```bash
# SQL Server
npm run start:sse -- --sqlserver --host localhost --database test --user sa --password "tu_password" --instance SQLEXPRESS

# MySQL
npm run start:sse -- --mysql --host localhost --database test --user root --password "tu_password" --port 3306

# PostgreSQL
npm run start:sse -- --postgresql --host localhost --database test --user postgres --password "tu_password" --port 5432

# SQLite
npm run start:sse -- --sqlite --path /ruta/a/tu/base.db
```

## 🚀 Uso

### Desarrollo

```bash
# Servidor SSE en modo desarrollo
npm run dev:sse
```

### Producción

```bash
# Servidor SSE compilado
npm run start:sse
```

### Ayuda

```bash
# Mostrar ayuda y opciones disponibles
npm run start:sse -- --help
```

## 🌐 Endpoints

El servidor SSE expone los siguientes endpoints:

- **`GET /sse`**: Establece conexión SSE para comunicación en tiempo real
- **`POST /message`**: Recibe mensajes MCP (herramientas, recursos, etc.)

### Puerto por defecto: 3001

Puedes cambiar el puerto usando la variable de entorno `PORT`:

```env
PORT=3002
```

## 🔧 Configuración por Tipo de Base de Datos

### SQL Server

```env
DB_TYPE=sqlserver
DB_HOST=localhost
DB_NAME=test
DB_USER=sa
DB_PASSWORD=tu_password
DB_PORT=1433
DB_INSTANCE=SQLEXPRESS
DB_TRUST_SERVER_CERTIFICATE=true
```

### MySQL

```env
DB_TYPE=mysql
DB_HOST=localhost
DB_NAME=test
DB_USER=root
DB_PASSWORD=tu_password
DB_PORT=3306
DB_SSL=false
```

### PostgreSQL

```env
DB_TYPE=postgresql
DB_HOST=localhost
DB_NAME=test
DB_USER=postgres
DB_PASSWORD=tu_password
DB_PORT=5432
DB_SSL=false
```

### SQLite

```env
DB_TYPE=sqlite
DB_PATH=/ruta/completa/a/tu/base.db
```

## 🧪 Pruebas

### Probar conexión SSE

```bash
# Conectar al endpoint SSE
curl -N http://localhost:3001/sse
```

### Probar herramienta MCP

```bash
# Llamar a una herramienta
curl -X POST http://localhost:3001/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "call_tool",
    "params": {
      "name": "hello_world",
      "arguments": {}
    }
  }'
```

## 🛠️ Herramientas Disponibles

El servidor incluye todas las herramientas MCP organizadas en módulos:

- **Base de datos**: Consultas, creación de tablas, gestión de esquemas
- **Sistema**: Información del servidor, ping, ayuda
- **Ejemplo**: Herramientas de demostración

## 🔍 Solución de Problemas

### Error: "Tipo de base de datos no especificado"

1. Verifica que `DB_TYPE` esté configurado en tu archivo `.env`
2. O usa argumentos de línea de comandos: `--sqlserver`, `--mysql`, etc.

### Error: "Campo requerido faltante"

1. Revisa que todos los campos obligatorios estén configurados
2. Para SQL Server: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
3. Para MySQL/PostgreSQL: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
4. Para SQLite: `DB_PATH`

### Error de conexión a la base de datos

1. Verifica que la base de datos esté ejecutándose
2. Confirma credenciales y permisos
3. Verifica firewall y configuración de red

## 📚 Recursos Adicionales

- [README principal](../README.md) - Documentación general del proyecto
- [Estructura de herramientas](../src/tools/README.md) - Cómo organizar herramientas MCP
- [Protocolo MCP](https://modelcontextprotocol.io/) - Documentación oficial del protocolo

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](../LICENSE) para detalles.

## 👨‍💻 Autor

**Camilo Andres Agudelo**
- Email: andres18160@gmail.com
- Website: www.cagudelo.com
- GitHub: [@cagudelo](https://github.com/cagudelo)
