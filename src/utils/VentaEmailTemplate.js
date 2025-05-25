// src/utils/VentaEmailTemplate.js
"use strict";

const mailerService = require("../services/mailer.service.js");
const { formatDate } = require("./dateHelpers.js");

/**
 * Genera el template HTML para el correo de notificación de una venta.
 * @param {object} datosCorreo
 * @param {string} datosCorreo.nombreCliente
 * @param {object} datosCorreo.ventaInfo
 * @param {number} datosCorreo.ventaInfo.idVenta
 * @param {string} datosCorreo.ventaInfo.accion
 * @param {string} datosCorreo.ventaInfo.fecha - Ya formateada
 * @param {string} datosCorreo.ventaInfo.estado - Estado del proceso de la venta
 * @param {Array<object>} datosCorreo.ventaInfo.productos - [{ nombre, cantidad, valorUnitario, descripcion? }]
 * @param {Array<object>} datosCorreo.ventaInfo.servicios - [{ nombre, valorServicio, descripcion? }]
 * @param {number} datosCorreo.ventaInfo.subtotal
 * @param {number} datosCorreo.ventaInfo.iva
 * @param {number} datosCorreo.ventaInfo.total
 * @param {number} datosCorreo.ventaInfo.tasaIvaAplicada - La tasa de IVA usada (ej. 0.19 para 19%)
 * @param {string} [datosCorreo.ventaInfo.mensajeAdicional]
 * @returns {string} El contenido HTML generado.
 */
const generarTemplateVenta = ({ nombreCliente, ventaInfo }) => {
  const productosHTML =
    ventaInfo.productos && ventaInfo.productos.length > 0
      ? ventaInfo.productos
          .map(
            (p) => `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${
                p.nombre
              } ${
              p.descripcion
                ? `<br><small style="color: #555;">${p.descripcion}</small>`
                : ""
            }</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${
                p.cantidad
              }</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(
                p.valorUnitario || 0
              ).toFixed(2)}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(
                Number(p.cantidad) * Number(p.valorUnitario || 0)
              ).toFixed(2)}</td>
            </tr>`
          )
          .join("")
      : "";

  const serviciosHTML =
    ventaInfo.servicios && ventaInfo.servicios.length > 0
      ? ventaInfo.servicios
          .map(
            (s) => `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;" colspan="3">${
                s.nombre
              } ${
              s.descripcion
                ? `<br><small style="color: #555;">${s.descripcion}</small>`
                : ""
            }</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(
                s.valorServicio || 0
              ).toFixed(2)}</td>
            </tr>`
          )
          .join("")
      : "";

  const tieneProductos = ventaInfo.productos && ventaInfo.productos.length > 0;
  const tieneServicios = ventaInfo.servicios && ventaInfo.servicios.length > 0;

  const tasaIvaParaMostrar =
    ventaInfo.tasaIvaAplicada !== undefined ? ventaInfo.tasaIvaAplicada : 0.19; // Fallback si no se pasa

  const styles = {
    container:
      "font-family: Arial, sans-serif; max-width: 700px; margin: 20px auto; padding: 25px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;",
    header:
      "color: #2c3e50; font-size: 24px; margin-bottom: 15px; text-align: center;",
    greeting: "font-size: 18px; color: #333; margin-bottom: 10px;",
    paragraph:
      "font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 15px;",
    detailsBox:
      "background-color: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #eee;",
    detailItem: "font-size: 16px; margin-bottom: 8px; color: #333;",
    strong: "font-weight: bold; color: #222;",
    table:
      "width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; font-size: 15px;",
    th: "background-color: #f0f0f0; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; color: #333;",
    totalsSection:
      "margin-top: 20px; padding-top: 15px; border-top: 2px solid #ccc; text-align: right;",
    totalItem: "font-size: 16px; margin-bottom: 5px;",
    grandTotal:
      "font-size: 18px; font-weight: bold; color: #2c3e50; margin-top: 10px;",
    footer:
      "color: #7f8c8d; font-size: 14px; margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 15px;",
  };

  return `
    <div style="${styles.container}">
      <h2 style="${styles.header}">Confirmación de Venta #${
    ventaInfo.idVenta
  }</h2>
      <p style="${styles.greeting}">¡Hola ${nombreCliente}!</p>
      <p style="${styles.paragraph}">Tu venta ha sido <strong>${
    ventaInfo.accion
  }</strong>. A continuación, encontrarás los detalles:</p>
      
      <div style="${styles.detailsBox}">
        <p style="${styles.detailItem}"><strong style="${
    styles.strong
  }">Fecha:</strong> ${ventaInfo.fecha}</p>
        <p style="${styles.detailItem}"><strong style="${
    styles.strong
  }">Estado de la Venta:</strong> ${ventaInfo.estado}</p>
      </div>

      ${
        tieneProductos
          ? `
        <h3 style="color: #2c3e50; margin-top: 25px; margin-bottom: 5px;">Productos Adquiridos:</h3>
        <table style="${styles.table}">
          <thead>
            <tr>
              <th style="${styles.th}">Producto</th>
              <th style="${styles.th} text-align: center;">Cantidad</th>
              <th style="${styles.th} text-align: right;">P. Unit.</th>
              <th style="${styles.th} text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${productosHTML}
          </tbody>
        </table>`
          : ""
      }

      ${
        tieneServicios
          ? `
        <h3 style="color: #2c3e50; margin-top: 25px; margin-bottom: 5px;">Servicios Adquiridos:</h3>
        <table style="${styles.table}">
          <thead>
            <tr>
              <th style="${styles.th}" colspan="3">Servicio</th>
              <th style="${styles.th} text-align: right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${serviciosHTML}
          </tbody>
        </table>`
          : ""
      }
      
      <div style="${styles.totalsSection}">
        <p style="${styles.totalItem}"><strong style="${
    styles.strong
  }">Subtotal:</strong> $${Number(ventaInfo.subtotal || 0).toFixed(2)}</p>
        <p style="${styles.totalItem}"><strong style="${styles.strong}">IVA (${(
    tasaIvaParaMostrar * 100
  ).toFixed(0)}%):</strong> $${Number(ventaInfo.iva || 0).toFixed(2)}</p>
        <p style="${styles.grandTotal}">Total General: $${Number(
    ventaInfo.total || 0
  ).toFixed(2)}</p>
      </div>

      ${
        ventaInfo.mensajeAdicional
          ? `<p style="font-size: 15px; color: #555; margin-top: 20px;">${ventaInfo.mensajeAdicional}</p>`
          : ""
      }

      <p style="${styles.footer}">
        Gracias por tu compra en SteticSoft.<br>
        Si tienes alguna pregunta, no dudes en contactarnos.
      </p>
    </div>
  `;
};

