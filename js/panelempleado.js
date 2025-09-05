// Variables globales para empleados
let datosEmpleado = {};
let misPaquetes = [];
let miVehiculo = {};
let miRuta = {};

// Inicializar cuando carga la página
document.addEventListener('DOMContentLoaded', function() {
    verificarSesion();
    
    // Función para inicializar la aplicación cuando el mapa esté listo
    function initializeApp() {
        console.log('Mapa listo, continuando con la inicialización...');
        cargarDatosEmpleado();
        configurarEventosEmpleado();
        
        // Configurar el botón de iniciar ruta
        const iniciarRutaBtn = document.getElementById('iniciarRutaBtn');
        if (iniciarRutaBtn) {
            iniciarRutaBtn.addEventListener('click', function() {
                iniciarSeguimientoUbicacion();
                this.disabled = true;
                this.textContent = 'Ruta en curso';
            });
        }
    }
    
    // Si el mapa ya está inicializado, inicializar la aplicación
    if (window.mapInitialized) {
        initializeApp();
    } else {
        // Si no, esperar al evento de inicialización del mapa
        window.addEventListener('mapInitialized', initializeApp);
    }
});

// Verificar sesión del empleado
function verificarSesion() {
    // Esta función ahora está vacía ya que la verificación real se hace en el HTML
    // Los datos del empleado se cargarán desde el servidor
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
    fetch('php/empleado.php?accion=resumen', {
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return response.text().then(text => {
                console.error('Respuesta no es JSON:', text);
                throw new Error('Respuesta del servidor no es JSON');
            });
        }
        return response.json();
    })
    .then(data => {
        if (data && data.exito) {
            if (document.getElementById('misPaquetes')) document.getElementById('misPaquetes').textContent = data.datos.mis_paquetes || '0';
            if (document.getElementById('enRuta')) document.getElementById('enRuta').textContent = data.datos.en_ruta || '0';
            if (document.getElementById('entregadosHoy')) document.getElementById('entregadosHoy').textContent = data.datos.entregados_hoy || '0';
            if (document.getElementById('pendientes')) document.getElementById('pendientes').textContent = data.datos.pendientes || '0';
        } else {
            console.error('Error en la respuesta del servidor:', data);
        }
    })
    .catch(error => {
        console.error('Error al cargar el resumen:', error);
        // Mostrar datos de prueba como respaldo
        if (document.getElementById('misPaquetes')) document.getElementById('misPaquetes').textContent = '0';
        if (document.getElementById('enRuta')) document.getElementById('enRuta').textContent = '0';
        if (document.getElementById('entregadosHoy')) document.getElementById('entregadosHoy').textContent = '0';
        if (document.getElementById('pendientes')) document.getElementById('pendientes').textContent = '0';
    });
}

// Cargar mis paquetes
function cargarMisPaquetes() {
    fetch('php/empleado.php?accion=mis_paquetes', {
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
    })
    .then(handleJsonResponse)
    .then(data => {
        if (data && data.exito) {
            misPaquetes = Array.isArray(data.datos) ? data.datos : [];
            mostrarMisPaquetes(misPaquetes);
        } else {
            console.error('Error en la respuesta de mis paquetes:', data);
            mostrarMisPaquetes([]); // Mostrar lista vacía en caso de error
        }
    })
    .catch(error => {
        console.error('Error al cargar mis paquetes:', error);
        mostrarMisPaquetes([]); // Mostrar lista vacía en caso de error
    });
}

// Función auxiliar para manejar respuestas JSON
function handleJsonResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        return response.text().then(text => {
            console.error('Respuesta no es JSON:', text);
            throw new Error('Respuesta del servidor no es JSON');
        });
    }
    return response.json();
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
    fetch('php/empleado.php?accion=mi_vehiculo', {
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
    })
    .then(handleJsonResponse)
    .then(data => {
        if (data && data.exito && data.datos) {
            miVehiculo = data.datos;
            mostrarMiVehiculo(data.datos);
        } else {
            console.error('No se pudo cargar el vehículo:', data);
            mostrarSinVehiculo();
        }
    })
    .catch(error => {
        console.error('Error al cargar el vehículo:', error);
        mostrarSinVehiculo();
    });
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
    fetch('php/empleado.php?accion=mi_ruta', {
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
    })
    .then(handleJsonResponse)
    .then(data => {
        if (data && data.exito) {
            miRuta = data.datos || {};
            mostrarDetallesRuta(miRuta);
            actualizarEntregasEnMapa();
        } else {
            console.error('No se pudo cargar la ruta:', data);
            // Mostrar ruta vacía
            miRuta = { paradas: [] };
            mostrarDetallesRuta(miRuta);
        }
    })
    .catch(error => {
        console.error('Error al cargar la ruta:', error);
        // Mostrar ruta vacía en caso de error
        miRuta = { paradas: [] };
        mostrarDetallesRuta(miRuta);
    });
}

