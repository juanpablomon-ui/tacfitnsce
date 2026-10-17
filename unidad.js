/* #TACFITNSCE — Mi unidad (camino A, sin servidor): el alumno se une con un código y envía su «parte» (archivo) por WhatsApp
   o correo; el instructor o comandante carga los partes y ve su unidad ordenada por compañía → sección → escuadra:
   resumen, alertas, capacidades, pruebas, ficha de cada alumno, Excel y envío de un plan a la unidad.
   Datos de salud (peso, lesiones, PAR-Q) solo si el alumno lo acepta. Los partes se guardan aparte (clave newen_mando). */
const GRADOS = ['Soldado conscripto', 'Soldado', 'Cabo segundo', 'Cabo primero', 'Cabo', 'Sargento segundo', 'Sargento primero', 'Suboficial',
  'Suboficial mayor', 'Alférez', 'Subteniente', 'Teniente', 'Capitán', 'Mayor', 'Teniente coronel', 'Coronel', 'Cadete', 'Alumno', 'Civil'];
const slug = t=>String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase();
const leerCodigo = t=>{ const m = /U-[A-Z0-9]{6}/i.exec(String(t || '')); return m ? m[0].toUpperCase() : null; };
async function compartirArchivo(nombre, obj, titulo){
  const blob = new Blob([JSON.stringify(obj)], {type:'application/json'}), file = new File([blob], nombre, {type:'application/json'});
  if(navigator.canShare && navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file], title:titulo}); return; }catch(e){ if(e && e.name==='AbortError') return; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function leerArchivos(accept, alListo){
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept; inp.multiple = true;
  inp.onchange = async ()=>{ const out = []; for(const f of inp.files){ try{ out.push(JSON.parse(await f.text())); }catch(e){ out.push(null); } } alListo(out); };
  inp.click();
}

/* ======================= Lado del alumno ======================= */
function generarParte(){
  const U = S.unidad, st = estadisticas(), es = estadoEntreno(), F = formaFisica(1).pop(), dp = disposicionDia(), pp = perfilPSF();
  S.idAlumno = S.idAlumno || 'a' + uid();
  const ses = S.sesiones.filter(s=>s.fecha >= hace(90)).sort((a, b)=>a.fecha < b.fecha ? 1 : -1).map(s=>{ const m = metricas(s);
    return {f:s.fecha, n:s.titulo || etiquetaTipo(s), t:etiquetaTipo(s), r:s.txt || '', min:m.min || 0, rpe:+s.rpe || null, km:Math.round(m.km * 10) / 10, kcal:kcalDe(s), g:grupoDe(s), d:s.tipo==='descanso'}; });
  const serie = ej=>valoresDe(ej).slice(-8).map(v=>({f:v.fecha, v:v.valor}));
  const evals = {}; PRUEBAS.filter(P=>!P.ej && P.id!=='brazos').forEach(P=>{ const e = ultimaEval(P.id), ev = e && evaluarPrueba(e); if(ev) evals[P.id] = {f:e.fecha, txt:ev.txt, nivel:ev.nivel, cumple:ev.cumple, pct:ev.pct}; });
  const parte = {tipo:'parte-tacfit', v:1, generado:new Date().toISOString(), hoy:hoyISO(), codigo:U.codigo, unidad:U.unidad || '', id:S.idAlumno,
    alumno:{grado:U.grado, nombre:U.nombre, compania:U.compania || '', seccion:U.seccion || '', escuadra:U.escuadra || '', sexo:S.perfil.sexo || '', edad:pp.edad},
    resumen:{n:st.n, racha:st.racha, rachaMax:st.rachaMax, km:Math.round(Object.values(st.km).reduce((a, b)=>a + b, 0) / 100) / 10, horas:Math.round(st.min / 6) / 10, rango:puntos().rango, insignias:insigniasGanadas(estadoInsignias(st)).length},
    carga:{estado:es.k, ratio:es.ratio ? Math.round(es.ratio * 100) / 100 : null, forma:F ? Math.round(formaPct(F)) : null, ctl:F ? Math.round(F.ctl) : null, alist:dp ? dp.v : null},
    ses, pruebas:{psf2400:serie('psf2400'), abd1:serie('abd1'), barras:serie('barras'), flex1:serie('flex1')}, evals,
    caps:nivelesCapacidad().map(c=>({id:c.id, nivel:c.nivel})),
    plan:S.plan ? {n:S.plan.obj==='propio' ? S.plan.nombre || 'Plan propio' : objDe(S.plan.obj).n + (S.plan.sub ? ' · ' + S.plan.sub : ''), deUnidad:!!S.plan.unidad, cumple:cumplimiento()} : null,
    salud:null};
  if(U.salud){ const pq = estadoParq();
    parte.salud = {peso:medidaReciente('peso'), talla:medidaReciente('talla'), cintura:medidaReciente('cintura'), grasa:medidaReciente('grasa'), fcr:medidaReciente('fcr'),
      limites:limitesActivos().map(l=>({zona:(ZONAS[l.zona] || {n:l.zona}).n, tipo:l.tipo || '', hasta:l.hasta || '', nota:l.nota || ''})), parq:pq.txt, parqK:pq.k}; }
  return parte;
}
function enviarParte(){
  const U = S.unidad, P = generarParte(), nombre = 'parte_' + slug(U.grado + ' ' + U.nombre) + '_' + hoyISO() + '.json';
  dialogo(`<div class="cab"><h2>📤 Parte de entrenamiento</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <p class="suave chico">Para: <b>${esc(U.unidad || U.codigo)}</b>. Se envía como archivo: elige WhatsApp o correo y mándalo a tu instructor.</p>
    <ul class="lista chico parte-inc">
      <li>✓ ${P.ses.length} entrenamientos de los últimos 90 días</li><li>✓ Capacidades y pruebas</li><li>✓ Carga, forma y alistamiento</li>
      <li>✓ ${P.plan ? 'Cumplimiento de «' + esc(P.plan.n) + '»' : 'Sin plan activo'}</li>
      <li>${U.salud ? '✓ Datos de salud: peso, medidas, lesiones y PAR-Q' : '✗ Datos de salud no se comparten (puedes cambiarlo en Editar)'}</li></ul>
    <div class="btns"><button class="btn" data-cerrar>Cancelar</button><button class="btn prim" id="ptEnviar">📤 Enviar parte</button></div>`, d=>{
    $('#ptEnviar', d).onclick = async ()=>{ await compartirArchivo(nombre, P, 'Parte de entrenamiento'); S.unidad.ultParte = hoyISO(); guardar(); d.close(); aviso('Parte listo para enviar'); if(vistaActual==='perfil') vPerfil(); };
  });
}
function dialogoUnirme(){
  if(nubeLista() && !conectado()) return dialogoIngresar(dialogoUnirme);
  const U = S.unidad || {};
  dialogo(`<div class="cab"><h2>🎖️ Mi unidad o curso</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <label>Código o invitación de tu instructor</label><input id="unCod" value="${esc(U.codigo ? U.codigo + (U.unidad ? ' · ' + U.unidad : '') : '')}" placeholder="Ej.: U-7KQ2MX" autocapitalize="characters">
    <div class="fila"><div><label>Grado</label><select id="unGrado">${GRADOS.map(g=>`<option ${g===(U.grado || 'Alumno') ? 'selected' : ''}>${g}</option>`).join('')}</select></div>
      <div><label>Nombre y apellido</label><input id="unNom" value="${esc(U.nombre || S.perfil.nombre || '')}"></div></div>
    <div class="fila3"><div><label>Compañía</label><input id="unCia" value="${esc(U.compania || '')}" placeholder="1.ª"></div><div><label>Sección</label><input id="unSec" value="${esc(U.seccion || '')}" placeholder="2.ª"></div>
      <div><label>Escuadra</label><input id="unEsc" value="${esc(U.escuadra || '')}" placeholder="3.ª"></div></div>
    <label class="agua-calor"><input type="checkbox" id="unSalud" ${U.salud ? 'checked' : ''}><span>Acepto compartir con mi instructor mis <b>datos de salud</b>: peso y medidas, lesiones o limitaciones y PAR-Q.</span></label>
    <p class="nota">Siempre se comparten tus entrenamientos, capacidades, pruebas y el cumplimiento de tu plan. Solo los ve quien recibe tu parte. Puedes salir de la unidad cuando quieras.</p>
    <div class="btns">${S.unidad ? '<button class="btn" id="unSalir">Salir de la unidad</button>' : '<button class="btn" data-cerrar>Cancelar</button>'}<button class="btn prim" id="unOk">Guardar</button></div>`, d=>{
    $('#unOk', d).onclick = async ()=>{ const txt = $('#unCod', d).value, cod = leerCodigo(txt), nom = $('#unNom', d).value.trim();
      if(!cod){ aviso('El código tiene la forma U-XXXXXX'); return; } if(!nom){ aviso('Escribe tu nombre'); return; }
      const nUni = (txt.split('·')[1] || txt.split(/U-[A-Z0-9]{6}/i)[1] || '').replace(/^[\s:·-]+/, '').trim();
      const nuevo = Object.assign({}, U, {codigo:cod, unidad:nUni || (U.codigo===cod ? U.unidad : ''), grado:$('#unGrado', d).value, nombre:nom, compania:$('#unCia', d).value.trim(),
        seccion:$('#unSec', d).value.trim(), escuadra:$('#unEsc', d).value.trim(), salud:$('#unSalud', d).checked});
      if(conectado()){ $('#unOk', d).disabled = true;
        try{ const r = await nubeUnirse(nuevo); nuevo.nube = r.id; nuevo.unidad = r.nombre; }catch(e){ $('#unOk', d).disabled = false; return aviso(e.message); } }
      S.unidad = nuevo; guardar(); d.close(); aviso('Te uniste a ' + (nuevo.unidad || 'la unidad')); if(conectado()) nubeSincronizar(true); vPerfil(); };
    if($('#unSalir', d)) $('#unSalir', d).onclick = async ()=>{ try{ await nubeSalir(); }catch(e){} S.unidad = null; guardar(); d.close(); vPerfil(); };
  });
}
function cargarPlanInstructor(){
  leerArchivos('.json,application/json', ([x])=>{
    if(!x || x.tipo!=='plan-tacfit' || !x.plan){ aviso('Ese archivo no es un plan de #TACFITNSCE'); return; }
    if(S.unidad && x.codigo && x.codigo!==S.unidad.codigo){ aviso('Ese plan es de otra unidad (' + x.codigo + ')'); return; }
    const aplicar = ()=>{ const hoy = hoyISO(); S.plan = Object.assign({}, x.plan, {desde:hoy > x.plan.inicio ? hoy : x.plan.inicio, swaps:[], cambios:{}, unidad:x.unidad || x.codigo});
      if(S.unidad && x.unidad && !S.unidad.unidad) S.unidad.unidad = x.unidad; guardar(); aviso('Plan de tu unidad cargado'); ir('plan'); };
    if(S.plan) confirmar('Esto reemplaza tu plan actual por el de tu instructor. ¿Continuar?', aplicar); else aplicar();
  });
}
function htmlMiUnidad(){
  const U = S.unidad, d = U && U.ultParte ? diasEntre(U.ultParte, hoyISO()) : null;
  return `<h3>Mi unidad</h3><div class="tarjeta mi-unidad">${!U
    ? `<p class="suave chico" style="margin-top:0">Si tu instructor o comandante te dio un código, únete para enviarle tu parte de entrenamiento y recibir el plan de la unidad.</p>
       <button class="btn prim ancho" id="muUnir">🎖️ Unirme con un código</button>`
    : `<div class="entre"><div><div class="etiqueta">${esc(U.unidad || 'Unidad')} · ${esc(U.codigo)}</div><b>${esc(U.grado)} ${esc(U.nombre)}</b>
        <div class="suave chico">${[U.compania && U.compania + ' Cía.', U.seccion && U.seccion + ' Sec.', U.escuadra && U.escuadra + ' Esc.'].filter(Boolean).join(' · ') || 'Sin compañía/sección/escuadra'} · salud ${U.salud ? 'compartida' : 'no compartida'}</div></div>
        <button class="btn chico-btn" id="muEditar" aria-label="Editar">✎</button></div>
      ${U.nube ? `<p class="chico" style="color:var(--mb)">☁️ En línea: tu parte y tus resultados le llegan solos a tu instructor.${conectado() ? '' : ' <b>Ingresa con tu correo para que funcione.</b>'}</p>`
        : `<p class="chico ${d==null || d >= 7 ? 'alerta-lim' : 'suave'}">${d==null ? 'Aún no envías tu parte.' : 'Último parte: ' + (d===0 ? 'hoy' : 'hace ' + d + ' día' + (d===1 ? '' : 's')) + '.'}</p>
      <div class="btns"><button class="btn prim" id="muParte">📤 Enviar parte</button><button class="btn" id="muPlan">📥 Plan del instructor</button></div>`}`}
    <button class="link mu-inst" id="muInst">Soy instructor o comandante ›</button></div>`;
}
function enlazarMiUnidad(){
  if($('#muUnir')) $('#muUnir').onclick = dialogoUnirme; if($('#muEditar')) $('#muEditar').onclick = dialogoUnirme;
  if($('#muParte')) $('#muParte').onclick = enviarParte; if($('#muPlan')) $('#muPlan').onclick = cargarPlanInstructor;
  $('#muInst').onclick = ()=>ir('unidad');
}
/* Recordatorio semanal en el Inicio */
function htmlRecordatorioParte(){
  const U = S.unidad; if(!U || U.nube) return '';
  const d = U.ultParte ? diasEntre(U.ultParte, hoyISO()) : null; if(d!=null && d < 7) return '';
  return `<button class="aviso-parte" id="rpEnviar">📤 <span>Envía tu parte de entrenamiento a ${esc(U.unidad || 'tu instructor')}${d!=null ? ' (último hace ' + d + ' días)' : ''}</span><span class="chev">›</span></button>`;
}

/* ======================= Lado del instructor ======================= */
const MANDO_KEY = 'newen_mando'; let _mando = null, filtroU = {cia:'', sec:'', esc:''}, pruebaU = 'psf2400';
function mando(){ if(!_mando){ try{ _mando = JSON.parse(localStorage.getItem(MANDO_KEY)); }catch(e){} _mando = _mando || {unidades:[], partes:{}, sel:null}; } return _mando; }
function guardarMando(){ try{ localStorage.setItem(MANDO_KEY, JSON.stringify(_mando)); }catch(e){ aviso('No queda espacio para guardar más partes'); } }
function nuevoCodigo(){ const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = 'U-'; for(let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
const invitacion = u=>`Únete a «${u.nombre}» en #TACFITNSCE: Perfil → Mi unidad → Unirme con un código. Código: ${u.codigo} · ${u.nombre}`;
function dialogoCrearUnidad(){
  dialogo(`<div class="cab"><h2>＋ Nueva unidad o curso</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <label>Nombre</label><input id="cuNom" placeholder="Ej.: Curso de Guerrilla 2026 / 2.ª Compañía">
    <p class="nota">La app crea un código para que tus alumnos se unan. Puedes tener varias unidades.</p>
    <div class="btns"><button class="btn" data-cerrar>Cancelar</button><button class="btn prim" id="cuOk">Crear</button></div>`, d=>{
    $('#cuOk', d).onclick = async ()=>{ const n = $('#cuNom', d).value.trim(); if(!n){ aviso('Ponle nombre'); return; }
      let u = {codigo:nuevoCodigo(), nombre:n, creada:hoyISO()};
      if(conectado()){ $('#cuOk', d).disabled = true; try{ const r = await nubeCrearUnidad(n); u = {codigo:r.codigo, nombre:r.nombre, creada:hoyISO(), nube:r.id}; }catch(e){ $('#cuOk', d).disabled = false; return aviso(e.message); } }
      const M = mando(); M.unidades.push(u); M.sel = u.codigo; guardarMando(); d.close(); vUnidad(); dialogoInvitar(u); };
  });
}
function dialogoInvitar(u){
  dialogo(`<div class="cab"><h2>Invitar alumnos</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <div class="codigo-u num">${esc(u.codigo)}</div>
    <p class="suave chico">Envía este mensaje por el grupo de WhatsApp de tu unidad:</p><textarea id="ivTxt" rows="4" readonly>${esc(invitacion(u))}</textarea>
    <div class="btns"><button class="btn" id="ivCopiar">⧉ Copiar</button>${navigator.share ? '<button class="btn prim" id="ivEnviar">↗ Enviar</button>' : ''}</div>
    <p class="nota">Cada alumno: Perfil → Mi unidad → Unirme con un código → pega el mensaje, completa grado, compañía, sección y escuadra. Luego te envía su parte cada semana.</p>`, d=>{
    $('#ivCopiar', d).onclick = ()=>{ try{ navigator.clipboard.writeText(invitacion(u)).catch(()=>{}); }catch(e){} aviso('Copiado'); };
    if($('#ivEnviar', d)) $('#ivEnviar', d).onclick = ()=>navigator.share({text:invitacion(u)}).catch(()=>{});
  });
}
function cargarPartes(){
  leerArchivos('.json,application/json', xs=>{
    const M = mando(); let ok = 0, otra = 0, mal = 0, viejo = 0;
    xs.forEach(x=>{ if(!x || x.tipo!=='parte-tacfit' || !x.id){ mal++; return; }
      if(!M.unidades.some(u=>u.codigo===x.codigo)){ otra++; return; }
      const k = x.codigo + '|' + x.id, a = M.partes[k]; if(a && a.generado > x.generado){ viejo++; return; }
      M.partes[k] = x; ok++; });
    guardarMando(); vUnidad();
    aviso([ok && ok + ' parte' + (ok > 1 ? 's' : '') + ' cargado' + (ok > 1 ? 's' : ''), otra && otra + ' de otra unidad', viejo && viejo + ' más antiguo' + (viejo > 1 ? 's' : ''), mal && mal + ' archivo' + (mal > 1 ? 's' : '') + ' no válido' + (mal > 1 ? 's' : '')].filter(Boolean).join(' · ') || 'Nada que cargar', 3500);
  });
}
const partesDe = cod=>Object.values(mando().partes).filter(p=>p.codigo===cod);
/* Métricas de un alumno a partir de su parte */
function metAlumno(P){
  const hoy = hoyISO(), lun = iso(inicioSemana()), ent_ = P.ses.filter(s=>!s.d), ult = ent_[0] ? ent_[0].f : null, s30 = ent_.filter(s=>s.f >= hace(29)), s28 = ent_.filter(s=>s.f >= hace(27));
  const antig = diasEntre(P.hoy, hoy), alist = antig <= 1 ? P.carga.alist : null;
  const al = [];
  if(ult==null || diasEntre(ult, hoy) >= 7) al.push(['⏸', ult ? diasEntre(ult, hoy) + ' días sin entrenar' : 'Sin entrenamientos registrados', 2]);
  if(P.carga.estado==='sobrecarga' || P.carga.estado!=='recopilando' && P.carga.forma!=null && P.carga.forma < -35 && (P.carga.ctl || 0) >= 40) al.push(['🔺', 'Sobrecarga o fatiga alta', 2]);
  if(alist!=null && alist < 50) al.push([alist < 25 ? '🔴' : '🟠', 'Alistamiento ' + (alist < 25 ? 'rojo' : 'naranja') + ' (' + alist + ')', alist < 25 ? 2 : 1]);
  if(P.salud && P.salud.limites && P.salud.limites.length) al.push(['🩹', 'Limitación: ' + P.salud.limites.map(l=>l.zona.toLowerCase()).join(', '), 2]);
  if(P.salud && P.salud.parqK==='si') al.push(['⚕️', 'PAR-Q: debe consultar a un médico', 2]); else if(P.salud && P.salud.parqK==='pend') al.push(['⚕️', 'PAR-Q ' + P.salud.parq.toLowerCase(), 1]);
  if(antig > 10) al.push(['📭', 'Parte desactualizado (' + antig + ' días)', 1]);
  return {sem:ent_.filter(s=>s.f >= lun).length, s30:s30.length, semProm:s28.length / 4, km30:s30.reduce((a, s)=>a + (s.km || 0), 0), min30:s30.reduce((a, s)=>a + (s.min || 0), 0),
    ult, antig, alist, cumple:P.plan && P.plan.cumple ? P.plan.cumple.pct : null, alertas:al};
}
const nomAl = P=>(P.alumno.grado ? P.alumno.grado + ' ' : '') + P.alumno.nombre;
const colorAlist = v=>v==null ? 'var(--borde)' : CONDICION(v).c;
const PRUEBAS_U = [['psf2400', '2.400 m', true], ['abd1', 'Abdominales 1 min', false], ['barras', 'Barras', false], ['flex1', 'Flexiones 1 min', false]];
function filasPrueba(ps, id){
  const psf = PRUEBAS_U.find(x=>x[0]===id);
  return ps.map(P=>{ if(psf){ const s = P.pruebas[id] || []; if(!s.length) return null; const u = s[s.length - 1], a = s[s.length - 2], pp = {sexo:P.alumno.sexo, edad:P.alumno.edad, brazos:'barra'};
      let nivel = null; try{ if(P.alumno.sexo && P.alumno.edad!=null) nivel = id==='psf2400' ? PSF.carrera(pp, u.v).nivel : id==='abd1' ? PSF.abdominales(pp, u.v).nivel : null; }catch(e){}
      const dif = a ? (psf[2] ? a.v - u.v : u.v - a.v) : null;
      return {P, v:u.v, txt:psf[2] ? PSF.verTiempo(u.v) : u.v + ' rep', f:u.f, nivel, dif:dif==null ? '' : (dif > 0 ? '▲ ' : dif < 0 ? '▼ ' : '＝ ') + (psf[2] ? PSF.verTiempo(Math.abs(dif)) : Math.abs(dif)), sube:dif > 0, orden:psf[2] ? u.v : -u.v}; }
    const e = P.evals && P.evals[id]; if(!e) return null;
    return {P, txt:e.txt, f:e.f, cumple:e.cumple, nivelN:e.nivel, orden:-(e.pct || e.nivel || 0)}; }).filter(Boolean).sort((a, b)=>a.orden - b.orden);
}
function vUnidad(){
  const M = mando();
  if(!M.unidades.length){ $('#vista').innerHTML = `<div class="cab-an"><button class="btn chico-btn" id="uAtras" aria-label="Volver">‹</button><h2>Mi unidad</h2></div>
      <div class="tarjeta"><p>Como instructor o comandante, aquí ves la información de tu unidad o curso: quién entrena, su cumplimiento, alistamiento, capacidades, pruebas y la ficha de cada alumno.</p>
      ${nubeLista() ? `<ol class="chico pasos-u"><li>Ingresa con tu correo y crea tu unidad: la app te da un código.</li><li>Envíalo a tus alumnos por WhatsApp.</li><li>Cada alumno ingresa con su correo y se une.</li><li>Publicas la tarea de cada día; ellos la ven en su Inicio y sus resultados te llegan solos.</li></ol>
        ${conectado() ? '' : '<button class="btn ancho" id="uIngresar" style="margin-bottom:8px">☁️ Ingresar con mi correo</button>'}`
      : '<ol class="chico pasos-u"><li>Crea tu unidad: la app te da un código.</li><li>Envíalo a tus alumnos por WhatsApp.</li><li>Cada alumno se une y te envía su parte (archivo) cada semana.</li><li>Cargas los partes aquí y ves todo.</li></ol>'}
      <button class="btn prim ancho" id="uCrear">＋ Crear mi unidad o curso</button></div>`;
    $('#uAtras').onclick = ()=>ir('perfil'); $('#uCrear').onclick = dialogoCrearUnidad; if($('#uIngresar')) $('#uIngresar').onclick = ()=>dialogoIngresar();
    if(conectado() && !nubeUnidadesVistas){ nubeUnidadesVistas = true; nubeMisUnidades().then(()=>{ if(mando().unidades.length && vistaActual==='unidad') vUnidad(); }).catch(()=>{}); }
    return; }
  if(!M.unidades.some(u=>u.codigo===M.sel)) M.sel = M.unidades[0].codigo;
  const u = M.unidades.find(x=>x.codigo===M.sel);
  if(conectado() && !nubeUnidadesVistas){ nubeUnidadesVistas = true; nubeMisUnidades().then(()=>{ if(vistaActual==='unidad') vUnidad(); }).catch(()=>{}); }
  if(u.nube && conectado() && (!NU[u.codigo] || Date.now() - NU[u.codigo].t > 60000) && !(NU[u.codigo] || {}).cargando){
    NU[u.codigo] = Object.assign(NU[u.codigo] || {}, {cargando:true, t:Date.now()});
    nubeCargarUnidad(u).then(()=>{ if(vistaActual==='unidad') vUnidad(); }).catch(e=>{ NU[u.codigo].cargando = false; aviso(e.message); }); }
  const todos = partesDe(u.codigo);
  const ops = k=>[...new Set(todos.map(P=>P.alumno[k]).filter(Boolean))].sort();
  const ps = todos.filter(P=>(!filtroU.cia || P.alumno.compania===filtroU.cia) && (!filtroU.sec || P.alumno.seccion===filtroU.sec) && (!filtroU.esc || P.alumno.escuadra===filtroU.esc));
  const ms = new Map(ps.map(P=>[P, metAlumno(P)])), n = ps.length, avg = f=>{ const v = ps.map(P=>f(ms.get(P), P)).filter(x=>x!=null); return v.length ? v.reduce((a, b)=>a + b, 0) / v.length : null; };
  const alDia = ps.filter(P=>ms.get(P).antig <= 7).length, entSem = ps.filter(P=>ms.get(P).sem > 0).length;
  const cond = {Verde:0, Amarilla:0, Naranja:0, Roja:0, 'Sin dato':0}; ps.forEach(P=>{ const v = ms.get(P).alist; cond[v==null ? 'Sin dato' : CONDICION(v).n]++; });
  const alertas = ps.flatMap(P=>ms.get(P).alertas.map(a=>({P, a}))).sort((x, y)=>y.a[2] - x.a[2]);
  const caps = CAPACIDADES.map(c=>{ const v = ps.map(P=>(P.caps.find(x=>x.id===c.id) || {}).nivel).filter(x=>x!=null); return Object.assign({}, c, {nivel:v.length ? v.reduce((a, b)=>a + b, 0) / v.length : null, cnt:v.length}); });
  const opsPr = PRUEBAS_U.map(x=>[x[0], x[1]]).concat(PRUEBAS.filter(P=>!P.ej && P.id!=='brazos').map(P=>[P.id, P.n]));
  const fp = filasPrueba(ps, pruebaU);
  // árbol compañía → sección → escuadra
  const arbol = {}; ps.forEach(P=>{ const a = P.alumno, k1 = a.compania || '—', k2 = a.seccion || '—', k3 = a.escuadra || '—'; (((arbol[k1] = arbol[k1] || {})[k2] = arbol[k1][k2] || {})[k3] = arbol[k1][k2][k3] || []).push(P); });
  const filaAl = P=>{ const m = ms.get(P); return `<li class="al-fila" data-al="${esc(P.codigo + '|' + P.id)}"><i class="al-dot" style="background:${colorAlist(m.alist)}"></i>
      <div class="al-n"><b>${esc(nomAl(P))}</b><span class="suave chico num">${m.sem} esta semana · ${m.s30} en 30 días${m.cumple!=null ? ' · plan ' + m.cumple + ' %' : ''}</span></div>
      <span class="al-al">${m.alertas.map(a=>`<span title="${esc(a[1])}">${a[0]}</span>`).join('')}</span></li>`; };
  const sel = (id, k, val, t)=>`<select id="${id}"><option value="">${t}: todas</option>${ops(k).map(o=>`<option ${o===val ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  $('#vista').innerHTML = `<div class="cab-an"><button class="btn chico-btn" id="uAtras" aria-label="Volver">‹</button><h2>Mi unidad</h2></div>
    <div class="chips" id="uSel" style="padding-top:0">${M.unidades.map(x=>`<button data-u="${esc(x.codigo)}" class="${x.codigo===u.codigo ? 'activa' : ''}">${esc(x.nombre)}</button>`).join('')}<button id="uNueva">＋</button></div>
    <div class="tarjeta"><div class="entre"><div><div class="etiqueta">Código ${esc(u.codigo)}</div><h3 style="margin:2px 0">${esc(u.nombre)}</h3><div class="suave chico">${todos.length} alumno${todos.length===1 ? '' : 's'} con parte</div></div>
      <button class="btn chico-btn" id="uInvitar" aria-label="Invitar">＋👤</button></div>
      ${u.nube ? `<div class="u-acc"><button class="btn prim" id="uActualizar">🔄 Actualizar</button><button class="btn" id="uExcel">⬇ Excel</button><button class="btn" id="uCargar">📥 Partes</button></div>
        <p class="chico" style="color:var(--mb);margin:8px 0 0">☁️ En línea${conectado() ? '' : ': <b>ingresa con tu correo para ver los datos</b>'}${NU[u.codigo] && NU[u.codigo].t && !NU[u.codigo].cargando ? ' · actualizado ' + new Date(NU[u.codigo].t).toTimeString().slice(0, 5) : ''}</p>`
      : `<div class="u-acc"><button class="btn prim" id="uCargar">📥 Cargar partes</button><button class="btn" id="uExcel">⬇ Excel</button><button class="btn" id="uPlan">📋 Enviar plan</button></div>`}</div>
    ${u.nube ? htmlTareaInstructor(u) : ''}
    ${!todos.length ? `<div class="tarjeta vacio chico">Aún no hay partes. Envía el código a tus alumnos (botón ＋👤). Cuando te manden su parte por WhatsApp o correo, guárdalo y tócalo en «📥 Cargar partes» (puedes elegir varios a la vez).</div>` : `
    <div class="u-filtros">${sel('fCia', 'compania', filtroU.cia, 'Cía.')}${sel('fSec', 'seccion', filtroU.sec, 'Sec.')}${sel('fEsc', 'escuadra', filtroU.esc, 'Esc.')}</div>
    <div class="u-res">
      <div><b class="num">${n}</b><span>alumnos</span><small>${alDia} con parte al día</small></div>
      <div><b class="num">${n ? Math.round(entSem / n * 100) : 0} %</b><span>entrenó esta semana</span><small>${entSem} de ${n}</small></div>
      <div><b class="num">${fmtNum(Math.round((avg(m=>m.semProm) || 0) * 10) / 10)}</b><span>sesiones/semana</span><small>promedio 4 semanas</small></div>
      <div><b class="num">${fmtNum(nKm(avg(m=>m.km30) || 0))}</b><span>${uDist()} en 30 días</span><small>por alumno</small></div>
      <div><b class="num">${avg(m=>m.cumple)!=null ? Math.round(avg(m=>m.cumple)) + ' %' : '—'}</b><span>cumplimiento</span><small>del plan</small></div>
      <div><b class="num">${alertas.filter(x=>x.a[2]===2).length}</b><span>alertas</span><small>importantes</small></div>
    </div>
    <div class="tarjeta"><div class="etiqueta">Alistamiento de hoy</div>
      <div class="u-cond">${Object.entries(cond).filter(([, v])=>v).map(([k, v])=>`<span style="flex:${v};background:${k==='Sin dato' ? 'var(--borde)' : CONDICION(k==='Verde' ? 80 : k==='Amarilla' ? 60 : k==='Naranja' ? 30 : 10).c}"></span>`).join('')}</div>
      <div class="plan-ley chico">${Object.entries(cond).map(([k, v])=>`<span>${k}: <b>${v}</b></span>`).join('')}</div>
      <p class="nota">Solo cuenta a quienes enviaron su parte hoy o ayer.</p></div>
    <div class="tarjeta"><div class="etiqueta">Alertas · ${alertas.length}</div>
      ${alertas.length ? `<ul class="lista u-alertas">${alertas.slice(0, 30).map(x=>`<li data-al="${esc(x.P.codigo + '|' + x.P.id)}" class="${x.a[2]===2 ? 'imp' : ''}"><span>${x.a[0]}</span><div><b>${esc(nomAl(x.P))}</b><small>${esc(x.a[1])}</small></div></li>`).join('')}</ul>` : '<p class="suave chico">Sin alertas. 💪</p>'}</div>
    <div class="tarjeta"><div class="etiqueta">Capacidades promedio</div>
      ${caps.some(c=>c.nivel!=null) ? `${radarCapacidades(caps)}<ul class="lista chico">${caps.map(c=>`<li class="entre"><span>${esc(c.n)}</span><span class="num">${c.nivel!=null ? fmtNum(Math.round(c.nivel * 10) / 10) + ' · ' + NIVELES[Math.round(c.nivel)] : '—'} <span class="suave">(${c.cnt} al.)</span></span></li>`).join('')}</ul>` : '<p class="suave chico">Los alumnos aún no registran pruebas de capacidad.</p>'}</div>
    <div class="tarjeta"><div class="entre"><span class="etiqueta">Pruebas</span><select id="uPrueba">${opsPr.map(([k, t])=>`<option value="${k}" ${k===pruebaU ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
      ${fp.length ? `<ol class="u-rank">${fp.map(r=>`<li data-al="${esc(r.P.codigo + '|' + r.P.id)}"><span class="ur-n">${esc(nomAl(r.P))}</span><span class="ur-v num">${esc(r.txt)}${r.nivel ? ' ' + chip(r.nivel) : r.cumple===true ? ' ✓' : r.cumple===false ? ' ✗' : ''}</span>${r.dif ? `<small class="${r.sube ? 'sube' : 'baja'} num">${esc(r.dif)}</small>` : ''}</li>`).join('')}</ol>
        <p class="nota">${fp.length} de ${n} alumnos con esta prueba. Ordenado del mejor al menor resultado.</p>` : '<p class="suave chico">Nadie registra esta prueba todavía.</p>'}</div>
    <div class="tarjeta"><div class="etiqueta">Alumnos</div>
      ${Object.keys(arbol).sort().map(c=>`<div class="u-cia"><b>${c==='—' ? 'Sin compañía' : esc(c) + ' Compañía'}</b>${Object.keys(arbol[c]).sort().map(s=>`<div class="u-sec"><span>${s==='—' ? 'Sin sección' : esc(s) + ' Sección'}</span>${Object.keys(arbol[c][s]).sort().map(e=>`<div class="u-esc"><small>${e==='—' ? 'Sin escuadra' : esc(e) + ' Escuadra'}</small><ul class="lista">${arbol[c][s][e].sort((a, b)=>nomAl(a) < nomAl(b) ? -1 : 1).map(filaAl).join('')}</ul></div>`).join('')}</div>`).join('')}</div>`).join('')}
    </div>`}`;
  $('#uAtras').onclick = ()=>ir('perfil');
  $$('#uSel [data-u]').forEach(b=>b.onclick = ()=>{ M.sel = b.dataset.u; filtroU = {cia:'', sec:'', esc:''}; guardarMando(); vUnidad(); });
  $('#uNueva').onclick = dialogoCrearUnidad; $('#uInvitar').onclick = ()=>dialogoInvitar(u);
  $('#uCargar').onclick = cargarPartes; $('#uExcel').onclick = ()=>exportarExcel(u, ps);
  if($('#uActualizar')) $('#uActualizar').onclick = ()=>{ if(!conectado()) return dialogoIngresar(); NU[u.codigo] = {t:0}; vUnidad(); };
  if(u.nube) enlazarTareaInstructor(u);
  if($('#uPlan')) $('#uPlan').onclick = ()=>{ if(!S.plan){ aviso('Primero arma el plan en «Mi plan» y vuelve aquí'); return; }
    const pl = Object.assign({}, S.plan); delete pl.swaps; delete pl.cambios; delete pl.desde; delete pl.unidad;
    compartirArchivo('plan_' + slug(u.nombre) + '.json', {tipo:'plan-tacfit', v:1, codigo:u.codigo, unidad:u.nombre, plan:pl}, 'Plan de ' + u.nombre); };
  [['fCia', 'cia'], ['fSec', 'sec'], ['fEsc', 'esc']].forEach(([id, k])=>{ if($('#' + id)) $('#' + id).onchange = e=>{ filtroU[k] = e.target.value; vUnidad(); }; });
  if($('#uPrueba')) $('#uPrueba').onchange = e=>{ pruebaU = e.target.value; vUnidad(); };
  $$('[data-al]').forEach(li=>li.onclick = ()=>fichaAlumno(M.partes[li.dataset.al]));
}
function fichaAlumno(P){
  if(!P) return; const m = metAlumno(P), a = P.alumno, sa = P.salud;
  dialogo(`<div class="cab"><div><div class="etiqueta">${esc([a.compania && a.compania + ' Cía.', a.seccion && a.seccion + ' Sec.', a.escuadra && a.escuadra + ' Esc.'].filter(Boolean).join(' · '))}</div><h2 style="margin:2px 0">${esc(nomAl(P))}</h2>
      <div class="suave chico">Parte del ${verFecha(P.hoy)}${m.antig ? ' (hace ' + m.antig + ' días)' : ' (hoy)'} · ${esc(P.resumen.rango)} · ${P.resumen.insignias} insignias</div></div><button class="btn chico-btn" data-cerrar>✕</button></div>
    ${m.alertas.length ? `<ul class="lista u-alertas">${m.alertas.map(x=>`<li class="${x[2]===2 ? 'imp' : ''}"><span>${x[0]}</span><div><small>${esc(x[1])}</small></div></li>`).join('')}</ul>` : ''}
    <div class="u-res">
      <div><b class="num">${m.sem}</b><span>esta semana</span></div><div><b class="num">${m.s30}</b><span>en 30 días</span></div><div><b class="num">${fmtNum(Math.round(m.km30 * 10) / 10)}</b><span>km 30 días</span></div>
      <div><b class="num">${fmtHoras(m.min30)}</b><span>horas 30 días</span></div><div><b class="num">${m.cumple!=null ? m.cumple + ' %' : '—'}</b><span>${P.plan ? esc(P.plan.n) : 'sin plan'}</span></div>
      <div><b class="num" style="color:${colorAlist(m.alist)}">${m.alist!=null ? m.alist : '—'}</b><span>alistamiento</span></div></div>
    <div class="etiqueta">Capacidades</div>
    <ul class="lista chico">${CAPACIDADES.map(c=>{ const v = (P.caps.find(x=>x.id===c.id) || {}).nivel; return `<li class="entre"><span>${esc(c.n)}</span><b class="num">${v!=null ? fmtNum(Math.round(v * 10) / 10) + ' · ' + NIVELES[Math.round(v)] : '—'}</b></li>`; }).join('')}</ul>
    <div class="etiqueta">Pruebas</div>
    <ul class="lista chico">${PRUEBAS_U.map(([id, n, t])=>{ const s = P.pruebas[id] || []; return s.length ? `<li class="entre"><span>${n}</span><b class="num">${t ? PSF.verTiempo(s[s.length - 1].v) : s[s.length - 1].v + ' rep'} <span class="suave">${verFecha(s[s.length - 1].f)}</span></b></li>` : ''; }).join('')}
      ${Object.entries(P.evals || {}).map(([id, e])=>`<li class="entre"><span>${esc((pruebaDe(id) || {n:id}).n)}</span><b class="num">${esc(e.txt)}${e.cumple===true ? ' ✓' : e.cumple===false ? ' ✗' : ''}</b></li>`).join('')}</ul>
    <div class="etiqueta">Salud</div>
    ${sa ? `<ul class="lista chico"><li class="entre"><span>Peso / estatura</span><b class="num">${sa.peso ? fmtNum(sa.peso) + ' kg' : '—'} / ${sa.talla ? sa.talla + ' cm' : '—'}</b></li>
        <li class="entre"><span>Cintura · % grasa · FC reposo</span><b class="num">${sa.cintura || '—'} · ${sa.grasa!=null ? fmtNum(sa.grasa) + ' %' : '—'} · ${sa.fcr || '—'}</b></li>
        <li class="entre"><span>PAR-Q</span><b>${esc(sa.parq)}</b></li>
        <li><span>Limitaciones: </span><b>${sa.limites.length ? sa.limites.map(l=>esc(l.zona + (l.hasta ? ' (hasta ' + verFecha(l.hasta) + ')' : l.tipo==='permanente' ? ' (permanente)' : '') + (l.nota ? ': ' + l.nota : ''))).join('; ') : 'ninguna'}</b></li></ul>`
      : '<p class="suave chico">El alumno no comparte sus datos de salud.</p>'}
    <div class="etiqueta">Últimos entrenamientos</div>
    <ul class="lista chico">${P.ses.slice(0, 12).map(s=>`<li><div class="entre"><b>${esc(s.n)}</b><span class="suave num">${verFecha(s.f)}</span></div><div class="suave num">${esc([s.r, s.min && s.min + ' min', s.km && fmtNum(s.km) + ' km', s.rpe && 'esfuerzo ' + s.rpe].filter(Boolean).join(' · '))}</div></li>`).join('') || '<li class="suave">Sin entrenamientos en 90 días</li>'}</ul>
    <div class="btns"><button class="btn" id="faQuitar">Quitar de la unidad</button></div>`, d=>{
    $('#faQuitar', d).onclick = ()=>confirmar('¿Quitar a ' + nomAl(P) + ' de la unidad? Se borra su parte de este equipo.', ()=>{ delete mando().partes[P.codigo + '|' + P.id]; guardarMando(); vUnidad(); });
  });
}
/* Excel (CSV con punto y coma y coma decimal, como lo abre Excel en Chile) */
function exportarExcel(u, ps){
  if(!ps.length){ aviso('No hay partes para exportar'); return; }
  const n = v=>v==null || v==='' ? '' : typeof v==='number' ? String(Math.round(v * 100) / 100).replace('.', ',') : String(v);
  const q = v=>{ const s = n(v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const ult = (P, id, t)=>{ const s = P.pruebas[id] || []; return s.length ? (t ? PSF.verTiempo(s[s.length - 1].v) : s[s.length - 1].v) : ''; };
  const cab = ['Compañía', 'Sección', 'Escuadra', 'Grado', 'Nombre', 'Fecha parte', 'Sesiones semana', 'Sesiones 30 días', 'Km 30 días', 'Horas 30 días', 'Plan', 'Cumplimiento %',
    'Alistamiento', 'Estado de carga', 'Rango'].concat(CAPACIDADES.map(c=>c.corto), ['2.400 m', 'Abdominales', 'Barras', 'Flexiones'], PRUEBAS.filter(P=>!P.ej && P.id!=='brazos').map(P=>P.n), ['Peso kg', 'Limitaciones', 'PAR-Q', 'Alertas']);
  const filas = ps.slice().sort((a, b)=>[a.alumno.compania, a.alumno.seccion, a.alumno.escuadra, nomAl(a)].join('|') < [b.alumno.compania, b.alumno.seccion, b.alumno.escuadra, nomAl(b)].join('|') ? -1 : 1).map(P=>{ const m = metAlumno(P), a = P.alumno;
    return [a.compania, a.seccion, a.escuadra, a.grado, a.nombre, P.hoy, m.sem, m.s30, m.km30, m.min30 / 60, P.plan ? P.plan.n : '', m.cumple, m.alist, P.carga.estado, P.resumen.rango]
      .concat(CAPACIDADES.map(c=>(P.caps.find(x=>x.id===c.id) || {}).nivel), [ult(P, 'psf2400', true), ult(P, 'abd1'), ult(P, 'barras'), ult(P, 'flex1')],
        PRUEBAS.filter(Pr=>!Pr.ej && Pr.id!=='brazos').map(Pr=>(P.evals || {})[Pr.id] ? P.evals[Pr.id].txt : ''),
        [P.salud ? P.salud.peso : 'no compartido', P.salud ? P.salud.limites.map(l=>l.zona).join(', ') : 'no compartido', P.salud ? P.salud.parq : 'no compartido', m.alertas.map(x=>x[1]).join(' / ')]).map(q).join(';'); });
  const csv = '﻿' + cab.map(q).join(';') + '\n' + filas.join('\n'), blob = new Blob([csv], {type:'text/csv;charset=utf-8'}), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = slug(u.nombre) + '_' + hoyISO() + '.csv'; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  aviso('Planilla descargada: ábrela con Excel');
}

/* ---------- Tarea del día (instructor, unidad en línea) ---------- */
let nubeUnidadesVistas = false, fechaTU = null;
function htmlTareaInstructor(u){
  fechaTU = fechaTU || hoyISO();
  const N = NU[u.codigo] || {}, t = (N.tareas || {})[fechaTU], res = (N.resultados || []).filter(r=>r.fecha===fechaTU), miem = N.miembros || [];
  const hechos = miem.filter(m=>res.some(r=>r.usuario===m.usuario)), pend = miem.filter(m=>!res.some(r=>r.usuario===m.usuario));
  const nomM = m=>(m.grado ? m.grado + ' ' : '') + (m.nombre || 'Alumno'), lugar = m=>[m.compania && m.compania + ' Cía.', m.seccion && m.seccion + ' Sec.', m.escuadra && m.escuadra + ' Esc.'].filter(Boolean).join(' · ');
  const txtT = !t ? 'Sin tarea publicada' : t.tipo==='descanso' ? 'Descanso' : t.activo ? 'Descanso activo' : t.n;
  return `<div class="tarjeta tarea-inst">
    <div class="entre"><button class="btn chico-btn" id="tiAnt" aria-label="Día anterior">‹</button><div style="text-align:center"><div class="etiqueta">Tarea del día</div><b>${fechaTU===hoyISO() ? 'Hoy, ' : ''}${verFecha(fechaTU)}</b></div><button class="btn chico-btn" id="tiSig" aria-label="Día siguiente">›</button></div>
    <div class="ti-tarea ${t ? '' : 'vacia'}"><b>${esc(txtT)}</b>${t && t.min && !t.tipo ? `<span class="suave chico num">${t.min} min · esfuerzo ${t.rpe}</span>` : ''}${t && t.d ? `<span class="suave chico">${esc(t.d)}</span>` : ''}</div>
    <div class="u-acc"><button class="btn prim" id="tiPub">✎ ${t ? 'Cambiar' : 'Publicar'} tarea</button><button class="btn" id="tiSemana" ${S.plan ? '' : 'disabled'}>📅 7 días de Mi plan</button><button class="btn" id="tiQuitar" ${t ? '' : 'disabled'}>Quitar</button></div>
    ${miem.length ? `<div class="ti-cumple"><b class="num">${hechos.length}</b> de <b class="num">${miem.length}</b> cumplieron</div><div class="barra-logro"><span style="width:${Math.round(hechos.length / miem.length * 100)}%"></span></div>
      <ul class="lista ti-lista">${hechos.map(m=>{ const r = res.find(x=>x.usuario===m.usuario).datos;
          return `<li><span class="ti-ok">✓</span><div><b>${esc(nomM(m))}</b><small class="suave">${esc(lugar(m))}</small><small class="num">${esc(r.ses.map(s=>s.n + (s.r ? ': ' + s.r : '') + (s.min ? ' · ' + s.min + ' min' : '') + (s.rpe ? ' · esf. ' + s.rpe : '')).join(' | '))}</small></div></li>`; }).join('')}
        ${pend.map(m=>`<li class="pend"><span class="ti-no">○</span><div><b>${esc(nomM(m))}</b><small class="suave">${esc(lugar(m))} · ${fechaTU <= hoyISO() ? 'sin resultado' : 'pendiente'}</small></div></li>`).join('')}</ul>`
      : '<p class="suave chico">Aún no hay alumnos unidos. Envía el código con ＋👤.</p>'}
    <p class="nota">Los alumnos ven la tarea en su Inicio y, al registrar, su resultado llega aquí solo. Toca 🔄 Actualizar para ver los últimos.</p>
  </div>`;
}
function enlazarTareaInstructor(u){
  const mover = k=>{ fechaTU = masDias(fechaTU, k); vUnidad(); };
  $('#tiAnt').onclick = ()=>mover(-1); $('#tiSig').onclick = ()=>mover(1);
  const N = NU[u.codigo] || {}, t = (N.tareas || {})[fechaTU];
  const publicar = async filas=>{ try{ await nubePublicarTareas(u, filas); filas.forEach(([f, s])=>{ (NU[u.codigo].tareas = NU[u.codigo].tareas || {})[f] = s; });
      aviso(filas.length > 1 ? '📅 ' + filas.length + ' días publicados' : '📢 Tarea publicada'); vUnidad(); }catch(e){ aviso(e.message); } };
  $('#tiPub').onclick = ()=>{ if(!conectado()) return dialogoIngresar();
    elegirSesion(t && !t.tipo ? t : t && t.activo ? {activo:true} : null, 'Tarea del ' + verFecha(fechaTU), it=>publicar([[fechaTU, it || {tipo:'descanso'}]])); };
  $('#tiSemana').onclick = ()=>{ if(!S.plan) return; const filas = [];
    for(let k = 0; k < 7; k++){ const f = masDias(fechaTU, k), x = planDia(f); if(x.tipo==='fuera') continue;
      filas.push([f, x.tipo==='descanso' ? {tipo:'descanso'} : x.tipo==='activo' ? {activo:true, min:x.ses.min} : Object.assign({}, x.ses)]); }
    if(!filas.length) return aviso('Tu plan no tiene días en esas fechas');
    confirmar('¿Publicar ' + filas.length + ' días desde tu plan (desde el ' + verFecha(fechaTU) + ')? Reemplaza las tareas de esos días.', ()=>publicar(filas), 'Publicar'); };
  $('#tiQuitar').onclick = ()=>confirmar('¿Quitar la tarea del ' + verFecha(fechaTU) + '?', async ()=>{ try{ await api(`tareas?unidad=eq.${u.nube}&fecha=eq.${fechaTU}`, {method:'DELETE'}); delete NU[u.codigo].tareas[fechaTU]; vUnidad(); }catch(e){ aviso(e.message); } }, 'Quitar');
}
