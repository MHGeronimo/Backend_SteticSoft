const db = require("../models");
const { Op } = db.Sequelize;
const { NotFoundError, BadRequestError, CustomError } = require("../errors");
const moment = require("moment-timezone");

const crearNovedad = async (datosNovedad, empleadosIds) => {
  const t = await db.sequelize.transaction();
  try {
    if (empleadosIds && empleadosIds.length > 0) {
      const rolEmpleado = await db.Rol.findOne({ where: { nombre: 'Empleado' }, transaction: t });
      if (!rolEmpleado) {
        throw new CustomError("El rol 'Empleado' no está configurado en el sistema.", 500);
      }
      const usuariosValidos = await db.Usuario.count({
        where: {
          idUsuario: empleadosIds,
          estado: true,
          idRol: rolEmpleado.idRol 
        },
        transaction: t,
      });
      if (usuariosValidos !== empleadosIds.length) {
        throw new BadRequestError("Uno o más de los IDs proporcionados no corresponden a empleados válidos y activos.");
      }
    }
    // Se eliminó la dependencia de 'nombre' y 'descripcion'
    const nuevaNovedad = await db.Novedad.create(datosNovedad, { transaction: t });
    if (empleadosIds && empleadosIds.length > 0) {
      await nuevaNovedad.setEmpleados(empleadosIds, { transaction: t });
    }
    await t.commit();
    const novedadCreada = await db.Novedad.findByPk(nuevaNovedad.idNovedad, {
      include: [
        {
          model: db.Usuario,
          as: "empleados",
          attributes: ["idUsuario", "correo"],
          through: { attributes: [] },
          include: [
            {
              model: db.Empleado,
              as: "empleadoInfo",
              attributes: ["nombre", "apellido"],
            },
          ],
        },
      ],
    });

    const plainNovedad = novedadCreada.get({ plain: true });
    plainNovedad.empleados = plainNovedad.empleados.map((empleado) => ({
      ...empleado,
      nombre: empleado.empleadoInfo?.nombre,
      apellido: empleado.empleadoInfo?.apellido,
      empleadoInfo: undefined,
    }));
    return plainNovedad;
  } catch (error) {
    await t.rollback();
    console.error("Error al crear la novedad en el servicio:", error);
    throw error;
  }
};

const obtenerTodasLasNovedades = async (opcionesDeFiltro = {}) => {
  const { estado, empleadoId, busqueda } = opcionesDeFiltro;
  let whereClause = {};
  const includeOptions = {
    model: db.Usuario,
    as: "empleados",
    attributes: ["idUsuario", "correo"],
    through: { attributes: [] },
    required: false,
    include: [
      {
        model: db.Empleado,
        as: "empleadoInfo",
        attributes: ["nombre", "apellido"],
      },
    ],
  };

  if (estado !== undefined && estado !== null && estado !== '') {
    whereClause.estado = String(estado) === "true";
  }

  if (empleadoId) {
    includeOptions.where = { idUsuario: empleadoId };
    includeOptions.required = true;
  }

  if (busqueda) {
    const searchTerm = `%${String(busqueda)}%`;
    const busquedaConditions = {
      [Op.or]: [
        db.sequelize.where(db.sequelize.cast(db.sequelize.col('hora_inicio'), 'text'), { [Op.iLike]: searchTerm }),
        db.sequelize.where(db.sequelize.cast(db.sequelize.col('hora_fin'), 'text'), { [Op.iLike]: searchTerm }),
        db.sequelize.where(db.sequelize.cast(db.sequelize.col('dias'), 'text'), { [Op.iLike]: searchTerm }),
        { "$empleados.empleadoInfo.nombre$": { [Op.iLike]: searchTerm } },
        { "$empleados.empleadoInfo.apellido$": { [Op.iLike]: searchTerm } },
      ],
    };
    whereClause = { ...whereClause, ...busquedaConditions };
  }

  try {
    const novedades = await db.Novedad.findAll({
      where: whereClause,
      include: [includeOptions],
      order: [["fechaInicio", "DESC"]],
      logging: console.log,
    });

    return novedades.map((novedad) => {
      const plainNovedad = novedad.get({ plain: true });
      plainNovedad.empleados = plainNovedad.empleados.map((empleado) => ({
        ...empleado,
        nombre: empleado.empleadoInfo?.nombre,
        apellido: empleado.empleadoInfo?.apellido,
        empleadoInfo: undefined,
      }));
      return plainNovedad;
    });
  } catch (error) {
    console.error("Error al obtener todas las novedades:", error);
    if (error.name === 'SequelizeDatabaseError') {
      throw new BadRequestError(`Error en la consulta de búsqueda: ${error.message}`);
    }
    throw new CustomError(`Error al obtener novedades: ${error.message}`, 500);
  }
};

