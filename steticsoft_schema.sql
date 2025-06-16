-- =================================================================================================
--         SCRIPT DE BASE DE DATOS PARA STETICSOFT - DEFINICIÓN Y ESTRUCTURA (ACTUALIZADO)
-- =================================================================================================
-- Este script define la estructura completa y las relaciones para la base de datos de SteticSoft.
-- El diseño se adhiere a los siguientes principios y convenciones:
--
-- 1.   Nomenclatura de Base de Datos:
--      - Todas las tablas, columnas e índices utilizan el formato `snake_case` (ej. `id_rol`,
--        `fecha_nacimiento`) para mantener la consistencia y alinearse con las convenciones
--        estándar de PostgreSQL.
--
-- 2.   Políticas de Integridad Referencial (Claves Foráneas):
--      - Política `ON DELETE RESTRICT`: Es la política por defecto para la mayoría de las
--        relaciones. Previene la eliminación de un registro si es referenciado por otra
--        tabla, garantizando que no se pierda información histórica ni se generen datos
--        inconsistentes (ej. no se puede eliminar un cliente con ventas asociadas).
--      - Política `ON DELETE CASCADE`: Se utiliza en tablas de unión (ej. `permisos_x_rol`) o
--        en registros de detalle cuya existencia depende completamente de su registro "padre"
--        (ej. `servicio_x_cita`). Si el registro padre se elimina, sus detalles se eliminan
--        automáticamente.
--      - Política `ON DELETE SET NULL`: Se usa selectivamente cuando un registro puede
--        perder una asociación opcional sin afectar su integridad (ej. un empleado
--        asignado a un abastecimiento).
--
-- 3.   Estructura General:
--      - El esquema está organizado lógicamente en tablas de seguridad (rol, usuario, permisos),
--        tablas maestras (cliente, producto, servicio), tablas transaccionales (venta, compra, cita)
--        y tablas de detalle o unión que conectan las demás entidades.
--
-- 4.   Tipos de Datos y Restricciones:
--      - Se utilizan tipos de datos específicos (`VARCHAR`, `DECIMAL`, `TIMESTAMP WITH TIME ZONE`)
--        para asegurar la correcta representación y validación de la información a nivel de
--        base de datos. Se aplican restricciones `NOT NULL`, `UNIQUE` y `CHECK` donde es
--        necesario para mantener la calidad de los datos.
-- =================================================================================================

-- Bloque para limpieza (Opcional, útil durante el desarrollo)
-- Elimina las tablas en orden inverso de sus dependencias para evitar errores de clave foránea.
-- DROP TABLE IF EXISTS token_recuperacion CASCADE;
-- DROP TABLE IF EXISTS abastecimiento CASCADE;
-- DROP TABLE IF EXISTS venta_x_servicio CASCADE;
-- DROP TABLE IF EXISTS producto_x_venta CASCADE;
-- DROP TABLE IF EXISTS compra_x_producto CASCADE;
-- DROP TABLE IF EXISTS servicio_x_cita CASCADE;
-- DROP TABLE IF EXISTS novedades CASCADE;
-- DROP TABLE IF EXISTS empleado_especialidad CASCADE;
-- DROP TABLE IF EXISTS cita CASCADE;
-- DROP TABLE IF EXISTS venta CASCADE;
-- DROP TABLE IF EXISTS compra CASCADE;
-- DROP TABLE IF EXISTS servicio CASCADE;
-- DROP TABLE IF EXISTS producto CASCADE;
-- DROP TABLE IF EXISTS categoria_servicio CASCADE;
-- DROP TABLE IF EXISTS categoria_producto CASCADE;
-- DROP TABLE IF EXISTS proveedor CASCADE;
-- DROP TABLE IF EXISTS especialidad CASCADE;
-- DROP TABLE IF EXISTS empleado CASCADE;
-- DROP TABLE IF EXISTS cliente CASCADE;
-- DROP TABLE IF EXISTS dashboard CASCADE;
-- DROP TABLE IF EXISTS estado CASCADE;
-- DROP TABLE IF EXISTS permisos_x_rol CASCADE;
-- DROP TABLE IF EXISTS usuario CASCADE;
-- DROP TABLE IF EXISTS permisos CASCADE;
-- DROP TABLE IF EXISTS rol CASCADE;


