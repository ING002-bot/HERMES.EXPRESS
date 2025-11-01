(function(){
  function esc(s){ return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // ===== Rutas =====
  if (typeof window.cargarRutasConfig === 'undefined') {
    window.cargarRutasConfig = async function cargarRutasConfig(){
      try {
        const tbody = document.getElementById('cuerpoTablaRutasConfig');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="4">Cargando...</td></tr>';
        const resp = await fetch('php/admin.php?accion=rutas', { cache: 'no-store', credentials: 'same-origin' });
        const raw = await resp.text();
        let data; try { data = JSON.parse(raw); } catch(err){
          tbody.innerHTML = `<tr><td colspan="4">Error: respuesta no JSON<br><small>${raw.slice(0,200)}</small></td></tr>`;
          console.error('cargarRutasConfig parse', err, raw.slice(0,500));
          return;
        }
        if (!data || !data.exito || !Array.isArray(data.datos) || data.datos.length===0) {
          tbody.innerHTML = '<tr><td colspan="4">No hay rutas</td></tr>';
          return;
        }
        const fmtZonas = z => Array.isArray(z) ? z.join(', ') : String(z || '');
        tbody.innerHTML = data.datos.map(r => `
          <tr>
            <td>${esc(r.id)}</td>
            <td>${esc(r.nombre)}</td>
            <td>${esc(fmtZonas(r.zonas))}</td>
            <td><button class="btn btn-pequeno" disabled>Editar</button></td>
          </tr>
        `).join('');
      } catch(e){
        const tbody = document.getElementById('cuerpoTablaRutasConfig');
        if (tbody) tbody.innerHTML = '<tr><td colspan="4">Error al cargar rutas</td></tr>';
        console.error('cargarRutasConfig', e);
      }
    }
  }

  if (typeof window.seedRutasDesdeUI === 'undefined') {
    window.seedRutasDesdeUI = async function seedRutasDesdeUI(){
      try{
        const btns = Array.from(document.querySelectorAll('button')).filter(b => /Sincronizar rutas/i.test(b.textContent||''));
        btns.forEach(b=>{ b.disabled = true; b.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...'; });
        const form = new URLSearchParams(); form.append('accion','seed_rutas');
        const resp = await fetch('php/admin.php', { method:'POST', body: form });
        const raw = await resp.text();
        let data; try { data = JSON.parse(raw); } catch (e) { data = { exito:false, mensaje: 'Respuesta no JSON', raw }; }
        if (!data.exito) { alert('Error al sincronizar rutas: ' + (data.mensaje || 'Desconocido')); return; }
        alert(`Rutas sincronizadas. Creadas: ${data.creadas||0}, Actualizadas: ${data.actualizadas||0}`);
        if (typeof window.cargarRutasConfig === 'function') window.cargarRutasConfig();
      } catch(e){
        console.error('seedRutasDesdeUI', e);
        alert('Error al sincronizar rutas: ' + e.message);
      } finally {
        const btns = Array.from(document.querySelectorAll('button')).filter(b => /Sincronizar rutas/i.test(b.textContent||''));
        btns.forEach(b=>{ b.disabled = false; b.textContent = 'Sincronizar rutas'; });
      }
    }
  }

  // ===== Asignación =====
  if (typeof window.cargarPaquetesSinAsignar === 'undefined') {
    window.cargarPaquetesSinAsignar = async function cargarPaquetesSinAsignar(){
      try {
        const resp = await fetch('php/admin.php?accion=todos_paquetes', { cache: 'no-store' });
        const d = await resp.json();
        if (!d.exito) return;
        const tbody = document.getElementById('cuerpoSinAsignar');
        if (!tbody) return;
        const sin = (d.datos || []).filter(p => !p.empleado_id);
        tbody.innerHTML = sin.map(p => `
          <tr>
            <td>${esc(p.id)}</td>
            <td>${esc(p.codigo || '')}</td>
            <td>${esc(p.destinatario || '')}</td>
            <td>${esc(p.distrito || '')}</td>
            <td><button class="btn btn-pequeno btn-primario" onclick="reasignarPrompt(${Number(p.id)})">Reasignar</button></td>
          </tr>
        `).join('');
      } catch (e) { console.error('cargarPaquetesSinAsignar', e); }
    }
  }

  if (typeof window.asignarPaquetesAuto === 'undefined') {
    window.asignarPaquetesAuto = async function asignarPaquetesAuto(){
      try {
        const fd = new URLSearchParams(); fd.append('accion','asignar_paquetes_auto');
        const r = await fetch('php/admin.php', { method:'POST', body: fd });
        const d = await r.json();
        alert(`Asignación: asignados=${d.asignados||0}, sin_ruta=${d.sin_ruta||0}, sin_empleado=${d.sin_empleado||0}`);
        if (typeof cargarPaquetesSinAsignar==='function') await cargarPaquetesSinAsignar();
        if (typeof cargarResumenAsignados==='function') await cargarResumenAsignados();
      } catch(e){ console.error('asignarPaquetesAuto', e); alert('Error asignando'); }
    }
  }

  if (typeof window.reasignarPrompt === 'undefined') {
    window.reasignarPrompt = async function reasignarPrompt(paqueteId){
      try {
        const empleadoId = prompt('ID de empleado destino:');
        if (!empleadoId) return;
        const fd = new FormData();
        fd.append('accion','reasignar_paquete');
        fd.append('paquete_id', String(paqueteId));
        fd.append('empleado_id', String(empleadoId));
        const r = await fetch('php/admin.php', { method:'POST', body: fd });
        const d = await r.json();
        if (!d.exito) { alert(d.mensaje || 'No se pudo reasignar'); return; }
        if (typeof cargarPaquetesSinAsignar==='function') await cargarPaquetesSinAsignar();
        if (typeof cargarResumenAsignados==='function') await cargarResumenAsignados();
      } catch(e){ console.error('reasignarPrompt', e); }
    }
  }

  if (typeof window.cargarResumenAsignados === 'undefined') {
    window.cargarResumenAsignados = async function cargarResumenAsignados(){
      try{
        const r = await fetch('php/admin.php?accion=todos_paquetes', { cache: 'no-store' });
        const d = await r.json();
        if (!d.exito) return;
        const items = Array.isArray(d.datos) ? d.datos : [];
        const asignados = items.filter(x => {
          const raw = (x.empleado_id !== undefined && x.empleado_id !== null) ? String(x.empleado_id).trim() : '';
          const id = parseInt(raw, 10);
          return Number.isFinite(id) && id > 0;
        });
        const porEmpleado = {};
        for (const p of asignados){
          const raw = (p.empleado_id !== undefined && p.empleado_id !== null) ? String(p.empleado_id).trim() : '';
          const empId = parseInt(raw, 10) || 0; if (!empId) continue;
          const key = String(empId);
          const nombre = (p.empleado_nombre && String(p.empleado_nombre).trim()) ? String(p.empleado_nombre).trim() : ('Empleado '+key);
          if (!porEmpleado[key]) porEmpleado[key] = { empleado_id: empId, empleado_nombre: nombre, zona: p.zona || '', total:0, lista: [] };
          porEmpleado[key].total++;
          porEmpleado[key].lista.push({ id: p.id, codigo: p.codigo || '', destinatario: p.destinatario || p.consignado || '', distrito: p.distrito || '' });
        }
        const tbody = document.getElementById('cuerpoResumenAsignados');
        if (!tbody) return;
        const arr = Object.values(porEmpleado).sort((a,b)=>b.total-a.total);
        if (arr.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Sin asignaciones</td></tr>';
          const cont = document.getElementById('listaAsignadosEmpleado'); if (cont) cont.style.display='';
          return;
        }
        tbody.innerHTML = arr.map(e => `
          <tr>
            <td>${esc(e.empleado_nombre)}</td>
            <td>${esc(e.zona || '')}</td>
            <td class="text-center">${esc(e.total)}</td>
            <td><button class="btn btn-pequeno" onclick="verPaquetesEmpleado(${e.empleado_id})">Ver</button></td>
          </tr>
        `).join('');
        window.__asignados_por_empleado = porEmpleado;
      }catch(err){ console.error('cargarResumenAsignados', err); }
    }
  }

  if (typeof window.verPaquetesEmpleado === 'undefined') {
    window.verPaquetesEmpleado = function verPaquetesEmpleado(empleadoId){
      const data = (window.__asignados_por_empleado||{})[String(empleadoId)];
      const cont = document.getElementById('listaAsignadosEmpleado');
      const titulo = document.getElementById('tituloListaEmpleado');
      const tbody = document.getElementById('cuerpoListaEmpleado');
      if (!data || !cont || !tbody || !titulo) return;
      titulo.textContent = `Paquetes de ${data.empleado_nombre} (${data.total})`;
      tbody.innerHTML = data.lista.map(p => `
        <tr>
          <td>${esc(p.id)}</td>
          <td>${esc(p.codigo)}</td>
          <td>${esc(p.destinatario)}</td>
          <td>${esc(p.distrito)}</td>
        </tr>
      `).join('');
      cont.style.display = '';
    }
  }
})();
