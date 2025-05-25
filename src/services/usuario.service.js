// src/services/usuario.service.js
const bcrypt = require("bcrypt");
const db = require("../models"); // Ajusta la ruta a tu index.js de modelos
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors"); // Ajusta la ruta

const saltRounds = 10; // Número de rondas de sal para bcrypt (10-12 es un buen valor)

/**
 * Crear un nuevo usuario. Hashea la contraseña antes de guardarla.
 * @param {object} datosUsuario - Datos del usuario ({ correo, contrasena, idRol, estado }).
 * @returns {Promise<object>} El usuario creado (sin la contraseña).
 * @throws {ConflictError} Si el correo ya existe.
 * @throws {CustomError} Para otros errores.
 */
const crearUsuario = async (datosUsuario) => {
  const { correo, contrasena, idRol, estado } = datosUsuario;

  // La validación de unicidad de correo ya la hace el validador, pero una doble verificación no hace daño
  // o se puede confiar en la restricción de la BD y manejar el error de Sequelize.
  const usuarioExistente = await db.Usuario.findOne({ where: { correo } });
  if (usuarioExistente) {
    throw new ConflictError(
      `El correo electrónico '${correo}' ya está registrado.`
    );
  }

  // Verificar que el rol exista y esté activo (el validador también lo hace)
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

    // No devolver la contraseña hasheada (ni la original)
    const { contrasena: _, ...usuarioSinContrasena } = nuevoUsuario.toJSON();
    return usuarioSinContrasena;
  } catch (error) {
    // SequelizeUniqueConstraintError puede ocurrir si, a pesar de la verificación previa, hay una condición de carrera.
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ConflictError(
        `El correo electrónico '${correo}' ya está registrado.`
      );
    }
    console.error("Error al crear el usuario en el servicio:", error.message);
    throw new CustomError(`Error al crear el usuario: ${error.message}`, 500);
  }
};

/**
 * Obtener todos los usuarios.
 * @param {object} [opcionesDeFiltro={}] - Opciones para filtrar (ej. { estado: true, idRol: 1 }).
 * @returns {Promise<Array<object>>} Lista de usuarios (sin contraseñas).
 */
const obtenerTodosLosUsuarios = async (opcionesDeFiltro = {}) => {
  try {
    const usuarios = await db.Usuario.findAll({
      where: opcionesDeFiltro,
      attributes: { exclude: ["contrasena"] }, // Excluir la contraseña de los resultados
      include: [
        {
          model: db.Rol,
          as: "rol", // Asegúrate que este alias coincida con tu asociación
          attributes: ["idRol", "nombre"], // Solo los atributos necesarios del rol
        },
      ],
    });
    return usuarios;
  } catch (error) {
    console.error(
      "Error al obtener todos los usuarios en el servicio:",
      error.message
    );
    throw new CustomError(`Error al obtener usuarios: ${error.message}`, 500);
  }
};

/**
 * Obtener un usuario por su ID.
 * @param {number} idUsuario - ID del usuario.
 * @returns {Promise<object|null>} El usuario encontrado (sin contraseña) o null si no existe.
 */
