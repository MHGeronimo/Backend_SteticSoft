'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Helper function to get ID from name
    const getId = async (modelName, columnName, valueName) => {
      const result = await queryInterface.sequelize.query(
        `SELECT ${columnName} FROM ${modelName} WHERE nombre = :valueName`,
        {
          replacements: { valueName },
          type: queryInterface.sequelize.QueryTypes.SELECT,
        }
      );
      if (!result || result.length === 0) {
        throw new Error(`No se encontró ${modelName} con nombre ${valueName}`);
      }
      return result[0][columnName];
    };

    // Helper function to get ID from name (for permisos table, column is 'nombre')
    const getPermisoId = async (permisoNombre) => {
        const result = await queryInterface.sequelize.query(
        `SELECT id_permiso FROM permisos WHERE nombre = :permisoNombre`,
        {
            replacements: { permisoNombre },
            type: queryInterface.sequelize.QueryTypes.SELECT,
        }
        );
        if (!result || result.length === 0) {
        throw new Error(`No se encontró permiso con nombre ${permisoNombre}`);
        }
        return result[0].id_permiso;
    };


    // Get Role IDs
    const adminRolId = await getId('rol', 'id_rol', 'Administrador');
    const empleadoRolId = await getId('rol', 'id_rol', 'Empleado');
    // const clienteRolId = await getId('rol', 'id_rol', 'Cliente'); // Clientes suelen tener permisos implícitos

    // Get all Permission IDs
    const todosLosPermisos = await queryInterface.sequelize.query(
      "SELECT id_permiso, nombre FROM permisos",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!todosLosPermisos || todosLosPermisos.length === 0) {
      console.warn("No hay permisos en la base de datos para asignar.");
      return;
    }

    // Assign all permissions to Administrador
    const permisosParaAdmin = todosLosPermisos.map(permiso => ({
      id_rol: adminRolId,
      id_permiso: permiso.id_permiso
      // estado: true // ELIMINADO
    }));

    // Define permissions for Empleado role
    const nombresPermisosEmpleado = [
      'MODULO_CLIENTES_VER', 'MODULO_CLIENTES_CREAR', 'MODULO_CLIENTES_EDITAR',
      'MODULO_PRODUCTOS_VER',
      'MODULO_SERVICIOS_VER',
      'MODULO_CITAS_VER_TODAS', 'MODULO_CITAS_CREAR', 'MODULO_CITAS_EDITAR', 'MODULO_CITAS_CANCELAR',
      'MODULO_VENTAS_VER', 'MODULO_VENTAS_CREAR',
      'MODULO_ABASTECIMIENTO_VER', 'MODULO_ABASTECIMIENTO_REGISTRAR',
      'MODULO_DASHBOARD_VER_EMPLEADO',
      'MODULO_NOVEDADES_VER'
    ];

    const permisosParaEmpleado = [];
    for (const nombrePermiso of nombresPermisosEmpleado) {
      try {
        const permisoId = await getPermisoId(nombrePermiso);
        permisosParaEmpleado.push({
          id_rol: empleadoRolId,
          id_permiso: permisoId
          // estado: true // ELIMINADO
        });
      } catch (error) {
        console.warn(`Advertencia: No se pudo encontrar el permiso '${nombrePermiso}' para el rol Empleado. ${error.message}`);
        // Puede decidir si continuar o detenerse si un permiso es crítico
      }
    }

    // Combine all assignments
    const todasLasAsignaciones = [...permisosParaAdmin, ...permisosParaEmpleado];

    if (todasLasAsignaciones.length > 0) {
      await queryInterface.bulkInsert('permisos_x_rol', todasLasAsignaciones, {});
    } else {
      console.warn("No hay asignaciones de permisos_x_rol para insertar.");
    }

  },

  async down(queryInterface, Sequelize) {
    // This will delete all entries. More specific deletion might be needed in some cases.
    await queryInterface.bulkDelete('permisos_x_rol', null, {});
  }
};
