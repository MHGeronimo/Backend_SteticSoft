// src/routes/abastecimiento.routes.js
const express = require("express");
const router = express.Router();
 
// Importar el controlador de abastecimiento
const AbastecimientoController = require("../controllers/abastecimiento.controller");

// Importar los middlewares
const authMiddleware = require("../middlewares/auth.middleware");
const { checkPermission } = require("../middlewares/authorization.middleware");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");

// Importar los validadores
const {
  createAbastecimientoValidator,
  updateAbastecimientoValidator,
  idValidator,
  toggleEstadoValidator,
  agotarAbastecimientoValidators, // Importar el nuevo validador
} = require("../validators/abastecimiento.validators");

const PERMISO_GESTION = "MODULO_ABASTECIMIENTOS_GESTIONAR";

// GET /api/abastecimientos
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_GESTION),
  AbastecimientoController.listarAbastecimientos
);

// El resto del archivo se mantiene igual...
router.get(
  "/:id",
  authMiddleware,
  checkPermission(PERMISO_GESTION),
  idValidator,
  handleValidationErrors,
  AbastecimientoController.obtenerAbastecimientoPorId
);

router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_GESTION),
  createAbastecimientoValidator,
  handleValidationErrors,
  AbastecimientoController.crearAbastecimiento
);

router.put(
  "/:id",
  authMiddleware,
  checkPermission(PERMISO_GESTION),
  updateAbastecimientoValidator,
  handleValidationErrors,
  AbastecimientoController.actualizarAbastecimiento
);

router.patch(
  "/:id/estado",
  authMiddleware,
  checkPermission(PERMISO_GESTION),
  toggleEstadoValidator,
  handleValidationErrors,
  AbastecimientoController.cambiarEstadoAbastecimiento
);

router.delete(
  "/:id",
  authMiddleware,
  checkPermission(PERMISO_GESTION),
  idValidator,
  handleValidationErrors,
  AbastecimientoController.eliminarAbastecimientoFisico
);

// Ruta para marcar un abastecimiento como agotado
router.patch(
  "/:id/agotar",
  authMiddleware,
  checkPermission(PERMISO_GESTION), // Usando PERMISO_GESTION según lo decidido
  agotarAbastecimientoValidators, // Referencia directa al validador importado
  handleValidationErrors,
  AbastecimientoController.agotarAbastecimiento
);

module.exports = router;
