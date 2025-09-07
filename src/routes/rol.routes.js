// src/routes/rol.routes.js
const express = require("express");
const router = express.Router();
const rolController = require("../controllers/rol.controller.js");
const rolValidators = require("../validators/rol.validators.js");

const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_GESTIONAR_ROLES = "MODULO_ROLES_GESTIONAR";
const PERMISO_ASIGNAR_PERMISOS_A_ROL = "MODULO_ROLES_ASIGNAR_PERMISOS";

router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_GESTIONAR_ROLES),
  rolValidators.crearRolValidators,
  rolController.crearRol
);

router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_GESTIONAR_ROLES),
  rolController.listarRoles
);

router.get(
  "/:idRol",
  authMiddleware,
  checkPermission(PERMISO_GESTIONAR_ROLES),
  rolValidators.idRolValidator,
  rolController.obtenerRolPorId
);

router.put(
  "/:idRol",
  authMiddleware,
  checkPermission(PERMISO_GESTIONAR_ROLES),
  rolValidators.actualizarRolValidators,
  rolController.actualizarRol
);

// NUEVA RUTA: Cambiar el estado de un rol
router.patch(
  "/:idRol/estado",
  authMiddleware,
  checkPermission(PERMISO_GESTIONAR_ROLES),
  rolValidators.cambiarEstadoRolValidators,
  rolController.cambiarEstadoRol
);

router.patch(
  "/:idRol/anular",
  authMiddleware,
  checkPermission(PERMISO_GESTIONAR_ROLES),
  rolValidators.idRolValidator,
  rolController.anularRol
);

router.patch(
  "/:idRol/habilitar",
  authMiddleware,
  checkPermission(PERMISO_GESTIONAR_ROLES),
  rolValidators.idRolValidator,
  rolController.habilitarRol
);

router.delete(
  "/:idRol",
  authMiddleware,
  checkPermission(PERMISO_GESTIONAR_ROLES),
  rolValidators.idRolValidator,
  rolController.eliminarRolFisico
);

router.post(
  "/:idRol/permisos",
  authMiddleware,
  checkPermission(PERMISO_ASIGNAR_PERMISOS_A_ROL),
  rolValidators.gestionarPermisosRolValidators,
  rolController.asignarPermisosARol
);

router.delete(
  "/:idRol/permisos",
  authMiddleware,
  checkPermission(PERMISO_ASIGNAR_PERMISOS_A_ROL),
  rolValidators.gestionarPermisosRolValidators,
  rolController.quitarPermisosDeRol
);

module.exports = router;
