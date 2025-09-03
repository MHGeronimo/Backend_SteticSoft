// Ubicación: src/shared/src_api/services/dashboard.service.js
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
  async getIngresosPorCategoria() {
    const ingresosProductos = await ProductoXVenta.findAll({
      attributes: [
        [sequelize.col('producto.categoria.nombre'), 'categoria'],
        [sequelize.fn("SUM", sequelize.literal("cantidad * valor_unitario")), "total"],
      ],
      include: [{
        model: Producto,
        as: 'producto',
        attributes: [],
        include: [{ model: CategoriaProducto, as: 'categoria', attributes: [] }],
      }],
      group: [sequelize.col('producto.categoria.nombre')],
      raw: true,
    });

    const ingresosServicios = await VentaXServicio.findAll({
      attributes: [
        [sequelize.col('servicio.categoria.nombre'), 'categoria'],
        [sequelize.fn("SUM", sequelize.col("valor_servicio")), "total"],
      ],
      include: [{
        model: Servicio,
        as: 'servicio',
        attributes: [],
        include: [{ model: CategoriaServicio, as: 'categoria', attributes: [] }],
      }],
      group: [sequelize.col('servicio.categoria.nombre')],
      raw: true,
    });
    
    const ingresos = {};
    [...ingresosProductos, ...ingresosServicios].forEach(item => {
      if (!ingresos[item.categoria]) ingresos[item.categoria] = 0;
      ingresos[item.categoria] += parseFloat(item.total);
    });

    return Object.entries(ingresos).map(([categoria, total]) => ({ categoria, total }));
  }

  async getServiciosMasVendidos() {
    return VentaXServicio.findAll({
      attributes: [
        [sequelize.col('servicio.nombre'), 'nombre'],
        [sequelize.fn('COUNT', sequelize.col('VentaXServicio.id_servicio')), 'totalVendido']
      ],
      include: [{ model: Servicio, as: 'servicio', attributes: [] }],
      group: [sequelize.col('servicio.nombre')],
      order: [[sequelize.literal('"totalVendido"'), 'DESC']],
      limit: 5,
      raw: true
    }).then(results => results.map(s => ({...s, totalVendido: parseInt(s.totalVendido, 10)})));
  }

  async getProductosMasVendidos() {
    return ProductoXVenta.findAll({
      attributes: [
        [sequelize.col('producto.nombre'), 'nombre'],
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'totalVendido']
      ],
      include: [{ model: Producto, as: 'producto', attributes: [] }],
      group: [sequelize.col('producto.nombre')],
      order: [[sequelize.literal('"totalVendido"'), 'DESC']],
      limit: 5,
      raw: true
    }).then(results => results.map(p => ({...p, totalVendido: parseInt(p.totalVendido, 10)})));
  }

  async getEvolucionVentas() {
    const hace12Meses = new Date();
    hace12Meses.setMonth(hace12Meses.getMonth() - 12);

    const ventas = await Venta.findAll({
      attributes: [
        [sequelize.fn("TO_CHAR", sequelize.col("fecha"), "YYYY-MM"), "mes"],
        [sequelize.fn("SUM", sequelize.col("total")), "totalVentas"],
        [sequelize.fn("COUNT", sequelize.col("id_venta")), "transacciones"],
      ],
      where: { fecha: { [Op.gte]: hace12Meses }, id_estado: 1 },
      group: ["mes"],
      order: [["mes", "ASC"]],
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

  async getSubtotalIva() {
    const resultado = await Venta.findOne({
      attributes: [
        [sequelize.fn("SUM", sequelize.col("total")), "gran_total"],
        [sequelize.fn("SUM", sequelize.col("iva")), "total_iva"],
      ],
      where: { id_estado: 1 },
      raw: true,
    });
    
    const granTotal = parseFloat(resultado.gran_total || 0);
    const totalIva = parseFloat(resultado.total_iva || 0);
    return { subtotal: granTotal - totalIva, iva: totalIva };
  }
}

module.exports = new DashboardService();