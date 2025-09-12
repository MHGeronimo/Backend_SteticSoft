#!/usr/bin/env node

/**
 * Script para limpiar y reorganizar las migraciones
 * Este script elimina migraciones huérfanas y reorganiza el directorio
 */

const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '..', 'migrations');

// Lista de migraciones que deben existir según el esquema actual
const requiredMigrations = [
  '20250615054301-create-rol.js',
  '20250615054320-create-permisos.js',
  '20250615054338-create-dashboard.js',
  '20250615054357-create-estado.js',
  '20250615054418-create-especialidad.js',
  '20250615054437-create-proveedor.js',
  '20250615054457-create-categoria-producto.js',
  '20250615054517-create-categoria-servicio.js',
  '20250615054552-create-usuario.js',
  '20250615054615-create-permisos-rol.js',
  '20250615054638-create-producto.js',
  '20250615054701-create-servicio.js',
  '20250615054737-create-cliente.js',
  '20250615054800-create-empleado.js',
  '20250615054823-create-token-recuperacion.js',
  '20250615054908-create-compra.js',
  '20250615054949-create-empleado-especialidad.js',
  '20250615055015-create-novedades.js',
  '20250615055043-create-abastecimiento.js',
  '20250615055110-create-cita.js',
  '20250615055138-create-venta.js',
  '20250615055225-create-compra-producto.js',
  '20250615055254-create-servicio-cita.js',
  '20250615055323-create-producto-venta.js',
  '20250615055352-create-venta-servicio.js',
  '20231110100000-add-tipoperfil-to-rol-and-adjust-nombre.js',
  '20240729100000-add-vida-util-tipo-uso-to-producto.js',
  '20250115000000-add-imagen-public-id-to-producto-and-servicio.js',
  '20250115000001-add-missing-permission-modulo-ventas-cliente.js',
  '20250905194746-modify-abastecimiento-add-usuario-relation.js',
  '20250910020813-modify-cita-table.js'
];

console.log('🧹 Limpiando migraciones...');

// Leer archivos en el directorio de migraciones
const files = fs.readdirSync(migrationsDir);

// Filtrar solo archivos .js (excluir .md)
const migrationFiles = files.filter(file => file.endsWith('.js'));

console.log(`📁 Encontrados ${migrationFiles.length} archivos de migración`);

// Verificar que todas las migraciones requeridas existan
const missingMigrations = requiredMigrations.filter(migration => 
  !migrationFiles.includes(migration)
);

if (missingMigrations.length > 0) {
  console.log('❌ Migraciones faltantes:');
  missingMigrations.forEach(migration => console.log(`   - ${migration}`));
} else {
  console.log('✅ Todas las migraciones requeridas están presentes');
}

// Verificar migraciones extra
const extraMigrations = migrationFiles.filter(file => 
  !requiredMigrations.includes(file)
);

if (extraMigrations.length > 0) {
  console.log('⚠️  Migraciones extra encontradas:');
  extraMigrations.forEach(migration => console.log(`   - ${migration}`));
} else {
  console.log('✅ No hay migraciones extra');
}

console.log('\n📋 Resumen:');
console.log(`   - Migraciones requeridas: ${requiredMigrations.length}`);
console.log(`   - Migraciones encontradas: ${migrationFiles.length}`);
console.log(`   - Migraciones faltantes: ${missingMigrations.length}`);
console.log(`   - Migraciones extra: ${extraMigrations.length}`);

console.log('\n✅ Limpieza completada');
