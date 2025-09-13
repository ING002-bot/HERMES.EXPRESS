// Función para exportar a PDF
function exportarAPDF(seccion) {
    try {
        // Obtener la tabla correspondiente
        let tabla;
        let nombreArchivo;
        
        switch(seccion) {
            case 'paquetes':
                tabla = document.getElementById('tablaPaquetes');
                nombreArchivo = 'reporte_paquetes';
                break;
            case 'vehiculos':
                tabla = document.getElementById('tablaVehiculos');
                nombreArchivo = 'reporte_vehiculos';
                break;
            case 'rutas':
                tabla = document.getElementById('tablaRutas');
                nombreArchivo = 'reporte_rutas';
                break;
            case 'usuarios':
                tabla = document.getElementById('usuariosTable');
                nombreArchivo = 'reporte_usuarios';
                break;
            case 'pagos':
                tabla = document.getElementById('tablaPagos');
                nombreArchivo = 'reporte_pagos';
                break;
            default:
                mostrarAlerta('error', `No se encontró la tabla para la sección: ${seccion}`);
                return;
        }

        if (!tabla) {
            mostrarAlerta('error', `No se pudo encontrar la tabla para exportar (${seccion})`);
            return;
        }

        // Configuración de jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Título del documento
        const titulo = `Reporte de ${seccion.charAt(0).toUpperCase() + seccion.slice(1)}`;
        const fecha = new Date().toLocaleDateString('es-ES');
        
        doc.setFontSize(18);
        doc.text(titulo, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generado el: ${fecha}`, 14, 30);
        
        // Obtener datos de la tabla
        const headers = [];
        const data = [];
        
        // Obtener encabezados
        const headerRow = tabla.querySelector('thead tr');
        if (headerRow) {
            const ths = headerRow.querySelectorAll('th');
            ths.forEach(th => {
                if (th.style.display !== 'none') {
                    headers.push(th.innerText.trim());
                }
            });
        }
        
        // Obtener filas de datos
        const rows = tabla.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const rowData = [];
            const tds = row.querySelectorAll('td');
            tds.forEach((td, index) => {
                if (td.style.display !== 'none') {
                    rowData.push(td.innerText.trim());
                }
            });
            if (rowData.length > 0) {
                data.push(rowData);
            }
        });
        
        // Crear tabla en el PDF
        doc.autoTable({
            head: [headers],
            body: data,
            startY: 40,
            theme: 'grid',
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 9
            },
            styles: {
                fontSize: 8,
                cellPadding: 2,
                overflow: 'linebreak',
                cellWidth: 'wrap'
            },
            margin: { top: 40 },
            didDrawPage: function(data) {
                // Agregar pie de página
                const pageSize = doc.internal.pageSize;
                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                doc.text(`Página ${data.pageNumber}`, data.settings.margin.left, pageHeight - 10);
            }
        });
        
        // Guardar el PDF
        doc.save(`${nombreArchivo}_${new Date().toISOString().split('T')[0]}.pdf`);
        
    } catch (error) {
        console.error('Error al exportar a PDF:', error);
        mostrarAlerta('error', 'Ocurrió un error al generar el PDF');
    }
}

// Función para exportar a Excel
function exportarAExcel(seccion) {
    try {
        // Obtener la tabla correspondiente
        let tabla;
        let nombreArchivo;
        
        switch(seccion) {
            case 'paquetes':
                tabla = document.getElementById('tablaPaquetes');
                nombreArchivo = 'reporte_paquetes';
                break;
            case 'vehiculos':
                tabla = document.getElementById('tablaVehiculos');
                nombreArchivo = 'reporte_vehiculos';
                break;
            case 'rutas':
                tabla = document.getElementById('tablaRutas');
                nombreArchivo = 'reporte_rutas';
                break;
            case 'usuarios':
                tabla = document.getElementById('usuariosTable');
                nombreArchivo = 'reporte_usuarios';
                break;
            case 'pagos':
                tabla = document.getElementById('tablaPagos');
                nombreArchivo = 'reporte_pagos';
                break;
            default:
                mostrarAlerta('error', `No se encontró la tabla para la sección: ${seccion}`);
                return;
        }

        if (!tabla) {
            mostrarAlerta('error', `No se pudo encontrar la tabla para exportar (${seccion})`);
            return;
        }
        
        // Verificar que la biblioteca XLSX esté disponible
        if (typeof XLSX === 'undefined') {
            mostrarAlerta('error', 'No se pudo cargar la biblioteca de exportación a Excel');
            return;
        }
        
        // Crear un nuevo libro de trabajo
        const wb = XLSX.utils.book_new();
        
        // Obtener datos de la tabla
        const data = [];
        
        // Obtener encabezados
        const headerRow = [];
        const ths = tabla.querySelectorAll('thead th');
        ths.forEach(th => {
            if (th.style.display !== 'none') {
                headerRow.push(th.innerText.trim());
            }
        });
        data.push(headerRow);
        
        // Obtener filas de datos
        const rows = tabla.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const rowData = [];
            const tds = row.querySelectorAll('td');
            tds.forEach(td => {
                if (td.style.display !== 'none') {
                    rowData.push(td.innerText.trim());
                }
            });
            if (rowData.length > 0) {
                data.push(rowData);
            }
        });
        
        // Convertir datos a hoja de cálculo
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // Ajustar el ancho de las columnas
        const colWidths = [];
        data[0].forEach(() => {
            colWidths.push({ wch: 20 }); // Ancho fijo para todas las columnas
        });
        ws['!cols'] = colWidths;
        
        // Agregar la hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, 'Datos');
        
        // Generar el archivo Excel
        XLSX.writeFile(wb, `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.xlsx`);
        
    } catch (error) {
        console.error('Error al exportar a Excel:', error);
        mostrarAlerta('error', 'Ocurrió un error al generar el archivo Excel');
    }
}

// Función auxiliar para mostrar alertas
function mostrarAlerta(tipo, mensaje) {
    // Usar SweetAlert2 si está disponible, de lo contrario usar alert nativo
    if (typeof Swal !== 'undefined') {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });
        
        Toast.fire({
            icon: tipo,
            title: mensaje
        });
    } else {
        alert(`${tipo.toUpperCase()}: ${mensaje}`);
    }
}

// Asegurarse de que las funciones estén disponibles globalmente
window.exportarAPDF = exportarAPDF;
window.exportarAExcel = exportarAExcel;
}

// Función para exportar pagos
function exportarPagos() {
    // Obtener la tabla de pagos
    const tabla = document.getElementById('tablaPagos');
    if (!tabla) {
        console.error('No se encontró la tabla de pagos');
        return;
    }
    
    // Usar SheetJS para exportar a Excel
    const wb = XLSX.utils.table_to_book(tabla, {sheet: 'Pagos'});
    XLSX.writeFile(wb, `reporte_pagos_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Asegurarse de que las funciones estén disponibles globalmente
window.exportarAPDF = exportarAPDF;
window.exportarAExcel = exportarAExcel;
window.exportarPagos = exportarPagos;
