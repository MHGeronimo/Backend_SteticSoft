// RUTA: src/shared/src_api/controllers/categoriaProducto.controller.js
const categoriaProductoService = require("../services/categoriaProducto.service.js");

/**
 * Crea una nueva categoría de producto.
 */
const crearCategoriaProducto = async (req, res, next) => {
  try {
    const nuevaCategoria =
      await categoriaProductoService.crearCategoriaProducto(req.body);
    res.status(201).json({
      success: true,
      message: "Categoría de producto creada exitosamente.",
      data: nuevaCategoria,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una lista de todas las categorías de producto.
 */
const listarCategoriasProducto = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {};
    if (req.query.estado === "true") {
      opcionesDeFiltro.estado = true;
    } else if (req.query.estado === "false") {
      opcionesDeFiltro.estado = false;
    }
    if (req.query.tipoUso) {
      opcionesDeFiltro.tipoUso = req.query.tipoUso;
    }
    const categorias =
      await categoriaProductoService.obtenerTodasLasCategoriasProducto(
        opcionesDeFiltro
      );
    res.status(200).json({
      success: true,
      data: categorias,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una categoría de producto específica por su ID.
 */
const obtenerCategoriaProductoPorId = async (req, res, next) => {
  try {
    // ✅ CORRECCIÓN: Extraer el parámetro con el nombre correcto.
    const { idCategoriaProducto } = req.params;
    const categoria =
      await categoriaProductoService.obtenerCategoriaProductoPorId(
        Number(idCategoriaProducto)
      );
    res.status(200).json({
      success: true,
      data: categoria,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza (Edita) una categoría de producto existente por su ID.
 */
const actualizarCategoriaProducto = async (req, res, next) => {
  try {
    // ✅ CORRECCIÓN: Extraer el parámetro con el nombre correcto.
    const { idCategoriaProducto } = req.params;
    const categoriaActualizada =
      await categoriaProductoService.actualizarCategoriaProducto(
        Number(idCategoriaProducto),
        req.body
      );
    res.status(200).json({
      success: true,
      message: "Categoría de producto actualizada exitosamente.",
      data: categoriaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cambia el estado (activo/inactivo) de una categoría de producto.
 */
const cambiarEstadoCategoriaProducto = async (req, res, next) => {
  try {
    // ✅ CORRECCIÓN: Extraer el parámetro con el nombre correcto.
    const { idCategoriaProducto } = req.params;
    const { estado } = req.body; // Se espera un booleano

    const categoriaActualizada =
      await categoriaProductoService.cambiarEstadoCategoriaProducto(
        Number(idCategoriaProducto),
        estado
      );
    res.status(200).json({
      success: true,
      message: `Estado de la categoría de producto ID ${idCategoriaProducto} cambiado a ${estado} exitosamente.`,
      data: categoriaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Anula una categoría de producto (borrado lógico, estado = false).
 */
const anularCategoriaProducto = async (req, res, next) => {
  try {
    // ✅ CORRECCIÓN: Extraer el parámetro con el nombre correcto.
    const { idCategoriaProducto } = req.params;
    const categoriaAnulada =
      await categoriaProductoService.anularCategoriaProducto(
        Number(idCategoriaProducto)
      );
    res.status(200).json({
      success: true,
      message: "Categoría de producto anulada (deshabilitada) exitosamente.",
      data: categoriaAnulada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Habilita una categoría de producto (estado = true).
 */
const habilitarCategoriaProducto = async (req, res, next) => {
  try {
    // ✅ CORRECCIÓN: Extraer el parámetro con el nombre correcto.
    const { idCategoriaProducto } = req.params;
    const categoriaHabilitada =
      await categoriaProductoService.habilitarCategoriaProducto(
        Number(idCategoriaProducto)
      );
    res.status(200).json({
      success: true,
      message: "Categoría de producto habilitada exitosamente.",
      data: categoriaHabilitada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina físicamente una categoría de producto por su ID.
 */
const eliminarCategoriaProductoFisica = async (req, res, next) => {
  try {
    // ✅ CORRECCIÓN: Extraer el parámetro con el nombre correcto.
    const { idCategoriaProducto } = req.params;
    await categoriaProductoService.eliminarCategoriaProductoFisica(
      Number(idCategoriaProducto)
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearCategoriaProducto,
  listarCategoriasProducto,
  obtenerCategoriaProductoPorId,
  actualizarCategoriaProducto,
  anularCategoriaProducto,
  habilitarCategoriaProducto,
  eliminarCategoriaProductoFisica,
  cambiarEstadoCategoriaProducto,
};