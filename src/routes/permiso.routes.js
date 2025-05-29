// src/routes/permiso.routes.js
const express = require("express");
const router = express.Router();
const permisoController = require("../controllers/permiso.controller.js");
const permisoValidators = require("../validators/permiso.validators.js");

const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_PERMISOS = "MODULO_PERMISOS_GESTIONAR";

router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PERMISOS),
  permisoValidators.crearPermisoValidators,
  permisoController.crearPermiso
);

router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PERMISOS),
  permisoController.listarPermisos
);

router.get(
  "/:idPermiso",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PERMISOS),
  permisoValidators.idPermisoValidator,
  permisoController.obtenerPermisoPorId
);

router.put(
  "/:idPermiso",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PERMISOS),
  permisoValidators.actualizarPermisoValidators,
  permisoController.actualizarPermiso
);

// NUEVA RUTA: Cambiar el estado de un permiso
router.patch(
  "/:idPermiso/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PERMISOS),
  permisoValidators.cambiarEstadoPermisoValidators,
  permisoController.cambiarEstadoPermiso
);

router.patch(
  "/:idPermiso/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PERMISOS),
  permisoValidators.idPermisoValidator,
  permisoController.anularPermiso
);

router.patch(
  "/:idPermiso/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PERMISOS),
  permisoValidators.idPermisoValidator,
  permisoController.habilitarPermiso
);

router.delete(
  "/:idPermiso",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PERMISOS),
  permisoValidators.idPermisoValidator,
  permisoController.eliminarPermisoFisico
);

module.exports = router;
