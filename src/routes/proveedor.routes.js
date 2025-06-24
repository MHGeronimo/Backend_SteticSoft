// src/routes/proveedor.routes.js
const express = require("express");
const router = express.Router();
const proveedorController = require("../controllers/proveedor.controller.js");
const proveedorValidators = require("../validators/proveedor.validators.js");

const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_PROVEEDORES = "MODULO_PROVEEDORES_GESTIONAR";

router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PROVEEDORES),
  proveedorValidators.crearProveedorValidators,
  proveedorController.crearProveedor
);

// --- AÑADE ESTA NUEVA RUTA AQUÍ ---
router.post(
  "/verificar-unicidad",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PROVEEDORES),
  proveedorController.verificarUnicidad
);
// --- FIN DE LA NUEVA RUTA ---

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

// NUEVA RUTA: Cambiar el estado de un proveedor
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
