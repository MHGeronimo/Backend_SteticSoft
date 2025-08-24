// src/routes/servicio.routes.js
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const servicioController = require("../controllers/servicio.controller.js");
const servicioValidators = require("../validators/servicio.validators.js");

const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_SERVICIOS = "MODULO_SERVICIOS_GESTIONAR";

// --- CONFIGURACIÓN DE MULTER (YA ESTÁ CORRECTA) ---

// 1. Define la ruta de destino de forma robusta
const uploadDir = path.join(__dirname, "..", "..", "uploads", "servicios");

// 2. Se asegura de que el directorio exista en el servidor
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 3. Define el almacenamiento: destino y nombre de archivo único
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Genera un nombre de archivo único para evitar colisiones
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });


// --- RUTAS DE LA API ---

// Crear un nuevo servicio (acepta un archivo 'imagen' opcional)
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  upload.single("imagen"), // Procesa el archivo si se envía
  servicioValidators.crearServicioValidators,
  servicioController.crearServicio
);

// Listar todos los servicios
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioController.listarServicios
);

// Obtener un servicio por ID
router.get(
  "/:idServicio",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.idServicioValidator,
  servicioController.obtenerServicioPorId
);

// Actualizar un servicio (acepta un archivo 'imagen' opcional)
// MODIFICADO: Se usa PATCH para actualizaciones parciales, es una mejor práctica.
router.patch(
  "/:idServicio",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  upload.single("imagen"), // Procesa el archivo si se envía
  servicioValidators.actualizarServicioValidators,
  servicioController.actualizarServicio
);

// Cambiar el estado de un servicio
router.patch(
  "/:idServicio/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.cambiarEstadoServicioValidators,
  servicioController.cambiarEstadoServicio
);

// Eliminar un servicio
router.delete(
  "/:idServicio",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.idServicioValidator,
  servicioController.eliminarServicioFisico
);

module.exports = router;