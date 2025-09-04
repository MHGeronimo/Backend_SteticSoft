const productoService = require("../services/producto.service.js");

/**
 * Crea un nuevo producto.
 */
const crearProducto = async (req, res, next) => {
  console.log("📦 Payload recibido en crearProducto:", req.body);
  try {
    const datosProducto = { ...req.body };

    // ✅ Mapear idCategoriaProducto → categoriaProductoId
    if (datosProducto.idCategoriaProducto && !datosProducto.categoriaProductoId) {
      datosProducto.categoriaProductoId = Number(datosProducto.idCategoriaProducto);
    }

    // Si se subió un archivo, multer nos deja la info en req.file
    if (req.file) {
      // Guardamos solo la ruta relativa
      datosProducto.imagen = `/uploads/productos/${req.file.filename}`;
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

    // ✅ Mapear idCategoriaProducto → categoriaProductoId
    if (datosActualizar.idCategoriaProducto && !datosActualizar.categoriaProductoId) {
      datosActualizar.categoriaProductoId = Number(datosActualizar.idCategoriaProducto);
    }

    if (req.file) {
      datosActualizar.imagen = `/uploads/productos/${req.file.filename}`;
      // Opcional: Aquí podrías borrar la imagen anterior si lo deseas.
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

/**
 * Obtiene una lista de productos para uso interno.
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
 * Obtiene una lista de productos activos para mostrar en la landing pública.
 */
const listarProductosPublicos = async (req, res, next) => {
  try {
    console.log("🔍 Entrando a listarProductosPublicos");

    const resultado = await productoService.obtenerTodosLosProductos();
    console.log("📥 Resultado crudo de productoService:", resultado);

    // 🛡️ Lógica defensiva para asegurar que trabajamos con un array
    const listaProductos = Array.isArray(resultado)
      ? resultado
      : resultado?.productos || [];

    console.log("📦 Lista de productos procesada:", listaProductos.length, "items");

    // 🔍 Filtrar productos cuyo estado sea `true` (activo).
    const productosPublicos = listaProductos
      .filter(p => {
        const esActivo = p.estado === true;
        console.log(`🔎 Producto ID ${p.idProducto} estado: ${p.estado} → ${esActivo ? "✅ incluido" : "❌ excluido"}`);
        return esActivo;
      })
      .map(p => ({
        id: p.idProducto,
        nombre: p.nombre,
        description: p.descripcion,
        categoria: p.categoria,
        price: p.precio,
        imagenURL: p.imagen
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
  listarProductosPublicos
};
