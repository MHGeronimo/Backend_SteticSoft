-- =================================================================================================
--        SCRIPT DE BASE DE DATOS PARA STETICSOFT - VERSIÓN CORREGIDA Y ESTABLE PARA MYSQL WORKBENCH
-- =================================================================================================
-- Se han eliminado las restricciones CHECK y se ha simplificado la sintaxis DEFAULT
-- para garantizar la máxima compatibilidad con el importador de MySQL Workbench y evitar cierres inesperados.
-- Se ha corregido el uso de CURRENT_DATE/CURDATE() por CURRENT_TIMESTAMP para asegurar la compatibilidad.
-- Se ha corregido el error de sintaxis en la declaración de FOREIGN KEY en la tabla venta.
-- =================================================================================================

CREATE DATABASE IF NOT EXISTS steticsoft_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE steticsoft_db;

-- Tabla: rol
CREATE TABLE IF NOT EXISTS rol (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    tipo_perfil VARCHAR(10) NOT NULL DEFAULT 'EMPLEADO',
    descripcion TEXT,
    estado TINYINT(1) DEFAULT 1 NOT NULL
);

-- Tabla: permisos
CREATE TABLE IF NOT EXISTS permisos (
    id_permiso INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    estado TINYINT(1) DEFAULT 1 NOT NULL
);

-- Tabla: permisos_x_rol
CREATE TABLE IF NOT EXISTS permisos_x_rol (
    id_rol INT,
    id_permiso INT,
    PRIMARY KEY (id_rol, id_permiso),
    FOREIGN KEY (id_rol) REFERENCES rol(id_rol) ON DELETE CASCADE,
    FOREIGN KEY (id_permiso) REFERENCES permisos(id_permiso) ON DELETE CASCADE
);

-- Tabla: usuario
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena TEXT NOT NULL,
    id_rol INT,
    estado TINYINT(1) DEFAULT 1 NOT NULL,
    FOREIGN KEY (id_rol) REFERENCES rol(id_rol) ON DELETE RESTRICT
);

-- Tabla: dashboard
CREATE TABLE IF NOT EXISTS dashboard (
    id_dashboard INT AUTO_INCREMENT PRIMARY KEY,
    fecha_creacion DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    nombre_dashboard VARCHAR(100)
);

-- Tabla: estado
CREATE TABLE IF NOT EXISTS estado (
    id_estado INT AUTO_INCREMENT PRIMARY KEY,
    nombre_estado VARCHAR(45) UNIQUE NOT NULL
);

-- Tabla: cliente
CREATE TABLE IF NOT EXISTS cliente (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    tipo_documento VARCHAR(50) NOT NULL,
    numero_documento VARCHAR(45) NOT NULL UNIQUE,
    fecha_nacimiento DATE NOT NULL,
    estado TINYINT(1) DEFAULT 1 NOT NULL,
    id_usuario INT UNIQUE NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE RESTRICT
);

-- Tabla: proveedor
CREATE TABLE IF NOT EXISTS proveedor (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    tipo_documento VARCHAR(50),
    numero_documento VARCHAR(45),
    nit_empresa VARCHAR(45) UNIQUE,
    telefono VARCHAR(20) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    direccion TEXT NOT NULL,
    nombre_persona_encargada VARCHAR(100),
    telefono_persona_encargada VARCHAR(20),
    email_persona_encargada VARCHAR(100),
    estado TINYINT(1) DEFAULT 1 NOT NULL,
    UNIQUE (nombre, tipo)
);

-- Tabla: categoria_producto
CREATE TABLE IF NOT EXISTS categoria_producto (
    id_categoria_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    estado TINYINT(1) DEFAULT 1 NOT NULL,
    vida_util_dias INT,
    tipo_uso VARCHAR(10) NOT NULL
);

-- Tabla: categoria_servicio
CREATE TABLE IF NOT EXISTS categoria_servicio (
    id_categoria_servicio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    estado TINYINT(1) DEFAULT 1 NOT NULL
);

-- Tabla: producto
CREATE TABLE IF NOT EXISTS producto (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    existencia INT DEFAULT 0,
    precio DECIMAL(12, 2) DEFAULT 0.00,
    stock_minimo INT DEFAULT 0,
    stock_maximo INT DEFAULT 0,
    imagen TEXT,
    vida_util_dias INT,
    tipo_uso VARCHAR(255) NOT NULL DEFAULT 'Venta Directa',
    estado TINYINT(1) DEFAULT 1 NOT NULL,
    id_categoria_producto INT,
    FOREIGN KEY (id_categoria_producto) REFERENCES categoria_producto(id_categoria_producto) ON DELETE RESTRICT
);

