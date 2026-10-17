/* #TACFITNSCE — seguimiento de entrenamiento físico. Todo se guarda solo en este equipo (localStorage). */
'use strict';
const $ = (s, r=document)=>r.querySelector(s), $$ = (s, r=document)=>[...r.querySelectorAll(s)];
const esc = s=>String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const num = x=>{ const v = parseFloat(String(x ?? '').replace(',', '.')); return isFinite(v) ? v : null; };
const ent = x=>{ const v = parseInt(x, 10); return isFinite(v) ? v : null; };
const uid = ()=>Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const iso = d=>d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const hoyISO = ()=>iso(new Date());
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'], MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const verFecha = f=>{ const d = new Date(f + 'T12:00:00'); return DIAS[d.getDay()] + ' ' + d.getDate() + ' ' + MESES[d.getMonth()] + (d.getFullYear()!==new Date().getFullYear() ? ' ' + d.getFullYear() : ''); };
const VERSION = '0.3';
const APP = '#TACFITNSCE';   // nombre visible de la app (los datos internos siguen con prefijo newen_)

/* ---------- Datos ---------- */
const CLAVE = 'newen_datos';
function nuevo(){ return {v:1, temaV2:true, perfil:{nombre:'', sexo:'', nac:'', servicios:false, bonif:false, brazos:'barra', tema:'oscuro'}, sesiones:[], marcas:[], controles:[], favoritos:[], diario:{}, medidas:[], evals:[], insVistas:[], planificadas:[]}; }
function cargar(){
  try{ const d = JSON.parse(localStorage.getItem(CLAVE));
    if(d && d.v){ if(!d.temaV2){ d.temaV2 = true; if(d.perfil) d.perfil.tema = 'oscuro'; }   // el oscuro pasa a ser el principal
      const x = Object.assign(nuevo(), d, {perfil:Object.assign(nuevo().perfil, d.perfil)});
      if(!Array.isArray(d.insVistas)) delete x.insVistas;
      (x.sesiones || []).forEach(s=>{ if(s.w && s.w.modo==='multi' && s.w.uno) delete s.w.uno; });
      (x.sesiones || []).forEach(s=>{ if(!s.w || !s.w.secc) return; ['in', 'main', 'out'].forEach(k=>(s.w.secc[k] || []).forEach(m=>{   // escritos a mano → catálogo
        if(!m.descanso && !m.mov && m.n){ const p = movParecido(m.n); if(p){ m.mov = p.id; m.n = p.n; } } })); });   // series convertidas desde «un movimiento»
      (x.sesiones || []).forEach(s=>{ if(s.dur > 600 && s.dur % 100 < 60) s.dur = Math.max(1, Math.round((Math.floor(s.dur / 100) * 60 + s.dur % 100) / 60)); });   // 3708 = 37:08 → 37 min   // se pondrá al día sin avisos
      x.planificadas = x.planificadas || [];
      { const hoy = iso(new Date()); (x.sesiones || []).filter(s=>s.fecha > hoy && s.w).forEach(s=>x.planificadas.push({id:s.id, fecha:s.fecha, titulo:s.titulo || '', notas:s.notas || '', w:s.w, t:plantillaDe(s.w), creado:s.creado || Date.now()}));
        x.sesiones = (x.sesiones || []).filter(s=>!(s.fecha > hoy && s.w)); }   // lo de fecha futura es planificado, no entrenado
      return x; } }catch(e){}
  return nuevo();
}
let S = cargar();
function guardar(){ try{ localStorage.setItem(CLAVE, JSON.stringify(S)); }catch(e){ aviso('No se pudo guardar en este equipo'); } if(typeof programarRevision==='function') programarRevision(); if(typeof programarNube==='function') programarNube(); }
const pref = (k, v)=>{ try{ if(v===undefined) return localStorage.getItem('newen_' + k); localStorage.setItem('newen_' + k, v); }catch(e){ return null; } };

/* ---------- Ejercicios y biblioteca ---------- */
const EJ = [
  {id:'psf2400', nombre:'Carrera 2.400 m', u:'tiempo'},
  {id:'abd1', nombre:'Abdominales 1 min', u:'reps'},
  {id:'barras', nombre:'Barras máximas', u:'reps'},
  {id:'flex1', nombre:'Flexiones de brazos 1 min', u:'reps'},
  {id:'5k', nombre:'Carrera 5 km', u:'tiempo'},
  {id:'10k', nombre:'Carrera 10 km', u:'tiempo'},
  {id:'marcha10', nombre:'Marcha 10 km con carga', u:'tiempo'},
  {id:'sentadilla', nombre:'Sentadilla (1RM)', u:'kg'},
  {id:'pesomuerto', nombre:'Peso muerto (1RM)', u:'kg'},
  {id:'banca', nombre:'Press banca (1RM)', u:'kg'},
  {id:'militar', nombre:'Press militar (1RM)', u:'kg'},
  {id:'envion', nombre:'Envión (1RM)', u:'kg'},
  {id:'peso', nombre:'Peso corporal', u:'kgc'},
];
const BIBLIO = [
  {nombre:'Cindy', tipo:'amrap', rpr:30, desc:'AMRAP 20 min:\n5 barras\n10 flexiones de brazos\n15 sentadillas'},
  {nombre:'Chelsea', tipo:'emom', desc:'EMOM 30 min (cada minuto):\n5 barras\n10 flexiones de brazos\n15 sentadillas'},
  {nombre:'Murph', tipo:'tiempo', desc:'Por tiempo, con chaleco 9 kg (H) / 6 kg (M):\n1,6 km trote\n100 barras\n200 flexiones de brazos\n300 sentadillas\n1,6 km trote\n(Se pueden repartir en 20 rondas de 5-10-15)'},
  {nombre:'Fran', tipo:'tiempo', desc:'21-15-9 repeticiones, por tiempo:\nThruster 43 / 30 kg\nBarras'},
  {nombre:'Helen', tipo:'tiempo', desc:'3 rondas por tiempo:\n400 m trote\n21 swing con kettlebell 24 / 16 kg\n12 barras'},
  {nombre:'Grace', tipo:'tiempo', desc:'Por tiempo:\n30 envión (clean & jerk) 61 / 43 kg'},
  {nombre:'Simulacro PSF', tipo:'otro', desc:'Abdominales 1 min\nBarras o flexiones de brazos\nDescanso 5 min\nCarrera 2.400 m\n(Anota el resultado en la pestaña PSF)'},
  {nombre:'Intervalos 2.400', tipo:'emom', desc:'Calentamiento 10 min\n6 × 400 m al ritmo meta del 2.400\nDescanso 1:30 entre cada uno\nVuelta a la calma 5 min'},
  {nombre:'Escalera de barras', tipo:'emom', desc:'EMOM: minuto 1 = 1 barra, minuto 2 = 2 barras…\nSeguir hasta no completar el minuto'},
  {nombre:'Abdominales y flexiones EMOM', tipo:'emom', desc:'EMOM 12 min:\nMinutos impares: 20 abdominales\nMinutos pares: 15 flexiones de brazos'},
  {nombre:'Marcha 10 km', tipo:'marcha', dist:10, desc:'Marcha de 10 km con mochila (20 kg de referencia)\nRitmo constante, sin trotar'},
];
const wodId = w=>'wod:' + w.nombre;
function todosEj(){
  const lista = EJ.slice(), ids = new Set(lista.map(e=>e.id));
  S.sesiones.forEach(s=>{
    (s.recs || []).forEach(r=>{ if(!ids.has(r.ej)){ ids.add(r.ej); lista.push({id:r.ej, nombre:r.nombre, u:r.u}); } });
    if(s.ej && !ids.has(s.ej)){ const w = BIBLIO.find(w=>wodId(w)===s.ej); if(w){ ids.add(s.ej); lista.push({id:s.ej, nombre:w.nombre, u:w.tipo==='amrap' ? 'rondas' : 'tiempo', rpr:w.rpr}); } }
  });
  return lista;
}
const ejDe = id=>todosEj().find(e=>e.id===id);
const menorEsMejor = u=>u==='tiempo';
function fmt(e, v, txt){
  if(v==null) return '—';
  if(e.u==='tiempo' || e.u==='tmax') return PSF.verTiempo(v);
  if(e.u==='reps') return v + ' rep';
  if(e.u==='cal') return v + ' cal';
  if(e.u==='m') return verDist(v);
  if(e.u==='kg' || e.u==='kgc') return verPeso(v, 'kg');
  if(e.u==='rondas') return txt || (Math.floor(v) + ' rondas');
  if(e.u==='reps') return v + ' rep';
  return String(v);
}
const TIPOS = {tiempo:'Por tiempo', amrap:'AMRAP', emom:'EMOM / intervalos', fuerza:'Fuerza', reps:'Repeticiones máximas', carrera:'Carrera', marcha:'Marcha con carga', otro:'Otro', descanso:'Descanso activo'};

/* Todos los valores de un ejercicio: marcas a mano + entrenamientos + controles PSF */
function valoresDe(id, sinRef){
  const out = [];
  S.marcas.filter(m=>m.ej===id).forEach(m=>out.push({fecha:m.fecha, valor:m.valor, txt:m.txt, origen:'marca', ref:m.id}));
  S.sesiones.filter(s=>s.ej===id && s.valor!=null).forEach(s=>out.push({fecha:s.fecha, valor:s.valor, txt:s.txt, origen:'sesion', ref:s.id}));
  S.sesiones.forEach(s=>(s.recs || []).forEach(r=>{ if(r.ej===id) out.push({fecha:s.fecha, valor:r.valor, txt:r.txt, origen:'sesion', ref:s.id}); }));
  S.controles.forEach(c=>{
    const v = id==='psf2400' ? c.carrera : id==='abd1' ? c.abd : id==='barras' && c.prueba==='barra' ? c.brazos
            : id==='flex1' && c.prueba && c.prueba!=='barra' ? c.brazos : id==='peso' ? c.peso : null;
    if(v!=null) out.push({fecha:c.fecha, valor:v, origen:'psf', ref:c.id});
  });
  return out.filter(o=>o.ref!==sinRef).sort((a, b)=>a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0);
}
function mejorDe(id, sinRef){
  const e = ejDe(id); if(!e || e.u==='kgc') return null;
  const vs = valoresDe(id, sinRef); if(!vs.length) return null;
  return vs.reduce((b, o)=>(menorEsMejor(e.u) ? o.valor < b.valor : o.valor > b.valor) ? o : b);
}
function avisarRecord(id, valor, ref, info){
  const e = ejDe(id) || (info && {nombre:info.nombre, u:info.u}); if(!e || e.u==='kgc' || valor==null) return;
  const b = mejorDe(id, ref);
  if(b && (menorEsMejor(e.u) ? valor < b.valor : valor > b.valor)) aviso('🏆 ¡Nuevo récord personal en ' + e.nombre + '!', 3500);
}

/* ---------- Casillas de tiempo: teclado numérico y los dos puntos se ponen solos (1030 → 10:30, 13000 → 1:30:00) ---------- */
function formatoTiempo(v){
  const d = String(v).replace(/\D/g, '').slice(0, 6);
  if(d.length <= 2) return d;
  if(d.length <= 4) return d.slice(0, -2) + ':' + d.slice(-2);
  return d.slice(0, -4) + ':' + d.slice(-4, -2) + ':' + d.slice(-2);
}
const tiempoValido = v=>!v || v.split(':').slice(1).every(x=>+x < 60);
document.addEventListener('input', e=>{
  const i = e.target; if(!i.matches || !i.matches('[data-tiempo]') || /[×x]/.test(i.value)) return;
  const f = formatoTiempo(i.value); if(f!==i.value) i.value = f;
  i.classList.toggle('t-mal', !tiempoValido(i.value));
}, true);
document.addEventListener('blur', e=>{
  const i = e.target; if(!i.matches || !i.matches('[data-tiempo]')) return;
  if(/^\d{1,2}$/.test(i.value)){ i.value = i.value + ':00'; i.dispatchEvent(new Event('input', {bubbles:true})); }   // «45» = 45 minutos
  if(!tiempoValido(i.value)) aviso('Revisa el tiempo: los segundos y minutos van de 00 a 59');
}, true);

/* ---------- Interfaz general ---------- */
let vistaActual = pref('vista') || 'hoy';
function ir(v){
  if(v==='nuevo'){ abrirRegistro(); return; }
  vistaActual = v; pref('vista', v);
  $$('#pestanas button, #bPerfil, #bReloj').forEach(b=>b.classList.toggle('activa', b.dataset.v===v));
  VISTAS[v](); window.scrollTo(0, 0); subtitulo();
}
function subtitulo(){ const d = new Date(); $('#marca').textContent = APP; $('#subtitulo').textContent = DIAS[d.getDay()] + ' ' + String(d.getDate()).padStart(2, '0') + ' ' + MESES[d.getMonth()]; }
let tAviso;
function aviso(t, ms){ const a = $('#aviso'); a.textContent = t; a.dataset.t = t;   // el texto original (los emojis se cambian por íconos en pantalla)
  a.hidden = false; clearTimeout(tAviso); tAviso = setTimeout(()=>a.hidden = true, ms || 2200); }
function dialogo(html, alAbrir){
  const d = $('#dialogo'); d.className = ''; d.innerHTML = html; if(!d.open) d.showModal();
  $$('[data-cerrar]', d).forEach(b=>b.onclick = ()=>d.close());
  if(alAbrir) alAbrir(d);
  return d;
}
/* Carrusel: toma el alto de la tarjeta que se ve (sin espacio vacío bajo las tarjetas cortas) */
function altoCarrusel(car){ if(!car || !car.children.length) return; const i = Math.min(car.children.length - 1, Math.max(0, Math.round(car.scrollLeft / (car.clientWidth || 1)))), c = car.children[i];
  const cs = getComputedStyle(car); car.style.height = (c.offsetHeight + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)) + 'px'; }
