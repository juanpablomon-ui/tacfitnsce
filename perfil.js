/* #TACFITNSCE — Perfil de entrenamiento: nivel de capacidad física según la «Doctrina de capacidad física para el
   combate de infantería» (documento de trabajo del usuario, app/docs/), batería de evaluación (básica, SDC y
   funcional de combate), medidas ponderoestaturales, PAR-Q+ y limitaciones que ajustan el WOD del día.          */
'use strict';
const DOC_DOCTRINA = '';

/* ---------- Las 7 capacidades esenciales (cap. 4), en el orden de la jerarquía doctrinaria (4.8) ---------- */
const CAPACIDADES = [
  {id:'aer', ref:'4.1', n:'Resistencia aeróbica de base', corto:'Aeróbica',
    def:'Capacidad de sostener esfuerzos de baja a moderada intensidad por períodos prolongados mediante el metabolismo aeróbico (VO₂máx y economía de carrera con carga).',
    por:'Sustenta la marcha con carga durante horas y acelera la recuperación entre esfuerzos. Es la base sobre la que se desarrollan todas las demás.',
    mide:'2.400 m y marcha táctica'},
  {id:'umbral', ref:'4.2', n:'Resistencia de alta intensidad con carga', corto:'Umbral',
    def:'Capacidad de sostener esfuerzos de alta intensidad (80–90 % del VO₂máx) por 20 a 60 minutos portando carga completa de combate.',
    por:'Determina el estado fisiológico con que el soldado llega al contacto después de un desplazamiento rápido con carga.',
    mide:'Desplazamiento rápido 8 km'},
  {id:'fuerza', ref:'4.5', n:'Fuerza funcional y máxima', corto:'Fuerza',
    def:'Capacidad de vencer la mayor resistencia posible y de producir fuerza en patrones multiarticulares del combate: levantar, arrastrar, empujar y traccionar bajo carga real.',
    por:'Sin un mínimo de fuerza el soldado no puede evacuar a un herido ni mover el equipo colectivo. Es el umbral mínimo de operatividad.',
    mide:'1RM de sentadilla y peso muerto (en relación a tu peso) y evacuación de herido'},
  {id:'anaer', ref:'4.3', n:'Capacidad anaeróbica y tolerancia al lactato', corto:'Anaeróbica',
    def:'Capacidad de producir energía por vía glucolítica y tolerar la acumulación de lactato manteniendo alta intensidad entre 15 segundos y 2 minutos.',
    por:'Separa al soldado que sigue combatiendo del que se detiene: desplazamiento bajo fuego, evacuación de heridos y asalto.',
    mide:'Evacuación de herido y SDC'},
  {id:'potencia', ref:'4.4', n:'Potencia y velocidad explosiva', corto:'Potencia',
    def:'Capacidad de generar la máxima potencia en el mínimo tiempo: sprint de 2 a 50 m y arranque bajo carga de combate.',
    por:'Menos tiempo de exposición al fuego en cada salto entre posiciones. La velocidad es un factor de supervivencia.',
    mide:'Sprint táctico 50 m × 5'},
  {id:'rml', ref:'4.6', n:'Resistencia muscular localizada', corto:'R. muscular',
    def:'Capacidad de un grupo muscular de mantener contracciones repetidas o estáticas por períodos prolongados sin perder rendimiento (core, tren inferior y cintura escapular).',
    por:'Es la que más limita en operaciones prolongadas: el soldado se lesiona antes de agotarse aeróbicamente.',
    mide:'Abdominales, barras o flexiones (tablas PSF) y tendidas y levantadas'},
  {id:'comp', ref:'4.7', n:'Composición corporal funcional', corto:'Composición',
    def:'Relación entre masa muscular magra, que genera fuerza y potencia, y masa grasa, que agrega peso a transportar sin aportar rendimiento.',
    por:'Impacta en el costo metabólico de la marcha y en todas las tareas, especialmente la evacuación de heridos.',
    mide:'Índice cintura/estatura y % de grasa'},
];
const NIVELES = ['', 'Bajo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

/* ---------- Batería de evaluación ---------- */
const PRUEBAS = [
  {id:'c2400', g:'basica', n:'Carrera 2.400 m', ej:'psf2400', campos:[['t', 'Tiempo', 'min:seg']]},
  {id:'abd1', g:'basica', n:'Abdominales en 1 minuto', ej:'abd1', campos:[['v', 'Repeticiones', '']]},
  {id:'brazos', g:'basica', n:'Barras o flexiones (según tu prueba PSF)', campos:[['v', 'Repeticiones', '']]},
  {id:'sdc', g:'basica', n:'SDC: sprint, arrastre y carga', ref:120,
    std:'5 × 50 m ida y vuelta (25 m + 25 m): sprint, arrastre de trineo o saco (~40 kg), desplazamiento lateral, carga de dos pesas (~18 kg c/u) y sprint final. Referencia inicial: 2:00, ajustable.',
    campos:[['t', 'Tiempo total', 'min:seg']]},
  {id:'salto', g:'basica', n:'Salto largo sin impulso', campos:[['v', 'Distancia', 'cm']]},
  {id:'flexib', g:'basica', n:'Sentarse y alcanzar', campos:[['v', 'Alcance', 'cm']]},
  {id:'marcha', g:'combate', n:'Marcha táctica', std:'32 km en 8 h con 50 kg (estándar 6.1)', d:32, vel:4, kg:50,
    campos:[['d', 'Distancia', 'km'], ['t', 'Tiempo', 'h:mm:ss'], ['kg', 'Carga', 'kg']]},
  {id:'despl', g:'combate', n:'Desplazamiento rápido', std:'8 km en 60 min con 35–50 kg (estándar 6.2)', d:8, vel:8, kg:35,
    campos:[['d', 'Distancia', 'km'], ['t', 'Tiempo', 'h:mm:ss'], ['kg', 'Carga', 'kg']]},
  {id:'sprint', g:'combate', n:'Sprint táctico 50 m × 5', std:'Cada sprint en ≤ 10 s con equipo táctico, 90 s de pausa (estándar 6.3)',
    campos:[['mejor', 'Mejor sprint', 'seg'], ['ult', 'Último sprint', 'seg']]},
  {id:'tendidas', g:'combate', n:'Tendidas y levantadas', std:'25 repeticiones en 5 min con equipo completo (estándar 6.4)', campos:[['v', 'Repeticiones en 5 min', '']]},
  {id:'evac', g:'combate', n:'Evacuación de herido', std:'50 m en ≤ 60 s con 80 kg y equipo propio (estándar 6.5)', kg:80,
    campos:[['t', 'Tiempo', 'seg o min:seg'], ['kg', 'Peso del herido', 'kg']]},
  {id:'colectivo', g:'combate', n:'Transporte de equipo colectivo', std:'3 km en ≤ 60 min con 65–70 kg (estándar 6.6)', d:3, vel:3, kg:65,
    campos:[['d', 'Distancia', 'km'], ['t', 'Tiempo', 'h:mm:ss'], ['kg', 'Carga total', 'kg']]},
];
const pruebaDe = id=>PRUEBAS.find(p=>p.id===id);
const segs = x=>/^\s*\d+([.,]\d+)?\s*$/.test(String(x ?? '')) ? num(x) : PSF.leerTiempo(x);   // «45» = 45 segundos; «1:05» = 65
const nivelPct = p=>p==null ? null : p >= 1.2 ? 5 : p >= 1.1 ? 4 : p >= 1 ? 3 : p >= 0.9 ? 2 : 1;
const ultimaEval = id=>(S.evals || []).filter(e=>e.prueba===id).sort((a, b)=>a.fecha < b.fecha ? 1 : -1)[0];
/* Evalúa un registro de prueba: % del estándar, nivel 1-5 y si cumple el estándar completo */
function evaluarPrueba(e){
  const P = pruebaDe(e.prueba); if(!P) return null;
  const t = P.vel ? PSF.leerTiempo(e.t) : segs(e.t), d = num(e.d), kg = num(e.kg), v = num(e.v);
  if(P.vel){ if(!t || !d) return null;
    const vel = d / (t/3600), pct = vel / P.vel * Math.pow(Math.min(1, (kg || 0)/P.kg), 0.5) * Math.pow(Math.min(1, d/P.d), 0.25);
    return {pct, nivel:nivelPct(pct), cumple:d >= P.d && kg >= P.kg && vel >= P.vel, txt:fmtNum(d) + ' km · ' + PSF.verTiempo(t) + (kg ? ' · ' + fmtNum(kg) + ' kg' : '')}; }
  if(P.id==='sprint'){ const m = segs(e.mejor), u = segs(e.ult) || m; if(!m) return null;
    return {pct:10/m, nivel:nivelPct(10/m), cumple:u <= 10, txt:'mejor ' + fmtNum(m) + ' s · último ' + fmtNum(u) + ' s · caída ' + Math.round((u-m)/m*100) + ' %'}; }
  if(P.id==='tendidas'){ if(v==null) return null; return {pct:v/25, nivel:nivelPct(v/25), cumple:v >= 25, txt:v + ' en 5 min'}; }
  if(P.id==='evac'){ if(!t) return null; const kg = num(e.kg) ?? 80, pct = 60/t * Math.pow(Math.min(1, (kg || 0)/80), 0.5);
    return {pct, nivel:nivelPct(pct), cumple:t <= 60 && kg >= 80, txt:PSF.verTiempo(t) + (kg ? ' con ' + fmtNum(kg) + ' kg' : '')}; }
  if(P.id==='sdc'){ if(!t) return null; const ref = num(S.perfil.refSdc) || P.ref; return {pct:ref/t, nivel:nivelPct(ref/t), cumple:t <= ref, txt:PSF.verTiempo(t)}; }
  if(v!=null) return {pct:null, nivel:null, cumple:null, txt:fmtNum(v) + (P.campos[0][2] ? ' ' + P.campos[0][2] : '')};
  return null;
}
/* Nivel 1-5 de una prueba PSF a partir de su clasificación */
function nivelPSF(r, valor, esTiempo){
  if(!r) return null;
  if(r.nivel==='NA') return (esTiempo ? r.a/valor : valor/r.a) >= 0.9 ? 2 : 1;
  if(r.nivel==='A') return 3;
  return (esTiempo ? valor <= r.mb*0.9 : valor >= r.mb*1.1) ? 5 : 4;
}
function recienteMejor(ej, dias){
  const desde = iso(new Date(Date.now() - (dias || 180)*86400000)), e = ejDe(ej), vs = valoresDe(ej).filter(v=>v.fecha >= desde);
  if(!vs.length || !e) return null;
  return vs.reduce((b, o)=>(menorEsMejor(e.u) ? o.valor < b.valor : o.valor > b.valor) ? o : b);
}
const ultimaMedida = ()=>(S.medidas || []).slice().sort((a, b)=>a.fecha < b.fecha ? 1 : -1)[0] || {};
function medidaReciente(k){ const m = (S.medidas || []).filter(x=>num(x[k])!=null).sort((a, b)=>a.fecha < b.fecha ? 1 : -1)[0]; return m ? num(m[k]) : null; }

/* ---------- Cálculo del nivel de cada capacidad ---------- */
function fuentesCapacidad(){
  const pp = perfilPSF(), okPSF = pp.sexo && pp.edad!=null, F = {};
  const add = (cap, n, txt)=>{ if(n) (F[cap] = F[cap] || []).push({n, txt}); };
  const ev = id=>{ const e = ultimaEval(id); return e ? Object.assign({fecha:e.fecha}, evaluarPrueba(e)) : null; };
  if(okPSF){
    const c = recienteMejor('psf2400'); if(c){ const r = PSF.carrera(pp, c.valor); add('aer', nivelPSF(r, c.valor, true), '2.400 m en ' + PSF.verTiempo(c.valor) + ' (' + PSF.NOMBRES[r.nivel] + ')'); }
    const a = recienteMejor('abd1'); if(a){ const r = PSF.abdominales(pp, a.valor); add('rml', nivelPSF(r, a.valor), a.valor + ' abdominales (' + PSF.NOMBRES[r.nivel] + ')'); }
    const bj = PSF.pruebaBrazos(pp)==='barra' ? 'barras' : 'flex1', b = recienteMejor(bj);
    if(b){ const r = PSF.brazos(pp, b.valor); add('rml', nivelPSF(r, b.valor), b.valor + (bj==='barras' ? ' barras' : ' flexiones') + ' (' + PSF.NOMBRES[r.nivel] + ')'); }
  }
  const m = ev('marcha'); if(m && m.nivel) add('aer', m.nivel, 'Marcha: ' + m.txt);
  const d = ev('despl'); if(d && d.nivel) add('umbral', d.nivel, 'Desplazamiento: ' + d.txt);
  const peso = medidaReciente('peso');
  if(peso){
    const rel = (ej, cortes, nombre)=>{ const x = recienteMejor(ej, 365); if(!x) return; const k = x.valor / peso;
      add('fuerza', k >= cortes[3] ? 5 : k >= cortes[2] ? 4 : k >= cortes[1] ? 3 : k >= cortes[0] ? 2 : 1, nombre + ' ' + fmtNum(x.valor) + ' kg = ' + fmtNum(k) + ' × tu peso'); };
    rel('sentadilla', [0.75, 1, 1.25, 1.5], 'Sentadilla 1RM'); rel('pesomuerto', [1, 1.25, 1.5, 2], 'Peso muerto 1RM');
  }
  const e = ev('evac'); if(e && e.nivel){ add('fuerza', e.nivel, 'Evacuación: ' + e.txt); add('anaer', e.nivel, 'Evacuación: ' + e.txt); }
  const s = ev('sdc'); if(s && s.nivel) add('anaer', s.nivel, 'SDC: ' + s.txt);
  const sp = ev('sprint'); if(sp && sp.nivel) add('potencia', sp.nivel, 'Sprint 50 m: ' + sp.txt);
  const td = ev('tendidas'); if(td && td.nivel) add('rml', td.nivel, 'Tendidas y levantadas: ' + td.txt);
  const cin = medidaReciente('cintura'), tal = medidaReciente('talla'), gr = medidaReciente('grasa');
  if(cin && tal){ const ict = cin/tal; add('comp', ict >= 0.6 ? 1 : ict >= 0.5 ? 2 : ict < 0.4 ? 3 : 4, 'Cintura/estatura ' + fmtNum(Math.round(ict*100)/100)); }
  if(gr!=null){ const h = S.perfil.sexo!=='M', lim = h ? [12, 18, 25, 30] : [20, 25, 32, 38];
    add('comp', gr <= lim[0] ? 5 : gr <= lim[1] ? 4 : gr <= lim[2] ? 3 : gr <= lim[3] ? 2 : 1, fmtNum(gr) + ' % de grasa'); }
  return F;
}
function nivelesCapacidad(){
  const F = fuentesCapacidad();
  return CAPACIDADES.map(c=>{ const f = F[c.id] || []; const n = f.length ? f.reduce((a, b)=>a + b.n, 0) / f.length : null;
    return Object.assign({}, c, {nivel:n, fuentes:f}); });
}
function aptitudCombate(){
  const ids = PRUEBAS.filter(p=>p.g==='combate').map(p=>p.id);
  const r = ids.map(id=>{ const e = ultimaEval(id); return {id, e, ev:e ? evaluarPrueba(e) : null}; });
  return {total:ids.length, cumple:r.filter(x=>x.ev && x.ev.cumple).length, evaluadas:r.filter(x=>x.ev).length, r};
}
function proximaEvaluacion(){
  const fechas = (S.evals || []).map(e=>e.fecha).concat(S.marcas.filter(m=>m.eval).map(m=>m.fecha)).sort();
  if(!fechas.length) return null;
  const f = new Date(fechas[fechas.length-1] + 'T12:00:00'); f.setDate(f.getDate() + 56);
  return Math.round((f - new Date()) / 86400000);
}

/* ---------- Radar de las 7 capacidades ---------- */
function radarCapacidades(caps){
  const W = 420, H = 270, cx = 210, cy = 140, R = 104, n = caps.length;
  const pt = (i, r)=>{ const a = -Math.PI/2 + i * 2*Math.PI/n; return [cx + r*Math.cos(a), cy + r*Math.sin(a)]; };
  const anillo = k=>caps.map((_, i)=>pt(i, R*k/5).join(',')).join(' ');
  const datos = caps.map((c, i)=>pt(i, R*(c.nivel || 0)/5).join(',')).join(' ');
  return `<svg class="radar" viewBox="0 0 ${W} ${H}" role="img" aria-label="Radar de las 7 capacidades físicas">
    ${[1, 2, 3, 4, 5].map(k=>`<polygon points="${anillo(k)}" class="radar-anillo ${k===3 ? 'tres' : ''}"/>`).join('')}
    ${caps.map((_, i)=>{ const [x, y] = pt(i, R); return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="radar-eje"/>`; }).join('')}
    <polygon points="${datos}" class="radar-datos"/>
    ${caps.map((c, i)=>{ const [x, y] = pt(i, R + 22), anc = Math.abs(x - cx) < 10 ? 'middle' : x > cx ? 'start' : 'end';
      return `<text x="${x}" y="${y + 4}" text-anchor="${anc}" class="${c.nivel ? '' : 'sin'}">${esc(c.corto)}</text>`; }).join('')}
  </svg>`;
}

/* ---------- PAR-Q+ (cuestionario de aptitud para la actividad física, versión 2021, preguntas generales) ---------- */
const PARQ = [
  '¿Alguna vez un médico te ha dicho que tienes una afección cardíaca o presión arterial alta?',
  '¿Sientes dolor en el pecho en reposo, en tus actividades diarias o al hacer actividad física?',
  '¿Has perdido el equilibrio por mareo o has perdido el conocimiento en los últimos 12 meses? (Responde NO si el mareo fue por respiración agitada durante ejercicio intenso.)',
  '¿Te han diagnosticado alguna otra enfermedad crónica, aparte de la cardíaca o la presión alta?',
  '¿Tomas actualmente medicamentos recetados para una enfermedad crónica?',
  '¿Tienes, o tuviste en los últimos 12 meses, un problema de huesos, articulaciones, músculos, ligamentos o tendones que podría empeorar si aumentas tu actividad física? (Responde NO si fue en el pasado y hoy no te limita.)',
  '¿Un médico te ha dicho que solo debes hacer actividad física bajo supervisión médica?',
];
function estadoParq(){
  const q = S.perfil.parq;
  if(!q || !q.fecha) return {k:'pend', txt:'Pendiente', det:'Responde 7 preguntas antes de entrenar intenso.'};
  const vence = new Date(q.fecha + 'T12:00:00'); vence.setFullYear(vence.getFullYear() + 1);
  if(vence < new Date()) return {k:'pend', txt:'Vencido', det:'Han pasado 12 meses: vuelve a responderlo.'};
  if((q.r || []).includes('si')) return {k:'si', txt:'Consulta a un médico', det:'Respondiste SÍ a alguna pregunta: antes de aumentar la intensidad, consulta a un médico o profesional del ejercicio.'};
  return {k:'ok', txt:'Sin restricciones', det:'Puedes aumentar tu actividad física de forma progresiva. Respondido el ' + verFecha(q.fecha) + '.'};
}
function dialogoParq(){
  const r = (S.perfil.parq && S.perfil.parq.r) || [];
  dialogo(`<div class="cab"><h2>PAR-Q+</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <p class="suave chico">Cuestionario internacional de aptitud para la actividad física (PAR-Q+ 2021, preguntas generales). Responde con sinceridad.</p>
    ${PARQ.map((q, i)=>`<div class="parq-q"><div>${i+1}. ${esc(q)}</div><div class="seg3 dos">${['no', 'si'].map(v=>`<button data-q="${i}" data-r="${v}" class="${r[i]===v ? 'activa ' + (v==='si' ? 'n0' : 'n2') : ''}">${v==='si' ? 'Sí' : 'No'}</button>`).join('')}</div></div>`).join('')}
    <div class="btns"><button class="btn" data-cerrar>Cancelar</button><button class="btn prim" id="pqOk">Guardar</button></div>`, d=>{
    const resp = r.slice();
    $$('[data-q]', d).forEach(b=>b.onclick = ()=>{ resp[+b.dataset.q] = b.dataset.r;
      $$(`[data-q="${b.dataset.q}"]`, d).forEach(x=>x.className = x===b ? 'activa ' + (x.dataset.r==='si' ? 'n0' : 'n2') : ''); });
    $('#pqOk', d).onclick = ()=>{ if(resp.filter(Boolean).length < PARQ.length){ aviso('Responde las 7 preguntas'); return; }
      S.perfil.parq = {r:resp, fecha:hoyISO()}; guardar(); d.close(); vPerfil(); aviso(resp.includes('si') ? 'Consulta a un médico antes de entrenar intenso' : 'PAR-Q+ guardado'); };
  });
}

/* ---------- Limitaciones por zona: el WOD del día avisa y sugiere alternativas ---------- */
const ZONAS = {
  hombro: {n:'Hombro', re:/press|jerk|envion|arranque|snatch|thruster|wall_ball|hspu|muscle_up|pino|caminata_manos|fondos|kb_press|turco|man_maker|devil|sent_overhead|slam/, alt:'evita lo que va sobre la cabeza; usa variantes con mancuerna liviana o trabajo de tren inferior'},
  codo: {n:'Codo y muñeca', re:/flexiones|fondos|hspu|barras|muscle_up|remo_anillas|curl|banca|pino|caminata_manos|burpee/, alt:'reduce empujes y tracciones; cambia por trabajo de piernas y core'},
  espalda: {n:'Espalda baja', re:/peso_muerto|pm_|sumo|buenos_dias|remo_barra|sandbag|atlas|traslado|arrastre_herido|kb_swing|ghd|hiperextension|neumatico|cargada|envion|arranque|cluster|yugo|farmer/, alt:'evita cargas desde el suelo; prioriza core isométrico (plancha) y bicicleta'},
  cadera: {n:'Cadera', re:/sentadilla|sent_|zancadas|pistol|hip_thrust|sprint|cajon|trineo|gateo/, alt:'reduce rango y carga; usa remo o bicicleta con resistencia baja'},
  rodilla: {n:'Rodilla', re:/carrera|sprint|trote|shuttle|trail|cajon|salto|burpee|dobles|cuerda|cruzados|triples|zancadas|pistol|tijeras|sentadilla_salto|wall_ball|thruster|sdc|marcha/, alt:'cambia carrera y saltos por bicicleta, remo o natación'},
  tobillo: {n:'Tobillo y pie', re:/carrera|sprint|trote|shuttle|trail|cajon|salto|burpee|dobles|cuerda|cruzados|triples|tijeras|marcha|caminata|sdc|pista/, alt:'cambia impacto por bicicleta, remo o natación'},
  cardio: {n:'Corazón y respiración', re:/./, alt:'mantén intensidad moderada y consulta a tu médico antes de esfuerzos máximos'},
};
const limitesActivos = ()=>(S.perfil.limites || []).filter(l=>l.tipo==='permanente' || !l.hasta || l.hasta >= hoyISO());
function movsPlantilla(t){ return t.uno ? [t.uno.mov] : (t.in || []).concat(t.main || [], t.out || []).map(m=>m.mov).filter(Boolean); }
function alertasLimitacion(t){
  const ids = movsPlantilla(t), out = [];
  limitesActivos().forEach(l=>{ const z = ZONAS[l.zona]; if(!z) return;
    const afect = l.zona==='cardio' ? ids.slice(0, 1) : ids.filter(id=>z.re.test(id));
    if(afect.length) out.push('Ojo con tu ' + z.n.toLowerCase() + ': ' + z.alt + '.'); });
  if(estadoParq().k==='si') out.push('Tu PAR-Q+ indica consultar a un médico antes de esfuerzos intensos.');
  return out;
}
function dialogoLimite(l){
  l = l || {id:uid(), zona:'rodilla', tipo:'temporal', hasta:'', nota:''};
  const nueva = !(S.perfil.limites || []).some(x=>x.id===l.id);
  dialogo(`<div class="cab"><h2>${nueva ? 'Agregar' : 'Editar'} limitación</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <label>Zona</label><select id="lZona">${Object.entries(ZONAS).map(([k, z])=>`<option value="${k}" ${l.zona===k ? 'selected' : ''}>${z.n}</option>`).join('')}</select>
    <div class="fila"><div><label>Tipo</label><select id="lTipo"><option value="temporal" ${l.tipo==='temporal' ? 'selected' : ''}>Temporal</option><option value="permanente" ${l.tipo==='permanente' ? 'selected' : ''}>Permanente</option></select></div>
    <div><label>Hasta (si es temporal)</label><input id="lHasta" type="date" value="${esc(l.hasta)}"></div></div>
    <label>Detalle (diagnóstico, qué te molesta)</label><input id="lNota" value="${esc(l.nota)}" placeholder="Ej.: tendinitis rotuliana, licencia médica">
    <div class="btns">${nueva ? '' : '<button class="btn peligro" id="lBorrar">Quitar</button>'}<button class="btn" data-cerrar>Cancelar</button><button class="btn prim" id="lOk">Guardar</button></div>`, d=>{
    $('#lOk', d).onclick = ()=>{ Object.assign(l, {zona:$('#lZona', d).value, tipo:$('#lTipo', d).value, hasta:$('#lHasta', d).value, nota:$('#lNota', d).value.trim()});
      S.perfil.limites = (S.perfil.limites || []).filter(x=>x.id!==l.id).concat([l]); guardar(); d.close(); vPerfil(); };
    if($('#lBorrar', d)) $('#lBorrar', d).onclick = ()=>{ S.perfil.limites = S.perfil.limites.filter(x=>x.id!==l.id); guardar(); d.close(); vPerfil(); };
  });
}

/* ---------- Medidas ponderoestaturales ---------- */
function clasifICT(ict){ return ict >= 0.6 ? ['NA', 'Riesgo alto: actuar'] : ict >= 0.5 ? ['A', 'Riesgo aumentado: cuidado'] : ['MB', 'Saludable']; }
function dialogoMedida(){
  const u = ultimaMedida();
  dialogo(`<div class="cab"><h2>Nueva medición</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <div class="fila"><div><label>Fecha</label><input id="mdF" type="date" value="${hoyISO()}"></div><div><label>Peso (kg)</label><input id="mdPeso" inputmode="decimal" value="${esc(u.peso || '')}"></div></div>
    <div class="fila"><div><label>Estatura (cm)</label><input id="mdTalla" inputmode="numeric" value="${esc(u.talla || '')}"></div><div><label>Cintura (cm)</label><input id="mdCin" inputmode="decimal" placeholder="a la altura del ombligo"></div></div>
    <div class="fila"><div><label>% de grasa (opcional)</label><input id="mdGr" inputmode="decimal" placeholder="balanza o evaluación"></div><div><label>FC en reposo (opcional)</label><input id="mdFc" inputmode="numeric" placeholder="lat/min al despertar"></div></div>
    <p class="nota">La cintura se mide de pie, al final de una espiración normal, a la altura del ombligo.</p>
    <div class="btns"><button class="btn" data-cerrar>Cancelar</button><button class="btn prim" id="mdOk">Guardar</button></div>`, d=>{
    $('#mdOk', d).onclick = ()=>{
      const m = {id:uid(), fecha:$('#mdF', d).value || hoyISO(), peso:num($('#mdPeso', d).value), talla:num($('#mdTalla', d).value), cintura:num($('#mdCin', d).value), grasa:num($('#mdGr', d).value), fcr:ent($('#mdFc', d).value)};
      if([m.peso, m.talla, m.cintura, m.grasa, m.fcr].every(v=>v==null)){ aviso('Anota al menos una medida'); return; }
      S.medidas = (S.medidas || []).concat([m]); guardar(); d.close(); vPerfil(); aviso('Medición guardada'); };
  });
}

/* ---------- Registrar una prueba de la batería ---------- */
function dialogoPrueba(id){
  const P = pruebaDe(id), pp = perfilPSF(), brazoEj = pp.sexo && PSF.pruebaBrazos(pp)!=='barra' ? 'flex1' : 'barras';
  const ej = P.id==='brazos' ? brazoEj : P.ej, def = {d:P.d || '', kg:P.kg || ''};
  dialogo(`<div class="cab"><h2>${esc(P.n)}</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    ${P.std ? `<p class="suave chico">${esc(P.std)}</p>` : ''}
    <label>Fecha</label><input id="prF" type="date" value="${hoyISO()}">
    <div class="fila">${P.campos.map(([k, lab, u])=>`<div><label>${esc(lab)}${u && !/seg|min/.test(u) ? ' (' + u + ')' : ''}</label><input data-pr="${k}" ${/^(min:seg|h:mm:ss)$/.test(u) ? 'data-tiempo inputmode="numeric"' : 'inputmode="decimal"'} placeholder="${/min|seg|h:/.test(u) ? esc(u) : ''}" value="${esc(def[k] ?? '')}"></div>`).join('')}</div>
    ${P.id==='sdc' ? `<label>Tu tiempo de referencia (estándar de tu unidad)</label><input id="prRef" data-tiempo inputmode="numeric" value="${esc(PSF.verTiempo(num(S.perfil.refSdc) || P.ref))}">` : ''}
    <div class="btns"><button class="btn" data-cerrar>Cancelar</button><button class="btn prim" id="prOk">Guardar</button></div>`, d=>{
    $('#prOk', d).onclick = ()=>{
      const e = {id:uid(), prueba:P.id, fecha:$('#prF', d).value || hoyISO()};
      $$('[data-pr]', d).forEach(i=>e[i.dataset.pr] = i.value.trim());
      if($('#prRef', d)){ const r = PSF.leerTiempo($('#prRef', d).value); if(r) S.perfil.refSdc = r; }
      if(ej){   // las básicas con récord se guardan como marca (suman a Progreso y a la PSF)
        const v = ej==='psf2400' ? PSF.leerTiempo(e.t) : ent(e.v);
        if(v==null){ aviso('Revisa el valor'); return; }
        avisarRecord(ej, v); S.marcas.push({id:uid(), ej, fecha:e.fecha, valor:v, eval:true});
      } else {
        if(!evaluarPrueba(e)){ aviso('Faltan datos'); return; }
        S.evals = (S.evals || []).concat([e]);
      }
      guardar(); d.close(); vPerfil(); if($('#aviso').hidden) aviso('Prueba guardada');
    };
  });
}
function valorBasica(P){
  const pp = perfilPSF(), ej = P.id==='brazos' ? (pp.sexo && PSF.pruebaBrazos(pp)!=='barra' ? 'flex1' : 'barras') : P.ej;
  if(ej){ const x = recienteMejor(ej, 3650); return x ? {txt:fmt(ejDe(ej), x.valor), fecha:x.fecha} : null; }
  const e = ultimaEval(P.id), ev = e && evaluarPrueba(e); return ev ? Object.assign({fecha:e.fecha}, ev) : null;
}

/* ---------- Condiciones PSF (se editan desde la pestaña PSF) ---------- */
function dialogoCondicionesPSF(){
  const p = S.perfil, edad = PSF.edadDe(p.nac);
  dialogo(`<div class="cab"><h2>Mis condiciones PSF</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <div class="fila"><div><label>Sexo</label><select id="cpSexo"><option value="H">Hombre</option><option value="M">Mujer</option></select></div>
    <div><label>Fecha de nacimiento</label><input id="cpNac" type="date" value="${esc(p.nac)}"></div></div>
    <label class="check"><input type="checkbox" id="cpBonif" ${p.bonif ? 'checked' : ''}>Guarnición con bonificación del 10 % en carrera (Calama, IV y V DE)</label>
    <label class="check"><input type="checkbox" id="cpServ" ${p.servicios ? 'checked' : ''}>Oficial de los servicios profesionales (flexiones de brazos en vez de barras)</label>
    <div id="cpBrazosCaja">${p.sexo==='H' && edad > 45 ? `<label>Prueba de brazos (mayores de 45 años)</label><select id="cpBrazos"><option value="barra">Barras</option><option value="suelo">Flexiones de brazos en el suelo</option></select>` : ''}</div>
    <div class="btns"><button class="btn" data-cerrar>Cancelar</button><button class="btn prim" id="cpOk">Guardar</button></div>`, d=>{
    $('#cpSexo', d).value = p.sexo || 'H'; if($('#cpBrazos', d)) $('#cpBrazos', d).value = p.brazos || 'barra';
    $('#cpOk', d).onclick = ()=>{ p.sexo = $('#cpSexo', d).value; p.nac = $('#cpNac', d).value; p.bonif = $('#cpBonif', d).checked; p.servicios = $('#cpServ', d).checked;
      if($('#cpBrazos', d)) p.brazos = $('#cpBrazos', d).value; guardar(); d.close(); vPSF(); };
  });
}

/* ---------- Pestaña Perfil ---------- */
const EXPERIENCIA = [['', '—'], ['ini', 'Menos de 6 meses'], ['bas', '6 meses a 2 años'], ['int', '2 a 5 años'], ['ava', 'Más de 5 años']];
const OBJETIVOS = [['', '—'], ['combate', 'Capacidad física de combate'], ['psf', 'Rendimiento en la PSF'], ['fuerza', 'Fuerza y musculación'], ['resistencia', 'Resistencia y carrera'], ['grasa', 'Bajar grasa corporal'], ['salud', 'Salud y bienestar'], ['hibrido', 'Competencia híbrida']];
function vPerfil(){
  const p = S.perfil, edad = PSF.edadDe(p.nac), caps = nivelesCapacidad(), con = caps.filter(c=>c.nivel!=null);
  const general = con.length ? con.reduce((a, c)=>a + c.nivel, 0) / con.length : null, apt = aptitudCombate(), prox = proximaEvaluacion();
  const md = ultimaMedida(), peso = medidaReciente('peso'), talla = medidaReciente('talla'), cin = medidaReciente('cintura'), gr = medidaReciente('grasa'), fcr = medidaReciente('fcr');
  const imc = PSF.imc(peso, talla), ict = cin && talla ? Math.round(cin/talla*100)/100 : null, pq = estadoParq(), lims = S.perfil.limites || [];
  const fila = (P)=>{ const v = valorBasica(P); return `<li class="item prueba-fila" data-prueba="${P.id}"><div class="entre"><span>${esc(P.n)}</span>
    <span class="num ${v && v.cumple ? 'pr' : ''}">${v ? esc(v.txt) + (v.cumple===true ? ' ✓' : v.cumple===false ? ' ✗' : '') : '<span class="suave">registrar ›</span>'}</span></div>
    ${P.std ? `<div class="suave chico">${esc(P.std)}</div>` : ''}${v && v.fecha ? `<div class="suave chico num">${verFecha(v.fecha)}</div>` : ''}</li>`; };
  const stR = estadisticas(), ER = estadoInsignias(stR), ptR = puntos(stR, ER);
  $('#vista').innerHTML = `${htmlCabeceraPerfil(general)}
    <h3>Recompensas</h3>
    <div class="tarjeta">${htmlRango(ptR)}<button class="link" id="pPuntos">Ver cómo ganas puntos ›</button></div>
    <div class="tarjeta" id="pInsignias"><div class="entre"><span class="etiqueta">Insignias</span><span class="suave chico num">${insigniasGanadas(ER).length} de ${INSIGNIAS.reduce((a, b)=>a + b.t.length, 0)}</span></div>${htmlInsignias(ER)}</div>
    <h3>Perfil de entrenamiento</h3>
    <div class="tarjeta">
      <div class="entre"><span class="etiqueta">Nivel de capacidad física</span>${prox!=null ? `<span class="suave chico num">${prox > 0 ? 'reevaluar en ' + prox + ' días' : 'toca reevaluar'}</span>` : ''}</div>
      <div class="radar-caja">${radarCapacidades(caps)}
        <div class="radar-resumen"><div class="grande num" style="color:var(--acento)">${general ? fmtNum(general) : '—'}</div><div class="titulo">${general ? NIVELES[Math.round(general)] : 'Sin evaluar'}</div>
          <div class="suave chico">${con.length} de 7 capacidades evaluadas</div></div></div>
      <ul class="lista">${caps.map(c=>`<li class="item cap-fila" data-cap="${c.id}"><div class="entre"><span><span class="suave num chico">${c.ref}</span> ${esc(c.n)}</span><span class="num ${c.nivel ? '' : 'suave'}">${c.nivel ? NIVELES[Math.round(c.nivel)] : '—'}</span></div>
        <div class="barra-seg">${[1, 2, 3, 4, 5].map(k=>`<span class="${c.nivel && k <= Math.round(c.nivel) ? 'si' : ''}"></span>`).join('')}</div></li>`).join('')}</ul>
      <p class="nota">Capacidades según la ${DOC_DOCTRINA ? `<a href="${DOC_DOCTRINA}" target="_blank" rel="noopener" style="color:var(--acento)">Doctrina de capacidad física para el combate de infantería</a>` : 'Doctrina de capacidad física para el combate de infantería'}. Toca una para ver su definición y cómo se mide.</p>
    </div>
    <h3>Batería de evaluación</h3>
    <div class="tarjeta"><div class="etiqueta">Pruebas básicas</div><ul class="lista">${PRUEBAS.filter(P=>P.g==='basica').map(fila).join('')}</ul></div>
    <div class="tarjeta"><div class="entre"><span class="etiqueta">Funcional de combate (con equipo real)</span><span class="chip ${apt.cumple===apt.total ? 'MB' : apt.evaluadas ? 'A' : 'gris'} num">${apt.cumple}/${apt.total}</span></div>
      <p class="suave chico">Aprobación conjunta: solo es apto para el combate quien cumple las ${apt.total} pruebas (doctrina, cap. 6).</p>
      <ul class="lista">${PRUEBAS.filter(P=>P.g==='combate').map(fila).join('')}</ul></div>
    <h3>Medidas</h3>
    <div class="tarjeta">
      <div class="tiles acum">${[[peso, 'kg peso'], [talla, 'cm estatura'], [cin, 'cm cintura'], [gr, '% grasa'], [fcr, 'FC reposo']].filter(x=>x[0]!=null).map(([v, k])=>`<div class="tile"><div class="v">${fmtNum(v)}</div><div class="k">${k}</div></div>`).join('') || '<div class="suave">Sin mediciones aún.</div>'}</div>
      ${imc ? `<div class="entre"><span>IMC</span><span class="num">${fmtNum(imc.valor)} · ${imc.categoria}</span></div>` : ''}
      ${ict ? `<div class="entre" style="margin-top:6px"><span>Cintura / estatura</span><span>${chip(clasifICT(ict)[0]).replace(PSF.NOMBRES[clasifICT(ict)[0]], fmtNum(ict) + ' · ' + clasifICT(ict)[1])}</span></div>` : ''}
      <div class="btns"><button class="btn prim" id="pMedida">＋ Nueva medición</button>${(S.medidas || []).length > 1 ? '<button class="btn" id="pMedHist">Ver evolución</button>' : ''}</div>
    </div>
    <h3>Salud y limitaciones</h3>
    <div class="tarjeta">
      <div class="entre"><span class="titulo">PAR-Q+</span><span class="chip ${pq.k==='ok' ? 'MB' : pq.k==='si' ? 'NA' : 'gris'}">${pq.txt}</span></div>
      <div class="suave chico" style="margin:6px 0">${esc(pq.det)}</div>
      <button class="btn ancho" id="pParq">${pq.k==='pend' ? 'Responder cuestionario' : 'Volver a responder'}</button>
      <div class="titulo" style="margin-top:16px">Lesiones y limitaciones</div>
      ${lims.length ? `<ul class="lista">${lims.map(l=>{ const act = l.tipo==='permanente' || !l.hasta || l.hasta >= hoyISO();
        return `<li class="item" data-lim="${l.id}"><div class="entre"><span>${esc(ZONAS[l.zona].n)}${l.nota ? ' · ' + esc(l.nota) : ''}</span><span class="chip ${act ? 'A' : 'gris'}">${l.tipo==='permanente' ? 'Permanente' : act ? (l.hasta ? 'hasta ' + verFecha(l.hasta) : 'Temporal') : 'Terminada'}</span></div></li>`; }).join('')}</ul>`
        : '<div class="suave chico" style="margin:6px 0">Ninguna. Si tienes una lesión, agrégala: el WOD del día te avisará qué evitar.</div>'}
      <button class="btn ancho" id="pLimite">＋ Agregar limitación</button>
    </div>
    <h3>Experiencia y objetivo</h3>
    <div class="tarjeta">
      <div class="fila"><div><label>Tiempo entrenando</label><select id="pExp">${EXPERIENCIA.map(([k, t])=>`<option value="${k}" ${p.exp===k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <div><label>Meta de entrenamientos por semana</label><select id="pMeta">${[2, 3, 4, 5, 6, 7].map(n=>`<option ${String(p.meta || 4)===String(n) ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>
      <label>Objetivo principal</label><select id="pObj">${OBJETIVOS.map(([k, t])=>`<option value="${k}" ${p.objetivo===k ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <label>Líneas del WOD del día</label>
      ${LINEAS.map(l=>`<label class="check"><input type="checkbox" data-linea="${l.id}" ${!p.lineas || p.lineas.includes(l.id) ? 'checked' : ''}>${esc(l.n)} <span class="suave chico" style="margin-left:6px">${esc(l.obj)}</span></label>`).join('')}
    </div>
    <h3>Datos personales</h3>
    <div class="tarjeta">
      <label>Nombre</label><input id="pNombre" value="${esc(p.nombre)}" placeholder="Cómo quieres que te salude">
      <div class="fila"><div><label>Sexo</label><select id="pSexo"><option value="">—</option><option value="H">Hombre</option><option value="M">Mujer</option></select></div>
      <div><label>Fecha de nacimiento${edad!=null ? ' (' + edad + ' años)' : ''}</label><input id="pNac" type="date" value="${esc(p.nac)}"></div></div>
    </div>
    <h3>Apariencia</h3>
    <div class="tarjeta"><label style="margin-top:0">Estilo</label><div class="segmentos" id="pEstilo">${[['deportivo', 'Deportivo'], ['tactico', 'Táctico']].map(([k, t])=>`<button data-e="${k}" class="${(p.estilo || 'deportivo')===k ? 'activa' : ''}">${t}</button>`).join('')}</div>
      <p class="nota">Deportivo: moderno, como las apps de deporte. Táctico: el diseño militar con letra de máquina y verde oliva.</p>
      <label>Nombres de ejercicios</label><div class="segmentos" id="pIdioma">${[['ambos', 'Ambos'], ['en', 'Inglés'], ['es', 'Español']].map(([k, t])=>`<button data-i="${k}" class="${(p.idiomaMov || 'ambos')===k ? 'activa' : ''}">${t}</button>`).join('')}</div>
      <p class="nota">Ej.: ${esc(nomMov(movDe('barras')))} · ${esc(nomMov(movDe('sentadilla_aire')))}. La pestaña PSF sigue con los nombres de la cartilla.</p>
      <label>Unidad de peso</label><div class="segmentos" id="pUPeso">${[['kg', 'Kilos (kg)'], ['lb', 'Libras (lb)']].map(([k, t])=>`<button data-u="${k}" class="${(p.unidadPeso || 'kg')===k ? 'activa' : ''}">${t}</button>`).join('')}</div>
      <p class="nota">Las kettlebell muestran también su peso en pood (1 pood = 16 kg). <button class="btn-link" id="pDiscos">Calculadora de discos ›</button></p>
      <label>Distancias en totales y ritmos</label><div class="segmentos" id="pUDist">${[['km', 'Kilómetros'], ['mi', 'Millas']].map(([k, t])=>`<button data-d="${k}" class="${(p.unidadDist || 'km')===k ? 'activa' : ''}">${t}</button>`).join('')}</div>
      <p class="nota">Con libras, los totales levantados también se muestran en libras.</p>
      <label>Líquidos (agua)</label><div class="segmentos" id="pUAgua">${[['L', 'Litros'], ['oz', 'Onzas (oz)']].map(([k, t])=>`<button data-a="${k}" class="${(p.unidadAgua || 'L')===k ? 'activa' : ''}">${t}</button>`).join('')}</div>
      <p class="nota">Distancias y alturas se eligen al anotar cada ejercicio: metros, km, millas, yardas o pies; centímetros o pulgadas.</p>
      <label>Colores</label><div class="segmentos" id="pTema">${[['oscuro', 'Oscuro'], ['claro', 'Claro'], ['auto', 'Según el equipo']].map(([k, t])=>`<button data-t="${k}" class="${p.tema===k ? 'activa' : ''}">${t}</button>`).join('')}</div></div>
    <h3>Instalar en el teléfono o tablet</h3>
    <div class="tarjeta chico"><p><b>iPhone / iPad:</b> abre la app en Safari → botón Compartir (cuadro con flecha) → «Agregar a pantalla de inicio».</p>
      <p><b>Computador:</b> en Chrome o Edge, toca el ícono de instalar al lado derecho de la barra de direcciones.</p></div>
    ${htmlMusicaPerfil()}
    ${htmlCuentaNube()}
    ${htmlMiUnidad()}
    <h3>Respaldo</h3>
    <div class="tarjeta"><p class="suave chico">Tus datos (incluidas las fotos, medidas y salud) se guardan solo en este equipo. Haz un respaldo de vez en cuando o para pasarlos a otro equipo.</p>
      <div class="btns"><button class="btn" id="pExportar">⬇ Guardar respaldo</button><button class="btn" id="pImportar">⬆ Cargar respaldo</button></div>
      <input type="file" id="pArchivo" accept=".json,application/json" hidden>
      <div class="btns"><button class="btn peligro ancho" id="pBorrar">Borrar todos los datos</button></div></div>
    <p class="nota">${APP} ${VERSION} · App independiente, no oficial.${DOC_DOCTRINA ? ` <a href="${DOC_DOCTRINA}" target="_blank" rel="noopener" style="color:var(--acento)">📖 Doctrina de capacidad física para el combate</a>` : ''}</p>`;
  $('#pSexo').value = p.sexo;
  cargarFotos($('#vista'));
  $('#pcEditar').onclick = dialogoEditarPerfil; $('#pcCompartir').onclick = compartirPerfil;
  $('#pcIns').onclick = ()=>$('#pInsignias').scrollIntoView({behavior:'smooth'});
  $('#pcRango').onclick = $('#pPuntos').onclick = ()=>verPuntos(ptR);
  $$('[data-insig]').forEach(b=>b.onclick = ()=>verInsignia(ER.find(x=>x.id===b.dataset.insig)));
  const cambio = ()=>{ p.nombre = $('#pNombre').value.trim(); p.sexo = $('#pSexo').value; p.nac = $('#pNac').value; p.meta = $('#pMeta').value;
    p.exp = $('#pExp').value; p.objetivo = $('#pObj').value; guardar(); subtitulo(); };
  ['pSexo', 'pNac', 'pMeta', 'pExp', 'pObj'].forEach(id=>$('#' + id).addEventListener('change', ()=>{ cambio(); if(id==='pSexo' || id==='pNac') vPerfil(); }));
  $('#pNombre').oninput = cambio;
  $$('[data-linea]').forEach(ch=>ch.onchange = ()=>{ const sel = $$('[data-linea]').filter(x=>x.checked).map(x=>x.dataset.linea);
    if(!sel.length){ ch.checked = true; aviso('Deja al menos una línea'); return; } p.lineas = sel.length===LINEAS.length ? null : sel; guardar(); });
  $$('[data-cap]').forEach(li=>li.onclick = ()=>verCapacidad(caps.find(c=>c.id===li.dataset.cap)));
  $$('[data-prueba]').forEach(li=>li.onclick = ()=>dialogoPrueba(li.dataset.prueba));
  $$('[data-lim]').forEach(li=>li.onclick = ()=>dialogoLimite((S.perfil.limites || []).find(l=>l.id===li.dataset.lim)));
  $('#pParq').onclick = dialogoParq; $('#pLimite').onclick = ()=>dialogoLimite();
  $('#pMedida').onclick = dialogoMedida;
  if($('#pMedHist')) $('#pMedHist').onclick = historialMedidas;
  $$('#pTema button').forEach(b=>b.onclick = ()=>{ p.tema = b.dataset.t; guardar(); aplicarTema(); vPerfil(); });
  $$('#pEstilo button').forEach(b=>b.onclick = ()=>{ p.estilo = b.dataset.e; guardar(); aplicarTema(); vPerfil(); });
  $$('#pIdioma button').forEach(b=>b.onclick = ()=>{ p.idiomaMov = b.dataset.i; guardar(); vPerfil(); });
  $$('#pUPeso button').forEach(b=>b.onclick = ()=>{ p.unidadPeso = b.dataset.u; guardar(); vPerfil(); });
  $$('#pUDist button').forEach(b=>b.onclick = ()=>{ p.unidadDist = b.dataset.d; guardar(); vPerfil(); });
  $$('#pUAgua button').forEach(b=>b.onclick = ()=>{ p.unidadAgua = b.dataset.a; guardar(); vPerfil(); });
  $('#pDiscos').onclick = ()=>calculadoraDiscos();
  enlazarMusicaPerfil();
  $('#pExportar').onclick = exportar; enlazarMiUnidad(); enlazarCuentaNube();
  $('#pImportar').onclick = ()=>$('#pArchivo').click();
  $('#pArchivo').onchange = e=>importar(e.target.files[0]);
  $('#pBorrar').onclick = ()=>confirmar('¿Borrar todos tus entrenamientos, controles, marcas, medidas y perfil? No se puede deshacer.', ()=>{ S = nuevo(); guardar(); aplicarTema(); ir('hoy'); aviso('Datos borrados'); });
}
function verCapacidad(c){
  dialogo(`<div class="cab"><h2>${esc(c.n)}</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <div class="etiqueta">Capacidad ${c.ref} · ${c.nivel ? 'Nivel ' + NIVELES[Math.round(c.nivel)] : 'Sin evaluar'}</div>
    <h3>Definición</h3><p>${esc(c.def)}</p>
    <h3>Por qué es crítica en combate</h3><p>${esc(c.por)}</p>
    <h3>Cómo se mide aquí</h3><p class="suave">${esc(c.mide)}</p>
    ${c.fuentes.length ? `<ul class="lista">${c.fuentes.map(f=>`<li class="entre"><span>${esc(f.txt)}</span><span class="num">${NIVELES[f.n]}</span></li>`).join('')}</ul>` : '<p class="suave chico">Registra las pruebas de la batería para calcular este nivel.</p>'}
    <p class="nota">Niveles: cumplir el estándar = Bueno; superarlo en 10 % = Muy bueno; en 20 % = Excelente. En pruebas PSF: Apto = Bueno, Apto MB = Muy bueno.</p>
    <div class="btns"><button class="btn prim" data-cerrar>Listo</button></div>`);
}
function historialMedidas(){
  const ms = (S.medidas || []).slice().sort((a, b)=>a.fecha < b.fecha ? -1 : 1), conPeso = ms.filter(m=>m.peso!=null);
  dialogo(`<div class="cab"><h2>Evolución de medidas</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    ${conPeso.length > 1 ? `<div class="etiqueta">Peso</div>${grafico({id:'peso', nombre:'Peso', u:'kgc'}, conPeso.map(m=>({fecha:m.fecha, valor:m.peso})))}` : ''}
    <ul class="lista">${ms.slice().reverse().map(m=>`<li class="item" data-md="${m.id}"><div class="entre"><span class="num">${verFecha(m.fecha)}</span><span class="num suave chico">${[m.peso!=null ? fmtNum(m.peso) + ' kg' : '', m.cintura!=null ? 'cintura ' + fmtNum(m.cintura) : '', m.grasa!=null ? fmtNum(m.grasa) + ' %' : '', m.fcr!=null ? 'FC ' + m.fcr : ''].filter(Boolean).join(' · ')}</span></div></li>`).join('')}</ul>
    <p class="nota">Toca una medición para borrarla.</p>`, d=>{
    $$('[data-md]', d).forEach(li=>li.onclick = ()=>confirmar('¿Borrar esta medición?', ()=>{ S.medidas = S.medidas.filter(m=>m.id!==li.dataset.md); guardar(); vPerfil(); }));
  });
}
