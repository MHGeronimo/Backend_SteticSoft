// src/routes/usuario.routes.js
const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuario.controller.js");
const usuarioValidators = require("../validators/usuario.validators.js");

// Middlewares de seguridad (descomentar y configurar cuando implementes autenticación/autorización)
const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

// Nombre del permiso de módulo para gestionar usuarios
const PERMISO_MODULO_USUARIOS = "MODULO_USUARIOS_GESTIONAR";

// POST /api/usuarios - Crear un nuevo usuario
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_USUARIOS),
  usuarioValidators.crearUsuarioValidators,
  usuarioController.crearUsuario
);

// GET /api/usuarios - Obtener todos los usuarios
// Permite filtrar por query params, ej. ?estado=true&idRol=1
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_USUARIOS), // O un permiso más general de lectura si aplica
  usuarioController.listarUsuarios
);

// GET /api/usuarios/:idUsuario - Obtener un usuario por ID
router.get(
  "/:idUsuario",
  authMiddleware,
  checkPermission(PERMISO_MODULO_USUARIOS), // O un permiso más específico si es necesario
  usuarioValidators.idUsuarioValidator,
  usuarioController.obtenerUsuarioPorId
);

// PUT /api/usuarios/:idUsuario - Actualizar (Editar) un usuario por ID
router.put(
  "/:idUsuario",
  authMiddleware,
  checkPermission(PERMISO_MODULO_USUARIOS),
  usuarioValidators.actualizarUsuarioValidators,
  usuarioController.actualizarUsuario
);

// PATCH /api/usuarios/:idUsuario/anular - Anular un usuario (borrado lógico, estado = false)
router.patch(
  "/:idUsuario/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_USUARIOS),
  usuarioValidators.idUsuarioValidator,
  usuarioController.anularUsuario
);

// PATCH /api/usuarios/:idUsuario/habilitar - Habilitar un usuario (estado = true)
router.patch(
  "/:idUsuario/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_USUARIOS),
  usuarioValidators.idUsuarioValidator,
  usuarioController.habilitarUsuario
);

// DELETE /api/usuarios/:idUsuario - Eliminar FÍSICAMENTE un usuario por ID
// ¡Esta acción es destructiva! Asegúrate de protegerla adecuadamente con un permiso muy específico.
router.delete(
  "/:idUsuario",
  authMiddleware,
  checkPermission(PERMISO_MODULO_USUARIOS), // O un permiso aún más restrictivo como 'USUARIO_ELIMINAR_FISICO'
  usuarioValidators.idUsuarioValidator,
  usuarioController.eliminarUsuarioFisico
);

module.exports = router;
