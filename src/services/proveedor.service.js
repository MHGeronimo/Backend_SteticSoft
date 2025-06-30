// src/services/proveedor.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const { NotFoundError, ConflictError, CustomError } = require("../errors");

/**
 * Helper interno para cambiar el estado de un proveedor.
 * @param {number} idProveedor - ID del proveedor.
 * @param {boolean} nuevoEstado - El nuevo estado (true para habilitar, false para anular).
 * @returns {Promise<object>} El proveedor con el estado cambiado.
 */
const cambiarEstadoProveedor = async (idProveedor, nuevoEstado) => {
  const proveedor = await db.Proveedor.findByPk(idProveedor);
  if (!proveedor) {
    throw new NotFoundError("Proveedor no encontrado para cambiar estado.");
  }
  if (proveedor.estado === nuevoEstado) {
    return proveedor; // Ya está en el estado deseado
  }
  await proveedor.update({ estado: nuevoEstado });
  return proveedor;
};

/**
 * Crear un nuevo proveedor.
 */
const crearProveedor = async (datosProveedor) => {
  const {
    nombre,
    tipo,
    telefono,
    correo,
    direccion,
    tipoDocumento,
    numeroDocumento,
    nitEmpresa,
    nombrePersonaEncargada,
    telefonoPersonaEncargada,
    emailPersonaEncargada,
    estado,
  } = datosProveedor;

  if (numeroDocumento) {
    const proveedorConDocumento = await db.Proveedor.findOne({
      where: { numeroDocumento, estado: true }, // <-- CORRECCIÓN
      });
    if (proveedorConDocumento) {
      throw new ConflictError(
        `El número de documento '${numeroDocumento}' ya está registrado en un proveedor activo.`
      );
    }
  }

  if (nitEmpresa) {
    const proveedorConNit = await db.Proveedor.findOne({
      where: { nitEmpresa, estado: true }, // <-- CORRECCIÓN
    });
    if (proveedorConNit) {
      throw new ConflictError(
        `El NIT de empresa '${nitEmpresa}' ya está registrado en un proveedor activo.`
      );
    }
  }
  const proveedorConNombreTipo = await db.Proveedor.findOne({
    where: { nombre, tipo, estado: true }, // <-- CORRECCIÓN
  });
  if (proveedorConNombreTipo) {
    throw new ConflictError(
      `Ya existe un proveedor activo con el nombre '${nombre}' y tipo '${tipo}'.`
    );
  }
  const proveedorConCorreo = await db.Proveedor.findOne({ 
    where: { correo, estado: true } // <-- CORRECCIÓN
  });
  if (proveedorConCorreo) {
    throw new ConflictError(
      `El correo electrónico '${correo}' ya está registrado para otro proveedor activo.`
    );
  }

  try {
    const nuevoProveedor = await db.Proveedor.create({
      nombre,
      tipo,
      telefono,
      correo,
      direccion,
      tipoDocumento: tipoDocumento || null,
      numeroDocumento: numeroDocumento || null,
      nitEmpresa: nitEmpresa || null,
      nombrePersonaEncargada: nombrePersonaEncargada || null,
      telefonoPersonaEncargada: telefonoPersonaEncargada || null,
      emailPersonaEncargada: emailPersonaEncargada || null,
      estado: typeof estado === "boolean" ? estado : true,
    });
    return nuevoProveedor;
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      let campoConflictivo = "un campo único";
      if (error.fields) {
        if (error.fields.nit_empresa) campoConflictivo = "NIT de empresa";
        // --- INICIO DE CORRECCIÓN ---
        // Se añade el caso para el error de restricción de la base de datos.
        else if (error.fields.numero_documento)
          campoConflictivo = "Número de Documento";
        // --- FIN DE CORRECCIÓN ---
        else if (
          error.fields.proveedor_nombre_tipo_key ||
          (error.fields.nombre && error.fields.tipo)
        )
          campoConflictivo = `la combinación de nombre ('${nombre}') y tipo ('${tipo}')`;
        else if (error.fields.correo) campoConflictivo = "correo electrónico";
      }
      throw new ConflictError(
        `Ya existe un proveedor con el mismo valor para ${campoConflictivo}.`
      );
    }
    console.error(
      "Error al crear el proveedor en el servicio:",
      error.message,
      error.stack
    );
    throw new CustomError(`Error al crear el proveedor: ${error.message}`, 500);
  }
};

/**
 * Obtener todos los proveedores.
 */
