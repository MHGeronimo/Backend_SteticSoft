// src/routes/categoriaProducto.routes.js
const express = require("express");
const router = express.Router();
const categoriaProductoController = require("../controllers/categoriaProducto.controller.js");
const categoriaProductoValidators = require("../validators/categoriaProducto.validators.js");

// Middlewares de seguridad
const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

// Nombre del permiso de módulo para gestionar categorías de productos
const PERMISO_MODULO_CATEGORIAS_PRODUCTOS =
  "MODULO_CATEGORIAS_PRODUCTOS_GESTIONAR";

// POST /api/categorias-producto - Crear una nueva categoría de producto
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS),
  categoriaProductoValidators.crearCategoriaProductoValidators,
  categoriaProductoController.crearCategoriaProducto
);

// GET /api/categorias-producto - Obtener todas las categorías de producto
// Permite filtrar por query params, ej. ?estado=true&tipoUso=Interno
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS), // O un permiso más general de lectura
  categoriaProductoController.listarCategoriasProducto
);

// GET /api/categorias-producto/:idCategoria - Obtener una categoría de producto por ID
router.get(
  "/:idCategoria",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS), // O un permiso más general de lectura
  categoriaProductoValidators.idCategoriaProductoValidator,
  categoriaProductoController.obtenerCategoriaProductoPorId
);

// PUT /api/categorias-producto/:idCategoria - Actualizar una categoría de producto por ID
router.put(
  "/:idCategoria",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS),
  categoriaProductoValidators.actualizarCategoriaProductoValidators,
  categoriaProductoController.actualizarCategoriaProducto
);

// PATCH /api/categorias-producto/:idCategoria/anular - Anular una categoría de producto
router.patch(
  "/:idCategoria/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS),
  categoriaProductoValidators.idCategoriaProductoValidator,
  categoriaProductoController.anularCategoriaProducto
);

// PATCH /api/categorias-producto/:idCategoria/habilitar - Habilitar una categoría de producto
router.patch(
  "/:idCategoria/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS),
  categoriaProductoValidators.idCategoriaProductoValidator,
  categoriaProductoController.habilitarCategoriaProducto
);

// DELETE /api/categorias-producto/:idCategoria - Eliminar FÍSICAMENTE una categoría de producto por ID
// Considerar las implicaciones (Productos asociados tendrán su FK a NULL).
router.delete(
  "/:idCategoria",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS), // O un permiso aún más restrictivo
  categoriaProductoValidators.idCategoriaProductoValidator,
  categoriaProductoController.eliminarCategoriaProductoFisica
);

module.exports = router;
