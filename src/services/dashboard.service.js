// src/services/dashboard.service.js
const {
  Venta,
  Producto,
  Servicio,
  ProductoXVenta,
  VentaXServicio,
  CategoriaProducto,
  CategoriaServicio,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

class DashboardService {
  /**
   * Calcula los ingresos totales agrupados por categoría de producto y servicio.
   */
  async getIngresosPorCategoria() {
    // Ingresos por categoría de productos
    const ingresosProductos = await ProductoXVenta.findAll({
      attributes: [
        [
          sequelize.fn("SUM", sequelize.literal("cantidad * valor_unitario")),
          "total",
        ],
      ],
      include: [{
        model: Producto,
        as: "producto",
        attributes: [],
        include: [{
          model: CategoriaProducto,
          as: "categoria",
          attributes: ["nombre"],
        }],
      }],
      group: ["producto.categoria.id_categoria_producto"],
      raw: true,
    });

    // Ingresos por categoría de servicios
    const ingresosServicios = await VentaXServicio.findAll({
      attributes: [
        [sequelize.fn("SUM", sequelize.col("valor_servicio")), "total"]
      ],
      include: [{
        model: Servicio,
        as: "servicio",
        attributes: [],
        include: [{
          model: CategoriaServicio,
          as: "categoria",
          attributes: ["nombre"],
        }],
      }],
      group: ["servicio.categoria.id_categoria_servicio"],
      raw: true,
    });
    
    // Combina y suma los resultados de productos y servicios por categoría
    const ingresosAgrupados = {};

    ingresosProductos.forEach(item => {
      const categoria = item["producto.categoria.nombre"];
      if (!ingresosAgrupados[categoria]) ingresosAgrupados[categoria] = 0;
      ingresosAgrupados[categoria] += parseFloat(item.total);
    });

    ingresosServicios.forEach(item => {
      const categoria = item["servicio.categoria.nombre"];
      if (!ingresosAgrupados[categoria]) ingresosAgrupados[categoria] = 0;
      ingresosAgrupados[categoria] += parseFloat(item.total);
    });

    return Object.entries(ingresosAgrupados).map(([categoria, total]) => ({
      categoria,
      total,
    }));
  }

  /**
   * Obtiene el top 5 de servicios más vendidos.
   */
  async getServiciosMasVendidos() {
    const servicios = await VentaXServicio.findAll({
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("VentaXServicio.id_servicio")), "conteo"],
      ],
      include: [{
        model: Servicio,
        as: "servicio",
        attributes: ["nombre"],
      }],
      group: ["VentaXServicio.id_servicio", "servicio.id_servicio"],
      order: [[sequelize.literal("conteo"), "DESC"]],
      limit: 5,
    });

    return servicios.map(s => ({
      nombre: s.servicio.nombre,
      totalVendido: parseInt(s.get('conteo'), 10),
    }));
  }

  /**
   * Obtiene el top 5 de productos más vendidos.
   */
  async getProductosMasVendidos() {
    const productos = await ProductoXVenta.findAll({
      attributes: [
        [sequelize.fn("SUM", sequelize.col("cantidad")), "total_vendido"],
      ],
      include: [{
        model: Producto,
        as: "producto",
        attributes: ["nombre"],
      }],
      group: ["ProductoXVenta.id_producto", "producto.id_producto"],
      order: [[sequelize.literal("total_vendido"), "DESC"]],
      limit: 5,
    });
    
    return productos.map(p => ({
        nombre: p.producto.nombre,
        totalVendido: parseInt(p.get('total_vendido'), 10)
    }));
  }

  /**
   * Obtiene la evolución de ventas (total e número de transacciones) de los últimos 12 meses.
   */
  async getEvolucionVentas() {
    const hace12Meses = new Date();
    hace12Meses.setMonth(hace12Meses.getMonth() - 12);

    const ventas = await Venta.findAll({
      attributes: [
        [sequelize.fn("TO_CHAR", sequelize.col("fecha"), "YYYY-MM"), "mes"],
        [sequelize.fn("SUM", sequelize.col("total")), "totalVentas"],
        [sequelize.fn("COUNT", sequelize.col("id_venta")), "transacciones"],
      ],
      where: {
        fecha: { [Op.gte]: hace12Meses },
        estado: true,
      },
      group: [sequelize.fn("TO_CHAR", sequelize.col("fecha"), "YYYY-MM")],
      order: [[sequelize.fn("TO_CHAR", sequelize.col("fecha"), "YYYY-MM"), "ASC"]],
      raw: true,
    });
      
    return ventas.map(v => {
      const [year, month] = v.mes.split('-');
      const monthName = new Date(year, parseInt(month, 10) - 1, 1).toLocaleString('es-ES', { month: 'long' });
      return {
        mes: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`,
        totalVentas: parseFloat(v.totalVentas),
        transacciones: parseInt(v.transacciones, 10),
      };
    });
  }

  /**
   * Obtiene la suma total del subtotal y el IVA de todas las ventas.
   */
  async getSubtotalIva() {
    const resultado = await Venta.findOne({
      attributes: [
        [sequelize.fn("SUM", sequelize.col("total")), "gran_total"],
        [sequelize.fn("SUM", sequelize.col("iva")), "total_iva"],
      ],
      where: { estado: true },
      raw: true,
    });
    
    const granTotal = parseFloat(resultado.gran_total || 0);
    const totalIva = parseFloat(resultado.total_iva || 0);
    const subtotal = granTotal - totalIva;

    return { subtotal, iva: totalIva };
  }
}

module.exports = new DashboardService();