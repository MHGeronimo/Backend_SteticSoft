// src/routes/servicio.routes.js
const express = require("express");
const router = express.Router();
const servicioController = require("../controllers/servicio.controller.js");
const servicioValidators = require("../validators/servicio.validators.js");
const authMiddleware = require("../middlewares/auth.middleware.js");
const { checkPermission } = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_CITAS = "MODULO_CITAS_GESTIONAR"; // Permiso para agendar
const PERMISO_MODULO_SERVICIOS = "MODULO_SERVICIOS_GESTIONAR";

// --- RUTAS DE LA API ---

// --- ✅ NUEVA RUTA PARA EL MÓDULO DE CITAS ---
// Devuelve solo los servicios activos (estado=true) para ser usados en el agendamiento.
// No necesita validador.
router.get(
  "/disponibles",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  servicioController.listarServiciosDisponibles // Necesitaremos crear esta función
);

router.get("/public", servicioController.listarServiciosPublicos);

// Crear un nuevo servicio
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.crearServicioValidators,
  servicioController.crearServicio
);

// Listar todos los servicios con filtros/búsqueda
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.listarServiciosValidator, // <- debe ser un array de funciones
  servicioController.listarServicios
);


// Obtener un servicio por ID
router.get(
  "/:idServicio",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.idServicioValidator,
  servicioController.obtenerServicioPorId
);

// Actualizar un servicio (PUT para actualizaciones completas)
router.put(
  "/:idServicio",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.actualizarServicioValidators,
  servicioController.actualizarServicio
);

// Cambiar el estado de un servicio
router.patch(
  "/:idServicio/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.cambiarEstadoServicioValidators,
  servicioController.cambiarEstadoServicio
);

// Eliminar un servicio
router.delete(
  "/:idServicio",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.idServicioValidator,
  servicioController.eliminarServicioFisico
);

module.exports = router;
