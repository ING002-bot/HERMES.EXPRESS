<?php
// Habilitar reporte de errores para depuración
error_reporting(E_ALL);
ini_set('display_errors', 0); // Desactivar visualización de errores en producción

// Configurar zona horaria
date_default_timezone_set('America/Mexico_City');

// Incluir archivos necesarios
require_once 'config.php';
require_once 'funciones_sesion.php';

// Configurar cabeceras para respuestas JSON
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');

// Función para enviar respuesta JSON
function enviarRespuesta($exito, $mensaje = '', $datos = null) {
    $respuesta = ['exito' => $exito];
    if ($mensaje) $respuesta['mensaje'] = $mensaje;
    if ($datos !== null) $respuesta['datos'] = $datos;
    echo json_encode($respuesta, JSON_UNESCAPED_UNICODE);
    exit;
}

// Manejar errores para que no se muestren en la salida
function manejarError($errno, $errstr, $errfile, $errline) {
    error_log("Error [$errno] $errstr en $errfile línea $errline");
    enviarRespuesta(false, 'Error en el servidor');
}
set_error_handler('manejarError');

// Manejar excepciones no capturadas
function manejarExcepcion($exception) {
    error_log("Excepción: " . $exception->getMessage() . " en " . $exception->getFile() . " línea " . $exception->getLine());
    enviarRespuesta(false, 'Error en el servidor');
}
set_exception_handler('manejarExcepcion');

// Verificar sesión
if (!verificarSesion()) {
    enviarRespuesta(false, 'No has iniciado sesión');
}

// Verificar que el usuario sea un empleado
if (($_SESSION['tipo'] ?? '') !== 'empleado') {
    enviarRespuesta(false, 'Acceso no autorizado para este tipo de usuario');
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
    case 'mi_ruta':
        obtenerMiRuta();
        break;
    case 'confirmar_entrega':
        confirmarEntrega();
        break;
    case 'actualizar_perfil':
        actualizarPerfilEmpleado();
        break;
    case 'estadisticas':
        obtenerEstadisticasEmpleado();
        break;
    default:
        enviarRespuesta(false, 'Acción no válida');
}

