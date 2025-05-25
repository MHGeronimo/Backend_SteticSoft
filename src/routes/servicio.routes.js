// src/routes/servicio.routes.js
const express = require("express");
const router = express.Router();
const servicioController = require("../controllers/servicio.controller.js");
const servicioValidators = require("../validators/servicio.validators.js");

// Middlewares de seguridad
const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

// Nombre del permiso de módulo para gestionar servicios
const PERMISO_MODULO_SERVICIOS = "MODULO_SERVICIOS_GESTIONAR";

// POST /api/servicios - Crear un nuevo servicio
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.crearServicioValidators,
  servicioController.crearServicio
);

// GET /api/servicios - Obtener todos los servicios
// Permite filtrar por query params, ej. ?estado=true&categoriaServicioId=1&especialidadId=1
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS), // O un permiso más general de lectura si aplica
  servicioController.listarServicios
);

// GET /api/servicios/:idServicio - Obtener un servicio por ID
router.get(
  "/:idServicio",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS), // O un permiso más específico de solo lectura
  servicioValidators.idServicioValidator,
  servicioController.obtenerServicioPorId
);

// PUT /api/servicios/:idServicio - Actualizar (Editar) un servicio por ID
router.put(
  "/:idServicio",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.actualizarServicioValidators,
  servicioController.actualizarServicio
);

// PATCH /api/servicios/:idServicio/anular - Anular un servicio
router.patch(
  "/:idServicio/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.idServicioValidator,
  servicioController.anularServicio
);

// PATCH /api/servicios/:idServicio/habilitar - Habilitar un servicio
router.patch(
  "/:idServicio/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.idServicioValidator,
  servicioController.habilitarServicio
);

// DELETE /api/servicios/:idServicio - Eliminar FÍSICAMENTE un servicio por ID
// Considerar las implicaciones con CategoriaServicio (ON DELETE RESTRICT),
// Especialidad (ON DELETE SET NULL), ServicioXCita (ON DELETE CASCADE), VentaXServicio (ON DELETE RESTRICT).
// El servicio ya maneja la restricción de VentaXServicio.
router.delete(
  "/:idServicio",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS), // O un permiso aún más restrictivo
  servicioValidators.idServicioValidator,
  servicioController.eliminarServicioFisico
);

module.exports = router;
