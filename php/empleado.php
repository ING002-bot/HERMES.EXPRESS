<?php
require_once 'config.php';

// Verificar sesión
if (!verificarSesion() || $_SESSION['tipo'] !== 'empleado') {
    echo json_encode(['exito' => false, 'mensaje' => 'Acceso no autorizado']);
    exit;
}

$accion = $_GET['accion'] ?? $_POST['accion'] ?? '';

switch($accion) {
    case 'resumen':
        obtenerResumenEmpleado();
        break;
    case 'mis_paquetes':
        obtenerMisPaquetes();
        break;
    case 'mi_vehiculo':
        obtenerMiVehiculo();
        break;
    case 'confirmar_entrega':
        confirmarEntrega();
        break;
    case 'actualizar_perfil':
        actualizarPerfilEmpleado();
        break;
    default:
        echo json_encode(['exito' => false, 'mensaje' => 'Acción no válida']);
}

function obtenerResumenEmpleado() {
    global $pdo;
    
    try {
        $empleado_id = $_SESSION['id'];
        
        // Mis paquetes asignados
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM paquetes WHERE empleado_id = ?");
        $stmt->execute([$empleado_id]);
        $mis_paquetes = $stmt->fetch()['total'];
        
        // Paquetes en ruta
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM paquetes WHERE empleado_id = ? AND estado = 'en_transito'");
        $stmt->execute([$empleado_id]);
        $en_ruta = $stmt->fetch()['total'];
        
        // Entregados hoy
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM paquetes WHERE empleado_id = ? AND estado = 'entregado' AND DATE(fecha_entrega) = CURDATE()");
        $stmt->execute([$empleado_id]);
        $entregados_hoy = $stmt->fetch()['total'];
        
        // Pendientes
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM paquetes WHERE empleado_id = ? AND estado = 'pendiente'");
        $stmt->execute([$empleado_id]);
        $pendientes = $stmt->fetch()['total'];
        
        echo json_encode([
            'exito' => true,
            'datos' => [
                'mis_paquetes' => $mis_paquetes,
                'en_ruta' => $en_ruta,
                'entregados_hoy' => $entregados_hoy,
                'pendientes' => $pendientes
            ]
        ]);
    } catch(PDOException $e) {
        echo json_encode(['exito' => false, 'mensaje' => 'Error al obtener resumen']);
    }
}

function obtenerMisPaquetes() {
    global $pdo;
    
    try {
        $empleado_id = $_SESSION['id'];
        
        $stmt = $pdo->prepare("
            SELECT p.*, 
                   CASE WHEN p.fecha_entrega IS NOT NULL THEN p.fecha_entrega ELSE p.fecha_envio END as fecha_display
            FROM paquetes p 
            WHERE p.empleado_id = ? 
            ORDER BY p.fecha_envio DESC
        ");
        $stmt->execute([$empleado_id]);
        $paquetes = $stmt->fetchAll();
        
        echo json_encode([
            'exito' => true,
            'datos' => $paquetes
        ]);
    } catch(PDOException $e) {
        echo json_encode(['exito' => false, 'mensaje' => 'Error al obtener paquetes']);
    }
}

function obtenerMiVehiculo() {
    global $pdo;
    
    try {
        $empleado_id = $_SESSION['id'];
        
        $stmt = $pdo->prepare("
            SELECT v.* 
            FROM vehiculos v 
            WHERE v.empleado_asignado = ?
        ");
        $stmt->execute([$empleado_id]);
        $vehiculo = $stmt->fetch();
        
        if ($vehiculo) {
            echo json_encode([
                'exito' => true,
                'datos' => $vehiculo
            ]);
        } else {
            echo json_encode([
                'exito' => true,
                'datos' => null
            ]);
        }
    } catch(PDOException $e) {
        echo json_encode(['exito' => false, 'mensaje' => 'Error al obtener vehículo']);
    }
}

function confirmarEntrega() {
    global $pdo;
    
    try {
        $codigo = limpiarDato($_POST['codigo']);
        $receptor = limpiarDato($_POST['receptor']);
        $documento = limpiarDato($_POST['documento']);
        $observaciones = limpiarDato($_POST['observaciones']);
        $empleado_id = $_SESSION['id'];
        
        // Verificar que el paquete existe y está asignado al empleado
        $stmt = $pdo->prepare("
            SELECT id FROM paquetes 
            WHERE codigo = ? AND empleado_id = ? AND estado != 'entregado'
        ");
        $stmt->execute([$codigo, $empleado_id]);
        $paquete = $stmt->fetch();
        
        if (!$paquete) {
            echo json_encode(['exito' => false, 'mensaje' => 'Paquete no encontrado o ya entregado']);
            return;
        }
        
        // Actualizar paquete como entregado
        $stmt = $pdo->prepare("
            UPDATE paquetes 
            SET estado = 'entregado', 
                fecha_entrega = NOW(),
                receptor = ?,
                documento_receptor = ?,
                observaciones_entrega = ?
            WHERE id = ?
        ");
        $stmt->execute([$receptor, $documento, $observaciones, $paquete['id']]);
        
        // Manejar foto si se subió
        if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = '../uploads/entregas/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            $extension = pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION);
            $nombreArchivo = $codigo . '_' . time() . '.' . $extension;
            $rutaArchivo = $uploadDir . $nombreArchivo;
            
            if (move_uploaded_file($_FILES['foto']['tmp_name'], $rutaArchivo)) {
                $stmt = $pdo->prepare("UPDATE paquetes SET foto_entrega = ? WHERE id = ?");
                $stmt->execute([$nombreArchivo, $paquete['id']]);
            }
        }
        
        echo json_encode([
            'exito' => true,
            'mensaje' => 'Entrega confirmada exitosamente'
        ]);
        
    } catch(PDOException $e) {
        echo json_encode(['exito' => false, 'mensaje' => 'Error al confirmar entrega']);
    }
}

function actualizarPerfilEmpleado() {
    global $pdo;
    
    try {
        $empleado_id = $_SESSION['id'];
        $email = limpiarDato($_POST['email']);
        $nueva_clave = $_POST['nueva_clave'] ?? '';
        
        if ($nueva_clave) {
            $clave_hash = password_hash($nueva_clave, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE usuarios SET email = ?, clave = ? WHERE id = ?");
            $stmt->execute([$email, $clave_hash, $empleado_id]);
        } else {
            $stmt = $pdo->prepare("UPDATE usuarios SET email = ? WHERE id = ?");
            $stmt->execute([$email, $empleado_id]);
        }
        
        echo json_encode([
            'exito' => true,
            'mensaje' => 'Perfil actualizado exitosamente'
        ]);
        
    } catch(PDOException $e) {
        echo json_encode(['exito' => false, 'mensaje' => 'Error al actualizar perfil']);
    }
}
?>
