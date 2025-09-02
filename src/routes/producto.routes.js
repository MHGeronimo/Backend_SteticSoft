// src/shared/src_api/routes/producto.routes.js

const express = require("express");
const router = express.Router();
const productoController = require("../controllers/producto.controller.js");
const productoValidators = require("../validators/producto.validators.js");
const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

// Se importa el middleware para la subida de imágenes de productos.
const { uploadProductoImage } = require("../middlewares/upload.middleware.js");

const PERMISO_MODULO_PRODUCTOS = "MODULO_PRODUCTOS_GESTIONAR";

// Ruta para crear un nuevo producto, incluye subida de imagen.
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  // El middleware de Multer procesa el campo 'imagen' antes de la validación.
  uploadProductoImage,
  productoValidators.crearProductoValidators,
  productoController.crearProducto
);

// Ruta para obtener todos los productos.
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoController.listarProductos
);

// Ruta para obtener productos de uso interno (para abastecimiento).
router.get(
  "/interno",
  authMiddleware,
  checkPermission("MODULO_ABASTECIMIENTOS_GESTIONAR"), // Permiso del módulo que la consume
  productoController.listarProductosInternos
);

// Ruta para obtener un producto por su ID.
router.get(
  "/:idProducto",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.idProductoValidator,
  productoController.obtenerProductoPorId
);

// Ruta para actualizar un producto existente, incluye subida de imagen.
router.put(
  "/:idProducto",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  // El middleware de Multer también se aplica aquí para la actualización de la imagen.
  uploadProductoImage,
  productoValidators.actualizarProductoValidators,
  productoController.actualizarProducto
);

// Ruta para cambiar el estado de un producto (activo/inactivo).
router.patch(
  "/:idProducto/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.cambiarEstadoProductoValidators,
  productoController.cambiarEstadoProducto
);

// Ruta para anular un producto (borrado lógico).
router.patch(
  "/:idProducto/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.idProductoValidator,
  productoController.anularProducto
);

// Ruta para habilitar un producto.
router.patch(
  "/:idProducto/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.idProductoValidator,
  productoController.habilitarProducto
);

// Ruta para eliminar un producto físicamente.
router.delete(
  "/:idProducto",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.idProductoValidator,
  productoController.eliminarProductoFisico
);

module.exports = router;
