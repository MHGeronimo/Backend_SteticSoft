// src/routes/rol.routes.js
const express = require("express");
const router = express.Router();
const rolController = require("../controllers/rol.controller.js");
const rolValidators = require("../validators/rol.validators.js");

// Middlewares de seguridad (descomentar y configurar cuando implementes autenticación/autorización)
const authMiddleware = require("../middlewares/auth.middleware.js"); // Asume que ya lo tienes
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js"); // Asume que ya lo tienes

// Permisos necesarios para la gestión de roles y sus permisos
const PERMISO_GESTIONAR_ROLES = "MODULO_ROLES_GESTIONAR"; // Para CRUD de roles
const PERMISO_ASIGNAR_PERMISOS_A_ROL = "MODULO_ROLES_ASIGNAR_PERMISOS"; // Permiso específico para asignar/quitar permisos a roles

// --- Rutas CRUD para Roles ---

// POST /api/roles - Crear un nuevo rol
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_GESTIONAR_ROLES),
  rolValidators.crearRolValidators,
  rolController.crearRol
);

// GET /api/roles - Obtener todos los roles
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_GESTIONAR_ROLES), // O un permiso más general de 'lectura' si es necesario
  rolController.listarRoles
);

// GET /api/roles/:idRol - Obtener un rol por ID
router.get(
  "/:idRol",
  authMiddleware,
  checkPermission(PERMISO_GESTIONAR_ROLES), // O un permiso más general de 'lectura'
  rolValidators.idRolValidator,
  rolController.obtenerRolPorId
);

// PUT /api/roles/:idRol - Actualizar (Editar) un rol por ID
router.put(
  "/:idRol",
  authMiddleware,
  checkPermission(PERMISO_GESTIONAR_ROLES),
  rolValidators.actualizarRolValidators,
  rolController.actualizarRol
);

// PATCH /api/roles/:idRol/anular - Anular un rol
router.patch(
  "/:idRol/anular",
  authMiddleware,
  checkPermission(PERMISO_GESTIONAR_ROLES),
  rolValidators.idRolValidator,
  rolController.anularRol
);

// PATCH /api/roles/:idRol/habilitar - Habilitar un rol
router.patch(
  "/:idRol/habilitar",
  authMiddleware,
  checkPermission(PERMISO_GESTIONAR_ROLES),
  rolValidators.idRolValidator,
  rolController.habilitarRol
);

// DELETE /api/roles/:idRol - Eliminar FÍSICAMENTE un rol por ID
router.delete(
  "/:idRol",
  authMiddleware,
  checkPermission(PERMISO_GESTIONAR_ROLES), // O un permiso aún más restrictivo
  rolValidators.idRolValidator,
  rolController.eliminarRolFisico
);

// --- NUEVAS RUTAS PARA GESTIONAR PERMISOS DE UN ROL ---

// GET /api/roles/:idRol/permisos - Listar los permisos de un rol específico
router.get(
  "/:idRol/permisos",
  authMiddleware,
  checkPermission(PERMISO_ASIGNAR_PERMISOS_A_ROL), // O PERMISO_GESTIONAR_ROLES
  rolValidators.idRolValidator, // Valida que idRol sea un entero positivo
  rolController.listarPermisosDeRol
);

// POST /api/roles/:idRol/permisos - Asignar uno o varios permisos a un rol
// El cuerpo de la solicitud debería ser: { "idPermisos": [1, 2, 5] }
router.post(
  "/:idRol/permisos",
  authMiddleware,
  checkPermission(PERMISO_ASIGNAR_PERMISOS_A_ROL),
  rolValidators.gestionarPermisosRolValidators, // Valida idRol en params y idPermisos en body
  rolController.asignarPermisosARol
);

// DELETE /api/roles/:idRol/permisos - Quitar uno o varios permisos de un rol
// El cuerpo de la solicitud debería ser: { "idPermisos": [1, 2] }
// Alternativamente, para quitar un solo permiso: DELETE /api/roles/:idRol/permisos/:idPermiso
router.delete(
  "/:idRol/permisos",
  authMiddleware,
  checkPermission(PERMISO_ASIGNAR_PERMISOS_A_ROL),
  rolValidators.gestionarPermisosRolValidators, // Valida idRol en params y idPermisos en body
  rolController.quitarPermisosDeRol
);

// (Opcional) Ruta para quitar un permiso específico de un rol usando params
// DELETE /api/roles/:idRol/permisos/:idPermiso
// router.delete(
//   '/:idRol/permisos/:idPermiso',
//   authMiddleware,
//   checkPermission(PERMISO_ASIGNAR_PERMISOS_A_ROL),
//   rolValidators.gestionarUnPermisoRolValidators, // Valida idRol y idPermiso en params
//   rolController.quitarUnPermisoDeRol // Necesitarías una nueva función en el controlador y servicio para esto
// );

module.exports = router;
