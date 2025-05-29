// src/routes/cita.routes.js
const express = require("express");
const router = express.Router();
const citaController = require("../controllers/cita.controller.js");
const citaValidators = require("../validators/cita.validators.js");

const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_CITAS = "MODULO_CITAS_GESTIONAR";

router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  citaValidators.crearCitaValidators,
  citaController.crearCita
);

router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  citaController.listarCitas
);

router.get(
  "/:idCita",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  citaValidators.idCitaValidator,
  citaController.obtenerCitaPorId
);

router.put(
  "/:idCita",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  citaValidators.actualizarCitaValidators,
  citaController.actualizarCita
);

// NUEVA RUTA: Cambiar el estado general de una cita
router.patch(
  "/:idCita/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  citaValidators.cambiarEstadoCitaValidators, // Usa el validador específico para el booleano 'estado'
  citaController.cambiarEstadoCita // Llama a la función del controlador
);

router.patch(
  "/:idCita/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  citaValidators.idCitaValidator,
  citaController.anularCita
);

router.patch(
  "/:idCita/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  citaValidators.idCitaValidator,
  citaController.habilitarCita
);

router.delete(
  "/:idCita",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  citaValidators.idCitaValidator,
  citaController.eliminarCitaFisica
);

router.post(
  "/:idCita/servicios",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  citaValidators.gestionarServiciosCitaValidator,
  citaController.agregarServiciosACita
);

router.delete(
  "/:idCita/servicios",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  citaValidators.gestionarServiciosCitaValidator,
  citaController.quitarServiciosDeCita
);

module.exports = router;
