// src/shared/src_api/routes/proveedor.routes.js
const express = require("express");
const router = express.Router();
const proveedorController = require("../controllers/proveedor.controller.js");
const proveedorValidators = require("../validators/proveedor.validators.js");

const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_PROVEEDORES = "MODULO_PROVEEDORES_GESTIONAR";

// --- Rutas de Unicidad (Mantener) ---

// Ruta para verificar unicidad al CREAR un proveedor
router.post(
  "/verificar-unicidad",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PROVEEDORES),
  proveedorController.verificarUnicidad
);

// NUEVA RUTA para verificar unicidad al EDITAR un proveedor (excluyendo su propio ID)
router.post(
  "/:idProveedor/verificar-unicidad",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PROVEEDORES),
  proveedorValidators.idProveedorValidator, // Valida que el ID en la URL sea correcto
  proveedorController.verificarUnicidad
);

// --- Rutas CRUD (Mantener) ---

router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PROVEEDORES),
  proveedorValidators.crearProveedorValidators,
  proveedorController.crearProveedor
);

router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PROVEEDORES),
  proveedorController.listarProveedores
);

router.get(
  "/:idProveedor",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PROVEEDORES),
  proveedorValidators.idProveedorValidator,
  proveedorController.obtenerProveedorPorId
);

router.put(
  "/:idProveedor",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PROVEEDORES),
  proveedorValidators.actualizarProveedorValidators,
  proveedorController.actualizarProveedor
);

// --- Rutas de Eliminación (Actualizadas para solo eliminación física) ---

// Eliminada la ruta PATCH para cambiar estado /:idProveedor/estado
// Ya que se ha decidido que la eliminación es solo física.

// Eliminada la ruta PATCH para anular /:idProveedor/anular
// La eliminación física se gestiona ahora con la ruta DELETE principal.

// Eliminada la ruta PATCH para habilitar /:idProveedor/habilitar
// Ya no habrá proveedores inactivos si la eliminación es siempre física.

// **Ruta para eliminación física**: Ahora esta es la única forma de "eliminar" un proveedor
router.delete(
  "/:idProveedor",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PROVEEDORES),
  proveedorValidators.idProveedorValidator,
  proveedorController.anularProveedor // anularProveedor en el controlador ahora llama a eliminarProveedorFisico
);

module.exports = router;