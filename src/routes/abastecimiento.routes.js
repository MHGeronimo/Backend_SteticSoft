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
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ABASTECIMIENTOS),
  abastecimientoController.listarAbastecimientos
);

// GET /api/abastecimientos/:idAbastecimiento - Obtener un registro de abastecimiento por ID
router.get(
  "/:idAbastecimiento",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ABASTECIMIENTOS),
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

// NUEVA RUTA: Cambiar el estado de un abastecimiento
router.patch(
  "/:idAbastecimiento/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ABASTECIMIENTOS),
  abastecimientoValidators.cambiarEstadoAbastecimientoValidators,
  abastecimientoController.cambiarEstadoAbastecimiento
);

// PATCH /api/abastecimientos/:idAbastecimiento/anular - Anular un registro de abastecimiento
router.patch(
  "/:idAbastecimiento/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ABASTECIMIENTOS),
  abastecimientoValidators.idAbastecimientoValidator,
  abastecimientoController.anularAbastecimiento
);

// PATCH /api/abastecimientos/:idAbastecimiento/habilitar - Habilitar un registro de abastecimiento
router.patch(
  "/:idAbastecimiento/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ABASTECIMIENTOS),
  abastecimientoValidators.idAbastecimientoValidator,
  abastecimientoController.habilitarAbastecimiento
);

// DELETE /api/abastecimientos/:idAbastecimiento - Eliminar FÍSICAMENTE un registro de abastecimiento
router.delete(
  "/:idAbastecimiento",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ABASTECIMIENTOS),
  abastecimientoValidators.idAbastecimientoValidator,
  abastecimientoController.eliminarAbastecimientoFisico
);

module.exports = router;
