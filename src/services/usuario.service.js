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
* @function crearUsuario
* @description Crea un nuevo usuario, su perfil asociado (Cliente o Empleado) según el tipo de rol,
* y devuelve el objeto completo del usuario con sus asociaciones.
* @param {object} usuarioData - Datos del usuario y su perfil.
* @returns {Promise<object>} El objeto del usuario recién creado con todas sus relaciones.
*/
export const crearUsuario = async (usuarioData) => {
 const t = await sequelize.transaction();
 try {
   // --- INICIO DE CORRECCIÓN ---

   // 1. Desestructuramos TODOS los campos necesarios del objeto que llega.
   const { 
     email, password, rolId, 
     nombres, apellidos, telefono, 
     tipoDocumento, numeroDocumento, fechaNacimiento 
   } = usuarioData;

   // 2. Buscamos el rol para determinar qué tipo de perfil crear.
   const rol = await Rol.findByPk(rolId, { transaction: t });
   if (!rol) {
     throw new Error('El rol especificado no existe.');
   }

   // 3. Hasheamos la contraseña
   const salt = await bcrypt.genSalt(10);
   const hashedPassword = await bcrypt.hash(password, salt);

   // 4. Creamos el registro en la tabla 'usuarios'
   const nuevoUsuario = await Usuario.create({
     email,
     password: hashedPassword,
     rolId,
   }, { transaction: t });

   // 5. Lógica condicional basada en 'tipoPerfil' del rol.
   //    Ahora pasamos TODOS los campos obligatorios al crear el perfil.
   if (rol.tipoPerfil === 'CLIENTE') {
     await Cliente.create({
       nombres,
       apellidos,
       telefono,
       correo: email, // El correo es el mismo de la cuenta
       tipoDocumento,
       numeroDocumento,
       fechaNacimiento,
       usuarioId: nuevoUsuario.id,
     }, { transaction: t });
   } else if (rol.tipoPerfil === 'EMPLEADO') {
     await Empleado.create({
       nombres,
       apellidos,
       telefono,
       correo: email, // El correo es el mismo de la cuenta
       tipoDocumento,
       numeroDocumento,
       fechaNacimiento,
       usuarioId: nuevoUsuario.id,
     }, { transaction: t });
   }

   // 6. Confirmamos la transacción
   await t.commit();

   // 7. Obtenemos y devolvemos el usuario completo (sin cambios aquí, ya estaba bien).
   const usuarioCompleto = await Usuario.findByPk(nuevoUsuario.id, {
     include: [
       { model: Rol, as: 'rol', attributes: ['id', 'nombre'] },
       { model: Cliente, as: 'clienteInfo', attributes: { exclude: ['usuarioId', 'createdAt', 'updatedAt'] } },
       { model: Empleado, as: 'empleadoInfo', attributes: { exclude: ['usuarioId', 'createdAt', 'updatedAt'] } },
     ],
     attributes: { exclude: ['password'] },
   });

   return usuarioCompleto;

   // --- FIN DE CORRECCIÓN ---

 } catch (error) {
   await t.rollback();
   console.error('Error al crear el usuario:', error);
   // Ahora, si hay un error de Sequelize, se propagará un mensaje más claro.
   throw new Error(`Error en el servicio al crear usuario: ${error.message}`);
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