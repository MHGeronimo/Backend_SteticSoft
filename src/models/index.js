// src/models/index.js
"use strict";

// Importar la clase Sequelize y DataTypes del paquete
const { Sequelize, DataTypes } = require("sequelize");

// Importar la INSTANCIA de Sequelize configurada desde config/sequelize.config.js
const sequelize = require("../config/sequelize.config.js");

console.log("\n============================================================");
console.log("🚀 INICIANDO MÓDULO DE SINCRONIZACIÓN DE MODELOS (models/index.js)");
console.log("============================================================\n");


const db = {}; // Objeto que contendrá todos nuestros modelos

// 1. Verificar la instancia de Sequelize
console.log("--- 🔍 Fase 1: Verificando instancia de Sequelize ---");
if (sequelize && typeof sequelize.define === "function") {
  console.log(
    "✅ Instancia de Sequelize cargada correctamente."
  );
} else {
  console.error(
    "❌ ERROR CRÍTICO: La instancia de Sequelize NO se cargó correctamente o no es válida."
  );
  console.error(
    "Verifica la exportación en 'config/sequelize.config.js' y la importación aquí."
  );
  process.exit(1); // Detener la aplicación si Sequelize no está bien
}
console.log("----------------------------------------------------\n");


// 2. Cargar todos los modelos explícitamente
// Cada archivo .model.js debe exportar una función que toma (sequelize, DataTypes)
// y devuelve el modelo definido.
const nombresDeModelos = [
  // Renombrado a plural para más claridad
  "Rol",
  "Permisos",
  "PermisosXRol",
  "Usuario",
  "Dashboard",
  "Estado",
  "Cliente",
  "Empleado", 
  // "Especialidad", // DEPRECADO
  // "EmpleadoEspecialidad", // DEPRECADO
  "Proveedor",
  "CategoriaProducto",
  "CategoriaServicio",
  "Producto",
  "Compra",
  "Venta",
  "Cita",
  "Servicio",
  "ServicioXCita",
  "CompraXProducto",
  "ProductoXVenta",
  "VentaXServicio",
  "Abastecimiento",
  "Novedades",
  "TokenRecuperacion",
];

// Inicia un bloque visual para la carga de modelos
console.log("--- 📝 Fase 2: Cargando definiciones de modelos ---");
console.group("Detalles de Carga de Modelos");

nombresDeModelos.forEach((nombreModelo) => {
  console.log(`⚙️  Cargando: ./${nombreModelo}.model.js`);
  const funcionDefinicionModelo = require(`./${nombreModelo}.model.js`);
  const modelo = funcionDefinicionModelo(sequelize, DataTypes);
  db[modelo.name] = modelo;
  console.log(`✔️   Modelo '${modelo.name}' registrado.`);
});

console.groupEnd();
console.log(`✅ ${Object.keys(db).length} modelos cargados y registrados exitosamente.`);
console.log("----------------------------------------------------\n");


// 3. Configurar asociaciones entre los modelos
console.log("--- 🔗 Fase 3: Configurando asociaciones ---");
console.group("Detalles de Configuración de Asociaciones");

Object.keys(db).forEach((nombreModelo) => {
  if (db[nombreModelo] && typeof db[nombreModelo].associate === "function") {
    db[nombreModelo].associate(db);
    console.log(`🤝 Asociaciones configuradas para: ${nombreModelo}`);
  } else {
    console.log(`⚪️ El modelo '${nombreModelo}' no tiene asociaciones para configurar.`);
  }
});

console.groupEnd();
console.log("✅ Todas las asociaciones han sido configuradas.");
console.log("----------------------------------------------------\n");


// 4. Adjuntar la instancia de Sequelize y la clase Sequelize al objeto db
console.log("--- 🧩 Fase 4: Finalizando el objeto 'db' ---");
db.sequelize = sequelize; // La instancia configurada
db.Sequelize = Sequelize; // La clase Sequelize
console.log("📦 Instancia y clase de Sequelize adjuntadas al objeto 'db' para exportación.");
console.log("----------------------------------------------------\n");


// 5. Exportar el objeto db
module.exports = db;

console.log("============================================================");
console.log("🎉 MÓDULO DE MODELOS LISTO Y EXPORTADO.");
console.log("============================================================\n");
