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
  // Usamos db.sequelize para la transacción, como en el resto del archivo.
  const t = await db.sequelize.transaction();
  try {
    const {
      email,
      password,
      rolId,
      nombres,
      apellidos,
      telefono,
      tipoDocumento,
      numeroDocumento,
      fechaNacimiento,
    } = usuarioData;

    // Usamos 'db.Rol' para acceder al modelo Rol
    const rol = await db.Rol.findByPk(rolId, { transaction: t });
    if (!rol) {
      throw new Error("El rol especificado no existe.");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Usamos 'db.Usuario' para acceder al modelo Usuario
    const nuevoUsuario = await db.Usuario.create(
      {
        email,
        password: hashedPassword,
        rolId,
      },
      { transaction: t }
    );

    // Lógica condicional basada en 'tipoPerfil'
    if (rol.tipoPerfil === "CLIENTE") {
      // Usamos 'db.Cliente'
      await db.Cliente.create(
        {
          nombres,
          apellidos,
          telefono,
          correo: email,
          tipoDocumento,
          numeroDocumento,
          fechaNacimiento,
          usuarioId: nuevoUsuario.id, // Asegúrate que el modelo Cliente use 'usuarioId' como FK
        },
        { transaction: t }
      );
    } else if (rol.tipoPerfil === "EMPLEADO") {
      // Usamos 'db.Empleado'
      await db.Empleado.create(
        {
          nombres,
          apellidos,
          telefono,
          correo: email,
          tipoDocumento,
          numeroDocumento,
          fechaNacimiento,
          usuarioId: nuevoUsuario.id, // Asegúrate que el modelo Empleado use 'usuarioId' como FK
        },
        { transaction: t }
      );
    }

    await t.commit();

    // Obtenemos y devolvemos el usuario completo
    const usuarioCompleto = await db.Usuario.findByPk(nuevoUsuario.id, {
      include: [
        { model: db.Rol, as: "rol", attributes: ["id", "nombre"] },
        {
          model: db.Cliente,
          as: "clienteInfo",
          attributes: { exclude: ["usuarioId", "createdAt", "updatedAt"] },
        },
        {
          model: db.Empleado,
          as: "empleadoInfo",
          attributes: { exclude: ["usuarioId", "createdAt", "updatedAt"] },
        },
      ],
      attributes: { exclude: ["password"] },
    });

    return usuarioCompleto;
  } catch (error) {
    await t.rollback();
    console.error("Error al crear el usuario:", error);
    throw new Error(`Error en el servicio al crear usuario: ${error.message}`);
  }
};

