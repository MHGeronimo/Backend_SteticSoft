#!/usr/bin/env node

/**
 * Script para probar la inicialización del sistema
 * Este script verifica que todos los componentes se carguen correctamente
 */

const SimpleSystemInitializer = require('../src/utils/simple-system-initializer');

console.log('🧪 Iniciando prueba del sistema de inicialización...\n');

async function testSystemInitialization() {
  try {
    const initializer = new SimpleSystemInitializer();
    await initializer.initializeSystem();
    
    console.log('\n🎉 ¡Prueba completada exitosamente!');
    console.log('✅ Todos los componentes del sistema se cargaron correctamente');
    
  } catch (error) {
    console.error('\n❌ Error durante la prueba del sistema:');
    console.error(error.message);
    process.exit(1);
  }
}

// Ejecutar la prueba
testSystemInitialization();
