// src/routes/compra.routes.js
const express = require("express");
const router = express.Router();
const compraController = require("../controllers/compra.controller.js");
const compraValidators = require("../validators/compra.validators.js");

// Middlewares de seguridad
const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

// Nombre del permiso de módulo para gestionar compras
const PERMISO_MODULO_COMPRAS = "MODULO_COMPRAS_GESTIONAR";

// POST /api/compras - Crear una nueva compra
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_COMPRAS),
  compraValidators.crearCompraValidators,
  compraController.crearCompra
);

// GET /api/compras - Obtener todas las compras
// Permite filtrar por query params, ej. ?estado=true&proveedorId=1
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_COMPRAS), // O un permiso más general de lectura
  compraController.listarCompras
);

// GET /api/compras/:idCompra - Obtener una compra por ID
router.get(
  "/:idCompra",
  authMiddleware,
  checkPermission(PERMISO_MODULO_COMPRAS), // O un permiso más específico de solo lectura
  compraValidators.idCompraValidator,
  compraController.obtenerCompraPorId
);

// PUT /api/compras/:idCompra - Actualizar una compra por ID (cabecera y/o estado)
router.put(
  "/:idCompra",
  authMiddleware,
  checkPermission(PERMISO_MODULO_COMPRAS),
  compraValidators.actualizarCompraValidators,
  compraController.actualizarCompra
);

// PATCH /api/compras/:idCompra/anular - Anular una compra
router.patch(
  "/:idCompra/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_COMPRAS),
  compraValidators.idCompraValidator, // Solo se necesita el ID para esta acción
  compraController.anularCompra
);

// PATCH /api/compras/:idCompra/habilitar - Habilitar una compra
router.patch(
  "/:idCompra/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_COMPRAS),
  compraValidators.idCompraValidator, // Solo se necesita el ID para esta acción
  compraController.habilitarCompra
);

// DELETE /api/compras/:idCompra - Eliminar FÍSICAMENTE una compra por ID
// ¡Esta acción es destructiva y ajusta inventario!
router.delete(
  "/:idCompra",
  authMiddleware,
  checkPermission(PERMISO_MODULO_COMPRAS), // O un permiso aún más restrictivo
  compraValidators.idCompraValidator,
  compraController.eliminarCompraFisica
);

module.exports = router;
