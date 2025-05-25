// src/controllers/categoriaProducto.controller.js
const categoriaProductoService = require("../services/categoriaProducto.service.js"); // Ajusta la ruta si es necesario

/**
 * Crea una nueva categoría de producto.
 */
const crearCategoriaProducto = async (req, res, next) => {
  try {
    // Asumimos que el req.body viene con claves camelCase: nombre, descripcion, vidaUtilDias, tipoUso, estado
    const nuevaCategoria =
      await categoriaProductoService.crearCategoriaProducto(req.body);
    res.status(201).json({
      success: true,
      message: "Categoría de producto creada exitosamente.",
      data: nuevaCategoria,
    });
  } catch (error) {
    next(error); // Pasa el error al manejador global
  }
};

/**
 * Obtiene una lista de todas las categorías de producto.
 * Permite filtrar por query params, ej. ?estado=true&tipoUso=Interno
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
      // Asumiendo que el query param es tipoUso
      opcionesDeFiltro.tipoUso = req.query.tipoUso;
    }
    // Podrías añadir más filtros aquí si son necesarios

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
    const { idCategoria } = req.params;
    const categoria =
      await categoriaProductoService.obtenerCategoriaProductoPorId(
        Number(idCategoria)
      );
    // El servicio ya lanza NotFoundError si no se encuentra
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
    const { idCategoria } = req.params;
    const categoriaActualizada =
      await categoriaProductoService.actualizarCategoriaProducto(
        Number(idCategoria),
        req.body
      );
    // El servicio ya lanza errores específicos (NotFoundError, ConflictError)
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
 * Anula una categoría de producto (borrado lógico, estado = false).
 */
const anularCategoriaProducto = async (req, res, next) => {
  try {
    const { idCategoria } = req.params;
    const categoriaAnulada =
      await categoriaProductoService.anularCategoriaProducto(
        Number(idCategoria)
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
    const { idCategoria } = req.params;
    const categoriaHabilitada =
      await categoriaProductoService.habilitarCategoriaProducto(
        Number(idCategoria)
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
    const { idCategoria } = req.params;
    await categoriaProductoService.eliminarCategoriaProductoFisica(
      Number(idCategoria)
    );
    // El servicio lanza NotFoundError o ConflictError
    res.status(204).send(); // 204 No Content para eliminaciones físicas exitosas
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
};
