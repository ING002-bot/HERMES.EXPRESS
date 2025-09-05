<?php
// Iniciar la sesión si no está iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Destruir todas las variables de sesión
$_SESSION = array();

// Obtener parámetros de la cookie de sesión
$session_cookie_params = session_get_cookie_params();

// Eliminar la cookie de sesión
if (ini_get("session.use_cookies")) {
    setcookie(
        session_name(),
        '',
        time() - 3600,
        $session_cookie_params["path"],
        $session_cookie_params["domain"],
        $session_cookie_params["secure"],
        $session_cookie_params["httponly"]
    );
}

// Destruir la sesión
session_unset();
session_destroy();

// Limpiar cualquier cookie de sesión que pueda quedar
if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time() - 3600, '/');
}

// Limpiar cookies específicas de la aplicación
setcookie('PHPSESSID', '', time() - 3600, '/');
setcookie('recordar_sesion', '', time() - 3600, '/');

// Headers para prevenir cache y navegación hacia atrás
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');
header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');

// Redirigir al login
header('Location: ../login.html');
exit;
?>
