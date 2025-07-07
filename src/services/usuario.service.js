// src/shared/src_api/services/usuario.service.js
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

// ANÁLISIS Y CORRECCIÓN:
// Se crea una función auxiliar para no repetir la configuración de 'include' en múltiples funciones.
// Esto centraliza la lógica para obtener un usuario con su perfil completo.
const includeConfig = [
  { model: db.Rol, as: "rol", attributes: ["idRol", "nombre"] },
  { model: db.Cliente, as: "clienteInfo", required: false },
  { model: db.Empleado, as: "empleadoInfo", required: false },
];

/**
 * Obtiene un usuario por su PK con toda la información de su perfil.
 * @param {number} idUsuario - El ID del usuario.
 * @param {object} [options] - Opciones de Sequelize, como la transacción.
 * @returns {Promise<object|null>}
 */
const findUsuarioConPerfil = (idUsuario, options = {}) => {
  return db.Usuario.findByPk(idUsuario, {
    attributes: ["idUsuario", "correo", "estado", "idRol"],
    include: includeConfig,
    ...options,
  });
};

/**
 * Crea un nuevo usuario y su empleado asociado de forma transaccional.
 * @param {object} datosUsuario - Datos del usuario y del empleado.
 * @returns {Promise<object>} El usuario creado.
 */
const crearUsuario = async (datosUsuario) => {
  // --- INICIO DE MODIFICACIÓN ---
  const t = await db.sequelize.transaction(); // 1. Iniciar transacción

  try {
    const {
      nombre,
      apellido,
      tipoDocumento,
      numeroDocumento,
      telefono,
      email,
      password,
      idRol,
    } = datosUsuario;

    // 2. Validar si ya existe un empleado o usuario con los mismos datos únicos
    const existingUser = await db.Usuario.findOne({
      where: { email },
      transaction: t,
    });
    if (existingUser) {
      throw new ConflictError("El correo electrónico ya está en uso.");
    }

    const existingEmployee = await db.Empleado.findOne({
      where: { numeroDocumento },
      transaction: t,
    });
    if (existingEmployee) {
      throw new ConflictError("El número de documento ya está registrado.");
    }

    // 3. Crear primero el Empleado
    const nuevoEmpleado = await db.Empleado.create(
      {
        nombre,
        apellido,
        tipoDocumento,
        numeroDocumento,
        telefono,
        email,
        estado: true, // Por defecto, el nuevo empleado está activo
      },
      { transaction: t }
    );

    // 4. Crear el Usuario usando el ID del empleado recién creado
    const nuevoUsuario = await db.Usuario.create(
      {
        idEmpleado: nuevoEmpleado.idEmpleado,
        idRol,
        email,
        password, // El hook en el modelo se encargará del hash
        estado: true, // Por defecto, el nuevo usuario está activo
      },
      { transaction: t }
    );

    await t.commit(); // 5. Confirmar la transacción si todo fue exitoso

    // 6. Devolver el usuario recién creado con su información de rol y empleado
    const usuarioCreado = await db.Usuario.findByPk(nuevoUsuario.idUsuario, {
      include: [
        { model: db.Empleado, as: "empleado" },
        { model: db.Rol, as: "rol" },
      ],
    });

    return usuarioCreado.toJSON();
  } catch (error) {
    await t.rollback(); // 7. Revertir la transacción en caso de cualquier error
    // Propagar el error para que el controlador lo maneje
    throw error;
  }
  // --- FIN DE MODIFICACIÓN ---
};



