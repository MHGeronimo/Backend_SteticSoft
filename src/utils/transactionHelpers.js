// src/utils/transactionHelpers.js
"use strict";

const db = require("../models"); // Necesitamos la instancia de sequelize

/**
 * Ejecuta una función callback dentro de una transacción de Sequelize.
 */
const runInTransaction = async (callback) => {
  try {
    const result = await db.sequelize.transaction(async (t) => {
      return await callback(t); // El callback recibe la transacción 't'
    });
    return result;
  } catch (error) {
    console.error(
      "Error durante la transacción de Sequelize (rollback realizado automáticamente):",
      error.message
    );
    throw error;
  }
};

/**
 * Estructura común para los resultados de las operaciones de servicio.
 * @typedef {Object} ServiceResult
 * @property {boolean} success - Indica si la operación fue exitosa.
 * @property {string} message - Mensaje descriptivo del resultado.
 * @property {Object|Array|null} [data] - Datos resultantes de la operación.
 * @property {number} [statusCode] - Código de estado HTTP sugerido.
 * @property {Array} [errors] - Array de errores de validación u otros.
 */

/**
 * Envuelve una función de servicio para manejar automáticamente el try...catch estándar
 * y la construcción del ServiceResult.
 */
const serviceWrapper = (
  serviceFunction,
  errorMessageBase = "Error interno del servidor."
) => {
  return async (...args) => {
    try {
      // Se espera que serviceFunction lance errores personalizados (CustomError, NotFoundError, etc.)
      // o devuelva un objeto con { success: true, ... }
      return await serviceFunction(...args);
    } catch (error) {
      console.error(
        `Error inesperado en el servicio '${serviceFunction.name}':`,
        error.message,
        error.stack
      );
      // Si el error ya es un ServiceResult o una instancia de nuestros CustomError
      if (
        typeof error.success === "boolean" &&
        error.message &&
        error.statusCode
      ) {
        return {
          success: error.success, // debería ser false
          message: error.message,
          statusCode: error.statusCode,
          data: error.data || null,
          errors:
            error.errors ||
            (error.message && !error.errors ? [{ msg: error.message }] : []),
        };
      }
      // Error genérico inesperado
      return {
        success: false,
        message: errorMessageBase,
        statusCode: 500,
        data: null,
        errors: [{ msg: error.message }],
      };
    }
  };
};

module.exports = {
  runInTransaction,
  serviceWrapper,
};