const obtenerNovedadesActivas = async () => {
    try {
        // Se usa moment().tz para asegurar que la fecha actual se evalúe en la zona horaria correcta (ej. America/Bogota).
        // Esto previene problemas si el servidor está en una zona horaria diferente.
        const hoy = moment().tz("America/Bogota").startOf('day').toDate();

        return await db.Novedad.findAll({
            where: {
                estado: true,
                fechaInicio: {
                    [Op.lte]: hoy,
                },
                fechaFin: {
                    [Op.gte]: hoy,
                },
            },
        });
    } catch (error) {
        console.error("Error al obtener novedades activas:", error);
        throw new CustomError(`Error al obtener novedades activas: ${error.message}`, 500);
    }
};

const obtenerNovedadPorId = async (idNovedad) => {
  const novedad = await db.Novedad.findByPk(idNovedad, {
    include: [
      {
        model: db.Usuario,
        as: "empleados",
        attributes: ["idUsuario", "correo"],
        through: { attributes: [] },
        include: [
          {
            model: db.Empleado,
            as: "empleadoInfo",
            attributes: ["nombre", "apellido"],
          },
        ],
      },
    ],
  });
  if (!novedad) {
    throw new NotFoundError("Novedad no encontrada.");
  }

  const plainNovedad = novedad.get({ plain: true });
  plainNovedad.empleados = plainNovedad.empleados.map((empleado) => ({
    ...empleado,
    nombre: empleado.empleadoInfo?.nombre,
    apellido: empleado.empleadoInfo?.apellido,
    empleadoInfo: undefined,
  }));
  return plainNovedad;
};

const actualizarNovedad = async (idNovedad, datosActualizar, empleadosIds) => {
  const t = await db.sequelize.transaction();
  try {
    const novedad = await db.Novedad.findByPk(idNovedad, { transaction: t });
    if (!novedad) {
      throw new NotFoundError("Novedad no encontrada para actualizar.");
    }
    if (empleadosIds) {
      const rolEmpleado = await db.Rol.findOne({ where: { nombre: 'Empleado' }, transaction: t });
      if (!rolEmpleado) {
        throw new CustomError("El rol 'Empleado' no está configurado.", 500);
      }
      const usuariosValidos = await db.Usuario.count({
        where: { idUsuario: empleadosIds, estado: true, idRol: rolEmpleado.idRol },
        transaction: t
      });
      if (usuariosValidos !== empleadosIds.length) {
        throw new BadRequestError("Uno o más IDs no corresponden a empleados válidos y activos.");
      }
      await novedad.setEmpleados(empleadosIds, { transaction: t });
    }
    // Se eliminó la dependencia de 'nombre' y 'descripcion'
    await novedad.update(datosActualizar, { transaction: t });
    await t.commit();
    return await obtenerNovedadPorId(idNovedad);
  } catch (error) {
    await t.rollback();
    console.error("Error al actualizar la novedad:", error);
    throw error;
  }
};

const cambiarEstadoNovedad = async (idNovedad, estado) => {
  const novedad = await db.Novedad.findByPk(idNovedad);
  if (!novedad) throw new NotFoundError("Novedad no encontrada.");
  await novedad.update({ estado });
  return novedad;
};

const eliminarNovedadFisica = async (idNovedad) => {
  const novedad = await db.Novedad.findByPk(idNovedad);
  if (!novedad) throw new NotFoundError("Novedad no encontrada para eliminar.");
  await novedad.destroy();
};

const obtenerDiasDisponibles = async (idNovedad, anio, mes) => {
  // 1. Busca la novedad por su ID para obtener sus reglas (fechas y días)
  const novedad = await db.Novedad.findByPk(idNovedad);
  if (!novedad) {
    throw new NotFoundError("Novedad no encontrada.");
  }

  // 2. Establece el rango del mes que se está visualizando en el calendario
  // Nos aseguramos de usar la zona horaria correcta para evitar errores de un día
  moment.locale('es'); // Aseguramos que el locale de moment sea español
  const inicioDelMes = moment.tz({ year: anio, month: mes - 1 }, "America/Bogota").startOf('month');
  const finDelMes = moment.tz({ year: anio, month: mes - 1 }, "America/Bogota").endOf('month');

  // El array que contendrá los días válidos
  const diasValidos = [];
  
  // 3. Itera día por día dentro del mes que se está viendo
  let diaActual = inicioDelMes.clone(); // Usamos .clone() para no modificar la fecha original
  while (diaActual.isSameOrBefore(finDelMes)) {
    
    // 4. Para cada día, verifica 3 condiciones:
    const esDespuesDeInicioNovedad = diaActual.isSameOrAfter(novedad.fechaInicio, 'day');
    const esAntesDeFinNovedad = diaActual.isSameOrBefore(novedad.fechaFin, 'day');
    
    // moment().format('dddd') devuelve el nombre del día (ej: "Lunes")
    const diaDeLaSemana = diaActual.format('dddd');
    const esDiaPermitido = novedad.dias.includes(diaDeLaSemana);

    if (esDespuesDeInicioNovedad && esAntesDeFinNovedad && esDiaPermitido) {
      // Si cumple todo, se añade al array en formato YYYY-MM-DD
      diasValidos.push(diaActual.format('YYYY-MM-DD'));
    }

    // Pasa al siguiente día
    diaActual.add(1, 'days');
  }

  // 5. Devuelve el array con todas las fechas que cumplieron las condiciones
  return diasValidos;
};


