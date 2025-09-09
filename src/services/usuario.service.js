// src/services/usuario.service.js

const bcrypt = require("bcrypt");
const db = require("../models"); // Correcto: Todos los modelos están en el objeto 'db'
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");

const saltRounds = 10;

/**
 * Internal helper to change a user's status.
 */
const cambiarEstadoUsuario = async (idUsuario, nuevoEstado) => {
  const usuarioIdNumerico = Number(idUsuario);
  if (isNaN(usuarioIdNumerico)) {
    throw new BadRequestError(
      "El ID de usuario proporcionado no es un número válido para cambiar estado."
    );
  }
  const usuario = await db.Usuario.findByPk(usuarioIdNumerico);
  if (!usuario) {
    throw new NotFoundError(
      `Usuario con ID ${usuarioIdNumerico} no encontrado para cambiar estado.`
    );
  }

  // Protección para el rol de Administrador
  const rolAdmin = await db.Rol.findOne({ where: { nombre: "Administrador" } });
  if (rolAdmin && usuario.idRol === rolAdmin.idRol && nuevoEstado === false) {
    throw new CustomError(
      "El estado del usuario Administrador no puede ser cambiado a inactivo.",
      403
    );
  }

  if (usuario.estado === nuevoEstado) {
    const { contrasena: _, ...usuarioSinCambio } = usuario.toJSON();
    return usuarioSinCambio;
  }

  const t = await db.sequelize.transaction();
  try {
    await usuario.update({ estado: nuevoEstado }, { transaction: t });

    // Actualizar estado del perfil asociado si existe
    const rol = await db.Rol.findByPk(usuario.idRol, { transaction: t });
    if (rol) {
      const perfilData = { estado: nuevoEstado };
      const commonWhere = { idUsuario: usuarioIdNumerico };
      // Verificamos si el perfil existe antes de intentar actualizarlo
      if (rol.tipoPerfil !== "CLIENTE" && rol.tipoPerfil !== "EMPLEADO") {
        await t.rollback();
        throw new CustomError(
          `El tipo de perfil '${rol.tipoPerfil}' no es válido para actualizar estado.`,
          400
        );
      }
      // Solo dependemos de tipoPerfil
      if (rol.tipoPerfil === "CLIENTE") {
        const cliente = await db.Cliente.findOne({
          where: commonWhere,
          transaction: t,
        });
        if (cliente) await cliente.update(perfilData, { transaction: t });
      } else if (rol.tipoPerfil === "EMPLEADO") {
        const empleado = await db.Empleado.findOne({
          where: commonWhere,
          transaction: t,
        });
        if (empleado) await empleado.update(perfilData, { transaction: t });
      }
    }
    await t.commit();
    const { contrasena: _, ...usuarioActualizado } = usuario.toJSON();
    return usuarioActualizado;
  } catch (error) {
    await t.rollback();
    console.error(
      `[usuario.service.js] Error al cambiar estado del usuario ${usuarioIdNumerico}:`,
      error
    );
    throw new CustomError(
      `Error al cambiar el estado del usuario: ${error.message}`,
      500
    );
  }
};

// --- INICIO DE CORRECCIÓN ---

/**
 * @function crearUsuario
 * @description Crea un nuevo usuario, su perfil asociado (Cliente o Empleado) según el tipo de rol,
 * y devuelve el objeto completo del usuario con sus asociaciones.
 * @param {object} usuarioData - Datos del usuario y su perfil.
 * @returns {Promise<object>} El objeto del usuario recién creado con todas sus relaciones.
 */
