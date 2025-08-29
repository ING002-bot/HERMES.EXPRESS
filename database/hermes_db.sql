-- Base de datos para Hermes Express
CREATE DATABASE IF NOT EXISTS hermes_express;
USE hermes_express;

-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    clave VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    tipo ENUM('admin', 'asistente', 'empleado') NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de paquetes
CREATE TABLE paquetes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    remitente VARCHAR(100) NOT NULL,
    destinatario VARCHAR(100) NOT NULL,
    direccion_origen TEXT NOT NULL,
    direccion_destino TEXT NOT NULL,
    peso DECIMAL(8,2) NOT NULL,
    estado ENUM('pendiente', 'en_transito', 'entregado', 'devuelto') DEFAULT 'pendiente',
    precio DECIMAL(10,2) NOT NULL,
    fecha_envio DATE NOT NULL,
    fecha_entrega DATE NULL,
    empleado_id INT,
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empleado_id) REFERENCES usuarios(id)
);

-- Tabla de rutas
CREATE TABLE rutas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    origen VARCHAR(100) NOT NULL,
    destino VARCHAR(100) NOT NULL,
    distancia DECIMAL(8,2) NOT NULL,
    tiempo_estimado INT NOT NULL, -- en minutos
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de vehículos
CREATE TABLE vehiculos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    placa VARCHAR(20) UNIQUE NOT NULL,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    capacidad DECIMAL(8,2) NOT NULL, -- en kg
    estado ENUM('disponible', 'en_ruta', 'mantenimiento') DEFAULT 'disponible',
    empleado_id INT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empleado_id) REFERENCES usuarios(id)
);

-- Insertar datos de ejemplo
INSERT INTO usuarios (usuario, clave, nombre, email, tipo) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador', 'admin@hermesexpress.com', 'admin'),
('asistente', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Asistente', 'asistente@hermesexpress.com', 'asistente'),
('empleado', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Empleado', 'empleado@hermesexpress.com', 'empleado');

INSERT INTO rutas (nombre, origen, destino, distancia, tiempo_estimado) VALUES
('Ruta Centro', 'Centro', 'Norte', 15.5, 45),
('Ruta Sur', 'Centro', 'Sur', 22.3, 60),
('Ruta Este', 'Centro', 'Este', 18.7, 50);

INSERT INTO vehiculos (placa, marca, modelo, capacidad, estado, empleado_asignado) VALUES
('ABC-123', 'Toyota', 'Hiace', 1500.00, 'disponible', 2),
('DEF-456', 'Chevrolet', 'NPR', 3000.00, 'en_ruta', 3),
('GHI-789', 'Ford', 'Transit', 2000.00, 'mantenimiento', NULL);

INSERT INTO paquetes (codigo, remitente, destinatario, direccion_origen, direccion_destino, peso, estado, precio, fecha_envio, empleado_id, tipo_ruta) VALUES
('HE001', 'Carlos López', 'Ana Martínez', 'Calle 1 #123', 'Carrera 5 #456', 2.5, 'en_transito', 15000.00, CURDATE(), 2, 'urbano'),
('HE002', 'Pedro Ruiz', 'Sofía Torres', 'Avenida 2 #789', 'Calle 8 #321', 1.2, 'pendiente', 8000.00, CURDATE(), NULL, 'distrital'),
('HE003', 'Laura Gómez', 'Diego Silva', 'Carrera 3 #654', 'Avenida 9 #987', 3.8, 'entregado', 25000.00, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 3, 'urbano');

INSERT INTO tarifas_rutas (tipo_ruta, tarifa_base, tarifa_por_kg, comision_empleado, descripcion) VALUES
('urbano', 5000.00, 500.00, 15.00, 'Entregas dentro de la ciudad'),
('distrital', 8000.00, 800.00, 18.00, 'Entregas entre distritos de la misma provincia'),
('interprovincial', 15000.00, 1200.00, 25.00, 'Entregas entre diferentes provincias'),
('interurbano', 12000.00, 1000.00, 20.00, 'Entregas entre ciudades de la misma región');
