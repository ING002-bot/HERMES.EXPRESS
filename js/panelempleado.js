// Variables globales para empleados
let datosEmpleado = {};
let misPaquetes = [];
let miVehiculo = {};
let miRuta = {};

// Inicializar cuando carga la página
document.addEventListener('DOMContentLoaded', function() {
    verificarSesion();
    cargarDatosEmpleado();
    configurarEventosEmpleado();
});

// Verificar sesión del empleado (deshabilitado)
function verificarSesion() {
    // Crear datos de empleado por defecto
    datosEmpleado = {
        id: 2,
        nombre: 'Empleado Demo',
        usuario: 'empleado',
        tipo: 'empleado'
    };
    document.getElementById('nombreUsuario').textContent = 'Empleado Demo';
}

// Cargar datos específicos del empleado
function cargarDatosEmpleado() {
    cargarResumenEmpleado();
    cargarMisPaquetes();
    cargarMiVehiculo();
    cargarMiRuta();
    cargarTareasHoy();
    cargarEstadisticasEmpleado();
}

// Cargar resumen del empleado
function cargarResumenEmpleado() {
    fetch('php/empleado.php?accion=resumen')
        .then(response => response.json())
        .then(data => {
            if (data.exito) {
                document.getElementById('misPaquetes').textContent = data.datos.mis_paquetes;
                document.getElementById('enRuta').textContent = data.datos.en_ruta;
                document.getElementById('entregadosHoy').textContent = data.datos.entregados_hoy;
                document.getElementById('pendientes').textContent = data.datos.pendientes;
            }
        })
        .catch(error => console.error('Error:', error));
}

// Cargar mis paquetes
function cargarMisPaquetes() {
    fetch('php/empleado.php?accion=mis_paquetes')
        .then(response => response.json())
        .then(data => {
            if (data.exito) {
                misPaquetes = data.datos;
                mostrarMisPaquetes(misPaquetes);
            }
        })
        .catch(error => console.error('Error:', error));
}

