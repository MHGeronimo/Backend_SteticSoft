// src/shared/src_api/routes/abastecimiento.routes.js
const express = require("express");
const router = express.Router();

// Importar el controlador de abastecimiento
const AbastecimientoController = require("../controllers/abastecimiento.controller");

// Importar los middlewares de autenticación y autorización
const authMiddleware = require("../middlewares/auth.middleware");
const authorizationMiddleware = require("../middlewares/authorization.middleware");

// Importar el middleware que maneja los errores de validación
const validationMiddleware = require("../middlewares/validation.middleware");

// Importar los validadores específicos para abastecimiento
const {
  createAbastecimientoValidator,
  updateAbastecimientoValidator,
  idValidator,
  toggleEstadoValidator,
} = require("../validators/abastecimiento.validators");

// --- Definición de Rutas para Abastecimiento ---

// GET /api/abastecimientos - Obtener todos los registros
router.get(
  "/",
  authMiddleware,
  authorizationMiddleware(["MODULO_ABASTECIMIENTO"]),
  AbastecimientoController.getAbastecimientos
);

// GET /api/abastecimientos/:id - Obtener un registro por su ID
router.get(
  "/:id",
  authMiddleware,
  authorizationMiddleware(["MODULO_ABASTECIMIENTO"]),
  idValidator, // Valida que el ID en la URL sea un número
  validationMiddleware, // Middleware que revisa si hubo errores de validación
  AbastecimientoController.getAbastecimientoById
);

// POST /api/abastecimientos - Crear un nuevo registro
router.post(
  "/",
  authMiddleware,
  authorizationMiddleware(["MODULO_ABASTECIMIENTO"]),
  createAbastecimientoValidator, // Array de reglas de validación para la creación
  validationMiddleware, // Middleware que revisa si hubo errores de validación
  AbastecimientoController.createAbastecimiento
);

// PUT /api/abastecimientos/:id - Actualizar un registro existente
router.put(
  "/:id",
  authMiddleware,
  authorizationMiddleware(["MODULO_ABASTECIMIENTO"]),
  updateAbastecimientoValidator, // Array de reglas de validación para la actualización
  validationMiddleware, // Middleware que revisa si hubo errores de validación
  AbastecimientoController.updateAbastecimiento
);

// PATCH /api/abastecimientos/:id/estado - Cambiar el estado (activar/desactivar)
router.patch(
  "/:id/estado",
  authMiddleware,
  authorizationMiddleware(["MODULO_ABASTECIMIENTO"]),
  toggleEstadoValidator, // Validador para el cambio de estado
  validationMiddleware, // Middleware que revisa si hubo errores de validación
  AbastecimientoController.toggleEstadoAbastecimiento
);

// DELETE /api/abastecimientos/:id - Eliminar un registro (soft delete o físico)
router.delete(
  "/:id",
  authMiddleware,
  authorizationMiddleware(["MODULO_ABASTECIMIENTO"]),
  idValidator, // Valida que el ID en la URL sea un número
  validationMiddleware, // Middleware que revisa si hubo errores de validación
  AbastecimientoController.deleteAbastecimiento
);

module.exports = router;