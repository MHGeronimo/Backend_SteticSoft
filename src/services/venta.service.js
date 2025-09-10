"use strict";

const db = require("../models");
const { Op } = db.Sequelize;
const {
    NotFoundError,
    ConflictError,
    CustomError,
    BadRequestError,
} = require("../errors");
const moment = require("moment-timezone");
const { enviarCorreoVenta } = require("../utils/VentaEmailTemplate.js");
const { formatDate } = require("../utils/dateHelpers.js");
const { checkAndSendStockAlert } = require("../utils/stockAlertHelper.js");

const TASA_IVA_POR_DEFECTO = 0.19;

const obtenerVentaCompletaPorId = async (idVenta, transaction = null) => {
    return db.Venta.findByPk(idVenta, {
        include: [
            {
                model: db.Cliente,
                as: "cliente",
                // ✅ CORRECCIÓN: Incluir 'numeroDocumento', 'telefono', 'direccion' y 'estado' del cliente
                attributes: ["idCliente", "nombre", "apellido", "correo", "numeroDocumento", "telefono", "direccion", "estado"],
            },
            {
                model: db.Dashboard,
                as: "dashboard",
                attributes: ["idDashboard", "nombreDashboard"],
            },
            {
                model: db.Estado,
                as: "estadoDetalle",
                attributes: ["idEstado", "nombreEstado"],
            },
            {
                model: db.Producto,
                as: "productos",
                attributes: ["idProducto", "nombre", "descripcion", "precio", "stockMinimo", "existencia"],
                through: {
                    model: db.ProductoXVenta,
                    as: "detalleProductoVenta",
                    attributes: ["cantidad", "valorUnitario"],
                },
            },
            {
                model: db.Servicio,
                as: "servicios",
                attributes: ["idServicio", "nombre", "descripcion", "precio"],
                through: {
                    model: db.VentaXServicio,
                    as: "detalleServicioVenta",
                    attributes: ["valorServicio", "idCita"], // ✅ CORRECCIÓN: Incluir idCita si existe en VentaXServicio
                },
            },
        ],
        transaction,
    });
};

