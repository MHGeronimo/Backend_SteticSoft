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

// Helper para no repetir la configuración de 'include'
const includeConfig = [
  { model: db.Rol, as: "rol", attributes: ["idRol", "nombre"] },
  { model: db.Cliente, as: "clienteInfo", required: false },
  { model: db.Empleado, as: "empleadoInfo", required: false },
];

/**
 * Obtiene un usuario por su PK con toda la información de su perfil.
 */
const findUsuarioConPerfil = (idUsuario, options = {}) => {
  return db.Usuario.findByPk(idUsuario, {
    attributes: ["idUsuario", "correo", "estado", "idRol"],
    include: includeConfig,
    ...options,
  });
};

const crearUsuario = async (datosCompletosUsuario) => {
  const { correo, contrasena, idRol, estado, ...datosPerfil } =
    datosCompletosUsuario;

  // 1. Validar correo de usuario
  if (await db.Usuario.findOne({ where: { correo } })) {
    throw new ConflictError(
      `La dirección de correo '${correo}' ya está registrada.`
    );
  }

  // 2. Validar rol
  const rol = await db.Rol.findByPk(idRol);
  if (!rol || !rol.estado) {
    throw new BadRequestError(
      `El rol con ID ${idRol} no existe o no está activo.`
    );
  }

  // 3. Validación crucial ANTES de la transacción
  if (rol.nombre !== "Administrador" && datosPerfil.numeroDocumento) {
    const perfilModel = db.Cliente; // Asumimos Cliente por ahora
    if (
      await perfilModel.findOne({
        where: { numeroDocumento: datosPerfil.numeroDocumento },
      })
    ) {
      throw new ConflictError(
        `El número de documento '${datosPerfil.numeroDocumento}' ya está registrado.`
      );
    }
  }

  // 4. Si todas las validaciones pasan, iniciar la transacción
  const transaction = await db.sequelize.transaction();

  try {
    const contrasenaHasheada = await bcrypt.hash(contrasena, saltRounds);
    const nuevoUsuario = await db.Usuario.create(
      {
        correo,
        contrasena: contrasenaHasheada,
        idRol,
        estado: typeof estado === "boolean" ? estado : true,
      },
      { transaction }
    );

    if (rol.nombre !== "Administrador") {
      const {
        nombre,
        apellido,
        telefono,
        tipoDocumento,
        numeroDocumento,
        fechaNacimiento,
      } = datosPerfil;
      if (
        !nombre ||
        !apellido ||
        !telefono ||
        !tipoDocumento ||
        !numeroDocumento ||
        !fechaNacimiento
      ) {
        throw new BadRequestError(
          "Para este rol, se requieren los campos de perfil completos."
        );
      }

      await db.Cliente.create(
        {
          ...datosPerfil,
          idUsuario: nuevoUsuario.idUsuario,
          correo,
          estado: true,
        },
        { transaction }
      );
    }

    await transaction.commit();
    return await findUsuarioConPerfil(nuevoUsuario.idUsuario);
  } catch (error) {
    await transaction.rollback();
    if (
      error instanceof ConflictError ||
      error instanceof BadRequestError ||
      error instanceof CustomError
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
    throw new CustomError(`Error al crear el usuario: ${error.message}`, 500);
  }
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

    const datosParaUsuario = { idRol, correo, estado };
    if (contrasena) {
      datosParaUsuario.contrasena = await bcrypt.hash(contrasena, saltRounds);
    }
    Object.keys(datosParaUsuario).forEach(
      (key) =>
        datosParaUsuario[key] === undefined && delete datosParaUsuario[key]
    );

    if (Object.keys(datosParaUsuario).length > 0) {
      await usuario.update(datosParaUsuario, { transaction });
    }

    const rolFinalId = idRol || usuario.idRol;
    const rolFinal = await db.Rol.findByPk(rolFinalId, { transaction });

    if (!rolFinal) {
      throw new BadRequestError(`El rol con ID ${rolFinalId} es inválido.`);
    }

    if (
      rolFinal.nombre !== "Administrador" &&
      Object.keys(datosParaPerfil).length > 0
    ) {
      const PerfilModel =
        rolFinal.nombre === "Empleado" ? db.Empleado : db.Cliente;
      const perfil = await PerfilModel.findOne({
        where: { idUsuario },
        transaction,
      });

      if (perfil) {
        await perfil.update(datosParaPerfil, { transaction });
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
      include: includeConfig,
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
  const usuario = await findUsuarioConPerfil(idUsuario);
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
    return usuario;
  }
  return await usuario.update({ estado: nuevoEstado });
};

const eliminarUsuarioFisico = async (idUsuario) => {
  const transaction = await db.sequelize.transaction();
  try {
    const usuario = await db.Usuario.findByPk(idUsuario, { transaction });
    if (!usuario) {
      throw new NotFoundError(
        "Usuario no encontrado para eliminar físicamente."
      );
    }

    await usuario.destroy({ transaction });

    await transaction.commit();
    return true;
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