function obtenerResumenEmpleado() {
    global $pdo;
    
    try {
        if (!isset($_SESSION['usuario_id'])) {
            enviarRespuesta(false, 'Sesión no válida');
        }
        
        $empleado_id = $_SESSION['usuario_id'];
        
        // Iniciar transacción
        $pdo->beginTransaction();
        
        // Mis paquetes asignados
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM paquetes WHERE empleado_id = ?");
        $stmt->execute([$empleado_id]);
        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
        $mis_paquetes = $resultado ? (int)$resultado['total'] : 0;
        
        // Paquetes en ruta
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM paquetes WHERE empleado_id = ? AND estado = 'en_transito'");
        $stmt->execute([$empleado_id]);
        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
        $en_ruta = $resultado ? (int)$resultado['total'] : 0;
        
        // Paquetes entregados hoy
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM paquetes WHERE empleado_id = ? AND estado = 'entregado' AND DATE(fecha_entrega) = CURDATE()");
        $stmt->execute([$empleado_id]);
        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
        $entregados_hoy = $resultado ? (int)$resultado['total'] : 0;
        
        // Paquetes pendientes
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM paquetes WHERE empleado_id = ? AND estado = 'pendiente'");
        $stmt->execute([$empleado_id]);
        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
        $pendientes = $resultado ? (int)$resultado['total'] : 0;
        
        $pdo->commit();
        
        enviarRespuesta(true, '', [
            'mis_paquetes' => $mis_paquetes,
            'en_ruta' => $en_ruta,
            'entregados_hoy' => $entregados_hoy,
            'pendientes' => $pendientes
        ]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error en obtenerResumenEmpleado: " . $e->getMessage());
        enviarRespuesta(false, 'Error al obtener el resumen');
    }
}

function obtenerMisPaquetes() {
    global $pdo;
    
    try {
        if (!isset($_SESSION['usuario_id'])) {
            error_log("Error en obtenerMisPaquetes: No hay usuario_id en la sesión");
            enviarRespuesta(false, 'Sesión no válida');
        }
        
        $empleado_id = $_SESSION['usuario_id'];
        error_log("Obteniendo paquetes para el empleado: $empleado_id");
        
        // Primero verificar si el empleado existe
        $stmt = $pdo->prepare("SELECT id FROM empleados WHERE id = ?");
        $stmt->execute([$empleado_id]);
        if (!$stmt->fetch()) {
            error_log("Error: No se encontró el empleado con ID: $empleado_id");
            enviarRespuesta(false, 'Empleado no encontrado');
        }
        
        $query = "
            SELECT 
                p.id,
                p.codigo,
                p.descripcion,
                p.peso,
                p.estado,
                p.fecha_creacion,
                p.fecha_envio,
                p.fecha_entrega,
                p.fecha_entrega_estimada,
                p.prioridad,
                p.observaciones,
                c.nombre as cliente_nombre,
                c.direccion as direccion_entrega,
                c.telefono as cliente_telefono,
                CASE 
                    WHEN p.estado = 'entregado' AND p.fecha_entrega IS NOT NULL THEN p.fecha_entrega
                    WHEN p.estado = 'en_transito' AND p.fecha_envio IS NOT NULL THEN p.fecha_envio
                    ELSE p.fecha_creacion
                END as fecha_display
            FROM paquetes p 
            LEFT JOIN clientes c ON p.cliente_id = c.id
            WHERE p.empleado_id = ? 
            ORDER BY 
                CASE p.estado 
                    WHEN 'pendiente' THEN 1
                    WHEN 'en_transito' THEN 2
                    WHEN 'entregado' THEN 3
                    ELSE 4
                END,
                p.prioridad DESC,
                COALESCE(p.fecha_envio, p.fecha_creacion) DESC
        ";
        
        error_log("Ejecutando consulta SQL para obtener paquetes");
        $stmt = $pdo->prepare($query);
        $stmt->execute([$empleado_id]);
        $paquetes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("Paquetes encontrados: " . count($paquetes));
        
        // Formatear fechas y otros datos
        foreach ($paquetes as &$paquete) {
            try {
                if (!empty($paquete['fecha_creacion'])) {
                    $paquete['fecha_creacion_formateada'] = date('d/m/Y H:i', strtotime($paquete['fecha_creacion']));
                } else {
                    $paquete['fecha_creacion_formateada'] = 'No disponible';
                }
                
                if (!empty($paquete['fecha_envio'])) {
                    $paquete['fecha_envio_formateada'] = date('d/m/Y H:i', strtotime($paquete['fecha_envio']));
                } else {
                    $paquete['fecha_envio_formateada'] = 'Pendiente';
                }
                
                if (!empty($paquete['fecha_entrega'])) {
                    $paquete['fecha_entrega_formateada'] = date('d/m/Y H:i', strtotime($paquete['fecha_entrega']));
                } else {
                    $paquete['fecha_entrega_formateada'] = 'Pendiente';
                }
                
                // Asegurar que todos los campos necesarios estén definidos
                $paquete['estado_display'] = !empty($paquete['estado']) 
                    ? ucfirst(str_replace('_', ' ', $paquete['estado']))
                    : 'Desconocido';
                    
            } catch (Exception $e) {
                error_log("Error al formatear datos del paquete ID {$paquete['id']}: " . $e->getMessage());
                continue;
            }
        }
        
        enviarRespuesta(true, '', $paquetes);
    } catch (Exception $e) {
        error_log("Error en obtenerMisPaquetes: " . $e->getMessage());
        enviarRespuesta(false, 'Error al obtener los paquetes');
    }
}

function obtenerMiRuta() {
    global $pdo;
    
    try {
        if (!isset($_SESSION['usuario_id'])) {
            enviarRespuesta(false, 'Sesión no válida');
        }
        
        $empleado_id = $_SESSION['usuario_id'];
        $hoy = date('Y-m-d');
        
        // Obtener los paquetes asignados para hoy
        $query = "
            SELECT 
                p.id, p.codigo, p.estado, p.prioridad, p.fecha_creacion,
                COALESCE(c.nombre, 'Cliente no disponible') as cliente_nombre, 
                COALESCE(c.direccion, 'Dirección no disponible') as direccion, 
                COALESCE(c.latitud, 0) as latitud, 
                COALESCE(c.longitud, 0) as longitud
            FROM paquetes p
            LEFT JOIN clientes c ON p.cliente_id = c.id
            WHERE p.empleado_id = ? 
            AND p.estado IN ('pendiente', 'en_transito')
            AND (
                DATE(p.fecha_entrega_estimada) = ? 
                OR (p.fecha_entrega_estimada IS NULL AND p.estado = 'pendiente')
            )
            ORDER BY 
                CASE 
                    WHEN p.estado = 'en_transito' THEN 1
                    WHEN p.estado = 'pendiente' THEN 2
                    ELSE 3
                END,
                COALESCE(p.prioridad, 'normal') DESC,
                p.fecha_creacion ASC
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([$empleado_id, $hoy]);
        $paradas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Coordenadas por defecto (centro de Lima)
        $defaultCoords = [
            'lat' => -12.0464,
            'lng' => -77.0428
        ];
        
        // Formatear las paradas
        $ruta = [
            'fecha' => $hoy,
            'total_paradas' => count($paradas),
            'paradas' => array_map(function($parada) use ($defaultCoords) {
                $lat = !empty($parada['latitud']) ? (float)$parada['latitud'] : $defaultCoords['lat'];
                $lng = !empty($parada['longitud']) ? (float)$parada['longitud'] : $defaultCoords['lng'];
                
                return [
                    'id' => $parada['id'],
                    'codigo' => $parada['codigo'] ?? 'N/A',
                    'cliente' => $parada['cliente_nombre'] ?? 'Cliente no disponible',
                    'direccion' => $parada['direccion'] ?? 'Dirección no disponible',
                    'estado' => $parada['estado'] ?? 'pendiente',
                    'prioridad' => $parada['prioridad'] ?? 'normal',
                    'coordenadas' => [
                        'lat' => $lat,
                        'lng' => $lng
                    ]
                ];
            }, $paradas)
        ];
        
        // Si no hay paradas, devolver una ruta vacía en lugar de error
        if (empty($ruta['paradas'])) {
            $ruta['mensaje'] = 'No hay entregas programadas para hoy';
        }
        
        enviarRespuesta(true, '', $ruta);
        
    } catch (Exception $e) {
        error_log("Error en obtenerMiRuta: " . $e->getMessage() . "\n" . $e->getTraceAsString());
        enviarRespuesta(false, 'Error al obtener la ruta: ' . $e->getMessage());
    }
}

function obtenerMiVehiculo() {
    global $pdo;
    
    try {
        if (!isset($_SESSION['usuario_id'])) {
            error_log("Error en obtenerMiVehiculo: No hay usuario_id en la sesión");
            enviarRespuesta(false, 'Sesión no válida');
        }
        
        $empleado_id = $_SESSION['usuario_id'];
        error_log("Buscando vehículo para el empleado ID: $empleado_id");
        
        // Primero verificar si el empleado existe
        $stmt = $pdo->prepare("SELECT id, nombre FROM empleados WHERE id = ?");
        $stmt->execute([$empleado_id]);
        $empleado = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$empleado) {
            error_log("Error: No se encontró el empleado con ID: $empleado_id");
            enviarRespuesta(false, 'Empleado no encontrado');
        }
        
        $query = "
            SELECT 
                v.id,
                v.marca,
                v.modelo,
                v.anio,
                v.placa,
                v.color,
                v.estado,
                v.kilometraje,
                v.ultimo_mantenimiento,
                v.imagen_url,
                v.capacidad_actual,
                t.id as tipo_id,
                t.nombre as tipo_vehiculo,
                t.capacidad_maxima,
                t.descripcion as tipo_descripcion
            FROM vehiculos v
            LEFT JOIN tipo_vehiculo t ON v.tipo_id = t.id
            WHERE v.empleado_id = ?
            LIMIT 1
        ";
        
        error_log("Ejecutando consulta SQL para obtener vehículo");
        $stmt = $pdo->prepare($query);
        $stmt->execute([$empleado_id]);
        $vehiculo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$vehiculo) {
            error_log("No se encontró vehículo asignado para el empleado ID: $empleado_id");
            enviarRespuesta(false, 'No tienes ningún vehículo asignado actualmente');
        }
        
        error_log("Vehículo encontrado: " . json_encode($vehiculo));
        
        // Formatear datos para la respuesta
        $vehiculo['estado_display'] = !empty($vehiculo['estado']) 
            ? ucfirst($vehiculo['estado'])
            : 'No especificado';
            
        $vehiculo['ultimo_mantenimiento_formateado'] = !empty($vehiculo['ultimo_mantenimiento'])
            ? date('d/m/Y', strtotime($vehiculo['ultimo_mantenimiento']))
            : 'Sin registro';
            
        // Calcular porcentaje de capacidad
        $vehiculo['porcentaje_capacidad'] = 0;
        if (!empty($vehiculo['capacidad_maxima']) && is_numeric($vehiculo['capacidad_maxima']) && 
            !empty($vehiculo['capacidad_actual']) && is_numeric($vehiculo['capacidad_actual'])) {
            $porcentaje = ($vehiculo['capacidad_actual'] / $vehiculo['capacidad_maxima']) * 100;
            $vehiculo['porcentaje_capacidad'] = round(min(100, max(0, $porcentaje))); // Asegurar que esté entre 0 y 100
        }
        
        // Asegurar que la URL de la imagen sea accesible
        if (!empty($vehiculo['imagen_url'])) {
            // Si es una ruta relativa, convertir a URL absoluta
            if (strpos($vehiculo['imagen_url'], 'http') !== 0) {
                $vehiculo['imagen_url'] = 'https://' . $_SERVER['HTTP_HOST'] . '/' . ltrim($vehiculo['imagen_url'], '/');
            }
        } else {
            // Imagen por defecto si no hay una específica
            $vehiculo['imagen_url'] = 'https://' . $_SERVER['HTTP_HOST'] . '/assets/img/vehiculo-default.jpg';
        }
        
        enviarRespuesta(true, '', $vehiculo);
        
    } catch (Exception $e) {
        error_log("Error en obtenerMiVehiculo: " . $e->getMessage());
        enviarRespuesta(false, 'Error al obtener la información del vehículo');
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
        $stmt = $pdo->prepare("SELECT id FROM paquetes 
                              WHERE codigo = ? AND empleado_id = ? AND estado != 'entregado'");
        $stmt->execute([$codigo, $empleado_id]);
        $paquete = $stmt->fetch();
        
        if (!$paquete) {
            enviarRespuesta(false, 'Paquete no encontrado o ya entregado');
            return;
        }
        
        // Actualizar paquete como entregado
        $stmt = $pdo->prepare("UPDATE paquetes 
                              SET estado = 'entregado', 
                                  fecha_entrega = NOW(),
                                  receptor = ?,
                                  documento_receptor = ?,
                                  observaciones_entrega = ?
                              WHERE id = ?");
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
        
        enviarRespuesta(true, 'Entrega confirmada exitosamente');
    } catch (Exception $e) {
        error_log("Error en confirmarEntrega: " . $e->getMessage());
        enviarRespuesta(false, 'Error al confirmar la entrega');
    }
}

function obtenerEstadisticasEmpleado() {
    global $pdo;
    
    try {
        if (!isset($_SESSION['usuario_id'])) {
            enviarRespuesta(false, 'Sesión no válida');
        }
        
        $empleado_id = $_SESSION['usuario_id'];
        $hoy = date('Y-m-d');
        $inicio_semana = date('Y-m-d', strtotime('monday this week'));
        $inicio_mes = date('Y-m-01');
        
        // Obtener estadísticas del empleado
        $estadisticas = [
            'hoy' => [
                'entregados' => 0,
                'pendientes' => 0,
                'en_ruta' => 0,
                'promedio_entrega' => 0
            ],
            'semana' => [
                'entregados' => 0,
                'promedio_diario' => 0
            ],
            'mes' => [
                'entregados' => 0,
                'puntuales' => 0,
                'atrasados' => 0
            ]
        ];
        
        // Estadísticas de hoy
        $stmt = $pdo->prepare("
            SELECT 
                SUM(CASE WHEN estado = 'entregado' AND DATE(fecha_entrega) = ? THEN 1 ELSE 0 END) as entregados,
                SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN estado = 'en_transito' THEN 1 ELSE 0 END) as en_ruta
            FROM paquetes 
            WHERE empleado_id = ? AND 
                  (estado IN ('entregado', 'pendiente', 'en_transito'))
        ");
        $stmt->execute([$hoy, $empleado_id]);
        $hoy_stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($hoy_stats) {
            $estadisticas['hoy']['entregados'] = (int)$hoy_stats['entregados'];
            $estadisticas['hoy']['pendientes'] = (int)$hoy_stats['pendientes'];
            $estadisticas['hoy']['en_ruta'] = (int)$hoy_stats['en_ruta'];
        }
        
        // Estadísticas de la semana
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_entregados,
                COUNT(DISTINCT DATE(fecha_entrega)) as dias_trabajados
            FROM paquetes 
            WHERE empleado_id = ? AND 
                  estado = 'entregado' AND 
                  fecha_entrega >= ?
        ");
        $stmt->execute([$empleado_id, $inicio_semana]);
        $semana_stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($semana_stats) {
            $estadisticas['semana']['entregados'] = (int)$semana_stats['total_entregados'];
            $dias = max(1, (int)$semana_stats['dias_trabajados']); // Evitar división por cero
            $estadisticas['semana']['promedio_diario'] = round($estadisticas['semana']['entregados'] / $dias, 1);
        }
        
        // Estadísticas del mes
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_entregados,
                SUM(CASE WHEN fecha_entrega <= fecha_entrega_estimada THEN 1 ELSE 0 END) as entregas_puntuales,
                SUM(CASE WHEN fecha_entrega > fecha_entrega_estimada THEN 1 ELSE 0 END) as entregas_atrasadas
            FROM paquetes 
            WHERE empleado_id = ? AND 
                  estado = 'entregado' AND 
                  fecha_entrega >= ?
        ");
        $stmt->execute([$empleado_id, $inicio_mes]);
        $mes_stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($mes_stats) {
            $estadisticas['mes']['entregados'] = (int)$mes_stats['total_entregados'];
            $estadisticas['mes']['puntuales'] = (int)$mes_stats['entregas_puntuales'];
            $estadisticas['mes']['atrasados'] = (int)$mes_stats['entregas_atrasadas'];
        }
        
        // Calcular promedio de tiempo de entrega para hoy
        $stmt = $pdo->prepare("
            SELECT AVG(TIMESTAMPDIFF(MINUTE, fecha_envio, fecha_entrega)) as promedio_minutos
            FROM paquetes
            WHERE empleado_id = ? AND 
                  estado = 'entregado' AND 
                  DATE(fecha_entrega) = ?
        ");
        $stmt->execute([$empleado_id, $hoy]);
        $promedio = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($promedio && $promedio['promedio_minutos'] !== null) {
            $horas = floor($promedio['promedio_minutos'] / 60);
            $minutos = $promedio['promedio_minutos'] % 60;
            $estadisticas['hoy']['promedio_entrega'] = $horas > 0 
                ? sprintf('%d h %d min', $horas, $minutos)
                : sprintf('%d min', $minutos);
        } else {
            $estadisticas['hoy']['promedio_entrega'] = 'N/A';
        }
        
        enviarRespuesta(true, '', $estadisticas);
        
    } catch (Exception $e) {
        error_log("Error en obtenerEstadisticasEmpleado: " . $e->getMessage());
        enviarRespuesta(false, 'Error al obtener las estadísticas');
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
