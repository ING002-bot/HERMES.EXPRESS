<?php
// php/import_paquetes.php
// Ejecuta import_excel_to_db.py para insertar en MySQL el último Excel de downloads/
@ini_set('display_errors', '0');
error_reporting(0);
ob_start();

$response = [ 'exito' => false, 'mensaje' => '', 'insertados' => 0, 'python' => '' ];
try {
    $root = realpath(__DIR__ . '/..');
    if ($root === false) {
        throw new Exception('No se pudo resolver la ruta del proyecto');
    }
    $script = $root . DIRECTORY_SEPARATOR . 'import_excel_to_db.py';
    if (!file_exists($script)) {
        throw new Exception('No se encontró import_excel_to_db.py');
    }
    if (!function_exists('exec')) {
        throw new Exception('exec() deshabilitado en PHP');
    }
    putenv('PAQUETES_TABLE=paquetes_json');

    // Detectar Python de forma robusta en Windows
    $candidatos = [
        // Rutas absolutas comunes (ajusta/añade si conoces la tuya exacta)
        'C:\\Users\\JULIO DME\\AppData\\Local\\Programs\\Python\\Python313\\python.exe',
        'C:\\Users\\JULIO DME\\AppData\\Local\\Programs\\Python\\Python312\\python.exe',
        'C:\\Python313\\python.exe',
        'C:\\Python312\\python.exe',
        // Comandos en PATH
        'python',
        'py -3',
        'py'
    ];

    $salida = [];
    $codigo = 0;
    $raw = '';
    $elegido = '';
    $log = __DIR__ . '/import_paquetes.log';

    foreach ($candidatos as $cand) {
        // Construir comando respetando espacios y opciones
        if (preg_match('/\\\\|\//', $cand)) {
            // Ruta absoluta a ejecutable
            if (!file_exists($cand)) {
                @file_put_contents($log, '['.date('Y-m-d H:i:s')."] SKIP inexistente: $cand\n", FILE_APPEND);
                continue;
            }
            $cmd = '"' . $cand . '" ' . '"' . $script . '"' . ' 2>&1';
        } else {
            // Comando en PATH (puede incluir argumentos como "py -3")
            $cmd = $cand . ' ' . '"' . $script . '"' . ' 2>&1';
        }

        $salida = [];
        $codigo = 0;
        @file_put_contents($log, '['.date('Y-m-d H:i:s')."] PROBANDO: $cmd\n", FILE_APPEND);
        exec($cmd, $salida, $codigo);
        $raw = implode("\n", $salida);
        @file_put_contents($log, '['.date('Y-m-d H:i:s')."] CODE: $codigo\nOUT:\n$raw\n", FILE_APPEND);

        if ($codigo === 0) { $elegido = $cand; break; }
    }

    $response['python'] = $elegido ?: 'no_detectado';

    // El script imprime un JSON, intentamos parsearlo para responder coherente
    // Sanitizar posible BOM/bytes no UTF-8 y extraer JSON si viene mezclado
    $rawUtf8 = $raw;
    if (strncmp($rawUtf8, "\xEF\xBB\xBF", 3) === 0) {
        $rawUtf8 = substr($rawUtf8, 3);
    }
    $tmp = @iconv('UTF-8', 'UTF-8//IGNORE', $rawUtf8);
    if ($tmp !== false) { $rawUtf8 = $tmp; }
    if (!is_string($rawUtf8)) { $rawUtf8 = (string)$rawUtf8; }

    $data = json_decode($rawUtf8, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($data)) {
        $response = array_merge($response, $data);
        $response['exito'] = !empty($data['exito']);
    } else {
        // Intentar localizar fragmento JSON dentro de salida mixta
        $start = strpos($rawUtf8, '{');
        $end = strrpos($rawUtf8, '}');
        if ($start !== false && $end !== false && $end > $start) {
            $fragment = substr($rawUtf8, $start, $end - $start + 1);
            $dataFrag = json_decode($fragment, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($dataFrag)) {
                $response = array_merge($response, $dataFrag);
                $response['exito'] = !empty($dataFrag['exito']);
            } else {
                $response['exito'] = ($codigo === 0);
                $response['mensaje'] = ($codigo === 0 ? 'Importación completada' : 'Error en importación')
                    . '. Python: ' . ($elegido ?: 'no_detectado')
                    . ". Respuesta cruda:\n" . substr($rawUtf8, 0, 4000);
            }
        } else {
            $response['exito'] = ($codigo === 0);
            $response['mensaje'] = ($codigo === 0 ? 'Importación completada' : 'Error en importación')
                . '. Python: ' . ($elegido ?: 'no_detectado')
                . ". Respuesta cruda:\n" . substr($rawUtf8, 0, 4000);
        }
    }
} catch (Throwable $e) {
    $response['exito'] = false;
    $response['mensaje'] = 'Error: ' . $e->getMessage();
}

// Construir cuerpo JSON y luego enviar cabeceras
$body = json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
if ($body === false) {
    $fallback = [
        'exito' => false,
        'mensaje' => 'La respuesta contenía caracteres inválidos. Se sanitizó la salida. Revise import_paquetes.log para más detalles.',
        'python' => ($response['python'] ?? 'desconocido')
    ];
    $body = json_encode($fallback, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
header('Content-Type: application/json; charset=utf-8');
header('Content-Length: ' . strlen($body));
@ob_end_clean();
echo $body;