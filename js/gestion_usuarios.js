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
        order: [[0, 'desc']],
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
            url: '/HERMES.EXPRESS/php/usuarios.php',
            type: 'GET',
            data: { action: 'listar' },
            error: function(xhr, error, thrown) {
                console.error('Error al cargar los datos:', error);
                mostrarAlerta('danger', 'Error al cargar los datos de usuarios');
            }
        },
        columns: [
            { 
                data: 'id',
                className: 'text-center',
                width: '5%'
            },
            { 
                data: 'usuario',
                render: function(data) {
                    return `<strong>${data}</strong>`;
                }
            },
            { 
                data: 'nombre',
                render: function(data) {
                    return data || '<span class="text-muted">No especificado</span>';
                }
            },
            { 
                data: 'email',
                render: function(data) {
                    return data || '-';
                }
            },
            { 
                data: 'tipo',
                className: 'text-center',
                render: function(data) {
                    const tipos = {
                        'admin': '<span class="badge bg-danger">Administrador</span>',
                        'asistente': '<span class="badge bg-primary">Asistente</span>'
                    };
                    return tipos[data] || data;
                }
            },
            { 
                data: 'activo',
                className: 'text-center',
                render: function(data) {
                    return data == 1 
                        ? '<span class="badge bg-success">Activo</span>' 
                        : '<span class="badge bg-secondary">Inactivo</span>';
                }
            },
            { 
                data: 'fecha_creacion',
                render: function(data) {
                    return data ? new Date(data).toLocaleDateString('es-ES') : '-';
                }
            },
            {
                data: null,
                orderable: false,
                className: 'text-center',
                render: function(data, type, row) {
                    if (row.id === 1 || row.usuario === 'admin') {
                        return '<span class="badge bg-secondary">Protegido</span>';
                    }
                    
                    return `
                        <button class="btn btn-sm btn-primary btn-editar me-1" data-id="${row.id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger btn-eliminar" data-id="${row.id}" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>`;
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
        
        // Prevenir edición del administrador (ID 1)
        if (id == 1) {
            mostrarAlerta('warning', 'No se puede editar el usuario administrador principal');
            return;
        }
        
        fetch(`/HERMES.EXPRESS/php/usuarios.php?action=obtener&id=${id}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    mostrarAlerta('danger', data.error);
                    return;
                }
                
                // Si por alguna razón llegamos aquí con el admin, prevenir la edición
                if (data.id == 1) {
                    mostrarAlerta('warning', 'No se puede editar el usuario administrador principal');
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
    $(document).on('click', '.btn-eliminar', function(e) {
        const id = $(this).data('id');
        
        // Prevenir eliminación del administrador (ID 1)
        if (id == 1) {
            e.preventDefault();
            e.stopPropagation();
            mostrarAlerta('warning', 'No se puede eliminar el usuario administrador principal');
            return false;
        }
        
        if (confirm('¿Está seguro de eliminar este usuario?')) {
            fetch(`/HERMES.EXPRESS/php/usuarios.php?action=eliminar&id=${id}`, {
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
        
        return false;
    });

    // Enviar formulario
    $('#usuarioForm').submit(function(e) {
        e.preventDefault();
        
        const id = $('#usuario_id').val();
        
        // Prevenir modificación del administrador (ID 1)
        if (id == 1) {
            mostrarAlerta('warning', 'No se puede modificar el usuario administrador principal');
            $('#usuarioModal').modal('hide');
            return false;
        }
        
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
        let url = `/HERMES.EXPRESS/php/usuarios.php?action=${action}`;
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
