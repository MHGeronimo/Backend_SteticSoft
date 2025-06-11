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
 * Internal helper to change a user's status.
 * @param {number} idUsuario - User ID.
 * @param {boolean} nuevoEstado - The new status (true for enable, false for disable).
 * @returns {Promise<object>} The user with the changed status (without password).
 */
const cambiarEstadoUsuario = async (idUsuario, nuevoEstado) => {
  const usuario = await db.Usuario.findByPk(idUsuario);
  if (!usuario) {
    throw new NotFoundError("User not found to change status.");
  }
  if (usuario.estado === nuevoEstado) {
    const { contrasena: _, ...usuarioSinCambio } = usuario.toJSON();
    return usuarioSinCambio; // Already in the desired state
  }
  await usuario.update({ estado: nuevoEstado });
  const { contrasena: _, ...usuarioActualizado } = usuario.toJSON();
  return usuarioActualizado;
};

/**
 * Creates a new user and their associated profile (Client or Employee) if the role requires it.
 * All data (for User and for Profile) must come in the 'datosCompletosUsuario' object.
 */
const crearUsuario = async (datosCompletosUsuario) => {
  // Data for the User table
  const { correo, contrasena, idRol, estado } = datosCompletosUsuario;

  // Data for the profile (Client or Employee) - will be extracted from the same object
  const {
    nombre,
    apellido,      // Added
    telefono,      // Added (replaces cell)
    tipoDocumento,
    numeroDocumento,
    fechaNacimiento,
    // 'direccion' // If you decide to include and manage it
  } = datosCompletosUsuario;

  const usuarioExistente = await db.Usuario.findOne({ where: { correo } });
  if (usuarioExistente) {
    throw new ConflictError(
      `The email address '${correo}' is already registered.`
    );
  }

  const rol = await db.Rol.findOne({ where: { idRol, estado: true } });
  if (!rol) {
    throw new BadRequestError(
      `The role with ID ${idRol} does not exist or is not active.`
    );
  }

  const transaction = await db.sequelize.transaction(); // Start transaction

  try {
    const contrasenaHasheada = await bcrypt.hash(contrasena, saltRounds);

    const nuevoUsuario = await db.Usuario.create({
      correo,
      contrasena: contrasenaHasheada,
      idRol,
      estado: typeof estado === "boolean" ? estado : true,
    }, { transaction });

    // Create associated profile based on role
    if (rol.nombre === "Cliente") {
      // Basic validation of client profile fields (could be in validators)
      if (!nombre || !apellido || !telefono || !tipoDocumento || !numeroDocumento || !fechaNacimiento) {
        await transaction.rollback();
        throw new BadRequestError("Missing required client profile fields.");
      }
       // Validate if client's document number already exists
      const clienteConDocumento = await db.Cliente.findOne({ where: { numeroDocumento }, transaction });
      if (clienteConDocumento) {
        await transaction.rollback();
        throw new ConflictError(`The document number '${numeroDocumento}' is already registered for a client.`);
      }
       // Validate if client's email already exists (if Cliente.correo is UNIQUE)
      const clienteConCorreo = await db.Cliente.findOne({ where: { correo }, transaction }); // Assuming client's email is the same
      if (clienteConCorreo) {
        await transaction.rollback();
        throw new ConflictError(`The email '${correo}' is already registered for a client profile.`);
      }

      await db.Cliente.create({
        idUsuario: nuevoUsuario.idUsuario,
        nombre,
        apellido,
        correo, // The client's email is the same as the user's
        telefono,
        tipoDocumento,
        numeroDocumento,
        fechaNacimiento,
        // direccion: datosCompletosUsuario.direccion, // If included
        estado: true, // Client profile active by default
      }, { transaction });

    } else if (rol.nombre === "Empleado") {
      // Similar logic to create an Employee if the role is "Employee"
      // Now, Employee has the same personal information fields as Client
      if (!nombre || !apellido || !telefono || !tipoDocumento || !numeroDocumento || !fechaNacimiento) {
        await transaction.rollback();
        throw new BadRequestError("Missing required employee profile fields.");
      }
      
      const empleadoConDocumento = await db.Empleado.findOne({ where: { numeroDocumento }, transaction });
      if (empleadoConDocumento) {
          await transaction.rollback();
          throw new ConflictError(`The document number '${numeroDocumento}' is already registered for an employee.`);
      }
      
      const empleadoConCorreo = await db.Empleado.findOne({ where: { correo }, transaction });
      if (empleadoConCorreo) {
          await transaction.rollback();
          throw new ConflictError(`The email '${correo}' is already registered for an employee profile.`);
      }

      await db.Empleado.create({
        idUsuario: nuevoUsuario.idUsuario,
        nombre,
        apellido,       // Added
        correo,         // Added
        telefono,       // Added
        tipoDocumento,
        numeroDocumento,
        fechaNacimiento,
        estado: true,
      }, { transaction });
    }

    await transaction.commit(); // Commit transaction

    // Return the user with their profile for consistency with obtenerUsuarioPorId and obtenerTodosLosUsuarios
    const usuarioConPerfil = await db.Usuario.findByPk(nuevoUsuario.idUsuario, {
        attributes: ["idUsuario", "correo", "estado", "idRol"],
        include: [
            { model: db.Rol, as: "rol", attributes: ["idRol", "nombre"] },
            { model: db.Cliente, as: "clienteInfo", required: false },
            { model: db.Empleado, as: "empleadoInfo", required: false } // If configured
        ]
    });
    // Sequelize returns a model instance, toJSON() converts it to a plain object.
    return usuarioConPerfil ? usuarioConPerfil.toJSON() : null; 
    
  } catch (error) {
    await transaction.rollback(); // Rollback transaction in case of error
    if (error instanceof ConflictError || error instanceof BadRequestError) {
        throw error;
    }
    if (error.name === "SequelizeUniqueConstraintError") {
      // This block captures uniqueness errors that were not explicitly validated before,
      // including email or document_number if a duplicate is attempted.
      let mensajeConflicto =
        "One of the provided data points is already in use (email or document number).";
      if (error.fields) {
        if (error.fields.correo && error.fields.correo === correo)
          mensajeConflicto = `The email address '${correo}' is already registered.`;
        if (
          error.fields.numerodocumento &&
          error.fields.numerodocumento === numeroDocumento
        )
          mensajeConflicto = `The document number '${numeroDocumento}' is already registered.`;
      }
      throw new ConflictError(mensajeConflicto);
    }
    // console.error("Error al crear el usuario y/o perfil en el servicio:", error.message); // Commented
    throw new CustomError(`Error al create user: ${error.message}`, 500);
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
            "correo", // Added
            "telefono",
            "tipoDocumento",
            "numeroDocumento",
            "fechaNacimiento",
          ],
          required: false,
        },
        {
          model: db.Empleado, // Assuming it exists and is associated in Usuario.model.js with alias 'empleadoInfo'
          as: "empleadoInfo",
          attributes: [
            "idEmpleado",
            "nombre",
            "apellido", // Added
            "correo",   // Added
            "telefono", // Replaces "celular"
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
    // console.error("Error al obtener todos los usuarios en el servicio:", error.message); // Commented
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
            "correo", // Added
            "telefono",
            "tipoDocumento",
            "numeroDocumento",
            "fechaNacimiento",
          ],
          required: false,
        },
        {
          model: db.Empleado, // Assuming it exists and is associated in Usuario.model.js with alias 'empleadoInfo'
          as: "empleadoInfo",
          attributes: [
            "idEmpleado",
            "nombre",
            "apellido", // Added
            "correo",   // Added
            "telefono", // Replaces "celular"
            "tipoDocumento",
            "numeroDocumento",
            "fechaNacimiento",
          ],
          required: false,
        },
      ],
    });
    if (!usuario) {
      throw new NotFoundError("User not found.");
    }
    return usuario;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    // console.error(`Error al obtener el usuario con ID ${idUsuario} en el servicio:`, error.message); // Commented
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

    // Separate data for User and for Profile
    const datosParaUsuario = {};
    const datosParaPerfilCliente = {};
    const datosParaPerfilEmpleado = {}; // If applicable

    // User table fields
    if (datosActualizar.hasOwnProperty('correo')) datosParaUsuario.correo = datosActualizar.correo;
    if (datosActualizar.hasOwnProperty('idRol')) datosParaUsuario.idRol = datosActualizar.idRol;
    if (datosActualizar.hasOwnProperty('estado')) datosParaUsuario.estado = datosActualizar.estado;
    if (datosActualizar.contrasena) datosParaUsuario.contrasena = datosActualizar.contrasena; // Will be hashed later

    // Client profile fields (example)
    if (datosActualizar.hasOwnProperty('nombre')) datosParaPerfilCliente.nombre = datosActualizar.nombre;
    if (datosActualizar.hasOwnProperty('apellido')) datosParaPerfilCliente.apellido = datosActualizar.apellido;
    if (datosActualizar.hasOwnProperty('telefono')) datosParaPerfilCliente.telefono = datosActualizar.telefono;
    if (datosActualizar.hasOwnProperty('tipoDocumento')) datosParaPerfilCliente.tipoDocumento = datosActualizar.tipoDocumento;
    if (datosActualizar.hasOwnProperty('numeroDocumento')) datosParaPerfilCliente.numeroDocumento = datosActualizar.numeroDocumento;
    if (datosActualizar.hasOwnProperty('fechaNacimiento')) datosParaPerfilCliente.fechaNacimiento = datosActualizar.fechaNacimiento;
    // if (datosActualizar.hasOwnProperty('direccion')) datosParaPerfilCliente.direccion = datosActualizar.direccion;

    // Employee profile fields (now with the same fields as Client)
    // It is assumed that this data will come directly in datosActualizar if the user is an employee.
    if (datosActualizar.hasOwnProperty('nombre')) datosParaPerfilEmpleado.nombre = datosActualizar.nombre;
    if (datosActualizar.hasOwnProperty('apellido')) datosParaPerfilEmpleado.apellido = datosActualizar.apellido;
    if (datosActualizar.hasOwnProperty('correo')) datosParaPerfilEmpleado.correo = datosActualizar.correo; // Email in Employee profile
    if (datosActualizar.hasOwnProperty('telefono')) datosParaPerfilEmpleado.telefono = datosActualizar.telefono;
    if (datosActualizar.hasOwnProperty('tipoDocumento')) datosParaPerfilEmpleado.tipoDocumento = datosActualizar.tipoDocumento;
    if (datosActualizar.hasOwnProperty('numeroDocumento')) datosParaPerfilEmpleado.numeroDocumento = datosActualizar.numeroDocumento;
    if (datosActualizar.hasOwnProperty('fechaNacimiento')) datosParaPerfilEmpleado.fechaNacimiento = datosActualizar.fechaNacimiento;

    // Validations (as in your original code)
    if (datosParaUsuario.correo && datosParaUsuario.correo !== usuario.correo) {
      const usuarioConMismoCorreo = await db.Usuario.findOne({
        where: { correo: datosParaUsuario.correo, idUsuario: { [Op.ne]: idUsuario } },
        transaction,
      });
      if (usuarioConMismoCorreo) {
        await transaction.rollback();
        throw new ConflictError(`The email address '${datosParaUsuario.correo}' is already registered by another user.`);
      }
    }

    if (datosParaUsuario.contrasena) {
      datosParaUsuario.contrasena = await bcrypt.hash(datosParaUsuario.contrasena, saltRounds);
    }

    if (datosParaUsuario.idRol && datosParaUsuario.idRol !== usuario.idRol) {
      const rolNuevo = await db.Rol.findOne({ where: { idRol: datosParaUsuario.idRol, estado: true }, transaction });
      if (!rolNuevo) {
        await transaction.rollback();
        throw new BadRequestError(`The new role with ID ${datosParaUsuario.idRol} does not exist or is not active.`);
      }
    }
    
    // Update User
    if (Object.keys(datosParaUsuario).length > 0) {
        await usuario.update(datosParaUsuario, { transaction });
    }

    // Get the current role of the user to know which profile to update
    const rolActual = await db.Rol.findByPk(usuario.idRol, { transaction }); 

    // Update Client Profile if there is data and the user has this profile
    if (rolActual && rolActual.nombre === "Cliente" && Object.keys(datosParaPerfilCliente).length > 0) {
      const cliente = await db.Cliente.findOne({ where: { idUsuario }, transaction });
      if (cliente) {
        // Validate uniqueness of client's numeroDocumento if it's being changed
        if (datosParaPerfilCliente.numeroDocumento && datosParaPerfilCliente.numeroDocumento !== cliente.numeroDocumento) {
            const otroClienteConDocumento = await db.Cliente.findOne({ 
                where: { numeroDocumento: datosParaPerfilCliente.numeroDocumento, idCliente: { [Op.ne]: cliente.idCliente } }, 
                transaction 
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
};