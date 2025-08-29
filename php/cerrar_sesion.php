<?php
session_start();
session_destroy();

// Headers para prevenir cache y navegación hacia atrás
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
header('Location: ../login.html');
exit;
?>
