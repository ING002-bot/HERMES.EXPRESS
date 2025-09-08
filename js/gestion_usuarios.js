// Variable para el modal
let usuarioModal;

// Asegurarse de que Bootstrap esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar que Bootstrap esté disponible
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        usuarioModal = new bootstrap.Modal(document.getElementById('usuarioModal'));
    } else {
        console.error('Bootstrap no está cargado correctamente');
    }
    
    // Verificar que el elemento de la tabla existe
    const $tablaUsuarios = $('#usuariosTable');
    if ($tablaUsuarios.length === 0) {
        console.error('No se encontró el elemento con ID "usuariosTable"');
        return;
    }

    // Inicializar DataTable
    const usuariosTable = $('#usuariosTable').DataTable({
        order: [[0, 'desc']], // Ordenar por ID de forma descendente por defecto
        processing: true,
        serverSide: true,
        responsive: true,
        language: {
            emptyTable: 'No hay datos disponibles',
            loadingRecords: 'Cargando...',
            processing: 'Procesando...',
            search: 'Buscar:',
            zeroRecords: 'No se encontraron registros coincidentes',
            lengthMenu: 'Mostrar _MENU_ registros por página',
            info: 'Mostrando _START_ a _END_ de _TOTAL_ registros',
            infoEmpty: 'No hay registros disponibles',
            infoFiltered: '(filtrado de _MAX_ registros en total)',
            paginate: {
                first: 'Primero',
                last: 'Último',
                next: 'Siguiente',
                previous: 'Anterior'
            }
        },
        ajax: {
            url: 'php/usuarios.php',
            type: 'GET',
            data: function(d) {
                d.action = 'listar';
            },
            dataSrc: function(json) {
                // Verificar si hay un error en la respuesta
                if (json.error) {
                    console.error('Error del servidor:', json.error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: json.error,
                        confirmButtonText: 'Aceptar'
                    });
                    return [];
                }
                
                // Verificar si la respuesta tiene el formato esperado
                if (json.draw !== undefined && json.data !== undefined) {
                    return json.data;
                }
                
                // Si no es el formato esperado, intentar mostrarlo de todas formas
                console.warn('Formato de respuesta inesperado:', json);
                return [];
            },
            error: function(xhr, error, thrown) {
                console.error('Error en la petición AJAX:', error);
                console.error('Estado de la respuesta:', xhr.status, xhr.statusText);
                console.error('Respuesta del servidor:', xhr.responseText);
                
                let errorMessage = 'No se pudieron cargar los datos de usuarios.';
                
                if (xhr.responseText) {
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        if (errorResponse.error) {
                            errorMessage = errorResponse.error;
                        }
                    } catch (e) {
                        errorMessage = xhr.responseText;
                    }
                }
                
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: errorMessage,
                    confirmButtonText: 'Reintentar',
                    showCancelButton: true,
                    cancelButtonText: 'Cerrar'
                }).then((result) => {
                    if (result.isConfirmed) {
                        if (typeof usuariosTable !== 'undefined' && usuariosTable) {
                            usuariosTable.ajax.reload();
                        }
                    }
                });
                
                return [];
            }
        },
        columns: [
            { data: 'id', className: 'text-center' },
            { data: 'usuario', className: 'text-nowrap' },
            { data: 'nombre', className: 'text-nowrap' },
            { data: 'email', className: 'text-nowrap' },
            { 
                data: 'tipo',
                className: 'text-center',
                render: function(data) {
                    const tipos = {
                        'admin': '<span class="badge bg-primary">Administrador</span>',
                        'asistente': '<span class="badge bg-info text-dark">Asistente</span>',
                        'empleado': '<span class="badge bg-secondary">Empleado</span>'
                    };
                    return tipos[data] || data;
                }
            },
            {
                data: 'activo',
                className: 'text-center',
                render: function(data) {
                    return data ? 
                        '<span class="badge bg-success">Activo</span>' : 
                        '<span class="badge bg-danger">Inactivo</span>';
                }
            },
            {
                data: 'fecha_creacion',
                className: 'text-nowrap',
                render: function(data) {
                    return new Date(data).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit'
                    });
                }
            },
            {
                data: null,
                orderable: false,
                className: 'text-center',
                render: function(data, type, row) {
                    if (row.id === 1) {
                        return '<span class="text-muted">No editable</span>';
                    }
                    
                    return `
                        <button class="btn btn-sm btn-primary btn-editar" data-id="${row.id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger btn-eliminar ms-1" data-id="${row.id}" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                }
            }
        ],
        language: {
            url: '//cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json'
        },
        responsive: true
    });

    // Mostrar modal para crear/editar usuario
    $('#btnNuevoUsuario').click(function() {
        const form = document.getElementById('usuarioForm');
        form.reset();
        document.getElementById('usuarioModalLabel').textContent = 'Nuevo Usuario';
        form.setAttribute('data-action', 'crear');
        
        // Mostrar el modal
        usuarioModal.show();
    });

    // Editar usuario
    $(document).on('click', '.btn-editar', function() {
        const id = $(this).data('id');
        
        fetch(`../php/usuarios.php?action=obtener&id=${id}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    mostrarAlerta('danger', data.error);
                    return;
                }
                
                $('#usuario_id').val(data.id);
                $('#usuario').val(data.usuario);
                $('#nombre').val(data.nombre);
                $('#email').val(data.email);
                $('#tipo').val(data.tipo);
                $('#activo').prop('checked', data.activo == 1);
                
                // Mostrar campo de contraseña vacío
                $('#clave').val('').attr('placeholder', 'Dejar en blanco para no cambiar');
                
                $('#usuarioModalLabel').text('Editar Usuario');
                $('#usuarioForm').attr('data-action', 'actualizar');
                $('#usuarioModal').modal('show');
            })
            .catch(error => {
                console.error('Error:', error);
                mostrarAlerta('danger', 'Error al cargar los datos del usuario');
            });
    });

    // Eliminar usuario
    $(document).on('click', '.btn-eliminar', function() {
        const id = $(this).data('id');
        
        if (confirm('¿Está seguro de eliminar este usuario?')) {
            fetch(`../php/usuarios.php?action=eliminar&id=${id}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    mostrarAlerta('danger', data.error);
                } else {
                    mostrarAlerta('success', 'Usuario eliminado correctamente');
                    usuariosTable.ajax.reload();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                mostrarAlerta('danger', 'Error al eliminar el usuario');
            });
        }
    });

    // Enviar formulario
    $('#usuarioForm').submit(function(e) {
        e.preventDefault();
        
        const formData = {
            usuario: $('#usuario').val(),
            nombre: $('#nombre').val(),
            email: $('#email').val(),
            tipo: $('#tipo').val(),
            activo: $('#activo').is(':checked') ? 1 : 0
        };
        
        // Solo incluir la contraseña si se proporcionó
        const clave = $('#clave').val();
        if (clave) {
            formData.clave = clave;
        }
        
        const action = $(this).attr('data-action');
        let url = `../php/usuarios.php?action=${action}`;
        const method = action === 'crear' ? 'POST' : 'PUT';
        
        if (action === 'actualizar') {
            const id = $('#usuario_id').val();
            if (!id) {
                mostrarAlerta('danger', 'ID de usuario no válido');
                return;
            }
            url += `&id=${id}`;
        }
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                mostrarAlerta('danger', data.error);
            } else {
                mostrarAlerta('success', data.success || 'Operación realizada correctamente');
                $('#usuarioModal').modal('hide');
                usuariosTable.ajax.reload();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarAlerta('danger', 'Error al procesar la solicitud');
        });
    });

    // Función para mostrar alertas
    function mostrarAlerta(tipo, mensaje) {
        const alerta = `
            <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        $('#alertContainer').html(alerta);
        
        // Ocultar la alerta después de 5 segundos
        setTimeout(() => {
            $('.alert').alert('close');
        }, 5000);
    }
});
