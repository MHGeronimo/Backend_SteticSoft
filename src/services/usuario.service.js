// src/services/usuario.service.js
const bcrypt = require("bcrypt");
const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");

const saltRounds = 10;

/**
 * Helper interno para cambiar el estado de un usuario.
 * @param {number} idUsuario - ID del usuario.
 * @param {boolean} nuevoEstado - El nuevo estado (true para habilitar, false para anular).
 * @returns {Promise<object>} El usuario con el estado cambiado (sin contraseña).
 */
const cambiarEstadoUsuario = async (idUsuario, nuevoEstado) => {
  const usuario = await db.Usuario.findByPk(idUsuario);
  if (!usuario) {
    throw new NotFoundError("Usuario no encontrado para cambiar estado.");
  }
  if (usuario.estado === nuevoEstado) {
    const { contrasena: _, ...usuarioSinCambio } = usuario.toJSON();
    return usuarioSinCambio; // Ya está en el estado deseado
  }
  await usuario.update({ estado: nuevoEstado });
  const { contrasena: _, ...usuarioActualizado } = usuario.toJSON();
  return usuarioActualizado;
};

/**
 * Crear un nuevo usuario.
 */
const crearUsuario = async (datosUsuario) => {
  const { correo, contrasena, idRol, estado } = datosUsuario;

  const usuarioExistente = await db.Usuario.findOne({ where: { correo } });
  if (usuarioExistente) {
    throw new ConflictError(
      `El correo electrónico '${correo}' ya está registrado.`
    );
  }

  const rol = await db.Rol.findOne({ where: { idRol, estado: true } });
  if (!rol) {
    throw new BadRequestError(
      `El rol con ID ${idRol} no existe o no está activo.`
    );
  }

  try {
    const contrasenaHasheada = await bcrypt.hash(contrasena, saltRounds);

    const nuevoUsuario = await db.Usuario.create({
      correo,
      contrasena: contrasenaHasheada,
      idRol,
      estado: typeof estado === "boolean" ? estado : true,
    });

    const { contrasena: _, ...usuarioSinContrasena } = nuevoUsuario.toJSON();
    return usuarioSinContrasena;
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ConflictError(
        `El correo electrónico '${correo}' ya está registrado.`
      );
    }
    // console.error("Error al crear el usuario en el servicio:", error.message); // Comentado según solicitud previa
    throw new CustomError(`Error al crear el usuario: ${error.message}`, 500);
  }
};

/**
 * Obtener todos los usuarios con su rol y perfil de Cliente asociado.
 */
const obtenerTodosLosUsuarios = async (opcionesDeFiltro = {}) => {
  try {
    const usuarios = await db.Usuario.findAll({
      where: opcionesDeFiltro,
      attributes: ["idUsuario", "correo", "estado", "idRol"], // Campos explícitos de la tabla Usuario
      include: [
        {
          model: db.Rol,
          as: "rol", // Alias definido en Usuario.model.js
          attributes: ["idRol", "nombre"], // Campos que quieres del Rol
        },
        {
          model: db.Cliente,
          as: "clienteInfo", // Alias definido en Usuario.model.js
          attributes: [ // Campos que quieres del Cliente
            "idCliente",
            "nombre",
            "apellido",
            "telefono",
            "tipoDocumento",
            "numeroDocumento",
            "fechaNacimiento",
            // 'estado' del cliente podría ser redundante si el 'estado' principal es el del Usuario
          ],
          required: false, // Importante: usa LEFT JOIN para traer usuarios aunque no tengan perfil de Cliente
        },
        // NOTA: Para incluir "empleadoInfo", primero necesitarías definir la asociación
        // en Usuario.model.js y asegurar que la tabla Empleado tenga un idUsuario.
        // {
        //   model: db.Empleado,
        //   as: "empleadoInfo",
        //   attributes: [/* ... */],
        //   required: false,
        // },
      ],
      order: [["idUsuario", "ASC"]], // Opcional: para ordenar los resultados
    });
    return usuarios;
  } catch (error) {
    // console.error( // Comentado según solicitud previa
    //   "Error al obtener todos los usuarios en el servicio:",
    //   error.message
    // );
    throw new CustomError(`Error al obtener usuarios: ${error.message}`, 500);
  }
};

/**
 * Obtener un usuario por su ID, incluyendo su rol y perfil de Cliente.
 */
const obtenerUsuarioPorId = async (idUsuario) => {
  try {
    const usuario = await db.Usuario.findByPk(idUsuario, {
      attributes: ["idUsuario", "correo", "estado", "idRol"], // Campos explícitos de la tabla Usuario
      include: [
        {
          model: db.Rol,
          as: "rol", // Alias definido en Usuario.model.js
          attributes: ["idRol", "nombre"],
        },
        {
          model: db.Cliente,
          as: "clienteInfo", // Alias definido en Usuario.model.js
          attributes: [
            "idCliente",
            "nombre",
            "apellido",
            "telefono",
            "tipoDocumento",
            "numeroDocumento",
            "fechaNacimiento",
          ],
          required: false, // LEFT JOIN
        },
        // NOTA: Incluir "empleadoInfo" seguiría la misma lógica que en obtenerTodosLosUsuarios
        // {
        //   model: db.Empleado,
        //   as: "empleadoInfo",
        //   attributes: [/* ... */],
        //   required: false,
        // },
      ],
    });
    if (!usuario) {
      throw new NotFoundError("Usuario no encontrado.");
    }
    return usuario;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    // console.error( // Comentado según solicitud previa
    //   `Error al obtener el usuario con ID ${idUsuario} en el servicio:`,
    //   error.message
    // );
    throw new CustomError(`Error al obtener el usuario: ${error.message}`, 500);
  }
};

