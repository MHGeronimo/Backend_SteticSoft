const productoService = require("../services/producto.service.js");

/** 🧩 Helper: Procesa imagen si existe */
const procesarImagenProducto = (req) =>
  req.file ? `/uploads/productos/${req.file.filename}` : undefined;

/** 🧩 Helper: Filtra productos activos */
const filtrarProductosActivos = (productos) =>
  Array.isArray(productos) ? productos.filter(p => p.estado === true) : [];

/**
 * Crea un nuevo producto.
 */
const crearProducto = async (req, res, next) => {
  console.log("📦 Payload recibido en crearProducto:", req.body);
  try {
    const datosProducto = { ...req.body };

    if (datosProducto.idCategoriaProducto && !datosProducto.categoriaProductoId) {
      datosProducto.categoriaProductoId = Number(datosProducto.idCategoriaProducto);
    }

    datosProducto.imagen = procesarImagenProducto(req);

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
    const producto = await productoService.obtenerProductoPorId(Number(idProducto));
    res.status(200).json({
      success: true,
      data: producto,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza un producto existente.
 */
const actualizarProducto = async (req, res, next) => {
  try {
    const { idProducto } = req.params;
    const datosActualizar = { ...req.body };

    if (datosActualizar.idCategoriaProducto && !datosActualizar.categoriaProductoId) {
      datosActualizar.categoriaProductoId = Number(datosActualizar.idCategoriaProducto);
    }

    datosActualizar.imagen = procesarImagenProducto(req);

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
 * Anula un producto (borrado lógico).
 */
const anularProducto = async (req, res, next) => {
  try {
    const { idProducto } = req.params;
    const productoAnulado = await productoService.anularProducto(Number(idProducto));
    res.status(200).json({
      success: true,
      message: "Producto anulado exitosamente.",
      data: productoAnulado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Habilita un producto.
 */
const habilitarProducto = async (req, res, next) => {
  try {
    const { idProducto } = req.params;
    const productoHabilitado = await productoService.habilitarProducto(Number(idProducto));
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
 * Elimina físicamente un producto.
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

/**
 * Lista productos para uso interno.
 */
const listarProductosInternos = async (req, res, next) => {
  try {
    const productos = await productoService.obtenerProductosInternos();
    res.status(200).json({
      success: true,
      data: productos,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lista productos activos para la landing pública.
 */
const listarProductosPublicos = async (req, res, next) => {
  try {
    console.log("🔍 Entrando a listarProductosPublicos");

    const resultado = await productoService.obtenerTodosLosProductos({
      tipoUso: "Externo",
    });

    const listaProductos = Array.isArray(resultado)
      ? resultado
      : resultado?.productos || [];

    const productosPublicos = filtrarProductosActivos(listaProductos).map(p => ({
      id: p.idProducto,
      nombre: p.nombre || "Sin nombre",
      description: p.descripcion || "Sin descripción",
      categoria: p.categoria || "Sin categoría",
      price: p.precio ?? 0,
      imagenURL: p.imagen || "/img/default-producto.png"
    }));

    console.log("🧾 Productos públicos listos para enviar:", productosPublicos.length);

    res.status(200).json({
      success: true,
      data: productosPublicos,
    });
  } catch (error) {
    console.error("❌ Error al listar productos públicos:", error);
    next(error);
  }
};

/**
 * Lista productos activos para el flujo de compra.
 */
const listarProductosParaCompra = async (req, res, next) => {
  try {
    const productos = await productoService.obtenerTodosLosProductos();
    const productosActivos = filtrarProductosActivos(productos);

    const resultado = productosActivos.map(p => ({
      idProducto: p.idProducto,
      nombre: p.nombre,
      precio: p.precio,
      descuento: p.descuento,
      categoria: p.categoriaProducto?.nombre || "Sin categoría"
    }));

    res.status(200).json({
      success: true,
      data: resultado
    });
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
  listarProductosInternos,
  listarProductosPublicos,
  listarProductosParaCompra
};
