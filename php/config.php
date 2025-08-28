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
    die("Error de conexión: " . $e->getMessage());
}

// Función para verificar sesión
function verificar_sesion() {
    session_start();
    if (!isset($_SESSION['usuario_id'])) {
        header("Location: ../login.html");
        exit();
    }
}

// Función para verificar si es admin
function es_admin() {
    return isset($_SESSION['tipo']) && $_SESSION['tipo'] === 'admin';
}

// Función para limpiar datos
function limpiar_dato($dato) {
    return htmlspecialchars(strip_tags(trim($dato)));
}
?>
