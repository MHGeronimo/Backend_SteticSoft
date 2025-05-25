// src/routes/permiso.routes.js
const express = require("express");
const router = express.Router();
const permisoController = require("../controllers/permiso.controller.js");
const permisoValidators = require("../validators/permiso.validators.js");

// Middlewares de seguridad (descomentar y configurar cuando implementes autenticación/autorización)
// Estos permisos son muy sensibles y usualmente solo deberían ser accesibles por un Super Administrador.
const authMiddleware = require("../middlewares/auth.middleware.js"); // Tu middleware de autenticación
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js"); // Tu middleware de permisos

// Nombre del permiso de módulo para gestionar todos los permisos
const PERMISO_MODULO_PERMISOS = "MODULO_PERMISOS_GESTIONAR";

// POST /api/permisos - Crear un nuevo permiso
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PERMISOS),
  permisoValidators.crearPermisoValidators,
  permisoController.crearPermiso
);

// GET /api/permisos - Obtener todos los permisos
// (Permite filtrar por estado ej: ?estado=true o ?estado=false)
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PERMISOS), // O un permiso más general de lectura si otros roles necesitan verlos
  permisoController.listarPermisos
);

// GET /api/permisos/:idPermiso - Obtener un permiso por ID
router.get(
  "/:idPermiso",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PERMISOS), // O un permiso más general de lectura
  permisoValidators.idPermisoValidator,
  permisoController.obtenerPermisoPorId
);

// PUT /api/permisos/:idPermiso - Actualizar (Editar) un permiso por ID
router.put(
  "/:idPermiso",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PERMISOS),
  permisoValidators.actualizarPermisoValidators,
  permisoController.actualizarPermiso
);

// PATCH /api/permisos/:idPermiso/anular - Anular un permiso (borrado lógico, estado = false)
router.patch(
  "/:idPermiso/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PERMISOS),
  permisoValidators.idPermisoValidator,
  permisoController.anularPermiso
);

// PATCH /api/permisos/:idPermiso/habilitar - Habilitar un permiso (estado = true)
router.patch(
  "/:idPermiso/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PERMISOS),
  permisoValidators.idPermisoValidator,
  permisoController.habilitarPermiso
);

// DELETE /api/permisos/:idPermiso - Eliminar FÍSICAMENTE un permiso por ID
// ¡Esta acción es muy destructiva y afecta las asignaciones en PermisosXRol!
// Asegúrate de que solo roles muy privilegiados tengan acceso a este permiso.
router.delete(
  "/:idPermiso",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PERMISOS), // O un permiso aún más específico como 'ELIMINAR_PERMISO_FISICO'
  permisoValidators.idPermisoValidator,
  permisoController.eliminarPermisoFisico
);

module.exports = router;
