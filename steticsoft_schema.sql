-- =================================================================================================
--         SCRIPT DE BASE DE DATOS PARA STETICSOFT - DEFINICIÓN Y ESTRUCTURA (ACTUALIZADO)
-- =================================================================================================
-- Este script define la estructura completa y las relaciones para la base de datos de SteticSoft.
-- El diseño se adhiere a los siguientes principios y convenciones:
--
-- 1.   Nomenclatura de Base de Datos:
--      - Todas las tablas, columnas e índices utilizan el formato `snake_case` (ej. `id_rol`,
--        `fecha_nacimiento`) para mantener la consistencia y alinearse con las convenciones
--        estándar de PostgreSQL.
--
-- 2.   Políticas de Integridad Referencial (Claves Foráneas):
--      - Política `ON DELETE RESTRICT`: Es la política por defecto para la mayoría de las
--        relaciones. Previene la eliminación de un registro si es referenciado por otra
--        tabla, garantizando que no se pierda información histórica ni se generen datos
--        inconsistentes (ej. no se puede eliminar un cliente con ventas asociadas).
--      - Política `ON DELETE CASCADE`: Se utiliza en tablas de unión (ej. `permisos_x_rol`) o
--        en registros de detalle cuya existencia depende completamente de su registro "padre"
--        (ej. `servicio_x_cita`). Si el registro padre se elimina, sus detalles se eliminan
--        automáticamente.
--      - Política `ON DELETE SET NULL`: Se usa selectivamente cuando un registro puede
--        perder una asociación opcional sin afectar su integridad (ej. un empleado
--        asignado a un abastecimiento).
--
-- 3.   Estructura General:
--      - El esquema está organizado lógicamente en tablas de seguridad (rol, usuario, permisos),
--        tablas maestras (cliente, producto, servicio), tablas transaccionales (venta, compra, cita)
--        y tablas de detalle o unión que conectan las demás entidades.
--
-- 4.   Tipos de Datos y Restricciones:
--      - Se utilizan tipos de datos específicos (`VARCHAR`, `DECIMAL`, `TIMESTAMP WITH TIME ZONE`)
--        para asegurar la correcta representación y validación de la información a nivel de
--        base de datos. Se aplican restricciones `NOT NULL`, `UNIQUE` y `CHECK` donde es
--        necesario para mantener la calidad de los datos.
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


-- Tabla: rol
-- Propósito: Define los tipos de usuarios que pueden existir en el sistema (ej. Administrador, Empleado, Cliente).
-- Proceso: Cada 'usuario' debe tener un 'rol' asignado. Los permisos asociados a este rol determinarán
-- qué acciones puede realizar el usuario en la aplicación.
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


-- Tabla: permisos
-- Propósito: Contiene una lista de todas las acciones individuales que se pueden realizar en el sistema.
-- Cada permiso es una "llave" para una funcionalidad específica (ej. 'MODULO_USUARIOS_GESTIONAR').
-- Proceso: Estos permisos son asignados a los roles a través de la tabla `permisos_x_rol`.
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


-- Tabla: permisos_x_rol
-- Propósito: Es una tabla de unión (o pivote) que conecta Roles y Permisos. Define qué permisos tiene cada rol.
-- Proceso: Cuando un usuario intenta acceder a una ruta protegida de la API, el backend verifica en esta tabla
-- si el 'rol' del usuario tiene el 'permiso' requerido para esa acción. Es el núcleo del sistema de autorización.
CREATE TABLE IF NOT EXISTS permisos_x_rol (
    id_rol INT REFERENCES rol(id_rol) ON DELETE CASCADE,
    id_permiso INT REFERENCES permisos(id_permiso) ON DELETE CASCADE,
    PRIMARY KEY (id_rol, id_permiso)
);