// --- FIN DE CORRECCIÓN ---

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
          });
            if (otroClienteConDocumento) {
                await transaction.rollback();
                throw new ConflictError(`The document number '${datosParaPerfilCliente.numeroDocumento}' is already registered for another client.`);
            }
        }
        // Validate uniqueness of client's email if it's being changed
        if (datosParaPerfilCliente.correo && datosParaPerfilCliente.correo !== cliente.correo) {
          const otroClienteConCorreo = await db.Cliente.findOne({ 
              where: { correo: datosParaPerfilCliente.correo, idCliente: { [Op.ne]: cliente.idCliente } }, 
              transaction 
          });
          if (otroClienteConCorreo) {
              await transaction.rollback();
              throw new ConflictError(`The email '${datosParaPerfilCliente.correo}' is already registered for another client.`);
          }
        }
        await cliente.update(datosParaPerfilCliente, { transaction });
      } else {
        // Optional: Create client profile if it does not exist but the role is Client and profile data is sent?
        // This will depend on business logic. For now, we only update if it exists.
      }
    }
    
    // Similar logic to update Employee if rolActual.nombre === "Employee"
    if (rolActual && rolActual.nombre === "Empleado" && Object.keys(datosParaPerfilEmpleado).length > 0) {
        const empleado = await db.Empleado.findOne({ where: { idUsuario }, transaction });
        if (empleado) {
            // Validate uniqueness of employee's numeroDocumento if it's being changed
            if (datosParaPerfilEmpleado.numeroDocumento && datosParaPerfilEmpleado.numeroDocumento !== empleado.numeroDocumento) {
                const otroEmpleadoConDocumento = await db.Empleado.findOne({ 
                    where: { numeroDocumento: datosParaPerfilEmpleado.numeroDocumento, idEmpleado: { [Op.ne]: empleado.idEmpleado } }, 
                    transaction 
                });
                if (otroEmpleadoConDocumento) {
                    await transaction.rollback();
                    throw new ConflictError(`The document number '${datosParaPerfilEmpleado.numeroDocumento}' is already registered for another employee.`);
                }
            }
            // Validate uniqueness of employee's email if it's being changed
            if (datosParaPerfilEmpleado.correo && datosParaPerfilEmpleado.correo !== empleado.correo) {
              const otroEmpleadoConCorreo = await db.Empleado.findOne({ 
                  where: { correo: datosParaPerfilEmpleado.correo, idEmpleado: { [Op.ne]: empleado.idEmpleado } }, 
                  transaction 
              });
              if (otroEmpleadoConCorreo) {
                  await transaction.rollback();
                  throw new ConflictError(`The email '${datosParaPerfilEmpleado.correo}' is already registered for another employee.`);
              }
            }

            await empleado.update(datosParaPerfilEmpleado, { transaction });
        }
    }

    await transaction.commit();

    // Return the updated user with their profile
    const usuarioActualizadoConPerfil = await db.Usuario.findByPk(idUsuario, {
        attributes: ["idUsuario", "correo", "estado", "idRol"],
        include: [
            { model: db.Rol, as: "rol", attributes: ["idRol", "nombre"] },
            { model: db.Cliente, as: "clienteInfo", required: false },
            { model: db.Empleado, as: "empleadoInfo", required: false }
        ]
    });
    return usuarioActualizadoConPerfil ? usuarioActualizadoConPerfil.toJSON() : null;

  } catch (error) {
    await transaction.rollback(); // Ensure rollback on any error within the try block
    if ( error instanceof NotFoundError || error instanceof ConflictError || error instanceof BadRequestError) throw error;
    if (error.name === "SequelizeUniqueConstraintError") {
      // This duplicate email validation is already above, but can capture other unique constraints
      throw new ConflictError(`Uniqueness error. A unique data entry already exists.`);
    }
    // console.error(`Error al actualizar el usuario con ID ${idUsuario} en el servicio:`, error.message); // Commented
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
    // console.error(`Error al anular el usuario con ID ${idUsuario} en el servicio:`, error.message); // Commented
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
    // console.error(`Error al habilitar el usuario con ID ${idUsuario} en el servicio:`, error.message); // Commented
    throw new CustomError(`Error al enable user: ${error.message}`, 500);
  }
};

/**
 * Physically delete a user from the database.
 */
const eliminarUsuarioFisico = async (idUsuario) => {
    const transaction = await db.sequelize.transaction(); // Start transaction
    try {
        const usuario = await db.Usuario.findByPk(idUsuario, { transaction });
        if (!usuario) {
            await transaction.rollback();
            throw new NotFoundError("User not found to physically delete.");
        }

        // Check if the user is associated with a client profile (onDelete: 'RESTRICT')
        const clienteAsociado = await db.Cliente.findOne({ where: { idUsuario: usuario.idUsuario }, transaction });
        if (clienteAsociado) {
            await transaction.rollback();
            throw new ConflictError("Cannot delete user because they are associated with a client profile.");
        }

        // Check if the user is associated with an employee profile (onDelete: 'RESTRICT')
        const empleadoAsociado = await db.Empleado.findOne({ where: { idUsuario: usuario.idUsuario }, transaction });
        if (empleadoAsociado) {
            await transaction.rollback();
            throw new ConflictError("Cannot delete user because they are associated with an employee profile.");
        }

        // If there are no restrictions, proceed with user deletion
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
        // Catch any SequelizeForeignKeyConstraintError that might have failed in previous checks
        if (error.name === "SequelizeForeignKeyConstraintError") {
            throw new ConflictError(
                "Cannot delete user due to a foreign key constraint. Ensure there are no dependencies such as recovery tokens or associated profiles."
            );
        }
        console.error(`Error al physically delete user with ID ${idUsuario}:`, error.message);
        throw new CustomError(`Error al physically delete user: ${error.message}`, 500);
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

  /**
   * Verifica si un correo electrónico ya existe en la tabla de Usuarios.
   * @param {string} correo - El correo electrónico a verificar.
   * @returns {Promise<boolean>} - True si el correo existe, false en caso contrario.
   */
  verificarCorreoExistente: async (correo) => {
    try {
      const usuario = await db.Usuario.findOne({
        where: { correo },
        attributes: ['idUsuario'] // Solo necesitamos saber si existe, no traer todos los datos.
      });
      return !!usuario; // Convierte el resultado (objeto o null) a booleano.
    } catch (error) {
      // console.error("Error en el servicio al verificar el correo:", error.message); 
      throw new CustomError(`Error al verificar el correo en el servicio: ${error.message}`, 500);
    }
  },
};