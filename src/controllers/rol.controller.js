// src/controllers/rol.controller.js
const rolService = require("../services/rol.service.js"); // Ajusta la ruta si es necesario

const crearRol = async (req, res, next) => {
  try {
    const nuevoRol = await rolService.crearRol(req.body);
    res.status(201).json({
      success: true,
      message: "Rol creado exitosamente.",
      data: nuevoRol,
    });
  } catch (error) {
    next(error); // Pasa el error al manejador global
  }
};

const listarRoles = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {};
    if (req.query.estado === "true") {
      opcionesDeFiltro.estado = true;
    } else if (req.query.estado === "false") {
      opcionesDeFiltro.estado = false;
    }
    const roles = await rolService.obtenerTodosLosRoles(opcionesDeFiltro);
    res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
};

const obtenerRolPorId = async (req, res, next) => {
  try {
    const { idRol } = req.params;
    const rol = await rolService.obtenerRolPorId(Number(idRol));
    // El servicio ahora lanza NotFoundError si no se encuentra
    res.status(200).json({
      success: true,
      data: rol,
    });
  } catch (error) {
    next(error);
  }
};

const actualizarRol = async (req, res, next) => {
  try {
    const { idRol } = req.params;
    const rolActualizado = await rolService.actualizarRol(
      Number(idRol),
      req.body
    );
    // El servicio ahora lanza NotFoundError o ConflictError
    res.status(200).json({
      success: true,
      message: "Rol actualizado exitosamente.",
      data: rolActualizado,
    });
  } catch (error) {
    next(error);
  }
};

const anularRol = async (req, res, next) => {
  try {
    const { idRol } = req.params;
    const rolAnulado = await rolService.anularRol(Number(idRol));
    res.status(200).json({
      success: true,
      message: "Rol anulado (deshabilitado) exitosamente.",
      data: rolAnulado,
    });
  } catch (error) {
    next(error);
  }
};

const habilitarRol = async (req, res, next) => {
  try {
    const { idRol } = req.params;
    const rolHabilitado = await rolService.habilitarRol(Number(idRol));
    res.status(200).json({
      success: true,
      message: "Rol habilitado exitosamente.",
      data: rolHabilitado,
    });
  } catch (error) {
    next(error);
  }
};

const eliminarRolFisico = async (req, res, next) => {
  try {
    const { idRol } = req.params;
    await rolService.eliminarRolFisico(Number(idRol));
    res.status(204).send(); // 204 No Content para eliminaciones físicas exitosas
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearRol,
  listarRoles,
  obtenerRolPorId,
  actualizarRol,
  anularRol,
  habilitarRol,
  eliminarRolFisico,
};