const enviarCorreoVenta = async ({
  correoCliente,
  nombreCliente,
  ventaInfo,
}) => {
  // ... (la validación de datos de entrada que tenías está bien)
  if (
    !correoCliente ||
    !nombreCliente ||
    !ventaInfo ||
    !ventaInfo.accion ||
    !ventaInfo.fecha ||
    !ventaInfo.estado ||
    !ventaInfo.idVenta ||
    ventaInfo.tasaIvaAplicada === undefined
  ) {
    // Añadida validación para tasaIvaAplicada
    console.error(
      "Datos incompletos para enviar correo de venta (incluyendo tasaIvaAplicada):",
      { correoCliente, nombreCliente, ventaInfo }
    );
    throw new Error(
      "Datos incompletos para generar y enviar el correo de venta."
    );
  }
  if (
    (!ventaInfo.productos || ventaInfo.productos.length === 0) &&
    (!ventaInfo.servicios || ventaInfo.servicios.length === 0)
  ) {
    console.error("Correo de venta sin productos ni servicios:", ventaInfo);
    throw new Error(
      "Una venta debe tener productos o servicios para notificar."
    );
  }

  const htmlContent = generarTemplateVenta({ nombreCliente, ventaInfo });
  const subject = `🛍️ Detalles de tu Venta #${ventaInfo.idVenta} ${ventaInfo.accion} en SteticSoft`;

  try {
    const resultadoEnvio = await mailerService({
      to: correoCliente,
      subject,
      html: htmlContent,
    });
    return resultadoEnvio;
  } catch (error) {
    console.error(
      `Fallo al intentar enviar correo de venta (${ventaInfo.accion}) #${ventaInfo.idVenta} a ${correoCliente}:`,
      error.message
    );
    return { success: false, error: error };
  }
};

module.exports = {
  generarTemplateVenta,
  enviarCorreoVenta,
};
