// src/controllers/empleado.controller.js
const empleadoService = require("../services/empleado.service.js");
// Importamos el nuevo servicio para manejar la relación Empleado-Especialidad
const empleadoEspecialidadService = require("../services/empleadoEspecialidad.service.js"); // Asegúrate que la ruta sea correcta

/**
 * Crea un nuevo empleado.
 */
const crearEmpleado = async (req, res, next) => {
  try {
    const nuevoEmpleado = await empleadoService.crearEmpleado(req.body);
    res.status(201).json({
      success: true,
      message: "Empleado creado exitosamente.",
      data: nuevoEmpleado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una lista de todos los empleados.
 */
const listarEmpleados = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {};
    if (req.query.estado === "true") {
      opcionesDeFiltro.estado = true;
    } else if (req.query.estado === "false") {
      opcionesDeFiltro.estado = false;
    }
    const empleados = await empleadoService.obtenerTodosLosEmpleados(
      opcionesDeFiltro
    );
    res.status(200).json({
      success: true,
      data: empleados,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene un empleado específico por su ID.
 */
const obtenerEmpleadoPorId = async (req, res, next) => {
  try {
    const { idEmpleado } = req.params;
    // Podríamos decidir si las especialidades se incluyen siempre aquí
    // o solo a través del endpoint específico /especialidades
    const empleado = await empleadoService.obtenerEmpleadoPorId(
      Number(idEmpleado)
    );
    res.status(200).json({
      success: true,
      data: empleado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza (Edita) un empleado existente por su ID.
 */
const actualizarEmpleado = async (req, res, next) => {
  try {
    const { idEmpleado } = req.params;
    const empleadoActualizado = await empleadoService.actualizarEmpleado(
      Number(idEmpleado),
      req.body
    );
    res.status(200).json({
      success: true,
      message: "Empleado actualizado exitosamente.",
      data: empleadoActualizado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Anula un empleado (borrado lógico, estado = false).
 */
const anularEmpleado = async (req, res, next) => {
  try {
    const { idEmpleado } = req.params;
    const empleadoAnulado = await empleadoService.anularEmpleado(
      Number(idEmpleado)
    );
    res.status(200).json({
      success: true,
      message: "Empleado anulado (deshabilitado) exitosamente.",
      data: empleadoAnulado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Habilita un empleado (estado = true).
 */
const habilitarEmpleado = async (req, res, next) => {
  try {
    const { idEmpleado } = req.params;
    const empleadoHabilitado = await empleadoService.habilitarEmpleado(
      Number(idEmpleado)
    );
    res.status(200).json({
      success: true,
      message: "Empleado habilitado exitosamente.",
      data: empleadoHabilitado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina físicamente un empleado por su ID.
 */
const eliminarEmpleadoFisico = async (req, res, next) => {
  try {
    const { idEmpleado } = req.params;
    await empleadoService.eliminarEmpleadoFisico(Number(idEmpleado));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// --- NUEVAS FUNCIONES PARA GESTIONAR ESPECIALIDADES DE UN EMPLEADO ---

/**
 * Asigna especialidades a un empleado.
 * Espera un cuerpo de solicitud como: { "idEspecialidades": [1, 2, 3] }
 */
const asignarEspecialidadesAEmpleado = async (req, res, next) => {
  try {
    const { idEmpleado } = req.params;
    const { idEspecialidades } = req.body; // Array de IDs de especialidades

    if (!Array.isArray(idEspecialidades) || idEspecialidades.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Se requiere un array 'idEspecialidades' con al menos un ID de especialidad.",
        });
    }

    const especialidadesActualizadas =
      await empleadoEspecialidadService.asignarEspecialidadesAEmpleado(
        Number(idEmpleado),
        idEspecialidades
      );
    res.status(200).json({
      success: true,
      message: `Especialidades asignadas/actualizadas para el empleado ID ${idEmpleado}.`,
      data: especialidadesActualizadas, // Devuelve las especialidades actuales del empleado
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Quita especialidades de un empleado.
 * Espera un cuerpo de solicitud como: { "idEspecialidades": [1, 2, 3] }
 */
const quitarEspecialidadesDeEmpleado = async (req, res, next) => {
  try {
    const { idEmpleado } = req.params;
    const { idEspecialidades } = req.body; // Array de IDs de especialidades a quitar

    if (!Array.isArray(idEspecialidades) || idEspecialidades.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Se requiere un array 'idEspecialidades' con al menos un ID de especialidad.",
        });
    }

    const especialidadesRestantes =
      await empleadoEspecialidadService.quitarEspecialidadesDeEmpleado(
        Number(idEmpleado),
        idEspecialidades
      );
    res.status(200).json({
      success: true,
      message: `Especialidades quitadas del empleado ID ${idEmpleado}.`,
      data: especialidadesRestantes, // Devuelve las especialidades restantes del empleado
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lista las especialidades asignadas a un empleado específico.
 */
const listarEspecialidadesDeEmpleado = async (req, res, next) => {
  try {
    const { idEmpleado } = req.params;
    const especialidades =
      await empleadoEspecialidadService.obtenerEspecialidadesDeEmpleado(
        Number(idEmpleado)
      );
    res.status(200).json({
      success: true,
      data: especialidades,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearEmpleado,
  listarEmpleados,
  obtenerEmpleadoPorId,
  actualizarEmpleado,
  anularEmpleado,
  habilitarEmpleado,
  eliminarEmpleadoFisico,
  asignarEspecialidadesAEmpleado,
  quitarEspecialidadesDeEmpleado,
  listarEspecialidadesDeEmpleado,
};
