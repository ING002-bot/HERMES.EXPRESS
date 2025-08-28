<?php
require_once 'config.php';

// Verificar sesión de administrador
if (!verificarSesion() || $_SESSION['tipo'] !== 'admin') {
    echo json_encode(['exito' => false, 'mensaje' => 'Acceso no autorizado']);
    exit;
}

$accion = $_GET['accion'] ?? $_POST['accion'] ?? '';

switch($accion) {
    case 'metricas':
        obtenerMetricasAdmin();
        break;
    case 'todos_paquetes':
        obtenerTodosLosPaquetes();
        break;
    case 'empleados':
        obtenerEmpleados();
        break;
    case 'vehiculos':
        obtenerVehiculos();
        break;
    case 'rutas':
        obtenerRutas();
        break;
    case 'nuevo_empleado':
        crearEmpleado();
        break;
    case 'nuevo_vehiculo':
        crearVehiculo();
        break;
    case 'nueva_ruta':
        crearRuta();
        break;
    case 'actualizar_empleado':
        actualizarEmpleado();
        break;
    case 'eliminar_paquete':
        eliminarPaquete();
        break;
    default:
        echo json_encode(['exito' => false, 'mensaje' => 'Acción no válida']);
}

function obtenerMetricasAdmin() {
    global $pdo;
    
    try {
        // Total de paquetes
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM paquetes");
        $total_paquetes = $stmt->fetch()['total'];
        
        // Ingresos del mes actual
        $stmt = $pdo->query("
            SELECT COALESCE(SUM(precio), 0) as total 
            FROM paquetes 
            WHERE MONTH(fecha_envio) = MONTH(CURDATE()) 
            AND YEAR(fecha_envio) = YEAR(CURDATE())
        ");
        $ingresos_mes = $stmt->fetch()['total'];
        
        // Empleados activos
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM usuarios WHERE tipo = 'empleado' AND activo = 1");
        $empleados_activos = $stmt->fetch()['total'];
        
        // Vehículos operativos
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM vehiculos WHERE estado = 'disponible'");
        $vehiculos_operativos = $stmt->fetch()['total'];
        
        echo json_encode([
            'exito' => true,
            'datos' => [
                'total_paquetes' => $total_paquetes,
                'ingresos_mes' => $ingresos_mes,
                'empleados_activos' => $empleados_activos,
                'vehiculos_operativos' => $vehiculos_operativos
            ]
        ]);
    } catch(PDOException $e) {
        echo json_encode(['exito' => false, 'mensaje' => 'Error al obtener métricas']);
    }
}

function obtenerTodosLosPaquetes() {
    global $pdo;
    
    try {
        $stmt = $pdo->query("
            SELECT p.*, u.nombre as empleado_nombre
            FROM paquetes p 
            LEFT JOIN usuarios u ON p.empleado_id = u.id
            ORDER BY p.fecha_envio DESC
        ");
        $paquetes = $stmt->fetchAll();
        
        echo json_encode([
            'exito' => true,
            'datos' => $paquetes
        ]);
    } catch(PDOException $e) {
        echo json_encode(['exito' => false, 'mensaje' => 'Error al obtener paquetes']);
    }
}

function obtenerEmpleados() {
    global $pdo;
    
    try {
        $stmt = $pdo->query("
            SELECT id, nombre, usuario, email, tipo, activo, fecha_registro
            FROM usuarios 
            WHERE tipo IN ('empleado', 'admin')
            ORDER BY nombre
        ");
        $empleados = $stmt->fetchAll();
        
        echo json_encode([
            'exito' => true,
            'datos' => $empleados
        ]);
    } catch(PDOException $e) {
        echo json_encode(['exito' => false, 'mensaje' => 'Error al obtener empleados']);
    }
}

function obtenerVehiculos() {
    global $pdo;
    
    try {
        $stmt = $pdo->query("
            SELECT v.*, u.nombre as empleado_nombre
            FROM vehiculos v
            LEFT JOIN usuarios u ON v.empleado_asignado = u.id
            ORDER BY v.placa
        ");
        $vehiculos = $stmt->fetchAll();
        
        echo json_encode([
            'exito' => true,
            'datos' => $vehiculos
        ]);
    } catch(PDOException $e) {
        echo json_encode(['exito' => false, 'mensaje' => 'Error al obtener vehículos']);
    }
}

function obtenerRutas() {
    global $pdo;
    
    try {
        $stmt = $pdo->query("
            SELECT * FROM rutas 
            ORDER BY nombre
        ");
        $rutas = $stmt->fetchAll();
        
        echo json_encode([
            'exito' => true,
            'datos' => $rutas
        ]);
    } catch(PDOException $e) {
        echo json_encode(['exito' => false, 'mensaje' => 'Error al obtener rutas']);
    }
}

function crearEmpleado() {
    global $pdo;
    
    try {
        $nombre = limpiarDato($_POST['nombre']);
        $usuario = limpiarDato($_POST['usuario']);
        $email = limpiarDato($_POST['email']);
        $clave = $_POST['clave'];
        $tipo = limpiarDato($_POST['tipo']);
        
        // Validar datos
        if (empty($nombre) || empty($usuario) || empty($email) || empty($clave)) {
            echo json_encode(['exito' => false, 'mensaje' => 'Todos los campos son obligatorios']);
            return;
        }
        
        // Verificar si el usuario ya existe
        $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE usuario = ? OR email = ?");
        $stmt->execute([$usuario, $email]);
        if ($stmt->fetch()) {
            echo json_encode(['exito' => false, 'mensaje' => 'Usuario o email ya existe']);
            return;
        }
        
        // Crear empleado
        $clave_hash = password_hash($clave, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("
            INSERT INTO usuarios (nombre, usuario, email, clave, tipo, activo, fecha_registro) 
            VALUES (?, ?, ?, ?, ?, 1, NOW())
        ");
        $stmt->execute([$nombre, $usuario, $email, $clave_hash, $tipo]);
        
        echo json_encode([
            'exito' => true,
            'mensaje' => 'Empleado creado exitosamente'
        ]);
        
    } catch(PDOException $e) {
        echo json_encode(['exito' => false, 'mensaje' => 'Error al crear empleado']);
    }
}

function crearVehiculo() {
    global $pdo;
    
    try {
        $placa = limpiarDato($_POST['placa']);
        $marca = limpiarDato($_POST['marca']);
        $modelo = limpiarDato($_POST['modelo']);
        $capacidad = floatval($_POST['capacidad']);
        $estado = limpiarDato($_POST['estado']);
        
        // Validar datos
        if (empty($placa) || empty($marca) || empty($modelo) || $capacidad <= 0) {
            echo json_encode(['exito' => false, 'mensaje' => 'Todos los campos son obligatorios']);
            return;
        }
        
        // Verificar si la placa ya existe
        $stmt = $pdo->prepare("SELECT id FROM vehiculos WHERE placa = ?");
        $stmt->execute([$placa]);
        if ($stmt->fetch()) {
            echo json_encode(['exito' => false, 'mensaje' => 'La placa ya existe']);
            return;
        }
        
        // Crear vehículo
        $stmt = $pdo->prepare("
            INSERT INTO vehiculos (placa, marca, modelo, capacidad, estado) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$placa, $marca, $modelo, $capacidad, $estado]);
        
        echo json_encode([
            'exito' => true,
            'mensaje' => 'Vehículo creado exitosamente'
        ]);
        
    } catch(PDOException $e) {
        echo json_encode(['exito' => false, 'mensaje' => 'Error al crear vehículo']);
    }
}

function crearRuta() {
    global $pdo;
    
    try {
        $nombre = limpiarDato($_POST['nombre']);
        $origen = limpiarDato($_POST['origen']);
        $destino = limpiarDato($_POST['destino']);
        $distancia = floatval($_POST['distancia']);
        $tiempo_estimado = intval($_POST['tiempo_estimado']);
        
        // Validar datos
        if (empty($nombre) || empty($origen) || empty($destino) || $distancia <= 0) {
            echo json_encode(['exito' => false, 'mensaje' => 'Todos los campos son obligatorios']);
            return;
        }
        
        // Crear ruta
        $stmt = $pdo->prepare("
            INSERT INTO rutas (nombre, origen, destino, distancia, tiempo_estimado) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$nombre, $origen, $destino, $distancia, $tiempo_estimado]);
        
        echo json_encode([
            'exito' => true,
            'mensaje' => 'Ruta creada exitosamente'
        ]);
        
    } catch(PDOException $e) {
        echo json_encode(['exito' => false, 'mensaje' => 'Error al crear ruta']);
    }
}

function actualizarEmpleado() {
    global $pdo;
    
    try {
        $id = intval($_POST['id']);
        $activo = intval($_POST['activo']);
        
        $stmt = $pdo->prepare("UPDATE usuarios SET activo = ? WHERE id = ?");
        $stmt->execute([$activo, $id]);
        
        echo json_encode([
            'exito' => true,
            'mensaje' => 'Empleado actualizado exitosamente'
        ]);
        
    } catch(PDOException $e) {
        echo json_encode(['exito' => false, 'mensaje' => 'Error al actualizar empleado']);
    }
}

function eliminarPaquete() {
    global $pdo;
    
    try {
        $id = intval($_POST['id']);
        
        $stmt = $pdo->prepare("DELETE FROM paquetes WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode([
            'exito' => true,
            'mensaje' => 'Paquete eliminado exitosamente'
        ]);
        
    } catch(PDOException $e) {
        echo json_encode(['exito' => false, 'mensaje' => 'Error al eliminar paquete']);
    }
}
?>
