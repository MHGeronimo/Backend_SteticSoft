// src/routes/estado.routes.js
const express = require("express");
const router = express.Router();
const estadoController = require("../controllers/estado.controller.js");
const estadoValidators = require("../validators/estado.validators.js");

// Middlewares de seguridad
const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

// Nombre del permiso de módulo para gestionar estados
const PERMISO_MODULO_ESTADOS = "MODULO_ESTADOS_GESTIONAR";

// POST /api/estados - Crear un nuevo estado
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ESTADOS),
  estadoValidators.crearEstadoValidators,
  estadoController.crearEstado
);

// GET /api/estados - Obtener todos los estados
router.get(
  "/",
  // Este endpoint podría ser accesible por más roles si solo es de lectura,
  // o incluso sin autenticación si los estados son información pública.
  // Por ahora, lo mantenemos protegido para consistencia.
  authMiddleware,
  checkPermission(PERMISO_MODULO_ESTADOS), // O un permiso más general como 'LEER_CONFIGURACIONES'
  estadoController.listarEstados
);

// GET /api/estados/:idEstado - Obtener un estado por ID
router.get(
  "/:idEstado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ESTADOS),
  estadoValidators.idEstadoValidator,
  estadoController.obtenerEstadoPorId
);

// PUT /api/estados/:idEstado - Actualizar (Editar) un estado por ID
router.put(
  "/:idEstado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ESTADOS),
  estadoValidators.actualizarEstadoValidators,
  estadoController.actualizarEstado
);

// DELETE /api/estados/:idEstado - Eliminar FÍSICAMENTE un estado por ID
// ¡Esta acción es destructiva y podría dejar FKs en NULL en Venta y Cita!
// El servicio tiene una validación para prevenirlo si está en uso.
router.delete(
  "/:idEstado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ESTADOS), // O un permiso más restrictivo
  estadoValidators.idEstadoValidator,
  estadoController.eliminarEstadoFisico
);

module.exports = router;
