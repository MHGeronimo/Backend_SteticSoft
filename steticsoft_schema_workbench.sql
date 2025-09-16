-- =================================================================================================
-- SCRIPT DE BASE DE DATOS PARA STETICSOFT - ADAPTADO PARA MYSQL WORKBENCH
-- =================================================================================================
-- Creación de la base de datos (opcional, si no existe)
CREATE DATABASE IF NOT EXISTS steticsoft_db;
USE steticsoft_db;

-- Tabla: rol
CREATE TABLE IF NOT EXISTS rol (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    tipo_perfil ENUM('CLIENTE', 'EMPLEADO', 'NINGUNO') NOT NULL DEFAULT 'EMPLEADO',
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
    asignado_por INT,
    PRIMARY KEY (id_rol, id_permiso),
    FOREIGN KEY (id_rol) REFERENCES rol(id_rol) ON DELETE CASCADE,
    FOREIGN KEY (id_permiso) REFERENCES permisos(id_permiso) ON DELETE CASCADE,
    FOREIGN KEY (asignado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL
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

-- Tabla de Auditoría para Roles
CREATE TABLE IF NOT EXISTS historial_cambios_rol (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    id_rol INT NOT NULL,
    id_usuario_modifico INT,
    campo_modificado VARCHAR(100) NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_rol) REFERENCES rol(id_rol) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_modifico) REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

-- Tabla: dashboard
CREATE TABLE IF NOT EXISTS dashboard (
    id_dashboard INT AUTO_INCREMENT PRIMARY KEY,
    fecha_creacion DATE NOT NULL DEFAULT (CURRENT_DATE),
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
    direccion TEXT NOT NULL,
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
    UNIQUE KEY idx_nombre_tipo (nombre, tipo)
);

-- Tabla: categoria_producto
CREATE TABLE IF NOT EXISTS categoria_producto (
    id_categoria_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    estado TINYINT(1) DEFAULT 1 NOT NULL
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
    estado TINYINT(1) DEFAULT 1 NOT NULL,
    vida_util_dias INT,
    tipo_uso ENUM('Interno', 'Externo') NOT NULL,
    id_categoria_producto INT,
    CONSTRAINT chk_existencia CHECK (existencia >= 0),
    FOREIGN KEY (id_categoria_producto) REFERENCES categoria_producto(id_categoria_producto) ON DELETE RESTRICT
);

-- Tabla: compra
CREATE TABLE IF NOT EXISTS compra (
    id_compra INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE DEFAULT (CURRENT_DATE),
    total DECIMAL(12, 2) DEFAULT 0.00,
    iva DECIMAL(12, 2) DEFAULT 0.00,
    id_proveedor INT,
    id_dashboard INT,
    estado TINYINT(1) DEFAULT 1 NOT NULL,
    CONSTRAINT chk_total_compra CHECK (total >= 0.00),
    CONSTRAINT chk_iva_compra CHECK (iva >= 0.00),
    FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor) ON DELETE RESTRICT,
    FOREIGN KEY (id_dashboard) REFERENCES dashboard(id_dashboard) ON DELETE SET NULL
);

-- Tabla: venta
CREATE TABLE IF NOT EXISTS venta (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE DEFAULT (CURRENT_DATE),
    total DECIMAL(12, 2) DEFAULT 0.00,
    iva DECIMAL(12, 2) DEFAULT 0.00,
    id_cliente INT,
    id_dashboard INT,
    id_estado INT,
    FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente) ON DELETE RESTRICT,
    FOREIGN KEY (id_dashboard) REFERENCES dashboard(id_dashboard) ON DELETE SET NULL,
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado) ON DELETE RESTRICT
);

-- Tabla: novedades
CREATE TABLE IF NOT EXISTS novedades (
    id_novedad INT AUTO_INCREMENT PRIMARY KEY,
    dia_semana INT NOT NULL UNIQUE,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado TINYINT(1) DEFAULT 1 NOT NULL,
    CONSTRAINT chk_dia_semana CHECK (dia_semana BETWEEN 0 AND 6)
);

-- Tabla: cita
CREATE TABLE cita (
    id_cita SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    precio_total DECIMAL(10, 2),
    estado VARCHAR(255) NOT NULL DEFAULT 'Activa',
    id_cliente INTEGER NOT NULL REFERENCES cliente (id_cliente),
    id_usuario INTEGER REFERENCES usuario (id_usuario),
    id_novedad INTEGER NOT NULL REFERENCES novedades (id_novedad)
);


-- Tabla: servicio
CREATE TABLE IF NOT EXISTS cita (
    id_cita SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    precio_total DECIMAL(10, 2),
    id_cliente INTEGER NOT NULL REFERENCES cliente (id_cliente),
    id_usuario INTEGER REFERENCES usuario (id_usuario),
    id_estado INTEGER REFERENCES estado (id_estado) DEFAULT 5,
    id_novedad INTEGER NOT NULL REFERENCES novedades (id_novedad)
);


