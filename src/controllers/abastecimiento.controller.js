// src/controllers/abastecimiento.controller.js
const abastecimientoService = require("../services/abastecimiento.service.js");
const { NotFoundError } = require("../errors");
 

const crearAbastecimiento = async (req, res, next) => {
  try {
    const nuevoAbastecimiento = await abastecimientoService.crearAbastecimiento(
      req.body
    );
    res.status(201).json(nuevoAbastecimiento);
  } catch (error) {
    next(error);
  }
};


const listarAbastecimientos = async (req, res, next) => {
  try {
    const abastecimientos =
      await abastecimientoService.obtenerTodosLosAbastecimientos(req.query);
    res.status(200).json(abastecimientos);
  } catch (error) {
    next(error);
  }
};


const obtenerAbastecimientoPorId = async (req, res, next) => {
  try {
    // --- CORRECCIÓN ---
    // Usamos req.params.id para que coincida con el nombre en el archivo de rutas.
    const { id } = req.params;
    const abastecimiento = await abastecimientoService.obtenerAbastecimientoPorId(id);
    res.status(200).json(abastecimiento);
  } catch (error) {
    next(error);
  }
};


const actualizarAbastecimiento = async (req, res, next) => {
  try {
    // --- CORRECCIÓN ---
    const { id } = req.params;
    const abastecimientoActualizado =
      await abastecimientoService.actualizarAbastecimiento(
        id,
        req.body
      );
    res.status(200).json(abastecimientoActualizado);
  } catch (error) {
    next(error);
  }
};

const cambiarEstadoAbastecimiento = async (req, res, next) => {
  try {
    // --- CORRECCIÓN ---
    const { id } = req.params;
    const { estado } = req.body;
    const abastecimientoActualizado =
      await abastecimientoService.actualizarAbastecimiento(
        id,
        { estado }
      );
    res.status(200).json({
      success: true,
      message: `Estado del abastecimiento ID ${id} cambiado a ${estado}.`,
      data: abastecimientoActualizado,
    });
  } catch (error) {
    next(error);
  }
};


const eliminarAbastecimientoFisico = async (req, res, next) => {
  try {
    // --- CORRECCIÓN ---
    const { id } = req.params;
    const resultado = await abastecimientoService.eliminarAbastecimientoFisico(id);
    if (resultado === 0) {
        throw new NotFoundError(`No se encontró un abastecimiento con el ID ${id} para eliminar.`);
    }
    res.status(204).send(); // 204 No Content es una respuesta común para DELETE exitoso.
  } catch (error) {
    next(error);
  }
};

const agotarAbastecimiento = async (req, res, next) => {
  try {
    const { id } = req.params; 
    const { razon_agotamiento } = req.body;
    const abastecimientoAgotado = await abastecimientoService.agotarAbastecimiento(Number(id), razon_agotamiento);
    res.status(200).json({
      success: true,
      message: `Abastecimiento ID ${id} marcado como agotado.`,
      data: abastecimientoAgotado
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearAbastecimiento,
  listarAbastecimientos,
  obtenerAbastecimientoPorId,
  actualizarAbastecimiento,
  cambiarEstadoAbastecimiento,
  eliminarAbastecimientoFisico,
  agotarAbastecimiento,
};