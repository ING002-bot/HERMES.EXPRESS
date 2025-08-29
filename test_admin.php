<?php
// Script de prueba para verificar funciones de admin.php
require_once 'php/config.php';

// Simular sesión de admin
session_start();
$_SESSION['usuario_id'] = 1;
$_SESSION['tipo'] = 'admin';

echo "<h2>Prueba de Funciones CRUD</h2>";

// Probar crear paquete
echo "<h3>1. Crear Paquete</h3>";
$_POST = [
    'accion' => 'nuevo_paquete',
    'remitente' => 'Test Remitente',
    'destinatario' => 'Test Destinatario',
    'direccion_origen' => 'Calle Test 123',
    'direccion_destino' => 'Avenida Test 456',
    'peso' => '2.5',
    'precio' => '15000'
];

try {
    ob_start();
    include 'php/admin.php';
    $output = ob_get_clean();
    echo "Resultado: " . $output . "<br>";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "<br>";
}

// Probar crear empleado
echo "<h3>2. Crear Empleado</h3>";
$_POST = [
    'accion' => 'nuevo_empleado',
    'nombre' => 'Test Empleado',
    'usuario' => 'test_emp_' . time(),
    'email' => 'test@test.com',
    'clave' => '123456',
    'tipo' => 'empleado'
];

try {
    ob_start();
    include 'php/admin.php';
    $output = ob_get_clean();
    echo "Resultado: " . $output . "<br>";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "<br>";
}

// Probar crear vehículo
echo "<h3>3. Crear Vehículo</h3>";
$_POST = [
    'accion' => 'nuevo_vehiculo',
    'placa' => 'TEST-' . rand(100, 999),
    'marca' => 'Toyota',
    'modelo' => 'Hiace',
    'capacidad' => '1500',
    'estado' => 'disponible'
];

try {
    ob_start();
    include 'php/admin.php';
    $output = ob_get_clean();
    echo "Resultado: " . $output . "<br>";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "<br>";
}

// Probar crear ruta
echo "<h3>4. Crear Ruta</h3>";
$_POST = [
    'accion' => 'nueva_ruta',
    'nombre' => 'Ruta Test',
    'origen' => 'Centro Test',
    'destino' => 'Norte Test',
    'distancia' => '15.5',
    'tiempo_estimado' => '45'
];

try {
    ob_start();
    include 'php/admin.php';
    $output = ob_get_clean();
    echo "Resultado: " . $output . "<br>";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "<br>";
}

echo "<h3>5. Verificar Conexión BD</h3>";
try {
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM usuarios");
    $result = $stmt->fetch();
    echo "Usuarios en BD: " . $result['total'] . "<br>";
    
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll();
    echo "Tablas disponibles: ";
    foreach ($tables as $table) {
        echo $table[0] . " ";
    }
    echo "<br>";
} catch (Exception $e) {
    echo "Error BD: " . $e->getMessage() . "<br>";
}
?>
