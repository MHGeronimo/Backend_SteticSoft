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
  const usuario = await db.Usuario.findByPk(idUsuario);
  if (!usuario) {
    throw new NotFoundError("User not found to change status.");
  }
  if (usuario.estado === nuevoEstado) {
    const { contrasena: _, ...usuarioSinCambio } = usuario.toJSON();
    return usuarioSinCambio;
  }
  await usuario.update({ estado: nuevoEstado });
  const { contrasena: _, ...usuarioActualizado } = usuario.toJSON();
  return usuarioActualizado;
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
    correo, // Cambiado de email a correo para coincidir con frontend y modelo Usuario
    contrasena, // Cambiado de password a contrasena
    idRol, // Cambiado de rolId a idRol
    nombre, // Cambiado de nombres a nombre
    apellido, // Cambiado de apellidos a apellido
    telefono,
    tipoDocumento,
    numeroDocumento,
    fechaNacimiento,
    estado // Se añade estado, aunque el modelo Usuario tiene un default true
  } = usuarioData;

  // PASO 1: Verificar la existencia del rol ANTES de la transacción.
  // Asegurarse de que idRol sea un número para la búsqueda.
  const rolIdNumerico = Number(idRol);
  if (isNaN(rolIdNumerico)) {
    throw new BadRequestError("El ID del rol proporcionado no es un número válido.");
  }

  const rol = await db.Rol.findOne({ where: { idRol: rolIdNumerico, estado: true } });
  if (!rol) {
    // Log para depuración en el backend
    console.error(`[usuario.service.js] Rol no encontrado o inactivo para idRol: ${rolIdNumerico}`);
    throw new NotFoundError(`El rol especificado con ID ${rolIdNumerico} no existe o no está activo.`);
  }

  // PASO 2: Iniciar la transacción.
  const t = await db.sequelize.transaction();
  try {
    // Verificar si el correo ya existe para otro usuario
    const usuarioExistente = await db.Usuario.findOne({ where: { correo }, transaction: t });
    if (usuarioExistente) {
      await t.rollback(); // Importante hacer rollback aquí
      throw new ConflictError("El correo electrónico ya está registrado.");
    }
    
    // Verificar si el número de documento ya existe para el tipo de perfil correspondiente
    if (numeroDocumento && (rol.nombre === 'Cliente' || rol.tipoPerfil === 'CLIENTE')) {
        const clienteExistente = await db.Cliente.findOne({ where: { numeroDocumento }, transaction: t });
        if (clienteExistente) {
            await t.rollback();
            throw new ConflictError("El número de documento ya está registrado para un cliente.");
        }
    } else if (numeroDocumento && (rol.nombre === 'Empleado' || rol.tipoPerfil === 'EMPLEADO')) {
        const empleadoExistente = await db.Empleado.findOne({ where: { numeroDocumento }, transaction: t });
        if (empleadoExistente) {
            await t.rollback();
            throw new ConflictError("El número de documento ya está registrado para un empleado.");
        }
    }

    const salt = await bcrypt.genSalt(saltRounds); // saltRounds ya está definido arriba
    const hashedPassword = await bcrypt.hash(contrasena, salt);

    const nuevoUsuario = await db.Usuario.create(
      {
        correo,
        contrasena: hashedPassword,
        idRol: rolIdNumerico, // Usar el ID numérico
        estado: typeof estado === 'boolean' ? estado : true, // Usar estado si se provee, sino default
      },
      { transaction: t }
    );

    // Crear perfil si el rol lo requiere (basado en nombre o tipoPerfil)
    // Es preferible usar tipoPerfil si está consistentemente definido en el modelo Rol.
    // El frontend envía nombre, apellido, etc. El backend debe mapearlos correctamente.
    const requierePerfil = rol.nombre === "Cliente" || rol.nombre === "Empleado" || rol.tipoPerfil === "CLIENTE" || rol.tipoPerfil === "EMPLEADO";

    if (requierePerfil) {
      const perfilData = {
        nombre,
        apellido,
        telefono,
        correo: nuevoUsuario.correo, // Usar el correo del usuario creado
        tipoDocumento,
        numeroDocumento,
        fechaNacimiento,
        idUsuario: nuevoUsuario.idUsuario,
        estado: nuevoUsuario.estado, // Sincronizar estado del perfil con el del usuario
      };

      if (rol.nombre === "Cliente" || rol.tipoPerfil === "CLIENTE") {
        await db.Cliente.create(perfilData, { transaction: t });
      } else if (rol.nombre === "Empleado" || rol.tipoPerfil === "EMPLEADO") {
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
    console.error("[usuario.service.js] Error al crear el usuario:", error);
    // Relanzar errores específicos o un error genérico
    if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof BadRequestError) {
      throw error;
    }
    throw new CustomError(`Error en el servicio al crear usuario: ${error.message}`, 500);
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
    console.error("[usuario.service.js] Error al verificar correo existente:", error);
    throw new CustomError("Error al verificar la existencia del correo.", 500);
  }
};


/**
 * Get all users with their role and associated Client/Employee profile.
 */
