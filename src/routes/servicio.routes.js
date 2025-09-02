// src/routes/servicio.routes.js
const express = require("express");
const router = express.Router();
const servicioController = require("../controllers/servicio.controller.js");
const servicioValidators = require("../validators/servicio.validators.js");

const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_SERVICIOS = "MODULO_SERVICIOS_GESTIONAR";

// --- RUTAS DE LA API ---

const { uploadServicioImage } = require("../middlewares/upload.middleware.js");

router.get("/public", servicioController.listarServiciosPublicos);

// Crear un nuevo servicio
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  uploadServicioImage,
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
  uploadServicioImage,
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
