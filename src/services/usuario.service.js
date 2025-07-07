// src/shared/src_api/services/usuario.service.js

const bcrypt = require("bcrypt");
const { Usuario, Rol, Cliente, Empleado, sequelize } = require("../models"); // REFINAMIENTO: Importar sequelize directamente para transacciones.
const { NotFoundError, ConflictError, BadRequestError, CustomError } = require("../errors");

const saltRounds = 10;

// REFINAMIENTO: La configuración de 'include' es reutilizable y centralizada.
const includeConfig = [
  { model: Rol, as: "rol", attributes: ["nombre"] },
  { model: Cliente, as: "clienteInfo", required: false },
  { model: Empleado, as: "empleadoInfo", required: false },
];

/**
 * Encuentra un usuario por su ID, incluyendo sus perfiles asociados.
 * @param {string} idUsuario - El ID del usuario (UUID).
 * @param {object} [options={}] - Opciones adicionales para la consulta de Sequelize.
 * @returns {Promise<Usuario|null>} La instancia del usuario con sus perfiles.
 */
const findUsuarioConPerfil = (idUsuario, options = {}) => {
  return Usuario.findByPk(idUsuario, {
    attributes: { exclude: ["contrasena"] }, // REFINAMIENTO: Excluir siempre la contraseña.
    include: includeConfig,
    ...options,
  });
};

/**
 * Crea un nuevo usuario y su perfil asociado (Cliente o Empleado) en una única transacción.
 * @param {object} datosCompletosUsuario - Objeto con los datos del usuario y su perfil.
 * @returns {Promise<Usuario>} El usuario recién creado con su perfil.
 */
const crearUsuario = async (datosCompletosUsuario) => {
  const { correo, contrasena, idRol, estado, ...datosPerfil } = datosCompletosUsuario;

  // --- VALIDACIONES PREVIAS A LA TRANSACCIÓN ---

  // 1. Validar correo de usuario
  if (await Usuario.findOne({ where: { correo } })) {
    throw new ConflictError(`La dirección de correo '${correo}' ya está registrada.`);
  }

  // 2. Validar rol y determinar el modelo de perfil
  const rol = await Rol.findByPk(idRol);
  if (!rol || !rol.estado) {
    throw new BadRequestError(`El rol con ID ${idRol} no existe o no está activo.`);
  }

  // CORRECCIÓN: Determinar el modelo de perfil dinámicamente basado en el nombre del rol.
  // Esto es más robusto que un if/else con nombres hardcodeados.
  const PerfilModel = rol.nombre === 'Empleado' ? Empleado : rol.nombre === 'Cliente' ? Cliente : null;
  
  // 3. Validar documento de identidad si aplica
  if (PerfilModel && datosPerfil.numeroDocumento) {
    if (await PerfilModel.findOne({ where: { numeroDocumento: datosPerfil.numeroDocumento } })) {
      throw new ConflictError(`El número de documento '${datosPerfil.numeroDocumento}' ya está registrado.`);
    }
  }

  // --- TRANSACCIÓN ---
  const transaction = await sequelize.transaction();

  try {
    const contrasenaHasheada = await bcrypt.hash(contrasena, saltRounds);
    const nuevoUsuario = await Usuario.create({
        correo,
        contrasena: contrasenaHasheada,
        idRol,
        estado: typeof estado === "boolean" ? estado : true,
      }, { transaction }
    );

    // 4. Crear perfil si el rol lo requiere
    if (PerfilModel) {
      // REFINAMIENTO: Validar que todos los campos necesarios para el perfil estén presentes.
      const camposRequeridos = ['nombre', 'apellido', 'telefono', 'tipoDocumento', 'numeroDocumento', 'fechaNacimiento'];
      const camposFaltantes = camposRequeridos.filter(campo => !datosPerfil[campo]);

      if (camposFaltantes.length > 0) {
        throw new BadRequestError(`Para este rol, faltan los siguientes campos de perfil: ${camposFaltantes.join(', ')}.`);
      }
      
      await PerfilModel.create({
          ...datosPerfil,
          idUsuario: nuevoUsuario.idUsuario,
          correo: nuevoUsuario.correo, // REFINAMIENTO: Asegurar consistencia del correo.
          estado: true,
        }, { transaction }
      );
    }

    await transaction.commit();
    return await findUsuarioConPerfil(nuevoUsuario.idUsuario);

  } catch (error) {
    await transaction.rollback();
    // REFINAMIENTO: Si el error ya es uno de nuestros errores personalizados, simplemente lo relanzamos.
    if (error instanceof CustomError) {
      throw error;
    }
    // REFINAMIENTO: Manejo de errores de constraint de Sequelize centralizado.
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = Object.keys(error.fields)[0];
      const value = error.fields[field];
      throw new ConflictError(`El valor '${value}' para el campo '${field}' ya está en uso.`);
    }
    // Error genérico si algo más falla.
    throw new CustomError(`Error al crear el usuario: ${error.message}`, 500);
  }
};

/**
 * Actualiza un usuario y su perfil asociado.
 * @param {string} idUsuario - ID del usuario a actualizar.
 * @param {object} datosActualizar - Datos a modificar.
 * @returns {Promise<Usuario>} El usuario actualizado con su perfil.
 */
