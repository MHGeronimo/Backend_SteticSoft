// src/routes/novedades.routes.js
const express = require("express");
const router = express.Router();
const novedadesController = require("../controllers/novedades.controller.js");
const novedadesValidators = require("../validators/novedades.validators.js");
const authMiddleware = require("../middlewares/auth.middleware.js");
const { checkPermission } = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_NOVEDADES = "MODULO_NOVEDADES_EMPLEADOS_GESTIONAR";

// --- RUTAS CRUD PARA NOVEDADES ---

// Crear una nueva novedad y asignarla a empleados
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES),
  novedadesValidators.crearNovedadValidators,
  novedadesController.crearNovedad
);

// Listar todas las novedades (permite filtrar por query params, ej: /?empleadoId=1&estado=true)
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES),
  novedadesController.listarNovedades
);

// Obtener una novedad específica por su ID
router.get(
  "/:idNovedad", // CORREGIDO: Parámetro en singular
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES),
  novedadesValidators.idNovedadValidator,
  novedadesController.obtenerNovedadPorId
);

// Actualizar una novedad por su ID (datos y/o empleados asignados)
router.patch( // MODIFICADO: Se usa PATCH para actualizaciones parciales
  "/:idNovedad", // CORREGIDO: Parámetro en singular
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES),
  novedadesValidators.actualizarNovedadValidators,
  novedadesController.actualizarNovedad
);

// Cambiar el estado (activo/inactivo) de una novedad
router.patch(
  "/:idNovedad/estado", // CORREGIDO: Parámetro en singular
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES),
  novedadesValidators.cambiarEstadoNovedadValidators,
  novedadesController.cambiarEstadoNovedad
);

// Eliminar una novedad por su ID
router.delete(
  "/:idNovedad", // CORREGIDO: Parámetro en singular
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES),
  novedadesValidators.idNovedadValidator,
  novedadesController.eliminarNovedadFisica
);

module.exports = router;