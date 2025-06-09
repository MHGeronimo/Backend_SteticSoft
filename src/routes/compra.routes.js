const express = require("express");
const router = express.Router();
const compraController = require("../controllers/compra.controller.js");
const { // Importamos todos los validadores que vamos a necesitar
  crearCompraValidators,
  actualizarCompraValidators,
  idCompraValidator,
  cambiarEstadoCompraValidators,
  cambiarEstadoProcesoCompraValidators 
} = require("../validators/compra.validators.js");

const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_COMPRAS = "MODULO_COMPRAS_GESTIONAR";

router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_COMPRAS),
  crearCompraValidators,
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
  idCompraValidator,
  compraController.obtenerCompraPorId
);

router.put(
  "/:idCompra",
  authMiddleware,
  checkPermission(PERMISO_MODULO_COMPRAS),
  actualizarCompraValidators,
  compraController.actualizarCompra
);

router.patch(
  "/:idCompra/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_COMPRAS),
  cambiarEstadoCompraValidators,
  compraController.cambiarEstadoCompra
);

router.patch(
  "/:idCompra/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_COMPRAS),
  idCompraValidator,
  compraController.anularCompra
);

// --- INICIO DE LA MODIFICACIÓN ---
// Nueva ruta para cambiar el estado del proceso (Pendiente/Completado)
router.patch(
  "/:idCompra/estado-proceso",
  authMiddleware,
  checkPermission(PERMISO_MODULO_COMPRAS),
  cambiarEstadoProcesoCompraValidators, // <- El nuevo validador
  compraController.cambiarEstadoProcesoCompra // <- El nuevo controlador
);
// --- FIN DE LA MODIFICACIÓN ---

router.patch(
  "/:idCompra/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_COMPRAS),
  idCompraValidator,
  compraController.habilitarCompra
);

router.delete(
  "/:idCompra",
  authMiddleware,
  checkPermission(PERMISO_MODULO_COMPRAS),
  idCompraValidator,
  compraController.eliminarCompraFisica
);

module.exports = router;