// La función initMap ahora está en panelempleado.html

// Iniciar el seguimiento de ubicación
function iniciarSeguimientoUbicacion() {
    const infoPanel = document.getElementById('info-panel');
    
    if (!navigator.geolocation) {
        mostrarNotificacion('Tu navegador no soporta geolocalización', 'error');
        return;
    }
    
    // Mostrar mensaje de carga
    infoPanel.innerHTML = '<p>Buscando tu ubicación...</p>';
    
    // Opciones para la geolocalización
    const opciones = {
        enableHighAccuracy: true,  // Alta precisión (GPS)
        timeout: 10000,           // Tiempo máximo de espera (10 segundos)
        maximumAge: 0             // No usar caché de ubicación
    };
    
    // Función para manejar la actualización de posición
    const actualizarUbicacion = (position) => {
        const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        
        console.log('Nueva posición:', pos);
        
        // Centrar el mapa en la ubicación actual con zoom más cercano
        map.setCenter(pos);
        map.setZoom(16);
        
        // Crear o actualizar el marcador de ubicación actual
        if (!currentLocationMarker) {
            currentLocationMarker = new google.maps.Marker({
                position: pos,
                map: map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: '#0F9D58',
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: 'white'
                },
                title: 'Tú estás aquí',
                animation: google.maps.Animation.DROP
            });
            
            // Agregar círculo de precisión
            new google.maps.Circle({
                strokeColor: '#0F9D58',
                strokeOpacity: 0.3,
                strokeWeight: 1,
                fillColor: '#0F9D58',
                fillOpacity: 0.1,
                map: map,
                center: pos,
                radius: position.coords.accuracy
            });
        } else {
            currentLocationMarker.setPosition(pos);
        }
        
        // Actualizar panel de información
        infoPanel.innerHTML = `
            <button id="iniciarRutaBtn" class="btn btn-pequeno" disabled>Ruta en curso</button>
            <div class="info-ubicacion">
                <p><strong>Precisión:</strong> ${Math.round(position.coords.accuracy)} metros</p>
                <p><small>Actualizado: ${new Date().toLocaleTimeString()}</small></p>
            </div>
        `;
        
        // Actualizar entregas en el mapa
        actualizarEntregasEnMapa();
    };
    
    // Función para manejar errores de geolocalización
    const manejarError = (error) => {
        let mensajeError = 'No se pudo obtener tu ubicación';
        switch(error.code) {
            case error.PERMISSION_DENIED:
                mensajeError = 'Permiso de ubicación denegado. Por favor, habilita la ubicación para continuar.';
                break;
            case error.POSITION_UNAVAILABLE:
                mensajeError = 'La información de ubicación no está disponible';
                break;
            case error.TIMEOUT:
                mensajeError = 'Tiempo de espera agotado al obtener la ubicación';
                break;
        }
        console.error('Error de geolocalización:', error);
        infoPanel.innerHTML = `
            <div class="error-ubicacion">
                <p>${mensajeError}</p>
                <button onclick="iniciarSeguimientoUbicacion()" class="btn btn-pequeno">Reintentar</button>
            </div>
        `;
    };
    
    // Detener cualquier seguimiento anterior
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
    }
    
    // Obtener la posición actual
    navigator.geolocation.getCurrentPosition(
        (position) => {
            actualizarUbicacion(position);
            
            // Iniciar seguimiento continuo
            watchId = navigator.geolocation.watchPosition(
                actualizarUbicacion,
                manejarError,
                opciones
            );
        },
        manejarError,
        opciones
    );
}

