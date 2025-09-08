<?php
require_once 'config.php';

/**
 * Registra una acción en el log del sistema
 * 
 * @param string $accion Nombre de la acción realizada (ej: 'crear_empleado')
 * @param int $id_entidad ID del registro afectado
 * @param string $detalles Descripción detallada de la acción
 * @return bool True si se registró correctamente, false en caso contrario
 */
function registrarAccion($accion, $id_entidad, $detalles = '') {
    global $pdo;
    
    try {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Desconocido';
        $usuario_id = $_SESSION['usuario_id'] ?? null;
        
        // Verificar si la tabla de logs existe
        $tableExists = $pdo->query("SHOW TABLES LIKE 'logs_acciones'")->rowCount() > 0;
        
        if (!$tableExists) {
            // Si la tabla no existe, crearla
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS logs_acciones (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    usuario_id INT NULL,
                    accion VARCHAR(50) NOT NULL,
                    id_entidad INT NULL,
                    detalles TEXT,
                    ip VARCHAR(45) NOT NULL,
                    user_agent TEXT,
                    fecha DATETIME NOT NULL,
                    INDEX idx_usuario (usuario_id),
                    INDEX idx_accion (accion),
                    INDEX idx_fecha (fecha)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            
                ALTER TABLE logs_acciones
                ADD CONSTRAINT fk_logs_usuario
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
                ON DELETE SET NULL ON UPDATE CASCADE;
            ");
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO logs_acciones 
            (usuario_id, accion, id_entidad, detalles, ip, user_agent, fecha) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        
        ");
        
        return $stmt->execute([
            $usuario_id,
            $accion,
            $id_entidad,
            $detalles,
            $ip,
            $user_agent
        ]);
        
    } catch (Exception $e) {
        // En caso de error al registrar la acción, lo registramos en el log de errores
        error_log('Error al registrar acción: ' . $e->getMessage());
        return false;
    }
}

// Verificar sesión de administrador o asistente
session_start();
if (!isset($_SESSION['usuario_id']) || !in_array($_SESSION['tipo'], ['admin', 'asistente'])) {
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
    case 'nuevo_paquete':
        crearPaquete();
        break;
    case 'eliminar_empleado':
        eliminarEmpleado();
        break;
    case 'eliminar_vehiculo':
        eliminarVehiculo();
        break;
    case 'eliminar_ruta':
        eliminarRuta();
        break;
    case 'generar_reporte':
        generarReporte();
        break;
    case 'nuevo_vehiculo':
        crearVehiculo();
        break;
    case 'nueva_ruta':
        crearRuta();
        break;
    case 'nuevo_empleado':
        crearEmpleado();
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
            SELECT v.*, 
                   COALESCE(u.nombre, 'Sin asignar') as empleado_nombre,
                   CASE 
                       WHEN v.estado = 'disponible' THEN 'Disponible'
                       WHEN v.estado = 'en_ruta' THEN 'En ruta'
                       WHEN v.estado = 'mantenimiento' THEN 'En mantenimiento'
                       ELSE v.estado
                   END as estado_mostrar
            FROM vehiculos v
            LEFT JOIN usuarios u ON v.empleado_id = u.id
            ORDER BY v.placa
        
        ");
        $vehiculos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Asegurarse de que los datos estén en el formato correcto
        foreach ($vehiculos as &$vehiculo) {
            $vehiculo['id'] = (int)$vehiculo['id'];
            $vehiculo['capacidad'] = (float)$vehiculo['capacidad'];
        }
        
        echo json_encode([
            'exito' => true,
            'datos' => $vehiculos
        ], JSON_UNESCAPED_UNICODE);
    } catch(PDOException $e) {
        error_log('Error en obtenerVehiculos: ' . $e->getMessage());
        echo json_encode([
            'exito' => false, 
            'mensaje' => 'Error al obtener vehículos: ' . $e->getMessage()
        ]);
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
    
    // Establecer el tipo de contenido de la respuesta
    header('Content-Type: application/json');
    
    try {
        // Obtener y validar los datos de entrada
        $datos = $_POST;
        
        // Validar campos obligatorios
        $camposRequeridos = ['nombre', 'usuario', 'email', 'clave', 'tipo'];
        $camposFaltantes = [];
        
        foreach ($camposRequeridos as $campo) {
            if (empty(trim($datos[$campo] ?? ''))) {
                $camposFaltantes[] = $campo;
            }
        }
        
        if (!empty($camposFaltantes)) {
            http_response_code(400); // Bad Request
            echo json_encode([
                'exito' => false, 
                'mensaje' => 'Los siguientes campos son obligatorios: ' . implode(', ', $camposFaltantes)
            ]);
            return;
        }
        
        // Limpiar y validar los datos
        $nombre = limpiar_dato($datos['nombre']);
        $usuario = limpiar_dato($datos['usuario']);
        $email = filter_var(limpiar_dato($datos['email']), FILTER_VALIDATE_EMAIL);
        $clave = $datos['clave'];
        $tipo = limpiar_dato($datos['tipo']);
        
        // Validar formato de email
        if (!$email) {
            http_response_code(400);
            echo json_encode(['exito' => false, 'mensaje' => 'El formato del correo electrónico no es válido']);
            return;
        }
        
        // Validar longitud mínima de contraseña
        if (strlen($clave) < 6) {
            http_response_code(400);
            echo json_encode(['exito' => false, 'mensaje' => 'La contraseña debe tener al menos 6 caracteres']);
            return;
        }
        
        // Verificar si el usuario o email ya existen
        $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE usuario = ? OR email = ?");
        $stmt->execute([$usuario, $email]);
        $usuarioExistente = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($usuarioExistente) {
            http_response_code(409); // Conflict
            echo json_encode([
                'exito' => false, 
                'mensaje' => 'El nombre de usuario o correo electrónico ya está en uso',
                'campo' => $usuarioExistente['usuario'] === $usuario ? 'usuario' : 'email'
            ]);
            return;
        }
        
        // Hashear la contraseña
        $clave_hash = password_hash($clave, PASSWORD_DEFAULT);
        
        // Iniciar transacción
        $pdo->beginTransaction();
        
        try {
            // Insertar el nuevo empleado
            $stmt = $pdo->prepare("
                INSERT INTO usuarios (nombre, usuario, email, clave, tipo, activo, fecha_registro) 
                VALUES (:nombre, :usuario, :email, :clave, :tipo, 1, NOW())
            ");
            
            $stmt->execute([
                ':nombre' => $nombre,
                ':usuario' => $usuario,
                ':email' => $email,
                ':clave' => $clave_hash,
                ':tipo' => $tipo
            ]);
            
            $id_empleado = $pdo->lastInsertId();
            
            // Si todo salió bien, confirmar la transacción
            $pdo->commit();
            
            // Registrar la acción en el log
            registrarAccion('crear_empleado', $id_empleado, "Se creó el empleado: $nombre ($usuario)");
            
            // Devolver respuesta exitosa
            http_response_code(201); // Created
            echo json_encode([
                'exito' => true,
                'mensaje' => 'Empleado creado exitosamente',
                'id_empleado' => $id_empleado,
                'fecha_registro' => date('Y-m-d H:i:s')
            ]);
            
        } catch (Exception $e) {
            // Revertir la transacción en caso de error
            $pdo->rollBack();
            throw $e;
        }
        
    } catch(PDOException $e) {
        error_log('Error en crearEmpleado: ' . $e->getMessage());
        echo json_encode([
            'exito' => false, 
            'mensaje' => 'Error en el servidor: ' . $e->getMessage()
        ]);
    }
}

function crearVehiculo() {
    global $pdo;
    
    try {
        $placa = limpiar_dato($_POST['placa']);
        $marca = limpiar_dato($_POST['marca']);
        $modelo = limpiar_dato($_POST['modelo']);
        $capacidad = floatval($_POST['capacidad']);
        $estado = limpiar_dato($_POST['estado']);
        
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
        $nombre = limpiar_dato($_POST['nombre']);
        $origen = limpiar_dato($_POST['origen']);
        $destino = limpiar_dato($_POST['destino']);
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

function crearPaquete() {
    global $pdo;
    
    try {
        $remitente = limpiar_dato($_POST['remitente'] ?? '');
        $destinatario = limpiar_dato($_POST['destinatario'] ?? '');
        $direccion_origen = limpiar_dato($_POST['direccion_origen'] ?? '');
        $direccion_destino = limpiar_dato($_POST['direccion_destino'] ?? '');
        $peso = floatval($_POST['peso'] ?? 0);
        $precio = floatval($_POST['precio'] ?? 0);
        $tipo_ruta = limpiar_dato($_POST['tipo_ruta'] ?? '');
        
        if (empty($remitente) || empty($destinatario) || empty($direccion_origen) || empty($direccion_destino) || $peso <= 0 || $precio <= 0 || empty($tipo_ruta)) {
            echo json_encode(['exito' => false, 'mensaje' => 'Todos los campos son obligatorios y deben ser válidos']);
            return;
        }
        
        $codigo = 'PKG' . date('Ymd') . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
        
        $stmt = $pdo->prepare("
            INSERT INTO paquetes (codigo, remitente, destinatario, direccion_origen, direccion_destino, peso, precio, tipo_ruta, estado, fecha_envio) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', CURDATE())
        ");
        
        $stmt->execute([$codigo, $remitente, $destinatario, $direccion_origen, $direccion_destino, $peso, $precio, $tipo_ruta]);
        
        echo json_encode([
            'exito' => true,
            'mensaje' => 'Paquete creado exitosamente',
            'codigo' => $codigo
        ]);
        
    } catch(PDOException $e) {
        echo json_encode(['exito' => false, 'mensaje' => 'Error al crear paquete: ' . $e->getMessage()]);
    }
}

function eliminarEmpleado() {
    global $pdo;
    
    try {
        $id = intval($_POST['id']);
        
        $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = ? AND tipo != 'admin'");
        $stmt->execute([$id]);
        
        echo json_encode([
            'exito' => true,
            'mensaje' => 'Empleado eliminado exitosamente'
        ]);
        
    } catch(PDOException $e) {
        echo json_encode(['exito' => false, 'mensaje' => 'Error al eliminar empleado']);
    }
}

function eliminarVehiculo() {
    global $pdo;
    
    try {
        $id = intval($_POST['id']);
        
        $stmt = $pdo->prepare("DELETE FROM vehiculos WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode([
            'exito' => true,
            'mensaje' => 'Vehículo eliminado exitosamente'
        ]);
        
    } catch(PDOException $e) {
        echo json_encode(['exito' => false, 'mensaje' => 'Error al eliminar vehículo']);
    }
}

function eliminarRuta() {
    global $pdo;
    
    try {
        $id = intval($_POST['id']);
        
        $stmt = $pdo->prepare("DELETE FROM rutas WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode([
            'exito' => true,
            'mensaje' => 'Ruta eliminada exitosamente'
        ]);
        
    } catch(PDOException $e) {
        echo json_encode(['exito' => false, 'mensaje' => 'Error al eliminar ruta']);
    }
}



function generarReporte() {
    global $pdo;
    
    try {
        $tipo = $_POST['tipo'] ?? $_GET['tipo'];
        $fecha_inicio = $_POST['fecha_inicio'] ?? $_GET['fecha_inicio'] ?? null;
        $fecha_fin = $_POST['fecha_fin'] ?? $_GET['fecha_fin'] ?? null;
        $formato = $_POST['formato'] ?? $_GET['formato'] ?? 'ver';
        
        $datos = [];
        
        switch($tipo) {
            case 'paquetes':
                $sql = "SELECT * FROM paquetes";
                if ($fecha_inicio && $fecha_fin) {
                    $sql .= " WHERE fecha_envio BETWEEN ? AND ?";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([$fecha_inicio, $fecha_fin]);
                } else {
                    $stmt = $pdo->query($sql);
                }
                $datos = $stmt->fetchAll();
                break;
                
            case 'ventas':
                $sql = "SELECT DATE(fecha_envio) as fecha, COUNT(*) as total_paquetes, SUM(precio) as ingresos FROM paquetes";
                if ($fecha_inicio && $fecha_fin) {
                    $sql .= " WHERE fecha_envio BETWEEN ? AND ?";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([$fecha_inicio, $fecha_fin]);
                } else {
                    $stmt = $pdo->query($sql);
                }
                $sql .= " GROUP BY DATE(fecha_envio) ORDER BY fecha DESC";
                $stmt = $pdo->prepare($sql);
                if ($fecha_inicio && $fecha_fin) {
                    $stmt->execute([$fecha_inicio, $fecha_fin]);
                } else {
                    $stmt->execute();
                }
                $datos = $stmt->fetchAll();
                break;
                
            case 'empleados':
                $sql = "SELECT * FROM usuarios WHERE tipo IN ('empleado', 'admin', 'asistente')";
                if ($fecha_inicio && $fecha_fin) {
                    $sql .= " AND fecha_registro BETWEEN ? AND ?";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([$fecha_inicio, $fecha_fin]);
                } else {
                    $stmt = $pdo->query($sql);
                }
                $datos = $stmt->fetchAll();
                break;
                
            case 'vehiculos':
                $sql = "SELECT v.*, u.nombre as empleado_nombre FROM vehiculos v LEFT JOIN usuarios u ON v.empleado_asignado = u.id";
                $stmt = $pdo->query($sql);
                $datos = $stmt->fetchAll();
                break;
                
            case 'empleados_paquetes':
                $sql = "SELECT u.nombre, u.email, u.tipo, 
                        COUNT(p.id) as total_paquetes,
                        SUM(CASE WHEN p.estado = 'entregado' THEN 1 ELSE 0 END) as paquetes_entregados,
                        SUM(CASE WHEN p.estado = 'devuelto' THEN 1 ELSE 0 END) as paquetes_devueltos,
                        SUM(p.precio) as ingresos_generados
                        FROM usuarios u 
                        LEFT JOIN paquetes p ON u.id = p.empleado_id
                        WHERE u.tipo IN ('empleado', 'asistente')";
                if ($fecha_inicio && $fecha_fin) {
                    $sql .= " AND p.fecha_envio BETWEEN ? AND ?";
                    $stmt = $pdo->prepare($sql . " GROUP BY u.id");
                    $stmt->execute([$fecha_inicio, $fecha_fin]);
                } else {
                    $stmt = $pdo->prepare($sql . " GROUP BY u.id");
                    $stmt->execute();
                }
                $datos = $stmt->fetchAll();
                break;
                
            case 'rutas_paquetes':
                $sql = "SELECT r.nombre as ruta, r.origen, r.destino, r.distancia,
                        0 as total_paquetes,
                        0 as entregados,
                        0 as ingresos
                        FROM rutas r";
                $stmt = $pdo->query($sql);
                $datos = $stmt->fetchAll();
                break;
                
            case 'vehiculos_entregas':
                $sql = "SELECT v.placa, v.marca, v.modelo, v.estado,
                        0 as total_entregas,
                        0 as entregas_exitosas,
                        u.nombre as conductor
                        FROM vehiculos v 
                        LEFT JOIN usuarios u ON v.empleado_id = u.id";
                $stmt = $pdo->query($sql);
                $datos = $stmt->fetchAll();
                break;
        }
        
        // Si es descarga, generar archivo
        if ($formato === 'excel') {
            generarExcel($datos, $tipo);
            return;
        } elseif ($formato === 'pdf') {
            generarPDF($datos, $tipo);
            return;
        }
        
        // Si es solo ver, devolver JSON
        echo json_encode([
            'exito' => true,
            'datos' => $datos
        ]);
        
    } catch(PDOException $e) {
        echo json_encode(['exito' => false, 'mensaje' => 'Error al generar reporte: ' . $e->getMessage()]);
    }
}

function generarExcel($datos, $tipo) {
    // Configurar headers para descarga de CSV (compatible con Excel)
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="reporte_' . $tipo . '_' . date('Y-m-d') . '.csv"');
    header('Cache-Control: max-age=0');
    
    // Crear contenido CSV
    $output = fopen('php://output', 'w');
    
    // BOM para UTF-8
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
    
    if (!empty($datos)) {
        // Escribir encabezados traducidos
        $headers = array_keys((array)$datos[0]);
        $headersTraducidos = [];
        foreach ($headers as $header) {
            $headersTraducidos[] = ucfirst(str_replace('_', ' ', $header));
        }
        fputcsv($output, $headersTraducidos, ',');
        
        // Escribir datos
        foreach ($datos as $fila) {
            $filaArray = array_values((array)$fila);
            fputcsv($output, $filaArray, ',');
        }
    } else {
        fputcsv($output, ['Sin datos para mostrar'], ',');
    }
    
    fclose($output);
    exit;
}

function generarPDF($datos, $tipo) {
    // Configurar headers para descarga de HTML (que se puede imprimir como PDF)
    header('Content-Type: text/html; charset=utf-8');
    header('Content-Disposition: attachment; filename="reporte_' . $tipo . '_' . date('Y-m-d') . '.html"');
    
    // Crear HTML bien formateado
    $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reporte ' . ucfirst($tipo) . '</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .fecha { text-align: center; margin-bottom: 20px; color: #666; }
        @media print {
            body { margin: 0; }
        }
    </style>
</head>
<body>
    <h1>Reporte de ' . ucfirst(str_replace('_', ' ', $tipo)) . '</h1>
    <div class="fecha">Generado el: ' . date('d/m/Y H:i:s') . '</div>';
    
    if (!empty($datos)) {
        $html .= '<table><thead><tr>';
        
        // Encabezados
        $headers = array_keys((array)$datos[0]);
        foreach ($headers as $header) {
            $html .= '<th>' . ucfirst(str_replace('_', ' ', $header)) . '</th>';
        }
        $html .= '</tr></thead><tbody>';
        
        // Datos
        foreach ($datos as $fila) {
            $html .= '<tr>';
            foreach ((array)$fila as $valor) {
                $html .= '<td>' . htmlspecialchars($valor ?? '') . '</td>';
            }
            $html .= '</tr>';
        }
        $html .= '</tbody></table>';
    } else {
        $html .= '<p>No hay datos para mostrar en este reporte.</p>';
    }
    
    $html .= '
    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>';
    
    echo $html;
    exit;
}
?>
