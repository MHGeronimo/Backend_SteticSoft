// src/routes/especialidad.routes.js
const express = require("express");
const router = express.Router();
const especialidadController = require("../controllers/especialidad.controller.js");
const especialidadValidators = require("../validators/especialidad.validators.js");

const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_ESPECIALIDADES = "MODULO_ESPECIALIDADES_GESTIONAR";

router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ESPECIALIDADES),
  especialidadValidators.crearEspecialidadValidators,
  especialidadController.crearEspecialidad
);

router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ESPECIALIDADES),
  especialidadController.listarEspecialidades
);

router.get(
  "/:idEspecialidad",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ESPECIALIDADES),
  especialidadValidators.idEspecialidadValidator,
  especialidadController.obtenerEspecialidadPorId
);

router.put(
  "/:idEspecialidad",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ESPECIALIDADES),
  especialidadValidators.actualizarEspecialidadValidators,
  especialidadController.actualizarEspecialidad
);

// NUEVA RUTA: Cambiar el estado de una especialidad
router.patch(
  "/:idEspecialidad/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ESPECIALIDADES),
  especialidadValidators.cambiarEstadoEspecialidadValidators,
  especialidadController.cambiarEstadoEspecialidad
);

router.patch(
  "/:idEspecialidad/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ESPECIALIDADES),
  especialidadValidators.idEspecialidadValidator,
  especialidadController.anularEspecialidad
);

router.patch(
  "/:idEspecialidad/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ESPECIALIDADES),
  especialidadValidators.idEspecialidadValidator,
  especialidadController.habilitarEspecialidad
);

router.delete(
  "/:idEspecialidad",
  authMiddleware,
  checkPermission(PERMISO_MODULO_ESPECIALIDADES),
  especialidadValidators.idEspecialidadValidator,
  especialidadController.eliminarEspecialidadFisica
);

module.exports = router;
