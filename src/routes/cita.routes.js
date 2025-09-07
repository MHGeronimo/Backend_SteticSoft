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
  "/:idCita/estado-proceso",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  citaValidators.actualizarCitaValidators, // Reutilizar validador
  citaController.cambiarEstadoProcesoCita
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

// 1. Obtener días disponibles por novedad (Paso 2 del frontend)
router.get(
  "/novedad/:idNovedad/dias-disponibles",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  citaValidators.obtenerDiasDisponiblesValidators,
  citaController.obtenerDiasDisponiblesPorNovedad
);

router.get(
  "/novedad/:idNovedad/horarios-disponibles",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  citaValidators.obtenerHorariosDisponiblesValidators,
  citaController.obtenerHorariosDisponiblesPorNovedad
);

router.get(
  "/clientes/buscar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  citaValidators.buscarClientesValidators,
  citaController.buscarClientes
);

router.get(
  "/novedad/:idNovedad/empleados",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  citaValidators.obtenerDiasDisponiblesValidators,
  citaController.obtenerEmpleadosPorNovedad
);

router.get(
  "/servicios/disponibles",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  citaController.obtenerServiciosDisponibles
);


module.exports = router;
