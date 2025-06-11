// src/shared/src_api/services/auth.service.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../models");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  CustomError,
  ConflictError,
} = require("../errors");
const {
  JWT_SECRET,
  EMAIL_FROM,
  APP_NAME,
  FRONTEND_URL,
} = require("../config/env.config");
const mailerService = require("./mailer.service.js");

const JWT_EXPIRATION = "1d";
const TOKEN_RECUPERACION_EXPIRATION_MINUTES = 60;
const saltRounds = 10;

/**
 * Registra un nuevo usuario y su perfil de cliente asociado.
 * Asume que el rol por defecto es 'Cliente'.
 * @param {object} datosRegistro - { nombre, apellido, correo, contrasena, telefono, tipoDocumento, numeroDocumento, fechaNacimiento }
 * @returns {Promise<object>} El usuario creado (sin contraseña) y el token JWT.
 */
const registrarUsuario = async (datosRegistro) => {
  const {
    nombre,
    apellido,
    correo,
    contrasena,
    telefono,
    tipoDocumento,
    numeroDocumento,
    fechaNacimiento,
  } = datosRegistro;

  const usuarioExistente = await db.Usuario.findOne({ where: { correo } });
  if (usuarioExistente) {
    throw new ConflictError(
      `El correo electrónico '${correo}' ya está registrado para una cuenta.`
    );
  }

  const clienteConDocumento = await db.Cliente.findOne({
    where: { numeroDocumento },
  });
  if (clienteConDocumento) {
    throw new ConflictError(
      `El número de documento '${numeroDocumento}' ya está registrado para un cliente.`
    );
  }

  const clienteConCorreo = await db.Cliente.findOne({ where: { correo } });
  if (clienteConCorreo) {
    throw new ConflictError(
      `El correo electrónico '${correo}' ya está registrado para un perfil de cliente.`
    );
  }

  const rolCliente = await db.Rol.findOne({ where: { nombre: "Cliente" } });
  if (!rolCliente) {
    console.error(
      "Error crítico: El rol 'Cliente' no se encuentra en la base de datos."
    );
    throw new CustomError(
      "No se pudo completar el registro debido a un error de configuración.",
      500
    );
  }

  const transaction = await db.sequelize.transaction();
  try {
    const contrasenaHasheada = await bcrypt.hash(contrasena, saltRounds);

    const nuevoUsuario = await db.Usuario.create(
      {
        correo,
        contrasena: contrasenaHasheada,
        idRol: rolCliente.idRol,
        estado: true,
      },
      { transaction }
    );

    await db.Cliente.create(
      {
        idUsuario: nuevoUsuario.idUsuario,
        nombre,
        apellido,
        correo,
        telefono,
        tipoDocumento,
        numeroDocumento,
        fechaNacimiento,
        estado: true,
      },
      { transaction }
    );

    await transaction.commit();

    const payload = {
      idUsuario: nuevoUsuario.idUsuario,
      idRol: nuevoUsuario.idRol,
      rolNombre: rolCliente.nombre,
      correo: nuevoUsuario.correo,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

    const { contrasena: _, ...usuarioSinContrasena } = nuevoUsuario.toJSON();

    try {
      const htmlBienvenida = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>¡Bienvenido/a a ${APP_NAME || "SteticSoft"}, ${nombre}!</h2>
          <p>Gracias por registrarte en nuestra plataforma. Tu cuenta ha sido creada exitosamente.</p>
          <p>Ahora puedes iniciar sesión y empezar a gestionar tus citas y servicios.</p>
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          <p>Saludos,<br>El equipo de ${APP_NAME || "SteticSoft"}</p>
        </div>`;
      await mailerService({
        to: nuevoUsuario.correo,
        subject: `¡Bienvenido/a a ${APP_NAME || "SteticSoft"}!`,
        html: htmlBienvenida,
      });
    } catch (emailError) {
      console.error(
        `Error al enviar correo de bienvenida a ${nuevoUsuario.correo}:`,
        emailError
      );
    }

    return { usuario: usuarioSinContrasena, token };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ConflictError) throw error;
    if (error.name === "SequelizeUniqueConstraintError") {
      let mensajeConflicto =
        "Uno de los datos proporcionados ya está en uso (correo o número de documento).";
      if (error.fields) {
        if (error.fields.correo && error.fields.correo === correo)
          mensajeConflicto = `El correo electrónico '${correo}' ya está registrado.`;
        if (
          error.fields.numerodocumento &&
          error.fields.numerodocumento === numeroDocumento
        )
          mensajeConflicto = `El número de documento '${numeroDocumento}' ya está registrado.`;
      }
      throw new ConflictError(mensajeConflicto);
    }
    console.error(
      "Error al registrar el usuario en el servicio:",
      error.message,
      error.stack
    );
    throw new CustomError(`Error durante el registro: ${error.message}`, 500);
  }
};

const loginUsuario = async (correo, contrasena) => {
  const usuario = await db.Usuario.findOne({
    where: { correo, estado: true },
    include: [
      {
        model: db.Rol,
        as: "rol",
        attributes: ["idRol", "nombre"],
        include: [
          {
            model: db.Permisos,
            as: "permisos",
            attributes: ["nombre"], // Solo necesitamos el nombre del permiso
            through: { attributes: [] }, // No traer la tabla de unión
          },
        ],
      },
    ],
  });

  if (!usuario) {
    throw new UnauthorizedError("Credenciales inválidas.");
  }

  const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
  if (!contrasenaValida) {
    throw new UnauthorizedError("Credenciales inválidas.");
  }

  const payload = {
    idUsuario: usuario.idUsuario,
    idRol: usuario.idRol,
    rolNombre: usuario.rol ? usuario.rol.nombre : null,
    correo: usuario.correo,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

  // Transformar la data para el frontend
  const usuarioJSON = usuario.toJSON();

  // Extraer solo los nombres de los permisos en un array simple
  const permisosNombres = usuarioJSON.rol?.permisos?.map((p) => p.nombre) || [];

  // Limpiar datos sensibles o redundantes antes de enviar
  delete usuarioJSON.contrasena;
  if (usuarioJSON.rol) {
    delete usuarioJSON.rol.permisos; // Quitar el array de objetos de permisos
  }
  
  // Añadir el array de nombres de permisos al objeto de usuario
  usuarioJSON.permisos = permisosNombres;

  return { usuario: usuarioJSON, token };
};


const solicitarRecuperacionContrasena = async (correo) => {
  const usuario = await db.Usuario.findOne({ where: { correo, estado: true } });
  if (!usuario) {
    console.warn(
      `Intento de recuperación para correo no existente o inactivo: ${correo}`
    );
    return;
  }

  const tokenRecuperacion = crypto.randomBytes(32).toString("hex");
  const fechaExpiracion = new Date(
    Date.now() + TOKEN_RECUPERACION_EXPIRATION_MINUTES * 60 * 1000
  );

  await db.TokenRecuperacion.destroy({
    where: { idUsuario: usuario.idUsuario },
  });
  await db.TokenRecuperacion.create({
    idUsuario: usuario.idUsuario,
    token: tokenRecuperacion,
    fechaExpiracion,
  });

  const enlaceRecuperacion = `${
    FRONTEND_URL || "http://localhost:3001"
  }/resetear-contrasena?token=${tokenRecuperacion}`;

  const htmlCorreo = `
    <div style="font-family: Arial, sans-serif; color: #333;">
        <p>Hola ${usuario.correo},</p>
        <p>Has solicitado restablecer tu contraseña para ${
          APP_NAME || "SteticSoft"
        }.</p>
        <p>Por favor, haz clic en el siguiente enlace o cópialo en tu navegador para continuar:</p>
        <p><a href="${enlaceRecuperacion}">${enlaceRecuperacion}</a></p>
        <p>Este enlace expirará en ${TOKEN_RECUPERACION_EXPIRATION_MINUTES} minutos.</p>
        <p>Si no solicitaste esto, por favor ignora este correo.</p>
        <p>Saludos,<br>El equipo de ${APP_NAME || "SteticSoft"}</p>
    </div>`;

  try {
    await mailerService({
      to: usuario.correo,
      subject: `Recuperación de Contraseña - ${APP_NAME || "SteticSoft"}`,
      html: htmlCorreo,
    });
    console.log(`Correo de recuperación enviado a ${usuario.correo}`);
  } catch (error) {
    console.error(
      `Error al enviar correo de recuperación a ${usuario.correo}:`,
      error
    );
  }
};

const validarTokenRecuperacion = async (token) => {
  // Necesitamos Op de Sequelize para la comparación de fechas
  const { Op } = require("sequelize");

  if (!token)
    throw new BadRequestError(
      "Token de recuperación no proporcionado o inválido."
    );
  const tokenData = await db.TokenRecuperacion.findOne({
    where: { token: token, fechaExpiracion: { [Op.gt]: new Date() } },
  });
  if (!tokenData)
    throw new BadRequestError("Token de recuperación inválido o expirado.");
  return tokenData;
};

const resetearContrasena = async (token, nuevaContrasena) => {
  const tokenDataValido = await validarTokenRecuperacion(token);
  const usuario = await db.Usuario.findByPk(tokenDataValido.idUsuario);
  if (!usuario || !usuario.estado)
    throw new NotFoundError(
      "Usuario asociado al token no encontrado o inactivo."
    );

  const contrasenaHasheada = await bcrypt.hash(nuevaContrasena, saltRounds);
  const transaction = await db.sequelize.transaction();
  try {
    await usuario.update({ contrasena: contrasenaHasheada }, { transaction });
    await db.TokenRecuperacion.destroy({
      where: { id: tokenDataValido.id },
      transaction,
    });
    await transaction.commit();
    console.log(`Contraseña reseteada para usuario ID: ${usuario.idUsuario}`);

    const htmlConfirmacion = `
    <div style="font-family: Arial, sans-serif; color: #333;">
        <p>Hola ${usuario.correo},</p>
        <p>Tu contraseña para ${
          APP_NAME || "SteticSoft"
        } ha sido actualizada exitosamente.</p>
        <p>Si no realizaste este cambio, por favor contacta a soporte inmediatamente.</p>
    </div>`;
    try {
      await mailerService({
        to: usuario.correo,
        subject: `Confirmación de Cambio de Contraseña - ${
          APP_NAME || "SteticSoft"
        }`,
        html: htmlConfirmacion,
      });
    } catch (emailError) {
      console.error(
        `Error al enviar correo de confirmación de cambio de contraseña a ${usuario.correo}:`,
        emailError
      );
    }
  } catch (error) {
    await transaction.rollback();
    console.error(
      `Error al resetear la contraseña para usuario ID ${usuario.idUsuario}:`,
      error.message,
      error.stack
    );
    throw new CustomError(
      `Error al resetear la contraseña: ${error.message}`,
      500
    );
  }
};

module.exports = {
  registrarUsuario,
  loginUsuario,
  solicitarRecuperacionContrasena,
  validarTokenRecuperacion,
  resetearContrasena,
};