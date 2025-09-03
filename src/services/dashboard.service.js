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
    const ingresosProductos = await CategoriaProducto.findAll({
      attributes: [
        'nombre',
        [sequelize.fn('SUM', sequelize.literal('productos->productos_x_venta.cantidad * productos->productos_x_venta.valor_unitario')), 'total']
      ],
      include: [{
        model: Producto,
        as: 'productos',
        attributes: [],
        required: true,
        include: [{
          model: ProductoXVenta,
          as: 'productos_x_venta',
          attributes: [],
          required: true,
        }]
      }],
      group: ['CategoriaProducto.id_categoria_producto'],
      raw: true
    });

    const ingresosServicios = await CategoriaServicio.findAll({
      attributes: [
        'nombre',
        [sequelize.fn('SUM', sequelize.col('servicios->ventas_x_servicio.valor_servicio')), 'total']
      ],
      include: [{
        model: Servicio,
        as: 'servicios',
        attributes: [],
        required: true,
        include: [{
          model: VentaXServicio,
          as: 'ventas_x_servicio',
          attributes: [],
          required: true,
        }]
      }],
      group: ['CategoriaServicio.id_categoria_servicio'],
      raw: true
    });

    const ingresos = {};
    [...ingresosProductos, ...ingresosServicios].forEach(item => {
      if (!ingresos[item.nombre]) ingresos[item.nombre] = 0;
      ingresos[item.nombre] += parseFloat(item.total || 0);
    });

    return Object.entries(ingresos).map(([categoria, total]) => ({ categoria, total }));
  }

  async getServiciosMasVendidos() {
    const servicios = await Servicio.findAll({
      attributes: [
        'nombre',
        [sequelize.fn('COUNT', sequelize.col('ventas_x_servicio.id_servicio')), 'totalVendido']
      ],
      include: [{
        model: VentaXServicio,
        as: 'ventas_x_servicio',
        attributes: [],
        required: true
      }],
      group: ['Servicio.id_servicio'],
      order: [[sequelize.literal('"totalVendido"'), 'DESC']],
      limit: 5,
      raw: true
    });
    return servicios.map(s => ({ ...s, totalVendido: parseInt(s.totalVendido, 10) }));
  }

  async getProductosMasVendidos() {
    const productos = await Producto.findAll({
      attributes: [
        'nombre',
        [sequelize.fn('SUM', sequelize.col('productos_x_venta.cantidad')), 'totalVendido']
      ],
      include: [{
        model: ProductoXVenta,
        as: 'productos_x_venta',
        attributes: [],
        required: true
      }],
      group: ['Producto.id_producto'],
      order: [[sequelize.literal('"totalVendido"'), 'DESC']],
      limit: 5,
      raw: true
    });
    return productos.map(p => ({ ...p, totalVendido: parseInt(p.totalVendido, 10) }));
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
      where: { fecha: { [Op.gte]: hace12Meses }, estado: true },
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
    return { subtotal: granTotal - totalIva, iva: totalIva };
  }
}

module.exports = new DashboardService();