const obtenerTodosLosProveedores = async (opciones = {}) => {
  try {
    const { estado, tipo, busqueda } = opciones;
    const whereClause = {};

    if (estado !== undefined) {
      whereClause.estado = estado;
    }
    if (tipo) {
      whereClause.tipo = tipo;
    }
    
    // --- LÓGICA DE BÚSQUEDA NUEVA ---
    if (busqueda) {
      whereClause[Op.or] = [
        { nombre: { [Op.iLike]: `%${busqueda}%` } },
        { correo: { [Op.iLike]: `%${busqueda}%` } },
        { nitEmpresa: { [Op.iLike]: `%${busqueda}%` } },
        { numeroDocumento: { [Op.iLike]: `%${busqueda}%` } },
        { telefono: { [Op.iLike]: `%${busqueda}%` } },
        { direccion: { [Op.iLike]: `%${busqueda}%` } },
      ];
    }
    // --- FIN DE LÓGICA DE BÚSQUEDA ---

    return await db.Proveedor.findAll({
      where: whereClause,
      order: [["nombre", "ASC"]],
    });
  } catch (error) {
    console.error(
      "Error al obtener todos los proveedores en el servicio:",
      error.message
    );
    throw new CustomError(
      `Error al obtener proveedores: ${error.message}`,
      500
    );
  }
};

/**
 * Obtener un proveedor por su ID.
 */
const obtenerProveedorPorId = async (idProveedor) => {
  try {
    const proveedor = await db.Proveedor.findByPk(idProveedor);
    if (!proveedor) {
      throw new NotFoundError("Proveedor no encontrado.");
    }
    return proveedor;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al obtener el proveedor con ID ${idProveedor} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al obtener el proveedor: ${error.message}`,
      500
    );
  }
};

/**
 * Actualizar un proveedor existente.
 */
const actualizarProveedor = async (idProveedor, datosActualizar) => {
  try {
    // 1. Buscamos el proveedor que vamos a actualizar
    const proveedor = await db.Proveedor.findByPk(idProveedor);
    if (!proveedor) {
      throw new NotFoundError("Proveedor no encontrado para actualizar.");
    }

    const { nombre, tipo, nitEmpresa, correo, numeroDocumento } = datosActualizar;

    if (nitEmpresa && nitEmpresa !== proveedor.nitEmpresa) {
      const otroProveedorConNit = await db.Proveedor.findOne({
        where: {
          nitEmpresa: nitEmpresa,
          estado: true, // Condición 1: Solo buscar en proveedores ACTIVOS
          idProveedor: { [Op.ne]: idProveedor }, // Condición 2: Excluirse a SÍ MISMO
        },
      });
      if (otroProveedorConNit) {
        throw new ConflictError(
          `El NIT de empresa '${nitEmpresa}' ya está registrado para otro proveedor activo.`
        );
      }
    }

    // VALIDACIÓN 2: Correo electrónico
    // Solo validamos si se envió un correo y si es DIFERENTE al que ya tenía.
    if (correo && correo !== proveedor.correo) {
      const otroProveedorConCorreo = await db.Proveedor.findOne({
        where: {
          correo: correo,
          estado: true, // Condición 1: Solo buscar en proveedores ACTIVOS
          idProveedor: { [Op.ne]: idProveedor }, // Condición 2: Excluirse a SÍ MISMO
        },
      });
      if (otroProveedorConCorreo) {
        throw new ConflictError(
          `El correo electrónico '${correo}' ya está registrado para otro proveedor activo.`
        );
      }
    }
    
    // VALIDACIÓN 3: Número de Documento
    // Solo validamos si se envió un documento y si es DIFERENTE al que ya tenía.
    if (numeroDocumento && numeroDocumento !== proveedor.numeroDocumento) {
      const otroProveedorConDocumento = await db.Proveedor.findOne({
        where: {
          numeroDocumento: numeroDocumento,
          estado: true, // Condición 1: Solo buscar en proveedores ACTIVOS
          idProveedor: { [Op.ne]: idProveedor }, // Condición 2: Excluirse a SÍ MISMO
        },
      });
      if (otroProveedorConDocumento) {
        throw new ConflictError(
          `El número de documento '${numeroDocumento}' ya está registrado para otro proveedor activo.`
        );
      }
    }

    // VALIDACIÓN 4: Combinación de Nombre y Tipo
    // Esta es la validación más compleja y la que probablemente fallaba.
    const nombreCambiado = nombre !== undefined && nombre !== proveedor.nombre;
    const tipoCambiado = tipo !== undefined && tipo !== proveedor.tipo;

    // Solo validamos si el nombre o el tipo han cambiado.
    if (nombreCambiado || tipoCambiado) {
      const nombreFinal = nombre !== undefined ? nombre : proveedor.nombre;
      const tipoFinal = tipo !== undefined ? tipo : proveedor.tipo;

      const otroProveedorConNombreTipo = await db.Proveedor.findOne({
        where: {
          nombre: nombreFinal,
          tipo: tipoFinal,
          estado: true, // Condición 1: Solo buscar en proveedores ACTIVOS
          idProveedor: { [Op.ne]: idProveedor }, // Condición 2: Excluirse a SÍ MISMO
        },
      });
      if (otroProveedorConNombreTipo) {
        throw new ConflictError(
          `Ya existe un proveedor activo con el nombre '${nombreFinal}' y tipo '${tipoFinal}'.`
        );
      }
    }

    // --- FIN DE LA LÓGICA DE VALIDACIÓN ---

    // 2. Si todas las validaciones pasan, actualizamos el proveedor.
    await proveedor.update(datosActualizar);
    return proveedor;

  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError) {
      throw error;
    }
    // Manejo de errores de restricción única a nivel de base de datos (como respaldo)
    if (error.name === "SequelizeUniqueConstraintError") {
      let campoConflictivo = "un campo único";
      if (error.fields) {
        if (error.fields.nit_empresa) campoConflictivo = "NIT de empresa";
        else if (error.fields.numero_documento) campoConflictivo = "Número de Documento";
        else if (error.fields.proveedor_nombre_tipo_key || (error.fields.nombre && error.fields.tipo))
          campoConflictivo = `la combinación de nombre y tipo`;
        else if (error.fields.correo) campoConflictivo = "correo electrónico";
      }
      throw new ConflictError(
        `Ya existe un proveedor con el mismo valor para ${campoConflictivo}.`
      );
    }
    console.error(
      `Error al actualizar el proveedor con ID ${idProveedor} en el servicio:`,
      error.message,
      error.stack
    );
    throw new CustomError(
      `Error al actualizar el proveedor: ${error.message}`,
      500
    );
  }
};


/**
 * Anular un proveedor.
 */
const anularProveedor = async (idProveedor) => {
  try {
    return await cambiarEstadoProveedor(idProveedor, false);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al anular el proveedor con ID ${idProveedor} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al anular el proveedor: ${error.message}`,
      500
    );
  }
};

