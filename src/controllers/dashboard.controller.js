// src/controllers/dashboard.controller.js
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

// 1. Obtener ingresos por categoría (productos y servicios)
const getIngresosPorCategoria = async (req, res, next) => {
  try {
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

    res.status(200).json(ingresos);
  } catch (error) {
    next(error);
  }
};

// 2. Obtener los 5 servicios más vendidos
const getServiciosMasVendidos = async (req, res, next) => {
  try {
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

    const resultado = servicios.map((s) => ({
      nombre: s["servicio.nombre"],
      conteo: s.conteo,
    }));

    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
};

// 3. Obtener los 5 productos más vendidos
const getProductosMasVendidos = async (req, res, next) => {
  try {
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

    const resultado = productos.map((p) => ({
      nombre: p["producto.nombre"],
      total_vendido: parseInt(p.total_vendido, 10),
    }));

    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
};

// 4. Evolución de ventas en los últimos 30 días
const getEvolucionVentas = async (req, res, next) => {
  try {
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    const ventas = await Venta.findAll({
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

    res.status(200).json(ventas);
  } catch (error) {
    next(error);
  }
};

// 5. Obtener subtotal e IVA total de todas las ventas
const getSubtotalIva = async (req, res, next) => {
  try {
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

    res.status(200).json({
        subtotal: parseFloat(subtotal).toFixed(2),
        total_iva: parseFloat(resultado.total_iva || 0).toFixed(2),
    });

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