CREATE TABLE IF NOT EXISTS servicio_x_cita (
    id_servicio_x_cita SERIAL PRIMARY KEY,
    id_servicio INT REFERENCES servicio(id_servicio) ON DELETE CASCADE,
    id_cita INT REFERENCES cita(id_cita) ON DELETE CASCADE,
    UNIQUE (id_servicio, id_cita)
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
    fecha_ingreso DATE NOT NULL DEFAULT (CURRENT_DATE),
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
    id_usuario INT NOT NULL,
    token TEXT NOT NULL,
    fecha_expiracion DATETIME NOT NULL,
    -- No se puede agregar UNIQUE(token) directamente si es de tipo TEXT en todas las versiones de MySQL
    -- Se puede crear un índice para mejorar el rendimiento.
    INDEX(token(255)),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

-- =================================================================================================
-- DATOS INICIALES
-- =================================================================================================

-- Datos para la tabla rol
INSERT INTO rol (nombre, tipo_perfil, descripcion, estado) VALUES
('Administrador', 'NINGUNO', 'Acceso total a todos los módulos y funcionalidades del sistema.', 1),
('Empleado', 'EMPLEADO', 'Acceso a módulos operativos como ventas, citas, clientes, etc.', 1),
('Cliente', 'CLIENTE', 'Acceso limitado a sus propias citas, compras y gestión de perfil.', 1)
ON DUPLICATE KEY UPDATE
tipo_perfil = VALUES(tipo_perfil),
descripcion = VALUES(descripcion),
estado = VALUES(estado);

-- Datos para la tabla permisos
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
('MODULO_CATEGORIAS_PRODUCTOS_VER', 'Permite ver las categorías de productos (Cliente).', 1),
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

-- Datos para la tabla usuario
INSERT INTO usuario (correo, contrasena, id_rol, estado) VALUES
('mrgerito@gmail.com', '$2b$10$oJOJM36rGGzZftagNM1vWOxLaW96cPBRk.DhhvSvv8gneGTzFIJhO', (SELECT id_rol FROM rol WHERE nombre = 'Administrador'), 1)
ON DUPLICATE KEY UPDATE
contrasena = VALUES(contrasena),
id_rol = VALUES(id_rol),
estado = VALUES(estado);

-- Datos para la tabla estado
INSERT INTO estado (id_estado, nombre_estado) VALUES
(1, 'En proceso'), (2, 'Pendiente'), (3, 'Completado'), (4, 'Cancelado')
ON DUPLICATE KEY UPDATE nombre_estado = VALUES(nombre_estado);

-- Asignación inicial de permisos
INSERT IGNORE INTO permisos_x_rol (id_rol, id_permiso) SELECT (SELECT id_rol FROM rol WHERE nombre = 'Administrador'), id_permiso FROM permisos WHERE estado = 1;
INSERT IGNORE INTO permisos_x_rol (id_rol, id_permiso) SELECT (SELECT id_rol FROM rol WHERE nombre = 'Empleado'), id_permiso FROM permisos WHERE estado = 1 AND nombre IN ('MODULO_ABASTECIMIENTOS_GESTIONAR', 'MODULO_VENTAS_GESTIONAR', 'MODULO_COMPRAS_GESTIONAR', 'MODULO_CLIENTES_GESTIONAR', 'MODULO_PROVEEDORES_GESTIONAR', 'MODULO_PRODUCTOS_GESTIONAR', 'MODULO_SERVICIOS_GESTIONAR', 'MODULO_CITAS_GESTIONAR', 'MODULO_ESTADOS_GESTIONAR', 'MODULO_DASHBOARD_VER', 'MODULO_CATEGORIAS_PRODUCTOS_GESTIONAR', 'MODULO_CATEGORIAS_SERVICIOS_GESTIONAR', 'MODULO_ESPECIALIDADES_GESTIONAR');
INSERT IGNORE INTO permisos_x_rol (id_rol, id_permiso) SELECT (SELECT id_rol FROM rol WHERE nombre = 'Cliente'), id_permiso FROM permisos WHERE estado = 1 AND nombre IN ('MODULO_CITAS_CREAR_PROPIA', 'MODULO_CITAS_VER_PROPIAS', 'MODULO_CITAS_CANCELAR_PROPIA', 'MODULO_VENTAS_CREAR_PROPIA', 'MODULO_VENTAS_VER_PROPIAS', 'MODULO_PRODUCTOS_VER', 'MODULO_SERVICIOS_VER', 'MODULO_CATEGORIAS_PRODUCTOS_VER', 'MODULO_CATEGORIAS_SERVICIOS_VER', 'MODULO_CLIENTES_VER_PROPIO');
