// src/routes/abastecimiento.routes.js
const express = require("express");
const router = express.Router();

// Importar el controlador y los middlewares/validators
const AbastecimientoController = require("../controllers/abastecimiento.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { checkPermission } = require("../middlewares/authorization.middleware");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const {
  createAbastecimientoValidator,
  updateAbastecimientoValidator,
  idValidator,
  toggleEstadoValidator,
} = require("../validators/abastecimiento.validators");

const PERMISO_GESTION = "MODULO_ABASTECIMIENTOS_GESTIONAR";

// --- RUTAS SINCRONIZADAS ---

// GET /api/abastecimientos
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_GESTION),
  AbastecimientoController.listarAbastecimientos // Coincide con el export del controller
);

// GET /api/abastecimientos/:id
router.get(
  "/:id",
  authMiddleware,
  checkPermission(PERMISO_GESTION),
  idValidator,
  handleValidationErrors,
  AbastecimientoController.obtenerAbastecimientoPorId // Coincide
);

// POST /api/abastecimientos
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_GESTION),
  createAbastecimientoValidator,
  handleValidationErrors,
  AbastecimientoController.crearAbastecimiento // Coincide
);

// PUT /api/abastecimientos/:id
router.put(
  "/:id",
  authMiddleware,
  checkPermission(PERMISO_GESTION),
  updateAbastecimientoValidator,
  handleValidationErrors,
  AbastecimientoController.actualizarAbastecimiento // Coincide
);

// PATCH /api/abastecimientos/:id/estado
router.patch(
  "/:id/estado",
  authMiddleware,
  checkPermission(PERMISO_GESTION),
  toggleEstadoValidator,
  handleValidationErrors,
  AbastecimientoController.cambiarEstadoAbastecimiento // Coincide
);

// DELETE /api/abastecimientos/:id
router.delete(
  "/:id",
  authMiddleware,
  checkPermission(PERMISO_GESTION),
  idValidator,
  handleValidationErrors,
  AbastecimientoController.eliminarAbastecimientoFisico // Coincide
);

module.exports = router;