const obtenerUsuarioPorId = async (idUsuario) => {
  try {
    const usuario = await db.Usuario.findByPk(idUsuario, {
      attributes: { exclude: ["contrasena"] },
      include: [
        {
          model: db.Rol,
          as: "rol",
          attributes: ["idRol", "nombre"],
        },
      ],
    });
    if (!usuario) {
      throw new NotFoundError("Usuario no encontrado.");
    }
    return usuario;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al obtener el usuario con ID ${idUsuario} en el servicio:`,
      error.message
    );
    throw new CustomError(`Error al obtener el usuario: ${error.message}`, 500);
  }
};

/**
 * Actualizar (Editar) un usuario existente.
 * Si se proporciona una nueva contraseña, se hashea.
 * @param {number} idUsuario - ID del usuario a actualizar.
 * @param {object} datosActualizar - Datos para actualizar ({ correo?, contrasena?, idRol?, estado? }).
 * @returns {Promise<object>} El usuario actualizado (sin contraseña).
 * @throws {NotFoundError} Si el usuario no se encuentra.
 * @throws {ConflictError} Si el nuevo correo ya existe para otro usuario.
 * @throws {BadRequestError} Si el nuevo idRol no es válido.
 */
const actualizarUsuario = async (idUsuario, datosActualizar) => {
  try {
    const usuario = await db.Usuario.findByPk(idUsuario);
    if (!usuario) {
      throw new NotFoundError("Usuario no encontrado para actualizar.");
    }

    // Si se intenta actualizar el correo, verificar que no colisione con otro usuario
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

    // Si se proporciona una nueva contraseña, hashearla
    if (datosActualizar.contrasena) {
      datosActualizar.contrasena = await bcrypt.hash(
        datosActualizar.contrasena,
        saltRounds
      );
    }

    // Si se actualiza el rol, verificar que el nuevo rol exista y esté activo
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
      // Por si acaso la validación en el if no fue suficiente
      throw new ConflictError(
        `El correo electrónico '${datosActualizar.correo}' ya está registrado por otro usuario.`
      );
    }
    console.error(
      `Error al actualizar el usuario con ID ${idUsuario} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al actualizar el usuario: ${error.message}`,
      500
    );
  }
};

/**
 * Anular un usuario (borrado lógico, establece estado = false).
 * @param {number} idUsuario - ID del usuario a anular.
 * @returns {Promise<object>} El usuario anulado (sin contraseña).
 * @throws {NotFoundError} Si el usuario no se encuentra.
 */
const anularUsuario = async (idUsuario) => {
  try {
    const usuario = await db.Usuario.findByPk(idUsuario);
    if (!usuario) {
      throw new NotFoundError("Usuario no encontrado para anular.");
    }
    if (!usuario.estado) {
      // Devolver el usuario tal cual, pero sin la contraseña
      const { contrasena: _, ...usuarioYaAnulado } = usuario.toJSON();
      return usuarioYaAnulado;
    }
    await usuario.update({ estado: false });
    const { contrasena: _, ...usuarioAnulado } = usuario.toJSON();
    return usuarioAnulado;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al anular el usuario con ID ${idUsuario} en el servicio:`,
      error.message
    );
    throw new CustomError(`Error al anular el usuario: ${error.message}`, 500);
  }
};

/**
 * Habilitar un usuario (cambia estado = true).
 * @param {number} idUsuario - ID del usuario a habilitar.
 * @returns {Promise<object>} El usuario habilitado (sin contraseña).
 * @throws {NotFoundError} Si el usuario no se encuentra.
 */
const habilitarUsuario = async (idUsuario) => {
  try {
    const usuario = await db.Usuario.findByPk(idUsuario);
    if (!usuario) {
      throw new NotFoundError("Usuario no encontrado para habilitar.");
    }
    if (usuario.estado) {
      const { contrasena: _, ...usuarioYaHabilitado } = usuario.toJSON();
      return usuarioYaHabilitado;
    }
    await usuario.update({ estado: true });
    const { contrasena: _, ...usuarioHabilitado } = usuario.toJSON();
    return usuarioHabilitado;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al habilitar el usuario con ID ${idUsuario} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al habilitar el usuario: ${error.message}`,
      500
    );
  }
};

/**
 * Eliminar un usuario físicamente de la base de datos.
 * ¡ADVERTENCIA: Esta acción es destructiva!
 * @param {number} idUsuario - ID del usuario a eliminar.
 * @returns {Promise<number>} Número de filas eliminadas.
 * @throws {NotFoundError} Si el usuario no se encuentra.
 */
const eliminarUsuarioFisico = async (idUsuario) => {
  try {
    const usuario = await db.Usuario.findByPk(idUsuario);
    if (!usuario) {
      throw new NotFoundError(
        "Usuario no encontrado para eliminar físicamente."
      );
    }
    // Considerar si hay dependencias fuertes (ej. si un Cliente no puede existir sin Usuario y la FK no es SET NULL o CASCADE)
    // O si quieres borrar registros relacionados manualmente antes (ej. Tokens de recuperación)
    // await db.TokenRecuperacion.destroy({ where: { idUsuario }}); // Ejemplo si fuera necesario

    const filasEliminadas = await db.Usuario.destroy({
      where: { idUsuario },
    });
    return filasEliminadas;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    // Manejar SequelizeForeignKeyConstraintError si el usuario está referenciado y no se puede borrar
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ConflictError(
        "No se puede eliminar el usuario porque está siendo referenciado por otras entidades (ej. Cliente). Considere anularlo."
      );
    }
    console.error(
      `Error al eliminar físicamente el usuario con ID ${idUsuario} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al eliminar físicamente el usuario: ${error.message}`,
      500
    );
  }
};

// Podrías añadir una función para buscar usuario por correo para el login,
// pero eso usualmente iría en un auth.service.js
// const encontrarUsuarioPorCorreo = async (correo) => {
//   return await db.Usuario.findOne({ where: { correo, estado: true } }); // Devuelve con contraseña para el login
// };

module.exports = {
  crearUsuario,
  obtenerTodosLosUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  anularUsuario,
  habilitarUsuario,
  eliminarUsuarioFisico,
  // encontrarUsuarioPorCorreo, // Exportar si se define aquí
};