const crearUsuario = async (usuarioData) => {
  const {
    correo,
    contrasena,
    idRol,
    nombre,
    apellido,
    telefono,
    tipoDocumento,
    numeroDocumento,
    fechaNacimiento,
    direccion, // Añadido para capturar la dirección
    estado,
  } = usuarioData;

  const rolIdNumerico = Number(idRol);
  if (isNaN(rolIdNumerico)) {
    throw new BadRequestError(
      "El ID del rol proporcionado no es un número válido."
    );
  }

  const rol = await db.Rol.findOne({
    where: { idRol: rolIdNumerico, estado: true },
  });
  if (!rol) {
    console.error(
      `[usuario.service.js] Rol no encontrado o inactivo para idRol: ${rolIdNumerico}`
    );
    throw new NotFoundError(
      `El rol especificado con ID ${rolIdNumerico} no existe o no está activo.`
    );
  }

  if (rol.nombre === "Administrador") {
    const adminExistente = await db.Usuario.findOne({
      where: { idRol: rolIdNumerico },
    });
    if (adminExistente) {
      throw new ConflictError(
        "Ya existe un usuario Administrador. No se pueden crear más con este rol."
      );
    }
  }

  const t = await db.sequelize.transaction();
  try {
    const usuarioExistenteCorreo = await db.Usuario.findOne({
      where: { correo },
      transaction: t,
    });
    if (usuarioExistenteCorreo) {
      await t.rollback();
      throw new ConflictError("El correo electrónico ya está registrado.");
    }

    // Solo dependemos de tipoPerfil
    const requierePerfil = ["CLIENTE", "EMPLEADO"].includes(rol.tipoPerfil);

    if (requierePerfil && numeroDocumento) {
      if (rol.tipoPerfil === "CLIENTE") {
        const clienteExistente = await db.Cliente.findOne({
          where: { numeroDocumento },
          transaction: t,
        });
        if (clienteExistente) {
          await t.rollback();
          throw new ConflictError(
            "El número de documento ya está registrado para un cliente."
          );
        }
      } else if (rol.tipoPerfil === "EMPLEADO") {
        const empleadoExistente = await db.Empleado.findOne({
          where: { numeroDocumento },
          transaction: t,
        });
        if (empleadoExistente) {
          await t.rollback();
          throw new ConflictError(
            "El número de documento ya está registrado para un empleado."
          );
        }
      }
    }

    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(contrasena, salt);

    const nuevoUsuario = await db.Usuario.create(
      {
        correo,
        contrasena: hashedPassword,
        idRol: rolIdNumerico,
        estado: typeof estado === "boolean" ? estado : true,
      },
      { transaction: t }
    );

    if (requierePerfil) {
      const perfilData = {
        nombre,
        apellido,
        telefono,
        correo: nuevoUsuario.correo,
        tipoDocumento,
        numeroDocumento,
        fechaNacimiento,
        idUsuario: nuevoUsuario.idUsuario, // CORRECCIÓN: Usar 'idUsuario' para coincidir con el modelo Sequelize
        estado: nuevoUsuario.estado,
      };

      if (rol.tipoPerfil === "CLIENTE") {
        // Validación para Cliente, incluyendo la dirección
        if (
          !nombre ||
          !apellido ||
          !telefono ||
          !tipoDocumento ||
          !numeroDocumento ||
          !fechaNacimiento ||
          !direccion // La dirección es obligatoria para clientes
        ) {
          await t.rollback();
          throw new BadRequestError(
            "Para el perfil CLIENTE, todos los campos de perfil, incluida la dirección, son requeridos."
          );
        }
        // Añadir dirección a los datos del perfil
        perfilData.direccion = direccion;
        await db.Cliente.create(perfilData, { transaction: t });
      } else if (rol.tipoPerfil === "EMPLEADO") {
        if (
          !nombre ||
          !apellido ||
          !telefono ||
          !tipoDocumento ||
          !numeroDocumento ||
          !fechaNacimiento
        ) {
          await t.rollback();
          throw new BadRequestError(
            "Para el perfil EMPLEADO, los campos de perfil (nombre, apellido, teléfono, tipo/número de documento, fecha de nacimiento) son requeridos."
          );
        }
        await db.Empleado.create(perfilData, { transaction: t });
      }
    }

    await t.commit();

    const usuarioCompleto = await db.Usuario.findByPk(nuevoUsuario.idUsuario, {
      include: [
        { model: db.Rol, as: "rol" },
        { model: db.Cliente, as: "clienteInfo" },
        { model: db.Empleado, as: "empleadoInfo" },
      ],
      attributes: { exclude: ["contrasena"] },
    });

    return usuarioCompleto;
  } catch (error) {
    await t.rollback();
    console.error(
      "[usuario.service.js] Error al crear el usuario:",
      error.message,
      error.stack
    );
    if (
      error instanceof NotFoundError ||
      error instanceof ConflictError ||
      error instanceof BadRequestError ||
      error instanceof CustomError
    ) {
      throw error;
    }
    throw new CustomError(
      `Error en el servicio al crear usuario: ${error.message}`,
      500
    );
  }
};

