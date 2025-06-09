// src/routes/compra.routes.js
const express = require("express");
const router = express.Router();
const compraController = require("../controllers/compra.controller.js");
const compraValidators = require("../validators/compra.validators.js");

const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_COMPRAS = "MODULO_COMPRAS_GESTIONAR";

router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_COMPRAS),
  compraValidators.crearCompraValidators,
  compraController.crearCompra
);

router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_COMPRAS),
  compraController.listarCompras
);

router.get(
  "/:idCompra",
  authMiddleware,
  checkPermission(PERMISO_MODULO_COMPRAS),
  compraValidators.idCompraValidator,
  compraController.obtenerCompraPorId
);

router.put(
  "/:idCompra",
  authMiddleware,
  checkPermission(PERMISO_MODULO_COMPRAS),
  compraValidators.actualizarCompraValidators,
  compraController.actualizarCompra // Esta ruta ya permite actualizar el estado y otros campos
);

// NUEVA RUTA: Cambiar el estado de una compra (enfocada solo en el booleano estado)
router.patch(
  "/:idCompra/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_COMPRAS),
  compraValidators.cambiarEstadoCompraValidators,
  compraController.cambiarEstadoCompra
);

router.patch(
  "/:idCompra/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_COMPRAS),
  compraValidators.idCompraValidator,
  compraController.anularCompra
);

router.patch(
  "/:idCompra/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_COMPRAS),
  compraValidators.idCompraValidator,
  compraController.habilitarCompra
);

router.delete(
  "/:idCompra",
  authMiddleware,
  checkPermission(PERMISO_MODULO_COMPRAS),
  compraValidators.idCompraValidator,
  compraController.eliminarCompraFisica
);

module.exports = router;
