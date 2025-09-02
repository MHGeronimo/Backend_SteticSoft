// src/routes/dashboard.routes.js
const express = require("express");
const router = express.Router();
const {
  getIngresosPorCategoria,
  getServiciosMasVendidos,
  getProductosMasVendidos,
  getEvolucionVentas,
  getSubtotalIva,
} = require("../controllers/dashboard.controller.js");

// Middleware de autenticación (si es necesario, descomentar y ajustar)
// const { authRequired } = require('../middlewares/auth.middleware');
// router.use(authRequired);

// Definición de las rutas para el dashboard
router.get("/ingresos-por-categoria", getIngresosPorCategoria);
router.get("/servicios-mas-vendidos", getServiciosMasVendidos);
router.get("/productos-mas-vendidos", getProductosMasVendidos);
router.get("/evolucion-ventas", getEvolucionVentas);
router.get("/subtotal-iva", getSubtotalIva);

module.exports = router;
