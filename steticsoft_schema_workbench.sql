-- =================================================================================================
--        SCRIPT DE BASE DE DATOS PARA STETICSOFT - CONVERTIDO PARA MYSQL WORKBENCH
-- =================================================================================================
-- Este script define la estructura completa y las relaciones para la base de datos de SteticSoft,
-- adaptada para ser compatible con MySQL.
-- =================================================================================================

-- Desactivar la verificación de claves foráneas temporalmente para evitar errores durante la creación.
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ======== Creación de Tablas ========

CREATE TABLE IF NOT EXISTS `rol` (
    `id_rol` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(50) NOT NULL UNIQUE,
    `tipo_perfil` VARCHAR(10) NOT NULL DEFAULT 'EMPLEADO', -- CHECK (`tipo_perfil` IN ('CLIENTE', 'EMPLEADO', 'NINGUNO')),
    `descripcion` TEXT,
    `estado` TINYINT(1) DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS `permisos` (
    `id_permiso` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(100) NOT NULL UNIQUE,
    `descripcion` TEXT,
    `estado` TINYINT(1) DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS `usuario` (
    `id_usuario` INT AUTO_INCREMENT PRIMARY KEY,
    `correo` VARCHAR(100) NOT NULL UNIQUE,
    `contrasena` TEXT NOT NULL,
    `id_rol` INT,
    `estado` TINYINT(1) DEFAULT 1 NOT NULL,
    INDEX `fk_usuario_rol_idx` (`id_rol` ASC),
    CONSTRAINT `fk_usuario_rol`
        FOREIGN KEY (`id_rol`)
        REFERENCES `rol` (`id_rol`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `permisos_x_rol` (
    `id_rol` INT NOT NULL,
    `id_permiso` INT NOT NULL,
    PRIMARY KEY (`id_rol`, `id_permiso`),
    INDEX `fk_pxr_rol_idx` (`id_rol` ASC),
    INDEX `fk_pxr_permiso_idx` (`id_permiso` ASC),
    CONSTRAINT `fk_pxr_rol`
        FOREIGN KEY (`id_rol`)
        REFERENCES `rol` (`id_rol`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_pxr_permiso`
        FOREIGN KEY (`id_permiso`)
        REFERENCES `permisos` (`id_permiso`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `dashboard` (
    `id_dashboard` INT AUTO_INCREMENT PRIMARY KEY,
    `fecha_creacion` DATE NOT NULL DEFAULT (CURDATE()),
    `nombre_dashboard` VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS `estado` (
    `id_estado` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre_estado` VARCHAR(45) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS `cliente` (
    `id_cliente` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(100) NOT NULL,
    `apellido` VARCHAR(100) NOT NULL,
    `correo` VARCHAR(100) UNIQUE NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `tipo_documento` VARCHAR(50) NOT NULL,
    `numero_documento` VARCHAR(45) NOT NULL UNIQUE,
    `fecha_nacimiento` DATE NOT NULL,
    `estado` TINYINT(1) DEFAULT 1 NOT NULL,
    `id_usuario` INT UNIQUE NOT NULL,
    INDEX `fk_cliente_usuario_idx` (`id_usuario` ASC),
    CONSTRAINT `fk_cliente_usuario`
        FOREIGN KEY (`id_usuario`)
        REFERENCES `usuario` (`id_usuario`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `empleado` (
    `id_empleado` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(100) NOT NULL,
    `apellido` VARCHAR(100) NOT NULL,
    `correo` VARCHAR(100) UNIQUE NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `tipo_documento` VARCHAR(50) NOT NULL,
    `numero_documento` VARCHAR(45) NOT NULL UNIQUE,
    `fecha_nacimiento` DATE NOT NULL,
    `estado` TINYINT(1) DEFAULT 1 NOT NULL,
    `id_usuario` INT UNIQUE NOT NULL,
    INDEX `fk_empleado_usuario_idx` (`id_usuario` ASC),
    CONSTRAINT `fk_empleado_usuario`
        FOREIGN KEY (`id_usuario`)
        REFERENCES `usuario` (`id_usuario`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `especialidad` (
    `id_especialidad` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(100) NOT NULL UNIQUE,
    `descripcion` TEXT,
    `estado` TINYINT(1) DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS `empleado_especialidad` (
    `id_empleado` INT NOT NULL,
    `id_especialidad` INT NOT NULL,
    PRIMARY KEY (`id_empleado`, `id_especialidad`),
    INDEX `fk_ee_empleado_idx` (`id_empleado` ASC),
    INDEX `fk_ee_especialidad_idx` (`id_especialidad` ASC),
    CONSTRAINT `fk_ee_empleado`
        FOREIGN KEY (`id_empleado`)
        REFERENCES `empleado` (`id_empleado`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_ee_especialidad`
        FOREIGN KEY (`id_especialidad`)
        REFERENCES `especialidad` (`id_especialidad`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `proveedor` (
    `id_proveedor` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(100) NOT NULL,
    `tipo` VARCHAR(50) NOT NULL,
    `tipo_documento` VARCHAR(50),
    `numero_documento` VARCHAR(45),
    `nit_empresa` VARCHAR(45) UNIQUE,
    `telefono` VARCHAR(20) NOT NULL,
    `correo` VARCHAR(100) NOT NULL UNIQUE,
    `direccion` TEXT NOT NULL,
    `nombre_persona_encargada` VARCHAR(100),
    `telefono_persona_encargada` VARCHAR(20),
    `email_persona_encargada` VARCHAR(100),
    `estado` TINYINT(1) DEFAULT 1 NOT NULL,
    UNIQUE KEY `unique_nombre_tipo` (`nombre`, `tipo`)
);

CREATE TABLE IF NOT EXISTS `categoria_producto` (
    `id_categoria_producto` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(100) UNIQUE NOT NULL,
    `descripcion` TEXT,
    `estado` TINYINT(1) DEFAULT 1 NOT NULL,
    `vida_util_dias` INT,
    `tipo_uso` VARCHAR(10) NOT NULL -- CHECK (`tipo_uso` IN ('Interno', 'Externo'))
);

CREATE TABLE IF NOT EXISTS `categoria_servicio` (
    `id_categoria_servicio` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(100) UNIQUE NOT NULL,
    `descripcion` TEXT,
    `estado` TINYINT(1) DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS `producto` (
    `id_producto` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` TEXT,
    `existencia` INT DEFAULT 0, -- CHECK (`existencia` >= 0),
    `precio` DECIMAL(12, 2) DEFAULT 0.00,
    `stock_minimo` INT DEFAULT 0,
    `stock_maximo` INT DEFAULT 0,
    `imagen` TEXT,
    `vida_util_dias` INT,
    `tipo_uso` VARCHAR(255) NOT NULL DEFAULT 'Venta Directa',
    `estado` TINYINT(1) DEFAULT 1 NOT NULL,
    `id_categoria_producto` INT,
    INDEX `fk_producto_catprod_idx` (`id_categoria_producto` ASC),
    CONSTRAINT `fk_producto_catprod`
        FOREIGN KEY (`id_categoria_producto`)
        REFERENCES `categoria_producto` (`id_categoria_producto`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `compra` (
    `id_compra` INT AUTO_INCREMENT PRIMARY KEY,
    `fecha` DATE DEFAULT (CURDATE()),
    `total` DECIMAL(12, 2) DEFAULT 0.00,
    `iva` DECIMAL(12, 2) DEFAULT 0.00,
    `id_proveedor` INT,
    `id_dashboard` INT,
    `estado` TINYINT(1) DEFAULT 1 NOT NULL,
    INDEX `fk_compra_proveedor_idx` (`id_proveedor` ASC),
    INDEX `fk_compra_dashboard_idx` (`id_dashboard` ASC),
    CONSTRAINT `fk_compra_proveedor`
        FOREIGN KEY (`id_proveedor`)
        REFERENCES `proveedor` (`id_proveedor`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT `fk_compra_dashboard`
        FOREIGN KEY (`id_dashboard`)
        REFERENCES `dashboard` (`id_dashboard`)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `venta` (
    `id_venta` INT AUTO_INCREMENT PRIMARY KEY,
    `estado` TINYINT(1) DEFAULT 1 NOT NULL,
    `fecha` DATE DEFAULT (CURDATE()),
    `total` DECIMAL(12, 2) DEFAULT 0.00,
    `iva` DECIMAL(12, 2) DEFAULT 0.00,
    `id_cliente` INT,
    `id_dashboard` INT,
    `id_estado` INT,
    INDEX `fk_venta_cliente_idx` (`id_cliente` ASC),
    INDEX `fk_venta_dashboard_idx` (`id_dashboard` ASC),
    INDEX `fk_venta_estado_idx` (`id_estado` ASC),
    CONSTRAINT `fk_venta_cliente`
        FOREIGN KEY (`id_cliente`)
        REFERENCES `cliente` (`id_cliente`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT `fk_venta_dashboard`
        FOREIGN KEY (`id_dashboard`)
        REFERENCES `dashboard` (`id_dashboard`)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT `fk_venta_estado`
        FOREIGN KEY (`id_estado`)
        REFERENCES `estado` (`id_estado`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `cita` (
    `id_cita` INT AUTO_INCREMENT PRIMARY KEY,
    `estado` TINYINT(1) DEFAULT 1 NOT NULL,
    `fecha_hora` DATETIME NOT NULL,
    `id_cliente` INT,
    `id_empleado` INT,
    `id_estado` INT,
    INDEX `fk_cita_cliente_idx` (`id_cliente` ASC),
    INDEX `fk_cita_empleado_idx` (`id_empleado` ASC),
    INDEX `fk_cita_estado_idx` (`id_estado` ASC),
    CONSTRAINT `fk_cita_cliente`
        FOREIGN KEY (`id_cliente`)
        REFERENCES `cliente` (`id_cliente`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_cita_empleado`
        FOREIGN KEY (`id_empleado`)
        REFERENCES `empleado` (`id_empleado`)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT `fk_cita_estado`
        FOREIGN KEY (`id_estado`)
        REFERENCES `estado` (`id_estado`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `servicio` (
    `id_servicio` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(100) NOT NULL UNIQUE,
    `descripcion` TEXT,
    `precio` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `duracion_estimada_min` INT,
    `id_categoria_servicio` INT NOT NULL,
    `id_especialidad` INT,
    `imagen` TEXT,
    `estado` TINYINT(1) DEFAULT 1 NOT NULL,
    INDEX `fk_servicio_catserv_idx` (`id_categoria_servicio` ASC),
    INDEX `fk_servicio_especialidad_idx` (`id_especialidad` ASC),
    CONSTRAINT `fk_servicio_catserv`
        FOREIGN KEY (`id_categoria_servicio`)
        REFERENCES `categoria_servicio` (`id_categoria_servicio`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT `fk_servicio_especialidad`
        FOREIGN KEY (`id_especialidad`)
        REFERENCES `especialidad` (`id_especialidad`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `servicio_x_cita` (
    `id_servicio_x_cita` INT AUTO_INCREMENT PRIMARY KEY,
    `id_servicio` INT,
    `id_cita` INT,
    UNIQUE KEY `unique_servicio_cita` (`id_servicio`, `id_cita`),
    INDEX `fk_sxc_servicio_idx` (`id_servicio` ASC),
    INDEX `fk_sxc_cita_idx` (`id_cita` ASC),
    CONSTRAINT `fk_sxc_servicio`
        FOREIGN KEY (`id_servicio`)
        REFERENCES `servicio` (`id_servicio`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_sxc_cita`
        FOREIGN KEY (`id_cita`)
        REFERENCES `cita` (`id_cita`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `compra_x_producto` (
    `id_compra_x_producto` INT AUTO_INCREMENT PRIMARY KEY,
    `cantidad` INT DEFAULT 1,
    `valor_unitario` DECIMAL(12, 2) DEFAULT 0.00,
    `id_compra` INT,
    `id_producto` INT,
    INDEX `fk_cxp_compra_idx` (`id_compra` ASC),
    INDEX `fk_cxp_producto_idx` (`id_producto` ASC),
    CONSTRAINT `fk_cxp_compra`
        FOREIGN KEY (`id_compra`)
        REFERENCES `compra` (`id_compra`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_cxp_producto`
        FOREIGN KEY (`id_producto`)
        REFERENCES `producto` (`id_producto`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `producto_x_venta` (
    `id_producto_x_venta` INT AUTO_INCREMENT PRIMARY KEY,
    `cantidad` INT DEFAULT 1,
    `valor_unitario` DECIMAL(12, 2) DEFAULT 0.00,
    `id_producto` INT,
    `id_venta` INT,
    `id_dashboard` INT,
    INDEX `fk_pxv_producto_idx` (`id_producto` ASC),
    INDEX `fk_pxv_venta_idx` (`id_venta` ASC),
    INDEX `fk_pxv_dashboard_idx` (`id_dashboard` ASC),
    CONSTRAINT `fk_pxv_producto`
        FOREIGN KEY (`id_producto`)
        REFERENCES `producto` (`id_producto`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT `fk_pxv_venta`
        FOREIGN KEY (`id_venta`)
        REFERENCES `venta` (`id_venta`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_pxv_dashboard`
        FOREIGN KEY (`id_dashboard`)
        REFERENCES `dashboard` (`id_dashboard`)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `venta_x_servicio` (
    `id_venta_x_servicio` INT AUTO_INCREMENT PRIMARY KEY,
    `valor_servicio` DECIMAL(12, 2) DEFAULT 0.00,
    `id_servicio` INT,
    `id_cita` INT,
    `id_venta` INT,
    INDEX `fk_vxs_servicio_idx` (`id_servicio` ASC),
    INDEX `fk_vxs_cita_idx` (`id_cita` ASC),
    INDEX `fk_vxs_venta_idx` (`id_venta` ASC),
    CONSTRAINT `fk_vxs_servicio`
        FOREIGN KEY (`id_servicio`)
        REFERENCES `servicio` (`id_servicio`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT `fk_vxs_cita`
        FOREIGN KEY (`id_cita`)
        REFERENCES `cita` (`id_cita`)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT `fk_vxs_venta`
        FOREIGN KEY (`id_venta`)
        REFERENCES `venta` (`id_venta`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `abastecimiento` (
    `id_abastecimiento` INT AUTO_INCREMENT PRIMARY KEY,
    `cantidad` INT NOT NULL,
    `id_producto` INT NOT NULL,
    `fecha_ingreso` DATE NOT NULL DEFAULT (CURDATE()),
    `id_empleado_asignado` INT,
    `esta_agotado` TINYINT(1) DEFAULT 0 NOT NULL,
    `razon_agotamiento` TEXT,
    `fecha_agotamiento` DATE,
    `estado` TINYINT(1) DEFAULT 1 NOT NULL,
    INDEX `fk_abastecimiento_producto_idx` (`id_producto` ASC),
    INDEX `fk_abastecimiento_empleado_idx` (`id_empleado_asignado` ASC),
    CONSTRAINT `fk_abastecimiento_producto`
        FOREIGN KEY (`id_producto`)
        REFERENCES `producto` (`id_producto`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT `fk_abastecimiento_empleado`
        FOREIGN KEY (`id_empleado_asignado`)
        REFERENCES `empleado` (`id_empleado`)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `novedades` (
    `id_novedad` INT AUTO_INCREMENT PRIMARY KEY,
    `dia_semana` INT NOT NULL, -- CHECK (`dia_semana` BETWEEN 0 AND 6),
    `hora_inicio` TIME NOT NULL,
    `hora_fin` TIME NOT NULL,
    `estado` TINYINT(1) DEFAULT 1 NOT NULL,
    `id_empleado` INT NOT NULL,
    UNIQUE KEY `unique_empleado_dia` (`id_empleado`, `dia_semana`),
    INDEX `fk_novedades_empleado_idx` (`id_empleado` ASC),
    CONSTRAINT `fk_novedades_empleado`
        FOREIGN KEY (`id_empleado`)
        REFERENCES `empleado` (`id_empleado`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `token_recuperacion` (
    `id_token_recuperacion` INT AUTO_INCREMENT PRIMARY KEY,
    `id_usuario` INTEGER NOT NULL,
    `token` TEXT NOT NULL,
    `fecha_expiracion` DATETIME NOT NULL,
    INDEX `fk_token_usuario_idx` (`id_usuario` ASC),
    CONSTRAINT `fk_token_usuario`
        FOREIGN KEY (`id_usuario`)
        REFERENCES `usuario` (`id_usuario`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- ======== Inserción de Datos Iniciales ========

INSERT IGNORE INTO `rol` (`nombre`, `tipo_perfil`, `descripcion`, `estado`) VALUES
('Administrador', 'NINGUNO', 'Acceso total a todos los módulos y funcionalidades del sistema.', 1),
('Empleado', 'EMPLEADO', 'Acceso a módulos operativos como ventas, citas, clientes, etc.', 1),
('Cliente', 'CLIENTE', 'Acceso limitado a sus propias citas, compras y gestión de perfil.', 1);

INSERT IGNORE INTO `usuario` (`correo`, `contrasena`, `id_rol`, `estado`) VALUES
('mrgerito@gmail.com', '$2b$10$oJOJM36rGGzZftagNM1vWOxLaW96cPBRk.DhhvSvv8gneGTzFIJhO', (SELECT id_rol FROM rol WHERE nombre = 'Administrador'), 1);

INSERT IGNORE INTO `estado` (`id_estado`, `nombre_estado`) VALUES
(1, 'En proceso'), (2, 'Pendiente'), (3, 'Completado'), (4, 'Cancelado');

INSERT IGNORE INTO `permisos` (`nombre`, `descripcion`, `estado`) VALUES
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
('MODULO_NOVEDADES_EMPLEADOS_GESTIONAR', 'Permite la gestión de novedades y horarios de empleados.', 1);

INSERT IGNORE INTO `permisos_x_rol` (id_rol, id_permiso) SELECT (SELECT id_rol FROM rol WHERE nombre = 'Administrador'), p.id_permiso FROM permisos p;
INSERT IGNORE INTO `permisos_x_rol` (id_rol, id_permiso) SELECT r.id_rol, p.id_permiso FROM rol r, permisos p WHERE r.nombre = 'Empleado' AND p.nombre IN ('MODULO_ABASTECIMIENTOS_GESTIONAR', 'MODULO_VENTAS_GESTIONAR', 'MODULO_COMPRAS_GESTIONAR', 'MODULO_CLIENTES_GESTIONAR', 'MODULO_PROVEEDORES_GESTIONAR', 'MODULO_PRODUCTOS_GESTIONAR', 'MODULO_SERVICIOS_GESTIONAR', 'MODULO_CITAS_GESTIONAR', 'MODULO_ESTADOS_GESTIONAR', 'MODULO_DASHBOARD_VER', 'MODULO_CATEGORIAS_PRODUCTOS_GESTIONAR', 'MODULO_CATEGORIAS_SERVICIOS_GESTIONAR', 'MODULO_ESPECIALIDADES_GESTIONAR');
INSERT IGNORE INTO `permisos_x_rol` (id_rol, id_permiso) SELECT r.id_rol, p.id_permiso FROM rol r, permisos p WHERE r.nombre = 'Cliente' AND p.nombre IN ('MODULO_CITAS_CREAR_PROPIA', 'MODULO_CITAS_VER_PROPIAS', 'MODULO_CITAS_CANCELAR_PROPIA', 'MODULO_VENTAS_CREAR_PROPIA', 'MODULO_VENTAS_VER_PROPIAS', 'MODULO_PRODUCTOS_VER', 'MODULO_SERVICIOS_VER', 'MODULO_CATEGORIAS_PRODUCTOS_VER', 'MODULO_CATEGORIAS_SERVICIOS_VER', 'MODULO_CLIENTES_VER_PROPIO');


-- Restaurar la configuración original.
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;