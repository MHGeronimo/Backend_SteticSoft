// src/routes/novedades.routes.js
const express = require("express");
const router = express.Router();
const novedadesController = require("../controllers/novedades.controller.js");
const novedadesValidators = require("../validators/novedades.validators.js");

// Middlewares de seguridad
const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

// Nombre del permiso de módulo para gestionar novedades de empleados
const PERMISO_MODULO_NOVEDADES_EMPLEADOS =
  "MODULO_NOVEDADES_EMPLEADOS_GESTIONAR";

// POST /api/novedades - Crear una nueva novedad para un empleado
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES_EMPLEADOS),
  novedadesValidators.crearNovedadValidators,
  novedadesController.crearNovedad
);

// GET /api/novedades - Obtener todas las novedades
// Permite filtrar por query params, ej. ?estado=true&empleadoId=1&diaSemana=1
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES_EMPLEADOS), // O un permiso más general de lectura
  novedadesController.listarNovedades
);

// GET /api/novedades/empleado/:idEmpleado - Obtener todas las novedades de un empleado específico
router.get(
  "/empleado/:idEmpleado", // Ruta específica para obtener por empleado
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES_EMPLEADOS), // O un permiso de lectura
  novedadesValidators.empleadoIdValidator, // Valida que idEmpleado sea un entero positivo
  novedadesController.listarNovedades // Reutilizamos listarNovedades, que ya filtra por empleadoId si se provee
);

// GET /api/novedades/:idNovedades - Obtener una novedad por su ID
router.get(
  "/:idNovedades",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES_EMPLEADOS), // O un permiso más específico de solo lectura
  novedadesValidators.idNovedadValidator,
  novedadesController.obtenerNovedadPorId
);

// PUT /api/novedades/:idNovedades - Actualizar una novedad por su ID
// (Principalmente para horaInicio, horaFin, estado)
router.put(
  "/:idNovedades",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES_EMPLEADOS),
  novedadesValidators.actualizarNovedadValidators,
  novedadesController.actualizarNovedad
);

// PATCH /api/novedades/:idNovedades/anular - Anular una novedad
router.patch(
  "/:idNovedades/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES_EMPLEADOS),
  novedadesValidators.idNovedadValidator,
  novedadesController.anularNovedad
);

// PATCH /api/novedades/:idNovedades/habilitar - Habilitar una novedad
router.patch(
  "/:idNovedades/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES_EMPLEADOS),
  novedadesValidators.idNovedadValidator,
  novedadesController.habilitarNovedad
);

// DELETE /api/novedades/:idNovedades - Eliminar FÍSICAMENTE una novedad por su ID
router.delete(
  "/:idNovedades",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES_EMPLEADOS), // O un permiso aún más restrictivo
  novedadesValidators.idNovedadValidator,
  novedadesController.eliminarNovedadFisica
);

module.exports = router;
