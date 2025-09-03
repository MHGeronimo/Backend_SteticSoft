// Ubicación: src/shared/src_api/routes/dashboard.routes.js
const { Router } = require("express");
const dashboardController = require("../controllers/dashboard.controller");

// La importación se hace con llaves {} porque el archivo /middlewares/index.js
// exporta un objeto con todas las funciones.
// Esta línea extrae las dos funciones que necesitamos de ese objeto.
const { authMiddleware, authorizationMiddleware } = require("../middlewares");

const router = Router();

// Esta línea AHORA SÍ funcionará, porque "authorizationMiddleware" es una función válida.
router.use(authMiddleware, authorizationMiddleware(["Dashboard"]));

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
