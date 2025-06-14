// src/routes/abastecimiento.routes.js
const express = require("express");
const router = express.Router();

// Importar el controlador de abastecimiento
const AbastecimientoController = require("../controllers/abastecimiento.controller");

// Importar los middlewares
const authMiddleware = require("../middlewares/auth.middleware");
const { checkPermission } = require("../middlewares/authorization.middleware");
const { handleValidationErrors } = require("../middlewares/validation.middleware.js");

// Importar los validadores
const {
  createAbastecimientoValidator,
  updateAbastecimientoValidator,
  idValidator,
  toggleEstadoValidator,
} = require("../validators/abastecimiento.validators");


// --- CORRECCIÓN CLAVE ---
// El nombre del permiso ahora coincide con el de tu base de datos.
const PERMISO_GESTION = 'MODULO_ABASTECIMIENTOS_GESTIONAR';


// GET /api/abastecimientos - Obtener todos los registros
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_GESTION), // CORRECCIÓN
  AbastecimientoController.listarAbastecimientos
);

// GET /api/abastecimientos/:id - Obtener un registro por su ID
router.get(
  "/:id",
  authMiddleware,
  checkPermission(PERMISO_GESTION), // CORRECCIÓN
  idValidator,
  handleValidationErrors,
  AbastecimientoController.obtenerAbastecimientoPorId
);

// POST /api/abastecimientos - Crear un nuevo registro
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_GESTION), // CORRECCIÓN
  createAbastecimientoValidator,
  handleValidationErrors,
  AbastecimientoController.crearAbastecimiento
);

// PUT /api/abastecimientos/:id - Actualizar un registro existente
router.put(
  "/:id",
  authMiddleware,
  checkPermission(PERMISO_GESTION), // CORRECCIÓN
  updateAbastecimientoValidator,
  handleValidationErrors,
  AbastecimientoController.actualizarAbastecimiento
);

// PATCH /api/abastecimientos/:id/estado - Cambiar el estado (activar/desactivar)
router.patch(
  "/:id/estado",
  authMiddleware,
  checkPermission(PERMISO_GESTION), // CORRECCIÓN
  toggleEstadoValidator,
  handleValidationErrors,
  AbastecimientoController.cambiarEstadoAbastecimiento
);

// DELETE /api/abastecimientos/:id - Eliminar un registro (físico)
router.delete(
  "/:id",
  authMiddleware,
  checkPermission(PERMISO_GESTION), // CORRECCIÓN
  idValidator,
  handleValidationErrors,
  AbastecimientoController.eliminarAbastecimientoFisico
);

module.exports = router;