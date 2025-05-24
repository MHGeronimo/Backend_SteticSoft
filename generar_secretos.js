// generar_secretos.js
const crypto = require("crypto");

// Generar un secreto para JWT (32 bytes = 64 caracteres hexadecimales)
const jwtSecret = crypto.randomBytes(32).toString("hex");

// Generar un secreto para Sesiones (32 bytes = 64 caracteres hexadecimales)
const sessionSecret = crypto.randomBytes(32).toString("hex");

console.log("Copia y pega estas líneas en tu archivo .env:");
console.log("---------------------------------------------");
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log("---------------------------------------------");
console.log("Recuerda no subir tu archivo .env a Git.");
