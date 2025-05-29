// src/routes/producto.routes.js
const express = require("express");
const router = express.Router();
const productoController = require("../controllers/producto.controller.js");
const productoValidators = require("../validators/producto.validators.js");

const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_PRODUCTOS = "MODULO_PRODUCTOS_GESTIONAR";

router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.crearProductoValidators,
  productoController.crearProducto
);

router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoController.listarProductos
);

router.get(
  "/:idProducto",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.idProductoValidator,
  productoController.obtenerProductoPorId
);

router.put(
  "/:idProducto",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.actualizarProductoValidators,
  productoController.actualizarProducto
);

// NUEVA RUTA: Cambiar el estado de un producto
router.patch(
  "/:idProducto/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.cambiarEstadoProductoValidators,
  productoController.cambiarEstadoProducto
);

router.patch(
  "/:idProducto/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.idProductoValidator,
  productoController.anularProducto
);

router.patch(
  "/:idProducto/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.idProductoValidator,
  productoController.habilitarProducto
);

router.delete(
  "/:idProducto",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.idProductoValidator,
  productoController.eliminarProductoFisico
);

module.exports = router;
