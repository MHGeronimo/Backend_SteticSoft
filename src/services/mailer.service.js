// src/services/mailer.service.js
"use strict";

const transporter = require("../config/mailer.config.js"); // Importa el transporter configurado
const { EMAIL_FROM } = require("../config/env.config.js"); // Para el remitente por defecto

/**
 * Verifica la conexión y configuración del transporter de Nodemailer.
 * Es útil llamarla al iniciar la aplicación para un diagnóstico temprano.
 * @returns {Promise<boolean>} true si la verificación es exitosa, false en caso contrario.
 */
const verifyMailerConnection = async () => {
  if (!transporter) {
    console.error(
      "❌ Transporter de Nodemailer no está configurado/importado correctamente."
    );
    return false;
  }
  try {
    await transporter.verify();
    console.log(
      "📨 Servidor de correo (Nodemailer) está listo para enviar mensajes."
    );
    return true;
  } catch (error) {
    console.error(
      "❌ Error al verificar la configuración del servidor de correo (Nodemailer):",
      {
        message: error.message,
        code: error.code,
      }
    );
    console.warn("⚠️ El servicio de correo podría no estar operativo.");
    return false;
  }
};

/**
 * Envía un correo electrónico usando el transporter configurado.
 * @param {object} mailData - Datos del correo a enviar.
 * @param {string} mailData.to - Destinatario(s) del correo, separados por coma si son varios.
 * @param {string} mailData.subject - Asunto del correo.
 * @param {string} mailData.html - Contenido HTML del correo.
 * @param {string} [mailData.text] - Contenido en texto plano del correo (opcional, fallback).
 * @param {string} [mailData.from] - Remitente del correo (opcional, por defecto usa EMAIL_FROM).
 * @param {Array} [mailData.attachments] - Array de adjuntos (opcional).
 * @returns {Promise<object>} Un objeto indicando el resultado del envío.
 * Ej: { success: true, messageId: '...', response: '...' }
 * o  { success: false, error: Error }
 */
const sendMail = async ({ to, subject, html, text, from, attachments }) => {
  if (!transporter) {
    const errorMessage =
      "El servicio de correo (transporter) no está inicializado.";
    console.error(`❌ ${errorMessage}`);
    return { success: false, error: new Error(errorMessage) };
  }

  if (!to || !subject || !html) {
    const errorMessage =
      "Faltan parámetros requeridos para enviar el correo (to, subject, html).";
    console.error(`❌ ${errorMessage}`);
    return { success: false, error: new Error(errorMessage) };
  }

  const mailOptions = {
    from:
      from ||
      EMAIL_FROM ||
      '"SteticSoft Notificaciones" <no-reply@steticsoft.com>', // Remitente
    to: Array.isArray(to) ? to.join(", ") : to, // Destinatario(s)
    subject: subject, // Asunto
    html: html, // Cuerpo HTML
    text: text || html.replace(/<[^>]*>/g, ""), // Cuerpo en texto plano (opcional, fallback)
    attachments: attachments || [], // Adjuntos (opcional)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(
      `✅ Correo enviado exitosamente a: ${mailOptions.to}. Asunto: "${subject}". Message ID: ${info.messageId}`
    );
    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
      envelope: info.envelope,
    };
  } catch (error) {
    console.error(
      `❌ Error detallado al enviar correo a ${mailOptions.to} con asunto "${subject}":`,
      {
        message: error.message,
        code: error.code,
        // stack: error.stack // Puede ser muy verboso para logs de rutina de correo
      }
    );
    return { success: false, error: error }; // Devolver el error para que el llamador pueda manejarlo
  }
};

// Verificar la conexión al iniciar el módulo (opcional pero recomendado)
// verifyMailerConnection(); // Puedes llamar a esto en server.js o aquí si lo prefieres.

// La exportación principal es la función sendMail
module.exports = sendMail;
