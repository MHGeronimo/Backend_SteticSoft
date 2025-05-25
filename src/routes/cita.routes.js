// src/routes/cita.routes.js
const express = require("express");
const router = express.Router();
// const { body } = require('express-validator'); // Ya no se necesita 'body' aquí directamente para estas rutas
const citaController = require("../controllers/cita.controller.js");
const citaValidators = require("../validators/cita.validators.js"); // Ahora incluye gestionarServiciosCitaValidator
// const { handleValidationErrors } = require('../middlewares/validation.middleware.js'); // Ya no se necesita aquí directamente

// Middlewares de seguridad
const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_CITAS = "MODULO_CITAS_GESTIONAR";

// --- Rutas CRUD para Citas (sin cambios) ---
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

// --- RUTAS PARA GESTIONAR SERVICIOS DE UNA CITA (ACTUALIZADAS) ---

// POST /api/citas/:idCita/servicios - Agregar servicios a una cita existente
router.post(
  "/:idCita/servicios",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS), // O un permiso específico
  citaValidators.gestionarServiciosCitaValidator, // <-- USANDO EL NUEVO VALIDADOR
  citaController.agregarServiciosACita
);

// DELETE /api/citas/:idCita/servicios - Quitar servicios de una cita existente
router.delete(
  "/:idCita/servicios",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS), // O un permiso específico
  citaValidators.gestionarServiciosCitaValidator, // <-- USANDO EL NUEVO VALIDADOR
  citaController.quitarServiciosDeCita
);

module.exports = router;
