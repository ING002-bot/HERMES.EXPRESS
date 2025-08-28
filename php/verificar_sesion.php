<?php
require_once 'config.php';

// Crear sesión automática si no existe
if (!isset($_SESSION['id'])) {
    $_SESSION['id'] = 1;
    $_SESSION['nombre'] = 'Administrador';
    $_SESSION['usuario'] = 'admin';
    $_SESSION['tipo'] = 'admin';
}

echo json_encode([
    'exito' => true,
    'usuario' => [
        'id' => $_SESSION['id'],
        'nombre' => $_SESSION['nombre'],
        'usuario' => $_SESSION['usuario'],
        'tipo' => $_SESSION['tipo']
    ]
]);
?>
