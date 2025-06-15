'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Note: IDs are hardcoded as per subtask instructions based on SQL.
    // Ensure these IDs do not conflict if auto-increment has already created other IDs,
    // or that the table is reset before seeding if these are meant to be the first/only entries.
    // The migration for 'estado' defined id_estado as autoIncrement.
    // Forcing IDs here can lead to issues if not handled carefully (e.g., by resetting sequence).
    // However, following instruction to replicate SQL's specific IDs.

    const estados = [
      // Estados Generales (podrían ser usados por varias entidades)
      { id_estado: 1, nombre_estado: 'Activo', descripcion: 'El registro está activo y operativo.', ambito: 'General' },
      { id_estado: 2, nombre_estado: 'Inactivo', descripcion: 'El registro no está activo pero se conserva.', ambito: 'General' },
      { id_estado: 3, nombre_estado: 'Pendiente', descripcion: 'El registro está pendiente de alguna acción o confirmación.', ambito: 'General' },

      // Estados para Citas
      { id_estado: 10, nombre_estado: 'Cita Programada', descripcion: 'La cita ha sido agendada.', ambito: 'Cita' },
      { id_estado: 11, nombre_estado: 'Cita Confirmada', descripcion: 'La cita ha sido confirmada por el cliente/sistema.', ambito: 'Cita' },
      { id_estado: 12, nombre_estado: 'Cita Cancelada', descripcion: 'La cita ha sido cancelada.', ambito: 'Cita' },
      { id_estado: 13, nombre_estado: 'Cita Completada', descripcion: 'La cita ha finalizado exitosamente.', ambito: 'Cita' },
      { id_estado: 14, nombre_estado: 'Cita No Asistio', descripcion: 'El cliente no asistió a la cita.', ambito: 'Cita' },
      { id_estado: 15, nombre_estado: 'Cita Reprogramada', descripcion: 'La cita ha sido reprogramada.', ambito: 'Cita' },

      // Estados para Ventas
      { id_estado: 20, nombre_estado: 'Venta En Proceso', descripcion: 'La venta se está registrando.', ambito: 'Venta' },
      { id_estado: 21, nombre_estado: 'Venta Pagada', descripcion: 'La venta ha sido pagada completamente.', ambito: 'Venta' },
      { id_estado: 22, nombre_estado: 'Venta Anulada', descripcion: 'La venta ha sido anulada.', ambito: 'Venta' },
      { id_estado: 23, nombre_estado: 'Venta Pendiente de Pago', descripcion: 'La venta está pendiente de pago.', ambito: 'Venta' },
      { id_estado: 24, nombre_estado: 'Venta Devolucion Parcial', descripcion: 'Se ha realizado una devolución parcial para esta venta.', ambito: 'Venta' },
      { id_estado: 25, nombre_estado: 'Venta Devolucion Total', descripcion: 'Se ha realizado una devolución total para esta venta.', ambito: 'Venta' },

      // Estados para Usuarios (aplicable a Cliente, Empleado si comparten sistema de usuarios)
      // Re-usando 'Activo' (1) e 'Inactivo' (2)
      { id_estado: 30, nombre_estado: 'Usuario Pendiente Verificacion', descripcion: 'Usuario registrado, pendiente de verificar email o datos.', ambito: 'Usuario' },
      { id_estado: 31, nombre_estado: 'Usuario Bloqueado', descripcion: 'Usuario bloqueado por intentos fallidos o admin.', ambito: 'Usuario' },

      // Estados para Productos
      // Re-usando 'Activo' (1) para Disponible, 'Inactivo' (2) para No Disponible
      { id_estado: 40, nombre_estado: 'Producto Descontinuado', descripcion: 'Producto que ya no se comercializa.', ambito: 'Producto' },
      { id_estado: 41, nombre_estado: 'Producto Bajo Stock', descripcion: 'Producto con niveles de stock bajos.', ambito: 'Producto' },

      // Estados para Compras
      { id_estado: 50, nombre_estado: 'Compra Pedido Realizado', descripcion: 'Se ha realizado el pedido al proveedor.', ambito: 'Compra' },
      { id_estado: 51, nombre_estado: 'Compra Recibido Parcial', descripcion: 'Se ha recibido parte de la compra.', ambito: 'Compra' },
      { id_estado: 52, nombre_estado: 'Compra Recibido Total', descripcion: 'Se ha recibido la totalidad de la compra.', ambito: 'Compra' },
      { id_estado: 53, nombre_estado: 'Compra Pagada', descripcion: 'La compra ha sido pagada al proveedor.', ambito: 'Compra' },
      { id_estado: 54, nombre_estado: 'Compra Cancelada', descripcion: 'La compra ha sido cancelada.', ambito: 'Compra' },
    ];
    await queryInterface.bulkInsert('estado', estados, {});
  },

  async down(queryInterface, Sequelize) {
    // Deleting all, or could specify IDs if needed.
    await queryInterface.bulkDelete('estado', null, {});
  }
};
