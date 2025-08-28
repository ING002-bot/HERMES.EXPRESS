<?php
session_start();
session_destroy();
echo json_encode(['exito' => true, 'mensaje' => 'Sesión cerrada']);
?>