const actualizarUsuario = async (idUsuario, datosActualizar) => {
  const transaction = await db.sequelize.transaction();
  try {
    const usuario = await db.Usuario.findByPk(idUsuario, { transaction });
    if (!usuario) {
      throw new NotFoundError("Usuario no encontrado para actualizar.");
    }

    const { contrasena, idRol, correo, estado, ...datosParaPerfil } =
      datosActualizar;

    // 1. Actualizar datos del modelo Usuario
    const datosParaUsuario = { idRol, correo, estado };
    if (contrasena) {
      datosParaUsuario.contrasena = await bcrypt.hash(contrasena, saltRounds);
    }
    // Eliminar claves undefined para que no se actualicen a null
    Object.keys(datosParaUsuario).forEach(
      (key) =>
        datosParaUsuario[key] === undefined && delete datosParaUsuario[key]
    );

    if (Object.keys(datosParaUsuario).length > 0) {
      await usuario.update(datosParaUsuario, { transaction });
    }

    // 2. Actualizar datos del Perfil asociado (Cliente o Empleado)
    // ANÁLISIS Y CORRECCIÓN: La lógica ahora se basa en el rol final del usuario (sea el viejo o el nuevo).
    const rolFinalId = idRol || usuario.idRol;
    const rolFinal = await db.Rol.findByPk(rolFinalId, { transaction });

    if (!rolFinal) {
      throw new BadRequestError(`El rol con ID ${rolFinalId} es inválido.`);
    }

    if (
      rolFinal.nombre !== "Administrador" &&
      Object.keys(datosParaPerfil).length > 0
    ) {
      // Determinar qué modelo de perfil usar
      const PerfilModel =
        rolFinal.nombre === "Empleado" ? db.Empleado : db.Cliente;
      const perfil = await PerfilModel.findOne({
        where: { idUsuario },
        transaction,
      });

      if (perfil) {
        await perfil.update(datosParaPerfil, { transaction });
      } else {
        // Opcional: Si el usuario cambia a un rol con perfil pero no tiene uno, se podría crear.
        // Por ahora, solo actualizamos si existe.
        // Ejemplo: await PerfilModel.create({ idUsuario, ...datosParaPerfil }, { transaction });
      }
    }

    await transaction.commit();
    return await findUsuarioConPerfil(idUsuario);
  } catch (error) {
    await transaction.rollback();
    if (
      error instanceof NotFoundError ||
      error instanceof ConflictError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    if (error.name === "SequelizeUniqueConstraintError") {
      const field = Object.keys(error.fields)[0];
      const value = error.fields[field];
      throw new ConflictError(
        `El valor '${value}' para el campo '${field}' ya está en uso.`
      );
    }
    throw new CustomError(
      `Error al actualizar el usuario: ${error.message}`,
      500
    );
  }
};

const obtenerTodosLosUsuarios = async (opcionesDeFiltro = {}) => {
  try {
    return await db.Usuario.findAll({
      where: opcionesDeFiltro,
      attributes: ["idUsuario", "correo", "estado", "idRol"],
      include: includeConfig, // Reutilizamos la configuración
      order: [["idUsuario", "ASC"]],
    });
  } catch (error) {
    throw new CustomError(
      `Error al obtener los usuarios: ${error.message}`,
      500
    );
  }
};

const obtenerUsuarioPorId = async (idUsuario) => {
  const usuario = await findUsuarioConPerfil(idUsuario); // Reutilizamos la función
  if (!usuario) {
    throw new NotFoundError("Usuario no encontrado.");
  }
  return usuario;
};

const cambiarEstadoUsuario = async (idUsuario, nuevoEstado) => {
  const usuario = await db.Usuario.findByPk(idUsuario);
  if (!usuario) {
    throw new NotFoundError("Usuario no encontrado para cambiar estado.");
  }
  if (usuario.estado === nuevoEstado) {
    return usuario; // Ya está en el estado deseado
  }
  return await usuario.update({ estado: nuevoEstado });
};

const eliminarUsuarioFisico = async (idUsuario) => {
  // ANÁLISIS Y CORRECCIÓN: Simplificado. Dejamos que el motor de la BD y Sequelize
  // manejen la validación de Foreign Key. El catch se encargará del error.
  const transaction = await db.sequelize.transaction();
  try {
    const usuario = await db.Usuario.findByPk(idUsuario, { transaction });
    if (!usuario) {
      throw new NotFoundError(
        "Usuario no encontrado para eliminar físicamente."
      );
    }

    // La restricción 'onDelete: RESTRICT' en los modelos Cliente/Empleado
    // causará un error si intentamos borrar un usuario con perfil asociado.
    await usuario.destroy({ transaction });

    await transaction.commit();
    return true; // Éxito
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError) throw error;
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ConflictError(
        "No se puede eliminar el usuario porque tiene perfiles o datos asociados."
      );
    }
    throw new CustomError(
      `Error al eliminar físicamente al usuario: ${error.message}`,
      500
    );
  }
};

// Se exportan las funciones principales.
// Las funciones de habilitar/anular usan cambiarEstadoUsuario.
module.exports = {
  crearUsuario,
  obtenerTodosLosUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  anularUsuario: (id) => cambiarEstadoUsuario(id, false),
  habilitarUsuario: (id) => cambiarEstadoUsuario(id, true),
  eliminarUsuarioFisico,
  verificarCorreoExistente: async (correo) =>
    !!(await db.Usuario.findOne({
      where: { correo },
      attributes: ["idUsuario"],
    })),
};