/**
 * Verifica si un correo electrónico ya existe.
 * @param {string} correo El correo a verificar.
 * @returns {Promise<boolean>} True si el correo existe, false en caso contrario.
 */
const verificarCorreoExistente = async (correo) => {
  if (!correo) {
    throw new BadRequestError("El correo es requerido para la verificación.");
  }
  try {
    const usuario = await db.Usuario.findOne({ where: { correo } });
    return !!usuario; // Devuelve true si el usuario existe, false si no
  } catch (error) {
    console.error(
      "[usuario.service.js] Error al verificar correo existente:",
      error
    );
    throw new CustomError("Error al verificar la existencia del correo.", 500);
  }
};

/**
 * Obtiene todos los usuarios con su rol y perfil asociado (Cliente/Empleado).
 */
const obtenerTodosLosUsuarios = async (opcionesDeFiltro = {}) => {
  try {
    const { rol, ...filtrosUsuario } = opcionesDeFiltro;

    const includeOptions = [
      {
        model: db.Rol,
        as: "rol",
        attributes: ["idRol", "nombre", "tipoPerfil"],
      },
      {
        model: db.Cliente,
        as: "clienteInfo",
        required: false,
      },
      {
        model: db.Empleado,
        as: "empleadoInfo",
        required: false,
      },
    ];

    if (rol) {
      includeOptions[0].where = { nombre: rol };
    }

    const usuarios = await db.Usuario.findAll({
      where: filtrosUsuario,
      attributes: ["idUsuario", "correo", "estado", "idRol"],
      include: includeOptions,
      order: [["idUsuario", "ASC"]],
    });
    return usuarios;
  } catch (error) {
    throw new CustomError(
      `Error al obtener los usuarios: ${error.message}`,
      500
    );
  }
};

/**
 * Obtiene un usuario por su ID, incluyendo su rol y perfil (Cliente/Empleado).
 */
const obtenerUsuarioPorId = async (idUsuario) => {
  try {
    const usuario = await db.Usuario.findByPk(idUsuario, {
      attributes: { exclude: ["contrasena"] },
      include: [
        {
          model: db.Rol,
          as: "rol",
          attributes: ["idRol", "nombre", "tipoPerfil"],
        },
        { model: db.Cliente, as: "clienteInfo", required: false },
        { model: db.Empleado, as: "empleadoInfo", required: false },
      ],
    });
    if (!usuario) {
      throw new NotFoundError("Usuario no encontrado.");
    }
    return usuario;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new CustomError(`Error al obtener el usuario: ${error.message}`, 500);
  }
};

/**
 * Actualiza un usuario existente y su perfil asociado.
 */
