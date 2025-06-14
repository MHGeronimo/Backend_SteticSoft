// src/routes/abastecimiento.routes.js
const express = require("express");
const router = express.Router();

// Importar el controlador de abastecimiento
const AbastecimientoController = require("../controllers/abastecimiento.controller");

// Importar los middlewares de autenticación y autorización
const authMiddleware = require("../middlewares/auth.middleware");
// CORRECCIÓN: Se desestructura para obtener la función `checkPermission` directamente.
const {
  checkPermission,
} = require("../middlewares/authorization.middleware");

// Importar el middleware que maneja los errores de validación
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");

// Importar los validadores específicos para abastecimiento
const {
  createAbastecimientoValidator,
  updateAbastecimientoValidator,
  idValidator,
  toggleEstadoValidator,
} = require("../validators/abastecimiento.validators");

// --- Definición de Rutas para Abastecimiento ---

// GET /api/abastecimientos - Obtener todos los registros
router.get(
  "/",
  authMiddleware,
  // CORRECCIÓN: Se usa `checkPermission` con el nombre del permiso como string.
  checkPermission("MODULO_ABASTECIMIENTO"),
  AbastecimientoController.listarAbastecimientos // Se cambia el nombre del controlador para que coincida
);

// GET /api/abastecimientos/:id - Obtener un registro por su ID
router.get(
  "/:id",
  authMiddleware,
  checkPermission("MODULO_ABASTECIMIENTO"),
  idValidator,
  handleValidationErrors, // Se usa el manejador de errores de validación
  AbastecimientoController.obtenerAbastecimientoPorId
);

// POST /api/abastecimientos - Crear un nuevo registro
router.post(
  "/",
  authMiddleware,
  checkPermission("MODULO_ABASTECIMIENTO"),
  createAbastecimientoValidator,
  handleValidationErrors,
  AbastecimientoController.crearAbastecimiento
);

// PUT /api/abastecimientos/:id - Actualizar un registro existente
router.put(
  "/:id",
  authMiddleware,
  checkPermission("MODULO_ABASTECIMIENTO"),
  updateAbastecimientoValidator,
  handleValidationErrors,
  AbastecimientoController.actualizarAbastecimiento
);

// PATCH /api/abastecimientos/:id/estado - Cambiar el estado (activar/desactivar)
router.patch(
  "/:id/estado",
  authMiddleware,
  checkPermission("MODULO_ABASTECIMIENTO"),
  toggleEstadoValidator,
  handleValidationErrors,
  AbastecimientoController.cambiarEstadoAbastecimiento
);

// DELETE /api/abastecimientos/:id - Eliminar un registro (soft delete o físico)
router.delete(
  "/:id",
  authMiddleware,
  checkPermission("MODULO_ABASTECIMIENTO"),
  idValidator,
  handleValidationErrors,
  AbastecimientoController.eliminarAbastecimientoFisico
);

module.exports = router;