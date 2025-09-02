// src/controllers/dashboard.controller.js
const DashboardService = require("../services/dashboard.service");

// 1. Obtener ingresos por categoría (productos y servicios)
const getIngresosPorCategoria = async (req, res, next) => {
  try {
    const ingresos = await DashboardService.getIngresosPorCategoria();
    res.status(200).json(ingresos);
  } catch (error) {
    next(error);
  }
};

// 2. Obtener los 5 servicios más vendidos
const getServiciosMasVendidos = async (req, res, next) => {
  try {
    const servicios = await DashboardService.getServiciosMasVendidos();
    res.status(200).json(servicios);
  } catch (error) {
    next(error);
  }
};

// 3. Obtener los 5 productos más vendidos
const getProductosMasVendidos = async (req, res, next) => {
  try {
    const productos = await DashboardService.getProductosMasVendidos();
    res.status(200).json(productos);
  } catch (error) {
    next(error);
  }
};

// 4. Evolución de ventas en los últimos 30 días
const getEvolucionVentas = async (req, res, next) => {
  try {
    const ventas = await DashboardService.getEvolucionVentas();
    res.status(200).json(ventas);
  } catch (error) {
    next(error);
  }
};

// 5. Obtener subtotal e IVA total de todas las ventas
const getSubtotalIva = async (req, res, next) => {
  try {
    const resultado = await DashboardService.getSubtotalIva();
    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIngresosPorCategoria,
  getServiciosMasVendidos,
  getProductosMasVendidos,
  getEvolucionVentas,
  getSubtotalIva,
};
