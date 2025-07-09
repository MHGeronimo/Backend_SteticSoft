'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('rol', 'tipo_perfil', {
      type: Sequelize.STRING(10),
      allowNull: false,
      defaultValue: 'EMPLEADO', // O 'NINGUNO' o quitar si el modelo no lo maneja así
      // Considerar añadir el CHECK constraint directamente con SQL si es necesario:
      // constraints: {
      //   check: Sequelize.literal("tipo_perfil IN ('CLIENTE', 'EMPLEADO', 'NINGUNO')")
      // }
      // Sin embargo, para mantenerlo simple y compatible, la validación del modelo es lo primario.
      // El SQL schema ya tiene el CHECK constraint.
    });

    // Asegurar que los valores existentes se actualicen si es necesario ANTES de cambiar allowNull a false sin defaultValue
    // Esto es más complejo y depende de la lógica de negocio para roles existentes.
    // Por ahora, el defaultValue ayuda. Si se requiere una lógica de actualización más específica,
    // se necesitarían más pasos aquí.

    // Cambiar la longitud de la columna 'nombre' a VARCHAR(50)
    await queryInterface.changeColumn('rol', 'nombre', {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: true,
    });

    // Actualizar los registros existentes de roles con un tipo_perfil adecuado
    // Esto es importante para que los datos existentes sean válidos.
    // Asumimos que los nombres de los roles son 'Administrador', 'Empleado', 'Cliente'.
    await queryInterface.sequelize.query(
      "UPDATE rol SET tipo_perfil = 'NINGUNO' WHERE nombre = 'Administrador'"
    );
    await queryInterface.sequelize.query(
      "UPDATE rol SET tipo_perfil = 'EMPLEADO' WHERE nombre = 'Empleado'"
    );
    await queryInterface.sequelize.query(
      "UPDATE rol SET tipo_perfil = 'CLIENTE' WHERE nombre = 'Cliente'"
    );

    // Después de actualizar, podemos considerar remover el defaultValue si la lógica de la app siempre proveerá el tipo_perfil
    // y si se quiere que sea estrictamente no nulo sin un default a nivel de BD después de la migración inicial.
    // Por ahora, lo dejamos con defaultValue para seguridad en la migración.
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('rol', 'tipo_perfil');

    // Revertir el cambio de longitud de 'nombre' a VARCHAR(100) (estado anterior)
    await queryInterface.changeColumn('rol', 'nombre', {
      type: Sequelize.STRING(100), // Asumiendo que el estado anterior era 100
      allowNull: false,
      unique: true,
    });
  }
};
