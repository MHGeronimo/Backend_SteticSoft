// src/routes/proveedor.routes.js
const express = require("express");
const router = express.Router();
const proveedorController = require("../controllers/proveedor.controller.js");
const proveedorValidators = require("../validators/proveedor.validators.js");

// Middlewares de seguridad
const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

// Nombre del permiso de módulo para gestionar proveedores
const PERMISO_MODULO_PROVEEDORES = "MODULO_PROVEEDORES_GESTIONAR";

// POST /api/proveedores - Crear un nuevo proveedor
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PROVEEDORES),
  proveedorValidators.crearProveedorValidators,
  proveedorController.crearProveedor
);

// GET /api/proveedores - Obtener todos los proveedores
// Permite filtrar por query params, ej. ?estado=true&tipo=Empresa
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PROVEEDORES), // O un permiso más general de lectura si aplica
  proveedorController.listarProveedores
);

// GET /api/proveedores/:idProveedor - Obtener un proveedor por ID
router.get(
  "/:idProveedor",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PROVEEDORES), // O un permiso más específico de solo lectura
  proveedorValidators.idProveedorValidator,
  proveedorController.obtenerProveedorPorId
);

// PUT /api/proveedores/:idProveedor - Actualizar (Editar) un proveedor por ID
router.put(
  "/:idProveedor",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PROVEEDORES),
  proveedorValidators.actualizarProveedorValidators,
  proveedorController.actualizarProveedor
);

// PATCH /api/proveedores/:idProveedor/anular - Anular un proveedor (borrado lógico, estado = false)
router.patch(
  "/:idProveedor/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PROVEEDORES),
  proveedorValidators.idProveedorValidator,
  proveedorController.anularProveedor
);

// PATCH /api/proveedores/:idProveedor/habilitar - Habilitar un proveedor (estado = true)
router.patch(
  "/:idProveedor/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PROVEEDORES),
  proveedorValidators.idProveedorValidator,
  proveedorController.habilitarProveedor
);

// DELETE /api/proveedores/:idProveedor - Eliminar FÍSICAMENTE un proveedor por ID
// ¡Esta acción es destructiva! Asegúrate de protegerla adecuadamente.
// Considerar las implicaciones con Compras (DDL: ON DELETE SET NULL).
router.delete(
  "/:idProveedor",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PROVEEDORES), // O un permiso aún más restrictivo
  proveedorValidators.idProveedorValidator,
  proveedorController.eliminarProveedorFisico
);

module.exports = router;
