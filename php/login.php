<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $usuario = limpiarDato($_POST['usuario']);
    $clave = $_POST['clave'];
    
    // Permitir acceso directo sin credenciales
    if (empty($usuario) && empty($clave)) {
        // Acceso como admin por defecto
        $_SESSION['id'] = 1;
        $_SESSION['nombre'] = 'Administrador';
        $_SESSION['usuario'] = 'admin';
        $_SESSION['tipo'] = 'admin';
        
        echo json_encode([
            'exito' => true,
            'mensaje' => 'Acceso directo como administrador',
            'redireccion' => 'paneladmin.html',
            'usuario' => [
                'nombre' => 'Administrador',
                'tipo' => 'admin'
            ]
        ]);
        exit;
    }
    
    // Acceso directo por tipo de usuario
    if (empty($clave)) {
        if ($usuario === 'admin') {
            $_SESSION['id'] = 1;
            $_SESSION['nombre'] = 'Administrador';
            $_SESSION['usuario'] = 'admin';
            $_SESSION['tipo'] = 'admin';
            
            echo json_encode([
                'exito' => true,
                'mensaje' => 'Acceso directo como administrador',
                'redireccion' => 'paneladmin.html',
                'usuario' => [
                    'nombre' => 'Administrador',
                    'tipo' => 'admin'
                ]
            ]);
            exit;
        } elseif ($usuario === 'empleado') {
            $_SESSION['id'] = 2;
            $_SESSION['nombre'] = 'Empleado Demo';
            $_SESSION['usuario'] = 'empleado';
            $_SESSION['tipo'] = 'empleado';
            
            echo json_encode([
                'exito' => true,
                'mensaje' => 'Acceso directo como empleado',
                'redireccion' => 'panelempleado.html',
                'usuario' => [
                    'nombre' => 'Empleado Demo',
                    'tipo' => 'empleado'
                ]
            ]);
            exit;
        } else {
            // Acceso al dashboard general
            $_SESSION['id'] = 3;
            $_SESSION['nombre'] = 'Usuario General';
            $_SESSION['usuario'] = 'usuario';
            $_SESSION['tipo'] = 'usuario';
            
            echo json_encode([
                'exito' => true,
                'mensaje' => 'Acceso al dashboard general',
                'redireccion' => 'dashboard.html',
                'usuario' => [
                    'nombre' => 'Usuario General',
                    'tipo' => 'usuario'
                ]
            ]);
            exit;
        }
    }
    
    // Login tradicional con credenciales
    try {
        $stmt = $pdo->prepare("SELECT id, nombre, usuario, clave, tipo FROM usuarios WHERE usuario = ? AND activo = 1");
        $stmt->execute([$usuario]);
        $usuarioData = $stmt->fetch();
        
        if ($usuarioData && password_verify($clave, $usuarioData['clave'])) {
            $_SESSION['id'] = $usuarioData['id'];
            $_SESSION['nombre'] = $usuarioData['nombre'];
            $_SESSION['usuario'] = $usuarioData['usuario'];
            $_SESSION['tipo'] = $usuarioData['tipo'];
            
            $redireccion = ($usuarioData['tipo'] === 'admin') ? 'paneladmin.html' : 
                          (($usuarioData['tipo'] === 'empleado') ? 'panelempleado.html' : 'dashboard.html');
            
            echo json_encode([
                'exito' => true,
                'mensaje' => 'Login exitoso',
                'redireccion' => $redireccion,
                'usuario' => [
                    'nombre' => $usuarioData['nombre'],
                    'tipo' => $usuarioData['tipo']
                ]
            ]);
        } else {
            echo json_encode(['exito' => false, 'mensaje' => 'Usuario o contraseña incorrectos']);
        }
    } catch(PDOException $e) {
        echo json_encode(['exito' => false, 'mensaje' => 'Error en el servidor']);
    }
} else {
    echo json_encode(['exito' => false, 'mensaje' => 'Método no permitido']);
}
?>