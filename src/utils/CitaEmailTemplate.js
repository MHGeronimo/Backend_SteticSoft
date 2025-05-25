// src/utils/CitaEmailTemplate.js
"use strict";

const mailerService = require("../services/mailer.service.js"); // Ajusta la ruta si es necesario
const { formatDateTime } = require("./dateHelpers.js"); // Necesitamos el formateador

/**
 * Genera el template HTML para el correo de notificación de una cita.
 * @param {object} datosCorreo
 * @param {string} datosCorreo.nombreCliente
 * @param {object} datosCorreo.citaInfo
 * @param {string} datosCorreo.citaInfo.accion - ej: "agendada", "actualizada", "cancelada", "recordatorio"
 * @param {string} datosCorreo.citaInfo.fechaHora - Ya formateada
 * @param {string} datosCorreo.citaInfo.empleado
 * @param {string} datosCorreo.citaInfo.estado - Estado del proceso de la cita
 * @param {Array<object>} datosCorreo.citaInfo.servicios - [{ nombre, precio, descripcion? }]
 * @param {number} datosCorreo.citaInfo.total - Total de los servicios de la cita
 * @param {string} [datosCorreo.citaInfo.mensajeAdicional]
 * @param {string} [datosCorreo.citaInfo.enlaceCancelacion] - Opcional, para cancelar/modificar
 * @param {string} [datosCorreo.citaInfo.enlaceConfirmacion] - Opcional, para confirmar
 * @returns {string} El contenido HTML generado.
 */
const generarTemplateCita = ({ nombreCliente, citaInfo }) => {
  const serviciosHTML =
    citaInfo.servicios && citaInfo.servicios.length > 0
      ? citaInfo.servicios
          .map(
            (s) => `
            <li style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
              <strong style="color: #333;">${s.nombre}</strong> - $${Number(
              s.precio || 0
            ).toFixed(2)}
              ${
                s.descripcion
                  ? `<br><em style="font-size: 0.9em; color: #555;">${s.descripcion}</em>`
                  : ""
              }
            </li>`
          )
          .join("")
      : "<li>No hay servicios especificados para esta cita.</li>";

  let tituloCorreo = "Notificación de Cita";
  let parrafoPrincipal = `Tu cita ha sido <strong>${citaInfo.accion}</strong> con éxito.`;

  if (citaInfo.accion.toLowerCase().includes("recordatorio")) {
    tituloCorreo = "Recordatorio de tu Próxima Cita";
    parrafoPrincipal = `Te recordamos tu próxima cita en SteticSoft.`;
  }

  // Estilos en línea para máxima compatibilidad
  const styles = {
    container:
      "font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 25px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;",
    header:
      "color: #007bff; font-size: 24px; margin-bottom: 15px; text-align: center;",
    greeting: "font-size: 18px; color: #333; margin-bottom: 10px;",
    paragraph:
      "font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 15px;",
    detailsBox:
      "background-color: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #eee;",
    detailItem: "font-size: 16px; margin-bottom: 8px; color: #333;",
    strong: "font-weight: bold; color: #222;",
    serviceList: "list-style-type: none; padding-left: 0; margin-top: 5px;",
    total:
      "font-size: 18px; text-align: right; margin-top: 20px; font-weight: bold; color: #007bff;",
    additionalMessage:
      "background-color: #e9f5fe; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bce0fd; color: #004085;",
    button:
      "display: inline-block; padding: 10px 20px; margin-top: 10px; margin-right: 10px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 15px;",
    footer:
      "color: #7f8c8d; font-size: 14px; margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 15px;",
  };

  return `
    <div style="${styles.container}">
      <h2 style="${styles.header}">${tituloCorreo}</h2>
      <p style="${styles.greeting}">¡Hola ${nombreCliente}!</p>
      <p style="${styles.paragraph}">${parrafoPrincipal}</p>
      
      <div style="${styles.detailsBox}">
        <p style="${styles.detailItem}"><strong style="${
    styles.strong
  }">Fecha y Hora:</strong> ${citaInfo.fechaHora}</p>
        <p style="${styles.detailItem}"><strong style="${
    styles.strong
  }">Especialista:</strong> ${citaInfo.empleado || "Por confirmar"}</p>
        <p style="${styles.detailItem}"><strong style="${
    styles.strong
  }">Estado de la Cita:</strong> ${citaInfo.estado}</p>
      </div>

      <h3 style="color: #007bff; margin-top: 25px; margin-bottom: 10px;">Servicios Agendados:</h3>
      <ul style="${styles.serviceList}">${serviciosHTML}</ul>
      
      ${
        citaInfo.total > 0
          ? `<p style="${styles.total}">Total Estimado: $${Number(
              citaInfo.total
            ).toFixed(2)}</p>`
          : ""
      }

      ${
        citaInfo.mensajeAdicional
          ? `<div style="${styles.additionalMessage}"><p>${citaInfo.mensajeAdicional}</p></div>`
          : ""
      }
      
      ${
        citaInfo.enlaceConfirmacion
          ? `<a href="${citaInfo.enlaceConfirmacion}" style="${styles.button}">Confirmar Cita</a>`
          : ""
      }
      ${
        citaInfo.enlaceCancelacion
          ? `<a href="${citaInfo.enlaceCancelacion}" style="${styles.button} background-color: #dc3545;">Cancelar/Modificar Cita</a>`
          : ""
      }

      <p style="${styles.footer}">
        Gracias por confiar en SteticSoft.<br>
        Si tienes alguna pregunta, no dudes en contactarnos.
      </p>
    </div>
  `;
};

/**
 * Envía el correo de notificación de cita.
 * @param {object} datos - { correo, nombreCliente, citaInfo }
 */
const enviarCorreoCita = async ({ correo, nombreCliente, citaInfo }) => {
  // Validaciones básicas de los parámetros necesarios
  if (
    !correo ||
    !nombreCliente ||
    !citaInfo ||
    !citaInfo.accion ||
    !citaInfo.fechaHora ||
    !citaInfo.estado ||
    !citaInfo.servicios
  ) {
    console.error("Datos incompletos para enviar correo de cita:", {
      correo,
      nombreCliente,
      citaInfo,
    });
    throw new Error(
      "Datos incompletos para generar y enviar el correo de cita."
    );
  }

  const htmlContent = generarTemplateCita({ nombreCliente, citaInfo });
  const subject = `📅 Notificación de Cita ${citaInfo.accion} en SteticSoft`;

  try {
    const resultadoEnvio = await mailerService({
      // Usamos el mailerService refactorizado
      to: correo,
      subject,
      html: htmlContent,
    });
    // Retornar el resultado del envío puede ser útil para el servicio que llama
    return resultadoEnvio; // Asumiendo que mailerService devuelve { success: true, ... } o { success: false, error }
  } catch (error) {
    // El mailerService ya debería loguear el error, pero podemos loguear aquí también el contexto
    console.error(
      `Fallo al intentar enviar correo de cita (${citaInfo.accion}) a ${correo}:`,
      error.message
    );
    // No relanzar para no detener el flujo principal, pero devolver un indicador de fallo
    return { success: false, error: error };
  }
};

module.exports = {
  generarTemplateCita,
  enviarCorreoCita,
};
