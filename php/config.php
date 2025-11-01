<?php
// Configuración de base de datos para Hermes Express
$servidor = 'localhost';
$usuario_db = 'root';
$clave_db = '';
$base_datos = 'hermes_express';

// Configuración de WhatsApp (usando Twilio)
$twilio_account_sid = 'AC8ccfd5ecd15ff03826bb86724f5747e6';
$twilio_auth_token = '23ea2f2d07def6bb9b9f1b9fa7b02b3b';
$twilio_whatsapp_number = '+14155238886';

// Configuración de directorios
$downloads_dir = __DIR__ . '/../downloads';
$processed_dir = __DIR__ . '/../processed';
$logs_dir = __DIR__ . '/../logs';
$reports_dir = __DIR__ . '/../reports';

// Crear directorios si no existen
$directories = [$downloads_dir, $processed_dir, $logs_dir, $reports_dir];
foreach ($directories as $dir) {
    if (!file_exists($dir)) {
        mkdir($dir, 0755, true);
    }
}

try {
    $pdo = new PDO("mysql:host=$servidor;dbname=$base_datos;charset=utf8", $usuario_db, $clave_db);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    header('Content-Type: application/json');
    die(json_encode(['exito' => false, 'mensaje' => 'Error de conexión a la base de datos']));
}

// Función para verificar si es admin
function es_admin() {
    return isset($_SESSION['tipo']) && $_SESSION['tipo'] === 'admin';
}

// Función para limpiar datos
function limpiar_dato($dato) {
    $dato = trim($dato);
    $dato = stripslashes($dato);
    $dato = htmlspecialchars($dato);
    return $dato;
}
?>
