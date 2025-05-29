// src/utils/stockAlertHelper.js
"use strict";

const mailerService = require("../services/mailer.service.js");
const { ADMIN_EMAIL, APP_NAME } = require("../config/env.config.js");

/**
 * Sends a stock alert email to the administrator.
 * @param {object} producto - The product object from Sequelize (must include idProducto, nombre, existencia, stockMinimo).
 * @param {string} [motivo="bajo stock"] - The reason for the alert (e.g., "bajo stock por venta", "bajo stock por abastecimiento").
 */
const sendStockAlertEmail = async (
  producto,
  motivo = "nivel crítico alcanzado"
) => {
  if (!ADMIN_EMAIL) {
    console.warn(
      "ADMIN_EMAIL no está configurado en .env. No se enviará alerta de stock."
    );
    return;
  }
  if (
    !producto ||
    !producto.nombre ||
    producto.existencia === undefined ||
    producto.stockMinimo === undefined
  ) {
    console.error(
      "Datos incompletos del producto para enviar alerta de stock:",
      producto
    );
    return;
  }

  const subject = `🔔 Alerta de Stock: ${producto.nombre} (${motivo})`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #d9534f;">⚠️ Alerta de Nivel de Stock en ${
        APP_NAME || "SteticSoft"
      } ⚠️</h2>
      <p>El producto <strong>${producto.nombre} (ID: ${
    producto.idProducto
  })</strong> ha alcanzado o caído por debajo de su nivel mínimo de stock.</p>
      <p><strong>Motivo:</strong> ${motivo}</p>
      <hr>
      <h3 style="color: #5bc0de;">Detalles del Producto:</h3>
      <ul>
        <li><strong>ID Producto:</strong> ${producto.idProducto}</li>
        <li><strong>Nombre:</strong> ${producto.nombre}</li>
        <li><strong>Existencia Actual:</strong> <strong style="font-size: 1.1em; color: ${
          producto.existencia <= 0 ? "#d9534f" : "#f0ad4e"
        };">${producto.existencia}</strong> unidades</li>
        <li><strong>Stock Mínimo Configurado:</strong> ${
          producto.stockMinimo
        } unidades</li>
      </ul>
      <hr>
      <p style="font-size: 0.9em; color: #777;">
        Este es un mensaje automático. Por favor, revise el inventario y considere realizar un nuevo pedido de compra si es necesario.
      </p>
      <p>Saludos,<br>Sistema de Alertas de ${APP_NAME || "SteticSoft"}</p>
    </div>
  `;

  try {
    await mailerService({
      to: ADMIN_EMAIL,
      subject,
      html: htmlContent,
    });
    console.log(
      `📧 Alerta de stock para '${producto.nombre}' (Motivo: ${motivo}) enviada a ${ADMIN_EMAIL}. Existencia: ${producto.existencia}, Mínimo: ${producto.stockMinimo}`
    );
  } catch (emailError) {
    console.error(
      `❌ Error al enviar alerta de stock para '${producto.nombre}' a ${ADMIN_EMAIL}:`,
      emailError
    );
  }
};

/**
 * Checks product stock and sends an alert if it's at or below minimum.
 * @param {object} producto - The product instance from Sequelize.
 * @param {string} motivo - Reason for the stock check.
 */
const checkAndSendStockAlert = async (producto, motivo) => {
  if (
    producto &&
    producto.stockMinimo > 0 &&
    producto.existencia <= producto.stockMinimo
  ) {
    // Send alert non-blockingly
    sendStockAlertEmail(producto, motivo).catch((err) =>
      console.error("Error en envío asíncrono de alerta de stock:", err)
    );
  }
};

module.exports = {
  sendStockAlertEmail,
  checkAndSendStockAlert,
};
