'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cliente', {
      id_cliente: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      apellido: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      correo: { // Corregido de 'email' a 'correo'
        type: Sequelize.STRING(100),
        allowNull: false, // Coincide con el modelo y el script SQL
        unique: true
        // Se elimina la validación 'isEmail' de la migración, ya que es más apropiada en el modelo.
      },
      telefono: {
        type: Sequelize.STRING(20),
        allowNull: false // Coincide con el modelo y el script SQL
        // Se elimina 'unique: true' ya que no está en el script SQL ni en el modelo como único.
      },
      tipo_documento: { // Añadido
        type: Sequelize.STRING(50),
        allowNull: false
      },
      numero_documento: { // Añadido
        type: Sequelize.STRING(45),
        allowNull: false,
        unique: true
      },
      fecha_nacimiento: { // Añadido
        type: Sequelize.DATEONLY, // Usar DATEONLY para solo fecha
        allowNull: false
      },
      estado: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      id_usuario: {
        type: Sequelize.INTEGER,
        allowNull: false, // Coincide con el modelo y el script SQL
        unique: true,    // Coincide con el modelo y el script SQL
        references: {
          model: 'usuario',
          key: 'id_usuario',
        },
        onUpdate: 'CASCADE', // Mantener consistencia, aunque el script SQL no lo define explícitamente.
        onDelete: 'RESTRICT', // Coincide con el modelo y el script SQL
      }
      // Se elimina 'fecha_registro' y 'direccion' ya que no están en el script SQL de cliente ni en el modelo.
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cliente');
  }
};
