'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const permisos = [
      // Roles
      { nombre: 'MODULO_ROLES_VER', descripcion: 'Permite ver roles.', estado: true },
      { nombre: 'MODULO_ROLES_CREAR', descripcion: 'Permite crear roles.', estado: true },
      { nombre: 'MODULO_ROLES_EDITAR', descripcion: 'Permite editar roles.', estado: true },
      { nombre: 'MODULO_ROLES_ELIMINAR', descripcion: 'Permite eliminar roles.', estado: true },
      { nombre: 'MODULO_ROLES_ASIGNAR_PERMISOS', descripcion: 'Permite asignar permisos a roles.', estado: true },
      // Permisos (gestión de los propios permisos)
      { nombre: 'MODULO_PERMISOS_VER', descripcion: 'Permite ver permisos del sistema.', estado: true },
      // Usuarios
      { nombre: 'MODULO_USUARIOS_VER', descripcion: 'Permite ver usuarios.', estado: true },
      { nombre: 'MODULO_USUARIOS_CREAR', descripcion: 'Permite crear usuarios.', estado: true },
      { nombre: 'MODULO_USUARIOS_EDITAR', descripcion: 'Permite editar usuarios.', estado: true },
      { nombre: 'MODULO_USUARIOS_ELIMINAR', descripcion: 'Permite eliminar usuarios.', estado: true },
      // Clientes
      { nombre: 'MODULO_CLIENTES_VER', descripcion: 'Permite ver clientes.', estado: true },
      { nombre: 'MODULO_CLIENTES_CREAR', descripcion: 'Permite crear clientes.', estado: true },
      { nombre: 'MODULO_CLIENTES_EDITAR', descripcion: 'Permite editar clientes.', estado: true },
      { nombre: 'MODULO_CLIENTES_ELIMINAR', descripcion: 'Permite eliminar clientes.', estado: true },
      // Empleados
      { nombre: 'MODULO_EMPLEADOS_VER', descripcion: 'Permite ver empleados.', estado: true },
      { nombre: 'MODULO_EMPLEADOS_CREAR', descripcion: 'Permite crear empleados.', estado: true },
      { nombre: 'MODULO_EMPLEADOS_EDITAR', descripcion: 'Permite editar empleados.', estado: true },
      { nombre: 'MODULO_EMPLEADOS_ELIMINAR', descripcion: 'Permite eliminar empleados.', estado: true },
      // Productos
      { nombre: 'MODULO_PRODUCTOS_VER', descripcion: 'Permite ver productos.', estado: true },
      { nombre: 'MODULO_PRODUCTOS_CREAR', descripcion: 'Permite crear productos.', estado: true },
      { nombre: 'MODULO_PRODUCTOS_EDITAR', descripcion: 'Permite editar productos.', estado: true },
      { nombre: 'MODULO_PRODUCTOS_ELIMINAR', descripcion: 'Permite eliminar productos.', estado: true },
      // Categorias Productos
      { nombre: 'MODULO_CATEGORIAS_PRODUCTOS_VER', descripcion: 'Permite ver categorías de productos.', estado: true },
      { nombre: 'MODULO_CATEGORIAS_PRODUCTOS_CREAR', descripcion: 'Permite crear categorías de productos.', estado: true },
      { nombre: 'MODULO_CATEGORIAS_PRODUCTOS_EDITAR', descripcion: 'Permite editar categorías de productos.', estado: true },
      { nombre: 'MODULO_CATEGORIAS_PRODUCTOS_ELIMINAR', descripcion: 'Permite eliminar categorías de productos.', estado: true },
      // Servicios
      { nombre: 'MODULO_SERVICIOS_VER', descripcion: 'Permite ver servicios.', estado: true },
      { nombre: 'MODULO_SERVICIOS_CREAR', descripcion: 'Permite crear servicios.', estado: true },
      { nombre: 'MODULO_SERVICIOS_EDITAR', descripcion: 'Permite editar servicios.', estado: true },
      { nombre: 'MODULO_SERVICIOS_ELIMINAR', descripcion: 'Permite eliminar servicios.', estado: true },
      // Categorias Servicios
      { nombre: 'MODULO_CATEGORIAS_SERVICIOS_VER', descripcion: 'Permite ver categorías de servicios.', estado: true },
      { nombre: 'MODULO_CATEGORIAS_SERVICIOS_CREAR', descripcion: 'Permite crear categorías de servicios.', estado: true },
      { nombre: 'MODULO_CATEGORIAS_SERVICIOS_EDITAR', descripcion: 'Permite editar categorías de servicios.', estado: true },
      { nombre: 'MODULO_CATEGORIAS_SERVICIOS_ELIMINAR', descripcion: 'Permite eliminar categorías de servicios.', estado: true },
      // Especialidades
      { nombre: 'MODULO_ESPECIALIDADES_VER', descripcion: 'Permite ver especialidades.', estado: true },
      { nombre: 'MODULO_ESPECIALIDADES_CREAR', descripcion: 'Permite crear especialidades.', estado: true },
      { nombre: 'MODULO_ESPECIALIDADES_EDITAR', descripcion: 'Permite editar especialidades.', estado: true },
      { nombre: 'MODULO_ESPECIALIDADES_ELIMINAR', descripcion: 'Permite eliminar especialidades.', estado: true },
      // Citas
      { nombre: 'MODULO_CITAS_VER_TODAS', descripcion: 'Permite ver todas las citas.', estado: true },
      { nombre: 'MODULO_CITAS_VER_PROPIAS', descripcion: 'Permite ver citas propias (cliente/empleado).', estado: true },
      { nombre: 'MODULO_CITAS_CREAR', descripcion: 'Permite crear citas.', estado: true },
      { nombre: 'MODULO_CITAS_EDITAR', descripcion: 'Permite editar citas.', estado: true },
      { nombre: 'MODULO_CITAS_CANCELAR', descripcion: 'Permite cancelar citas.', estado: true },
      { nombre: 'MODULO_CITAS_ASIGNAR_EMPLEADO', descripcion: 'Permite asignar empleado a citas.', estado: true },
      // Ventas
      { nombre: 'MODULO_VENTAS_VER', descripcion: 'Permite ver ventas.', estado: true },
      { nombre: 'MODULO_VENTAS_CREAR', descripcion: 'Permite crear (registrar) ventas.', estado: true },
      { nombre: 'MODULO_VENTAS_ANULAR', descripcion: 'Permite anular ventas.', estado: true },
      // Compras
      { nombre: 'MODULO_COMPRAS_VER', descripcion: 'Permite ver compras.', estado: true },
      { nombre: 'MODULO_COMPRAS_CREAR', descripcion: 'Permite registrar compras.', estado: true },
      { nombre: 'MODULO_COMPRAS_EDITAR', descripcion: 'Permite editar compras.', estado: true },
      // Abastecimiento (Stock)
      { nombre: 'MODULO_ABASTECIMIENTO_VER', descripcion: 'Permite ver movimientos de stock.', estado: true },
      { nombre: 'MODULO_ABASTECIMIENTO_REGISTRAR', descripcion: 'Permite registrar entradas de stock.', estado: true },
      // Proveedores
      { nombre: 'MODULO_PROVEEDORES_VER', descripcion: 'Permite ver proveedores.', estado: true },
      { nombre: 'MODULO_PROVEEDORES_CREAR', descripcion: 'Permite crear proveedores.', estado: true },
      { nombre: 'MODULO_PROVEEDORES_EDITAR', descripcion: 'Permite editar proveedores.', estado: true },
      { nombre: 'MODULO_PROVEEDORES_ELIMINAR', descripcion: 'Permite eliminar proveedores.', estado: true },
      // Dashboard
      { nombre: 'MODULO_DASHBOARD_VER_ADMIN', descripcion: 'Permite ver dashboard administrativo.', estado: true },
      { nombre: 'MODULO_DASHBOARD_VER_EMPLEADO', descripcion: 'Permite ver dashboard de empleado.', estado: true },
      // Novedades
      { nombre: 'MODULO_NOVEDADES_VER', descripcion: 'Permite ver novedades.', estado: true },
      { nombre: 'MODULO_NOVEDADES_CREAR', descripcion: 'Permite crear novedades.', estado: true },
      { nombre: 'MODULO_NOVEDADES_GESTIONAR', descripcion: 'Permite gestionar novedades (editar/eliminar).', estado: true },
      // Configuración (general del sistema)
      { nombre: 'MODULO_CONFIGURACION_VER', descripcion: 'Permite ver la configuración del sistema.', estado: true },
      { nombre: 'MODULO_CONFIGURACION_EDITAR', descripcion: 'Permite editar la configuración del sistema.', estado: true },
       // Estados (gestión de los estados del sistema)
      { nombre: 'MODULO_ESTADOS_VER', descripcion: 'Permite ver los estados del sistema.', estado: true },
      { nombre: 'MODULO_ESTADOS_CREAR', descripcion: 'Permite crear nuevos estados.', estado: true },
      { nombre: 'MODULO_ESTADOS_EDITAR', descripcion: 'Permite editar estados existentes.', estado: true },
      { nombre: 'MODULO_ESTADOS_ELIMINAR', descripcion: 'Permite eliminar estados.', estado: true },
    ];
    await queryInterface.bulkInsert('permisos', permisos, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('permisos', null, {});
  }
};
