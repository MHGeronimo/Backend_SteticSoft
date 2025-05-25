// src/routes/venta.routes.js
const express = require("express");
const router = express.Router();
const ventaController = require("../controllers/venta.controller.js");
const ventaValidators = require("../validators/venta.validators.js");

// Middlewares de seguridad
const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

// Nombre del permiso de módulo para gestionar ventas
const PERMISO_MODULO_VENTAS = "MODULO_VENTAS_GESTIONAR";

// POST /api/ventas - Crear una nueva venta
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_VENTAS),
  ventaValidators.crearVentaValidators,
  ventaController.crearVenta
);

// GET /api/ventas - Obtener todas las ventas
// Permite filtrar por query params, ej. ?estado=true&clienteId=1&estadoVentaId=3
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_VENTAS), // O un permiso más general de lectura si aplica
  ventaController.listarVentas
);

// GET /api/ventas/:idVenta - Obtener una venta por ID
router.get(
  "/:idVenta",
  authMiddleware,
  checkPermission(PERMISO_MODULO_VENTAS), // O un permiso más específico de solo lectura
  ventaValidators.idVentaValidator,
  ventaController.obtenerVentaPorId
);

// PUT /api/ventas/:idVenta/estado-proceso - Actualizar el estado del PROCESO de una venta
// (Ej. de 'En proceso' a 'Completado' o 'Cancelado')
// También puede actualizar el estado booleano general de la Venta (activo/inactivo)
// Cuerpo: { "estadoVentaId": 3 } o { "estado": false } o ambos
router.put(
  "/:idVenta/estado-proceso", // Ruta más específica para esta acción
  authMiddleware,
  checkPermission(PERMISO_MODULO_VENTAS),
  ventaValidators.actualizarEstadoProcesoVentaValidators, // Validador específico
  ventaController.actualizarEstadoVenta // Controlador que llama a actualizarEstadoProcesoVenta del servicio
);

// PATCH /api/ventas/:idVenta/anular - Anular una venta (estado booleano = false y ajusta inventario)
router.patch(
  "/:idVenta/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_VENTAS),
  ventaValidators.idVentaValidator, // Solo se necesita el ID para esta acción
  ventaController.anularVenta
);

// PATCH /api/ventas/:idVenta/habilitar - Habilitar una venta (estado booleano = true y ajusta inventario)
router.patch(
  "/:idVenta/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_VENTAS),
  ventaValidators.idVentaValidator, // Solo se necesita el ID para esta acción
  ventaController.habilitarVenta
);

// DELETE /api/ventas/:idVenta - Eliminar FÍSICAMENTE una venta por ID
// ¡Esta acción es destructiva y ajusta inventario si la venta estaba activa y en estado procesable!
router.delete(
  "/:idVenta",
  authMiddleware,
  checkPermission(PERMISO_MODULO_VENTAS), // O un permiso aún más restrictivo
  ventaValidators.idVentaValidator,
  ventaController.eliminarVentaFisica
);

module.exports = router;
