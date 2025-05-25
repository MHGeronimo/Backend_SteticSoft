// src/controllers/producto.controller.js
const productoService = require("../services/producto.service.js"); // Ajusta la ruta si es necesario

/**
 * Crea un nuevo producto.
 */
const crearProducto = async (req, res, next) => {
  try {
    // Asumimos que req.body viene con claves camelCase: nombre, descripcion, categoriaProductoId, etc.
    const nuevoProducto = await productoService.crearProducto(req.body);
    res.status(201).json({
      success: true,
      message: "Producto creado exitosamente.",
      data: nuevoProducto,
    });
  } catch (error) {
    next(error); // Pasa el error al manejador global
  }
};

/**
 * Obtiene una lista de todos los productos.
 * Permite filtrar por query params, ej. ?estado=true&categoriaProductoId=1
 */
const listarProductos = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {};
    if (req.query.estado === "true") {
      opcionesDeFiltro.estado = true;
    } else if (req.query.estado === "false") {
      opcionesDeFiltro.estado = false;
    }
    if (req.query.categoriaProductoId) {
      const idCategoria = Number(req.query.categoriaProductoId);
      if (!isNaN(idCategoria) && idCategoria > 0) {
        opcionesDeFiltro.categoriaProductoId = idCategoria; // El servicio espera camelCase
      }
    }
    // Podrías añadir más filtros aquí (ej. por nombre, rango de precio)

    const productos = await productoService.obtenerTodosLosProductos(
      opcionesDeFiltro
    );
    res.status(200).json({
      success: true,
      data: productos,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene un producto específico por su ID.
 */
const obtenerProductoPorId = async (req, res, next) => {
  try {
    const { idProducto } = req.params;
    const producto = await productoService.obtenerProductoPorId(
      Number(idProducto)
    );
    // El servicio ya lanza NotFoundError si no se encuentra
    res.status(200).json({
      success: true,
      data: producto,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza (Edita) un producto existente por su ID.
 */
const actualizarProducto = async (req, res, next) => {
  try {
    const { idProducto } = req.params;
    const productoActualizado = await productoService.actualizarProducto(
      Number(idProducto),
      req.body
    );
    // El servicio ya lanza errores específicos (NotFoundError, ConflictError, BadRequestError)
    res.status(200).json({
      success: true,
      message: "Producto actualizado exitosamente.",
      data: productoActualizado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Anula un producto (borrado lógico, estado = false).
 */
const anularProducto = async (req, res, next) => {
  try {
    const { idProducto } = req.params;
    const productoAnulado = await productoService.anularProducto(
      Number(idProducto)
    );
    res.status(200).json({
      success: true,
      message: "Producto anulado (deshabilitado) exitosamente.",
      data: productoAnulado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Habilita un producto (estado = true).
 */
const habilitarProducto = async (req, res, next) => {
  try {
    const { idProducto } = req.params;
    const productoHabilitado = await productoService.habilitarProducto(
      Number(idProducto)
    );
    res.status(200).json({
      success: true,
      message: "Producto habilitado exitosamente.",
      data: productoHabilitado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina físicamente un producto por su ID.
 */
const eliminarProductoFisico = async (req, res, next) => {
  try {
    const { idProducto } = req.params;
    await productoService.eliminarProductoFisico(Number(idProducto));
    // El servicio lanza NotFoundError o ConflictError
    res.status(204).send(); // 204 No Content para eliminaciones físicas exitosas
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearProducto,
  listarProductos,
  obtenerProductoPorId,
  actualizarProducto,
  anularProducto,
  habilitarProducto,
  eliminarProductoFisico,
};
