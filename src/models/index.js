// src/models/index.js
"use strict";

// Importar la clase Sequelize y DataTypes del paquete
const { Sequelize, DataTypes } = require("sequelize");

// Importar la INSTANCIA de Sequelize configurada desde config/sequelize.config.js
const sequelize = require("../config/sequelize.config.js");

const db = {}; // Objeto que contendrá todos nuestros modelos

// 1. Verificar la instancia de Sequelize
if (sequelize && typeof sequelize.define === "function") {
  console.log(
    "✅ Instancia de Sequelize cargada correctamente en models/index.js."
  );
} else {
  console.error(
    "❌ ERROR CRÍTICO: La instancia de Sequelize NO se cargó correctamente en models/index.js o no es válida."
  );
  console.error(
    "Verifica la exportación en config/sequelize.config.js y la importación aquí."
  );
  process.exit(1); // Detener la aplicación si Sequelize no está bien
}

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
  "Especialidad",
  "EmpleadoEspecialidad",
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

nombresDeModelos.forEach((nombreModelo) => {
  // Asume que los archivos se llaman <NombreModelo>.model.js (ej. Rol.model.js)
  // y están en la misma carpeta que este index.js
  const funcionDefinicionModelo = require(`./${nombreModelo}.model.js`);
  const modelo = funcionDefinicionModelo(sequelize, DataTypes);
  db[modelo.name] = modelo; // Agrega el modelo al objeto db usando el nombre que Sequelize le da internamente
  console.log(`🔄 Modelo cargado: ${modelo.name}`);
});

// 3. Configurar asociaciones entre los modelos
// Es crucial que todos los modelos estén definidos y en `db` antes de llamar a `associate`.
Object.keys(db).forEach((nombreModelo) => {
  if (db[nombreModelo] && typeof db[nombreModelo].associate === "function") {
    db[nombreModelo].associate(db);
    console.log(`🤝 Asociaciones configuradas para el modelo: ${nombreModelo}`);
  }
});

// 4. Adjuntar la instancia de Sequelize y la clase Sequelize al objeto db
db.sequelize = sequelize; // La instancia configurada para consultas, transacciones, etc.
db.Sequelize = Sequelize; // La clase Sequelize (para Op, literal, DataTypes si se necesita fuera)

// 5. Exportar el objeto db
module.exports = db;