const crearVenta = async (datosVenta) => {
    const { fecha, idCliente, idDashboard, idEstado, productos = [], servicios = [] } = datosVenta;

    if (productos.length === 0 && servicios.length === 0) {
        throw new BadRequestError("Una venta debe tener al menos un producto o un servicio.");
    }

    const cliente = await db.Cliente.findByPk(idCliente);
    if (!cliente || !cliente.estado) {
        throw new BadRequestError(`Cliente con ID ${idCliente} no encontrado o inactivo.`);
    }

    const estadoProcesoVenta = await db.Estado.findByPk(idEstado);
    if (!estadoProcesoVenta) {
        throw new BadRequestError(`Estado de venta con ID ${idEstado} no encontrado.`);
    }
    
    if (idDashboard) {
        const dashboard = await db.Dashboard.findByPk(idDashboard);
        if (!dashboard) {
            throw new BadRequestError(`Dashboard con ID ${idDashboard} no encontrado.`);
        }
    }

    const transaction = await db.sequelize.transaction();
    try {
        let subtotalCalculado = 0;
        const productosParaCrearDetalle = [];
        const serviciosParaCrearDetalle = [];
        const productosAfectadosParaAlerta = new Set();

        for (const itemP of productos) {
            const productoDB = await db.Producto.findByPk(itemP.idProducto, { transaction });
            if (!productoDB) throw new BadRequestError(`Producto con ID ${itemP.idProducto} no encontrado.`);
            if (!productoDB.estado) throw new BadRequestError(`Producto '${productoDB.nombre}' no está activo.`);
            if (productoDB.existencia < itemP.cantidad) {
                throw new ConflictError(`No hay suficiente existencia para '${productoDB.nombre}'. Solicitado: ${itemP.cantidad}, Disponible: ${productoDB.existencia}.`);
            }

            const valorItem = Number(itemP.cantidad) * Number(productoDB.precio);
            subtotalCalculado += valorItem;

            productosParaCrearDetalle.push({
                idProducto: itemP.idProducto,
                cantidad: Number(itemP.cantidad),
                valorUnitario: Number(productoDB.precio),
                dbInstance: productoDB,
            });
        }
        
        for (const itemS of servicios) {
            const servicioDB = await db.Servicio.findByPk(itemS.idServicio, { transaction });
            if (!servicioDB) throw new BadRequestError(`Servicio con ID ${itemS.idServicio} no encontrado.`);
            if (!servicioDB.estado) throw new BadRequestError(`Servicio '${servicioDB.nombre}' no está activo.`);
            
            // ✅ CONSIDERACIÓN: Si `idCita` es opcional en la BD y no siempre viene del frontend, maneja `null`.
            const idCita = itemS.idCita ? Number(itemS.idCita) : null;
            if (idCita) {
                const citaDB = await db.Cita.findByPk(idCita, { transaction });
                if (!citaDB) throw new BadRequestError(`Cita con ID ${idCita} no encontrada para el servicio '${servicioDB.nombre}'.`);
            }
            
            subtotalCalculado += Number(servicioDB.precio);

            serviciosParaCrearDetalle.push({
                 idServicio: itemS.idServicio,
                 valorServicio: Number(servicioDB.precio),
                 idCita: idCita,
            });
        }

        const ivaCalculado = subtotalCalculado * TASA_IVA_POR_DEFECTO;
        const totalCalculado = subtotalCalculado + ivaCalculado;
        
        const nuevaVenta = await db.Venta.create({
            fecha: fecha || new Date(),
            idCliente,
            idDashboard: idDashboard || null,
            idEstado,
            total: totalCalculado,
            iva: ivaCalculado,
        }, { transaction });

        const esEstadoProcesable = ["Completado", "En proceso"].includes(estadoProcesoVenta.nombreEstado);
        for (const itemDetalle of productosParaCrearDetalle) {
            await db.ProductoXVenta.create({
                idVenta: nuevaVenta.idVenta,
                idProducto: itemDetalle.idProducto,
                cantidad: itemDetalle.cantidad,
                valorUnitario: itemDetalle.valorUnitario, 
            }, { transaction });
            
            if (esEstadoProcesable) {
                await itemDetalle.dbInstance.decrement("existencia", { by: itemDetalle.cantidad, transaction });
                productosAfectadosParaAlerta.add(itemDetalle.dbInstance.idProducto);
            }
        }
        
        for (const itemDetalle of serviciosParaCrearDetalle) {
            await db.VentaXServicio.create({
                idVenta: nuevaVenta.idVenta,
                idServicio: itemDetalle.idServicio,
                valorServicio: itemDetalle.valorServicio,
                idCita: itemDetalle.idCita,
            }, { transaction });
        }

        await transaction.commit();
        
        // Enviar alertas de stock fuera de la transacción
        if (esEstadoProcesable) {
            for (const productoId of productosAfectadosParaAlerta) {
                const productoActualizado = await db.Producto.findByPk(productoId);
                if (productoActualizado) {
                    await checkAndSendStockAlert(productoActualizado, `tras venta ID ${nuevaVenta.idVenta}`);
                }
            }
        }

        const ventaCreadaConDetalles = await obtenerVentaCompletaPorId(nuevaVenta.idVenta);

        // Enviar correo de confirmación
        if (ventaCreadaConDetalles && ventaCreadaConDetalles.cliente && ventaCreadaConDetalles.cliente.correo) {
            try {
                await enviarCorreoVenta({
                    correoCliente: ventaCreadaConDetalles.cliente.correo,
                    nombreCliente: ventaCreadaConDetalles.cliente.nombre || "Cliente Estimado",
                    ventaInfo: {
                        idVenta: ventaCreadaConDetalles.idVenta,
                        accion: "registrada",
                        fecha: formatDate(ventaCreadaConDetalles.fecha),
                        estado: estadoProcesoVenta.nombreEstado,
                        productos: ventaCreadaConDetalles.productos.map((p) => ({
                            nombre: p.nombre,
                            cantidad: p.detalleProductoVenta.cantidad,
                            valorUnitario: p.detalleProductoVenta.valorUnitario,
                            descripcion: p.descripcion,
                        })) || [],
                        servicios: ventaCreadaConDetalles.servicios.map((s) => ({
                            nombre: s.nombre,
                            valorServicio: s.detalleServicioVenta.valorServicio,
                            descripcion: s.descripcion,
                        })) || [],
                        subtotal: subtotalCalculado,
                        iva: ivaCalculado,
                        total: totalCalculado,
                        tasaIvaAplicada: TASA_IVA_POR_DEFECTO,
                    },
                });
            } catch (emailError) {
                console.error(`Error al enviar correo de nueva venta ${nuevaVenta.idVenta}:`, emailError);
            }
        }
        return ventaCreadaConDetalles;
    } catch (error) {
        await transaction.rollback();
        if (error instanceof NotFoundError || error instanceof BadRequestError || error instanceof ConflictError) {
            throw error;
        }
        console.error("Error al crear la venta en el servicio:", error.message, error.stack);
        throw new CustomError(`Error al crear la venta: ${error.message}`, 500);
    }
};