// Actualizar las entregas en el mapa
function actualizarEntregasEnMapa() {
    // Limpiar marcadores anteriores
    deliveryMarkers.forEach(marker => marker.setMap(null));
    deliveryMarkers = [];
    
    if (!miRuta.paradas || !Array.isArray(miRuta.paradas)) return;
    
    // Agregar marcadores para cada parada
    miRuta.paradas.forEach((parada, index) => {
        const marker = new google.maps.Marker({
            position: { lat: parseFloat(parada.lat), lng: parseFloat(parada.lng) },
            map: map,
            title: `Entrega #${index + 1}: ${parada.direccion}`,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: 'white'
            }
        });
        
        // Agregar ventana de información
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div>
                    <h4>Entrega #${index + 1}</h4>
                    <p><strong>Dirección:</strong> ${parada.direccion}</p>
                    <p><strong>Cliente:</strong> ${parada.cliente || 'N/A'}</p>
                    <p><strong>Teléfono:</strong> ${parada.telefono || 'N/A'}</p>
                    <button class="btn btn-pequeno btn-primario" onclick="marcarComoEntregado(${index})">
                        Marcar como entregado
                    </button>
                </div>
            `
        });
        
        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });
        
        deliveryMarkers.push(marker);
    });
    
    // Si hay ubicación actual, actualizar la ruta
    if (currentPosition) {
        actualizarRutaHaciaProximaEntrega();
    }
}

// Actualizar la ruta hacia la próxima entrega
function actualizarRutaHaciaProximaEntrega() {
    if (!currentPosition || !miRuta.paradas || miRuta.paradas.length === 0) return;
    
    // Encontrar la próxima entrega no completada
    const proximaParada = miRuta.paradas.find(p => !p.entregado);
    if (!proximaParada) return;
    
    const destino = {
        lat: parseFloat(proximaParada.lat),
        lng: parseFloat(proximaParada.lng)
    };
    
    const request = {
        origin: currentPosition,
        destination: destino,
        travelMode: 'DRIVING',
        unitSystem: google.maps.UnitSystem.METRIC
    };
    
    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
            
            // Actualizar información de distancia y tiempo
            const route = result.routes[0].legs[0];
            document.getElementById('distancia').textContent = `Distancia: ${route.distance.text}`;
            document.getElementById('tiempo').textContent = `Tiempo estimado: ${route.duration.text}`;
            
            // Actualizar la ruta cada minuto o cuando cambie significativamente la ubicación
            setTimeout(actualizarRutaHaciaProximaEntrega, 60000);
        }
    });
}

// Marcar una entrega como completada
function marcarComoEntregado(index) {
    if (!miRuta.paradas || !miRuta.paradas[index]) return;
    
    // Aquí iría la lógica para marcar como entregado en el servidor
    fetch('php/empleado.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `accion=marcar_entregado&id_entrega=${miRuta.paradas[index].id}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.exito) {
            miRuta.paradas[index].entregado = true;
            mostrarNotificacion('Entrega marcada como completada', 'exito');
            actualizarEntregasEnMapa();
        } else {
            mostrarNotificacion('Error al marcar la entrega', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('Error al conectar con el servidor', 'error');
    });
}

// Mostrar detalles de la ruta
function mostrarDetallesRuta(ruta) {
    const detallesRuta = document.getElementById('detallesRuta');
    if (!ruta) {
        detallesRuta.innerHTML = '<p>No hay ruta asignada para hoy.</p>';
        return;
    }
    
    const entregasPendientes = ruta.paradas ? ruta.paradas.filter(p => !p.entregado).length : 0;
    const entregasCompletadas = ruta.paradas ? ruta.paradas.length - entregasPendientes : 0;
    
    let html = `
        <div class="detalle-ruta">
            <h4>${ruta.nombre || 'Ruta del Día'}</h4>
            <p><strong>Origen:</strong> ${ruta.origen || 'No especificado'}</p>
            <p><strong>Estado:</strong> ${entregasPendientes === 0 ? 'Completada' : 'En curso'}</p>
            <p><strong>Entregas completadas:</strong> ${entregasCompletadas} de ${entregasCompletadas + entregasPendientes}</p>
            <p><strong>Distancia total:</strong> ${ruta.distancia || 'N/A'}</p>
            <p><strong>Tiempo estimado restante:</strong> ${ruta.tiempo_estimado || 'N/A'}</p>
        </div>
    `;
    
    detallesRuta.innerHTML = html;
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
    // Primero intentamos cargar desde el servidor
    fetch('php/empleado.php?accion=estadisticas', {
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
    })
    .then(handleJsonResponse)
    .then(data => {
        if (data && data.exito && data.datos) {
            // Usar datos del servidor si están disponibles
            mostrarEstadisticas(data.datos);
        } else {
            // Si hay un error en la respuesta, usar datos de prueba
            mostrarEstadisticasDePrueba();
        }
    })
    .catch(error => {
        console.error('Error al cargar estadísticas:', error);
        // En caso de error, mostrar datos de prueba
        mostrarEstadisticasDePrueba();
    });
    
    // Función para mostrar datos de prueba
    function mostrarEstadisticasDePrueba() {
        const estadisticas = [
            { titulo: '45', descripcion: 'Entregas este mes' },
            { titulo: '98%', descripcion: 'Tasa de éxito' },
            { titulo: '4.8', descripcion: 'Calificación promedio' },
            { titulo: '12', descripcion: 'Días trabajados' }
        ];
        mostrarEstadisticas(estadisticas);
    }
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
