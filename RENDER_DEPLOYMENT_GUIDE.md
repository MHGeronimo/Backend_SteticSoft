# 🚀 Guía de Despliegue en Render.com - SteticSoft

## 📋 Configuración Requerida

### 1. **Variables de Entorno en Render**

Configura las siguientes variables de entorno en tu dashboard de Render:

```bash
# Base de datos
DATABASE_URL=postgresql://usuario:password@host:puerto/database

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro_aqui

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Entorno
NODE_ENV=production
```

### 2. **Comando de Build para Render**

En la configuración de tu servicio web en Render, usa:

```bash
npm run render:build
```

### 3. **Comando de Start para Render**

```bash
npm run render:start
```

## 🔄 Migraciones Automáticas

### **Opción 1: Comando de Deploy Completo (Recomendado)**

```bash
npm run render:deploy
```

Este comando:
1. ✅ Instala dependencias (`npm install`)
2. ✅ Ejecuta migraciones (`npx sequelize-cli db:migrate`)
3. ✅ Inicia la aplicación (`npm start`)

### **Opción 2: Comandos Separados**

**Build Command:**
```bash
npm install && npx sequelize-cli db:migrate
```

**Start Command:**
```bash
npm start
```

## 📁 Estructura de Migraciones Organizada

### **Migraciones de Creación (15 de Junio 2025)**
- `20250615054301-create-rol.js`
- `20250615054320-create-permisos.js`
- `20250615054338-create-dashboard.js`
- `20250615054357-create-estado.js`
- `20250615054418-create-especialidad.js`
- `20250615054437-create-proveedor.js`
- `20250615054457-create-categoria-producto.js`
- `20250615054517-create-categoria-servicio.js`
- `20250615054552-create-usuario.js`
- `20250615054615-create-permisos-rol.js`
- `20250615054638-create-producto.js` ✅ (Actualizada con imagen_public_id)
- `20250615054701-create-servicio.js` ✅ (Actualizada con imagen_public_id)
- `20250615054737-create-cliente.js`
- `20250615054800-create-empleado.js`
- `20250615054823-create-token-recuperacion.js`
- `20250615054908-create-compra.js`
- `20250615054949-create-empleado-especialidad.js`
- `20250615055015-create-novedades.js`
- `20250615055043-create-abastecimiento.js`
- `20250615055110-create-cita.js`
- `20250615055138-create-venta.js`
- `20250615055225-create-compra-producto.js`
- `20250615055254-create-servicio-cita.js`
- `20250615055323-create-producto-venta.js`
- `20250615055352-create-venta-servicio.js`

### **Migraciones de Modificación**
- `20231110100000-add-tipoperfil-to-rol-and-adjust-nombre.js`
- `20240729100000-add-vida-util-tipo-uso-to-producto.js` ✅ (Corregida)
- `20250115000000-add-imagen-public-id-to-producto-and-servicio.js` ✅ (Nueva)
- `20250115000001-add-missing-permission-modulo-ventas-cliente.js` ✅ (Nueva)
- `20250115000002-consolidated-schema-update.js` ✅ (Verificación)
- `20250905194746-modify-abastecimiento-add-usuario-relation.js`
- `20250910020813-modify-cita-table.js`

## 🛠️ Scripts Disponibles

### **Desarrollo Local**
```bash
npm run dev          # Desarrollo con nodemon
npm run db:migrate   # Ejecutar migraciones
npm start           # Iniciar en producción
```

### **Render.com**
```bash
npm run render:build   # Build para Render
npm run render:start   # Start para Render
npm run render:deploy  # Deploy completo
```

## 🔍 Verificación Post-Deploy

### **1. Verificar Migraciones**
```bash
npx sequelize-cli db:migrate:status
```

### **2. Verificar Campos Agregados**
```sql
-- Verificar campos de imagen en producto
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'producto' AND column_name = 'imagen_public_id';

-- Verificar campos de imagen en servicio
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'servicio' AND column_name = 'imagen_public_id';

-- Verificar permiso agregado
SELECT nombre FROM permisos WHERE nombre = 'MODULO_VENTAS_CLIENTE';
```

### **3. Verificar Funcionalidad**
- ✅ Subida de imágenes a Cloudinary
- ✅ Almacenamiento de public_id
- ✅ Eliminación de imágenes huérfanas
- ✅ Permisos funcionando correctamente

## 📊 Estado de Sincronización

- **✅ Esquema SQL**: Actualizado con todos los campos
- **✅ Migraciones**: Organizadas y sincronizadas
- **✅ Modelos**: Actualizados con imagenPublicId
- **✅ Controladores**: Manejan Cloudinary correctamente
- **✅ Servicios**: Lógica de imágenes implementada
- **✅ Permisos**: Todos los permisos de rutas incluidos

## 🚨 Troubleshooting

### **Error: Migración ya ejecutada**
```bash
# Verificar estado
npx sequelize-cli db:migrate:status

# Si hay migraciones huérfanas, limpiar
npx sequelize-cli db:migrate:undo:all
npx sequelize-cli db:migrate
```

### **Error: Campo no existe**
```bash
# Ejecutar migración específica
npx sequelize-cli db:migrate --to 20250115000000-add-imagen-public-id-to-producto-and-servicio.js
```

### **Error: Permiso no existe**
```bash
# Verificar permisos en base de datos
npx sequelize-cli db:seed:all
```

## 🎯 Comando Final para Render

**Build Command:**
```bash
npm install && npx sequelize-cli db:migrate
```

**Start Command:**
```bash
npm start
```

**O usar el comando consolidado:**
```bash
npm run render:deploy
```

## ✅ Checklist de Deploy

- [ ] Variables de entorno configuradas
- [ ] Base de datos PostgreSQL creada
- [ ] Comando de build configurado
- [ ] Comando de start configurado
- [ ] Migraciones ejecutándose automáticamente
- [ ] Aplicación iniciando correctamente
- [ ] Endpoints respondiendo
- [ ] Subida de imágenes funcionando
- [ ] Permisos funcionando

**Estado**: 🚀 **LISTO PARA PRODUCCIÓN**
