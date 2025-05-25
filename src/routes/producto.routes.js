// src/routes/producto.routes.js
const express = require("express");
const router = express.Router();
const productoController = require("../controllers/producto.controller.js");
const productoValidators = require("../validators/producto.validators.js");

// Middlewares de seguridad
const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

// Nombre del permiso de módulo para gestionar productos
const PERMISO_MODULO_PRODUCTOS = "MODULO_PRODUCTOS_GESTIONAR";

// POST /api/productos - Crear un nuevo producto
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.crearProductoValidators,
  productoController.crearProducto
);

// GET /api/productos - Obtener todos los productos
// Permite filtrar por query params, ej. ?estado=true&categoriaProductoId=1
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS), // O un permiso más general de lectura si aplica
  productoController.listarProductos
);

// GET /api/productos/:idProducto - Obtener un producto por ID
router.get(
  "/:idProducto",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS), // O un permiso más específico de solo lectura
  productoValidators.idProductoValidator,
  productoController.obtenerProductoPorId
);

// PUT /api/productos/:idProducto - Actualizar (Editar) un producto por ID
router.put(
  "/:idProducto",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.actualizarProductoValidators,
  productoController.actualizarProducto
);

// PATCH /api/productos/:idProducto/anular - Anular un producto
router.patch(
  "/:idProducto/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.idProductoValidator,
  productoController.anularProducto
);

// PATCH /api/productos/:idProducto/habilitar - Habilitar un producto
router.patch(
  "/:idProducto/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.idProductoValidator,
  productoController.habilitarProducto
);

// DELETE /api/productos/:idProducto - Eliminar FÍSICAMENTE un producto por ID
// ¡Esta acción es destructiva! Considerar las implicaciones con Abastecimiento, CompraXProducto, ProductoXVenta.
// El servicio ya maneja la restricción de FK.
router.delete(
  "/:idProducto",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS), // O un permiso aún más restrictivo
  productoValidators.idProductoValidator,
  productoController.eliminarProductoFisico
);

module.exports = router;
