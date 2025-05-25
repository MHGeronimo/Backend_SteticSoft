// src/routes/cliente.routes.js
const express = require("express");
const router = express.Router();
const clienteController = require("../controllers/cliente.controller.js");
const clienteValidators = require("../validators/cliente.validators.js");

// Middlewares de seguridad (descomentar y configurar según tus necesidades)
const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

// Nombre del permiso de módulo para gestionar clientes
// Este permiso sería para administradores o empleados con acceso a la gestión completa de clientes.
const PERMISO_MODULO_CLIENTES = "MODULO_CLIENTES_GESTIONAR";

// POST /api/clientes - Crear un nuevo cliente
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES), // Solo roles con este permiso pueden crear clientes
  clienteValidators.crearClienteValidators,
  clienteController.crearCliente
);

// GET /api/clientes - Obtener todos los clientes
// Permite filtrar por query params, ej. ?estado=true
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES), // O un permiso más específico de solo lectura si aplica
  clienteController.listarClientes
);

// GET /api/clientes/:idCliente - Obtener un cliente por ID
router.get(
  "/:idCliente",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES), // O un permiso más específico de solo lectura
  clienteValidators.idClienteValidator,
  clienteController.obtenerClientePorId
);

// PUT /api/clientes/:idCliente - Actualizar (Editar) un cliente por ID
router.put(
  "/:idCliente",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES),
  clienteValidators.actualizarClienteValidators,
  clienteController.actualizarCliente
);

// PATCH /api/clientes/:idCliente/anular - Anular un cliente (borrado lógico, estado = false)
router.patch(
  "/:idCliente/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES),
  clienteValidators.idClienteValidator,
  clienteController.anularCliente
);

// PATCH /api/clientes/:idCliente/habilitar - Habilitar un cliente (estado = true)
router.patch(
  "/:idCliente/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES),
  clienteValidators.idClienteValidator,
  clienteController.habilitarCliente
);

// DELETE /api/clientes/:idCliente - Eliminar FÍSICAMENTE un cliente por ID
// ¡Esta acción es destructiva! Asegúrate de protegerla adecuadamente.
// Considera las implicaciones con Citas (ON DELETE CASCADE) y Ventas (ON DELETE SET NULL).
router.delete(
  "/:idCliente",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES), // O un permiso aún más restrictivo
  clienteValidators.idClienteValidator,
  clienteController.eliminarClienteFisico
);

module.exports = router;
