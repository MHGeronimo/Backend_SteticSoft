// src/routes/rol.routes.js
const express = require("express");
const router = express.Router();
const rolController = require("../controllers/rol.controller.js");
const rolValidators = require("../validators/rol.validators.js");
const authMiddleware = require("../middlewares/auth.middleware.js");
// Cambiamos a checkModuleAccess
const {
  checkModuleAccess,
} = require("../middlewares/authorization.middleware.js");

// Todas las rutas para la gestión de Roles requerirán el permiso 'ACCESO_MODULO_ROLES'
const PERMISO_MODULO_ROLES = "ACCESO_MODULO_ROLES"; // Definir el nombre del permiso del módulo

router.post(
  "/",
  authMiddleware,
  checkModuleAccess(PERMISO_MODULO_ROLES),
  rolValidators.crearRolValidators,
  rolController.crearRol
);

router.get(
  "/",
  authMiddleware,
  checkModuleAccess(PERMISO_MODULO_ROLES),
  rolController.listarRoles
);

router.get(
  "/:idRol",
  authMiddleware,
  checkModuleAccess(PERMISO_MODULO_ROLES),
  rolValidators.idRolValidator,
  rolController.obtenerRolPorId
);

router.put(
  "/:idRol",
  authMiddleware,
  checkModuleAccess(PERMISO_MODULO_ROLES),
  rolValidators.actualizarRolValidators,
  rolController.actualizarRol
);

router.patch(
  "/:idRol/anular",
  authMiddleware,
  checkModuleAccess(PERMISO_MODULO_ROLES),
  rolValidators.idRolValidator,
  rolController.anularRol
);

router.patch(
  "/:idRol/habilitar",
  authMiddleware,
  checkModuleAccess(PERMISO_MODULO_ROLES),
  rolValidators.idRolValidator,
  rolController.habilitarRol
);

router.delete(
  "/:idRol",
  authMiddleware,
  checkModuleAccess(PERMISO_MODULO_ROLES), // Incluso el borrado físico estaría cubierto por este permiso de módulo
  rolValidators.idRolValidator,
  rolController.eliminarRolFisico
);

module.exports = router;
