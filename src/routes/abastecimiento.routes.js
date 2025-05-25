// src/routes/abastecimiento.routes.js
const express = require("express");
const router = express.Router();
const abastecimientoController = require("../controllers/abastecimiento.controller.js");
const abastecimientoValidators = require("../validators/abastecimiento.validators.js");

// Middlewares de seguridad
const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

// Nombre del permiso de módulo para gestionar abastecimientos
const PERMISO_MODULO_ABASTECIMIENTOS = "MODULO_ABASTECIMIENTOS_GESTIONAR";

// POST /api/abastecimientos - Crear un nuevo registro de abastecimiento
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ABASTECIMIENTOS),
  abastecimientoValidators.crearAbastecimientoValidators,
  abastecimientoController.crearAbastecimiento
);

// GET /api/abastecimientos - Obtener todos los registros de abastecimiento
// Permite filtrar por query params, ej. ?productoId=1&estado=true
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ABASTECIMIENTOS), // O un permiso más general de lectura
  abastecimientoController.listarAbastecimientos
);

// GET /api/abastecimientos/:idAbastecimiento - Obtener un registro de abastecimiento por ID
router.get(
  "/:idAbastecimiento",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ABASTECIMIENTOS), // O un permiso más específico de solo lectura
  abastecimientoValidators.idAbastecimientoValidator,
  abastecimientoController.obtenerAbastecimientoPorId
);

// PUT /api/abastecimientos/:idAbastecimiento - Actualizar un registro de abastecimiento por ID
router.put(
  "/:idAbastecimiento",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ABASTECIMIENTOS),
  abastecimientoValidators.actualizarAbastecimientoValidators,
  abastecimientoController.actualizarAbastecimiento
);

// PATCH /api/abastecimientos/:idAbastecimiento/anular - Anular un registro de abastecimiento
router.patch(
  "/:idAbastecimiento/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ABASTECIMIENTOS),
  abastecimientoValidators.idAbastecimientoValidator, // Solo se necesita el ID
  abastecimientoController.anularAbastecimiento
);

// PATCH /api/abastecimientos/:idAbastecimiento/habilitar - Habilitar un registro de abastecimiento
router.patch(
  "/:idAbastecimiento/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ABASTECIMIENTOS),
  abastecimientoValidators.idAbastecimientoValidator, // Solo se necesita el ID
  abastecimientoController.habilitarAbastecimiento
);

// DELETE /api/abastecimientos/:idAbastecimiento - Eliminar FÍSICAMENTE un registro de abastecimiento
// ¡Esta acción es destructiva y ajusta inventario si el registro estaba activo!
router.delete(
  "/:idAbastecimiento",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ABASTECIMIENTOS), // O un permiso aún más restrictivo
  abastecimientoValidators.idAbastecimientoValidator,
  abastecimientoController.eliminarAbastecimientoFisico
);

module.exports = router;
