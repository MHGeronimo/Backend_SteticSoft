// Ubicación: src/shared/src_api/controllers/dashboard.controller.js
const dashboardService = require("../services/dashboard.service");

class DashboardController {
  async getIngresosPorCategoria(req, res, next) {
    try {
      const data = await dashboardService.getIngresosPorCategoria();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async getServiciosMasVendidos(req, res, next) {
    try {
      const data = await dashboardService.getServiciosMasVendidos();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async getProductosMasVendidos(req, res, next) {
    try {
      const data = await dashboardService.getProductosMasVendidos();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async getEvolucionVentas(req, res, next) {
    try {
      const data = await dashboardService.getEvolucionVentas();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async getSubtotalIva(req, res, next) {
    try {
      const data = await dashboardService.getSubtotalIva();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();