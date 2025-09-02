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
} = require("../models"); // Ajusta la ruta según tu estructura
const { Op } = require("sequelize");

class DashboardService {
  // 1. Obtener ingresos por categoría (productos y servicios)
  async getIngresosPorCategoria() {
    // Ingresos por categoría de productos
    const ingresosProductos = await ProductoXVenta.findAll({
      attributes: [
        [
          sequelize.fn("SUM", sequelize.literal("cantidad * valor_unitario")),
          "total",
        ],
      ],
      include: [
        {
          model: Producto,
          as: "producto",
          attributes: ["nombre"],
          include: [
            {
              model: CategoriaProducto,
              as: "categoria",
              attributes: ["nombre"],
            },
          ],
        },
      ],
      group: ["producto.categoria.id_categoria_producto"],
      raw: true,
    });

    // Ingresos por categoría de servicios
    const ingresosServicios = await VentaXServicio.findAll({
      attributes: [
        [sequelize.fn("SUM", sequelize.col("valor_servicio")), "total"],
      ],
      include: [
        {
          model: Servicio,
          as: "servicio",
          attributes: ["nombre"],
          include: [
            {
              model: CategoriaServicio,
              as: "categoria",
              attributes: ["nombre"],
            },
          ],
        },
      ],
      group: ["servicio.categoria.id_categoria_servicio"],
      raw: true,
    });

    // Mapear y combinar resultados
    const ingresos = {};

    ingresosProductos.forEach((item) => {
      const categoria = item["producto.categoria.nombre"];
      if (!ingresos[categoria]) {
        ingresos[categoria] = 0;
      }
      ingresos[categoria] += parseFloat(item.total);
    });

    ingresosServicios.forEach((item) => {
      const categoria = item["servicio.categoria.nombre"];
      if (!ingresos[categoria]) {
        ingresos[categoria] = 0;
      }
      ingresos[categoria] += parseFloat(item.total);
    });

    return ingresos;
  }

  // 2. Obtener los 5 servicios más vendidos
  async getServiciosMasVendidos() {
    const servicios = await VentaXServicio.findAll({
      attributes: [
        [
          sequelize.fn("COUNT", sequelize.col("VentaXServicio.id_servicio")),
          "conteo",
        ],
      ],
      include: [
        {
          model: Servicio,
          as: "servicio",
          attributes: ["nombre"],
        },
      ],
      group: ["VentaXServicio.id_servicio", "servicio.id_servicio"],
      order: [[sequelize.literal("conteo"), "DESC"]],
      limit: 5,
      raw: true,
    });

    return servicios.map((s) => ({
      nombre: s["servicio.nombre"],
      conteo: s.conteo,
    }));
  }

  // 3. Obtener los 5 productos más vendidos
  async getProductosMasVendidos() {
    const productos = await ProductoXVenta.findAll({
      attributes: [
        [sequelize.fn("SUM", sequelize.col("cantidad")), "total_vendido"],
      ],
      include: [
        {
          model: Producto,
          as: "producto",
          attributes: ["nombre"],
        },
      ],
      group: ["ProductoXVenta.id_producto", "producto.id_producto"],
      order: [[sequelize.literal("total_vendido"), "DESC"]],
      limit: 5,
      raw: true,
    });

    return productos.map((p) => ({
      nombre: p["producto.nombre"],
      total_vendido: parseInt(p.total_vendido, 10),
    }));
  }

  // 4. Evolución de ventas en los últimos 30 días
  async getEvolucionVentas() {
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    return await Venta.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("fecha")), "dia"],
        [sequelize.fn("SUM", sequelize.col("total")), "total_ventas"],
      ],
      where: {
        fecha: {
          [Op.gte]: hace30Dias,
        },
      },
      group: [sequelize.fn("DATE", sequelize.col("fecha"))],
      order: [[sequelize.fn("DATE", sequelize.col("fecha")), "ASC"]],
      raw: true,
    });
  }

  // 5. Obtener subtotal e IVA total de todas las ventas
  async getSubtotalIva() {
    const resultado = await Venta.findOne({
      attributes: [
        [
          sequelize.fn("SUM", sequelize.col("total")),
          "gran_total",
        ],
        [sequelize.fn("SUM", sequelize.col("iva")), "total_iva"],
      ],
      raw: true,
    });
    
    // El subtotal es el gran_total menos el total_iva
    const subtotal = (resultado.gran_total || 0) - (resultado.total_iva || 0);

    return {
        subtotal: parseFloat(subtotal).toFixed(2),
        total_iva: parseFloat(resultado.total_iva || 0).toFixed(2),
    };
  }
}

module.exports = new DashboardService();