const obtenerTodasLasVentas = async (opcionesDeFiltro = {}) => {
    try {
        const whereClause = {};
        if (opcionesDeFiltro.idEstado) {
            whereClause.idEstado = opcionesDeFiltro.idEstado;
        }
        if (opcionesDeFiltro.idCliente) {
            whereClause.idCliente = opcionesDeFiltro.idCliente;
        }
        if (opcionesDeFiltro.idDashboard) {
            whereClause.idDashboard = opcionesDeFiltro.idDashboard;
        }

        return await db.Venta.findAll({
            where: whereClause,
            include: [
                {
                    model: db.Cliente,
                    as: "cliente",
                    // ✅ CORRECCIÓN: Incluir 'numeroDocumento' para la tabla principal
                    attributes: ["idCliente", "nombre", "apellido", "numeroDocumento"],
                },
                {
                    model: db.Dashboard,
                    as: "dashboard",
                    attributes: ["idDashboard", "nombreDashboard"],
                },
                {
                    model: db.Estado,
                    as: "estadoDetalle",
                    attributes: ["idEstado", "nombreEstado"],
                },
                {
                    model: db.Producto,
                    as: "productos",
                    attributes: ["idProducto", "nombre", "stockMinimo", "existencia"],
                    through: {
                        model: db.ProductoXVenta,
                        as: "detalleProductoVenta",
                        attributes: ["cantidad", "valorUnitario"],
                    },
                },
                {
                    model: db.Servicio,
                    as: "servicios",
                    attributes: ["idServicio", "nombre"],
                    through: {
                        model: db.VentaXServicio,
                        as: "detalleServicioVenta",
                        attributes: ["valorServicio", "idCita"], // ✅ CORRECCIÓN: Incluir idCita si existe
                    },
                },
            ],
            order: [
                ["fecha", "DESC"],
                ["idVenta", "DESC"],
            ],
        });
    } catch (error) {
        console.error("Error al obtener todas las ventas:", error.message);
        throw new CustomError(`Error al obtener ventas: ${error.message}`, 500);
    }
};

const obtenerVentaPorId = async (idVenta) => {
    const venta = await obtenerVentaCompletaPorId(idVenta);
    if (!venta) {
        throw new NotFoundError("Venta no encontrada.");
    }
    return venta;
};

