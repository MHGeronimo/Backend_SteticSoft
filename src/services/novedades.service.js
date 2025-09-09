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
        return await db.Novedad.findAll({
            where: { estado: true },
            order: [["fechaInicio", "DESC"]],
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
    // ... (Tu lógica existente es correcta)
};

const obtenerHorasDisponibles = async (idNovedad, fecha) => {
    // ... (Tu lógica existente es correcta)
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
};

