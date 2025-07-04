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

// --- INICIO DE LA CORRECCIÓN ---

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
// --- FIN DE LA CORRECCIÓN ---


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

router.patch(
  "/:idProveedor/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PROVEEDORES),
  proveedorValidators.cambiarEstadoProveedorValidators,
  proveedorController.cambiarEstadoProveedor
);

router.patch(
  "/:idProveedor/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PROVEEDORES),
  proveedorValidators.idProveedorValidator,
  proveedorController.anularProveedor
);

router.patch(
  "/:idProveedor/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PROVEEDORES),
  proveedorValidators.idProveedorValidator,
  proveedorController.habilitarProveedor
);

router.delete(
  "/:idProveedor",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PROVEEDORES),
  proveedorValidators.idProveedorValidator,
  proveedorController.eliminarProveedorFisico
);

module.exports = router;