const actualizarEstadoProcesoVenta = async (idVenta, datosActualizar) => {
    const { idEstado } = datosActualizar;
    if (idEstado === undefined) {
        throw new BadRequestError("Se requiere 'idEstado' (estado del proceso) para actualizar.");
    }

    const transaction = await db.sequelize.transaction();
    const productosAfectadosParaAlerta = new Set();
    try {
        let venta = await db.Venta.findByPk(idVenta, {
            include: [
                { model: db.Estado, as: "estadoDetalle" },
                {
                    model: db.Producto,
                    as: "productos",
                    through: {
                        model: db.ProductoXVenta,
                        as: "detalleProductoVenta",
                        attributes: ["cantidad"],
                    },
                },
                { model: db.Cliente, as: "cliente", attributes: ["nombre", "correo"] },
            ],
            transaction,
        });
        if (!venta) {
            await transaction.rollback();
            throw new NotFoundError("Venta no encontrada para actualizar estado.");
        }

        const estadoOriginalDB = venta.estadoDetalle;
        const nuevoEstadoProcesoDB = await db.Estado.findByPk(idEstado, { transaction });
        if (!nuevoEstadoProcesoDB) {
            await transaction.rollback();
            throw new BadRequestError(`El nuevo estado de proceso con ID ${idEstado} no existe.`);
        }

        const esEstadoProcesableOriginal = ["Completado", "En proceso"].includes(estadoOriginalDB.nombreEstado);
        const esEstadoProcesableNuevo = ["Completado", "En proceso"].includes(nuevoEstadoProcesoDB.nombreEstado);

        await venta.update({ idEstado }, { transaction });

        if (esEstadoProcesableOriginal !== esEstadoProcesableNuevo) {
            if (venta.productos && venta.productos.length > 0) {
                for (const pV of venta.productos) {
                    const pDB = await db.Producto.findByPk(pV.idProducto, { transaction });
                    const cantVendida = pV.detalleProductoVenta.cantidad;
                    if (pDB && cantVendida > 0) {
                        if (esEstadoProcesableNuevo) {
                            await pDB.decrement("existencia", { by: cantVendida, transaction });
                        } else {
                            await pDB.increment("existencia", { by: cantVendida, transaction });
                        }
                        productosAfectadosParaAlerta.add(pDB.idProducto);
                    }
                }
            }
        }

        await transaction.commit();

        // Enviar alertas de stock fuera de la transacción
        if (esEstadoProcesableNuevo || esEstadoProcesableOriginal) { // También revisar si se restauró stock
            for (const productoId of productosAfectadosParaAlerta) {
                const productoActualizado = await db.Producto.findByPk(productoId);
                if (productoActualizado) {
                    await checkAndSendStockAlert(productoActualizado, `tras actualizar estado de venta ID ${idVenta}`);
                }
            }
        }

        const ventaActualizada = await obtenerVentaCompletaPorId(idVenta);

        if (ventaActualizada && ventaActualizada.cliente && ventaActualizada.cliente.correo) {
            const accionCorreo = `actualizada (nuevo estado de proceso: ${nuevoEstadoProcesoDB.nombreEstado})`;

            try {
                const ventaInfoParaCorreo = {
                    idVenta: ventaActualizada.idVenta,
                    accion: accionCorreo,
                    fecha: formatDate(ventaActualizada.fecha),
                    estado: ventaActualizada.estadoDetalle.nombreEstado,
                    productos: ventaActualizada.productos.map((p) => ({
                        nombre: p.nombre,
                        cantidad: p.detalleProductoVenta.cantidad,
                        valorUnitario: p.detalleProductoVenta.valorUnitario,
                        descripcion: p.descripcion,
                    })),
                    servicios: ventaActualizada.servicios.map((s) => ({
                        nombre: s.nombre,
                        valorServicio: s.detalleServicioVenta.valorServicio,
                        descripcion: s.descripcion,
                    })),
                    // Recalcular subtotal, iva, total para el correo
                    // Asegurarse de que los valores sean números válidos para toLocaleString
                    subtotal: ventaActualizada.total / (1 + TASA_IVA_POR_DEFECTO),
                    iva: ventaActualizada.iva,
                    total: ventaActualizada.total,
                    tasaIvaAplicada: TASA_IVA_POR_DEFECTO,
                };
                await enviarCorreoVenta({
                    correoCliente: ventaActualizada.cliente.correo,
                    nombreCliente: ventaActualizada.cliente.nombre || "Cliente Estimado",
                    ventaInfo: ventaInfoParaCorreo,
                });
            } catch (emailError) {
                console.error(`Error al enviar correo de actualización de venta ${idVenta}:`, emailError);
            }
        }
        return ventaActualizada;
    } catch (error) {
        await transaction.rollback();
        if (error instanceof NotFoundError || error instanceof BadRequestError) {
            throw error;
        }
        console.error(`Error al actualizar estado de la venta con ID ${idVenta}:`, error.message, error.stack);
        throw new CustomError(`Error al actualizar estado de la venta: ${error.message}`, 500);
    }
};