const actualizarUsuario = async (idUsuario, datosActualizar) => {
  const transaction = await sequelize.transaction();
  try {
    const usuario = await Usuario.findByPk(idUsuario, { transaction });
    if (!usuario) {
      throw new NotFoundError("Usuario no encontrado para actualizar.");
    }

    const { contrasena, idRol, estado, ...datosParaPerfil } = datosActualizar;

    // 1. Actualizar datos de la tabla Usuario
    const datosParaUsuario = { idRol, estado };
    if (contrasena) {
      datosParaUsuario.contrasena = await bcrypt.hash(contrasena, saltRounds);
    }
    // REFINAMIENTO: Limpiar claves indefinidas de forma más concisa.
    Object.keys(datosParaUsuario).forEach(key => datosParaUsuario[key] === undefined && delete datosParaUsuario[key]);
    
    if (Object.keys(datosParaUsuario).length > 0) {
      await usuario.update(datosParaUsuario, { transaction });
    }

    // 2. Actualizar datos del perfil asociado (Cliente o Empleado)
    if (Object.keys(datosParaPerfil).length > 0) {
      const rolActual = await Rol.findByPk(usuario.idRol, { transaction });
      const PerfilModel = rolActual.nombre === 'Empleado' ? Empleado : rolActual.nombre === 'Cliente' ? Cliente : null;
      
      if (PerfilModel) {
        // CORRECCIÓN: Prevenir la actualización de 'numeroDocumento' por esta vía.
        if (datosParaPerfil.numeroDocumento) {
          throw new BadRequestError("El número de documento no se puede modificar.");
        }
        const perfil = await PerfilModel.findOne({ where: { idUsuario }, transaction });
        if (perfil) {
          await perfil.update(datosParaPerfil, { transaction });
        }
      }
    }

    await transaction.commit();
    return await findUsuarioConPerfil(idUsuario);
  } catch (error) {
    await transaction.rollback();
    if (error instanceof CustomError) {
      throw error;
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = Object.keys(error.fields)[0];
      throw new ConflictError(`El valor para el campo '${field}' ya está en uso.`);
    }
    throw new CustomError(`Error al actualizar el usuario: ${error.message}`, 500);
  }
};

/**
 * Obtiene todos los usuarios con sus perfiles, con opción de filtrado.
 * @param {object} [opcionesDeFiltro={}] - Condiciones de Sequelize para filtrar.
 * @returns {Promise<Usuario[]>} Un array de usuarios.
 */
const obtenerTodosLosUsuarios = async (opcionesDeFiltro = {}) => {
  return Usuario.findAll({
    where: opcionesDeFiltro,
    attributes: { exclude: ["contrasena"] },
    include: includeConfig,
    order: [["createdAt", "ASC"]], // REFINAMIENTO: Ordenar por fecha de creación es más común.
  });
};

/**
 * Obtiene un único usuario por su ID.
 * @param {string} idUsuario - ID del usuario.
 * @returns {Promise<Usuario>} La instancia del usuario.
 */
const obtenerUsuarioPorId = async (idUsuario) => {
  const usuario = await findUsuarioConPerfil(idUsuario);
  if (!usuario) {
    throw new NotFoundError("Usuario no encontrado.");
  }
  return usuario;
};

/**
 * Cambia el estado (activo/inactivo) de un usuario.
 * @param {number|string} idUsuario - ID del usuario.
 * @param {boolean} nuevoEstado - El nuevo estado (true para activo, false para inactivo).
 * @returns {Promise<Usuario>} El usuario con su estado actualizado y perfiles asociados.
 */
const cambiarEstadoUsuario = async (idUsuario, nuevoEstado) => {
  const numericIdUsuario = Number(idUsuario); // Asegurar que el ID es numérico
  const usuario = await Usuario.findByPk(numericIdUsuario);
  if (!usuario) {
    throw new NotFoundError("Usuario no encontrado para cambiar estado.");
  }
  if (usuario.estado === nuevoEstado) {
    // Devolver consistentemente el usuario con sus perfiles, incluso si no hay cambio de estado.
    return findUsuarioConPerfil(numericIdUsuario);
  }
  await usuario.update({ estado: nuevoEstado });
  return findUsuarioConPerfil(numericIdUsuario); // Devolver el usuario actualizado con perfiles.
};

/**
 * Elimina un usuario y su perfil asociado de forma permanente.
 * @param {string} idUsuario - ID del usuario a eliminar.
 * @returns {Promise<boolean>} True si la eliminación fue exitosa.
 */
const eliminarUsuarioFisico = async (idUsuario) => {
  const transaction = await sequelize.transaction();
  try {
    const usuario = await Usuario.findByPk(idUsuario, { include: [{ model: Rol, as: 'rol' }], transaction });
    if (!usuario) {
      throw new NotFoundError("Usuario no encontrado para eliminar.");
    }
    
    // CORRECCIÓN: Eliminar el perfil asociado explícitamente dentro de la transacción.
    const PerfilModel = usuario.rol.nombre === 'Empleado' ? Empleado : usuario.rol.nombre === 'Cliente' ? Cliente : null;
    if(PerfilModel) {
        await PerfilModel.destroy({ where: { idUsuario }, transaction });
    }

    // Finalmente, eliminar el usuario.
    await usuario.destroy({ transaction });

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof CustomError) throw error;
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      throw new ConflictError("No se puede eliminar el usuario porque tiene otros datos asociados importantes (citas, ventas, etc).");
    }
    throw new CustomError(`Error al eliminar físicamente al usuario: ${error.message}`, 500);
  }
};

/**
 * Verifica si un correo electrónico ya está registrado.
 * @param {string} correo - El correo a verificar.
 * @returns {Promise<boolean>} True si el correo existe.
 */
const verificarCorreoExistente = async (correo) => {
  const count = await Usuario.count({ where: { correo } });
  return count > 0;
};

module.exports = {
  crearUsuario,
  obtenerTodosLosUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  cambiarEstadoUsuario, // Se mantiene esta función como la principal para cambiar estado
  eliminarUsuarioFisico,
  verificarCorreoExistente,
};