// Mostrar mis paquetes en la tabla
function mostrarMisPaquetes(paquetes) {
    const tbody = document.getElementById('cuerpoTablaMisPaquetes');
    tbody.innerHTML = '';
    
    paquetes.forEach(paquete => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${paquete.codigo}</td>
            <td>${paquete.destinatario}</td>
            <td>${paquete.direccion_destino}</td>
            <td><span class="estado estado-${paquete.estado}">${formatearEstado(paquete.estado)}</span></td>
            <td>${paquete.peso} kg</td>
            <td>${formatearFecha(paquete.fecha_envio)}</td>
            <td>
                <button class="btn btn-pequeno btn-primario" onclick="iniciarEntrega('${paquete.codigo}')">Entregar</button>
                <button class="btn btn-pequeno btn-secundario" onclick="verDetallePaquete(${paquete.id})">Ver</button>
            </td>
        `;
        tbody.appendChild(fila);
    });
}

// Cargar información del vehículo asignado
function cargarMiVehiculo() {
    fetch('php/empleado.php?accion=mi_vehiculo')
        .then(response => response.json())
        .then(data => {
            if (data.exito && data.datos) {
                miVehiculo = data.datos;
                mostrarMiVehiculo(data.datos);
            } else {
                mostrarSinVehiculo();
            }
        })
        .catch(error => console.error('Error:', error));
}

// Mostrar información del vehículo
function mostrarMiVehiculo(vehiculo) {
    const container = document.getElementById('infoVehiculo');
    container.innerHTML = `
        <div class="vehiculo-card">
            <h4>${vehiculo.placa}</h4>
            <p><strong>Marca:</strong> ${vehiculo.marca} ${vehiculo.modelo}</p>
            <p><strong>Capacidad:</strong> ${vehiculo.capacidad} kg</p>
            <p><strong>Estado:</strong> <span class="estado estado-${vehiculo.estado}">${formatearEstado(vehiculo.estado)}</span></p>
        </div>
    `;
}

// Mostrar cuando no hay vehículo asignado
function mostrarSinVehiculo() {
    const container = document.getElementById('infoVehiculo');
    container.innerHTML = `
        <div class="vehiculo-card">
            <h4>Sin Vehículo Asignado</h4>
            <p>Contacta al administrador para asignación de vehículo</p>
        </div>
    `;
}

// Cargar tareas del día
function cargarTareasHoy() {
    const tareas = [
        {
            titulo: 'Entregar paquete HE001',
            descripcion: 'Dirección: Calle 1 #123',
            prioridad: 'alta',
            tiempo: '09:00 AM'
        },
        {
            titulo: 'Recoger paquetes en centro',
            descripcion: 'Punto de recolección principal',
            prioridad: 'media',
            tiempo: '11:30 AM'
        },
        {
            titulo: 'Entregar paquete HE002',
            descripcion: 'Dirección: Carrera 5 #456',
            prioridad: 'baja',
            tiempo: '02:00 PM'
        }
    ];
    
    mostrarTareas(tareas);
}

// Mostrar tareas
function mostrarTareas(tareas) {
    const container = document.getElementById('listaTareas');
    container.innerHTML = '';
    
    tareas.forEach(tarea => {
        const div = document.createElement('div');
        div.className = `tarea-item ${tarea.prioridad === 'alta' ? 'tarea-urgente' : ''}`;
        div.innerHTML = `
            <div class="tarea-info">
                <h4>${tarea.titulo}</h4>
                <p>${tarea.descripcion}</p>
                <small>⏰ ${tarea.tiempo}</small>
            </div>
            <span class="tarea-prioridad prioridad-${tarea.prioridad}">${tarea.prioridad.toUpperCase()}</span>
        `;
        container.appendChild(div);
    });
}

// Cargar mi ruta del día
function cargarMiRuta() {
    const rutaEjemplo = {
        nombre: 'Ruta Centro-Norte',
        distancia_total: '45.2 km',
        tiempo_estimado: '4h 30min',
        paradas: 8,
        completadas: 3
    };
    
    mostrarDetallesRuta(rutaEjemplo);
    cargarEntregasProgramadas();
}

// Mostrar detalles de la ruta
function mostrarDetallesRuta(ruta) {
    const container = document.getElementById('detallesRuta');
    container.innerHTML = `
        <div class="detalle-item">
            <h4>${ruta.distancia_total}</h4>
            <p>Distancia Total</p>
        </div>
        <div class="detalle-item">
            <h4>${ruta.tiempo_estimado}</h4>
            <p>Tiempo Estimado</p>
        </div>
        <div class="detalle-item">
            <h4>${ruta.paradas}</h4>
            <p>Total Paradas</p>
        </div>
        <div class="detalle-item">
            <h4>${ruta.completadas}</h4>
            <p>Completadas</p>
        </div>
    `;
}

// Cargar entregas programadas
function cargarEntregasProgramadas() {
    const entregas = [
        {
            codigo: 'HE001',
            destinatario: 'Ana Martínez',
            direccion: 'Calle 1 #123',
            distancia: '2.5 km',
            estado: 'pendiente'
        },
        {
            codigo: 'HE002',
            destinatario: 'Carlos López',
            direccion: 'Carrera 5 #456',
            distancia: '5.8 km',
            estado: 'en_transito'
        }
    ];
    
    mostrarEntregasProgramadas(entregas);
}

// Mostrar entregas programadas
function mostrarEntregasProgramadas(entregas) {
    const container = document.getElementById('listaEntregas');
    container.innerHTML = '';
    
    entregas.forEach(entrega => {
        const div = document.createElement('div');
        div.className = 'entrega-item';
        div.innerHTML = `
            <div class="entrega-info">
                <h4>${entrega.codigo} - ${entrega.destinatario}</h4>
                <p>📍 ${entrega.direccion}</p>
                <p><span class="estado estado-${entrega.estado}">${formatearEstado(entrega.estado)}</span></p>
            </div>
            <div class="entrega-distancia">${entrega.distancia}</div>
        `;
        container.appendChild(div);
    });
}

// Cargar estadísticas del empleado
function cargarEstadisticasEmpleado() {
    const estadisticas = [
        { titulo: '45', descripcion: 'Entregas este mes' },
        { titulo: '98%', descripcion: 'Tasa de éxito' },
        { titulo: '4.8', descripcion: 'Calificación promedio' },
        { titulo: '12', descripcion: 'Días trabajados' }
    ];
    
    mostrarEstadisticas(estadisticas);
}

// Mostrar estadísticas
function mostrarEstadisticas(estadisticas) {
    const container = document.getElementById('estadisticasContainer');
    container.innerHTML = '';
    
    estadisticas.forEach(stat => {
        const div = document.createElement('div');
        div.className = 'estadistica-item';
        div.innerHTML = `
            <h4>${stat.titulo}</h4>
            <p>${stat.descripcion}</p>
        `;
        container.appendChild(div);
    });
}

// Configurar eventos específicos del empleado
function configurarEventosEmpleado() {
    // Búsqueda de mis paquetes
    document.getElementById('buscarMiPaquete').addEventListener('input', filtrarMisPaquetes);
    document.getElementById('filtroMiEstado').addEventListener('change', filtrarMisPaquetes);
    
    // Formulario de entrega
    document.getElementById('formEntrega').addEventListener('submit', confirmarEntrega);
    
    // Formulario de perfil
    document.getElementById('formPerfil').addEventListener('submit', actualizarPerfil);
}

// Filtrar mis paquetes
function filtrarMisPaquetes() {
    const busqueda = document.getElementById('buscarMiPaquete').value.toLowerCase();
    const estado = document.getElementById('filtroMiEstado').value;
    
    let paquetesFiltrados = misPaquetes.filter(paquete => {
        const coincideBusqueda = paquete.codigo.toLowerCase().includes(busqueda) ||
                                paquete.destinatario.toLowerCase().includes(busqueda);
        
        const coincidenEstado = !estado || paquete.estado === estado;
        
        return coincideBusqueda && coincidenEstado;
    });
    
    mostrarMisPaquetes(paquetesFiltrados);
}

// Mostrar sección específica
function mostrarSeccion(seccion) {
    // Ocultar todas las secciones
    document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
    
    // Mostrar sección seleccionada
    document.getElementById(`seccion-${seccion}`).classList.add('activa');
    
    // Actualizar menú
    document.querySelectorAll('.menu a').forEach(a => a.classList.remove('activo'));
    document.querySelector(`[onclick="mostrarSeccion('${seccion}')"]`).classList.add('activo');
    
    // Actualizar título
    const titulos = {
        'inicio': 'Panel de Empleado',
        'mis-paquetes': 'Mis Paquetes',
        'entregar': 'Confirmar Entrega',
        'ruta': 'Mi Ruta del Día',
        'perfil': 'Mi Perfil'
    };
    document.getElementById('tituloSeccion').textContent = titulos[seccion];
}

// Iniciar entrega desde tabla
function iniciarEntrega(codigo) {
    document.getElementById('codigoEntrega').value = codigo;
    mostrarSeccion('entregar');
}

// Confirmar entrega
function confirmarEntrega(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('accion', 'confirmar_entrega');
    formData.append('codigo', document.getElementById('codigoEntrega').value);
    formData.append('receptor', document.getElementById('nombreReceptor').value);
    formData.append('documento', document.getElementById('documentoReceptor').value);
    formData.append('observaciones', document.getElementById('observaciones').value);
    
    const archivo = document.getElementById('fotoEntrega').files[0];
    if (archivo) {
        formData.append('foto', archivo);
    }
    
    fetch('php/empleado.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.exito) {
            mostrarNotificacion('Entrega confirmada exitosamente', 'exito');
            limpiarFormEntrega();
            cargarMisPaquetes();
            cargarResumenEmpleado();
        } else {
            mostrarNotificacion(data.mensaje, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('Error al confirmar entrega', 'error');
    });
}

// Limpiar formulario de entrega
function limpiarFormEntrega() {
    document.getElementById('formEntrega').reset();
}

// Escanear código (simulado)
function escanearCodigo() {
    mostrarNotificacion('Función de escáner - Por implementar', 'info');
}

// Iniciar ruta
function iniciarRuta() {
    if (confirm('¿Iniciar ruta del día?')) {
        mostrarNotificacion('Ruta iniciada', 'exito');
    }
}

// Reportar problema
function reportarProblema() {
    const problema = prompt('Describe el problema:');
    if (problema) {
        mostrarNotificacion('Problema reportado al administrador', 'exito');
    }
}

// Actualizar estado
function actualizarEstado() {
    cargarDatosEmpleado();
    mostrarNotificacion('Estado actualizado', 'exito');
}

// Ver notificaciones
function verNotificaciones() {
    mostrarNotificacion('Panel de notificaciones - Por implementar', 'info');
}

// Actualizar perfil
function actualizarPerfil(e) {
    e.preventDefault();
    
    const nuevaClave = document.getElementById('nuevaClave').value;
    const confirmarClave = document.getElementById('confirmarClave').value;
    
    if (nuevaClave && nuevaClave !== confirmarClave) {
        mostrarNotificacion('Las contraseñas no coinciden', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('accion', 'actualizar_perfil');
    formData.append('email', document.getElementById('perfilEmail').value);
    if (nuevaClave) {
        formData.append('nueva_clave', nuevaClave);
    }
    
    fetch('php/empleado.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.exito) {
            mostrarNotificacion('Perfil actualizado exitosamente', 'exito');
            document.getElementById('nuevaClave').value = '';
            document.getElementById('confirmarClave').value = '';
        } else {
            mostrarNotificacion(data.mensaje, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('Error al actualizar perfil', 'error');
    });
}

// Ver detalle de paquete
function verDetallePaquete(id) {
    mostrarNotificacion('Detalle de paquete - Por implementar', 'info');
}

// Cerrar sesión (deshabilitado)
function cerrarSesion() {
    if (confirm('¿Estás seguro de que quieres salir?')) {
        alert('Función de cerrar sesión deshabilitada');
    }
}

// Funciones auxiliares reutilizadas
function formatearEstado(estado) {
    const estados = {
        'pendiente': 'Pendiente',
        'en_transito': 'En Tránsito',
        'entregado': 'Entregado',
        'devuelto': 'Devuelto'
    };
    return estados[estado] || estado;
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-CO');
}

function mostrarNotificacion(mensaje, tipo) {
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
    notificacion.textContent = mensaje;
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1001;
        animation: slideIn 0.3s ease;
        background: ${tipo === 'exito' ? '#28a745' : tipo === 'error' ? '#dc3545' : '#17a2b8'};
    `;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.remove();
    }, 3000);
}
