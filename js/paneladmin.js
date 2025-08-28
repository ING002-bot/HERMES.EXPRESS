// Variables globales para administrador
let datosAdmin = {};
let todosLosPaquetes = [];
let todosLosEmpleados = [];
let todosLosVehiculos = [];
let todasLasRutas = [];

// Inicializar cuando carga la página
document.addEventListener('DOMContentLoaded', function() {
    verificarSesionAdmin();
    cargarDatosAdmin();
    configurarEventosAdmin();
});

// Verificar sesión del administrador (deshabilitado)
function verificarSesionAdmin() {
    // Crear datos de admin por defecto
    datosAdmin = {
        id: 1,
        nombre: 'Administrador',
        usuario: 'admin',
        tipo: 'admin'
    };
    document.getElementById('nombreUsuario').textContent = 'Administrador';
}

// Cargar todos los datos del administrador
function cargarDatosAdmin() {
    cargarMetricasAdmin();
    cargarTodosLosPaquetes();
    cargarTodosLosEmpleados();
    cargarTodosLosVehiculos();
    cargarTodasLasRutas();
    cargarAlertasAdmin();
    cargarGraficosAdmin();
    cargarTarifasRutas();
    configurarFechasPago();
}

// Cargar métricas principales
function cargarMetricasAdmin() {
    fetch('php/admin.php?accion=metricas')
        .then(response => response.json())
        .then(data => {
            if (data.exito) {
                document.getElementById('totalPaquetes').textContent = data.datos.total_paquetes;
                document.getElementById('ingresosMes').textContent = '$' + formatearNumero(data.datos.ingresos_mes);
                document.getElementById('empleadosActivos').textContent = data.datos.empleados_activos;
                document.getElementById('vehiculosOperativos').textContent = data.datos.vehiculos_operativos;
            }
        })
        .catch(error => console.error('Error:', error));
}

// Cargar todos los paquetes
function cargarTodosLosPaquetes() {
    fetch('php/admin.php?accion=todos_paquetes')
        .then(response => response.json())
        .then(data => {
            if (data.exito) {
                todosLosPaquetes = data.datos;
                mostrarTodosLosPaquetes(todosLosPaquetes);
            }
        })
        .catch(error => console.error('Error:', error));
}

// Mostrar todos los paquetes
function mostrarTodosLosPaquetes(paquetes) {
    const tbody = document.getElementById('cuerpoTablaPaquetes');
    tbody.innerHTML = '';
    
    paquetes.forEach(paquete => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${paquete.codigo}</td>
            <td>${paquete.remitente}</td>
            <td>${paquete.destinatario}</td>
            <td><span class="estado estado-${paquete.estado}">${formatearEstado(paquete.estado)}</span></td>
            <td>${paquete.peso} kg</td>
            <td>$${formatearNumero(paquete.precio)}</td>
            <td>${formatearFecha(paquete.fecha_envio)}</td>
            <td>
                <button class="btn btn-pequeno btn-primario" onclick="editarPaqueteAdmin(${paquete.id})">Editar</button>
                <button class="btn btn-pequeno btn-secundario" onclick="eliminarPaquete(${paquete.id})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(fila);
    });
}

// Cargar todos los empleados
function cargarTodosLosEmpleados() {
    fetch('php/admin.php?accion=empleados')
        .then(response => response.json())
        .then(data => {
            if (data.exito) {
                todosLosEmpleados = data.datos;
                mostrarEmpleados(todosLosEmpleados);
            }
        })
        .catch(error => console.error('Error:', error));
}

