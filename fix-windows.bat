@echo off
echo 🪟 Solucionando problema de modulos ES en Windows...
echo.

REM Limpiar instalacion anterior
echo 🧹 Limpiando instalacion anterior...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist dist rmdir /s /q dist
echo ✅ Limpieza completada
echo.

REM Reinstalar dependencias
echo 📦 Reinstalando dependencias...
npm install
if %errorlevel% neq 0 (
    echo ❌ Error al instalar dependencias
    pause
    exit /b 1
)
echo ✅ Dependencias instaladas
echo.

REM Compilar proyecto
echo 🔨 Compilando proyecto...
npm run build
if %errorlevel% neq 0 (
    echo ❌ Error al compilar
    pause
    exit /b 1
)
echo ✅ Proyecto compilado
echo.

REM Verificar instalacion
echo 🔍 Verificando instalacion...
if exist dist\index.js (
    echo ✅ Archivo principal encontrado
) else (
    echo ❌ Archivo principal no encontrado
    pause
    exit /b 1
)

echo.
echo 🎉 ¡Problema solucionado!
echo.
echo Ahora puedes usar:
echo mcp-db-connect --help
echo.
echo O probar la conexion:
echo mcp-db-connect --sqlserver --host ROCKA --database db_test --port 1433 --user sa --password 12345 --trustServerCertificate true
echo.
pause 