// src/routes/categoriaServicio.routes.js
const express = require("express");
const router = express.Router();
const categoriaServicioController = require("../controllers/categoriaServicio.controller.js");
const categoriaServicioValidators = require("../validators/categoriaServicio.validators.js");

const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_CATEGORIAS_SERVICIOS =
  "MODULO_CATEGORIAS_SERVICIOS_GESTIONAR";

router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_SERVICIOS),
  categoriaServicioValidators.crearCategoriaServicioValidators,
  categoriaServicioController.crearCategoriaServicio
);

router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_SERVICIOS),
  categoriaServicioController.listarCategoriasServicio
);

router.get(
  "/:idCategoriaServicio",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_SERVICIOS),
  categoriaServicioValidators.idCategoriaServicioValidator,
  categoriaServicioController.obtenerCategoriaServicioPorId
);

router.put(
  "/:idCategoriaServicio",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_SERVICIOS),
  categoriaServicioValidators.actualizarCategoriaServicioValidators,
  categoriaServicioController.actualizarCategoriaServicio
);

// NUEVA RUTA: Cambiar el estado de una categoría de servicio
router.patch(
  "/:idCategoriaServicio/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_SERVICIOS),
  categoriaServicioValidators.cambiarEstadoCategoriaServicioValidators,
  categoriaServicioController.cambiarEstadoCategoriaServicio
);

router.patch(
  "/:idCategoriaServicio/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_SERVICIOS),
  categoriaServicioValidators.idCategoriaServicioValidator,
  categoriaServicioController.anularCategoriaServicio
);

router.patch(
  "/:idCategoriaServicio/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_SERVICIOS),
  categoriaServicioValidators.idCategoriaServicioValidator,
  categoriaServicioController.habilitarCategoriaServicio
);

router.delete(
  "/:idCategoriaServicio",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_SERVICIOS),
  categoriaServicioValidators.idCategoriaServicioValidator,
  categoriaServicioController.eliminarCategoriaServicioFisica
);

module.exports = router;