-- Asignación inicial de permisos
INSERT INTO permisos_x_rol (id_rol, id_permiso) SELECT (SELECT id_rol FROM rol WHERE nombre = 'Administrador'), p.id_permiso FROM permisos p WHERE p.estado = TRUE ON CONFLICT (id_rol, id_permiso) DO NOTHING;
INSERT INTO permisos_x_rol (id_rol, id_permiso) SELECT r.id_rol, p.id_permiso FROM rol r, permisos p WHERE r.nombre = 'Empleado' AND p.estado = TRUE AND p.nombre IN ('MODULO_ABASTECIMIENTOS_GESTIONAR', 'MODULO_VENTAS_GESTIONAR', 'MODULO_COMPRAS_GESTIONAR', 'MODULO_CLIENTES_GESTIONAR', 'MODULO_PROVEEDORES_GESTIONAR', 'MODULO_PRODUCTOS_GESTIONAR', 'MODULO_SERVICIOS_GESTIONAR', 'MODULO_CITAS_GESTIONAR', 'MODULO_ESTADOS_GESTIONAR', 'MODULO_DASHBOARD_VER', 'MODULO_CATEGORIAS_PRODUCTOS_GESTIONAR', 'MODULO_CATEGORIAS_SERVICIOS_GESTIONAR', 'MODULO_ESPECIALIDADES_GESTIONAR') ON CONFLICT (id_rol, id_permiso) DO NOTHING;
INSERT INTO permisos_x_rol (id_rol, id_permiso) SELECT r.id_rol, p.id_permiso FROM rol r, permisos p WHERE r.nombre = 'Cliente' AND p.estado = TRUE AND p.nombre IN ('MODULO_CITAS_CREAR_PROPIA', 'MODULO_CITAS_VER_PROPIAS', 'MODULO_CITAS_CANCELAR_PROPIA', 'MODULO_VENTAS_CREAR_PROPIA', 'MODULO_VENTAS_VER_PROPIAS', 'MODULO_PRODUCTOS_VER', 'MODULO_SERVICIOS_VER', 'MODULO_CATEGORIAS_PRODUCTOS_VER', 'MODULO_CATEGORIAS_SERVICIOS_VER', 'MODULO_CLIENTES_VER_PROPIO') ON CONFLICT (id_rol, id_permiso) DO NOTHING;


-- Tabla: usuario
-- Propósito: Almacena las credenciales de acceso (correo y contraseña) de todas las entidades que pueden
-- iniciar sesión en el sistema (Administradores, Empleados y Clientes).
-- Proceso: Durante el login, el sistema busca un registro aquí. Cada usuario está obligatoriamente
-- enlazado a un 'rol' (a través de `id_rol`) que define su nivel de acceso.
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


-- Tabla: dashboard
-- Propósito: Tabla potencialmente utilizada para agrupar datos de transacciones (ventas, compras)
-- con el fin de generar reportes o visualizaciones en el módulo de Dashboard. Su uso exacto
-- se define en la lógica de negocio del backend.
CREATE TABLE IF NOT EXISTS dashboard (
    id_dashboard SERIAL PRIMARY KEY,
    fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
    nombre_dashboard VARCHAR(100)
);


-- Tabla: estado
-- Propósito: Define una lista de estados estandarizados que pueden ser usados en otras tablas.
-- Proceso: Centraliza los posibles estados (ej. "Pendiente", "Completado") para que `cita` y `venta`
-- los usen, garantizando consistencia.
CREATE TABLE IF NOT EXISTS estado (
    id_estado SERIAL PRIMARY KEY,
    nombre_estado VARCHAR(45) UNIQUE NOT NULL
);

INSERT INTO estado (id_estado, nombre_estado) VALUES
(1, 'En proceso'), (2, 'Pendiente'), (3, 'Completado'), (4, 'Cancelado')
ON CONFLICT (id_estado) DO UPDATE SET nombre_estado = EXCLUDED.nombre_estado;


-- Tabla: cliente
-- Propósito: Almacena toda la información demográfica y de contacto de los clientes.
-- Proceso: Cada cliente tiene un registro único aquí y está enlazado a un registro en la tabla 'usuario'
-- (`id_usuario`) para poder iniciar sesión. Los registros de 'venta' y 'cita' se asocian a un cliente.
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


-- Tabla: empleado
-- Propósito: Almacena la información de los empleados, similar a la de los clientes.
-- Proceso: Al igual que un cliente, cada empleado tiene un `id_usuario` para el acceso. Los empleados
-- pueden ser asignados a citas (`cita`) y abastecimientos (`abastecimiento`).
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


