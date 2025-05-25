// src/controllers/usuario.controller.js
const usuarioService = require("../services/usuario.service.js"); // Ajusta la ruta si es necesario

/**
 * Crea un nuevo usuario.
 */
const crearUsuario = async (req, res, next) => {
  try {
    const nuevoUsuario = await usuarioService.crearUsuario(req.body);
    res.status(201).json({
      success: true,
      message: "Usuario creado exitosamente.",
      data: nuevoUsuario, // Ya viene sin contraseña desde el servicio
    });
  } catch (error) {
    next(error); // Pasa el error al manejador global
  }
};

/**
 * Obtiene una lista de todos los usuarios.
 * Permite filtrar por query params, ej. ?estado=true&idRol=1
 */
const listarUsuarios = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {};
    if (req.query.estado === "true") {
      opcionesDeFiltro.estado = true;
    } else if (req.query.estado === "false") {
      opcionesDeFiltro.estado = false;
    }
    if (req.query.idRol) {
      const idRol = Number(req.query.idRol);
      if (!isNaN(idRol) && idRol > 0) {
        opcionesDeFiltro.idRol = idRol;
      } else {
        // Opcional: enviar un error si el idRol no es válido
        // return res.status(400).json({ success: false, message: "ID de Rol inválido para el filtro."});
      }
    }

    const usuarios = await usuarioService.obtenerTodosLosUsuarios(
      opcionesDeFiltro
    );
    res.status(200).json({
      success: true,
      data: usuarios, // Ya vienen sin contraseña desde el servicio
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene un usuario específico por su ID.
 */
const obtenerUsuarioPorId = async (req, res, next) => {
  try {
    const { idUsuario } = req.params;
    const usuario = await usuarioService.obtenerUsuarioPorId(Number(idUsuario));
    // El servicio lanza NotFoundError si no se encuentra
    res.status(200).json({
      success: true,
      data: usuario, // Ya viene sin contraseña desde el servicio
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza (Edita) un usuario existente por su ID.
 */
const actualizarUsuario = async (req, res, next) => {
  try {
    const { idUsuario } = req.params;
    // No permitir que se actualice la contraseña a una cadena vacía si se envía explícitamente
    if (req.body.contrasena === "") {
      delete req.body.contrasena; // O manejar como un error de validación
    }
    const usuarioActualizado = await usuarioService.actualizarUsuario(
      Number(idUsuario),
      req.body
    );
    // El servicio lanza NotFoundError, ConflictError o BadRequestError según el caso
    res.status(200).json({
      success: true,
      message: "Usuario actualizado exitosamente.",
      data: usuarioActualizado, // Ya viene sin contraseña desde el servicio
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Anula un usuario (borrado lógico, estado = false).
 */
const anularUsuario = async (req, res, next) => {
  try {
    const { idUsuario } = req.params;
    const usuarioAnulado = await usuarioService.anularUsuario(
      Number(idUsuario)
    );
    // El servicio lanza NotFoundError si no se encuentra
    res.status(200).json({
      success: true,
      message: "Usuario anulado (deshabilitado) exitosamente.",
      data: usuarioAnulado, // Ya viene sin contraseña desde el servicio
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Habilita un usuario (estado = true).
 */
const habilitarUsuario = async (req, res, next) => {
  try {
    const { idUsuario } = req.params;
    const usuarioHabilitado = await usuarioService.habilitarUsuario(
      Number(idUsuario)
    );
    // El servicio lanza NotFoundError si no se encuentra
    res.status(200).json({
      success: true,
      message: "Usuario habilitado exitosamente.",
      data: usuarioHabilitado, // Ya viene sin contraseña desde el servicio
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina físicamente un usuario por su ID.
 */
const eliminarUsuarioFisico = async (req, res, next) => {
  try {
    const { idUsuario } = req.params;
    await usuarioService.eliminarUsuarioFisico(Number(idUsuario));
    // El servicio lanza NotFoundError o ConflictError
    res.status(204).send(); // 204 No Content para eliminaciones físicas exitosas
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearUsuario,
  listarUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  anularUsuario,
  habilitarUsuario,
  eliminarUsuarioFisico,
};
