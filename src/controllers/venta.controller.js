// src/controllers/venta.controller.js
const ventaService = require("../services/venta.service.js"); // Ajusta la ruta si es necesario

/**
 * Crea una nueva venta.
 */
const crearVenta = async (req, res, next) => {
  try {
    // req.body debería contener:
    // { clienteId, estadoVentaId, productos: [{ productoId, cantidad, valorUnitario }], servicios: [{ servicioId, valorServicio, citaId? }], fecha?, dashboardId?, estado?, total?, iva? }
    const nuevaVenta = await ventaService.crearVenta(req.body);
    res.status(201).json({
      success: true,
      message: "Venta creada exitosamente.",
      data: nuevaVenta,
    });
  } catch (error) {
    next(error); // Pasa el error al manejador global
  }
};

/**
 * Obtiene una lista de todas las ventas.
 * Permite filtrar por query params, ej. ?estado=true&clienteId=1&estadoVentaId=3
 */
const listarVentas = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {};
    if (req.query.estado === "true") {
      // Estado booleano del registro Venta
      opcionesDeFiltro.estado = true;
    } else if (req.query.estado === "false") {
      opcionesDeFiltro.estado = false;
    }
    if (req.query.clienteId) {
      const idCliente = Number(req.query.clienteId);
      if (!isNaN(idCliente) && idCliente > 0) {
        opcionesDeFiltro.clienteId = idCliente;
      }
    }
    if (req.query.dashboardId) {
      const idDashboard = Number(req.query.dashboardId);
      if (!isNaN(idDashboard) && idDashboard > 0) {
        opcionesDeFiltro.dashboardId = idDashboard;
      }
    }
    if (req.query.estadoVentaId) {
      // Estado del proceso de la venta
      const idEstadoVenta = Number(req.query.estadoVentaId);
      if (!isNaN(idEstadoVenta) && idEstadoVenta > 0) {
        opcionesDeFiltro.estadoVentaId = idEstadoVenta;
      }
    }
    // Podrías añadir más filtros (ej. rango de fechas)

    const ventas = await ventaService.obtenerTodasLasVentas(opcionesDeFiltro);
    res.status(200).json({
      success: true,
      data: ventas,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una venta específica por su ID.
 */
const obtenerVentaPorId = async (req, res, next) => {
  try {
    const { idVenta } = req.params;
    const venta = await ventaService.obtenerVentaPorId(Number(idVenta));
    // El servicio ya lanza NotFoundError si no se encuentra
    res.status(200).json({
      success: true,
      data: venta,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza el estado del PROCESO de una venta y/o su estado booleano (activo/inactivo).
 * No modifica los productos/servicios de la venta.
 */
const actualizarEstadoVenta = async (req, res, next) => {
  try {
    const { idVenta } = req.params;
    // req.body podría ser { estadoVentaId: <nuevo_id_estado_proceso>, estado: <nuevo_estado_booleano> }
    const ventaActualizada = await ventaService.actualizarEstadoProcesoVenta(
      Number(idVenta),
      req.body
    );
    // El servicio ya lanza errores específicos (NotFoundError, BadRequestError)
    res.status(200).json({
      success: true,
      message: "Estado de la venta actualizado exitosamente.",
      data: ventaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Anula una venta (estado booleano = false y ajusta inventario).
 */
const anularVenta = async (req, res, next) => {
  try {
    const { idVenta } = req.params;
    const ventaAnulada = await ventaService.anularVenta(Number(idVenta));
    res.status(200).json({
      success: true,
      message:
        "Venta anulada exitosamente. El inventario ha sido ajustado si aplica.",
      data: ventaAnulada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Habilita una venta (estado booleano = true y ajusta inventario).
 */
const habilitarVenta = async (req, res, next) => {
  try {
    const { idVenta } = req.params;
    const ventaHabilitada = await ventaService.habilitarVenta(Number(idVenta));
    res.status(200).json({
      success: true,
      message:
        "Venta habilitada exitosamente. El inventario ha sido ajustado si aplica.",
      data: ventaHabilitada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina físicamente una venta por su ID.
 * ¡ADVERTENCIA: Esto también ajusta el inventario si la venta estaba activa!
 */
const eliminarVentaFisica = async (req, res, next) => {
  try {
    const { idVenta } = req.params;
    await ventaService.eliminarVentaFisica(Number(idVenta));
    // El servicio lanza NotFoundError o ConflictError
    res.status(204).send(); // 204 No Content para eliminaciones físicas exitosas
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearVenta,
  listarVentas,
  obtenerVentaPorId,
  actualizarEstadoVenta, 
  anularVenta,
  habilitarVenta,
  eliminarVentaFisica,
};