function confirmar(texto, si, etiqueta){ dialogo(`<p>${esc(texto)}</p><div class="btns"><button class="btn" data-cerrar>Cancelar</button><button class="btn ${etiqueta ? 'prim' : 'peligro'}" id="cSi">${esc(etiqueta || 'Sí, borrar')}</button></div>`, d=>$('#cSi', d).onclick = ()=>{ d.close(); si(); }); }
function aplicarTema(){
  let t = S.perfil.tema || 'oscuro';
  if(t==='auto') t = window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'oscuro';
  document.documentElement.dataset.tema = t;
  document.documentElement.dataset.estilo = S.perfil.estilo==='tactico' ? 'tactico' : 'deportivo';
  if(S.perfil.estilo==='tactico' && !document.getElementById('fuenteTactica')){ const l = document.createElement('link'); l.id = 'fuenteTactica'; l.rel = 'stylesheet';   // la letra de máquina solo para el estilo Táctico
    l.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap'; document.head.appendChild(l); }
  const mt = document.querySelector('meta[name="theme-color"]'); if(mt) mt.content = getComputedStyle(document.documentElement).getPropertyValue('--fondo').trim() || '#0e1014';
}
const tactico = ()=>S.perfil.estilo==='tactico';   // palabras militares solo en el estilo Táctico

/* ---------- Pestaña Entrenar ---------- */
function racha(){
  const dias = new Set(fechasRacha()); let n = 0; const d = new Date();
  if(!dias.has(iso(d))) d.setDate(d.getDate()-1);
  while(dias.has(iso(d))){ n++; d.setDate(d.getDate()-1); }
  return n;
}
let verTodas = false;
function inicioSemana(){ const d = new Date(); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d; }
const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function tilesPSF(){
  const c2400 = mejorDe('psf2400'), ctrl = S.controles.slice().sort((a, b)=>a.fecha < b.fecha ? 1 : -1)[0], per = PSF.proximoPeriodo();
  return `<div class="tiles">
    <button class="tile" data-ej="psf2400"><div class="k">Mejor 2.400 m</div><div class="v">${c2400 ? PSF.verTiempo(c2400.valor) : '—'}</div></button>
    <button class="tile" data-ctrl="${ctrl ? ctrl.id : ''}"><div class="k">Último control PSF</div><div class="v txt">${ctrl && ctrl.eval ? PSF.NOMBRES[ctrl.eval] : 'Sin control'}</div></button>
    <div class="tile"><div class="k">${per.nombre}${per.enCurso ? ' en curso, quedan' : ' comienza en'}</div><div class="v">${per.dias}<span class="suave" style="font-size:13px"> días</span></div></div>
  </div>`;
}
function enlazarTilesPSF(){
  $$('#vista .tile[data-ej]').forEach(b=>b.onclick = ()=>{ if(valoresDe(b.dataset.ej).length){ ejSel = b.dataset.ej; vistaProg = 'rec'; ir('progreso'); } else aviso('Aún no tienes registros de 2.400 m'); });
  $$('#vista .tile[data-ctrl]').forEach(b=>b.onclick = ()=>{ const c = S.controles.find(c=>c.id===b.dataset.ctrl); if(c) verControl(c); else aviso('Guarda tu primer control más abajo'); });
}
let calAbierto = false, diaSel = new Date(), mesPortada = null;
/* Clases para dibujar los días entrenados seguidos como una franja continua */
function clasesDia(dias, d, col){
  if(!dias.has(iso(d))) return (S.planificadas || []).some(p=>p.fecha===iso(d)) ? 'plan' : '';
  const a = new Date(d), b = new Date(d); a.setDate(a.getDate()-1); b.setDate(b.getDate()+1);
  return 'si' + (col > 0 && dias.has(iso(a)) ? '' : ' ini') + (col < 6 && dias.has(iso(b)) ? '' : ' fin');
}
function calendarioPortada(dias){
  const m = mesPortada || new Date(diaSel.getFullYear(), diaSel.getMonth(), 1), y = m.getFullYear(), mm = m.getMonth();
  const ini = new Date(y, mm, 1); ini.setDate(ini.getDate() - (ini.getDay() + 6) % 7);
  const celdas = []; for(let i=0;i<42;i++){ const d = new Date(ini); d.setDate(d.getDate() + i); celdas.push(d); }
  const filas = []; for(let f=0; f<6; f++){ const fila = celdas.slice(f*7, f*7+7); if(f===5 && fila[0].getMonth()!==mm) break; filas.push(fila); }
  const n = S.sesiones.filter(s=>s.fecha.startsWith(iso(m).slice(0, 7))).length;
  return `<div class="cal-portada">
    <div class="entre"><button class="btn chico-btn" id="cpAnt" aria-label="Mes anterior">‹</button><span class="etiqueta">${MESES_L[mm].toUpperCase()} ${y} · ${n} entrenamientos</span><button class="btn chico-btn" id="cpSig" aria-label="Mes siguiente">›</button></div>
    <div class="dias7 cab-sem">${['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map(x=>`<div><span class="dn">${x}</span></div>`).join('')}</div>
    ${filas.map(f=>`<div class="dias7 mes">${f.map((d, i)=>`<button data-dia="${iso(d)}" class="${clasesDia(dias, d, i)} ${d.getMonth()!==mm ? 'fuera' : ''} ${iso(d)===hoyISO() ? 'hoy' : ''} ${iso(d)===iso(diaSel) ? 'sel' : ''}"><span class="dd num">${d.getDate()}</span></button>`).join('')}</div>`).join('')}
  </div>`;
}
/* El logro del día: tarjeta destacada con lo entrenado (o la misión pendiente) */
/* Entrenamientos planificados para un día: pendientes hasta que se registran */
function htmlPlanificadas(f){
  const ps = (S.planificadas || []).filter(p=>p.fecha===f && !(p.tipo==='activo' && S.sesiones.some(x=>x.fecha===f && x.tipo==='descanso'))); if(!ps.length) return '';
  const hoy = hoyISO(), txt = f > hoy ? 'Planificado · ' + verFecha(f) : f===hoy ? 'Planificado para hoy' : 'Planificado sin registrar · ' + verFecha(f);
  return `<div class="logro-dia otro planificado"><div class="ld-cab"><span class="ld-sello vacio">🗓</span><div><div class="ld-tit">${txt}</div>
      <div class="ld-sub">${f > hoy ? 'Cuando lo hagas, regístralo con tu resultado.' : 'Pendiente: no cuenta como entrenado hasta que lo registres.'}</div></div></div>
    ${ps.map(p=>p.tipo ? `<div class="pl-item"><div class="entre"><span class="ld-nombre">${p.tipo==='activo' ? '🔋 Descanso activo' : '😴 Descanso'}</span></div>
      <div class="ph-btns">${p.tipo==='activo' ? `<button class="btn prim" data-plact="${p.id}">🔋 Registrar</button>` : ''}<button class="btn" data-plquitar="${p.id}">Quitar</button></div></div>`
      : `<div class="pl-item"><div class="entre"><span class="ld-nombre">${esc(nombrePlan(p))}</span></div>${htmlWodVisual(p.w, true)}
      <div class="ph-btns"><button class="btn prim" data-plreg="${p.id}">＋ Registrar</button><button class="btn" data-plquitar="${p.id}">Quitar</button></div></div>`).join('')}</div>`;
}
function hechoDia(f){
  const ss = S.sesiones.filter(s=>s.fecha===f).sort((a, b)=>(a.creado || 0) - (b.creado || 0)), esHoy = f===hoyISO();
  if(false) return `<div class="logro-dia otro planificado"><div class="ld-cab"><span class="ld-sello vacio">🗓</span><div><div class="ld-tit">Planificado · ${verFecha(f)}</div>
      <div class="ld-sub">Cuenta como entrenado cuando llegue el día.</div></div></div>
    ${ss.map(s=>`<button class="ld-item" data-sid="${s.id}"><div class="entre"><span class="ld-nombre">${esc(s.titulo || etiquetaTipo(s))}</span><span class="chev">›</span></div>${htmlWodVisual(s.w, true)}</button>`).join('')}</div>`;
  if(!ss.length && (S.planificadas || []).some(p=>p.fecha===f)) return '';
  if(!ss.length) return esHoy
    ? `<div class="logro-dia pendiente"><div class="ld-cab"><span class="ld-sello vacio">○</span><div><div class="ld-tit">${tactico() ? 'Misión de hoy pendiente' : 'Entrenamiento de hoy pendiente'}</div>
        <div class="ld-sub">${racha() ? 'No cortes tu racha de ' + racha() + (racha()===1 ? ' día' : ' días') + ' 🔥' : 'Cada entrenamiento cuenta.'}</div></div></div>
        <div class="ld-btns"><button class="btn prim" id="ldReg">＋ Registrar entrenamiento</button><button class="btn" id="ldDesc">🔋 Descanso activo</button></div></div>`
    : `<div class="logro-dia otro"><div class="ld-cab"><span class="ld-sello vacio">·</span><div><div class="ld-tit">${verFecha(f)}</div><div class="ld-sub">Día de descanso</div></div></div></div>`;
  const crono = ordenCrono(), nro = crono.findIndex(x=>x.id===ss[ss.length-1].id) + 1, r = racha();
  const mes = f.slice(0, 7), hechasMes = new Set(S.sesiones.filter(s=>s.fecha.startsWith(mes) && s.fecha <= hoyISO()).map(s=>s.fecha)).size, metaMes = Math.round((ent(S.perfil.meta) || 4) * new Date(+mes.slice(0, 4), +mes.slice(5, 7), 0).getDate() / 7);
  const chips = s=>{ const m = metricas(s), c = [];
    if(m.km) c.push(verKm(m.km)); if(m.min) c.push(m.min + ' min'); if(m.carga) c.push(fmtNum(m.carga) + ' km·kg'); { const k = kcalDe(s); if(k) c.push('🔥 ' + k.toLocaleString('es-CL') + ' kcal'); } if(m.kg) c.push(fmtNum(m.kg) + ' kg'); if(s.rpe) c.push('esfuerzo ' + s.rpe); if(s.rx) c.push('Rx');
    return c.map(x=>`<span>${esc(x)}</span>`).join(''); };
  const esPR = s=>(s.recs || []).some(rc=>{ const b = mejorDe(rc.ej); return b && b.ref===s.id; });
  const res = s=>{ const t = s.txt || '', k = t.indexOf(' ('); return k > 0 ? [t.slice(0, k), t.slice(k + 1)] : [t, '']; };
  return `<div class="logro-dia ${esHoy ? 'hoy' : 'otro'}">
    <div class="ld-cab"><span class="ld-sello">✓</span><div><div class="ld-tit">${esHoy ? (tactico() ? 'Misión cumplida' : 'Completado hoy') : 'Entrenado · ' + verFecha(f)}</div>
      <div class="ld-sub num">Entrenamiento N.º ${nro.toLocaleString('es-CL')}${esHoy && r ? ' · racha ' + r + (r===1 ? ' día' : ' días') + ' 🔥' : ''}</div></div></div>
    ${ss.map(s=>{ const [g, ch0] = res(s), ch = parcialesDe(s) ? '' : ch0; return `<button class="ld-item" data-sid="${s.id}">
      <div class="entre"><span class="ld-nombre">${esc(s.titulo || etiquetaTipo(s))}</span>${esPR(s) ? '<span class="ld-pr">🏆 Récord</span>' : '<span class="chev">›</span>'}</div>
      ${htmlWodVisual(s.w, true)}
      ${g ? `<div class="ld-res num">${esc(g)}${ch ? ` <small>${esc(ch)}</small>` : ''}</div>` : ''}
      ${htmlParciales(s)}<div class="ld-chips num">${chips(s)}</div></button>`; }).join('')}
    <button class="btn ancho ld-compartir" data-compartir-sid="${ss[ss.length-1].id}">↗ Compartir en redes</button>
    ${esHoy ? `<div class="ld-pie num">+1 a tu meta del mes · <b>${hechasMes}/${metaMes}</b>${hechasMes >= metaMes ? ' · ¡meta cumplida!' : ''}</div>` : ''}
  </div>`;
}
function vHoy(){
  const dias = new Set(S.sesiones.filter(s=>s.fecha <= hoyISO()).map(s=>s.fecha)), lunes = inicioSemana(), hoy = hoyISO(), r = racha(), meta = ent(S.perfil.meta) || 4, d0 = new Date();
  const semana = Array.from({length:7}, (_, i)=>{ const d = new Date(lunes); d.setDate(d.getDate() + i); return d; });
  const hechasSem = semana.filter(d=>dias.has(iso(d))).length;
  const finMes = new Date(d0.getFullYear(), d0.getMonth()+1, 0), mesTxt = iso(d0).slice(0, 7);
  const hechasMes = [...dias].filter(f=>f.startsWith(mesTxt)).length, metaMes = Math.round(meta * finMes.getDate() / 7), restantes = finMes.getDate() - d0.getDate();
  const nombre = S.perfil.nombre ? esc(S.perfil.nombre.split(' ')[0]) : '';
  const dia = S.diario[hoy] || {}, disp = disposicion(dia), LS = lineasVisibles(), dpDia = disposicionDia();
  const lista = S.sesiones.slice().sort((a, b)=>a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : (b.creado||0) - (a.creado||0));
  const mostrar = verTodas ? lista : lista.slice(0, 10);
  const wods = LS.map(l=>sesionHoy(l)), nRes = t=>S.sesiones.filter(s=>s.titulo && s.titulo.toLowerCase()===String(t.titulo).toLowerCase()).length;
  $('#vista').innerHTML = `${htmlPortadaIG()}
    <div class="tarjeta portada">
      <div class="entre" style="align-items:flex-start"><div><button class="fecha-grande" id="bFecha" aria-expanded="${calAbierto}">${MESES_L[diaSel.getMonth()].toUpperCase()} ${String(diaSel.getDate()).padStart(2, '0')} <span class="chev">${calAbierto ? '⌄' : '›'}</span></button>
        <div class="suave">${nombre ? 'Hola, ' + nombre + '. ' : ''}${disp && disp.pct < 40 ? 'Hoy toca cuidarse.' : 'Vamos con todo hoy.'}</div></div>
        <div class="total"><b class="num">${S.sesiones.length}</b><span>SESIONES</span>${(()=>{ const pt = puntos(); return `<button class="rango-chip" id="bRango">🎖️ ${pt.rango}</button>`; })()}</div></div>
      ${calAbierto ? calendarioPortada(dias) : `<div class="dias7">${semana.map((d, i)=>`<button data-dia="${iso(d)}" class="${clasesDia(dias, d, i)} ${iso(d)===hoy ? 'hoy' : ''} ${iso(d)===iso(diaSel) ? 'sel' : ''}"><span class="dn">${['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'][i]}</span><span class="dd num">${d.getDate()}</span></button>`).join('')}</div>`}
      <div class="meta-mes">
        <div class="entre"><span class="etiqueta">Meta de ${MESES_L[d0.getMonth()]}</span><span class="num"><b>${hechasMes}</b> / ${metaMes}</span></div>
        <div class="barra-seg">${Array.from({length:metaMes}, (_, i)=>`<span class="${i < hechasMes ? 'si' : ''}"></span>`).join('')}</div>
        <div class="entre suave chico"><span>${hechasSem}/${meta} esta semana · racha ${r}</span><span>${restantes} días restantes</span></div>
      </div>
    </div>
    ${hechoDia(iso(diaSel))}
    ${htmlPlanificadas(iso(diaSel))}
    ${iso(diaSel)===hoy ? htmlDescansoActivo() + htmlTareaUnidad() + htmlPlanHoy() + htmlRecordatorioParte() : ''}
    <div class="tarjeta chequeo">
      <div class="entre"><span class="etiqueta">¿Cómo llegas hoy?</span>${disp ? `<span class="chip ${disp.nivel} num">${disp.pct}%</span>` : ''}</div>
      ${CHEQUEO.map(([k, n])=>`<div class="fila-ch"><span>${n}</span><div class="seg3">${NIVELES_CH.map(([v, t])=>`<button data-ch="${k}" data-nv="${v}" class="${dia[k]===v ? 'activa n' + v : ''}">${t}</button>`).join('')}</div></div>`).join('')}
      <div class="chico ${disp ? '' : 'suave'}" style="margin-top:8px">${disp ? '<b>Cómo llegas: ' + disp.pct + '%</b> · ' + disp.txt : 'Marca los tres para ver tu disposición para entrenar.'}</div>
      ${htmlAguaInicio()}
      ${htmlHabitos()}
    </div>
    ${htmlEstadoDia()}
    <div class="entre"><h3>WOD del día · ${DIAS_L[diaSemana()].toLowerCase()}</h3><span class="suave chico num" id="pistaN">1/${LS.length}</span></div>
    <div class="chips" id="pistaChips" style="padding-top:0">${LS.map((l, i)=>`<button data-pi="${i}" class="${i===0 ? 'activa' : ''}">${l.n}</button>`).join('')}</div>
    <div class="carrusel" id="carrusel">${LS.map((l, i)=>{ const t = wods[i], tt = t.descanso ? t.prox : t, n = tt ? nRes(tt) : 0, med = medidasLinea(l, tt); return `
      <article class="wod-card ${t.descanso ? 'descanso' : ''}">
        <div class="wod-cab"><span class="wod-tit">${esc(t.descanso ? 'Descanso' : t.titulo)}</span><span class="wod-tag num">${i+1}/${LS.length}</span></div>
        <div class="wod-cuerpo">
          ${(()=>{ const h = !t.descanso && S.sesiones.filter(s=>s.fecha===hoy && s.titulo && s.titulo.toLowerCase()===String(t.titulo).toLowerCase()).pop();
            return h ? `<button class="tu-resultado" data-sid="${h.id}"><span class="etiqueta">Tu resultado</span><span class="num">${esc(h.txt || 'Registrado')}${h.rx ? ' · Rx' : ''}</span><span class="chev">›</span></button>` : ''; })()}
          <div class="etiqueta">${esc(l.n)}${tt && !t.descanso ? ' · ' + esc(estiloPlantilla(tt)) : ''}${l.id==='tac' ? ' · semana ' + cicloTactico().sem + '/12' : ''}</div>
          ${t.descanso ? `<p>Hoy toca descanso en esta línea: recuperación, movilidad, sueño e hidratación también son entrenamiento.</p>${tt ? `<p class="suave chico">Próxima sesión (${t.cuando}): <b>${esc(tt.titulo)}</b></p>` : ''}`
            : `${t.sistema ? `<div class="foco">${esc(t.sistema)}</div>` : ''}
          ${htmlWodVisual(t)}
          ${t.estrategia ? `<p class="suave chico estrategia">${esc(t.estrategia)}</p>` : ''}
          ${dpDia && dpDia.v < 40 ? '<p class="chico" style="color:var(--na)">Disposición ' + dpDia.v + ': escala cargas y volumen.</p>' : ''}
          ${alertasLimitacion(t).map(a=>`<p class="chico alerta-lim">⚠ ${esc(a)}</p>`).join('')}`}
          ${med.length ? `<div class="medidas-linea">${med.map(([v, k])=>`<div><b class="num">${esc(String(v))}</b><span>${esc(k)}</span></div>`).join('')}</div>` : ''}
        </div>
        ${t.descanso ? (tt ? `<div class="wod-acc"><button class="btn ancho" data-wa="det" data-wi="${i}">Ver la próxima sesión</button></div>` : '') : `<div class="wod-acc"><button class="btn prim ancho" data-wa="reg" data-wi="${i}">＋ REGISTRAR</button>
          <div class="acc3"><button data-wa="ini" data-wi="${i}">▶<span>Iniciar</span></button><button data-wa="mus" data-wi="${i}">🎵<span>Mi música</span></button><button data-wa="res" data-wi="${i}"><b class="num">${n}</b><span>Resultados</span></button><button data-wa="det" data-wi="${i}">ⓘ<span>Detalles</span></button></div></div>`}
      </article>`; }).join('')}</div>
    <h3>Historial</h3>
    <div class="tarjeta">${mostrar.length ? `<ul class="lista">${mostrar.map(s=>`
      <li class="item" data-id="${s.id}"><div class="entre"><span class="titulo">${esc(s.titulo || etiquetaTipo(s))}</span><span class="suave chico num">${verFecha(s.fecha)}</span></div>
      <div class="entre"><span class="num">${esc(s.txt || '')}</span><span class="suave chico">${esc(etiquetaTipo(s))}${s.rx ? ' · Rx' : ''}${s.rpe ? ' · esfuerzo ' + s.rpe : ''}</span></div></li>`).join('')}</ul>
      ${lista.length > mostrar.length ? `<button class="btn ancho" id="bMas">Ver los ${lista.length} entrenamientos</button>` : ''}`
      : '<div class="vacio">Aún no hay entrenamientos.<br>Registra el WOD del día o toca el botón <b style="color:var(--acento)">＋</b> de abajo.</div>'}</div>`;
  if($('#bMas')) $('#bMas').onclick = ()=>{ verTodas = true; vHoy(); };
  const yy = ()=>{ const y = window.scrollY; vHoy(); window.scrollTo(0, y); };
  $('#bFecha').onclick = ()=>{ calAbierto = !calAbierto; mesPortada = null; yy(); };
  $$('[data-dia]').forEach(b=>b.onclick = ()=>{ diaSel = new Date(b.dataset.dia + 'T12:00:00'); if(calAbierto) mesPortada = new Date(diaSel.getFullYear(), diaSel.getMonth(), 1); yy(); });
  if($('#cpAnt')){ const m = mesPortada || new Date(diaSel.getFullYear(), diaSel.getMonth(), 1);
    $('#cpAnt').onclick = ()=>{ mesPortada = new Date(m.getFullYear(), m.getMonth()-1, 1); yy(); };
    $('#cpSig').onclick = ()=>{ mesPortada = new Date(m.getFullYear(), m.getMonth()+1, 1); yy(); }; }
  if($('#ldReg')) $('#ldReg').onclick = ()=>abrirRegistro();
  $('#bRango').onclick = ()=>verPuntos(puntos());
  enlazarEstadoDia(); enlazarPortadaIG(); enlazarDescanso(); enlazarPlanHoy(); if($('#rpEnviar')) $('#rpEnviar').onclick = enviarParte; enlazarTareaUnidad(); if($('#aiMas')) $('#aiMas').onclick = ()=>{ const v = VASOS()[0]; sumarAgua(v[0]); aviso('💧 +' + v[1]); const y = window.scrollY; vHoy(); window.scrollTo(0, y); };
  $$('[data-plreg]').forEach(b=>b.onclick = ()=>registrarPlanificado(S.planificadas.find(p=>p.id===b.dataset.plreg)));
  $$('[data-plact]').forEach(b=>b.onclick = ()=>{ S.planificadas = S.planificadas.filter(p=>p.id!==b.dataset.plact); guardar(); dialogoDescanso(); });
  $$('[data-plquitar]').forEach(b=>b.onclick = ()=>confirmar('¿Quitar este entrenamiento planificado?', ()=>{ S.planificadas = S.planificadas.filter(p=>p.id!==b.dataset.plquitar); guardar(); vHoy(); }, 'Quitar'));
  $$('.ld-item, .tu-resultado').forEach(b=>b.onclick = ()=>verSesion(S.sesiones.find(s=>s.id===b.dataset.sid)));
  $$('#vista .item[data-id]').forEach(li=>li.onclick = ()=>verSesion(S.sesiones.find(s=>s.id===li.dataset.id)));
  $$('[data-ch]').forEach(b=>b.onclick = ()=>{ const dd = S.diario[hoy] = S.diario[hoy] || {}; dd[b.dataset.ch] = dd[b.dataset.ch]===b.dataset.nv ? '' : b.dataset.nv; guardar(); const y = window.scrollY; vHoy(); window.scrollTo(0, y); });
  $$('[data-wa]').forEach(b=>b.onclick = ()=>{ let t = wods[+b.dataset.wi]; if(t.descanso) t = t.prox; ({reg:registrarWod, ini:iniciarWod, res:resultadosWod, det:detallesWod, mus:abrirMiMusica})[b.dataset.wa](t); });
  const car = $('#carrusel'), marcar = i=>{ $('#pistaN').textContent = (i+1) + '/' + LS.length; $$('#pistaChips button').forEach((x, j)=>x.classList.toggle('activa', j===i)); };
  car.onscroll = ()=>{ const i = Math.round(car.scrollLeft / car.clientWidth); marcar(i); pref('pista', i); altoCarrusel(car); };
  $$('#pistaChips button').forEach(b=>b.onclick = ()=>car.scrollTo({left:+b.dataset.pi * car.clientWidth, behavior:'smooth'}));
  const ini = Math.min(ent(pref('pista')) || 0, LS.length - 1); if(ini > 0){ car.scrollLeft = ini * car.clientWidth; marcar(ini); } altoCarrusel(car);
}
const horaDe = s=>s.creado ? new Date(s.creado).toTimeString().slice(0, 5) : '';
function insignia(n){ return `<span class="insignia num"><span>${n}</span></span>`; }
function htmlLogros(s){
  const L = logrosSesion(s); if(!L.length) return '';
  return `<h3>Logros</h3><div class="logros">${L.map(l=>`<div class="logro">${insignia(l.nivel)}<div class="logro-txt">
      <div><b>${esc(l.n.split(' (')[0])}:</b> <span class="num">${fmtCantidad(l.u, l.total)}</span> <span class="mas-delta num">(+${fmtNum(l.u==='m' && l.delta >= 1000 ? l.delta/1000 : l.delta)}${l.u==='m' && l.delta >= 1000 ? ' km' : ''})</span></div>
      <div class="barra-logro"><span style="width:${l.cumplida ? 100 : l.pct}%"></span></div>
      <div class="suave chico num" style="text-align:right">${l.cumplida ? '🎉 ¡Meta de ' + fmtCantidad(l.u, l.meta) + ' cumplida!' : l.sig ? 'Meta: ' + fmtCantidad(l.u, l.sig) : 'Nivel máximo'}</div></div></div>`).join('')}</div>`;
}
function verSesion(s, pestana){
  if(!s) return;
  const recs = (s.recs || []).concat(s.ej ? [{ej:s.ej}] : []).filter(r=>{ const b = mejorDe(r.ej); return b && b.ref===s.id; });
  const crono = ordenCrono(), nro = crono.findIndex(x=>x.id===s.id) + 1;
  const mismos = s.titulo ? S.sesiones.filter(x=>x.titulo && x.titulo.toLowerCase()===s.titulo.toLowerCase()).sort((a, b)=>a.fecha < b.fecha ? 1 : -1) : [s];
  const tab = pestana || 'res', m = metricas(s), cargaS = carga(s);
  const cuerpoRes = `
    ${s.w ? htmlWodVisual(s.w) : s.desc && s.desc!==s.titulo ? `<div class="pizarra">${esc(s.desc)}</div>` : ''}
    ${(s.fotos || []).length ? `<div class="galeria">${s.fotos.map(id=>`<img data-foto="${id}" alt="Foto del entrenamiento">`).join('')}</div>` : ''}
    <div class="resultado-caja"><div class="etiqueta">Resultado</div><div class="grande num">${esc(s.txt || 'Sin puntaje')}${s.rx ? ' <span class="chip MB">Rx</span>' : ''}</div>
      ${htmlParciales(s)}${recs.map(r=>`<div class="pr">🏆 Récord personal: ${esc((ejDe(r.ej) || {}).nombre || '')}</div>`).join('')}</div>
    <div class="stats3">
      <div><span class="etiqueta">N.º entrenamiento</span><b class="num">${nro.toLocaleString('es-CL')}.º</b></div>
      <div><span class="etiqueta">Duración</span><b class="num">${m.min ? m.min + ' min' : '—'}</b></div>
      <div title="Minutos × esfuerzo (método sRPE)"><span class="etiqueta">Carga</span><b class="num">${cargaS ? cargaS + ' <small class="suave">min×esf</small>' : s.rpe ? 'esf. ' + s.rpe : '—'}</b></div>
    </div>
    ${lineaMetricas(s) ? `<p class="suave chico num">${esc(lineaMetricas(s))}</p>` : ''}${s.notas ? `<p>${esc(s.notas)}</p>` : ''}
    ${htmlEsfuerzoVista(s)}
    ${htmlTarjetaMusica(s)}
    ${htmlLogros(s)}
    <div class="btns"><button class="btn" id="sFoto">📷 Agregar foto</button><button class="btn prim" id="sCompartir">↗ Compartir</button></div>
    ${s.w ? '<div class="btns"><button class="btn" id="sRepetir">↻ Registrar de nuevo</button><button class="btn" id="sFav">☆ Favorito</button></div>' : ''}
    ${s.w && s.tipo!=='descanso' ? '<button class="btn ancho" id="sAPlan" style="margin-top:8px">🗓 No lo hice: volver a planificado</button>' : ''}
    <div class="btns"><button class="btn peligro" id="sBorrar">Borrar</button><button class="btn" id="sEditar">Editar</button><button class="btn prim" data-cerrar>Listo</button></div>`;
  const best = s.titulo ? mejorDe('wod:' + s.titulo) : null;
  const cuerpoHist = `<ul class="lista">${mismos.map(x=>`<li class="item" data-hid="${x.id}"><div class="entre"><span class="num">${verFecha(x.fecha)}${x.id===s.id ? ' · <span class="etiqueta">este</span>' : ''}</span>
      <span class="num ${best && best.ref===x.id ? 'pr' : ''}">${best && best.ref===x.id ? '🏆 ' : ''}${esc(x.txt || '—')}${x.rx ? ' · Rx' : ''}</span></div></li>`).join('')}</ul>
    ${mismos.length < 2 ? '<p class="suave chico">Cuando repitas este entrenamiento verás aquí tu evolución.</p>' : ''}`;
  dialogo(`<div class="cab"><div style="flex:1;min-width:0"><div class="etiqueta">${esc(etiquetaTipo(s))}</div><h2 style="margin:2px 0">${esc(s.titulo || etiquetaTipo(s))}</h2>
      <div class="suave chico num">📅 ${verFecha(s.fecha)}${horaDe(s) ? ' · 🕘 ' + horaDe(s) : ''}</div></div><button class="btn chico-btn" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="segmentos" id="sTabs" style="margin:10px 0"><button data-t="res" class="${tab==='res' ? 'activa' : ''}">Resultado</button><button data-t="hist" class="${tab==='hist' ? 'activa' : ''}">Historial · ${mismos.length}</button></div>
    ${tab==='res' ? cuerpoRes : cuerpoHist}`, d=>{
    $$('#sTabs button', d).forEach(b=>b.onclick = ()=>verSesion(s, b.dataset.t));
    $$('[data-hid]', d).forEach(li=>li.onclick = ()=>verSesion(S.sesiones.find(x=>x.id===li.dataset.hid)));
    if(tab!=='res') return;
    $('#sEditar', d).onclick = ()=>s.w ? editarRegistro(s) : formSesion(s);
    cargarFotos(d);
    $('#sFoto', d).onclick = ()=>elegirFotos(async bs=>{ if(!bs.length) return; await agregarFotosA(s, bs); verSesion(s); if(vistaActual==='diario') vDiario(); });
    $('#sCompartir', d).onclick = ()=>compartirSesion(s);
    if($('#sAPlan', d)) $('#sAPlan', d).onclick = ()=>confirmar('¿Pasar «' + (s.titulo || etiquetaTipo(s)) + '» a planificado? Deja de contar como entrenado y queda en la agenda para registrarlo cuando lo hagas.', ()=>{
      S.planificadas = (S.planificadas || []).concat({id:uid(), fecha:s.fecha, titulo:s.titulo || '', notas:s.notas || '', w:s.w, t:plantillaDe(s.w), creado:Date.now()});
      S.sesiones = S.sesiones.filter(x=>x.id!==s.id); guardar(); aviso('🗓 Pasado a planificado'); ir(vistaActual); }, 'Sí, pasar a planificado');
    $$('.galeria img', d).forEach(img=>img.onclick = ()=>verFoto(s, img.dataset.foto));
    if(s.w){
      $('#sRepetir', d).onclick = ()=>repetirRegistro(s);
      const t = JSON.stringify(plantillaDe(s.w)), esFav = ()=>S.favoritos.some(f=>JSON.stringify(f.w)===t);
      const marca = ()=>$('#sFav', d).textContent = esFav() ? '★ En favoritos' : '☆ Guardar en favoritos'; marca();
      $('#sFav', d).onclick = ()=>{ if(esFav()) S.favoritos = S.favoritos.filter(f=>JSON.stringify(f.w)!==t); else S.favoritos.push({id:uid(), w:JSON.parse(t)}); guardar(); marca(); };
    }
    $('#sBorrar', d).onclick = ()=>confirmar('¿Borrar este entrenamiento?', async ()=>{ await borrarFotosDe(s); S.sesiones = S.sesiones.filter(x=>x.id!==s.id); guardar(); ir(vistaActual); });
  });
}
function verFoto(s, id){
  dialogo(`<div class="cab"><h2>Foto</h2><button class="btn chico-btn" data-cerrar>✕</button></div><img data-foto="${id}" alt="" style="width:100%;border-radius:10px;display:block">
    <div class="btns"><button class="btn peligro" id="fBorrar">Quitar foto</button><button class="btn" id="fVolver">‹ Volver</button></div>`, d=>{
    cargarFotos(d); $('#fVolver', d).onclick = ()=>verSesion(s);
    $('#fBorrar', d).onclick = ()=>confirmar('¿Quitar esta foto?', async ()=>{ await fotoBorrar(id); s.fotos = s.fotos.filter(x=>x!==id); guardar(); verSesion(s); });
  });
}
function camposResultado(tipo, r){
  const v = k=>esc(r[k] ?? ''), opEj = u=>EJ.filter(e=>e.u===u).map(e=>`<option value="${e.id}" ${r.ej===e.id ? 'selected' : ''}>${esc(e.nombre)}</option>`).join('');
  const tiempo = `<label>Tiempo (min:seg, ej. 12:45; o h:mm:ss)</label><input id="rT" data-tiempo inputmode="numeric" placeholder="12:45" value="${v('t')}">`;
  switch(tipo){
    case 'tiempo': return tiempo;
    case 'amrap': return `<div class="fila"><div><label>Rondas completas</label><input id="rR" type="number" inputmode="numeric" min="0" value="${v('r')}"></div><div><label>Repeticiones extra</label><input id="rRe" type="number" inputmode="numeric" min="0" value="${v('re')}"></div></div>`;
    case 'emom': return `<label>Resultado</label><select id="rC">${['', 'Completo', 'Completo con ajustes', 'Incompleto'].map(o=>`<option ${r.c===o ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
    case 'fuerza': return `<label>Ejercicio</label><select id="rEj"><option value="">Otro (sin récord)</option>${opEj('kg')}</select>
      <div class="fila"><div><label>Peso (kg)</label><input id="rKg" inputmode="decimal" value="${v('kg')}"></div><div><label>Repeticiones</label><input id="rReps" type="number" inputmode="numeric" min="1" value="${v('reps') || '1'}"></div></div>
      <p class="nota">Con 1 repetición se cuenta como récord (1RM).</p>`;
    case 'reps': return `<label>Ejercicio</label><select id="rEj"><option value="">Otro (sin récord)</option>${opEj('reps')}</select>
      <label>Repeticiones</label><input id="rReps" type="number" inputmode="numeric" min="0" value="${v('reps')}">`;
    case 'carrera': return `<label>Distancia (km)</label><input id="rDist" inputmode="decimal" placeholder="2,4" value="${v('dist')}">${tiempo}
      <p class="nota">2,4 km, 5 km y 10 km se cuentan como récord.</p>`;
    case 'marcha': return `<div class="fila"><div><label>Distancia (km)</label><input id="rDist" inputmode="decimal" value="${v('dist')}"></div><div><label>Carga (kg)</label><input id="rKg" inputmode="decimal" value="${v('kg')}"></div></div>${tiempo}`;
    default: return `<label>Resultado</label><input id="rTxt" value="${v('txt')}">`;
  }
}
function leerResultado(d){ const r = {}; [['t', 'rT'], ['r', 'rR'], ['re', 'rRe'], ['c', 'rC'], ['ej', 'rEj'], ['kg', 'rKg'], ['reps', 'rReps'], ['dist', 'rDist'], ['txt', 'rTxt']].forEach(([k, id])=>{ const el = $('#' + id, d); if(el) r[k] = el.value; }); return r; }
function calcular(s){
  const r = s.res || {}, wod = BIBLIO.find(w=>w.nombre.toLowerCase()===(s.titulo||'').trim().toLowerCase());
  s.ej = null; s.valor = null; s.txt = '';
  switch(s.tipo){
    case 'tiempo': { const t = PSF.leerTiempo(r.t); if(t!=null){ s.valor = t; s.txt = PSF.verTiempo(t); if(wod && wod.tipo==='tiempo') s.ej = wodId(wod); } break; }
    case 'amrap': { const R = ent(r.r), re = ent(r.re) || 0; if(R!=null){ s.txt = R + (R===1 ? ' ronda' : ' rondas') + (re ? ' + ' + re : ''); s.valor = R + re/((wod && wod.rpr) || 100); if(wod && wod.tipo==='amrap') s.ej = wodId(wod); } break; }
    case 'emom': s.txt = r.c || ''; break;
    case 'fuerza': { const kg = num(r.kg), reps = ent(r.reps) || 1; if(kg!=null){ s.txt = String(kg).replace('.', ',') + ' kg' + (reps>1 ? ' × ' + reps : ''); if(r.ej && reps===1){ s.ej = r.ej; s.valor = kg; } } break; }
    case 'reps': { const n = ent(r.reps); if(n!=null){ s.txt = n + ' rep'; if(r.ej){ s.ej = r.ej; s.valor = n; } } break; }
    case 'carrera': case 'marcha': {
      const dkm = num(r.dist), t = PSF.leerTiempo(r.t), kg = num(r.kg), ds = dkm!=null ? String(dkm).replace('.', ',') + ' km' : '';
      if(t!=null){ s.valor = t; s.txt = (ds ? ds + ' en ' : '') + PSF.verTiempo(t) + (dkm ? ' (' + PSF.verTiempo(t/dkm) + '/km)' : ''); }
      else s.txt = ds;
      if(s.tipo==='marcha' && kg) s.txt += ' · ' + String(kg).replace('.', ',') + ' kg';
      if(t!=null) s.ej = s.tipo==='carrera' ? ({2.4:'psf2400', 5:'5k', 10:'10k'})[dkm] || null : dkm===10 ? 'marcha10' : null;
      break; }
    default: s.txt = r.txt || '';
  }
  return s;
}
function formSesion(base){
  const s = Object.assign({fecha:hoyISO(), tipo:'tiempo', titulo:'', desc:'', res:{}, rpe:'', notas:''}, base || {}); s.res = Object.assign({}, s.res);
  const editando = !!s.id;
  dialogo(`<h2>${editando ? 'Editar' : 'Registrar'} entrenamiento</h2>
    <div class="fila"><div><label>Fecha</label><input id="fFecha" type="date" value="${esc(s.fecha)}"></div>
    <div><label>Tipo</label><select id="fTipo">${Object.entries(TIPOS).map(([k, t])=>`<option value="${k}" ${s.tipo===k ? 'selected' : ''}>${t}</option>`).join('')}</select></div></div>
    <label>Nombre (opcional)</label><input id="fTitulo" list="listaWod" placeholder="Ej.: Cindy, Trote suave, Pierna" value="${esc(s.titulo)}">
    <datalist id="listaWod">${BIBLIO.map(w=>`<option value="${esc(w.nombre)}">`).join('')}</datalist>
    <label>Qué se hizo</label><textarea id="fDesc" placeholder="Ejercicios, repeticiones, pesos…">${esc(s.desc)}</textarea>
    <div id="fRes">${camposResultado(s.tipo, s.res)}</div>
    <label>Esfuerzo percibido (1 = muy fácil · 10 = máximo)</label>
    <select id="fRpe"><option value="">—</option>${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n=>`<option ${String(s.rpe)===String(n) ? 'selected' : ''}>${n}</option>`).join('')}</select>
    <label>Notas</label><input id="fNotas" placeholder="Cómo te sentiste, molestias, clima…" value="${esc(s.notas)}">
    <div class="btns"><button class="btn" data-cerrar>Cancelar</button><button class="btn prim" id="fGuardar">Guardar</button></div>`, d=>{
    $('#fTipo', d).onchange = ()=>{ Object.assign(s.res, leerResultado(d)); $('#fRes', d).innerHTML = camposResultado($('#fTipo', d).value, s.res); };
    $('#fTitulo', d).onchange = ()=>{ const w = BIBLIO.find(w=>w.nombre===$('#fTitulo', d).value); if(!w) return;
      if(!$('#fDesc', d).value.trim()) $('#fDesc', d).value = w.desc;
      if($('#fTipo', d).value===w.tipo) return;    // mismo tipo: no redibujar (se perdería el campo que el usuario está tocando)
      Object.assign(s.res, leerResultado(d)); $('#fTipo', d).value = w.tipo; $('#fRes', d).innerHTML = camposResultado(w.tipo, s.res); };
    $('#fGuardar', d).onclick = ()=>{
      const n = Object.assign({}, s, {fecha:$('#fFecha', d).value || hoyISO(), tipo:$('#fTipo', d).value, titulo:$('#fTitulo', d).value.trim(),
        desc:$('#fDesc', d).value.trim(), res:leerResultado(d), rpe:$('#fRpe', d).value, notas:$('#fNotas', d).value.trim()});
      calcular(n);
      if(n.ej) avisarRecord(n.ej, n.valor, n.id);
      if(editando) S.sesiones = S.sesiones.map(x=>x.id===n.id ? n : x);
      else { n.id = uid(); n.creado = Date.now(); S.sesiones.push(n); }
      guardar(); d.close(); if(!($('#aviso').dataset.t || '').startsWith('🏆') || $('#aviso').hidden) aviso('Entrenamiento guardado');
      ir(vistaActual==='reloj' ? 'hoy' : vistaActual);
    };
  });
}

/* ---------- Pestaña Reloj ---------- */
const MODOS = {cron:'Por tiempo', amrap:'AMRAP', emom:'EMOM', tabata:'Intervalos'};
let cfgReloj = Object.assign({modo:'cron', tope:'', amrap:'20', emomCada:'60', emomN:'10', trab:'20', desc:'10', rondas:'8', prep:true}, JSON.parse(pref('reloj') || '{}'));
let R = null, relojWod = null;   // relojWod: WOD del día que se inició desde la tarjeta          // reloj en marcha: {plan, acc, t0, corriendo, rondas, ultimo, fin}
let audio = null, wake = null;
/* Los avisos suenan por encima de la música (Spotify u otra app): en el iPhone (Safari 16.4+) la sesión de audio «transient» baja un momento
   el volumen de la otra app mientras suena el aviso (como una notificación) y después lo devuelve. Donde no existe, suena a la par. */
let tSesionAudio = null;
function audioSobreMusica(){
  try{ if(navigator.audioSession){ navigator.audioSession.type = 'transient'; clearTimeout(tSesionAudio); tSesionAudio = setTimeout(()=>{ try{ navigator.audioSession.type = 'ambient'; }catch(e){} }, 2500); } }catch(e){}
}
function sonido(frec, dur){
  try{ audioSobreMusica(); audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if(audio.state!=='running') audio.resume();
    const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
    o.frequency.value = frec; o.type = 'square'; g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + dur); }catch(e){}
}
/* Los avisos son solo pitidos (el usuario no quiere voz, 17-oct-2026); voz() solo deja el nombre del aviso (lo revisan las pruebas) */
function voz(txt){}
function alerta(txt){ sonido(990, 0.12); setTimeout(()=>sonido(990, 0.12), 180); voz(txt); }
async function pantallaEncendida(si){
  try{ if(si && 'wakeLock' in navigator && !wake) wake = await navigator.wakeLock.request('screen'); if(!si && wake){ await wake.release(); wake = null; } }catch(e){}
}
const conTramos = ()=>cfgReloj.modo==='tramos' && relojWod && relojWod.uno && relojWod.uno.tramos && relojWod.uno.tramos.length;
function planReloj(c){
  const p = [];
  if(c.prep) p.push({fase:'prep', dur:10, txt:'Preparados'});
  if(c.modo==='tramos' && conTramos()){   // cada tramo: los de tiempo avisan solos; los de distancia o libres siguen hasta tocar «Siguiente tramo»
    const xs = expandirTramos(relojWod.uno.tramos);
    xs.forEach((t, i)=>{ const seg = segTramo(t); p.push({fase:t.k==='pri' || t.k==='trab' ? 'trabajo' : 'descanso', dur:seg || Infinity, sube:!seg, tramo:t, n:i + 1, de:xs.length,
      txt:TIPO_TRAMO[t.k] + (t.rep ? ' ' + t.rep + '/' + t.de : '')}); });
    return p; }
  if(c.modo==='tramos') c.modo = 'cron';
  if(c.modo==='cron'){ const tope = num(c.tope); p.push({fase:'trabajo', dur:tope ? tope*60 : Infinity, sube:true, txt:'¡Vamos!'}); }
  if(c.modo==='amrap') p.push({fase:'trabajo', dur:(num(c.amrap) || 20)*60, txt:'AMRAP'});
  if(c.modo==='emom'){ const n = ent(c.emomN) || 10, cada = ent(c.emomCada) || 60; for(let i=1;i<=n;i++) p.push({fase:'trabajo', dur:cada, txt:'Ronda ' + i + ' de ' + n}); }
  if(c.modo==='tabata'){ const n = ent(c.rondas) || 8, tr = ent(c.trab) || 20, de = ent(c.desc) || 10;
    for(let i=1;i<=n;i++){ p.push({fase:'trabajo', dur:tr, txt:'Ronda ' + i + ' de ' + n}); if(i<n && de>0) p.push({fase:'descanso', dur:de, txt:'Descanso · sigue ronda ' + (i+1)}); } }
  return p;
}
function estadoReloj(){
  const el = R.acc + (R.corriendo ? Date.now() - R.t0 : 0) / 1000;
  let t = el, i = 0;
  while(i < R.plan.length && t >= R.plan[i].dur){ t -= R.plan[i].dur; i++; }
  if(i >= R.plan.length) return {fin:true, total:R.plan.reduce((a, s)=>a + s.dur, 0) - (R.plan[0].fase==='prep' ? 10 : 0)};
  const seg = R.plan[i], resta = seg.dur - t, trabajo = el - (R.plan[0].fase==='prep' ? Math.min(el, 10) : 0);
  return {i, seg, t, resta, mostrar:seg.sube ? t : resta, trabajo};
}
function tic(){
  if(!R) return;
  if(R.fin){ pintarReloj({fase:'fin', txt:'¡Terminado!', dig:PSF.verTiempo(R.total), info:R.rondas ? R.rondas + ' rondas' : ''}); return; }
  const e = estadoReloj();
  if(e.fin){ gpsCerrar(); R.fin = true; R.corriendo = false; R.total = e.total; sonido(880, 0.7); setTimeout(()=>sonido(880, 0.7), 800); voz('¡Tiempo!'); pantallaEncendida(false); tic(); mostrarResumenReloj(); return; }
  const clave = e.i + ':' + Math.ceil(e.resta);
  if(R.corriendo && clave!==R.ultimo){
    const rs = Math.ceil(e.resta), dur = e.seg.dur, cambio = R.ultimo && e.i!==+R.ultimo.split(':')[0];
    if(cambio){ sonido(e.seg.fase==='descanso' ? 440 : 880, 0.45);
      if(e.seg.fase==='descanso') voz('Descanso'); else if(e.seg.fase==='trabajo' && R.plan[e.i - 1] && R.plan[e.i - 1].fase==='prep') voz('¡Vamos!');
      else if(cfgReloj.modo==='emom' && e.seg.fase==='trabajo') voz('Minuto ' + (R.plan.slice(0, e.i + 1).filter(x=>x.fase==='trabajo').length));
      else if(e.seg.fase==='trabajo' && e.seg.tramo) voz(e.seg.txt); else if(e.seg.fase==='trabajo') voz('¡Vamos!'); }
    else if(!e.seg.sube && isFinite(dur)){
      if(rs<=3 && rs>=1){ sonido(660, 0.12); voz(String(rs)); }
      else if(cfgReloj.modo==='emom' && e.seg.fase==='trabajo' && dur >= 45 && rs===30) alerta('30 segundos');
      else if(e.seg.fase!=='prep' && dur >= 120 && rs===Math.round(dur / 2)) alerta('Mitad del tiempo');
      else if(e.seg.fase!=='prep' && dur >= 120 && rs===60) alerta('Último minuto');
    }
    R.ultimo = clave;
  }
  if(e.seg.tramo){ const t = e.seg.tramo, g = R.gps ? gpsTramo(e) : null; if(g && g.listo){ tic(); return; }
    pintarReloj({fase:e.seg.fase, txt:'Tramo ' + e.seg.n + ' de ' + e.seg.de + ' · ' + e.seg.txt, dig:PSF.verTiempo(e.seg.sube ? Math.floor(e.mostrar) : Math.ceil(e.mostrar)),
      info:[cantTramo(t), textoIntensidad(t, relojWod.uno.mov)].filter(Boolean).join(' · ') + ' — total ' + PSF.verTiempo(e.trabajo) + (g ? '\n' + textoGPS(g, e) : '')}); return; }
  const info = e.seg.fase==='prep' ? '' : (cfgReloj.modo==='cron' || cfgReloj.modo==='amrap') ? 'Tiempo total ' + PSF.verTiempo(e.trabajo) : e.seg.txt;
  pintarReloj({fase:e.seg.fase, txt:e.seg.fase==='prep' ? 'Preparados' : e.seg.fase==='descanso' ? 'Descanso' : (cfgReloj.modo==='cron' ? 'Por tiempo' : MODOS[cfgReloj.modo]),
    dig:PSF.verTiempo(e.seg.sube ? Math.floor(e.mostrar) : Math.ceil(e.mostrar)), info});
}
function pintarReloj(p){
  $$('.reloj').forEach(r=>{ r.className = 'reloj ' + p.fase + (r.classList.contains('pantalla-reloj') ? ' pantalla-reloj' : '');
    $('.fase', r).textContent = p.txt; $('.digitos', r).textContent = p.dig; $('.info', r).textContent = p.info || ''; });
  $$('.cuentaRondas').forEach(x=>x.textContent = R ? R.rondas : 0);
  $$('.bPausa').forEach(b=>{ b.textContent = R && R.fin ? 'Registrar resultado' : R && R.corriendo ? '⏸ Pausa' : '▶ Continuar'; });
  $$('.bDetener').forEach(b=>{ b.textContent = R && R.fin ? 'Ver resumen' : '⏹ Terminar'; });
}
setInterval(tic, 200);
function iniciarReloj(){
  sonido(1, 0.01);   // en iPhone el sonido se habilita con un toque
  R = {plan:planReloj(cfgReloj), acc:0, t0:Date.now(), corriendo:true, rondas:0, marcas:[], ultimo:null, fin:false, inicio:Date.now()};
  if(cfgReloj.modo==='tramos' && cfgReloj.gps && conTramos()) gpsIniciar();
  if(R.plan[0] && R.plan[0].fase==='prep'){ sonido(660, 0.2); voz('Preparados'); } else { sonido(880, 0.45); voz('¡Vamos!'); }   // todos los modos avisan al comenzar
  pantallaEncendida(true); vReloj();
}
function pausaReloj(){
  if(!R) return;
  if(R.fin){ registrarDesdeReloj(); return; }
  if(R.corriendo){ R.acc += (Date.now() - R.t0)/1000; R.corriendo = false; pantallaEncendida(false); }
  else { R.t0 = Date.now(); R.corriendo = true; pantallaEncendida(true); }
  tic();
}
function detenerReloj(){ gpsCerrar(); R = null; relojWod = null; pantallaEncendida(false); cerrarPantalla(); vReloj(); }
/* Terminar a mano (por tiempo sin tope, o antes de tiempo): queda el tiempo hecho y se muestra el resumen */
function terminarReloj(){
  if(!R || R.fin) return; const e = estadoReloj();
  gpsCerrar(); R.fin = true; R.corriendo = false; R.total = e.fin ? e.total : Math.round(e.trabajo || 0); pantallaEncendida(false); sonido(880, 0.5); tic(); mostrarResumenReloj();
}
/* Tiempo de cada ronda marcada con «+1 ronda»; en «por tiempo» el tramo final después de la última marca es la última ronda */
const distHecha = seg=>{ const k = R && R.plan ? R.plan.indexOf(seg) : -1, g = R && R.gps && R.gps.porSeg[k]; return g!=null && g > 0 ? '📍 ' + verDist(g) : cantTramo(seg.tramo); };
/* Por tramos: tiempo de cada tramo hecho (el último, si se terminó antes, con lo que alcanzó) */
function tramosHechos(){
  if(!R || !R.plan) return []; let rest = R.total; const out = [];
  R.plan.filter(x=>x.tramo).forEach(x=>{ if(rest <= 0) return; const d = Math.min(x.dur, rest); out.push({seg:x, t:Math.round(d)}); rest -= d; });
  return out;
}
function rondasReloj(){
  if(R && R.plan && R.plan.some(x=>x.tramo)) return tramosHechos().map(x=>x.t);
  if(!R || !R.marcas || !R.marcas.length) return [];
  const m = R.marcas.slice(); if(cfgReloj.modo==='cron' && R.total - m[m.length - 1] >= 1) m.push(R.total);
  return m.map((t, i)=>Math.round(t - (i ? m[i - 1] : 0)));
}
const difSeg = d=>{ const a = Math.abs(d); return (d < 0 ? '−' : '+') + (a >= 60 ? PSF.verTiempo(a) : a + ' s'); };
function textoResumenReloj(){
  const rs = rondasReloj(), modo = cfgReloj.modo==='cron' ? 'Por tiempo' : MODOS[cfgReloj.modo];
  return [modo + ' · ' + PSF.verTiempo(R.total) + (cfgReloj.modo==='amrap' ? ' · ' + R.rondas + ' rondas' : '')].concat(rs.map((t, i)=>'Ronda ' + (i + 1) + ': ' + PSF.verTiempo(t)),
    rs.length > 1 ? ['Promedio: ' + PSF.verTiempo(Math.round(rs.reduce((a, b)=>a + b, 0) / rs.length))] : []).join('\n');
}
function mostrarResumenReloj(){
  if(!R || !R.fin) return;
  const rs = rondasReloj(), TH = tramosHechos(), modo = cfgReloj.modo==='cron' ? 'Por tiempo' : cfgReloj.modo==='tramos' ? 'Por tramos' : MODOS[cfgReloj.modo], mejor = rs.length ? Math.min(...rs) : null;
  const prom = rs.length > 1 ? Math.round(rs.reduce((a, b)=>a + b, 0) / rs.length) : null;
  const n = cfgReloj.modo==='emom' ? ent(cfgReloj.emomN) : cfgReloj.modo==='tabata' ? ent(cfgReloj.rondas) : null;
  dialogo(`<div class="cab"><h2>Resumen</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <div class="res-reloj"><div class="suave chico">${esc(modo)}${relojWod ? ' · ' + esc(relojWod.titulo || '') : ''} · ${verFecha(hoyISO())} ${new Date(R.inicio).toTimeString().slice(0, 5)}</div>
      <div class="rr-total"><span>Tiempo total</span><b class="num">${PSF.verTiempo(R.total)}</b></div>
      ${cfgReloj.modo==='amrap' ? `<div class="rr-total"><span>Rondas</span><b class="num">${R.rondas}</b></div>` : ''}
      ${n ? `<div class="rr-total"><span>Intervalos</span><b class="num">${n}</b></div>` : ''}
      ${rs.length ? `<div class="etiqueta" style="margin-top:12px">${TH.length ? 'Tiempo de cada tramo' : 'Tiempos de rondas'}</div>
        <table class="rr-tabla">${rs.map((t, i)=>`<tr class="${t===mejor && rs.length > 1 && !TH.length ? 'mejor' : ''}"><td>${TH.length ? esc(TH[i].seg.txt) : 'Ronda ' + (i + 1)}</td><td>${PSF.verTiempo(t)}</td><td class="${i && !TH.length ? (t - rs[i - 1] < 0 ? 'menos' : t - rs[i - 1] > 0 ? 'mas' : '') : ''}">${TH.length ? esc(distHecha(TH[i].seg)) : i ? difSeg(t - rs[i - 1]) : ''}</td></tr>`).join('')}</table>
        ${prom && !TH.length ? `<div class="rr-prom num">Promedio ${PSF.verTiempo(prom)} · mejor ${PSF.verTiempo(mejor)} (ronda ${rs.indexOf(mejor) + 1})</div>` : ''}`
        : (cfgReloj.modo==='cron' || cfgReloj.modo==='amrap' ? '<p class="nota">Toca «＋1 ronda» al terminar cada ronda y aquí verás el tiempo de cada una.</p>' : '')}
      <div class="btns"><button class="btn" id="rrCopiar">⧉ Copiar</button><button class="btn prim" id="rrReg">＋ Registrar resultado</button></div>
      <button class="btn ancho peligro" id="rrDescartar" style="margin-top:8px">Descartar</button></div>`, d=>{
    $('#rrCopiar', d).onclick = ()=>{ try{ navigator.clipboard.writeText(textoResumenReloj()).then(()=>aviso('Resumen copiado'), ()=>{}); }catch(e){} };
    $('#rrReg', d).onclick = ()=>{ d.close(); registrarDesdeReloj(); };
    $('#rrDescartar', d).onclick = ()=>confirmar('¿Descartar este tiempo? No se guarda nada.', detenerReloj, 'Sí, descartar');
  });
}
function registrarDesdeReloj(){
  const e = R && !R.fin ? estadoReloj() : null, c = cfgReloj, est = {cron:'por_tiempo', amrap:'amrap', emom:'emom', tabata:'tabata'}[c.modo];
  const params = {cron:{}, amrap:{minutos:c.amrap}, emom:{cada:c.emomCada, intervalos:c.emomN}, tabata:{rondas:c.rondas, trabajo:c.trab, descanso:c.desc}}[c.modo], res = {};
  if(c.modo==='cron' && R) res.t = PSF.verTiempo(R.fin ? R.total : e.trabajo);
  if(c.modo==='amrap' && R) res.r = String(R.rondas);
  const notasReloj = R && rondasReloj().length ? textoResumenReloj() : '';
  cerrarPantalla();
  const durMin = R ? Math.max(1, Math.round((R.fin ? R.total : e.trabajo) / 60)) : '';
  if(relojWod){ const t = relojWod; relojWod = null; abrirRegistro({}); cargarPlantilla(t); W.dur = durMin;
    if(W.modo==='uno'){ if(res.t) W.uno.tiempo = res.t; } else if(estiloDe(W.estilo).r==='tiempo' && res.t) W.res.t = res.t; else if(W.estilo==='amrap' && res.r) W.res.r = res.r;
    if(W.modo==='uno' && W.uno.tramos && R && R.plan.some(x=>x.tramo)){ tramosHechos().forEach(({seg, t})=>{ const x = seg.tramo; guardarReal(W.uno, x.ref + (x.rep ? ':' + x.rep : '') + ':t', PSF.verTiempo(t));
      const g = R.gps && R.gps.porSeg[R.plan.indexOf(seg)]; if(g > 0 && x.med!=='dist') guardarReal(W.uno, x.ref + (x.rep ? ':' + x.rep : '') + ':d', coma(x.u==='km' ? Math.round(g / 10) / 100 : x.u==='mi' ? Math.round(g / 16.09344) / 100 : g)); }); W.uno.tiempo = PSF.verTiempo(R.total); }
    else if(notasReloj) W.notas = notasReloj; pintar(); return; }
  abrirRegistro({modo:'multi', estilo:est, params:paramsDe(est, params), res, dur:durMin, notas:notasReloj, paso:'multi', volver:['inicio', 'estilos']});
}
function htmlReloj(extra){
  const conRonda = cfgReloj.modo==='cron' || cfgReloj.modo==='amrap';
  return `<div class="reloj ${extra||''}"><div class="fase"></div>
    <div class="reloj-fila ${conRonda ? 'con-ronda' : ''}"><div class="digitos">0:00</div>${conRonda ? `<button class="bRonda ronda-circ" aria-label="Sumar una ronda"><b>＋1</b><span class="cuentaRondas">0</span><small>rondas</small></button>` : ''}</div>
    <div class="info"></div>
    ${cfgReloj.modo==='tramos' ? `<div class="btns" style="justify-content:center"><button class="btn bSiguiente" style="max-width:260px">⏭ Siguiente tramo</button></div>` : ''}
    <div class="btns"><button class="btn prim bPausa">⏸ Pausa</button><button class="btn bDetener">⏹ Terminar</button>${extra ? '<button class="btn bCerrar">Salir de pantalla completa</button>' : '<button class="btn bGrande">⛶ Pantalla completa</button>'}</div></div>`;
}
function enlazarReloj(r){
  $$('.bPausa', r).forEach(b=>b.onclick = pausaReloj);
  $$('.bDetener', r).forEach(b=>b.onclick = ()=>{ if(!R) return; if(R.fin){ mostrarResumenReloj(); return; }
    const e = estadoReloj(); if((e.trabajo || 0) >= 3) terminarReloj(); else detenerReloj(); });
  $$('.bRonda', r).forEach(b=>b.onclick = ()=>{ if(R && !R.fin){ const e = estadoReloj(); if(e.seg && e.seg.fase==='prep') return; R.rondas++; R.marcas.push(Math.round(e.trabajo)); sonido(990, 0.08); tic(); } });
  $$('.bSiguiente', r).forEach(b=>b.onclick = ()=>{ if(!R || R.fin || !R.corriendo) return; const e = estadoReloj(); if(e.fin || !e.seg || e.seg.fase==='prep') return;
    R.plan[e.i].dur = Math.max(1, e.t); sonido(880, 0.3); tic(); });
  $$('.bGrande', r).forEach(b=>b.onclick = abrirPantalla);
  $$('.bCerrar', r).forEach(b=>b.onclick = cerrarPantalla);
}
function abrirPantalla(){ cerrarPantalla(); const div = document.createElement('div'); div.id = 'pantallaReloj'; div.innerHTML = htmlReloj('pantalla-reloj'); document.body.appendChild(div); enlazarReloj(div); tic(); }
function cerrarPantalla(){ const p = $('#pantallaReloj'); if(p) p.remove(); }
function vReloj(){
  const c = cfgReloj, campo = (id, lab, extra)=>`<div><label>${lab}</label><input id="${id}" type="number" inputmode="numeric" min="0" value="${esc(c[id])}" ${extra||''}></div>`;
  const cfg = {
    cron: `<div class="fila">${campo('tope', 'Tope de tiempo en minutos (opcional)', 'placeholder="sin tope"')}</div><p class="nota">Cuenta hacia arriba. Detén el reloj al terminar el entrenamiento.</p>`,
    amrap: `<div class="fila">${campo('amrap', 'Duración (minutos)')}</div><p class="nota">Máximo de rondas en el tiempo. Toca «+1 ronda» al completar cada ronda.</p>`,
    emom: `<div class="fila">${campo('emomCada', 'Cada (segundos)')}${campo('emomN', 'Rondas')}</div><p class="nota">Al inicio de cada intervalo suena la señal.</p>`,
    tabata: `<div class="fila">${campo('trab', 'Trabajo (s)')}${campo('desc', 'Descanso (s)')}${campo('rondas', 'Rondas')}</div><p class="nota">Tabata clásico: 20 s / 10 s × 8.</p>`,
    tramos: conTramos() ? `<div class="etiqueta">${esc(relojWod.titulo || 'Sesión por tramos')}</div>${htmlTramosVista(relojWod.uno)}
      ${hayGPS() ? `<label class="check"><input type="checkbox" id="rGps" ${c.gps ? 'checked' : ''}>📍 Usar el GPS del teléfono: los tramos por distancia cambian solos y se anotan los metros de cada tramo</label>
        <p class="nota">Con GPS deja la app abierta y la pantalla encendida (el teléfono no usa el GPS de una app web en segundo plano). La primera vez el teléfono pide permiso de ubicación.</p>` : ''}
      <p class="nota">Los tramos por tiempo cambian solos con pitido. Los de distancia ${c.gps ? 'cambian solos con el GPS o' : 'o libres siguen hasta'} que toques «⏭ Siguiente tramo».</p>` : '',
  }[c.modo] || '';
  $('#vista').innerHTML = R ? `<div class="tarjeta">${htmlReloj()}</div>` : `
    <div class="segmentos" id="modos">${Object.entries(Object.assign({}, conTramos() ? {tramos:'Por tramos'} : {}, MODOS)).map(([k, t])=>`<button data-m="${k}" class="${c.modo===k ? 'activa' : ''}">${t}</button>`).join('')}</div>
    <div class="tarjeta" style="margin-top:12px">${cfg}
      <label class="check"><input type="checkbox" id="prep" ${c.prep ? 'checked' : ''}>Cuenta regresiva de 10 s antes de partir</label>
      <button class="btn prim ancho" id="bIniciar" style="font-size:20px;min-height:58px">▶ Iniciar</button>
      <button class="btn ancho" id="bMusica" style="margin-top:8px">🎵 Mi música</button></div>
    <p class="nota">Los pitidos suenan sobre tu música (bajan un momento su volumen). Suenan: al comenzar; en EMOM a los 30 segundos y 3-2-1 antes de cada minuto; con cuenta regresiva (AMRAP, tope de tiempo) a la mitad y en el último minuto (pitido doble), 3-2-1 y al terminar (pitido largo). En iPhone, revisa que el interruptor de silencio no esté activado.</p>`;
  if(R){ enlazarReloj($('#vista')); tic(); return; }
  $$('#modos button').forEach(b=>b.onclick = ()=>{ c.modo = b.dataset.m; pref('reloj', JSON.stringify(c)); vReloj(); });
  $$('#vista input[type=number]').forEach(i=>i.oninput = ()=>{ c[i.id] = i.value; pref('reloj', JSON.stringify(c)); });
  $('#prep').onchange = e=>{ c.prep = e.target.checked; pref('reloj', JSON.stringify(c)); };
  if($('#rGps')) $('#rGps').onchange = e=>{ c.gps = e.target.checked; pref('reloj', JSON.stringify(c)); };
  $('#bIniciar').onclick = iniciarReloj;
  $('#bMusica').onclick = abrirMiMusica;
}

/* ---------- Pestaña PSF ---------- */
let B = {fecha:hoyISO(), carrera:'', abd:'', brazos:'', peso:'', talla:'', lmC:false, lmA:false, lmB:false, alt:'nado', altT:''};
const perfilPSF = ()=>{ const p = S.perfil, edad = PSF.edadDe(p.nac); return {sexo:p.sexo, edad, servicios:p.servicios, bonif:p.bonif, brazos:p.brazos}; };
function chip(n){ return n ? `<span class="chip ${n}">${PSF.NOMBRES[n]}</span>` : '<span class="chip gris">Sin dato</span>'; }
function resultadosPSF(){
  const p = perfilPSF(), t = PSF.leerTiempo(B.carrera), a = ent(B.abd), b = ent(B.brazos);
  const c = B.lmC ? {nivel:'LM'} : t!=null ? PSF.carrera(p, t) : null;
  const ab = B.lmA ? {nivel:'LM'} : a!=null ? PSF.abdominales(p, a) : null;
  const br = B.lmB ? {nivel:'LM'} : b!=null ? PSF.brazos(p, b) : null;
  const ev = c && ab && br ? PSF.evaluacion([c.nivel, ab.nivel, br.nivel]) : null;
  return {p, t, a, b, c, ab, br, ev, prueba:PSF.pruebaBrazos(p)};
}
function lineaMeta(r, esTiempo){
  if(!r || r.nivel==='LM') return '';
  const f = v=>esTiempo ? PSF.verTiempo(v) : v + ' rep';
  const falta = r.nivel==='MB' ? '<span style="color:var(--mb)">¡Nivel máximo!</span>'
    : r.nivel==='A' ? `Te ${esTiempo ? 'sobran' : 'faltan'} <b>${esTiempo ? PSF.verTiempo(r.faltaMB) : r.faltaMB}</b> para Apto muy bueno`
    : `Te ${esTiempo ? 'sobran' : 'faltan'} <b>${esTiempo ? PSF.verTiempo(r.faltaA) : r.faltaA}</b> para Apto`;
  return `<div class="meta"><span>Apto MB: ${esTiempo ? '≤ ' : '≥ '}${f(r.mb)}</span><span>Apto: ${esTiempo ? '≤ ' : '≥ '}${f(r.a)}</span><span>Tramo ${r.tramo} años</span></div><div class="chico" style="margin-top:4px">${falta}</div>`;
}
function actualizarPSF(){
  const r = resultadosPSF();
  [['c', r.c, true], ['ab', r.ab, false], ['br', r.br, false]].forEach(([k, v, tiempo])=>{
    const box = $('#psf_' + k); if(!box) return;
    box.className = 'tarjeta prueba ' + (v ? v.nivel : '');
    $('.res', box).innerHTML = chip(v && v.nivel); $('.metaTxt', box).innerHTML = lineaMeta(v, tiempo);
  });
  const imc = PSF.imc(num(B.peso), num(B.talla));
  $('#imc').innerHTML = imc ? `IMC <b>${String(imc.valor).replace('.', ',')}</b> · ${imc.categoria}` : '';
  $('#evalRes').innerHTML = r.ev ? `<div class="suave">Resultado de la evaluación</div><div class="grande"><span class="chip ${r.ev}" style="font-size:20px;padding:6px 16px">${PSF.NOMBRES[r.ev]}</span></div>`
    : `<div class="suave">${r.c || r.ab || r.br ? 'Completa las tres pruebas para ver el resultado' : 'Anota tus marcas para ver tu resultado'}</div>`;
  if(B.lmC + B.lmA + B.lmB > 1) $('#evalRes').innerHTML = '<div class="suave">Con licencia en más de una prueba no hay evaluación (se rinden PSF alternativas)</div>';
}
function vPSF(){
  const p = S.perfil, pp = perfilPSF(), per = PSF.proximoPeriodo();
  if(!p.sexo || !p.nac || pp.edad==null){
    $('#vista').innerHTML = `<h2>Pruebas de Suficiencia Física</h2><div class="tarjeta"><p>Para calcular tu resultado necesito tu sexo y tu fecha de nacimiento (las tablas cambian según la edad).</p>
      <div class="fila"><div><label>Sexo</label><select id="pSexo"><option value="">—</option><option value="H">Hombre</option><option value="M">Mujer</option></select></div>
      <div><label>Fecha de nacimiento</label><input id="pNac" type="date" value="${esc(p.nac)}"></div></div>
      <button class="btn prim ancho" id="pOk" style="margin-top:14px">Continuar</button></div>`;
    $('#pSexo').value = p.sexo;
    $('#pOk').onclick = ()=>{ const sx = $('#pSexo').value, nac = $('#pNac').value; if(!sx || !nac){ aviso('Falta el sexo o la fecha'); return; } p.sexo = sx; p.nac = nac; guardar(); vPSF(); };
    return;
  }
  const prueba = PSF.pruebaBrazos(pp), nb = PSF.BRAZOS[prueba].nombre;
  const caja = (k, titulo, campo, lm)=>`<div class="tarjeta prueba" id="psf_${k}"><div class="entre"><span class="titulo">${titulo}</span><span class="res"></span></div>
    <div class="fila" style="margin-top:8px">${campo}</div>
    <label class="check"><input type="checkbox" data-lm="${lm}" ${B[lm] ? 'checked' : ''}>No rinde esta prueba (licencia médica)</label><div class="metaTxt"></div></div>`;
  const ctrl = S.controles.slice().sort((a, b)=>a.fecha < b.fecha ? 1 : -1);
  $('#vista').innerHTML = `
    <h2>Pruebas de Suficiencia Física</h2>
    ${tilesPSF()}
    ${(()=>{ const t = sesionPSFHoy(), f = focoPSF(); return `<div class="tarjeta"><div class="entre"><span class="etiqueta">Preparación PSF de hoy</span>${f ? `<span class="foco" style="margin:0">Enfoque: ${FOCO_N[f]}</span>` : ''}</div>
      <div class="titulo" style="font-size:17px;margin-top:6px">${esc(t.titulo)}</div><div class="pizarra">${esc(textoPlantilla(t))}</div>
      ${t.estrategia ? `<p class="suave chico">${esc(t.estrategia)}</p>` : ''}
      <div class="btns"><button class="btn" id="psfDet">Detalles</button><button class="btn prim" id="psfReg">＋ Registrar</button></div>
      <p class="nota">El plan completo de preparación hacia la evaluación viene en una próxima etapa.</p></div>`; })()}
    <p class="suave">${p.sexo==='M' ? 'Mujer' : 'Hombre'} · ${pp.edad} años${p.servicios ? ' · servicios profesionales' : ''}${p.bonif ? ' · bonificación 10 % en carrera' : ''} <a href="#" id="aPerfil" style="color:var(--acento)">⚙ Mis condiciones PSF</a></p>
    ${caja('ab', 'Abdominales en 1 minuto', `<input id="bAbd" type="number" inputmode="numeric" min="0" placeholder="Repeticiones" value="${esc(B.abd)}">`, 'lmA')}
    ${caja('br', esc(nb), `<input id="bBrazos" type="number" inputmode="numeric" min="0" placeholder="Repeticiones" value="${esc(B.brazos)}">`, 'lmB')}
    ${caja('c', 'Carrera 2.400 m', `<input id="bCarrera" data-tiempo inputmode="numeric" placeholder="Tiempo, ej. 10:45" value="${esc(B.carrera)}">`, 'lmC')}
    <div class="tarjeta"><div class="fila"><div><label>Peso (kg)</label><input id="bPeso" inputmode="decimal" value="${esc(B.peso)}"></div><div><label>Talla (cm)</label><input id="bTalla" inputmode="numeric" value="${esc(B.talla)}"></div></div><div id="imc" class="suave" style="margin-top:8px"></div></div>
    <div class="tarjeta resultado" id="evalRes"></div>
    <div class="fila"><div><label>Fecha del control</label><input id="bFecha" type="date" value="${esc(B.fecha)}"></div></div>
    <div class="btns"><button class="btn" id="bLimpiar">Limpiar</button><button class="btn prim" id="bGuardarCtrl">Guardar control</button></div>
    <h3>Mis controles</h3>
    <div class="tarjeta">${ctrl.length ? `<ul class="lista">${ctrl.map(c=>`<li class="item" data-id="${c.id}"><div class="entre"><span class="titulo">${verFecha(c.fecha)}</span>${chip(c.eval)}</div>
      <div class="suave chico">Abd. ${c.lm && c.lm.a ? 'licencia' : c.abd ?? '—'} · ${c.prueba==='barra' ? 'Barras' : 'Flex.'} ${c.lm && c.lm.b ? 'licencia' : c.brazos ?? '—'} · 2.400 m ${c.lm && c.lm.c ? 'licencia' : c.carrera!=null ? PSF.verTiempo(c.carrera) : '—'}</div></li>`).join('')}</ul>`
      : '<div class="vacio">Aún no guardas controles. Vale el mejor control de cada período.</div>'}</div>
    <details class="tarjeta"><summary>Mis metas según la cartilla</summary>${tablaMetas(pp)}</details>
    <details class="tarjeta"><summary>PSF alternativas (personal con limitación médica)</summary>
      <div class="fila"><div><label>Prueba</label><select id="altP">${Object.entries(PSF.ALTERNATIVAS).map(([k, a])=>`<option value="${k}" ${B.alt===k ? 'selected' : ''}>${a.nombre}</option>`).join('')}</select></div>
      <div><label>Tiempo</label><input id="altT" data-tiempo inputmode="numeric" placeholder="min:seg" value="${esc(B.altT)}"></div></div><div id="altRes" style="margin-top:10px"></div></details>
    <p class="nota">Cálculo referencial según la cartilla CDIE-80001 «Pruebas de Suficiencia Física», Ejército de Chile, edición 2017 (texto público).
      Esta app no es oficial: la evaluación válida es la que registra tu unidad.</p>`;
  $('#aPerfil').onclick = e=>{ e.preventDefault(); dialogoCondicionesPSF(); };
  enlazarTilesPSF();
  $('#psfDet').onclick = ()=>detallesWod(sesionPSFHoy()); $('#psfReg').onclick = ()=>registrarWod(sesionPSFHoy());
  const enlazar = (id, k)=>$(id).oninput = ()=>{ B[k] = $(id).value; actualizarPSF(); };
  enlazar('#bAbd', 'abd'); enlazar('#bBrazos', 'brazos'); enlazar('#bCarrera', 'carrera'); enlazar('#bPeso', 'peso'); enlazar('#bTalla', 'talla');
  $('#bFecha').onchange = ()=>B.fecha = $('#bFecha').value;
  $$('[data-lm]').forEach(ch=>ch.onchange = ()=>{ B[ch.dataset.lm] = ch.checked; actualizarPSF(); });
  $('#bLimpiar').onclick = ()=>{ B = Object.assign(B, {carrera:'', abd:'', brazos:'', peso:'', talla:'', lmC:false, lmA:false, lmB:false, fecha:hoyISO()}); vPSF(); };
  $('#bGuardarCtrl').onclick = guardarControl;
  $$('#vista li.item').forEach(li=>li.onclick = ()=>verControl(S.controles.find(c=>c.id===li.dataset.id)));
  const alt = ()=>{ B.alt = $('#altP').value; B.altT = $('#altT').value; const t = PSF.leerTiempo(B.altT);
    if(t==null){ $('#altRes').innerHTML = ''; return; }
    const r = PSF.alternativa(pp, B.alt, t);
    $('#altRes').innerHTML = `<span class="chip ${r.aprobado ? 'MB' : 'NA'}">${r.aprobado ? 'Aprobado' : 'Reprobado'}</span> <span class="suave chico">Máximo ${PSF.verTiempo(r.max)} (tramo ${r.tramo} años)${r.aprobado ? '' : ' · te sobran ' + PSF.verTiempo(r.falta)}</span>`; };
  $('#altP').onchange = alt; $('#altT').oninput = alt; alt();
  actualizarPSF();
}
function tablaMetas(pp){
  const c = PSF.carrera(pp, 0), a = PSF.abdominales(pp, 0), b = PSF.brazos(pp, 0), nb = PSF.BRAZOS[PSF.pruebaBrazos(pp)].nombre;
  return `<ul class="lista"><li><div class="titulo">Carrera 2.400 m</div><div class="suave">Apto MB: ${PSF.verTiempo(c.mb)} o menos · Apto: ${PSF.verTiempo(c.a)} o menos</div></li>
    <li><div class="titulo">Abdominales 1 min</div><div class="suave">Apto MB: ${a.mb} o más · Apto: ${a.a} o más</div></li>
    <li><div class="titulo">${esc(nb)}</div><div class="suave">Apto MB: ${b.mb} o más · Apto: ${b.a} o más</div></li></ul>`;
}
function guardarControl(){
  const r = resultadosPSF();
  if(!r.c && !r.ab && !r.br){ aviso('Anota al menos una prueba'); return; }
  const c = {id:uid(), fecha:B.fecha || hoyISO(), carrera:B.lmC ? null : r.t, abd:B.lmA ? null : r.a, brazos:B.lmB ? null : r.b, prueba:r.prueba,
    peso:num(B.peso), talla:num(B.talla), lm:{c:B.lmC, a:B.lmA, b:B.lmB},
    niveles:{c:r.c && r.c.nivel, a:r.ab && r.ab.nivel, b:r.br && r.br.nivel}, eval:r.ev, edad:r.p.edad, bonif:!!r.p.bonif};
  if(c.carrera!=null) avisarRecord('psf2400', c.carrera, c.id);
  if(c.abd!=null) avisarRecord('abd1', c.abd, c.id);
  if(c.brazos!=null) avisarRecord(c.prueba==='barra' ? 'barras' : 'flex1', c.brazos, c.id);
  S.controles.push(c); guardar();
  if($('#aviso').hidden || !($('#aviso').dataset.t || '').startsWith('🏆')) aviso('Control guardado');
  B = Object.assign(B, {carrera:'', abd:'', brazos:'', peso:'', talla:'', lmC:false, lmA:false, lmB:false}); vPSF();
}
function verControl(c){
  if(!c) return;
  const fila = (t, v, n)=>`<li class="entre"><span>${t}</span><span>${v} ${chip(n)}</span></li>`;
  dialogo(`<div class="suave">${verFecha(c.fecha)} · ${c.edad} años</div><h2>Control PSF</h2>
    <ul class="lista">${fila('Abdominales', c.lm.a ? '' : c.abd ?? '—', c.lm.a ? 'LM' : c.niveles.a)}
    ${fila(c.prueba==='barra' ? 'Barras' : 'Flexiones de brazos', c.lm.b ? '' : c.brazos ?? '—', c.lm.b ? 'LM' : c.niveles.b)}
    ${fila('Carrera 2.400 m', c.lm.c ? '' : c.carrera!=null ? PSF.verTiempo(c.carrera) : '—', c.lm.c ? 'LM' : c.niveles.c)}
    ${c.peso ? `<li class="entre"><span>Peso / talla</span><span>${c.peso} kg${c.talla ? ' · ' + c.talla + ' cm' : ''}</span></li>` : ''}</ul>
    <div class="resultado">${c.eval ? chip(c.eval) : '<span class="suave">Evaluación incompleta</span>'}</div>
    <div class="btns"><button class="btn peligro" id="cBorrar">Borrar</button><button class="btn prim" data-cerrar>Listo</button></div>`, d=>{
    $('#cBorrar', d).onclick = ()=>confirmar('¿Borrar este control?', ()=>{ S.controles = S.controles.filter(x=>x.id!==c.id); guardar(); vPSF(); });
  });
}

/* ---------- Pestaña Progreso ---------- */
let ejSel = null, vistaProg = pref('vistaProg') || 'hub', verTodosMov = {};
/* Encabezado de cada vista de Analizar, con vuelta al panel */
function segProgreso(titulo){
  return `<div class="cab-an"><button class="btn chico-btn" id="segAtras" aria-label="Volver a Analizar">‹</button><h2>${esc(titulo)}</h2></div>`;
}
function enlazarSegProgreso(){ const b = $('#segAtras'); if(b) b.onclick = ()=>{ vistaProg = 'hub'; pref('vistaProg', 'hub'); vProgreso(); window.scrollTo(0, 0); }; }
function vCatalogoMov(){   // catálogo completo con conteo (antes «Movimientos»)
  const uso = usoMovs();
  $('#vista').innerHTML = `${segProgreso('Catálogo de movimientos')}
    <p class="suave chico">Cuántos entrenamientos has hecho con cada movimiento. Toca uno para ver cuándo.</p>
    <div class="grupos-mov">${Object.entries(GRUPOS).map(([g, x])=>{
      const ms = MOVS.filter(m=>m.g===g).sort((a, b)=>(uso[b.id] || 0) - (uso[a.id] || 0) || a.n.localeCompare(b.n, 'es'));
      const usados = ms.filter(m=>uso[m.id]), mostrar = verTodosMov[g] ? ms : usados;
      return `<div class="tarjeta grupo-mov g-${g}"><div class="entre"><span class="titulo">${x.ic} ${esc(x.n)}</span><span class="suave chico">${usados.length} de ${ms.length}</span></div>
        ${mostrar.length ? `<table class="tabla-mov"><tr><th>Movimiento</th><th>Entrenamientos</th></tr>${mostrar.map(m=>`<tr data-mov="${m.id}" class="${uso[m.id] ? '' : 'cero'}"><td>${esc(nomMov(m))}</td><td>${uso[m.id] || 0}</td></tr>`).join('')}</table>` : '<div class="suave chico" style="margin-top:8px">Aún no usas movimientos de este grupo.</div>'}
        <button class="link" data-todos="${g}">${verTodosMov[g] ? 'Ver solo los usados' : 'Ver los ' + ms.length + ' movimientos'}</button></div>`; }).join('')}</div>`;
  enlazarSegProgreso();
  $$('[data-todos]').forEach(b=>b.onclick = ()=>{ verTodosMov[b.dataset.todos] = !verTodosMov[b.dataset.todos]; vCatalogoMov(); });
  $$('[data-mov]').forEach(tr=>tr.onclick = ()=>historialMov(tr.dataset.mov));
}
function historialMov(id){
  const m = movDe(id), ss = S.sesiones.filter(s=>s.w && (s.w.uno ? [s.w.uno] : s.w.secc.in.concat(s.w.secc.main, s.w.secc.out)).some(x=>x.mov===id))
    .sort((a, b)=>a.fecha < b.fecha ? 1 : -1);
  dialogo(`<div class="cab"><h2>${esc(nomMov(m))}</h2><button class="btn chico-btn" data-cerrar>✕</button></div><div class="suave chico">${esc(GRUPOS[m.g].n)}</div>
    ${ss.length ? `<ul class="lista">${ss.map(s=>`<li class="item" data-id="${s.id}"><div class="entre"><span class="titulo">${esc(s.titulo || etiquetaTipo(s))}</span><span class="suave chico">${verFecha(s.fecha)}</span></div><div>${esc(s.txt || '')}</div></li>`).join('')}</ul>`
      : '<div class="vacio">Aún no registras entrenamientos con este movimiento.</div>'}
    <div class="btns"><button class="btn prim" id="hmNuevo">＋ Registrar ${esc(nomMov(m))}</button></div>`, d=>{
    $$('li.item', d).forEach(li=>li.onclick = ()=>verSesion(S.sesiones.find(s=>s.id===li.dataset.id)));
    $('#hmNuevo', d).onclick = ()=>{ abrirRegistro({modo:'uno', destino:'uno', volver:['inicio'], paso:'uno', uno:unoNuevo(m)}); };
  });
}
function vProgreso(){
  if(ejSel) return detalleEj(ejSel);
  if(vistaProg==='hub' || !vistaProg) return vAnalizar();
  if(vistaProg==='mov') return vMovimientos();
  if(VISTAS_AN[vistaProg]) return VISTAS_AN[vistaProg]();
  const lista = todosEj().map(e=>({e, vs:valoresDe(e.id), b:mejorDe(e.id)}));
  const con = lista.filter(x=>x.vs.length), sin = lista.filter(x=>!x.vs.length);
  const fila = x=>`<li class="item" data-id="${esc(x.e.id)}"><div class="entre"><span class="titulo">${esc(x.e.nombre)}</span>
    <span class="${x.b ? 'pr' : 'suave'}">${x.b ? '🏆 ' + esc(fmt(x.e, x.b.valor, x.b.txt)) : x.vs.length ? esc(fmt(x.e, x.vs[x.vs.length-1].valor)) : 'sin marcas'}</span></div>
    ${x.vs.length ? `<div class="suave chico">${x.vs.length} registro${x.vs.length>1 ? 's' : ''}${x.b ? ' · récord del ' + verFecha(x.b.fecha) : ''}</div>` : ''}</li>`;
  $('#vista').innerHTML = `${segProgreso('Récords')}
    <div class="btns" style="margin-top:0;margin-bottom:12px"><button class="btn prim" id="bMarca">＋ Registrar marca</button></div>
    <div class="tarjeta">${con.length ? `<ul class="lista">${con.map(fila).join('')}</ul>` : '<div class="vacio">Tus récords aparecen aquí al registrar entrenamientos, controles PSF o marcas.</div>'}</div>
    <details class="tarjeta"><summary>Otros ejercicios (${sin.length})</summary><ul class="lista">${sin.map(fila).join('')}</ul></details>`;
  enlazarSegProgreso();
  $('#bMarca').onclick = ()=>formMarca();
  $$('#vista li.item').forEach(li=>li.onclick = ()=>{ ejSel = li.dataset.id; vProgreso(); window.scrollTo(0, 0); });
}
function grafico(e, vs){
  if(vs.length < 2) return '<div class="vacio chico">Con dos o más registros aparece el gráfico.</div>';
  const W = 360, H = 200, pi = 44, pd = 8, ps = 12, pb = 24, inv = menorEsMejor(e.u);
  const ts = vs.map(v=>new Date(v.fecha + 'T12:00:00').getTime()), t0 = Math.min(...ts), t1 = Math.max(...ts);
  let refs = [];
  const pp = perfilPSF();
  if(pp.sexo && pp.edad!=null){
    const r = e.id==='psf2400' ? PSF.carrera(pp, 0) : e.id==='abd1' ? PSF.abdominales(pp, 0)
      : e.id==='barras' && PSF.pruebaBrazos(pp)==='barra' ? PSF.brazos(pp, 0) : e.id==='flex1' && PSF.pruebaBrazos(pp)!=='barra' ? PSF.brazos(pp, 0) : null;
    if(r) refs = [{v:r.mb, t:'Apto MB', c:'var(--mb)'}, {v:r.a, t:'Apto', c:'var(--a)'}];
  }
  const todos = vs.map(v=>v.valor).concat(refs.map(r=>r.v));
  let y0 = Math.min(...todos), y1 = Math.max(...todos); const m = (y1 - y0) * 0.12 || Math.max(1, y0 * 0.05); y0 -= m; y1 += m;
  const X = t=>pi + (t1===t0 ? (W-pi-pd)/2 : (t - t0) / (t1 - t0) * (W - pi - pd));
  const Y = v=>{ const f = (v - y0) / (y1 - y0); return ps + (inv ? f : 1 - f) * (H - ps - pb); };
  const et = v=>e.u==='tiempo' ? PSF.verTiempo(v) : e.u==='rondas' ? (Math.round(v*10)/10).toString().replace('.', ',') : Math.round(v*10)/10;
  const marcas = [0, 0.5, 1].map(f=>y0 + f*(y1-y0));
  const pts = vs.map((v, i)=>[X(ts[i]), Y(v.valor)]);
  return `<div class="grafico"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de progreso de ${esc(e.nombre)}">
    ${marcas.map(v=>`<line class="eje" x1="${pi}" x2="${W-pd}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${pi-6}" y="${Y(v)+4}" text-anchor="end">${et(v)}</text>`).join('')}
    ${refs.map(r=>`<line class="ref" x1="${pi}" x2="${W-pd}" y1="${Y(r.v)}" y2="${Y(r.v)}" style="stroke:${r.c}"/><text x="${W-pd}" y="${Y(r.v)-4}" text-anchor="end" style="fill:${r.c}">${r.t}</text>`).join('')}
    <polyline class="linea" points="${pts.map(p=>p.join(',')).join(' ')}"/>
    ${pts.map((p, i)=>`<circle class="punto" cx="${p[0]}" cy="${p[1]}" r="4"><title>${verFecha(vs[i].fecha)}: ${esc(fmt(e, vs[i].valor, vs[i].txt))}</title></circle>`).join('')}
    <text x="${pi}" y="${H-8}">${verFecha(vs[0].fecha)}</text><text x="${W-pd}" y="${H-8}" text-anchor="end">${verFecha(vs[vs.length-1].fecha)}</text>
  </svg>${inv ? '<div class="nota" style="margin-top:4px">Más arriba es mejor (menos tiempo).</div>' : ''}</div>`;
}
function detalleEj(id){
  const e = ejDe(id); if(!e){ ejSel = null; return vProgreso(); }
  const vs = valoresDe(id), b = mejorDe(id), ORIG = {marca:'marca', sesion:'entrenamiento', psf:'control PSF'};
  $('#vista').innerHTML = `<button class="btn" id="bVolver">‹ Volver</button>
    <h2 style="margin-top:12px">${esc(e.nombre)}</h2>
    ${b ? `<div class="tarjeta entre"><div><div class="suave">Récord personal</div><div class="grande pr">🏆 ${esc(fmt(e, b.valor, b.txt))}</div></div><div class="suave">${verFecha(b.fecha)}</div></div>` : ''}
    <div class="tarjeta">${grafico(e, vs)}</div>
    <div class="btns"><button class="btn prim" id="bMarcaEj">＋ Registrar marca</button></div>
    <h3>Registros</h3>
    <div class="tarjeta">${vs.length ? `<ul class="lista">${vs.slice().reverse().map(v=>`<li class="entre ${v.origen==='marca' ? 'item' : ''}" data-ref="${v.ref}" data-o="${v.origen}">
      <span>${verFecha(v.fecha)} <span class="suave chico">· ${ORIG[v.origen]}</span></span><span class="${b && v.ref===b.ref ? 'pr' : ''}">${esc(fmt(e, v.valor, v.txt))}</span></li>`).join('')}</ul>` : '<div class="vacio">Sin registros.</div>'}</div>`;
  $('#bVolver').onclick = ()=>{ ejSel = null; vProgreso(); };
  $('#bMarcaEj').onclick = ()=>formMarca(id);
  $$('#vista li[data-o]').forEach(li=>li.onclick = ()=>{
    if(li.dataset.o==='marca') confirmar('¿Borrar esta marca?', ()=>{ S.marcas = S.marcas.filter(m=>m.id!==li.dataset.ref); guardar(); vProgreso(); });
    else if(li.dataset.o==='sesion') verSesion(S.sesiones.find(s=>s.id===li.dataset.ref));
    else verControl(S.controles.find(c=>c.id===li.dataset.ref));
  });
}
function formMarca(id){
  const ejs = todosEj();
  dialogo(`<h2>Registrar marca</h2>
    <label>Ejercicio</label><select id="mEj">${ejs.map(e=>`<option value="${esc(e.id)}" ${e.id===id ? 'selected' : ''}>${esc(e.nombre)}</option>`).join('')}</select>
    <div class="fila"><div><label>Fecha</label><input id="mFecha" type="date" value="${hoyISO()}"></div><div><label id="mLab">Valor</label><input id="mVal" inputmode="decimal"></div></div>
    <div class="btns"><button class="btn" data-cerrar>Cancelar</button><button class="btn prim" id="mOk">Guardar</button></div>`, d=>{
    const lab = ()=>{ const e = ejDe($('#mEj', d).value);
      $('#mLab', d).textContent = {tiempo:'Tiempo (min:seg)', reps:'Repeticiones', kg:'Peso (kg)', kgc:'Peso (kg)', rondas:'Rondas + reps (ej. 15+3)'}[e.u];
      if(e.u==='tiempo'){ $('#mVal', d).setAttribute('data-tiempo', ''); $('#mVal', d).inputMode = 'numeric'; } else { $('#mVal', d).removeAttribute('data-tiempo'); $('#mVal', d).inputMode = 'decimal'; }
      $('#mVal', d).placeholder = {tiempo:'ej.: 1030 → 10:30', reps:'20', kg:'100', kgc:'75', rondas:'15+3'}[e.u]; };
    $('#mEj', d).onchange = lab; lab();
    $('#mOk', d).onclick = ()=>{
      const e = ejDe($('#mEj', d).value), s = $('#mVal', d).value.trim(); let valor = null, txt;
      if(e.u==='tiempo') valor = PSF.leerTiempo(s);
      else if(e.u==='rondas'){ const m = s.match(/^(\d+)\s*(?:\+\s*(\d+))?$/); if(m){ const re = +(m[2]||0); valor = +m[1] + re/(e.rpr || 100); txt = m[1] + (+m[1]===1 ? ' ronda' : ' rondas') + (re ? ' + ' + re : ''); } }
      else valor = e.u==='reps' ? ent(s) : num(s);
      if(valor==null || valor<0){ aviso('Revisa el valor'); return; }
      avisarRecord(e.id, valor);
      S.marcas.push({id:uid(), ej:e.id, fecha:$('#mFecha', d).value || hoyISO(), valor, txt}); guardar(); d.close();
      if($('#aviso').hidden) aviso('Marca guardada');
      ejSel = e.id; ir('progreso');
    };
  });
}

/* ---------- Pestaña Perfil ---------- */
/* Perfil de entrenamiento: ver perfil.js */
async function exportar(){
  const datos = JSON.parse(JSON.stringify(S)); datos.fotosDatos = {};
  const ids = new Set(S.sesiones.flatMap(x=>x.fotos || []).concat([S.perfil.avatar, S.perfil.banner, S.perfil.emblema].filter(Boolean)));
  for(const id of ids){ const b = await fotoLeer(id).catch(()=>null); if(b) datos.fotosDatos[id] = await new Promise(ok=>{ const r = new FileReader(); r.onload = ()=>ok(r.result); r.readAsDataURL(b); }); }
  const blob = new Blob([JSON.stringify(datos)], {type:'application/json'}), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'tacfit_respaldo_' + hoyISO() + '.json'; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  pref('ultimoRespaldo', String(Date.now()));
}
function importar(f){
  if(!f) return;
  const rd = new FileReader();
  rd.onload = ()=>{ try{ const d = JSON.parse(rd.result); if(!d || !d.v || !Array.isArray(d.sesiones)) throw 0;
      confirmar('¿Reemplazar los datos de este equipo por los del respaldo (' + d.sesiones.length + ' entrenamientos)?', async ()=>{
        const fotos = d.fotosDatos || {}; delete d.fotosDatos;
        S = Object.assign(nuevo(), d, {perfil:Object.assign(nuevo().perfil, d.perfil)}); guardar();
        for(const [id, url] of Object.entries(fotos)){ try{ await fotoGuardar(id, await (await fetch(url)).blob()); }catch(e){} }
        aplicarTema(); ir('hoy'); aviso('Respaldo cargado'); });
      $('#cSi').textContent = 'Sí, reemplazar';
    }catch(e){ aviso('El archivo no es un respaldo de ' + APP); } };
  rd.readAsText(f);
}

/* ---------- Inicio ---------- */
const VISTAS = {unidad:vUnidad, plan:vPlan, hoy:vHoy, diario:vDiario, reloj:vReloj, psf:vPSF, progreso:vProgreso, perfil:vPerfil};
$$('#pestanas button, #bPerfil, #bReloj').forEach(b=>b.onclick = ()=>{ if(b.dataset.v==='progreso' && vistaActual==='progreso'){ ejSel = null; vistaProg = 'hub'; pref('vistaProg', 'hub'); } ir(b.dataset.v); });
aplicarTema();
subtitulo();
if(!Array.isArray(S.insVistas)) revisarInsignias();   // datos anteriores a las recompensas: se ponen al día sin avisos
ir(VISTAS[vistaActual] ? vistaActual : 'hoy');
if(typeof nubeAlAbrir==='function') nubeAlAbrir();
setTimeout(()=>repararMusicas().catch(()=>{}), 1500);   // enlaces de canciones guardados → nombre
if('serviceWorker' in navigator && /^https?:/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(()=>{});
