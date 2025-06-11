// src/utils/dateHelpers.js
"use strict";

const moment = require("moment-timezone"); // Usamos moment-timezone para mejor manejo de zonas horarias

// Configura la zona horaria por defecto para Moment.js si es necesario (ej. la de tu servidor o la de tus usuarios)
moment.tz.setDefault("America/Bogota"); // Ejemplo para Colombia, ajústalo o coméntalo si no es necesario globalmente

/**
 * Formatea fecha y hora.
 * Ejemplo: "25/05/2025 a las 15:30"
 * @param {Date|moment.Moment|string} dateTime - La fecha/hora a formatear.
 * @param {string} [timeZone] - Zona horaria opcional para mostrar la fecha (ej. "America/Bogota").
 * @returns {string} La fecha/hora formateada.
 */
const formatDateTime = (dateTime, timeZone = "America/Bogota") => {
  // Default a Bogotá, ajusta si es necesario
  if (!dateTime) return "";
  return moment(dateTime).tz(timeZone).format("DD/MM/YYYY [a las] HH:mm");
};

/**
 * Formatea solo la fecha.
 * Ejemplo: "25/05/2025"
 * @param {Date|moment.Moment|string} date - La fecha a formatear.
 * @param {string} [timeZone] - Zona horaria opcional.
 * @returns {string} La fecha formateada.
 */
const formatDate = (date, timeZone = "America/Bogota") => {
  if (!date) return "";
  return moment(date).tz(timeZone).format("DD/MM/YYYY");
};

/**
 * Formatea solo la hora.
 * Ejemplo: "15:30"
 * @param {Date|moment.Moment|string} time - La hora a formatear.
 * @param {string} [timeZone] - Zona horaria opcional.
 * @returns {string} La hora formateada.
 */
const formatTime = (time, timeZone = "America/Bogota") => {
  if (!time) return "";
  return moment(time).tz(timeZone).format("HH:mm");
};

/**
 * Calcula la hora de fin de la cita a partir de la fecha de inicio
 * y la suma de las duraciones de los servicios (en minutos).
 * @param {moment.Moment|string|Date} fechaInicio - Momento/fecha de inicio.
 * @param {Array<object>} servicios - Array de servicios con propiedad duracionEstimadaMin.
 * @returns {moment.Moment} Objeto Moment que representa la hora de fin.
 */
const calcularHoraFin = (fechaInicio, servicios) => {
  const fechaInicioMoment = moment(fechaInicio); // Asegura que sea un objeto Moment
  const duracionTotal = servicios.reduce(
    (sum, servicio) => sum + (Number(servicio.duracionEstimadaMin) || 0), // Corregido: duracionEstimadaMin
    0
  );
  return fechaInicioMoment.clone().add(duracionTotal, "minutes");
};

module.exports = {
  formatDateTime,
  formatDate,
  formatTime,
  calcularHoraFin,
};