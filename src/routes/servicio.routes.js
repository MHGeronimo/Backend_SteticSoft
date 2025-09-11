const express = require("express");
const router = express.Router();
const multer = require("multer");
const servicioController = require("../controllers/servicio.controller.js");
const servicioValidators = require("../validators/servicio.validators.js");
const authMiddleware = require("../middlewares/auth.middleware.js");
const { checkPermission } = require("../middlewares/authorization.middleware.js");
const { handleValidationErrors } = require("../middlewares/validation.middleware.js"); // ✅ IMPORTAR

const PERMISO_MODULO_CITAS = "MODULO_CITAS_GESTIONAR";
const PERMISO_MODULO_SERVICIOS = "MODULO_SERVICIOS_GESTIONAR";

// --- RUTAS PÚBLICAS ---
router.get("/public", servicioController.listarServiciosPublicos);

// --- RUTAS PROTEGIDAS ---
router.get(
  "/disponibles",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  servicioController.listarServiciosDisponibles
);

// MODIFICAR LAS RUTAS QUE RECIBEN IMÁGENES:
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  upload.single('imagen'), // ✅ Middleware de multer
  servicioValidators.crearServicioValidators,
  handleValidationErrors,
  servicioController.crearServicio
);

router.put(
  "/:idServicio",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  upload.single('imagen'), // ✅ Middleware de multer
  servicioValidators.actualizarServicioValidators,
  handleValidationErrors,
  servicioController.actualizarServicio
);

router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.listarServiciosValidator,
  handleValidationErrors, // ✅ AÑADIDO
  servicioController.listarServicios
);

router.get(
  "/:idServicio",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.idServicioValidator,
  handleValidationErrors, // ✅ AÑADIDO
  servicioController.obtenerServicioPorId
);

router.put(
  "/:idServicio",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.actualizarServicioValidators,
  handleValidationErrors, // ✅ AÑADIDO
  servicioController.actualizarServicio
);

router.patch(
  "/:idServicio/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.cambiarEstadoServicioValidators,
  handleValidationErrors, // ✅ AÑADIDO
  servicioController.cambiarEstadoServicio
);

router.delete(
  "/:idServicio",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.idServicioValidator,
  handleValidationErrors, // ✅ AÑADIDO
  servicioController.eliminarServicioFisico
);

module.exports = router;