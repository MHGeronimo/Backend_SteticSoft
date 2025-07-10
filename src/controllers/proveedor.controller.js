// src/controllers/proveedor.controller.js
const proveedorService = require("../services/proveedor.service.js");

/**
 * Crea un nuevo proveedor.
 */
const crearProveedor = async (req, res, next) => {
  try {
    const nuevoProveedor = await proveedorService.crearProveedor(req.body);
    res.status(201).json({
      success: true,
      message: "Proveedor creado exitosamente.",
      data: nuevoProveedor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una lista de todos los proveedores.
 */
const listarProveedores = async (req, res, next) => {
  try {
    // --- LÓGICA DE FILTROS Y BÚSQUEDA ---
    const opciones = {};
    if (req.query.estado) {
      opciones.estado = req.query.estado === 'true';
    }
    if (req.query.tipo) {
      opciones.tipo = req.query.tipo;
    }
    if (req.query.busqueda) { // Nuevo parámetro de búsqueda
      opciones.busqueda = req.query.busqueda;
    }
    // --- FIN DE LÓGICA ---

    const proveedores = await proveedorService.obtenerTodosLosProveedores(opciones);
    res.status(200).json({
      success: true,
      data: proveedores,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene un proveedor específico por su ID.
 */
const obtenerProveedorPorId = async (req, res, next) => {
  try {
    const { idProveedor } = req.params;
    const proveedor = await proveedorService.obtenerProveedorPorId(
      Number(idProveedor)
    );
    res.status(200).json({
      success: true,
      data: proveedor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza (Edita) un proveedor existente por su ID.
 */
const actualizarProveedor = async (req, res, next) => {
  try {
    const { idProveedor } = req.params;
    const proveedorActualizado = await proveedorService.actualizarProveedor(
      Number(idProveedor),
      req.body
    );
    res.status(200).json({
      success: true,
      message: "Proveedor actualizado exitosamente.",
      data: proveedorActualizado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cambia el estado (activo/inactivo) de un proveedor.
 */
const cambiarEstadoProveedor = async (req, res, next) => {
  try {
    const { idProveedor } = req.params;
    const { estado } = req.body; // Se espera un booleano

    const proveedorActualizado = await proveedorService.cambiarEstadoProveedor(
      Number(idProveedor),
      estado
    );
    res.status(200).json({
      success: true,
      message: `Estado del proveedor ID ${idProveedor} cambiado a ${estado} exitosamente.`,
      data: proveedorActualizado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Anula un proveedor (borrado lógico, estado = false).
 */
const anularProveedor = async (req, res, next) => {
  try {
    const { idProveedor } = req.params;
    const proveedorAnulado = await proveedorService.anularProveedor(
      Number(idProveedor)
    );
    res.status(200).json({
      success: true,
      message: "Proveedor anulado (deshabilitado) exitosamente.",
      data: proveedorAnulado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Habilita un proveedor (estado = true).
 */
const habilitarProveedor = async (req, res, next) => {
  try {
    const { idProveedor } = req.params;
    const proveedorHabilitado = await proveedorService.habilitarProveedor(
      Number(idProveedor)
    );
    res.status(200).json({
      success: true,
      message: "Proveedor habilitado exitosamente.",
      data: proveedorHabilitado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina físicamente un proveedor por su ID.
 */
const eliminarProveedorFisico = async (req, res, next) => {
  try {
    const { idProveedor } = req.params;
    await proveedorService.eliminarProveedorFisico(Number(idProveedor));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * Verifica si uno o más campos únicos ya existen en la base de datos.
 * Diseñado para validación asíncrona desde el frontend.
 */
const verificarUnicidad = async (req, res, next) => {
  try {
    // El frontend enviará un cuerpo como { correo: '...', numeroDocumento: '...' }
    // El servicio se encargará de la lógica de búsqueda.
    const errors = await proveedorService.verificarDatosUnicos(req.body, req.params.idProveedor || null);
    if (Object.keys(errors).length > 0) {
      // Si hay errores (datos ya existen), devolvemos un 409 Conflict.
      return res.status(409).json({
        success: false,
        message: "Uno o más campos ya están registrados.",
        errors: errors,
      });
    }
    // Si no hay errores, devolvemos un 200 OK.
    res.status(200).json({ success: true, message: "Los datos están disponibles." });
  } catch (error) {
    next(error);
  }
};

// --- CORRECCIÓN AQUÍ ---
// Aseguramos que la nueva función `verificarUnicidad` esté incluida en las exportaciones.
module.exports = {
  crearProveedor,
  listarProveedores: listarProveedores, // Nombre corregido para consistencia
  obtenerProveedorPorId,
  actualizarProveedor,
  anularProveedor,
  habilitarProveedor,
  eliminarProveedorFisico,
  cambiarEstadoProveedor,
  verificarUnicidad, // <-- AÑADIDO A LA EXPORTACIÓN
};