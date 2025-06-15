#!/usr/bin/env pwsh

# Script de PowerShell para solucionar problemas de módulos ES en Windows
Write-Host "🪟 Solucionando problema de módulos ES en Windows..." -ForegroundColor Cyan
Write-Host ""

# Limpiar instalación anterior
Write-Host "🧹 Limpiando instalación anterior..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "✅ node_modules eliminado" -ForegroundColor Green
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "✅ package-lock.json eliminado" -ForegroundColor Green
}

if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ dist eliminado" -ForegroundColor Green
}

Write-Host ""

# Reinstalar dependencias
Write-Host "📦 Reinstalando dependencias..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✅ Dependencias instaladas correctamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al instalar dependencias: $_" -ForegroundColor Red
    Read-Host "Presiona Enter para continuar"
    exit 1
}

Write-Host ""

# Compilar proyecto
Write-Host "🔨 Compilando proyecto..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✅ Proyecto compilado correctamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al compilar: $_" -ForegroundColor Red
    Read-Host "Presiona Enter para continuar"
    exit 1
}

Write-Host ""

# Verificar instalación
Write-Host "🔍 Verificando instalación..." -ForegroundColor Yellow
if (Test-Path "dist\index.js") {
    Write-Host "✅ Archivo principal encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ Archivo principal no encontrado" -ForegroundColor Red
    Read-Host "Presiona Enter para continuar"
    exit 1
}

Write-Host ""
Write-Host "🎉 ¡Problema solucionado!" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora puedes usar:" -ForegroundColor Cyan
Write-Host "mcp-db-connect --help" -ForegroundColor White
Write-Host ""
Write-Host "O probar la conexión:" -ForegroundColor Cyan
Write-Host "mcp-db-connect --sqlserver --host ROCKA --database db_test --port 1433 --user sa --password 12345 --trustServerCertificate true" -ForegroundColor White
Write-Host ""
Read-Host "Presiona Enter para continuar"