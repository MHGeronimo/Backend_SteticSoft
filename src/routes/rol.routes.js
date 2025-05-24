// src/routes/rol.routes.js
const express = require("express");
const router = express.Router();
const rolController = require("../controllers/rol.controller.js");
const rolValidators = require("../validators/rol.validators.js");

// Middlewares de seguridad (descomentar y configurar cuando implementes autenticación/autorización)
// const authMiddleware = require('../middlewares/auth.middleware.js');
// const { checkPermission } = require('../middlewares/authorization.middleware.js');

// POST /api/roles - Crear un nuevo rol
router.post(
  "/",
  // authMiddleware,
  // checkPermission('CREAR_ROL'),
  rolValidators.crearRolValidators,
  rolController.crearRol
);

// GET /api/roles - Obtener todos los roles (permite filtrar por estado ej: ?estado=true o ?estado=false)
router.get(
  "/",
  // authMiddleware,
  // checkPermission('LISTAR_ROLES'),
  rolController.listarRoles
);

// GET /api/roles/:idRol - Obtener un rol por ID
router.get(
  "/:idRol",
  // authMiddleware,
  // checkPermission('OBTENER_ROL_POR_ID'),
  rolValidators.idRolValidator,
  rolController.obtenerRolPorId
);

// PUT /api/roles/:idRol - Actualizar (Editar) un rol por ID
router.put(
  "/:idRol",
  // authMiddleware,
  // checkPermission('EDITAR_ROL'),
  rolValidators.actualizarRolValidators,
  rolController.actualizarRol
);

// PATCH /api/roles/:idRol/anular - Anular un rol (borrado lógico, estado = false)
router.patch(
  "/:idRol/anular",
  // authMiddleware,
  // checkPermission('ANULAR_ROL'),
  rolValidators.idRolValidator,
  rolController.anularRol
);

// PATCH /api/roles/:idRol/habilitar - Habilitar un rol (estado = true)
router.patch(
  "/:idRol/habilitar",
  // authMiddleware,
  // checkPermission('HABILITAR_ROL'),
  rolValidators.idRolValidator,
  rolController.habilitarRol
);

// DELETE /api/roles/:idRol - Eliminar FÍSICAMENTE un rol por ID
router.delete(
  "/:idRol",
  // authMiddleware,
  // checkPermission('ELIMINAR_ROL_FISICO'), // ¡Permiso muy restrictivo!
  rolValidators.idRolValidator,
  rolController.eliminarRolFisico
);

module.exports = router;
