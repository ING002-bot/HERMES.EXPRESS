<?php
// php/import_paquetes.php
// Ejecuta import_excel_to_db.py para insertar en MySQL el último Excel de downloads/
@ini_set('display_errors', '0');
error_reporting(0);
ob_start();

$response = [ 'exito' => false, 'mensaje' => '', 'insertados' => 0 ];

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
    
    $python = 'C:\\Users\\JULIO DME\\AppData\\Local\\Programs\\Python\\Python313\\python.exe';    // Puedes forzar una ruta absoluta si es necesario.
    $cmd = escapeshellarg($python) . ' ' . escapeshellarg($script) . ' 2>&1';
    $salida = [];
    $codigo = 0;
    $log = __DIR__ . '/import_paquetes.log';
    @file_put_contents($log, '['.date('Y-m-d H:i:s')."] CMD: $cmd\n", FILE_APPEND);
    exec($cmd, $salida, $codigo);
    @file_put_contents($log, '['.date('Y-m-d H:i:s')."] CODE: $codigo\nOUT:\n".implode("\n",$salida)."\n", FILE_APPEND);
    $raw = implode("\n", $salida);

    // El script imprime un JSON, intentamos parsearlo para responder coherente
    $data = json_decode($raw, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($data)) {
        $response = array_merge($response, $data);
        $response['exito'] = !empty($data['exito']);
    } else {
        // Si no pudimos decodificar, devolvemos la salida cruda
        $response['exito'] = ($codigo === 0);
        $response['mensaje'] = ($codigo === 0 ? 'Importación completada' : 'Error en importación') . '. Respuesta cruda:
' . $raw;
    }
} catch (Throwable $e) {
    $response['exito'] = false;
    $response['mensaje'] = 'Error: ' . $e->getMessage();
}

$body = json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
header('Content-Type: application/json; charset=utf-8');
header('Content-Length: ' . strlen($body));
@ob_end_clean();
echo $body;