-- ///////////////VIEJAS TABLAS/////////////////--
-- DROP TABLE IF EXISTS TokenRecuperacion CASCADE;
-- DROP TABLE IF EXISTS Abastecimiento CASCADE;
-- DROP TABLE IF EXISTS VentaXServicio CASCADE;
-- DROP TABLE IF EXISTS ProductoXVenta CASCADE;
-- DROP TABLE IF EXISTS CompraXProducto CASCADE;
-- DROP TABLE IF EXISTS ServicioXCita CASCADE;
-- DROP TABLE IF EXISTS Novedades CASCADE;
-- DROP TABLE IF EXISTS EmpleadoEspecialidad CASCADE;
-- DROP TABLE IF EXISTS Cita CASCADE;
-- DROP TABLE IF EXISTS Venta CASCADE;
-- DROP TABLE IF EXISTS Compra CASCADE;
-- DROP TABLE IF EXISTS Producto CASCADE;
-- DROP TABLE IF EXISTS Servicio CASCADE;
-- DROP TABLE IF EXISTS Categoria_servicio CASCADE;
-- DROP TABLE IF EXISTS Categoria_producto CASCADE;
-- DROP TABLE IF EXISTS Proveedor CASCADE;
-- DROP TABLE IF EXISTS Especialidad CASCADE;
-- DROP TABLE IF EXISTS Empleado CASCADE;
-- DROP TABLE IF EXISTS Cliente CASCADE;
-- DROP TABLE IF EXISTS Dashboard CASCADE;
-- DROP TABLE IF EXISTS Estado CASCADE;
-- DROP TABLE IF EXISTS PermisosXRol CASCADE;
-- DROP TABLE IF EXISTS Usuario CASCADE;
-- DROP TABLE IF EXISTS Permisos CASCADE;
-- DROP TABLE IF EXISTS Rol CASCADE;
-- ///////////////VIEJAS TABLAS/////////////////--


-- 1. Tabla: rol - Define los roles de los usuarios en el sistema.
CREATE TABLE IF NOT EXISTS rol (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    estado BOOLEAN DEFAULT TRUE NOT NULL
);

