// RUTA: src/shared/src_api/routes/categoriaProducto.routes.js
const express = require("express");
const router = express.Router();
const categoriaProductoController = require("../controllers/categoriaProducto.controller.js");
const categoriaProductoValidators = require("../validators/categoriaProducto.validators.js");

const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_CATEGORIAS_PRODUCTOS =
  "MODULO_CATEGORIAS_PRODUCTOS_GESTIONAR";

router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS),
  categoriaProductoValidators.crearCategoriaProductoValidators,
  categoriaProductoController.crearCategoriaProducto
);

router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS),
  categoriaProductoController.listarCategoriasProducto
);

// ✅ CORRECCIÓN: Usar :idCategoriaProducto para coincidir con el modelo
router.get(
  "/:idCategoriaProducto",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS),
  categoriaProductoValidators.idCategoriaProductoValidator,
  categoriaProductoController.obtenerCategoriaProductoPorId
);

// ✅ CORRECCIÓN: Usar :idCategoriaProducto
router.put(
  "/:idCategoriaProducto",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS),
  categoriaProductoValidators.actualizarCategoriaProductoValidators,
  categoriaProductoController.actualizarCategoriaProducto
);

// ✅ CORRECCIÓN: Usar :idCategoriaProducto
router.patch(
  "/:idCategoriaProducto/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS),
  categoriaProductoValidators.cambiarEstadoCategoriaProductoValidators,
  categoriaProductoController.cambiarEstadoCategoriaProducto
);

// ✅ CORRECCIÓN: Usar :idCategoriaProducto
router.patch(
  "/:idCategoriaProducto/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS),
  categoriaProductoValidators.idCategoriaProductoValidator,
  categoriaProductoController.anularCategoriaProducto
);

// ✅ CORRECCIÓN: Usar :idCategoriaProducto
router.patch(
  "/:idCategoriaProducto/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS),
  categoriaProductoValidators.idCategoriaProductoValidator,
  categoriaProductoController.habilitarCategoriaProducto
);

// ✅ CORRECCIÓN: Usar :idCategoriaProducto
router.delete(
  "/:idCategoriaProducto",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS),
  categoriaProductoValidators.idCategoriaProductoValidator,
  categoriaProductoController.eliminarCategoriaProductoFisica
);

module.exports = router;