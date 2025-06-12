// src/routes/cliente.routes.js 
const express = require("express");
const router = express.Router();
const clienteController = require("../controllers/cliente.controller.js");
const clienteValidators = require("../validators/cliente.validators.js");

const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_CLIENTES = "MODULO_CLIENTES_GESTIONAR";

router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES),
  clienteValidators.crearClienteValidators,
  clienteController.crearCliente
);

router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES),
  clienteController.listarClientes
);

router.get(
  "/:idCliente",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES),
  clienteValidators.idClienteValidator,
  clienteController.obtenerClientePorId
);

router.put(
  "/:idCliente",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES),
  clienteValidators.actualizarClienteValidators,
  clienteController.actualizarCliente
);

// NUEVA RUTA: Cambiar el estado de un cliente
router.patch(
  "/:idCliente/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES),
  clienteValidators.cambiarEstadoClienteValidators,
  clienteController.cambiarEstadoCliente
);

router.patch(
  "/:idCliente/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES),
  clienteValidators.idClienteValidator,
  clienteController.anularCliente
);

router.patch(
  "/:idCliente/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES),
  clienteValidators.idClienteValidator,
  clienteController.habilitarCliente
);

router.delete(
  "/:idCliente",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES),
  clienteValidators.idClienteValidator,
  clienteController.eliminarClienteFisico
);

module.exports = router;