-- Tabla: compra
CREATE TABLE IF NOT EXISTS compra (
    id_compra INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(12, 2) DEFAULT 0.00,
    iva DECIMAL(12, 2) DEFAULT 0.00,
    id_proveedor INT,
    id_dashboard INT,
    estado TINYINT(1) DEFAULT 1 NOT NULL,
    FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor) ON DELETE RESTRICT,
    FOREIGN KEY (id_dashboard) REFERENCES dashboard(id_dashboard) ON DELETE SET NULL
);

-- Tabla: servicio
CREATE TABLE IF NOT EXISTS servicio (
    id_servicio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    precio DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    duracion_estimada_min INT,
    id_categoria_servicio INT NOT NULL,
    imagen TEXT,
    estado TINYINT(1) DEFAULT 1 NOT NULL,
    FOREIGN KEY (id_categoria_servicio) REFERENCES categoria_servicio(id_categoria_servicio) ON DELETE RESTRICT,
);

-- Tabla: venta
CREATE TABLE IF NOT EXISTS venta (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(12, 2) DEFAULT 0.00,
    iva DECIMAL(12, 2) DEFAULT 0.00,
    id_producto INT,
    id_servicio INT,
    id_cliente INT,
    id_dashboard INT,
    id_estado INT,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON DELETE RESTRICT,
    FOREIGN KEY (id_servicio) REFERENCES servicio(id_servicio) ON DELETE RESTRICT,
    FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente) ON DELETE RESTRICT,
    FOREIGN KEY (id_dashboard) REFERENCES dashboard(id_dashboard) ON DELETE SET NULL,
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado) ON DELETE RESTRICT
);

-- Tabla: novedades
CREATE TABLE IF NOT EXISTS novedades (
    id_novedad INT AUTO_INCREMENT PRIMARY KEY,
    dia_semana INT NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado TINYINT(1) DEFAULT 1 NOT NULL,
    UNIQUE (dia_semana)
);

-- Tabla: cita
CREATE TABLE IF NOT EXISTS cita (
    id_cita INT AUTO_INCREMENT PRIMARY KEY,
    id_novedad INT,
    id_cliente INT,
    id_usuario INT,
    id_estado INT,
    FOREIGN KEY (id_novedad) REFERENCES novedades(id_novedad) ON DELETE SET NULL,
    FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado) ON DELETE RESTRICT
);

-- Tabla: servicio_x_cita
CREATE TABLE IF NOT EXISTS servicio_x_cita (
    id_servicio_x_cita INT AUTO_INCREMENT PRIMARY KEY,
    id_servicio INT,
    id_cita INT,
    UNIQUE (id_servicio, id_cita),
    FOREIGN KEY (id_servicio) REFERENCES servicio(id_servicio) ON DELETE CASCADE,
    FOREIGN KEY (id_cita) REFERENCES cita(id_cita) ON DELETE CASCADE
);

-- Tabla: compra_x_producto
CREATE TABLE IF NOT EXISTS compra_x_producto (
    id_compra_x_producto INT AUTO_INCREMENT PRIMARY KEY,
    cantidad INT DEFAULT 1,
    valor_unitario DECIMAL(12, 2) DEFAULT 0.00,
    id_compra INT,
    id_producto INT,
    FOREIGN KEY (id_compra) REFERENCES compra(id_compra) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON DELETE RESTRICT
);

-- Tabla: producto_x_venta
CREATE TABLE IF NOT EXISTS producto_x_venta (
    id_producto_x_venta INT AUTO_INCREMENT PRIMARY KEY,
    cantidad INT DEFAULT 1,
    valor_unitario DECIMAL(12, 2) DEFAULT 0.00,
    id_producto INT,
    id_venta INT,
    id_dashboard INT,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON DELETE RESTRICT,
    FOREIGN KEY (id_venta) REFERENCES venta(id_venta) ON DELETE CASCADE,
    FOREIGN KEY (id_dashboard) REFERENCES dashboard(id_dashboard) ON DELETE SET NULL
);

