// src/routes/dashboard.routes.js
const { Router } = require("express");
const dashboardController = require("../controllers/dashboard.controller");
const { authMiddleware, authorizationMiddleware } = require("../middlewares");

const router = Router();

// Middleware de autenticación y autorización para todas las rutas del dashboard
router.use(authMiddleware, authorizationMiddleware(["Dashboard"]));

// Definición de las rutas para obtener las métricas del dashboard
router.get(
  "/ingresos-por-categoria",
  dashboardController.getIngresosPorCategoria
);
router.get(
  "/servicios-mas-vendidos",
  dashboardController.getServiciosMasVendidos
);
router.get(
  "/productos-mas-vendidos",
  dashboardController.getProductosMasVendidos
);
router.get("/evolucion-ventas", dashboardController.getEvolucionVentas);
router.get("/subtotal-iva", dashboardController.getSubtotalIva);

module.exports = router;
