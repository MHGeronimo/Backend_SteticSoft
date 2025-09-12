# Análisis de Permisos - SteticSoft

## Permisos Utilizados en las Rutas

### ✅ Permisos que SÍ están en el esquema SQL:

1. **MODULO_ROLES_GESTIONAR** ✅
2. **MODULO_ROLES_ASIGNAR_PERMISOS** ✅
3. **MODULO_PERMISOS_GESTIONAR** ✅
4. **MODULO_USUARIOS_GESTIONAR** ✅
5. **MODULO_DASHBOARD_VER** ✅
6. **MODULO_ESTADOS_GESTIONAR** ✅
7. **MODULO_CLIENTES_GESTIONAR** ✅
8. **MODULO_EMPLEADOS_GESTIONAR** ✅
9. **MODULO_ESPECIALIDADES_GESTIONAR** ✅
10. **MODULO_PROVEEDORES_GESTIONAR** ✅
11. **MODULO_CATEGORIAS_PRODUCTOS_GESTIONAR** ✅
12. **MODULO_CATEGORIAS_SERVICIOS_GESTIONAR** ✅
13. **MODULO_PRODUCTOS_GESTIONAR** ✅
14. **MODULO_COMPRAS_GESTIONAR** ✅
15. **MODULO_VENTAS_GESTIONAR** ✅
16. **MODULO_CITAS_CLIENTE** ✅
17. **MODULO_CITAS_GESTIONAR** ✅
18. **MODULO_SERVICIOS_GESTIONAR** ✅
19. **MODULO_ABASTECIMIENTOS_GESTIONAR** ✅
20. **MODULO_NOVEDADES_EMPLEADOS_GESTIONAR** ✅

### ❌ Permisos que NO están en el esquema SQL:

1. **MODULO_VENTAS_CLIENTE** ❌ - Usado en venta.routes.js línea 17

## Permisos Adicionales en el Esquema SQL (no utilizados en rutas):

1. **MODULO_CLIENTES_VER_PROPIO** - Para clientes ver su propio perfil
2. **MODULO_CATEGORIAS_PRODUCTOS_VER** - Para clientes ver categorías
3. **MODULO_CATEGORIAS_SERVICIOS_VER** - Para clientes ver categorías
4. **MODULO_PRODUCTOS_VER** - Para clientes ver productos
5. **MODULO_VENTAS_CREAR_PROPIA** - Para clientes crear ventas
6. **MODULO_VENTAS_VER_PROPIAS** - Para clientes ver sus ventas
7. **MODULO_CITAS_CREAR_PROPIA** - Para clientes crear citas
8. **MODULO_CITAS_VER_PROPIAS** - Para clientes ver sus citas
9. **MODULO_CITAS_CANCELAR_PROPIA** - Para clientes cancelar citas
10. **MODULO_SERVICIOS_VER** - Para clientes ver servicios

## Acciones Requeridas:

1. **Agregar permiso faltante**: `MODULO_VENTAS_CLIENTE`
2. **Verificar uso de permisos**: Algunos permisos del esquema no se usan en rutas