-- Tabla: especialidad
-- Propósito: Define las habilidades o áreas de especialización de los empleados (ej. "Manicurista", "Colorista").
CREATE TABLE IF NOT EXISTS especialidad (
    id_especialidad SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    estado BOOLEAN DEFAULT TRUE NOT NULL
);


-- Tabla: empleado_especialidad
-- Propósito: Tabla de unión que asigna una o más especialidades a cada empleado.
-- Proceso: Permite filtrar empleados por su especialidad, por ejemplo, al agendar una cita para un servicio específico.
CREATE TABLE IF NOT EXISTS empleado_especialidad (
    id_empleado INT REFERENCES empleado(id_empleado) ON DELETE CASCADE,
    id_especialidad INT REFERENCES especialidad(id_especialidad) ON DELETE CASCADE,
    PRIMARY KEY (id_empleado, id_especialidad)
);


-- Tabla: proveedor
-- Propósito: Almacena la información de contacto y fiscal de las empresas o personas que suministran productos.
-- Proceso: Cada 'compra' debe estar asociada a un 'proveedor'.
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


-- Tabla: categoria_producto
-- Propósito: Clasifica los productos en grupos (ej. "Tintes", "Cuidado Capilar"). Es una tabla crucial para la lógica de negocio.
-- Proceso: Cada 'producto' pertenece a una categoría. Esta tabla define dos reglas de negocio importantes:
-- `tipo_uso`: Determina si un producto es para 'Venta' (Externo) o para 'Abastecimiento' (Interno).
-- `vida_util_dias`: Indica el tiempo aproximado en días que un producto abastecido debería durar en manos de un empleado.
CREATE TABLE IF NOT EXISTS categoria_producto (
    id_categoria_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    estado BOOLEAN DEFAULT TRUE NOT NULL,
    vida_util_dias INT,
    tipo_uso VARCHAR(10) NOT NULL CHECK (tipo_uso IN ('Interno', 'Externo'))
);


-- Tabla: categoria_servicio
-- Propósito: Clasifica los servicios en grupos (ej. "Cortes", "Manicura").
CREATE TABLE IF NOT EXISTS categoria_servicio (
    id_categoria_servicio SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    estado BOOLEAN DEFAULT TRUE NOT NULL
);


-- Tabla: producto
-- Propósito: Es el catálogo central de todos los productos. Gestiona el inventario.
-- Proceso: Su columna más importante es `existencia` (stock). El stock AUMENTA con el módulo de 'Compra' y
-- DISMINUYE con los módulos de 'Venta' y 'Abastecimiento'. `stock_minimo` y `stock_maximo` sirven para generar alertas.
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


-- Tabla: compra
-- Propósito: Registra la cabecera de una operación de compra de productos a un 'proveedor'.
-- Proceso: Al crear una 'compra', se AUMENTA el stock de los productos detallados en `compra_x_producto`.
CREATE TABLE IF NOT EXISTS compra (
    id_compra SERIAL PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE,
    total DECIMAL(12, 2) DEFAULT 0.00,
    iva DECIMAL(12, 2) DEFAULT 0.00,
    id_proveedor INT REFERENCES proveedor(id_proveedor) ON DELETE RESTRICT,
    id_dashboard INT REFERENCES dashboard(id_dashboard) ON DELETE SET NULL,
    estado BOOLEAN DEFAULT TRUE NOT NULL
);


-- Tabla: venta
-- Propósito: Registra la cabecera de una operación de venta a un 'cliente'.
-- Proceso: Al crear una 'venta', se DISMINUYE el stock de los productos detallados en `producto_x_venta`.
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


-- Tabla: cita
-- Propósito: Registra el agendamiento de un servicio entre un 'cliente' y un 'empleado' en una fecha y hora específicas.
-- Proceso: Es el corazón del módulo de agendamiento.
CREATE TABLE IF NOT EXISTS cita (
    id_cita SERIAL PRIMARY KEY,
    estado BOOLEAN DEFAULT TRUE NOT NULL,
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    id_cliente INT REFERENCES cliente(id_cliente) ON DELETE CASCADE,
    id_empleado INT REFERENCES empleado(id_empleado) ON DELETE SET NULL,
    id_estado INT REFERENCES estado(id_estado) ON DELETE RESTRICT
);