const actualizarUsuario = async (idUsuario, datosActualizar) => {
  const t = await db.sequelize.transaction();
  try {
    const usuario = await db.Usuario.findByPk(idUsuario, {
      include: [{ model: db.Rol, as: "rol" }],
      transaction: t,
    });
    if (!usuario) {
      await t.rollback();
      throw new NotFoundError("Usuario no encontrado para actualizar.");
    }

    const { contrasena, correo, idRol, estado, ...datosPerfil } =
      datosActualizar;

    // Actualizar datos del usuario
    if (correo && correo !== usuario.correo) {
      const existe = await db.Usuario.findOne({
        where: { correo, idUsuario: { [Op.ne]: idUsuario } },
        transaction: t,
      });
      if (existe) {
        await t.rollback();
        throw new ConflictError(
          `El correo electrónico '${correo}' ya está registrado.`
        );
      }
      usuario.correo = correo;
      if (datosPerfil.correo === undefined) datosPerfil.correo = correo; // Sincronizar correo en perfil
    }

    if (contrasena) {
      usuario.contrasena = await bcrypt.hash(contrasena, saltRounds);
    }
    if (idRol !== undefined) usuario.idRol = idRol;
    if (estado !== undefined) usuario.estado = estado;

    await usuario.save({ transaction: t });

    // Actualizar datos del perfil si existen
    if (Object.keys(datosPerfil).length > 0) {
      const tipoPerfil = usuario.rol.tipoPerfil;
      let profileModel;
      if (tipoPerfil === "CLIENTE") profileModel = db.Cliente;
      else if (tipoPerfil === "EMPLEADO") profileModel = db.Empleado;

      if (profileModel) {
        const perfil = await profileModel.findOne({
          where: { idUsuario },
          transaction: t,
        });
        if (perfil) {
          await perfil.update(datosPerfil, { transaction: t });
        }
      }
    }

    await t.commit();
    return obtenerUsuarioPorId(idUsuario);
  } catch (error) {
    await t.rollback();
    if (
      error instanceof NotFoundError ||
      error instanceof ConflictError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    throw new CustomError(
      `Error al actualizar el usuario: ${error.message}`,
      500
    );
  }
};

/**
 * Desactiva un usuario (borrado lógico, estado = false).
 */
const anularUsuario = async (idUsuario) => {
  try {
    return await cambiarEstadoUsuario(idUsuario, false);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new CustomError(
      `Error al anular (desactivar) el usuario: ${error.message}`,
      500
    );
  }
};

/**
 * Activa un usuario (cambia su estado a true).
 */
const habilitarUsuario = async (idUsuario) => {
  try {
    return await cambiarEstadoUsuario(idUsuario, true);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new CustomError(
      `Error al habilitar el usuario: ${error.message}`,
      500
    );
  }
};

/**
 * Elimina físicamente un usuario de la base de datos.
 */
const eliminarUsuarioFisico = async (idUsuario) => {
  const t = await db.sequelize.transaction();
  try {
    const usuario = await db.Usuario.findByPk(idUsuario, { transaction: t });
    if (!usuario) {
      await t.rollback();
      throw new NotFoundError(
        "Usuario no encontrado para eliminar físicamente."
      );
    }

    // La eliminación en cascada de la base de datos se encargará de los perfiles
    // si las restricciones ON DELETE CASCADE están definidas en la migración.
    // Si no, se debe eliminar manualmente como se hacía antes.
    // Por seguridad, mantenemos la eliminación manual explícita.

    const rol = await db.Rol.findByPk(usuario.idRol, { transaction: t });
    if (rol) {
      if (rol.tipoPerfil === "CLIENTE") {
        await db.Cliente.destroy({ where: { idUsuario }, transaction: t });
      } else if (rol.tipoPerfil === "EMPLEADO") {
        await db.Empleado.destroy({ where: { idUsuario }, transaction: t });
      }
    }

    const filasEliminadas = await db.Usuario.destroy({
      where: { idUsuario },
      transaction: t,
    });

    await t.commit();
    return filasEliminadas > 0;
  } catch (error) {
    await t.rollback();
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ConflictError(
        "No se puede eliminar el usuario porque está referenciado en otras tablas (citas, ventas, etc.). Considere desactivarlo en su lugar."
      );
    }
    if (error instanceof NotFoundError || error instanceof ConflictError) {
      throw error;
    }
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
  verificarCorreoExistente,
};
