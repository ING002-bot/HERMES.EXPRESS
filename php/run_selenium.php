<?php
@ini_set('display_errors', '0');
error_reporting(0);
ob_start();

$logFile = __DIR__ . '/run_selenium.log';
function log_line($msg) {
    global $logFile;
    @file_put_contents($logFile, '['.date('Y-m-d H:i:s')."] $msg\n", FILE_APPEND);
}

$response = ['exito'=>false,'mensaje'=>'','salida'=>''];

try {
    $root = realpath(__DIR__ . '/..');
    if ($root === false) throw new Exception('No se pudo resolver la ruta raíz');

    $script = $root . DIRECTORY_SEPARATOR . 'selenium_utils.py';
    if (!file_exists($script)) throw new Exception('No se encontró selenium_utils.py');

    if (!function_exists('exec')) throw new Exception('exec() deshabilitado en PHP');

// Ruta absoluta (la tuya que sí funciona en CMD)
$python = 'C:\\Users\\JULIO DME\\AppData\\Local\\Programs\\Python\\Python313\\python.exe';

// Usa comillas dobles explícitas para Windows (NO escapeshellcmd/arg aquí)
$cmd = '"' . $python . '" "' . $script . '" 2>&1';
log_line("CMD: $cmd");

$salida = [];
$codigo = 0;
exec($cmd, $salida, $codigo);

    log_line("CODE: $codigo");
    log_line("OUT:\n" . implode("\n", $salida));

    $response['salida'] = implode("\n", $salida);
    if ($codigo === 0) {
        $response['exito'] = true;
        $response['mensaje'] = 'Ejecución completada. Revisa downloads/';
    } else {
        $response['exito'] = false;
        $response['mensaje'] = 'El script finalizó con código ' . $codigo;
    }
} catch (Throwable $e) {
    $response['exito'] = false;
    $response['mensaje'] = 'Error al ejecutar: ' . $e->getMessage();
    log_line('ERROR: ' . $e->getMessage());
}

$body = json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
header('Content-Type: application/json; charset=utf-8');
@ob_end_clean();
echo $body;
/* 
$response = [
    'exito' => false,
    'mensaje' => '',
    'salida' => ''
];

try {
    $root = realpath(__DIR__ . '/..');
    if ($root === false) {
        throw new Exception('No se pudo resolver la ruta raíz del proyecto');
    }

    $script = $root . DIRECTORY_SEPARATOR . 'selenium_utils.py';
    if (!file_exists($script)) {
        throw new Exception('No se encontró selenium_utils.py en la raíz del proyecto');
    }

    if (!function_exists('exec')) {
        throw new Exception('exec() deshabilitado en PHP');
    }

    // Ruta del intérprete (ajusta si es necesario)
    $python = 'python';
    // $python = 'C:\\Users\\TU_USUARIO\\AppData\\Local\\Programs\\Python\\Python312\\python.exe';

    // Ejecutar el script
    $cmd = escapeshellcmd($python) . ' ' . escapeshellarg($script) . ' 2>&1';
    $salida = [];
    $codigo = 0;
    exec($cmd, $salida, $codigo);

    $response['salida'] = implode("\n", $salida);
    if ($codigo === 0) {
        $response['exito'] = true;
        $response['mensaje'] = 'Ejecución completada. Revisa downloads/';
    } else {
        $response['exito'] = false;
        $response['mensaje'] = 'El script finalizó con código ' . $codigo;
    }
} catch (Throwable $e) {
    $response['exito'] = false;
    $response['mensaje'] = 'Error al ejecutar: ' . $e->getMessage();
}

// ÚNICA salida JSON limpia
$body = json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
header('Content-Type: application/json; charset=utf-8');
header('Content-Length: ' . strlen($body));
@ob_end_clean(); // limpia cualquier cosa previa
echo $body;
*/