-- Tabla: servicio
-- Propósito: Es el catálogo de todos los servicios que ofrece el negocio.
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


-- Tabla: servicio_x_cita
-- Propósito: Detalla qué servicios específicos se realizarán en una 'cita'.
CREATE TABLE IF NOT EXISTS servicio_x_cita (
    id_servicio_x_cita SERIAL PRIMARY KEY,
    id_servicio INT REFERENCES servicio(id_servicio) ON DELETE CASCADE,
    id_cita INT REFERENCES cita(id_cita) ON DELETE CASCADE,
    UNIQUE (id_servicio, id_cita)
);


-- Tabla: compra_x_producto
-- Propósito: Detalla qué productos y en qué cantidad se incluyeron en una 'compra'.
CREATE TABLE IF NOT EXISTS compra_x_producto (
    id_compra_x_producto SERIAL PRIMARY KEY,
    cantidad INT DEFAULT 1,
    valor_unitario DECIMAL(12, 2) DEFAULT 0.00,
    id_compra INT REFERENCES compra(id_compra) ON DELETE CASCADE,
    id_producto INT REFERENCES producto(id_producto) ON DELETE RESTRICT
);


-- Tabla: producto_x_venta
-- Propósito: Detalla qué productos y en qué cantidad se incluyeron en una 'venta'.
CREATE TABLE IF NOT EXISTS producto_x_venta (
    id_producto_x_venta SERIAL PRIMARY KEY,
    cantidad INT DEFAULT 1,
    valor_unitario DECIMAL(12, 2) DEFAULT 0.00,
    id_producto INT REFERENCES producto(id_producto) ON DELETE RESTRICT,
    id_venta INT REFERENCES venta(id_venta) ON DELETE CASCADE,
    id_dashboard INT REFERENCES dashboard(id_dashboard) ON DELETE SET NULL
);


-- Tabla: venta_x_servicio
-- Propósito: Detalla qué servicios se incluyeron en una 'venta' (ej. para facturación).
CREATE TABLE IF NOT EXISTS venta_x_servicio (
    id_venta_x_servicio SERIAL PRIMARY KEY,
    valor_servicio DECIMAL(12, 2) DEFAULT 0.00,
    id_servicio INT REFERENCES servicio(id_servicio) ON DELETE RESTRICT,
    id_cita INT REFERENCES cita(id_cita) ON DELETE SET NULL,
    id_venta INT REFERENCES venta(id_venta) ON DELETE CASCADE
);


-- Tabla: abastecimiento
-- Propósito: Registra la salida de productos de 'Uso Interno' que se entregan a un 'empleado' para que realice sus servicios.
-- Proceso:
-- 1. Un administrador crea un registro aquí, seleccionando un producto de `tipo_uso = 'Interno'` y un empleado.
-- 2. Al crearse, la lógica de negocio DISMINUYE el stock (`existencia`) en la tabla `producto`.
-- 3. La `vida_util_dias` de la categoría del producto sirve como indicador de cuánto debería durar este abastecimiento.
-- 4. Si el producto se agota antes, el empleado puede marcar este registro como 'agotado' (`esta_agotado` = true)
--    y registrar una razón, lo que sirve como una solicitud para un nuevo abastecimiento.
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


-- Tabla: novedades
-- Propósito: Permite definir horarios de trabajo excepcionales o diferentes al estándar para un empleado.
CREATE TABLE IF NOT EXISTS novedades (
    id_novedad SERIAL PRIMARY KEY,
    dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado BOOLEAN DEFAULT TRUE NOT NULL,
    id_empleado INT NOT NULL REFERENCES empleado(id_empleado) ON DELETE CASCADE,
    UNIQUE (id_empleado, dia_semana)
);


-- Tabla: token_recuperacion
-- Propósito: Almacena de forma temporal los tokens únicos generados para el proceso de "olvidé mi contraseña".
-- Proceso: Cuando un usuario solicita restablecer su contraseña, se genera un token, se guarda aquí con una fecha
-- de expiración y se envía al correo del usuario. El sistema valida este token antes de permitir el cambio.
CREATE TABLE IF NOT EXISTS token_recuperacion (
    id_token_recuperacion SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    fecha_expiracion TIMESTAMP WITH TIME ZONE NOT NULL
);