const obtenerHorasDisponibles = async (idNovedad, fecha) => {
  // 1. Busca la novedad para obtener sus reglas de horario
  const novedad = await db.Novedad.findByPk(idNovedad);
  if (!novedad) {
    throw new NotFoundError("Novedad no encontrada.");
  }

  // 2. Busca todas las citas que ya existen para la fecha seleccionada
  // Esto es crucial para no mostrar horarios que ya están ocupados.
  const citasDelDia = await db.Cita.findAll({
    where: {
      fecha: fecha,
    },
    attributes: ['horaInicio'], // Solo necesitamos la hora de inicio de cada cita
  });
  // Creamos un Set para una búsqueda más rápida de las horas ocupadas
  const horasOcupadas = new Set(citasDelDia.map(cita => cita.horaInicio));

  // 3. Genera todos los posibles horarios dentro del rango de la novedad
  const horariosPosibles = [];
  const formatoHora = 'HH:mm:ss';

  // NOTA: Asumimos un intervalo de 60 minutos entre citas.
  // Si tienes un campo "intervalo" en tu modelo Novedad, puedes usarlo aquí.
  const intervaloMinutos = 60;

  let horaActual = moment(novedad.horaInicio, formatoHora);
  const horaFin = moment(novedad.horaFin, formatoHora);

  while (horaActual.isBefore(horaFin)) {
    horariosPosibles.push(horaActual.format(formatoHora));
    horaActual.add(intervaloMinutos, 'minutes');
  }

  // 4. Filtra los horarios, devolviendo solo los que NO están ocupados
  const horasDisponibles = horariosPosibles.filter(hora => !horasOcupadas.has(hora));
  
  return horasDisponibles;
};
const obtenerEmpleadosPorNovedad = async (idNovedad) => {
  const novedad = await db.Novedad.findByPk(idNovedad, {
    include: [
      {
        model: db.Usuario,
        as: "empleados",
        attributes: ["idUsuario", "correo"],
        where: { estado: true },
        through: { attributes: [] },
        include: [
          {
            model: db.Empleado,
            as: "empleadoInfo",
            attributes: ["nombre", "apellido", "telefono"],
          },
        ],
      },
    ],
  });

  if (!novedad) {
    throw new NotFoundError("Novedad no encontrada");
  }

  return novedad.empleados.map((empleado) => {
    const plainEmpleado = empleado.get({ plain: true });
    return {
      ...plainEmpleado,
      nombre: plainEmpleado.empleadoInfo?.nombre,
      apellido: plainEmpleado.empleadoInfo?.apellido,
      telefono: plainEmpleado.empleadoInfo?.telefono,
      empleadoInfo: undefined,
    };
  });
};

const obtenerEmpleadosParaAsignar = async () => {
  try {
    const rolEmpleado = await db.Rol.findOne({ where: { nombre: "Empleado" } });
    if (!rolEmpleado) {
      throw new CustomError(
        "El rol 'Empleado' no está configurado en el sistema.",
        500
      );
    }

    const usuarios = await db.Usuario.findAll({
      where: {
        idRol: rolEmpleado.idRol,
        estado: true,
      },
      attributes: ["idUsuario", "correo"],
      include: [
        {
          model: db.Empleado,
          as: "empleadoInfo",
          attributes: ["nombre", "apellido", "telefono"],
          required: true
        },
      ],
      order: [[{ model: db.Empleado, as: "empleadoInfo" }, "nombre", "ASC"]],
    });

    return usuarios.map((usuario) => {
      const plainUsuario = usuario.get({ plain: true });
      const info = plainUsuario.empleadoInfo;
      return {
        idUsuario: plainUsuario.idUsuario,
        nombreCompleto: `${info?.nombre || ""} ${info?.apellido || ""}`.trim(),
      };
    });
  } catch (error) {
    console.error("Error al obtener empleados para asignar:", error);
    if (error instanceof CustomError) throw error;
    throw new CustomError(
      `Error al obtener la lista de empleados: ${error.message}`,
      500
    );
  }
};

const obtenerNovedadesPublicas = async () => {
    try {
        return await db.Novedad.findAll({
            where: {
                estado: true,
            },
            order: [["fechaInicio", "DESC"]],
        });
    } catch (error) {
        console.error("Error al obtener novedades públicas:", error);
        throw new CustomError(`Error al obtener novedades públicas: ${error.message}`, 500);
    }
};

module.exports = {
  crearNovedad,
  obtenerTodasLasNovedades,
  obtenerNovedadPorId,
  actualizarNovedad,
  cambiarEstadoNovedad,
  eliminarNovedadFisica,
  obtenerNovedadesActivas,
  obtenerDiasDisponibles,
  obtenerHorasDisponibles,
  obtenerEmpleadosPorNovedad,
  obtenerEmpleadosParaAsignar,
  obtenerNovedadesPublicas,
};

