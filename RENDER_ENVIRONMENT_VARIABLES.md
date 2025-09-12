# 🔧 Variables de Entorno para Render.com - SteticSoft

## 📋 Configuración Completa

Basado en las variables de entorno actuales de tu proyecto en Render, aquí está la configuración completa:

### 🎯 **Variables de Entorno Configuradas**

#### **📱 Configuración Básica de la Aplicación**
```yaml
APP_NAME: "SteticSoft API"
NODE_ENV: "production"
LOG_LEVEL: "common"
```

#### **🗄️ Base de Datos PostgreSQL**
```yaml
DATABASE_URL: "postgresql://steticsoft_api_web_movil_wqoe_user:hYEpoWd0uEFsbfNFD49f1wh2fdYZ15zQ@dpg-d007576x7bc72f75ega.oregon-postgres.render.com/steticsoft_api_web_movil_wqoe"
DB_SSL_REQUIRED: "true"
DB_REJECT_UNAUTHORIZED: "false"
```

#### **🔐 Seguridad (Valores Aleatorios Generados Automáticamente)**
```yaml
JWT_SECRET: "[GENERADO AUTOMÁTICAMENTE]"
SESSION_SECRET: "[GENERADO AUTOMÁTICAMENTE]"
```

#### **☁️ Cloudinary - Gestión de Imágenes**
```yaml
CLOUDINARY_CLOUD_NAME: "M.H Geronimo"
CLOUDINARY_API_KEY: "781461585124195"
CLOUDINARY_API_SECRET: "2NH60U6uL50GA2gf25bf37w4yIE"
```

#### **🌐 Configuración de CORS**
```yaml
CORS_ORIGIN: "https://prototipo-quxa.onrender.com,http://localhost:5173"
FRONTEND_URL: "http://localhost:5173"
```

#### **📧 Configuración de Email (Gmail SMTP)**
```yaml
EMAIL_HOST: "smtp.gmail.com"
EMAIL_PORT: "587"
EMAIL_SECURE: "false"
EMAIL_USER: "lafuentedelpeluquero@gmail.com"
EMAIL_PASS: "iigutoyfzhesjjfe"
EMAIL_FROM: "\"La fuente del peluquero\" <lafuentedelpeluquero@gmail.com>"
```

## 🚀 **Configuración en Render Dashboard**

### **1. Crear Servicio Web**
- **Tipo**: Web Service
- **Nombre**: `steticsoft-api`
- **Entorno**: Node
- **Plan**: Starter

### **2. Configurar Build & Deploy**
- **Build Command**: `npm install && npx sequelize-cli db:migrate`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`

### **3. Configurar Variables de Entorno**

En el dashboard de Render, ve a **Environment** y agrega estas variables:

#### **Variables con Valores Fijos:**
```
APP_NAME = SteticSoft API
NODE_ENV = production
LOG_LEVEL = common
DB_SSL_REQUIRED = true
DB_REJECT_UNAUTHORIZED = false
CLOUDINARY_CLOUD_NAME = M.H Geronimo
CLOUDINARY_API_KEY = 781461585124195
CLOUDINARY_API_SECRET = 2NH60U6uL50GA2gf25bf37w4yIE
CORS_ORIGIN = https://prototipo-quxa.onrender.com,http://localhost:5173
FRONTEND_URL = http://localhost:5173
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_SECURE = false
EMAIL_USER = lafuentedelpeluquero@gmail.com
EMAIL_PASS = iigutoyfzhesjjfe
EMAIL_FROM = "La fuente del peluquero" <lafuentedelpeluquero@gmail.com>
```

#### **Variables con Valores Aleatorios:**
```
JWT_SECRET = [GENERAR VALOR ALEATORIO]
SESSION_SECRET = [GENERAR VALOR ALEATORIO]
```

#### **Variable de Base de Datos:**
```
DATABASE_URL = [CONECTAR CON BASE DE DATOS POSTGRESQL]
```

### **4. Crear Base de Datos PostgreSQL**
- **Tipo**: PostgreSQL
- **Nombre**: `steticsoft-db`
- **Plan**: Starter
- **Database Name**: `steticsoft_api_web_movil_wqoe`
- **Database User**: `steticsoft_api_web_movil_wqoe_user`

## 🔧 **Comandos de Deploy**

### **Build Command:**
```bash
npm install && npx sequelize-cli db:migrate
```

### **Start Command:**
```bash
npm start
```

## 📊 **Verificación Post-Deploy**

### **1. Verificar Variables de Entorno**
```bash
# En los logs de Render, verificar que todas las variables estén cargadas
echo $NODE_ENV
echo $DATABASE_URL
echo $CLOUDINARY_CLOUD_NAME
```

### **2. Verificar Migraciones**
```bash
# Las migraciones se ejecutan automáticamente en el build
npx sequelize-cli db:migrate:status
```

### **3. Verificar Funcionalidad**
- ✅ API respondiendo en `/api/health`
- ✅ Subida de imágenes funcionando
- ✅ Base de datos conectada
- ✅ Email funcionando
- ✅ Autenticación JWT funcionando

## 🎯 **Características Especiales**

### **🔐 Seguridad Automática**
- `JWT_SECRET` y `SESSION_SECRET` se generan automáticamente como valores aleatorios
- SSL habilitado para la base de datos
- CORS configurado para dominios específicos

### **☁️ Cloudinary Integrado**
- Configuración completa para subida de imágenes
- Soporte para eliminación automática de imágenes huérfanas
- Almacenamiento de `public_id` para gestión eficiente

### **📧 Email Funcional**
- Configuración Gmail SMTP
- Envío de emails de recuperación de contraseña
- Templates de email personalizados

## 🚨 **Troubleshooting**

### **Error: Variable de entorno no encontrada**
```bash
# Verificar que todas las variables estén configuradas en Render
# Revisar los logs de deploy para errores de configuración
```

### **Error: Base de datos no conecta**
```bash
# Verificar DATABASE_URL
# Confirmar que la base de datos PostgreSQL esté activa
# Verificar configuración SSL
```

### **Error: Cloudinary no funciona**
```bash
# Verificar credenciales de Cloudinary
# Confirmar que las variables estén correctamente configuradas
```

## ✅ **Checklist de Deploy**

- [ ] Servicio web creado en Render
- [ ] Base de datos PostgreSQL creada
- [ ] Todas las variables de entorno configuradas
- [ ] Build command configurado con migraciones
- [ ] Start command configurado
- [ ] Health check path configurado
- [ ] Deploy ejecutado exitosamente
- [ ] API respondiendo correctamente
- [ ] Base de datos conectada
- [ ] Funcionalidades probadas

**Estado**: 🚀 **CONFIGURACIÓN COMPLETA - LISTO PARA DEPLOY**
