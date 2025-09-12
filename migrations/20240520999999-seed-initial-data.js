'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkInsert('rol', [
        { nombre: 'Administrador', tipo_perfil: 'NINGUNO', descripcion: 'Acceso total a todos los módulos y funcionalidades del sistema.', estado: true },
        { nombre: 'Empleado', tipo_perfil: 'EMPLEADO', descripcion: 'Acceso a módulos operativos como ventas, citas, clientes, etc.', estado: true },
        { nombre: 'Cliente', tipo_perfil: 'CLIENTE', descripcion: 'Acceso limitado a sus propias citas, compras y gestión de perfil.', estado: true }
      ], { transaction });

      await queryInterface.bulkInsert('permisos', [
        { nombre: 'MODULO_ROLES_GESTIONAR', descripcion: 'Permite la gestión completa de roles del sistema.', estado: true },
        { nombre: 'MODULO_ROLES_ASIGNAR_PERMISOS', descripcion: 'Permite asignar y quitar permisos a los roles.', estado: true },
        { nombre: 'MODULO_PERMISOS_GESTIONAR', descripcion: 'Permite la gestión completa de los permisos del sistema.', estado: true },
        { nombre: 'MODULO_USUARIOS_GESTIONAR', descripcion: 'Permite la gestión completa de usuarios del sistema.', estado: true },
        { nombre: 'MODULO_DASHBOARD_VER', descripcion: 'Permite visualizar los dashboards y sus datos.', estado: true },
        { nombre: 'MODULO_ESTADOS_GESTIONAR', descripcion: 'Permite la gestión de los diferentes estados de la aplicación.', estado: true },
        { nombre: 'MODULO_CLIENTES_GESTIONAR', descripcion: 'Permite la gestión completa de la información de los clientes (Admin/Empleado).', estado: true },
        { nombre: 'MODULO_CLIENTES_VER_PROPIO', descripcion: 'Permite a un cliente ver y editar su propio perfil.', estado: true },
        { nombre: 'MODULO_EMPLEADOS_GESTIONAR', descripcion: 'Permite la gestión completa de la información de los empleados.', estado: true },
        { nombre: 'MODULO_ESPECIALIDADES_GESTIONAR', descripcion: 'Permite la gestión de las especialidades.', estado: true },
        { nombre: 'MODULO_PROVEEDORES_GESTIONAR', descripcion: 'Permite la gestión completa de la información de los proveedores.', estado: true },
        { nombre: 'MODULO_CATEGORIAS_PRODUCTOS_GESTIONAR', descripcion: 'Permite la gestión de las categorías de productos.', estado: true },
        { nombre: 'MODULO_CATEGORIAS_PRODUCTOS_VER', descripcion: 'Permite ver las categorías de productos (Cliente).', estado: true },
        { nombre: 'MODULO_CATEGORIAS_SERVICIOS_GESTIONAR', descripcion: 'Permite la gestión de las categorías de servicios.', estado: true },
        { nombre: 'MODULO_CATEGORIAS_SERVICIOS_VER', descripcion: 'Permite ver las categorías de servicios (Cliente).', estado: true },
        { nombre: 'MODULO_PRODUCTOS_GESTIONAR', descripcion: 'Permite la gestión completa de los productos del inventario.', estado: true },
        { nombre: 'MODULO_PRODUCTOS_VER', descripcion: 'Permite ver los productos (Cliente).', estado: true },
        { nombre: 'MODULO_COMPRAS_GESTIONAR', descripcion: 'Permite la gestión de las compras a proveedores.', estado: true },
        { nombre: 'MODULO_VENTAS_GESTIONAR', descripcion: 'Permite la gestión de las ventas a clientes (Admin/Empleado).', estado: true },
        { nombre: 'MODULO_VENTAS_CLIENTE', descripcion: 'Permite a un cliente acceder a funcionalidades de ventas.', estado: true },
        { nombre: 'MODULO_VENTAS_CREAR_PROPIA', descripcion: 'Permite a un cliente crear/realizar una venta (compra).', estado: true },
        { nombre: 'MODULO_VENTAS_VER_PROPIAS', descripcion: 'Permite a un cliente ver sus propias ventas.', estado: true },
        { nombre: 'MODULO_CITAS_CLIENTE', descripcion: 'Permite a un cliente ver y seleccionar recursos para agendar una cita.', estado: true },
        { nombre: 'MODULO_CITAS_GESTIONAR', descripcion: 'Permite la gestión completa de las citas (Admin/Empleado).', estado: true },
        { nombre: 'MODULO_CITAS_CREAR_PROPIA', descripcion: 'Permite a un cliente agendar sus propias citas.', estado: true },
        { nombre: 'MODULO_CITAS_VER_PROPIAS', descripcion: 'Permite a un cliente ver sus propias citas.', estado: true },
        { nombre: 'MODULO_CITAS_CANCELAR_PROPIA', descripcion: 'Permite a un cliente cancelar sus propias citas (con antelación).', estado: true },
        { nombre: 'MODULO_SERVICIOS_GESTIONAR', descripcion: 'Permite la gestión completa de los servicios ofrecidos.', estado: true },
        { nombre: 'MODULO_SERVICIOS_VER', descripcion: 'Permite ver los servicios ofrecidos (Cliente).', estado: true },
        { nombre: 'MODULO_ABASTECIMIENTOS_GESTIONAR', descripcion: 'Permite la gestión del abastecimiento de productos (salida para empleados).', estado: true },
        { nombre: 'MODULO_NOVEDADES_EMPLEADOS_GESTIONAR', descripcion: 'Permite la gestión de novedades y horarios de empleados.', estado: true }
      ], { transaction });

      await queryInterface.bulkInsert('estado', [
        { id_estado: 1, nombre_estado: 'En proceso' },
        { id_estado: 2, nombre_estado: 'Pendiente' },
        { id_estado: 3, nombre_estado: 'Completado' },
        { id_estado: 4, nombre_estado: 'Cancelado' }
      ], { transaction });

      await queryInterface.sequelize.query(`
        INSERT INTO usuario (correo, contrasena, id_rol, estado) VALUES
        ('mrgerito@gmail.com', '$2b$10$oJOJM36rGGzZftagNM1vWOxLaW96cPBRk.DhhvSvv8gneGTzFIJhO', 
         (SELECT id_rol FROM rol WHERE nombre = 'Administrador'), TRUE);
      `, { transaction });

      await queryInterface.sequelize.query(`
        INSERT INTO permisos_x_rol (id_rol, id_permiso) 
        SELECT (SELECT id_rol FROM rol WHERE nombre = 'Administrador'), p.id_permiso 
        FROM permisos p WHERE p.estado = TRUE;
      `, { transaction });

      await queryInterface.sequelize.query(`
        INSERT INTO permisos_x_rol (id_rol, id_permiso) 
        SELECT r.id_rol, p.id_permiso 
        FROM rol r, permisos p 
        WHERE r.nombre = 'Empleado' 
        AND p.estado = TRUE 
        AND p.nombre IN (
            'MODULO_ABASTECIMIENTOS_GESTIONAR', 'MODULO_VENTAS_GESTIONAR', 'MODULO_COMPRAS_GESTIONAR', 
            'MODULO_CLIENTES_GESTIONAR', 'MODULO_PROVEEDORES_GESTIONAR', 'MODULO_PRODUCTOS_GESTIONAR', 
            'MODULO_SERVICIOS_GESTIONAR', 'MODULO_CITAS_GESTIONAR', 'MODULO_ESTADOS_GESTIONAR', 
            'MODULO_DASHBOARD_VER', 'MODULO_CATEGORIAS_PRODUCTOS_GESTIONAR', 
            'MODULO_CATEGORIAS_SERVICIOS_GESTIONAR', 'MODULO_ESPECIALIDADES_GESTIONAR'
        );
      `, { transaction });

      await queryInterface.sequelize.query(`
        INSERT INTO permisos_x_rol (id_rol, id_permiso) 
        SELECT r.id_rol, p.id_permiso 
        FROM rol r, permisos p 
        WHERE r.nombre = 'Cliente' 
        AND p.estado = TRUE 
        AND p.nombre IN (
            'MODULO_CITAS_CREAR_PROPIA', 'MODULO_CITAS_VER_PROPIAS', 'MODULO_CITAS_CANCELAR_PROPIA', 
            'MODULO_VENTAS_CREAR_PROPIA', 'MODULO_VENTAS_VER_PROPIAS', 'MODULO_PRODUCTOS_VER', 
            'MODULO_SERVICIOS_VER', 'MODULO_CATEGORIAS_PRODUCTOS_VER', 
            'MODULO_CATEGORIAS_SERVICIOS_VER', 'MODULO_CLIENTES_VER_PROPIO'
        );
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query("DELETE FROM permisos_x_rol", { transaction });
      await queryInterface.sequelize.query("DELETE FROM usuario", { transaction });
      await queryInterface.sequelize.query("DELETE FROM rol", { transaction });
      await queryInterface.sequelize.query("DELETE FROM permisos", { transaction });
      await queryInterface.sequelize.query("DELETE FROM estado", { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};