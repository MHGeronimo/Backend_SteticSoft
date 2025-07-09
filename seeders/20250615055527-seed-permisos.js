'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Permisos alineados con steticsoft_schema.sql y las rutas
    const permisos = [
      // Roles y Permisos
      { nombre: 'MODULO_ROLES_GESTIONAR', descripcion: 'Permite la gestión completa de roles del sistema.', estado: true },
      { nombre: 'MODULO_ROLES_ASIGNAR_PERMISOS', descripcion: 'Permite asignar y quitar permisos a los roles.', estado: true },
      { nombre: 'MODULO_PERMISOS_GESTIONAR', descripcion: 'Permite la gestión completa de los permisos del sistema.', estado: true },
      // Usuarios
      { nombre: 'MODULO_USUARIOS_GESTIONAR', descripcion: 'Permite la gestión completa de usuarios del sistema.', estado: true },
      // Dashboard
      { nombre: 'MODULO_DASHBOARD_VER', descripcion: 'Permite visualizar los dashboards y sus datos.', estado: true },
      // Estados
      { nombre: 'MODULO_ESTADOS_GESTIONAR', descripcion: 'Permite la gestión de los diferentes estados de la aplicación.', estado: true },
      // Clientes
      { nombre: 'MODULO_CLIENTES_GESTIONAR', descripcion: 'Permite la gestión completa de la información de los clientes (Admin/Empleado).', estado: true },
      { nombre: 'MODULO_CLIENTES_VER_PROPIO', descripcion: 'Permite a un cliente ver y editar su propio perfil.', estado: true },
      // Empleados
      { nombre: 'MODULO_EMPLEADOS_GESTIONAR', descripcion: 'Permite la gestión completa de la información de los empleados.', estado: true },
      // Especialidades
      { nombre: 'MODULO_ESPECIALIDADES_GESTIONAR', descripcion: 'Permite la gestión de las especialidades.', estado: true },
      // Proveedores
      { nombre: 'MODULO_PROVEEDORES_GESTIONAR', descripcion: 'Permite la gestión completa de la información de los proveedores.', estado: true },
      // Categorías Productos
      { nombre: 'MODULO_CATEGORIAS_PRODUCTOS_GESTIONAR', descripcion: 'Permite la gestión de las categorías de productos.', estado: true },
      { nombre: 'MODULO_CATEGORIAS_PRODUCTOS_VER', descripcion: 'Permite ver las categorías de productos (Cliente).', estado: true },
      // Categorías Servicios
      { nombre: 'MODULO_CATEGORIAS_SERVICIOS_GESTIONAR', descripcion: 'Permite la gestión de las categorías de servicios.', estado: true },
      { nombre: 'MODULO_CATEGORIAS_SERVICIOS_VER', descripcion: 'Permite ver las categorías de servicios (Cliente).', estado: true },
      // Productos
      { nombre: 'MODULO_PRODUCTOS_GESTIONAR', descripcion: 'Permite la gestión completa de los productos del inventario.', estado: true },
      { nombre: 'MODULO_PRODUCTOS_VER', descripcion: 'Permite ver los productos (Cliente).', estado: true },
      // Compras
      { nombre: 'MODULO_COMPRAS_GESTIONAR', descripcion: 'Permite la gestión de las compras a proveedores.', estado: true },
      // Ventas
      { nombre: 'MODULO_VENTAS_GESTIONAR', descripcion: 'Permite la gestión de las ventas a clientes (Admin/Empleado).', estado: true },
      { nombre: 'MODULO_VENTAS_CREAR_PROPIA', descripcion: 'Permite a un cliente crear/realizar una venta (compra).', estado: true },
      { nombre: 'MODULO_VENTAS_VER_PROPIAS', descripcion: 'Permite a un cliente ver sus propias ventas.', estado: true },
      // Citas
      { nombre: 'MODULO_CITAS_GESTIONAR', descripcion: 'Permite la gestión completa de las citas (Admin/Empleado).', estado: true },
      { nombre: 'MODULO_CITAS_CREAR_PROPIA', descripcion: 'Permite a un cliente agendar sus propias citas.', estado: true },
      { nombre: 'MODULO_CITAS_VER_PROPIAS', descripcion: 'Permite a un cliente ver sus propias citas.', estado: true },
      { nombre: 'MODULO_CITAS_CANCELAR_PROPIA', descripcion: 'Permite a un cliente cancelar sus propias citas (con antelación).', estado: true },
      // Servicios
      { nombre: 'MODULO_SERVICIOS_GESTIONAR', descripcion: 'Permite la gestión completa de los servicios ofrecidos.', estado: true },
      { nombre: 'MODULO_SERVICIOS_VER', descripcion: 'Permite ver los servicios ofrecidos (Cliente).', estado: true },
      // Abastecimientos
      { nombre: 'MODULO_ABASTECIMIENTOS_GESTIONAR', descripcion: 'Permite la gestión del abastecimiento de productos (salida para empleados).', estado: true },
      // Novedades Empleados
      { nombre: 'MODULO_NOVEDADES_EMPLEADOS_GESTIONAR', descripcion: 'Permite la gestión de novedades y horarios de empleados.', estado: true },
      // Podrían añadirse más permisos si son necesarios y están definidos en steticsoft_schema.sql
    ];
    // Usar { ignoreDuplicates: true } o manejar conflictos si la tabla ya tiene datos del SQL.
    // Por simplicidad, si el SQL ya inserta, este bulkInsert podría fallar o duplicar si no hay UNIQUE constraint.
    // Asumiendo que el SQL es la fuente de verdad para la creación inicial, este seeder debería idealmente
    // no ejecutarse o usar ON CONFLICT si la BD lo soporta y Sequelize lo permite en bulkInsert.
    // O, mejor aún, eliminar los INSERTs del SQL y dejar que los seeders sean la única fuente.
    // Por ahora, se reemplaza la lista.
    await queryInterface.bulkInsert('permisos', permisos, { ignoreDuplicates: true }); // Añadido ignoreDuplicates
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('permisos', null, {});
  }
};
