# Resumen de Migraciones - SteticSoft

## Estado Actual de las Migraciones

### Migraciones de Creación Inicial (15 de Junio 2025)
- `20250615054301-create-rol.js` - Tabla de roles
- `20250615054320-create-permisos.js` - Tabla de permisos
- `20250615054338-create-dashboard.js` - Tabla de dashboard
- `20250615054357-create-estado.js` - Tabla de estados
- `20250615054418-create-especialidad.js` - Tabla de especialidades
- `20250615054437-create-proveedor.js` - Tabla de proveedores
- `20250615054457-create-categoria-producto.js` - Tabla de categorías de productos
- `20250615054517-create-categoria-servicio.js` - Tabla de categorías de servicios
- `20250615054552-create-usuario.js` - Tabla de usuarios
- `20250615054615-create-permisos-rol.js` - Tabla de relación permisos-rol
- `20250615054638-create-producto.js` - **ACTUALIZADA** - Tabla de productos (incluye imagen_public_id)
- `20250615054701-create-servicio.js` - **ACTUALIZADA** - Tabla de servicios (incluye imagen_public_id)
- `20250615054737-create-cliente.js` - Tabla de clientes
- `20250615054800-create-empleado.js` - Tabla de empleados
- `20250615054823-create-token-recuperacion.js` - Tabla de tokens de recuperación
- `20250615054908-create-compra.js` - Tabla de compras
- `20250615054949-create-empleado-especialidad.js` - Tabla de relación empleado-especialidad
- `20250615055015-create-novedades.js` - Tabla de novedades
- `20250615055043-create-abastecimiento.js` - Tabla de abastecimientos
- `20250615055110-create-cita.js` - Tabla de citas
- `20250615055138-create-venta.js` - Tabla de ventas
- `20250615055225-create-compra-producto.js` - Tabla de relación compra-producto
- `20250615055254-create-servicio-cita.js` - Tabla de relación servicio-cita
- `20250615055323-create-producto-venta.js` - Tabla de relación producto-venta
- `20250615055352-create-venta-servicio.js` - Tabla de relación venta-servicio

### Migraciones de Modificación
- `20231110100000-add-tipoperfil-to-rol-and-adjust-nombre.js` - Agregar tipo_perfil a rol
- `20240729100000-add-vida-util-tipo-uso-to-producto.js` - **CORREGIDA** - Agregar vida_util_dias y tipo_uso a producto
- `20250115000000-add-imagen-public-id-to-producto-and-servicio.js` - **NUEVA** - Agregar imagen_public_id a producto y servicio
- `20250905194746-modify-abastecimiento-add-usuario-relation.js` - Agregar relación usuario a abastecimiento
- `20250910020813-modify-cita-table.js` - Modificar tabla de citas

## Cambios Realizados para Cloudinary

### 1. Esquema SQL Actualizado (`steticsoft_schema.sql`)
- ✅ Agregado campo `imagen_public_id VARCHAR(255)` a tabla `producto`
- ✅ Agregado campo `imagen_public_id VARCHAR(255)` a tabla `servicio`
- ✅ Actualizado comentario de última modificación

### 2. Migraciones Actualizadas
- ✅ `20250615054638-create-producto.js` - Incluye todos los campos actuales
- ✅ `20250615054701-create-servicio.js` - Incluye campos de imagen
- ✅ `20240729100000-add-vida-util-tipo-uso-to-producto.js` - Corregido valor por defecto

### 3. Nueva Migración
- ✅ `20250115000000-add-imagen-public-id-to-producto-and-servicio.js` - Para bases de datos existentes

## Orden de Ejecución Recomendado

1. **Para bases de datos nuevas**: Ejecutar todas las migraciones en orden cronológico
2. **Para bases de datos existentes**: Ejecutar solo la migración `20250115000000-add-imagen-public-id-to-producto-and-servicio.js`

## Comando de Ejecución

```bash
npx sequelize-cli db:migrate
```

## Verificación Post-Migración

Después de ejecutar las migraciones, verificar que las tablas tengan los campos:
- `producto.imagen_public_id`
- `servicio.imagen_public_id`

## Notas Importantes

- Todas las migraciones están sincronizadas con el esquema SQL
- Los campos de imagen son opcionales (`allowNull: true`)
- Se mantiene compatibilidad con datos existentes
- El sistema está listo para implementar Cloudinary