// Mostrar empleados
function mostrarEmpleados(empleados) {
    const container = document.getElementById('contenedorEmpleados');
    container.innerHTML = '';
    
    empleados.forEach(empleado => {
        const div = document.createElement('div');
        div.className = `empleado-card ${empleado.activo ? 'empleado-activo' : 'empleado-inactivo'}`;
        div.innerHTML = `
            <div class="empleado-header">
                <div class="empleado-avatar">👤</div>
                <div class="empleado-info">
                    <h4>${empleado.nombre}</h4>
                    <p>@${empleado.usuario} • ${empleado.tipo}</p>
                    <p>📧 ${empleado.email}</p>
                </div>
            </div>
            <div class="empleado-stats">
                <div class="stat-item">
                    <h5>12</h5>
                    <p>Paquetes</p>
                </div>
                <div class="stat-item">
                    <h5>98%</h5>
                    <p>Éxito</p>
                </div>
                <div class="stat-item">
                    <h5>4.8</h5>
                    <p>Rating</p>
                </div>
            </div>
            <div class="empleado-acciones">
                <button class="btn btn-pequeno btn-primario" onclick="editarEmpleado(${empleado.id})">Editar</button>
                <button class="btn btn-pequeno ${empleado.activo ? 'btn-secundario' : 'btn-primario'}" 
                        onclick="toggleEmpleado(${empleado.id}, ${empleado.activo})">
                    ${empleado.activo ? 'Desactivar' : 'Activar'}
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

// Cargar todos los vehículos
function cargarTodosLosVehiculos() {
    fetch('php/admin.php?accion=vehiculos')
        .then(response => response.json())
        .then(data => {
            if (data.exito) {
                todosLosVehiculos = data.datos;
                mostrarVehiculos(todosLosVehiculos);
            }
        })
        .catch(error => console.error('Error:', error));
}

// Mostrar vehículos
function mostrarVehiculos(vehiculos) {
    const container = document.getElementById('contenedorVehiculos');
    container.innerHTML = '';
    
    vehiculos.forEach(vehiculo => {
        const div = document.createElement('div');
        div.className = `vehiculo-card vehiculo-${vehiculo.estado}`;
        div.innerHTML = `
            <div class="vehiculo-header">
                <div class="vehiculo-icon">🚛</div>
                <div class="vehiculo-info">
                    <h4>${vehiculo.placa}</h4>
                    <p>${vehiculo.marca} ${vehiculo.modelo}</p>
                    <p>Capacidad: ${vehiculo.capacidad} kg</p>
                </div>
            </div>
            <div class="vehiculo-stats">
                <div class="stat-item">
                    <h5>${vehiculo.capacidad}</h5>
                    <p>Capacidad</p>
                </div>
                <div class="stat-item">
                    <h5><span class="estado estado-${vehiculo.estado}">${formatearEstado(vehiculo.estado)}</span></h5>
                    <p>Estado</p>
                </div>
            </div>
            <div class="vehiculo-acciones">
                <button class="btn btn-pequeno btn-primario" onclick="editarVehiculo(${vehiculo.id})">Editar</button>
                <button class="btn btn-pequeno btn-secundario" onclick="eliminarVehiculo(${vehiculo.id})">Eliminar</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// Cargar todas las rutas
function cargarTodasLasRutas() {
    fetch('php/admin.php?accion=rutas')
        .then(response => response.json())
        .then(data => {
            if (data.exito) {
                todasLasRutas = data.datos;
                mostrarRutas(todasLasRutas);
            }
        })
        .catch(error => console.error('Error:', error));
}

// Mostrar rutas
function mostrarRutas(rutas) {
    const container = document.getElementById('contenedorRutas');
    container.innerHTML = '';
    
    rutas.forEach(ruta => {
        const div = document.createElement('div');
        div.className = 'ruta-card';
        div.innerHTML = `
            <div class="ruta-header">
                <div class="ruta-icon">🗺️</div>
                <div class="ruta-info">
                    <h4>${ruta.nombre}</h4>
                    <p>${ruta.origen} → ${ruta.destino}</p>
                </div>
            </div>
            <div class="ruta-stats">
                <div class="stat-item">
                    <h5>${ruta.distancia}</h5>
                    <p>km</p>
                </div>
                <div class="stat-item">
                    <h5>${ruta.tiempo_estimado}</h5>
                    <p>min</p>
                </div>
            </div>
            <div class="ruta-acciones">
                <button class="btn btn-pequeno btn-primario" onclick="editarRuta(${ruta.id})">Editar</button>
                <button class="btn btn-pequeno btn-secundario" onclick="eliminarRuta(${ruta.id})">Eliminar</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// Cargar alertas del administrador
function cargarAlertasAdmin() {
    const alertas = [
        {
            tipo: 'critica',
            titulo: 'Vehículo en mantenimiento',
            descripcion: 'ABC-123 requiere mantenimiento urgente',
            tiempo: 'Hace 15 min'
        },
        {
            tipo: 'advertencia',
            titulo: 'Paquete retrasado',
            descripcion: 'HE001 lleva 2 horas de retraso',
            tiempo: 'Hace 1 hora'
        },
        {
            tipo: 'info',
            titulo: 'Nuevo empleado registrado',
            descripcion: 'María García se unió al equipo',
            tiempo: 'Hace 2 horas'
        }
    ];
    
    mostrarAlertas(alertas);
}

// Mostrar alertas
function mostrarAlertas(alertas) {
    const container = document.getElementById('listaAlertas');
    container.innerHTML = '';
    
    alertas.forEach(alerta => {
        const div = document.createElement('div');
        div.className = `alerta-item ${alerta.tipo}`;
        div.innerHTML = `
            <div class="alerta-info">
                <h4>${alerta.titulo}</h4>
                <p>${alerta.descripcion}</p>
            </div>
            <div class="alerta-tiempo">${alerta.tiempo}</div>
        `;
        container.appendChild(div);
    });
}

// Cargar gráficos del administrador
function cargarGraficosAdmin() {
    // Gráfico de ventas mensuales
    const canvasVentas = document.getElementById('graficoVentas');
    const ctxVentas = canvasVentas.getContext('2d');
    
    // Datos de ejemplo para ventas
    const ventasMensuales = [120000, 150000, 180000, 200000, 175000, 220000];
    const meses = ['Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    dibujarGraficoBarras(ctxVentas, canvasVentas, ventasMensuales, meses, '#ffd700');
    
    // Cargar actividad reciente
    cargarActividadReciente();
}

// Dibujar gráfico de barras
function dibujarGraficoBarras(ctx, canvas, datos, etiquetas, color) {
    const padding = 40;
    const barWidth = (canvas.width - padding * 2) / datos.length;
    const maxValue = Math.max(...datos);
    const scale = (canvas.height - padding * 2) / maxValue;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar barras
    datos.forEach((valor, index) => {
        const barHeight = valor * scale;
        const x = padding + index * barWidth + barWidth * 0.1;
        const y = canvas.height - padding - barHeight;
        const width = barWidth * 0.8;
        
        // Barra
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, barHeight);
        
        // Etiqueta
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(etiquetas[index], x + width/2, canvas.height - padding + 15);
        
        // Valor
        ctx.fillText('$' + (valor/1000) + 'K', x + width/2, y - 5);
    });
}

// Cargar actividad reciente
function cargarActividadReciente() {
    const actividades = [
        {
            descripcion: 'Nuevo paquete HE004 registrado',
            fecha: new Date(),
            tipo: 'nuevo'
        },
        {
            descripcion: 'Empleado Juan Pérez inició ruta',
            fecha: new Date(Date.now() - 30*60*1000),
            tipo: 'ruta'
        },
        {
            descripcion: 'Paquete HE002 entregado exitosamente',
            fecha: new Date(Date.now() - 60*60*1000),
            tipo: 'entregado'
        }
    ];
    
    mostrarActividadReciente(actividades);
}

// Mostrar actividad reciente
function mostrarActividadReciente(actividades) {
    const container = document.getElementById('listaActividad');
    container.innerHTML = '';
    
    actividades.forEach(actividad => {
        const div = document.createElement('div');
        div.className = 'actividad-item';
        div.innerHTML = `
            <div>
                <strong>${actividad.descripcion}</strong>
                <br><small>${formatearFecha(actividad.fecha)}</small>
            </div>
            <span class="estado estado-${actividad.tipo}">${actividad.tipo}</span>
        `;
        container.appendChild(div);
    });
}

// Configurar eventos del administrador
function configurarEventosAdmin() {
    // Búsqueda de paquetes
    document.getElementById('buscarPaquete').addEventListener('input', filtrarTodosLosPaquetes);
    document.getElementById('filtroEstado').addEventListener('change', filtrarTodosLosPaquetes);
    
    // Formulario de nuevo empleado
    document.getElementById('formEmpleado').addEventListener('submit', guardarEmpleado);
    
    // Formulario de empresa
    document.getElementById('formEmpresa').addEventListener('submit', guardarConfigEmpresa);
}

// Filtrar todos los paquetes
function filtrarTodosLosPaquetes() {
    const busqueda = document.getElementById('buscarPaquete').value.toLowerCase();
    const estado = document.getElementById('filtroEstado').value;
    
    let paquetesFiltrados = todosLosPaquetes.filter(paquete => {
        const coincideBusqueda = paquete.codigo.toLowerCase().includes(busqueda) ||
                                paquete.destinatario.toLowerCase().includes(busqueda) ||
                                paquete.remitente.toLowerCase().includes(busqueda);
        
        const coincidenEstado = !estado || paquete.estado === estado;
        
        return coincideBusqueda && coincidenEstado;
    });
    
    mostrarTodosLosPaquetes(paquetesFiltrados);
}

// Mostrar sección del administrador
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
        'dashboard': 'Panel de Administración',
        'paquetes': 'Gestión de Paquetes',
        'empleados': 'Gestión de Empleados',
        'vehiculos': 'Gestión de Vehículos',
        'rutas': 'Gestión de Rutas',
        'pagos': 'Gestión de Pagos a Empleados',
        'configuracion': 'Configuración del Sistema'
    };
    document.getElementById('tituloSeccion').textContent = titulos[seccion];
    
    // Cargar datos específicos de la sección
    if (seccion === 'pagos') {
        cargarDatosPagos();
    }
}

// Nuevo empleado
function nuevoEmpleado() {
    document.getElementById('modalEmpleado').style.display = 'block';
    document.getElementById('formEmpleado').reset();
}

// Guardar empleado
function guardarEmpleado(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('accion', 'nuevo_empleado');
    formData.append('nombre', document.getElementById('nombreEmpleado').value);
    formData.append('usuario', document.getElementById('usuarioEmpleado').value);
    formData.append('email', document.getElementById('emailEmpleado').value);
    formData.append('clave', document.getElementById('claveEmpleado').value);
    formData.append('tipo', document.getElementById('tipoEmpleado').value);
    
    fetch('php/admin.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.exito) {
            cerrarModal('modalEmpleado');
            cargarTodosLosEmpleados();
            cargarMetricasAdmin();
            mostrarNotificacion('Empleado creado exitosamente', 'exito');
        } else {
            mostrarNotificacion(data.mensaje, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('Error al crear empleado', 'error');
    });
}

// Nuevo paquete desde admin
function nuevoPaquete() {
    mostrarNotificacion('Redirigiendo al dashboard principal...', 'info');
    window.location.href = 'dashboard.html';
}

// Actualizar datos
function actualizar() {
    cargarDatosAdmin();
    mostrarNotificacion('Datos actualizados', 'exito');
}

// Exportar datos
function exportarDatos() {
    mostrarNotificacion('Función de exportación - Por implementar', 'info');
}

// Aplicar filtros
function aplicarFiltros() {
    filtrarTodosLosPaquetes();
}

// Generar reporte
function generarReporte() {
    const tipo = document.getElementById('tipoReporte').value;
    const fechaInicio = document.getElementById('reporteFechaInicio').value;
    const fechaFin = document.getElementById('reporteFechaFin').value;
    
    if (!fechaInicio || !fechaFin) {
        mostrarNotificacion('Selecciona las fechas del reporte', 'error');
        return;
    }
    
    mostrarNotificacion(`Generando reporte de ${tipo}...`, 'info');
    
    // Simular generación de reporte
    setTimeout(() => {
        const container = document.getElementById('vistaReporte');
        container.innerHTML = `
            <h3>Reporte de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</h3>
            <p><strong>Período:</strong> ${fechaInicio} al ${fechaFin}</p>
            <div style="margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                <p>📊 Datos del reporte generados exitosamente</p>
                <p>📈 Total de registros: 45</p>
                <p>💰 Ingresos totales: $125,000</p>
                <p>📦 Paquetes procesados: 78</p>
            </div>
        `;
        mostrarNotificacion('Reporte generado exitosamente', 'exito');
    }, 2000);
}

// Guardar configuración de empresa
function guardarConfigEmpresa(e) {
    e.preventDefault();
    mostrarNotificacion('Configuración guardada exitosamente', 'exito');
}

// Guardar configuración del sistema
function guardarConfigSistema() {
    mostrarNotificacion('Configuración del sistema aplicada', 'exito');
}

// Toggle empleado activo/inactivo
function toggleEmpleado(id, activo) {
    const accion = activo ? 'desactivar' : 'activar';
    if (confirm(`¿${accion} empleado?`)) {
        mostrarNotificacion(`Empleado ${accion}do exitosamente`, 'exito');
        cargarTodosLosEmpleados();
    }
}

// Cerrar modal
function cerrarModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Cerrar sesión (deshabilitado)
function cerrarSesion() {
    if (confirm('¿Estás seguro de que quieres salir?')) {
        alert('Función de cerrar sesión deshabilitada');
    }
}

// Funciones placeholder para funcionalidades adicionales
function editarPaqueteAdmin(id) {
    mostrarNotificacion('Función de editar paquete - Por implementar', 'info');
}

function eliminarPaquete(id) {
    if (confirm('¿Eliminar paquete?')) {
        mostrarNotificacion('Paquete eliminado', 'exito');
        cargarTodosLosPaquetes();
    }
}

function editarEmpleado(id) {
    mostrarNotificacion('Función de editar empleado - Por implementar', 'info');
}

function nuevoVehiculo() {
    mostrarNotificacion('Función de nuevo vehículo - Por implementar', 'info');
}

function editarVehiculo(id) {
    mostrarNotificacion('Función de editar vehículo - Por implementar', 'info');
}

function eliminarVehiculo(id) {
    if (confirm('¿Eliminar vehículo?')) {
        mostrarNotificacion('Vehículo eliminado', 'exito');
        cargarTodosLosVehiculos();
    }
}

function nuevaRuta() {
    mostrarNotificacion('Función de nueva ruta - Por implementar', 'info');
}

function editarRuta(id) {
    mostrarNotificacion('Función de editar ruta - Por implementar', 'info');
}

function eliminarRuta(id) {
    if (confirm('¿Eliminar ruta?')) {
        mostrarNotificacion('Ruta eliminada', 'exito');
        cargarTodasLasRutas();
    }
}

function optimizarRutas() {
    mostrarNotificacion('Optimizando rutas...', 'info');
    setTimeout(() => {
        mostrarNotificacion('Rutas optimizadas exitosamente', 'exito');
    }, 2000);
}

function exportarReporte() {
    mostrarNotificacion('Exportando reporte a PDF...', 'info');
}

// Funciones auxiliares
function formatearNumero(numero) {
    return new Intl.NumberFormat('es-CO').format(numero);
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-CO');
}

function formatearEstado(estado) {
    const estados = {
        'pendiente': 'Pendiente',
        'en_transito': 'En Tránsito',
        'entregado': 'Entregado',
        'devuelto': 'Devuelto',
        'disponible': 'Disponible',
        'en_ruta': 'En Ruta',
        'mantenimiento': 'Mantenimiento'
    };
    return estados[estado] || estado;
}

// Funciones para módulo de pagos
function configurarFechasPago() {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    document.getElementById('fechaInicioPago').value = inicioMes.toISOString().split('T')[0];
    document.getElementById('fechaFinPago').value = finMes.toISOString().split('T')[0];
}

function cargarTarifasRutas() {
    const tarifas = [
        {
            tipo: 'urbano',
            tarifa_base: 5000,
            tarifa_por_kg: 500,
            comision_empleado: 15,
            descripcion: 'Entregas dentro de la ciudad'
        },
        {
            tipo: 'distrital',
            tarifa_base: 8000,
            tarifa_por_kg: 800,
            comision_empleado: 18,
            descripcion: 'Entregas entre distritos'
        },
        {
            tipo: 'interprovincial',
            tarifa_base: 15000,
            tarifa_por_kg: 1200,
            comision_empleado: 25,
            descripcion: 'Entregas entre provincias'
        },
        {
            tipo: 'interurbano',
            tarifa_base: 12000,
            tarifa_por_kg: 1000,
            comision_empleado: 20,
            descripcion: 'Entregas entre ciudades'
        }
    ];
    
    mostrarTarifas(tarifas);
}

function mostrarTarifas(tarifas) {
    const container = document.getElementById('tarifasGrid');
    container.innerHTML = '';
    
    tarifas.forEach(tarifa => {
        const div = document.createElement('div');
        div.className = `tarifa-card ${tarifa.tipo}`;
        div.innerHTML = `
            <button class="tarifa-editar" onclick="editarTarifa('${tarifa.tipo}')">✏️</button>
            <h4>${tarifa.tipo}</h4>
            <div class="tarifa-info">Base: $${formatearNumero(tarifa.tarifa_base)}</div>
            <div class="tarifa-info">Por Kg: $${formatearNumero(tarifa.tarifa_por_kg)}</div>
            <div class="tarifa-monto">Comisión: ${tarifa.comision_empleado}%</div>
            <div class="tarifa-info">${tarifa.descripcion}</div>
        `;
        container.appendChild(div);
    });
}

function cargarDatosPagos() {
    cargarResumenPagos();
    cargarPagosEmpleados();
    cargarEmpleadosSelect();
}

function cargarResumenPagos() {
    // Datos simulados
    const resumen = {
        total_pagar: 2450000,
        total_empleados: 3,
        total_entregados: 45,
        total_devueltos: 3
    };
    
    document.getElementById('totalPagar').textContent = '$' + formatearNumero(resumen.total_pagar);
    document.getElementById('totalEmpleados').textContent = resumen.total_empleados;
    document.getElementById('totalEntregados').textContent = resumen.total_entregados;
    document.getElementById('totalDevueltos').textContent = resumen.total_devueltos;
}

function cargarPagosEmpleados() {
    const pagos = [
        {
            empleado: 'Juan Pérez',
            entregados: 18,
            devueltos: 1,
            urbano: 12,
            distrital: 4,
            interprovincial: 2,
            interurbano: 0,
            total: 890000,
            estado: 'pendiente'
        },
        {
            empleado: 'María García',
            entregados: 15,
            devueltos: 1,
            urbano: 8,
            distrital: 5,
            interprovincial: 1,
            interurbano: 1,
            total: 750000,
            estado: 'pendiente'
        },
        {
            empleado: 'Carlos López',
            entregados: 12,
            devueltos: 1,
            urbano: 6,
            distrital: 3,
            interprovincial: 2,
            interurbano: 1,
            total: 810000,
            estado: 'pagado'
        }
    ];
    
    mostrarPagosEmpleados(pagos);
}

function mostrarPagosEmpleados(pagos) {
    const tbody = document.getElementById('cuerpoTablaPagos');
    tbody.innerHTML = '';
    
    pagos.forEach(pago => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>${pago.empleado}</strong></td>
            <td><span class="badge badge-success">${pago.entregados}</span></td>
            <td><span class="badge badge-warning">${pago.devueltos}</span></td>
            <td>${pago.urbano}</td>
            <td>${pago.distrital}</td>
            <td>${pago.interprovincial}</td>
            <td>${pago.interurbano}</td>
            <td><strong>$${formatearNumero(pago.total)}</strong></td>
            <td><span class="estado-${pago.estado}">${pago.estado.charAt(0).toUpperCase() + pago.estado.slice(1)}</span></td>
            <td>
                <button class="btn btn-pequeno btn-primario" onclick="verDetallePago('${pago.empleado}')">Ver</button>
                <button class="btn btn-pequeno btn-secundario" onclick="editarCantidades('${pago.empleado}')">Editar</button>
                ${pago.estado === 'pendiente' ? 
                    `<button class="btn btn-pequeno btn-exito" onclick="marcarPagado('${pago.empleado}')">Pagar</button>` : 
                    '<span class="badge badge-success">✓</span>'
                }
            </td>
        `;
        tbody.appendChild(fila);
    });
}

function cargarEmpleadosSelect() {
    const select = document.getElementById('filtroEmpleadoPago');
    const empleados = ['Juan Pérez', 'María García', 'Carlos López'];
    
    empleados.forEach(empleado => {
        const option = document.createElement('option');
        option.value = empleado;
        option.textContent = empleado;
        select.appendChild(option);
    });
}

function calcularPagos() {
    const fechaInicio = document.getElementById('fechaInicioPago').value;
    const fechaFin = document.getElementById('fechaFinPago').value;
    
    if (!fechaInicio || !fechaFin) {
        mostrarNotificacion('Selecciona las fechas del período', 'error');
        return;
    }
    
    mostrarNotificacion('Calculando pagos...', 'info');
    
    setTimeout(() => {
        cargarPagosEmpleados();
        cargarResumenPagos();
        mostrarNotificacion('Pagos calculados exitosamente', 'exito');
    }, 2000);
}

function configurarTarifas() {
    document.getElementById('modalTarifas').style.display = 'block';
    document.getElementById('formTarifas').reset();
}

function editarTarifa(tipo) {
    const modal = document.getElementById('modalTarifas');
    const form = document.getElementById('formTarifas');
    
    // Datos simulados para edición
    const tarifas = {
        'urbano': { base: 5000, kg: 500, comision: 15, desc: 'Entregas dentro de la ciudad' },
        'distrital': { base: 8000, kg: 800, comision: 18, desc: 'Entregas entre distritos' },
        'interprovincial': { base: 15000, kg: 1200, comision: 25, desc: 'Entregas entre provincias' },
        'interurbano': { base: 12000, kg: 1000, comision: 20, desc: 'Entregas entre ciudades' }
    };
    
    const tarifa = tarifas[tipo];
    document.getElementById('tipoRutaTarifa').value = tipo;
    document.getElementById('tarifaBase').value = tarifa.base;
    document.getElementById('tarifaPorKg').value = tarifa.kg;
    document.getElementById('comisionEmpleado').value = tarifa.comision;
    document.getElementById('descripcionTarifa').value = tarifa.desc;
    
    modal.style.display = 'block';
}

function filtrarPagos() {
    const empleado = document.getElementById('filtroEmpleadoPago').value;
    const fechaInicio = document.getElementById('fechaInicioPago').value;
    const fechaFin = document.getElementById('fechaFinPago').value;
    
    mostrarNotificacion(`Filtrando pagos ${empleado ? 'para ' + empleado : 'para todos'}`, 'info');
    cargarPagosEmpleados();
}

function exportarPagos() {
    mostrarNotificacion('Exportando reporte de pagos a Excel...', 'info');
    setTimeout(() => {
        mostrarNotificacion('Reporte exportado exitosamente', 'exito');
    }, 2000);
}

function verDetallePago(empleado) {
    mostrarNotificacion(`Mostrando detalle de pagos para ${empleado}`, 'info');
}

function marcarPagado(empleado) {
    if (confirm(`¿Marcar como pagado a ${empleado}?`)) {
        mostrarNotificacion(`Pago registrado para ${empleado}`, 'exito');
        cargarPagosEmpleados();
    }
}

// Variables globales para edición de cantidades
let empleadoEditandoActual = '';
let tarifasActuales = {
    urbano: { base: 5000, comision: 15 },
    distrital: { base: 8000, comision: 18 },
    interprovincial: { base: 15000, comision: 25 },
    interurbano: { base: 12000, comision: 20 }
};

// Función para abrir modal de editar cantidades
function editarCantidades(empleado) {
    empleadoEditandoActual = empleado;
    
    // Obtener datos actuales del empleado
    const datosEmpleado = obtenerDatosEmpleado(empleado);
    
    // Configurar modal
    document.getElementById('empleadoEditando').textContent = `Empleado: ${empleado}`;
    document.getElementById('periodoEditando').textContent = 
        `${document.getElementById('fechaInicioPago').value} - ${document.getElementById('fechaFinPago').value}`;
    
    // Cargar cantidades actuales
    document.getElementById('urbano-entregados').value = datosEmpleado.urbano || 0;
    document.getElementById('urbano-devueltos').value = 0;
    document.getElementById('distrital-entregados').value = datosEmpleado.distrital || 0;
    document.getElementById('distrital-devueltos').value = 0;
    document.getElementById('interprovincial-entregados').value = datosEmpleado.interprovincial || 0;
    document.getElementById('interprovincial-devueltos').value = 0;
    document.getElementById('interurbano-entregados').value = datosEmpleado.interurbano || 0;
    document.getElementById('interurbano-devueltos').value = 0;
    
    // Calcular totales iniciales
    calcularTotalesPorZona();
    
    // Mostrar modal
    document.getElementById('modalEditarCantidades').style.display = 'block';
}

// Función para obtener datos del empleado
function obtenerDatosEmpleado(empleado) {
    const empleados = {
        'Juan Pérez': { urbano: 12, distrital: 4, interprovincial: 2, interurbano: 0 },
        'María García': { urbano: 8, distrital: 5, interprovincial: 1, interurbano: 1 },
        'Carlos López': { urbano: 6, distrital: 3, interprovincial: 2, interurbano: 1 }
    };
    return empleados[empleado] || { urbano: 0, distrital: 0, interprovincial: 0, interurbano: 0 };
}

// Función para ajustar cantidades con botones +/-
function ajustarCantidad(zona, tipo, incremento) {
    const input = document.getElementById(`${zona}-${tipo}`);
    const valorActual = parseInt(input.value) || 0;
    const nuevoValor = Math.max(0, valorActual + incremento);
    
    input.value = nuevoValor;
    calcularTotalesPorZona();
}

// Función para calcular totales por zona
function calcularTotalesPorZona() {
    let totalGeneral = 0;
    
    ['urbano', 'distrital', 'interprovincial', 'interurbano'].forEach(zona => {
        const entregados = parseInt(document.getElementById(`${zona}-entregados`).value) || 0;
        const devueltos = parseInt(document.getElementById(`${zona}-devueltos`).value) || 0;
        
        const tarifa = tarifasActuales[zona];
        const ingresoEntregados = entregados * tarifa.base * (tarifa.comision / 100);
        const descuentoDevueltos = devueltos * tarifa.base * 0.5; // 50% descuento por devolución
        
        const totalZona = ingresoEntregados - descuentoDevueltos;
        
        document.getElementById(`${zona}-total`).textContent = formatearNumero(Math.max(0, totalZona));
        totalGeneral += Math.max(0, totalZona);
    });
    
    document.getElementById('totalGeneralEdicion').textContent = formatearNumero(totalGeneral);
}

// Función para guardar cambios
function guardarCantidades() {
    const cantidades = {};
    
    ['urbano', 'distrital', 'interprovincial', 'interurbano'].forEach(zona => {
        cantidades[zona] = {
            entregados: parseInt(document.getElementById(`${zona}-entregados`).value) || 0,
            devueltos: parseInt(document.getElementById(`${zona}-devueltos`).value) || 0
        };
    });
    
    // Simular guardado
    mostrarNotificacion(`Cantidades actualizadas para ${empleadoEditandoActual}`, 'exito');
    
    // Cerrar modal
    cerrarModal('modalEditarCantidades');
    
    // Recargar datos
    cargarPagosEmpleados();
}

// Agregar eventos a los inputs para recalcular automáticamente
document.addEventListener('DOMContentLoaded', function() {
    // Esperar a que el DOM esté listo y luego agregar eventos
    setTimeout(() => {
        ['urbano', 'distrital', 'interprovincial', 'interurbano'].forEach(zona => {
            ['entregados', 'devueltos'].forEach(tipo => {
                const input = document.getElementById(`${zona}-${tipo}`);
                if (input) {
                    input.addEventListener('input', calcularTotalesPorZona);
                }
            });
        });
    }, 1000);
});

// Configurar eventos del formulario de tarifas
document.getElementById('formTarifas').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const tipo = document.getElementById('tipoRutaTarifa').value;
    const base = document.getElementById('tarifaBase').value;
    const kg = document.getElementById('tarifaPorKg').value;
    const comision = document.getElementById('comisionEmpleado').value;
    
    mostrarNotificacion(`Tarifa ${tipo} actualizada exitosamente`, 'exito');
    cerrarModal('modalTarifas');
    cargarTarifasRutas();
});

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