-- Tabla: venta_x_servicio
CREATE TABLE IF NOT EXISTS venta_x_servicio (
    id_venta_x_servicio INT AUTO_INCREMENT PRIMARY KEY,
    valor_servicio DECIMAL(12, 2) DEFAULT 0.00,
    id_servicio INT,
    id_cita INT,
    id_venta INT,
    FOREIGN KEY (id_servicio) REFERENCES servicio(id_servicio) ON DELETE RESTRICT,
    FOREIGN KEY (id_cita) REFERENCES cita(id_cita) ON DELETE SET NULL,
    FOREIGN KEY (id_venta) REFERENCES venta(id_venta) ON DELETE CASCADE
);

-- Tabla: abastecimiento
CREATE TABLE IF NOT EXISTS abastecimiento (
    id_abastecimiento INT AUTO_INCREMENT PRIMARY KEY,
    cantidad INT NOT NULL,
    id_producto INT NOT NULL,
    id_usuario INT NOT NULL,
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    esta_agotado TINYINT(1) DEFAULT 0 NOT NULL,
    razon_agotamiento TEXT,
    fecha_agotamiento DATE,
    estado TINYINT(1) DEFAULT 1 NOT NULL,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON DELETE RESTRICT,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE RESTRICT
);

-- Tabla: token_recuperacion
CREATE TABLE IF NOT EXISTS token_recuperacion (
    id_token_recuperacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    token TEXT NOT NULL,
    fecha_expiracion TIMESTAMP NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    UNIQUE (token(255))
);

-- ======================================================
-- INSERCIÓN DE DATOS INICIALES
-- ======================================================

INSERT INTO rol (nombre, tipo_perfil, descripcion, estado) VALUES
('Administrador', 'NINGUNO', 'Acceso total a todos los módulos y funcionalidades del sistema.', 1),
('Empleado', 'EMPLEADO', 'Acceso a módulos operativos como ventas, citas, clientes, etc.', 1),
('Cliente', 'CLIENTE', 'Acceso limitado a sus propias citas, compras y gestión de perfil.', 1)
ON DUPLICATE KEY UPDATE
tipo_perfil = VALUES(tipo_perfil),
descripcion = VALUES(descripcion),
estado = VALUES(estado);

INSERT INTO permisos (nombre, descripcion, estado) VALUES
('MODULO_ROLES_GESTIONAR', 'Permite la gestión completa de roles del sistema.', 1),
('MODULO_ROLES_ASIGNAR_PERMISOS', 'Permite asignar y quitar permisos a los roles.', 1),
('MODULO_PERMISOS_GESTIONAR', 'Permite la gestión completa de los permisos del sistema.', 1),
('MODULO_USUARIOS_GESTIONAR', 'Permite la gestión completa de usuarios del sistema.', 1),
('MODULO_DASHBOARD_VER', 'Permite visualizar los dashboards y sus datos.', 1),
('MODULO_ESTADOS_GESTIONAR', 'Permite la gestión de los diferentes estados de la aplicación.', 1),
('MODULO_CLIENTES_GESTIONAR', 'Permite la gestión completa de la información de los clientes (Admin/Empleado).', 1),
('MODULO_CLIENTES_VER_PROPIO', 'Permite a un cliente ver y editar su propio perfil.', 1),
('MODULO_EMPLEADOS_GESTIONAR', 'Permite la gestión completa de la información de los empleados.', 1),
('MODULO_ESPECIALIDADES_GESTIONAR', 'Permite la gestión de las especialidades.', 1),
('MODULO_PROVEEDORES_GESTIONAR', 'Permite la gestión completa de la información de los proveedores.', 1),
('MODULO_CATEGORIAS_PRODUCTOS_GESTIONAR', 'Permite la gestión de las categorías de productos.', 1),
('MODULO_CATEGORias_PRODUCTOS_VER', 'Permite ver las categorías de productos (Cliente).', 1),
('MODULO_CATEGORIAS_SERVICIOS_GESTIONAR', 'Permite la gestión de las categorías de servicios.', 1),
('MODULO_CATEGORIAS_SERVICIOS_VER', 'Permite ver las categorías de servicios (Cliente).', 1),
('MODULO_PRODUCTOS_GESTIONAR', 'Permite la gestión completa de los productos del inventario.', 1),
('MODULO_PRODUCTOS_VER', 'Permite ver los productos (Cliente).', 1),
('MODULO_COMPRAS_GESTIONAR', 'Permite la gestión de las compras a proveedores.', 1),
('MODULO_VENTAS_GESTIONAR', 'Permite la gestión de las ventas a clientes (Admin/Empleado).', 1),
('MODULO_VENTAS_CREAR_PROPIA', 'Permite a un cliente crear/realizar una venta (compra).', 1),
('MODULO_VENTAS_VER_PROPIAS', 'Permite a un cliente ver sus propias ventas.', 1),
('MODULO_CITAS_GESTIONAR', 'Permite la gestión completa de las citas (Admin/Empleado).', 1),
('MODULO_CITAS_CREAR_PROPIA', 'Permite a un cliente agendar sus propias citas.', 1),
('MODULO_CITAS_VER_PROPIAS', 'Permite a un cliente ver sus propias citas.', 1),
('MODULO_CITAS_CANCELAR_PROPIA', 'Permite a un cliente cancelar sus propias citas (con antelación).', 1),
('MODULO_SERVICIOS_GESTIONAR', 'Permite la gestión completa de los servicios ofrecidos.', 1),
('MODULO_SERVICIOS_VER', 'Permite ver los servicios ofrecidos (Cliente).', 1),
('MODULO_ABASTECIMIENTOS_GESTIONAR', 'Permite la gestión del abastecimiento de productos (salida para empleados).', 1),
('MODULO_NOVEDADES_EMPLEADOS_GESTIONAR', 'Permite la gestión de novedades y horarios de empleados.', 1)
ON DUPLICATE KEY UPDATE
descripcion = VALUES(descripcion),
estado = VALUES(estado);

