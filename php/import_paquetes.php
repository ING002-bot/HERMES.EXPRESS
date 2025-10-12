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
    $data = json_decode($raw, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($data)) {
        $response = array_merge($response, $data);
        $response['exito'] = !empty($data['exito']);
    } else {
        // Si no pudimos decodificar, devolvemos la salida cruda y pista del Python usado
        $response['exito'] = ($codigo === 0);
        $response['mensaje'] = ($codigo === 0 ? 'Importación completada' : 'Error en importación')
            . '. Python: ' . ($elegido ?: 'no_detectado')
            . ". Respuesta cruda:\n" . $raw;
    }
} catch (Throwable $e) {
    $response['exito'] = false;
    $response['mensaje'] = 'Error: ' . $e->getMessage();
}

// Construir cuerpo JSON y luego enviar cabeceras
$body = json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
header('Content-Type: application/json; charset=utf-8');
header('Content-Length: ' . strlen($body));
@ob_end_clean();
echo $body;