const anularVenta = async (idVenta) => {
    // ✅ CORRECCIÓN: Asegurarse de que este ID corresponda al estado 'Anulada' en tu BD.
    // Lo ideal es buscarlo: `const estadoAnulada = await db.Estado.findOne({ where: { nombreEstado: 'Anulada' } });`
    // Si no es el 4, cámbialo.
    const idEstadoAnulada = 4; 
    return actualizarEstadoProcesoVenta(idVenta, { idEstado: idEstadoAnulada });
};

const habilitarVenta = async (idVenta) => {
    // ✅ CORRECCIÓN: Asegurarse de que este ID corresponda al estado 'Activa' o 'En proceso' en tu BD.
    // Lo ideal es buscarlo: `const estadoActiva = await db.Estado.findOne({ where: { nombreEstado: 'Activa' } });`
    // Si no es el 1, cámbialo.
    const idEstadoActiva = 1; 
    return actualizarEstadoProcesoVenta(idVenta, { idEstado: idEstadoActiva });
};

const eliminarVentaFisica = async (idVenta) => {
    const transaction = await db.sequelize.transaction();
    const productosAfectadosParaAlerta = new Set();

    try {
        const venta = await db.Venta.findByPk(idVenta, {
            include: [
                { model: db.Estado, as: "estadoDetalle" },
                {
                    model: db.Producto,
                    as: "productos",
                    through: {
                        model: db.ProductoXVenta,
                        as: "detalleProductoVenta",
                        attributes: ["cantidad"],
                    },
                },
            ],
            transaction,
        });
        if (!venta) {
            await transaction.rollback();
            throw new NotFoundError("Venta no encontrada para eliminar.");
        }

        const ventaOriginalProcesable = ["Completado", "En proceso"].includes(venta.estadoDetalle?.nombreEstado);

        if (ventaOriginalProcesable) {
            if (venta.productos && venta.productos.length > 0) {
                for (const pV of venta.productos) {
                    const pDB = await db.Producto.findByPk(pV.idProducto, { transaction });
                    const cantVendida = pV.detalleProductoVenta.cantidad;
                    if (pDB && cantVendida > 0) {
                        await pDB.increment("existencia", { by: cantVendida, transaction });
                        productosAfectadosParaAlerta.add(pDB.idProducto);
                    }
                }
            }
        }

        const filasEliminadas = await db.Venta.destroy({
            where: { idVenta },
            transaction,
        });
        await transaction.commit();

        // Enviar alertas de stock fuera de la transacción
        if (ventaOriginalProcesable) {
            for (const productoId of productosAfectadosParaAlerta) {
                const productoActualizado = await db.Producto.findByPk(productoId);
                if (productoActualizado) {
                    await checkAndSendStockAlert(productoActualizado, `tras eliminar venta ID ${idVenta}`);
                }
            }
        }

        return filasEliminadas;
    } catch (error) {
        await transaction.rollback();
        if (error instanceof NotFoundError) throw error;
        console.error(`Error al eliminar físicamente la venta con ID ${idVenta}:`, error.message, error.stack);
        throw new CustomError(`Error al eliminar físicamente la venta: ${error.message}`, 500);
    }
};

module.exports = {
    crearVenta,
    obtenerTodasLasVentas,
    obtenerVentaPorId,
    actualizarEstadoProcesoVenta,
    anularVenta,
    habilitarVenta,
    eliminarVentaFisica,
};