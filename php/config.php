<?php
// Configuración de base de datos para Hermes Express
$servidor = "localhost";
$usuario_db = "root";
$clave_db = "";
$base_datos = "hermes_express";

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
