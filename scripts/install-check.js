#!/usr/bin/env node

/**
 * Script de verificación de instalación para mcp-db-connect
 * Verifica que todas las dependencias estén correctamente instaladas
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔍 Verificando instalación de mcp-db-connect...\n');

// Verificar archivos principales
const requiredFiles = [
  'dist/index.js',
  'dist/index.d.ts',
  'package.json'
];

let allFilesExist = true;

for (const file of requiredFiles) {
  const filePath = join(projectRoot, file);
  if (existsSync(filePath)) {
    console.log(`✅ ${file} - OK`);
  } else {
    console.log(`❌ ${file} - FALTA`);
    allFilesExist = false;
  }
}

// Verificar dependencias críticas
console.log('\n🔍 Verificando dependencias críticas...\n');

const criticalDeps = [
  '@modelcontextprotocol/sdk',
  'minimist',
  'mssql',
  'mysql2',
  'pg',
  'sqlite3'
];

for (const dep of criticalDeps) {
  try {
    await import(dep);
    console.log(`✅ ${dep} - OK`);
  } catch (error) {
    console.log(`❌ ${dep} - ERROR: ${error.message}`);
    allFilesExist = false;
  }
}

if (allFilesExist) {
  console.log('\n🎉 ¡Instalación verificada correctamente!');
  console.log('\nPuedes usar el comando:');
  console.log('mcp-db-connect --help');
} else {
  console.log('\n⚠️  Hay problemas con la instalación.');
  console.log('\nIntenta ejecutar:');
  console.log('npm install');
  console.log('npm run build');
  process.exit(1);
} 