// src/routes/empleado.routes.js
const express = require("express");
const router = express.Router();
const empleadoController = require("../controllers/empleado.controller.js");
const empleadoValidators = require("../validators/empleado.validators.js");

// Middlewares de seguridad
const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

// Nombre del permiso de módulo para gestionar empleados y sus especialidades
const PERMISO_MODULO_EMPLEADOS = "MODULO_EMPLEADOS_GESTIONAR";
// Podrías tener un permiso más específico para asignar especialidades si lo deseas:
// const PERMISO_ASIGNAR_ESPECIALIDADES_EMPLEADO = 'MODULO_EMPLEADOS_ASIGNAR_ESPECIALIDADES';

// --- Rutas CRUD para Empleados ---
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_EMPLEADOS),
  empleadoValidators.crearEmpleadoValidators,
  empleadoController.crearEmpleado
);
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_EMPLEADOS),
  empleadoController.listarEmpleados
);
router.get(
  "/:idEmpleado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_EMPLEADOS),
  empleadoValidators.idEmpleadoValidator,
  empleadoController.obtenerEmpleadoPorId
);
router.put(
  "/:idEmpleado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_EMPLEADOS),
  empleadoValidators.actualizarEmpleadoValidators,
  empleadoController.actualizarEmpleado
);
router.patch(
  "/:idEmpleado/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_EMPLEADOS),
  empleadoValidators.idEmpleadoValidator,
  empleadoController.anularEmpleado
);
router.patch(
  "/:idEmpleado/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_EMPLEADOS),
  empleadoValidators.idEmpleadoValidator,
  empleadoController.habilitarEmpleado
);
router.delete(
  "/:idEmpleado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_EMPLEADOS),
  empleadoValidators.idEmpleadoValidator,
  empleadoController.eliminarEmpleadoFisico
);

// --- NUEVAS RUTAS PARA GESTIONAR ESPECIALIDADES DE UN EMPLEADO ---

// GET /api/empleados/:idEmpleado/especialidades - Listar las especialidades de un empleado
router.get(
  "/:idEmpleado/especialidades",
  authMiddleware,
  checkPermission(PERMISO_MODULO_EMPLEADOS), // O un permiso de solo lectura
  empleadoValidators.idEmpleadoValidator, // Valida que idEmpleado sea un entero positivo
  empleadoController.listarEspecialidadesDeEmpleado
);

// POST /api/empleados/:idEmpleado/especialidades - Asignar una o varias especialidades a un empleado
// Cuerpo: { "idEspecialidades": [1, 2, 5] }
router.post(
  "/:idEmpleado/especialidades",
  authMiddleware,
  checkPermission(PERMISO_MODULO_EMPLEADOS), // O PERMISO_ASIGNAR_ESPECIALIDADES_EMPLEADO
  empleadoValidators.gestionarEspecialidadesEmpleadoValidators, // Valida idEmpleado en params e idEspecialidades en body
  empleadoController.asignarEspecialidadesAEmpleado
);

// DELETE /api/empleados/:idEmpleado/especialidades - Quitar una o varias especialidades de un empleado
// Cuerpo: { "idEspecialidades": [1, 2] }
router.delete(
  "/:idEmpleado/especialidades",
  authMiddleware,
  checkPermission(PERMISO_MODULO_EMPLEADOS), // O PERMISO_ASIGNAR_ESPECIALIDADES_EMPLEADO
  empleadoValidators.gestionarEspecialidadesEmpleadoValidators, // Valida idEmpleado en params e idEspecialidades en body
  empleadoController.quitarEspecialidadesDeEmpleado
);

module.exports = router;
