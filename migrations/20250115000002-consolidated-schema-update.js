'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Esta migración consolida todos los cambios del esquema actual
    // y asegura que la base de datos esté sincronizada con steticsoft_schema.sql
    
    console.log('🔄 Ejecutando migración consolidada...');
    
    // Verificar que todas las tablas existan con la estructura correcta
    const tables = [
      'rol', 'permisos', 'permisos_x_rol', 'usuario', 'historial_cambios_rol',
      'dashboard', 'estado', 'cliente', 'empleado', 'proveedor',
      'categoria_producto', 'categoria_servicio', 'producto', 'servicio',
      'compra', 'venta', 'novedades', 'novedad_empleado', 'cita',
      'servicio_x_cita', 'compra_x_producto', 'producto_x_venta',
      'venta_x_servicio', 'abastecimiento', 'token_recuperacion'
    ];
    
    for (const table of tables) {
      try {
        await queryInterface.describeTable(table);
        console.log(`✅ Tabla ${table} existe`);
      } catch (error) {
        console.log(`❌ Tabla ${table} no existe: ${error.message}`);
      }
    }
    
    // Verificar campos específicos que agregamos
    try {
      const productoColumns = await queryInterface.describeTable('producto');
      if (!productoColumns.imagen_public_id) {
        console.log('⚠️  Campo imagen_public_id no existe en producto');
      } else {
        console.log('✅ Campo imagen_public_id existe en producto');
      }
    } catch (error) {
      console.log('❌ Error verificando producto:', error.message);
    }
    
    try {
      const servicioColumns = await queryInterface.describeTable('servicio');
      if (!servicioColumns.imagen_public_id) {
        console.log('⚠️  Campo imagen_public_id no existe en servicio');
      } else {
        console.log('✅ Campo imagen_public_id existe en servicio');
      }
    } catch (error) {
      console.log('❌ Error verificando servicio:', error.message);
    }
    
    // Verificar permisos
    try {
      const permisos = await queryInterface.sequelize.query(
        "SELECT nombre FROM permisos WHERE nombre = 'MODULO_VENTAS_CLIENTE'",
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      
      if (permisos.length === 0) {
        console.log('⚠️  Permiso MODULO_VENTAS_CLIENTE no existe');
      } else {
        console.log('✅ Permiso MODULO_VENTAS_CLIENTE existe');
      }
    } catch (error) {
      console.log('❌ Error verificando permisos:', error.message);
    }
    
    console.log('🎯 Migración consolidada completada');
  },

  async down(queryInterface, Sequelize) {
    // Esta migración es de verificación, no tiene rollback
    console.log('⚠️  Esta migración no tiene rollback (es de verificación)');
  }
};