const obtenerTodosLosUsuarios = async (opcionesDeFiltro = {}) => {
  try {
    const usuarios = await db.Usuario.findAll({
      where: opcionesDeFiltro,
      attributes: ["idUsuario", "correo", "estado", "idRol"],
      include: [
        {
          model: db.Rol,
          as: "rol",
          attributes: ["idRol", "nombre"],
        },
        {
          model: db.Cliente,
          as: "clienteInfo",
          attributes: [
            "idCliente",
            "nombre",
            "apellido",
            "correo",
            "telefono",
            "tipoDocumento",
            "numeroDocumento",
            "fechaNacimiento",
          ],
          required: false,
        },
        {
          model: db.Empleado,
          as: "empleadoInfo",
          attributes: [
            "idEmpleado",
            "nombre",
            "apellido",
            "correo",
            "telefono",
            "tipoDocumento",
            "numeroDocumento",
            "fechaNacimiento",
          ],
          required: false,
        },
      ],
      order: [["idUsuario", "ASC"]],
    });
    return usuarios;
  } catch (error) {
    throw new CustomError(`Error al get users: ${error.message}`, 500);
  }
};

/**
 * Get a user by their ID, including their role and Client/Employee profile.
 */
const obtenerUsuarioPorId = async (idUsuario) => {
  try {
    const usuario = await db.Usuario.findByPk(idUsuario, {
      attributes: ["idUsuario", "correo", "estado", "idRol"],
      include: [
        { model: db.Rol, as: "rol", attributes: ["idRol", "nombre"] },
        { model: db.Cliente, as: "clienteInfo", required: false },
        { model: db.Empleado, as: "empleadoInfo", required: false },
      ],
    });
    if (!usuario) {
      throw new NotFoundError("User not found.");
    }
    return usuario;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new CustomError(`Error al get user: ${error.message}`, 500);
  }
};

/**
 * Update an existing user and their associated profile.
 */
const actualizarUsuario = async (idUsuario, datosActualizar) => {
  const transaction = await db.sequelize.transaction();
  try {
    const usuario = await db.Usuario.findByPk(idUsuario, { transaction });
    if (!usuario) {
      await transaction.rollback();
      throw new NotFoundError("User not found to update.");
    }

    const datosParaUsuario = {};
    const datosParaPerfil = {};

    // Separar datos para Usuario y Perfil
    for (const key in datosActualizar) {
      if (["correo", "idRol", "estado", "contrasena"].includes(key)) {
        datosParaUsuario[key] = datosActualizar[key];
      } else {
        datosParaPerfil[key] = datosActualizar[key];
      }
    }

    if (datosParaUsuario.correo && datosParaUsuario.correo !== usuario.correo) {
      const existe = await db.Usuario.findOne({
        where: {
          correo: datosParaUsuario.correo,
          idUsuario: { [Op.ne]: idUsuario },
        },
        transaction,
      });
      if (existe) {
        await transaction.rollback();
        throw new ConflictError(
          `The email address '${datosParaUsuario.correo}' is already registered.`
        );
      }
    }

    if (datosParaUsuario.contrasena) {
      datosParaUsuario.contrasena = await bcrypt.hash(
        datosParaUsuario.contrasena,
        saltRounds
      );
    }

    if (Object.keys(datosParaUsuario).length > 0) {
      await usuario.update(datosParaUsuario, { transaction });
    }

    const rolActual = await db.Rol.findByPk(usuario.idRol, { transaction });

    if (Object.keys(datosParaPerfil).length > 0) {
      if (rolActual.tipoPerfil === "CLIENTE") {
        const cliente = await db.Cliente.findOne({
          where: { usuarioId: idUsuario },
          transaction,
        });
        if (cliente) await cliente.update(datosParaPerfil, { transaction });
      } else if (rolActual.tipoPerfil === "EMPLEADO") {
        const empleado = await db.Empleado.findOne({
          where: { usuarioId: idUsuario },
          transaction,
        });
        if (empleado) await empleado.update(datosParaPerfil, { transaction });
      }
    }

    await transaction.commit();
    return obtenerUsuarioPorId(idUsuario);
  } catch (error) {
    await transaction.rollback();
    if (
      error instanceof NotFoundError ||
      error instanceof ConflictError ||
      error instanceof BadRequestError
    )
      throw error;
    throw new CustomError(`Error al update user: ${error.message}`, 500);
  }
};

/**
 * Disable a user (logical deletion, sets status = false).
 */
const anularUsuario = async (idUsuario) => {
  try {
    return await cambiarEstadoUsuario(idUsuario, false);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new CustomError(`Error al disable user: ${error.message}`, 500);
  }
};

/**
 * Enable a user (changes status = true).
 */
const habilitarUsuario = async (idUsuario) => {
  try {
    return await cambiarEstadoUsuario(idUsuario, true);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new CustomError(`Error al enable user: ${error.message}`, 500);
  }
};

/**
 * Physically delete a user from the database.
 */
const eliminarUsuarioFisico = async (idUsuario) => {
  const transaction = await db.sequelize.transaction();
  try {
    const usuario = await db.Usuario.findByPk(idUsuario, { transaction });
    if (!usuario) {
      await transaction.rollback();
      throw new NotFoundError("User not found to physically delete.");
    }

    // Antes de borrar el usuario, borramos su perfil asociado para evitar errores de FK.
    const rol = await db.Rol.findByPk(usuario.idRol, { transaction });
    if (rol.tipoPerfil === "CLIENTE") {
      await db.Cliente.destroy({
        where: { usuarioId: idUsuario },
        transaction,
      });
    } else if (rol.tipoPerfil === "EMPLEADO") {
      await db.Empleado.destroy({
        where: { usuarioId: idUsuario },
        transaction,
      });
    }

    const filasEliminadas = await db.Usuario.destroy({
      where: { idUsuario },
      transaction,
    });

    await transaction.commit();
    return filasEliminadas > 0;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError || error instanceof ConflictError) {
      throw error;
    }
    throw new CustomError(
      `Error al physically delete user: ${error.message}`,
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
