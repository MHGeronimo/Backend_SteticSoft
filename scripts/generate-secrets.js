#!/usr/bin/env node

/**
 * Script para generar valores aleatorios seguros para JWT_SECRET y SESSION_SECRET
 * Estos valores se pueden usar en Render.com como valores aleatorios
 */

const crypto = require('crypto');

console.log('🔐 Generando valores aleatorios seguros...\n');

// Generar JWT_SECRET (32 bytes en base64)
const jwtSecret = crypto.randomBytes(32).toString('base64');
console.log('JWT_SECRET:');
console.log(jwtSecret);
console.log('');

// Generar SESSION_SECRET (32 bytes en hex)
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('SESSION_SECRET:');
console.log(sessionSecret);
console.log('');

// Generar valores adicionales que podrían ser útiles
const apiKey = crypto.randomBytes(16).toString('hex');
const encryptionKey = crypto.randomBytes(32).toString('base64');

console.log('🔑 Valores adicionales generados:');
console.log('API_KEY:', apiKey);
console.log('ENCRYPTION_KEY:', encryptionKey);
console.log('');

console.log('📋 Para usar en Render.com:');
console.log('1. Ve a tu servicio web en Render');
console.log('2. Ve a la sección "Environment"');
console.log('3. Agrega estas variables:');
console.log(`   JWT_SECRET = ${jwtSecret}`);
console.log(`   SESSION_SECRET = ${sessionSecret}`);
console.log('');

console.log('⚠️  IMPORTANTE:');
console.log('- Guarda estos valores de forma segura');
console.log('- No los compartas en repositorios públicos');
console.log('- Si cambias estos valores, todos los usuarios tendrán que volver a autenticarse');
console.log('');

console.log('✅ Valores generados exitosamente');
