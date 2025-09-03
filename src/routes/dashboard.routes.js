// Ubicación: src/shared/src_api/routes/dashboard.routes.js
const { Router } = require("express");
const dashboardController = require("../controllers/dashboard.controller");
const { authMiddleware, checkPermission } = require("../middlewares");

const router = Router();

router.use(authMiddleware, checkPermission("MODULO_DASHBOARD_VER"));

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