/**
 * Actualizar (Editar) un usuario existente.
 * NOTA: Esta función actualmente solo actualiza la tabla Usuario.
 * Para actualizar el perfil (Cliente/Empleado) necesitaría lógica adicional.
 */
const actualizarUsuario = async (idUsuario, datosActualizar) => {
  try {
    const usuario = await db.Usuario.findByPk(idUsuario);
    if (!usuario) {
      throw new NotFoundError("Usuario no encontrado para actualizar.");
    }

    // Lógica para validar correo, contraseña y rol (sin cambios respecto a tu original)
    if (datosActualizar.correo && datosActualizar.correo !== usuario.correo) {
      const usuarioConMismoCorreo = await db.Usuario.findOne({
        where: {
          correo: datosActualizar.correo,
          idUsuario: { [Op.ne]: idUsuario },
        },
      });
      if (usuarioConMismoCorreo) {
        throw new ConflictError(
          `El correo electrónico '${datosActualizar.correo}' ya está registrado por otro usuario.`
        );
      }
    }

    if (datosActualizar.contrasena) {
      datosActualizar.contrasena = await bcrypt.hash(
        datosActualizar.contrasena,
        saltRounds
      );
    }

    if (datosActualizar.idRol && datosActualizar.idRol !== usuario.idRol) {
      const rolNuevo = await db.Rol.findOne({
        where: { idRol: datosActualizar.idRol, estado: true },
      });
      if (!rolNuevo) {
        throw new BadRequestError(
          `El nuevo rol con ID ${datosActualizar.idRol} no existe o no está activo.`
        );
      }
    }
    // FIN Lógica de validación

    // Actualizar solo la tabla Usuario (como estaba en tu código original)
    // Si `datosActualizar` también contiene campos del perfil (ej. `datosActualizar.nombre`),
    // se necesitaría lógica adicional aquí para actualizar el modelo Cliente/Empleado asociado.
    await usuario.update(datosActualizar);
    const { contrasena: _, ...usuarioActualizadoSinContrasena } =
      usuario.toJSON();
    return usuarioActualizadoSinContrasena;
  } catch (error) {
    if (
      error instanceof NotFoundError ||
      error instanceof ConflictError ||
      error instanceof BadRequestError
    )
      throw error;
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ConflictError(
        `El correo electrónico '${datosActualizar.correo}' ya está registrado por otro usuario.`
      );
    }
    // console.error( // Comentado según solicitud previa
    //   `Error al actualizar el usuario con ID ${idUsuario} en el servicio:`,
    //   error.message
    // );
    throw new CustomError(
      `Error al actualizar el usuario: ${error.message}`,
      500
    );
  }
};

/**
 * Anular un usuario (borrado lógico, establece estado = false).
 */
const anularUsuario = async (idUsuario) => {
  try {
    return await cambiarEstadoUsuario(idUsuario, false);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    // console.error( // Comentado según solicitud previa
    //   `Error al anular el usuario con ID ${idUsuario} en el servicio:`,
    //   error.message
    // );
    throw new CustomError(`Error al anular el usuario: ${error.message}`, 500);
  }
};

/**
 * Habilitar un usuario (cambia estado = true).
 */
const habilitarUsuario = async (idUsuario) => {
  try {
    return await cambiarEstadoUsuario(idUsuario, true);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    // console.error( // Comentado según solicitud previa
    //   `Error al habilitar el usuario con ID ${idUsuario} en el servicio:`,
    //   error.message
    // );
    throw new CustomError(
      `Error al habilitar el usuario: ${error.message}`,
      500
    );
  }
};

/**
 * Eliminar un usuario físicamente de la base de datos.
 */
const eliminarUsuarioFisico = async (idUsuario) => {
  try {
    const usuario = await db.Usuario.findByPk(idUsuario);
    if (!usuario) {
      throw new NotFoundError(
        "Usuario no encontrado para eliminar físicamente."
      );
    }
    const filasEliminadas = await db.Usuario.destroy({
      where: { idUsuario },
    });
    return filasEliminadas;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ConflictError(
        "No se puede eliminar el usuario porque está siendo referenciado por otras entidades (ej. Cliente). Considere anularlo."
      );
    }
    // console.error( // Comentado según solicitud previa
    //   `Error al eliminar físicamente el usuario con ID ${idUsuario} en el servicio:`,
    //   error.message
    // );
    throw new CustomError(
      `Error al eliminar físicamente el usuario: ${error.message}`,
      500
    );
  }
};

module.exports = {
  crearUsuario,
  obtenerTodosLosUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  anularUsuario,
  habilitarUsuario,
  eliminarUsuarioFisico,
  cambiarEstadoUsuario,
};