-- Datos iniciales para la tabla rol
INSERT INTO rol (nombre, descripcion, estado) VALUES
('Administrador', 'Acceso total a todos los módulos y funcionalidades del sistema.', TRUE),
('Empleado', 'Acceso a módulos operativos como ventas, citas, clientes, etc.', TRUE),
('Cliente', 'Acceso limitado a sus propias citas, compras y gestión de perfil.', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
descripcion = EXCLUDED.descripcion,
estado = EXCLUDED.estado;


-- 2. Tabla: permisos - Define las acciones específicas que se pueden realizar.
CREATE TABLE IF NOT EXISTS permisos (
    id_permiso SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    estado BOOLEAN DEFAULT TRUE NOT NULL
);

-- Datos iniciales para la tabla permisos
INSERT INTO permisos (nombre, descripcion, estado) VALUES
('MODULO_ROLES_GESTIONAR', 'Permite la gestión completa de roles del sistema.', TRUE),
('MODULO_ROLES_ASIGNAR_PERMISOS', 'Permite asignar y quitar permisos a los roles.', TRUE),
('MODULO_PERMISOS_GESTIONAR', 'Permite la gestión completa de los permisos del sistema.', TRUE),
('MODULO_USUARIOS_GESTIONAR', 'Permite la gestión completa de usuarios del sistema.', TRUE),
('MODULO_DASHBOARD_VER', 'Permite visualizar los dashboards y sus datos.', TRUE),
('MODULO_ESTADOS_GESTIONAR', 'Permite la gestión de los diferentes estados de la aplicación.', TRUE),
('MODULO_CLIENTES_GESTIONAR', 'Permite la gestión completa de la información de los clientes (Admin/Empleado).', TRUE),
('MODULO_CLIENTES_VER_PROPIO', 'Permite a un cliente ver y editar su propio perfil.', TRUE),
('MODULO_EMPLEADOS_GESTIONAR', 'Permite la gestión completa de la información de los empleados.', TRUE),
('MODULO_ESPECIALIDADES_GESTIONAR', 'Permite la gestión de las especialidades.', TRUE),
('MODULO_PROVEEDORES_GESTIONAR', 'Permite la gestión completa de la información de los proveedores.', TRUE),
('MODULO_CATEGORIAS_PRODUCTOS_GESTIONAR', 'Permite la gestión de las categorías de productos.', TRUE),
('MODULO_CATEGORias_PRODUCTOS_VER', 'Permite ver las categorías de productos (Cliente).', TRUE),
('MODULO_CATEGORIAS_SERVICIOS_GESTIONAR', 'Permite la gestión de las categorías de servicios.', TRUE),
('MODULO_CATEGORIAS_SERVICIOS_VER', 'Permite ver las categorías de servicios (Cliente).', TRUE),
('MODULO_PRODUCTOS_GESTIONAR', 'Permite la gestión completa de los productos del inventario.', TRUE),
('MODULO_PRODUCTOS_VER', 'Permite ver los productos (Cliente).', TRUE),
('MODULO_COMPRAS_GESTIONAR', 'Permite la gestión de las compras a proveedores.', TRUE),
('MODULO_VENTAS_GESTIONAR', 'Permite la gestión de las ventas a clientes (Admin/Empleado).', TRUE),
('MODULO_VENTAS_CREAR_PROPIA', 'Permite a un cliente crear/realizar una venta (compra).', TRUE),
('MODULO_VENTAS_VER_PROPIAS', 'Permite a un cliente ver sus propias ventas.', TRUE),
('MODULO_CITAS_GESTIONAR', 'Permite la gestión completa de las citas (Admin/Empleado).', TRUE),
('MODULO_CITAS_CREAR_PROPIA', 'Permite a un cliente agendar sus propias citas.', TRUE),
('MODULO_CITAS_VER_PROPIAS', 'Permite a un cliente ver sus propias citas.', TRUE),
('MODULO_CITAS_CANCELAR_PROPIA', 'Permite a un cliente cancelar sus propias citas (con antelación).', TRUE),
('MODULO_SERVICIOS_GESTIONAR', 'Permite la gestión completa de los servicios ofrecidos.', TRUE),
('MODULO_SERVICIOS_VER', 'Permite ver los servicios ofrecidos (Cliente).', TRUE),
('MODULO_ABASTECIMIENTOS_GESTIONAR', 'Permite la gestión del abastecimiento de productos (salida para empleados).', TRUE),
('MODULO_NOVEDADES_EMPLEADOS_GESTIONAR', 'Permite la gestión de novedades y horarios de empleados.', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
descripcion = EXCLUDED.descripcion,
estado = EXCLUDED.estado;


-- 3. Tabla: permisos_x_rol - Asigna permisos a los roles (Muchos a Muchos).
CREATE TABLE IF NOT EXISTS permisos_x_rol (
    id_rol INT REFERENCES rol(id_rol) ON DELETE CASCADE,
    id_permiso INT REFERENCES permisos(id_permiso) ON DELETE CASCADE,
    PRIMARY KEY (id_rol, id_permiso)
);

-- Asignación inicial de permisos
INSERT INTO permisos_x_rol (id_rol, id_permiso) SELECT (SELECT id_rol FROM rol WHERE nombre = 'Administrador'), p.id_permiso FROM permisos p WHERE p.estado = TRUE ON CONFLICT (id_rol, id_permiso) DO NOTHING;
INSERT INTO permisos_x_rol (id_rol, id_permiso) SELECT r.id_rol, p.id_permiso FROM rol r, permisos p WHERE r.nombre = 'Empleado' AND p.estado = TRUE AND p.nombre IN ('MODULO_ABASTECIMIENTOS_GESTIONAR', 'MODULO_VENTAS_GESTIONAR', 'MODULO_COMPRAS_GESTIONAR', 'MODULO_CLIENTES_GESTIONAR', 'MODULO_PROVEEDORES_GESTIONAR', 'MODULO_PRODUCTOS_GESTIONAR', 'MODULO_SERVICIOS_GESTIONAR', 'MODULO_CITAS_GESTIONAR', 'MODULO_ESTADOS_GESTIONAR', 'MODULO_DASHBOARD_VER', 'MODULO_CATEGORIAS_PRODUCTOS_GESTIONAR', 'MODULO_CATEGORIAS_SERVICIOS_GESTIONAR', 'MODULO_ESPECIALIDADES_GESTIONAR') ON CONFLICT (id_rol, id_permiso) DO NOTHING;
INSERT INTO permisos_x_rol (id_rol, id_permiso) SELECT r.id_rol, p.id_permiso FROM rol r, permisos p WHERE r.nombre = 'Cliente' AND p.estado = TRUE AND p.nombre IN ('MODULO_CITAS_CREAR_PROPIA', 'MODULO_CITAS_VER_PROPIAS', 'MODULO_CITAS_CANCELAR_PROPIA', 'MODULO_VENTAS_CREAR_PROPIA', 'MODULO_VENTAS_VER_PROPIAS', 'MODULO_PRODUCTOS_VER', 'MODULO_SERVICIOS_VER', 'MODULO_CATEGORIAS_PRODUCTOS_VER', 'MODULO_CATEGORIAS_SERVICIOS_VER', 'MODULO_CLIENTES_VER_PROPIO') ON CONFLICT (id_rol, id_permiso) DO NOTHING;


-- 4. Tabla: usuario - Almacena las credenciales de acceso.
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena TEXT NOT NULL,
    id_rol INT REFERENCES rol(id_rol) ON DELETE RESTRICT,
    estado BOOLEAN DEFAULT TRUE NOT NULL
);

-- Usuario administrador por defecto
INSERT INTO usuario (correo, contrasena, id_rol, estado) VALUES
('mrgerito@gmail.com', '$2b$10$oJOJM36rGGzZftagNM1vWOxLaW96cPBRk.DhhvSvv8gneGTzFIJhO', (SELECT id_rol FROM rol WHERE nombre = 'Administrador'), TRUE)
ON CONFLICT (correo) DO UPDATE SET
contrasena = EXCLUDED.contrasena,
id_rol = EXCLUDED.id_rol,
estado = EXCLUDED.estado;


-- 5. Tabla: dashboard - Para agrupar datos de reportes.
CREATE TABLE IF NOT EXISTS dashboard (
    id_dashboard SERIAL PRIMARY KEY,
    fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
    nombre_dashboard VARCHAR(100)
);


-- 6. Tabla: estado - Define los posibles estados para citas y ventas.
CREATE TABLE IF NOT EXISTS estado (
    id_estado SERIAL PRIMARY KEY,
    nombre_estado VARCHAR(45) UNIQUE NOT NULL
);

INSERT INTO estado (id_estado, nombre_estado) VALUES
(1, 'En proceso'), (2, 'Pendiente'), (3, 'Completado'), (4, 'Cancelado')
ON CONFLICT (id_estado) DO UPDATE SET nombre_estado = EXCLUDED.nombre_estado;


-- 7. Tabla: cliente - Perfil de información para los clientes.
CREATE TABLE IF NOT EXISTS cliente (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    tipo_documento VARCHAR(50) NOT NULL,
    numero_documento VARCHAR(45) NOT NULL UNIQUE,
    fecha_nacimiento DATE NOT NULL,
    estado BOOLEAN DEFAULT TRUE NOT NULL,
    id_usuario INT UNIQUE NOT NULL REFERENCES usuario(id_usuario) ON DELETE RESTRICT
);


-- 8. Tabla: empleado - Perfil de información para los empleados.
-- Se ha modificado para que sus campos coincidan con la tabla 'cliente'.
CREATE TABLE IF NOT EXISTS empleado (
    id_empleado SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL, -- Nuevo campo
    correo VARCHAR(100) UNIQUE NOT NULL, -- Nuevo campo y único
    telefono VARCHAR(20) NOT NULL, -- Nuevo campo (reemplaza a 'celular')
    tipo_documento VARCHAR(50) NOT NULL,
    numero_documento VARCHAR(45) NOT NULL UNIQUE,
    fecha_nacimiento DATE NOT NULL,
    estado BOOLEAN DEFAULT TRUE NOT NULL,
    id_usuario INT UNIQUE NOT NULL REFERENCES usuario(id_usuario) ON DELETE RESTRICT
);


-- 8.1. Tabla: especialidad - Especialidades que pueden tener los empleados.
CREATE TABLE IF NOT EXISTS especialidad (
    id_especialidad SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    estado BOOLEAN DEFAULT TRUE NOT NULL
);


-- 8.2. Tabla: empleado_especialidad - Asigna especialidades a empleados.
CREATE TABLE IF NOT EXISTS empleado_especialidad (
    id_empleado INT REFERENCES empleado(id_empleado) ON DELETE CASCADE,
    id_especialidad INT REFERENCES especialidad(id_especialidad) ON DELETE CASCADE,
    PRIMARY KEY (id_empleado, id_especialidad)
);


-- 9. Tabla: proveedor - Información de los proveedores de productos.
CREATE TABLE IF NOT EXISTS proveedor (
    id_proveedor SERIAL PRIMARY KEY,
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
    estado BOOLEAN DEFAULT TRUE NOT NULL,
    UNIQUE (nombre, tipo)
);


-- 10. Tabla: categoria_producto - Clasificación de los productos.
CREATE TABLE IF NOT EXISTS categoria_producto (
    id_categoria_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    estado BOOLEAN DEFAULT TRUE NOT NULL,
    vida_util_dias INT,
    tipo_uso VARCHAR(10) NOT NULL CHECK (tipo_uso IN ('Interno', 'Externo'))
);


-- 11. Tabla: categoria_servicio - Clasificación de los servicios.
CREATE TABLE IF NOT EXISTS categoria_servicio (
    id_categoria_servicio SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    estado BOOLEAN DEFAULT TRUE NOT NULL
);


-- 12. Tabla: producto - Catálogo de productos para la venta y uso.
CREATE TABLE IF NOT EXISTS producto (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    existencia INT DEFAULT 0 CHECK (existencia >= 0),
    precio DECIMAL(12, 2) DEFAULT 0.00,
    stock_minimo INT DEFAULT 0,
    stock_maximo INT DEFAULT 0,
    imagen TEXT,
    estado BOOLEAN DEFAULT TRUE NOT NULL,
    id_categoria_producto INT REFERENCES categoria_producto(id_categoria_producto) ON DELETE RESTRICT
);


-- 13. Tabla: compra - Registro de compras a proveedores.
CREATE TABLE IF NOT EXISTS compra (
    id_compra SERIAL PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE,
    total DECIMAL(12, 2) DEFAULT 0.00,
    iva DECIMAL(12, 2) DEFAULT 0.00,
    id_proveedor INT REFERENCES proveedor(id_proveedor) ON DELETE RESTRICT,
    id_dashboard INT REFERENCES dashboard(id_dashboard) ON DELETE SET NULL,
    estado BOOLEAN DEFAULT TRUE NOT NULL
);


-- 14. Tabla: venta - Registro de ventas a clientes.
CREATE TABLE IF NOT EXISTS venta (
    id_venta SERIAL PRIMARY KEY,
    estado BOOLEAN DEFAULT TRUE NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    total DECIMAL(12, 2) DEFAULT 0.00,
    iva DECIMAL(12, 2) DEFAULT 0.00,
    id_cliente INT REFERENCES cliente(id_cliente) ON DELETE RESTRICT,
    id_dashboard INT REFERENCES dashboard(id_dashboard) ON DELETE SET NULL,
    id_estado INT REFERENCES estado(id_estado) ON DELETE RESTRICT
);


-- 15. Tabla: cita - Agendamiento de servicios con clientes y empleados.
CREATE TABLE IF NOT EXISTS cita (
    id_cita SERIAL PRIMARY KEY,
    estado BOOLEAN DEFAULT TRUE NOT NULL,
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    id_cliente INT REFERENCES cliente(id_cliente) ON DELETE CASCADE,
    id_empleado INT REFERENCES empleado(id_empleado) ON DELETE SET NULL,
    id_estado INT REFERENCES estado(id_estado) ON DELETE RESTRICT
);


-- 16. Tabla: servicio - Catálogo de servicios ofrecidos.
CREATE TABLE IF NOT EXISTS servicio (
    id_servicio SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    precio DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    duracion_estimada_min INT,
    id_categoria_servicio INT NOT NULL REFERENCES categoria_servicio(id_categoria_servicio) ON DELETE RESTRICT,
    id_especialidad INT REFERENCES especialidad(id_especialidad) ON DELETE RESTRICT,
    imagen TEXT, -- Nueva columna para la imagen del servicio
    estado BOOLEAN DEFAULT TRUE NOT NULL
);


-- 17. Tabla: servicio_x_cita - Asocia servicios a una cita.
CREATE TABLE IF NOT EXISTS servicio_x_cita (
    id_servicio_x_cita SERIAL PRIMARY KEY,
    id_servicio INT REFERENCES servicio(id_servicio) ON DELETE CASCADE,
    id_cita INT REFERENCES cita(id_cita) ON DELETE CASCADE,
    UNIQUE (id_servicio, id_cita)
);


-- 18. Tabla: compra_x_producto - Detalle de productos en una compra.
CREATE TABLE IF NOT EXISTS compra_x_producto (
    id_compra_x_producto SERIAL PRIMARY KEY,
    cantidad INT DEFAULT 1,
    valor_unitario DECIMAL(12, 2) DEFAULT 0.00,
    id_compra INT REFERENCES compra(id_compra) ON DELETE CASCADE,
    id_producto INT REFERENCES producto(id_producto) ON DELETE RESTRICT
);


-- 19. Tabla: producto_x_venta - Detalle de productos en una venta.
CREATE TABLE IF NOT EXISTS producto_x_venta (
    id_producto_x_venta SERIAL PRIMARY KEY,
    cantidad INT DEFAULT 1,
    valor_unitario DECIMAL(12, 2) DEFAULT 0.00,
    id_producto INT REFERENCES producto(id_producto) ON DELETE RESTRICT,
    id_venta INT REFERENCES venta(id_venta) ON DELETE CASCADE,
    id_dashboard INT REFERENCES dashboard(id_dashboard) ON DELETE SET NULL
);


-- 20. Tabla: venta_x_servicio - Detalle de servicios en una venta.
CREATE TABLE IF NOT EXISTS venta_x_servicio (
    id_venta_x_servicio SERIAL PRIMARY KEY,
    valor_servicio DECIMAL(12, 2) DEFAULT 0.00,
    id_servicio INT REFERENCES servicio(id_servicio) ON DELETE RESTRICT,
    id_cita INT REFERENCES cita(id_cita) ON DELETE SET NULL,
    id_venta INT REFERENCES venta(id_venta) ON DELETE CASCADE
);


-- 21. Tabla: abastecimiento - Salida de productos para uso interno.
CREATE TABLE IF NOT EXISTS abastecimiento (
    id_abastecimiento SERIAL PRIMARY KEY,
    cantidad INT NOT NULL,
    id_producto INT NOT NULL REFERENCES producto(id_producto) ON DELETE RESTRICT,
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    id_empleado_asignado INT REFERENCES empleado(id_empleado) ON DELETE SET NULL,
    esta_agotado BOOLEAN DEFAULT FALSE NOT NULL,
    razon_agotamiento TEXT,
    fecha_agotamiento DATE,
    estado BOOLEAN DEFAULT TRUE NOT NULL
);


-- 22. Tabla: novedades - Horarios especiales o excepciones para empleados.
CREATE TABLE IF NOT EXISTS novedades (
    id_novedad SERIAL PRIMARY KEY,
    dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado BOOLEAN DEFAULT TRUE NOT NULL,
    id_empleado INT NOT NULL REFERENCES empleado(id_empleado) ON DELETE CASCADE,
    UNIQUE (id_empleado, dia_semana)
);


-- 23. Tabla: token_recuperacion - Almacena tokens para reseteo de contraseñas.
CREATE TABLE IF NOT EXISTS token_recuperacion (
    id_token_recuperacion SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    fecha_expiracion TIMESTAMP WITH TIME ZONE NOT NULL
);