/**
 * Habilitar un proveedor.
 */
const habilitarProveedor = async (idProveedor) => {
  try {
    return await cambiarEstadoProveedor(idProveedor, true);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al habilitar el proveedor con ID ${idProveedor} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al habilitar el proveedor: ${error.message}`,
      500
    );
  }
};

// src/shared/src_api/services/proveedor.service.js

// src/shared/src_api/services/proveedor.service.js

const eliminarProveedorFisico = async (idProveedor) => {
  try {
    const proveedor = await db.Proveedor.findByPk(idProveedor);
    if (!proveedor) {
      throw new NotFoundError(
        "Proveedor no encontrado para eliminar físicamente."
      );
    }

    const comprasAsociadas = await db.Compra.count({
      where: { idProveedor: idProveedor },
    });

    if (comprasAsociadas > 0) {
      // --- LÍNEA MODIFICADA ---
      // Cambiamos el mensaje para que sea más específico según tu solicitud.
      throw new ConflictError(
        `El proveedor '${proveedor.nombre}' está asociado con compras y por ello no puede ser eliminado.`
      );
      // --- FIN DE LA MODIFICACIÓN ---
    }

    const filasEliminadas = await db.Proveedor.destroy({
      where: { idProveedor },
    });
    return filasEliminadas;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError) {
      throw error;
    }
    if (error.name === "SequelizeForeignKeyConstraintError") {
      // Este error de respaldo también se puede ajustar si lo deseas.
      throw new ConflictError(
        "No se puede eliminar el proveedor porque está asociado con compras."
      );
    }
    console.error(
      `Error al eliminar físicamente el proveedor con ID ${idProveedor} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al eliminar físicamente el proveedor: ${error.message}`,
      500
    );
  }
};

// --- FUNCIÓN NUEVA AÑADIDA ---
/**
 * Verifica si los campos únicos ya existen, para validación en tiempo real desde el frontend.
 * @param {object} campos - Objeto con los campos a verificar. Ej: { correo: 'test@test.com' }
 * @param {number|null} idExcluir - El ID del proveedor a excluir de la búsqueda (para modo edición).
 * @returns {Promise<object>} Un objeto con los mensajes de error.
 */
const verificarDatosUnicos = async (campos, idExcluir = null) => {
    const errores = {};
    const whereClause = { estado: true }; // <-- CORRECCIÓN
    if (idExcluir) {
        whereClause.idProveedor = { [Op.ne]: idExcluir };
    }

    const camposAValidar = {
        correo: "Este correo ya está registrado.",
        numeroDocumento: "Este documento ya está registrado.",
        nitEmpresa: "Este NIT ya está registrado."
    };

    for (const campo in campos) {
        if (camposAValidar[campo] && campos[campo]) {
            const existe = await db.Proveedor.findOne({
                where: {
                    ...whereClause,
                    [campo]: campos[campo],
                },
            });
            if (existe) {
                errores[campo] = camposAValidar[campo];
            }
        }
    }
    return errores;
};


module.exports = {
  crearProveedor,
  obtenerTodosLosProveedores,
  obtenerProveedorPorId,
  actualizarProveedor,
  anularProveedor,
  habilitarProveedor,
  eliminarProveedorFisico,
  cambiarEstadoProveedor,
  verificarDatosUnicos, // <-- Exportamos la nueva función
};