'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // It's important to use raw queries here to support the ON CONFLICT clause,
      // which is PostgreSQL-specific and not handled by queryInterface.bulkInsert.

      // Insert Roles
      await queryInterface.sequelize.query(`
        INSERT INTO rol (nombre, tipo_perfil, descripcion, estado) VALUES
        ('Administrador', 'NINGUNO', 'Acceso total a todos los módulos y funcionalidades del sistema.', TRUE),
        ('Empleado', 'EMPLEADO', 'Acceso a módulos operativos como ventas, citas, clientes, etc.', TRUE),
        ('Cliente', 'CLIENTE', 'Acceso limitado a sus propias citas, compras y gestión de perfil.', TRUE)
        ON CONFLICT (nombre) DO UPDATE SET
        tipo_perfil = EXCLUDED.tipo_perfil,
        descripcion = EXCLUDED.descripcion,
        estado = EXCLUDED.estado;
      `, { transaction });

      // Insert Permissions
      await queryInterface.sequelize.query(`
        INSERT INTO permisos (nombre, descripcion, estado) VALUES
        ('MODULO_ROLES_GESTIONAR', 'Permite la gestión completa de roles del sistema.', TRUE),
        ('MODULO_ROLES_ASIGNAR_PERMISOS', 'Permite asignar y quitar permisos a los roles.', TRUE),
        ('MODULO_PERMISOS_GESTIONAR', 'Permite la gestión completa de los permisos del sistema.', TRUE),
        ('MODULO_USUARIOS_GESTIONAR', 'Permite la gestión completa de usuarios del sistema.', TRUE),
        ('MODULO_DASHBOARD_VER', 'Permite visualizar los dashboards y sus datos.', TRUE),
        ('MODULO_ESTADOS_GESTIONAR', 'Permite la gestión de los diferentes estados de la aplicación.', TRUE),
        ('MODULO_CLIENTES_GESTIONAR', 'Permite la gestión completa de la información de los clientes (Admin/Empleado).', TRUE),
        ('MODULO_CLIENTES_VER_PROPIO', 'Permite a un cliente ver y editar su propio perfil.', TRUE),
        ('MODULO_EMPLEADOS_GESTIONAR', 'Permite la gestión completa de la información de los empleados.', TRUE),
        ('MODULO_ESPECIALIDADES_GESTIONAR', 'Permite la gestión de las especialidades.', TRUE),
        ('MODULO_PROVEEDORES_GESTIONAR', 'Permite la gestión completa de la información de los proveedores.', TRUE),
        ('MODULO_CATEGORIAS_PRODUCTOS_GESTIONAR', 'Permite la gestión de las categorías de productos.', TRUE),
        ('MODULO_CATEGORIAS_PRODUCTOS_VER', 'Permite ver las categorías de productos (Cliente).', TRUE),
        ('MODULO_CATEGORIAS_SERVICIOS_GESTIONAR', 'Permite la gestión de las categorías de servicios.', TRUE),
        ('MODULO_CATEGORIAS_SERVICIOS_VER', 'Permite ver las categorías de servicios (Cliente).', TRUE),
        ('MODULO_PRODUCTOS_GESTIONAR', 'Permite la gestión completa de los productos del inventario.', TRUE),
        ('MODULO_PRODUCTOS_VER', 'Permite ver los productos (Cliente).', TRUE),
        ('MODULO_COMPRAS_GESTIONAR', 'Permite la gestión de las compras a proveedores.', TRUE),
        ('MODULO_VENTAS_GESTIONAR', 'Permite la gestión de las ventas a clientes (Admin/Empleado).', TRUE),
        ('MODULO_VENTAS_CLIENTE', 'Permite a un cliente acceder a funcionalidades de ventas.', TRUE),
        ('MODULO_VENTAS_CREAR_PROPIA', 'Permite a un cliente crear/realizar una venta (compra).', TRUE),
        ('MODULO_VENTAS_VER_PROPIAS', 'Permite a un cliente ver sus propias ventas.', TRUE),
        ('MODULO_CITAS_CLIENTE', 'Permite a un cliente ver y seleccionar recursos para agendar una cita.', TRUE),
        ('MODULO_CITAS_GESTIONAR', 'Permite la gestión completa de las citas (Admin/Empleado).', TRUE),
        ('MODULO_CITAS_CREAR_PROPIA', 'Permite a un cliente agendar sus propias citas.', TRUE),
        ('MODULO_CITAS_VER_PROPIAS', 'Permite a un cliente ver sus propias citas.', TRUE),
        ('MODULO_CITAS_CANCELAR_PROPIA', 'Permite a un cliente cancelar sus propias citas (con antelación).', TRUE),
        ('MODULO_SERVICIOS_GESTIONAR', 'Permite la gestión completa de los servicios ofrecidos.', TRUE),
        ('MODULO_SERVICIOS_VER', 'Permite ver los servicios ofrecidos (Cliente).', TRUE),
        ('MODULO_ABASTECIMIENTOS_GESTIONAR', 'Permite la gestión del abastecimiento de productos (salida para empleados).', TRUE),
        ('MODULO_NOVEDADES_EMPLEADOS_GESTIONAR', 'Permite la gestión de novedades y horarios de empleados.', TRUE)
        ON CONFLICT (nombre) DO UPDATE SET
        descripcion = EXCLUDED.descripcion,
        estado = EXCLUDED.estado;
      `, { transaction });

      // Insert Admin User
      await queryInterface.sequelize.query(`
        INSERT INTO usuario (correo, contrasena, id_rol, estado) VALUES
        ('mrgerito@gmail.com', '$2b$10$oJOJM36rGGzZftagNM1vWOxLaW96cPBRk.DhhvSvv8gneGTzFIJhO',
         (SELECT id_rol FROM rol WHERE nombre = 'Administrador'), TRUE)
        ON CONFLICT (correo) DO UPDATE SET
        contrasena = EXCLUDED.contrasena,
        id_rol = EXCLUDED.id_rol,
        estado = EXCLUDED.estado;
      `, { transaction });

      // Assign Permissions to Roles
      await queryInterface.sequelize.query(`
        INSERT INTO permisos_x_rol (id_rol, id_permiso)
        SELECT (SELECT id_rol FROM rol WHERE nombre = 'Administrador'), p.id_permiso
        FROM permisos p WHERE p.estado = TRUE
        ON CONFLICT (id_rol, id_permiso) DO NOTHING;
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
        ) ON CONFLICT (id_rol, id_permiso) DO NOTHING;
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
        ) ON CONFLICT (id_rol, id_permiso) DO NOTHING;
      `, { transaction });

      // Insert States
      await queryInterface.sequelize.query(`
        INSERT INTO estado (id_estado, nombre_estado) VALUES
        (1, 'En proceso'), (2, 'Pendiente'), (3, 'Completado'), (4, 'Cancelado')
        ON CONFLICT (id_estado) DO UPDATE SET nombre_estado = EXCLUDED.nombre_estado;
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
      // The order of deletion is important to avoid foreign key constraint violations.
      // Start with the junction table, then the user, then the base data.
      await queryInterface.sequelize.query(`
        DELETE FROM permisos_x_rol;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DELETE FROM usuario WHERE correo = 'mrgerito@gmail.com';
      `, { transaction });

      await queryInterface.sequelize.query(`
        DELETE FROM rol WHERE nombre IN ('Administrador', 'Empleado', 'Cliente');
      `, { transaction });

      await queryInterface.sequelize.query(`
        DELETE FROM permisos;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DELETE FROM estado WHERE id_estado IN (1, 2, 3, 4);
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
