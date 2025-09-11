const express = require("express");
const router = express.Router();
const servicioController = require("../controllers/servicio.controller.js");
const servicioValidators = require("../validators/servicio.validators.js");
const authMiddleware = require("../middlewares/auth.middleware.js");
const { checkPermission } = require("../middlewares/authorization.middleware.js");
const { handleValidationErrors } = require("../middlewares/validation.middleware.js");

// ✅ MEJORA: Importar directamente la función de middleware que necesitamos.
// El archivo 'upload.middleware.js' exporta un objeto con { uploadServicioImage, ... },
// por lo que debemos desestructurarlo para obtener la función correcta.
const { uploadServicioImage } = require("../middlewares/upload.middleware.js");

// Permisos (sin cambios)
const PERMISO_MODULO_CITAS = "MODULO_CITAS_GESTIONAR";
const PERMISO_MODULO_SERVICIOS = "MODULO_SERVICIOS_GESTIONAR";

// --- RUTAS PÚBLICAS (sin cambios) ---
router.get("/public", servicioController.listarServiciosPublicos);

// --- RUTAS PROTEGIDAS (actualizadas) ---
router.get(
  "/disponibles",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  servicioController.listarServiciosDisponibles
);

// RUTA PARA CREAR SERVICIO
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  // ✅ CORRECCIÓN: Llamar a la función de middleware correcta para la carga de archivos.
  uploadServicioImage,
  servicioValidators.crearServicioValidators,
  handleValidationErrors, // Este siempre va después de los validadores
  servicioController.crearServicio
);

// RUTA PARA ACTUALIZAR SERVICIO
router.put(
  "/:idServicio",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  // ✅ CORRECCIÓN: Añadir el middleware de carga aquí también para permitir actualizar la imagen.
  uploadServicioImage,
  servicioValidators.actualizarServicioValidators,
  handleValidationErrors,
  servicioController.actualizarServicio
);


// --- El resto de las rutas están bien estructuradas ---

router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.listarServiciosValidator,
  handleValidationErrors,
  servicioController.listarServicios
);

router.get(
  "/:idServicio",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.idServicioValidator,
  handleValidationErrors,
  servicioController.obtenerServicioPorId
);

router.patch(
  "/:idServicio/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.cambiarEstadoServicioValidators,
  handleValidationErrors,
  servicioController.cambiarEstadoServicio
);

router.delete(
  "/:idServicio",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.idServicioValidator,
  handleValidationErrors,
  servicioController.eliminarServicioFisico
);

module.exports = router;