INSERT INTO usuario (correo, contrasena, id_rol, estado) VALUES
('mrgerito@gmail.com', '$2b$10$oJOJM36rggzZftagNM1vWOxLaW96cPBRk.DhhvSvv8gneGTzFIJhO', (SELECT id_rol FROM rol WHERE nombre = 'Administrador'), 1)
ON DUPLICATE KEY UPDATE
contrasena = VALUES(contrasena),
id_rol = VALUES(id_rol),
estado = VALUES(estado);

INSERT IGNORE INTO estado (id_estado, nombre_estado) VALUES
(1, 'En proceso'), (2, 'Pendiente'), (3, 'Completado'), (4, 'Cancelado');

INSERT IGNORE INTO permisos_x_rol (id_rol, id_permiso) SELECT (SELECT id_rol FROM rol WHERE nombre = 'Administrador'), p.id_permiso FROM permisos p WHERE p.estado = 1;
INSERT IGNORE INTO permisos_x_rol (id_rol, id_permiso) SELECT r.id_rol, p.id_permiso FROM rol r, permisos p WHERE r.nombre = 'Empleado' AND p.estado = 1 AND p.nombre IN ('MODULO_ABASTECIMIENTOS_GESTIONAR', 'MODULO_VENTAS_GESTIONAR', 'MODULO_COMPRAS_GESTIONAR', 'MODULO_CLIENTES_GESTIONAR', 'MODULO_PROVEEDORES_GESTIONAR', 'MODULO_PRODUCTOS_GESTIONAR', 'MODULO_SERVICIOS_GESTIONAR', 'MODULO_CITAS_GESTIONAR', 'MODULO_ESTADOS_GESTIONAR', 'MODULO_DASHBOARD_VER', 'MODULO_CATEGORIAS_PRODUCTOS_GESTIONAR', 'MODULO_CATEGORIAS_SERVICIOS_GESTIONAR', 'MODULO_ESPECIALIDADES_GESTIONAR');
INSERT IGNORE INTO permisos_x_rol (id_rol, id_permiso) SELECT r.id_rol, p.id_permiso FROM rol r, permisos p WHERE r.nombre = 'Cliente' AND p.estado = 1 AND p.nombre IN ('MODULO_CITAS_CREAR_PROPIA', 'MODULO_CITAS_VER_PROPIAS', 'MODULO_CITAS_CANCELAR_PROPIA', 'MODULO_VENTAS_CREAR_PROPIA', 'MODULO_VENTAS_VER_PROPIAS', 'MODULO_PRODUCTOS_VER', 'MODULO_SERVICIOS_VER', 'MODULO_CATEGORIAS_PRODUCTOS_VER', 'MODULO_CATEGORIAS_SERVICIOS_VER', 'MODULO_CLIENTES_VER_PROPIO');