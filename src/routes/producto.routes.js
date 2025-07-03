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

// Ruta para crear un nuevo producto
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  // El middleware de Multer se ejecuta aquí para procesar el campo 'imagen'.
  uploadProductoImage,
  productoValidators.crearProductoValidators,
  productoController.crearProducto
);

// Ruta para obtener todos los productos
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoController.listarProductos
);

// Ruta para obtener un producto por su ID
router.get(
  "/:idProducto",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.idProductoValidator,
  productoController.obtenerProductoPorId
);

// Ruta para actualizar un producto existente
router.put(
  "/:idProducto",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  // El middleware de Multer también se aplica aquí para la actualización de la imagen.
  uploadProductoImage,
  productoValidators.actualizarProductoValidators,
  productoController.actualizarProducto
);

// Ruta para cambiar el estado de un producto (activo/inactivo)
router.patch(
  "/:idProducto/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.cambiarEstadoProductoValidators,
  productoController.cambiarEstadoProducto
);

// Ruta para anular un producto (borrado lógico)
router.patch(
  "/:idProducto/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.idProductoValidator,
  productoController.anularProducto
);

// Ruta para habilitar un producto
router.patch(
  "/:idProducto/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.idProductoValidator,
  productoController.habilitarProducto
);

// Ruta para eliminar un producto físicamente
router.delete(
  "/:idProducto",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.idProductoValidator,
  productoController.eliminarProductoFisico
);

module.exports = router;