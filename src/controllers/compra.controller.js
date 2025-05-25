// src/controllers/compra.controller.js
const compraService = require("../services/compra.service.js"); // Ajusta la ruta si es necesario

/**
 * Crea una nueva compra.
 */
const crearCompra = async (req, res, next) => {
  try {
    const nuevaCompra = await compraService.crearCompra(req.body);
    res.status(201).json({
      success: true,
      message: "Compra creada exitosamente.",
      data: nuevaCompra,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una lista de todas las compras.
 * Permite filtrar por query params, ej. ?estado=true&proveedorId=1
 */
const listarCompras = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {};
    if (req.query.estado === "true") {
      opcionesDeFiltro.estado = true;
    } else if (req.query.estado === "false") {
      opcionesDeFiltro.estado = false;
    }
    if (req.query.proveedorId) {
      const idProveedor = Number(req.query.proveedorId);
      if (!isNaN(idProveedor) && idProveedor > 0) {
        opcionesDeFiltro.proveedorId = idProveedor;
      }
    }
    if (req.query.dashboardId) {
      const idDashboard = Number(req.query.dashboardId);
      if (!isNaN(idDashboard) && idDashboard > 0) {
        opcionesDeFiltro.dashboardId = idDashboard;
      }
    }
    // Podrías añadir más filtros (ej. rango de fechas)

    const compras = await compraService.obtenerTodasLasCompras(
      opcionesDeFiltro
    );
    res.status(200).json({
      success: true,
      data: compras,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una compra específica por su ID.
 */
const obtenerCompraPorId = async (req, res, next) => {
  try {
    const { idCompra } = req.params;
    const compra = await compraService.obtenerCompraPorId(Number(idCompra));
    res.status(200).json({
      success: true,
      data: compra,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza la cabecera o el estado de una compra existente por su ID.
 */
const actualizarCompra = async (req, res, next) => {
  try {
    const { idCompra } = req.params;
    const compraActualizada = await compraService.actualizarCompra(
      Number(idCompra),
      req.body
    );
    res.status(200).json({
      success: true,
      message: "Compra actualizada exitosamente.",
      data: compraActualizada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Anula una compra (borrado lógico, estado = false y ajusta inventario).
 */
const anularCompra = async (req, res, next) => {
  try {
    const { idCompra } = req.params;
    const compraAnulada = await compraService.anularCompra(Number(idCompra));
    res.status(200).json({
      success: true,
      message: "Compra anulada exitosamente. El inventario ha sido ajustado.",
      data: compraAnulada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Habilita una compra (estado = true y ajusta inventario).
 */
const habilitarCompra = async (req, res, next) => {
  try {
    const { idCompra } = req.params;
    const compraHabilitada = await compraService.habilitarCompra(
      Number(idCompra)
    );
    res.status(200).json({
      success: true,
      message:
        "Compra habilitada exitosamente. El inventario ha sido ajustado.",
      data: compraHabilitada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina físicamente una compra por su ID.
 * ¡ADVERTENCIA: Esto también ajusta el inventario si la compra estaba activa!
 */
const eliminarCompraFisica = async (req, res, next) => {
  try {
    const { idCompra } = req.params;
    await compraService.eliminarCompraFisica(Number(idCompra));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearCompra,
  listarCompras,
  obtenerCompraPorId,
  actualizarCompra,
  anularCompra, 
  habilitarCompra, 
  eliminarCompraFisica,
};
