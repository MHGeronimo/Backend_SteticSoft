const productoService = require("../services/producto.service.js");

/**
 * Crea un nuevo producto.
 */
const crearProducto = async (req, res, next) => {
  try {
    // Se extraen los datos del cuerpo de la solicitud.
    const datosProducto = { ...req.body };

    // Si se subió un archivo, 'req.file' existirá gracias a multer.
    if (req.file) {
      // Se construye la URL completa y accesible para la imagen.
      // Esto asume que la carpeta 'public' se sirve estáticamente.
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      // La ruta de la imagen será, por ejemplo: http://localhost:3000/uploads/productos/producto-1678886400000.jpg
      datosProducto.imagen = `${baseUrl}/uploads/productos/${req.file.filename}`;
    }

    const nuevoProducto = await productoService.crearProducto(datosProducto);
    res.status(201).json({
      success: true,
      message: "Producto creado exitosamente.",
      data: nuevoProducto,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una lista de todos los productos.
 */
const listarProductos = async (req, res, next) => {
  try {
    // Se pasan directamente los filtros de la query al servicio.
    const productos = await productoService.obtenerTodosLosProductos(req.query);
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
    const datosActualizar = { ...req.body };

    // Lógica similar para la actualización de la imagen.
    if (req.file) {
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        datosActualizar.imagen = `${baseUrl}/uploads/productos/${req.file.filename}`;
    }

    const productoActualizado = await productoService.actualizarProducto(
      Number(idProducto),
      datosActualizar
    );
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
 * Cambia el estado (activo/inactivo) de un producto.
 */
const cambiarEstadoProducto = async (req, res, next) => {
  try {
    const { idProducto } = req.params;
    const { estado } = req.body;

    const productoActualizado = await productoService.cambiarEstadoProducto(
      Number(idProducto),
      estado
    );
    res.status(200).json({
      success: true,
      message: `Estado del producto ID ${idProducto} cambiado a ${estado} exitosamente.`,
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
    res.status(204).send();
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
  cambiarEstadoProducto,
};