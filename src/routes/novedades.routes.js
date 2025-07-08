// src/routes/novedades.routes.js
const express = require("express");
const router = express.Router();
const novedadesController = require("../controllers/novedades.controller.js");
const novedadesValidators = require("../validators/novedades.validators.js");

const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_NOVEDADES_EMPLEADOS =
  "MODULO_NOVEDADES_EMPLEADOS_GESTIONAR";

router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES_EMPLEADOS),
  novedadesValidators.crearNovedadValidators,
  novedadesController.crearNovedad
);


router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES_EMPLEADOS),
  novedadesController.listarNovedades
);

router.get(
  "/empleado/:idEmpleado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES_EMPLEADOS),
  novedadesValidators.empleadoIdValidator,
  novedadesController.listarNovedades
);

router.get(
  "/:idNovedades",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES_EMPLEADOS),
  novedadesValidators.idNovedadValidator,
  novedadesController.obtenerNovedadPorId
);

router.put(
  "/:idNovedades",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES_EMPLEADOS),
  novedadesValidators.actualizarNovedadValidators,
  novedadesController.actualizarNovedad
);

// NUEVA RUTA: Cambiar el estado de una novedad
router.patch(
  "/:idNovedades/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES_EMPLEADOS),
  novedadesValidators.cambiarEstadoNovedadValidators,
  novedadesController.cambiarEstadoNovedad
);

router.patch(
  "/:idNovedades/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES_EMPLEADOS),
  novedadesValidators.idNovedadValidator,
  novedadesController.anularNovedad
);

router.patch(
  "/:idNovedades/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES_EMPLEADOS),
  novedadesValidators.idNovedadValidator,
  novedadesController.habilitarNovedad
);

router.delete(
  "/:idNovedades",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES_EMPLEADOS),
  novedadesValidators.idNovedadValidator,
  novedadesController.eliminarNovedadFisica
);

module.exports = router;
