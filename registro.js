/* NEWEN — registro de entrenamientos paso a paso (estilo BTWB):
   Crear (un movimiento / varios movimientos con estilo) o Buscar (populares / anteriores / favoritos),
   armar movimientos con sus atributos, resultado según el estilo, fecha y notas.
   Usa funciones de app.js (S, guardar, dialogo, aviso, avisarRecord, ir…) solo al ejecutarse.           */
'use strict';

/* ---------- Movimientos (catálogo en movimientos.js) ---------- */
const ATTRS = [['reps', 'repeticiones'], ['peso', 'peso'], ['dist', 'distancia'], ['alt', 'altura'], ['tiempo', 'tiempo'], ['cal', 'calorías']];
const ATTR_DEF = {peso:['reps', 'peso'], cuerpo:['reps'], dist:['dist'], tiempo:['tiempo'], cal:['cal']};
const CON_CARGA = new Set(['marcha', 'farmer', 'traslado', 'trineo', 'carrera_tenida', 'caminata']);

/* ---------- Estilos de entrenamiento con varios movimientos ---------- */
const ESTILOS = [
  {id:'rft', n:'Rondas por tiempo', d:'Cierto número de rondas, lo más rápido posible.', ej:'3 rondas: 400 m carrera, 21 swing, 12 barras', p:['rondas'], r:'tiempo'},
  {id:'esquema', n:'Por tiempo con esquema de repeticiones', d:'Cada ronda tiene las mismas repeticiones para todos los movimientos.', ej:'21-15-9 de thruster y barras', p:['esquema'], r:'tiempo'},
  {id:'por_tiempo', n:'Por tiempo', d:'Sin rondas: completar todo el trabajo lo más rápido posible.', ej:'150 wall ball', p:[], r:'tiempo'},
  {id:'cada_ronda', n:'Cada ronda por tiempo', d:'Se toma el tiempo de cada ronda.', ej:'6 × 400 m con descanso de 1:30', p:['rondas'], r:'tiempos'},
  {id:'amrap', n:'AMRAP', d:'Máximo de rondas posibles en un tiempo fijo.', ej:'20 min: 5 barras, 10 flexiones, 15 sentadillas', p:['minutos'], r:'rondas'},
  {id:'amreps', n:'Máximo de repeticiones', d:'Tantas repeticiones como sea posible en un tiempo fijo.', ej:'7 min de burpees', p:['minutos'], r:'reps'},
  {id:'emom', n:'EMOM', d:'Cada minuto (o intervalo) hacer el trabajo y descansar lo que sobre.', ej:'EMOM 10 min: 3 cargadas', p:['cada', 'intervalos'], r:'emom'},
  {id:'emom_alt', n:'EMOM alternado', d:'Cada intervalo se alterna el movimiento.', ej:'Impares: 20 abdominales · Pares: 15 flexiones', p:['cada', 'intervalos'], r:'emom'},
  {id:'intervalos', n:'Intervalos por tiempo', d:'Trabajo y pausa de duración fija, a la intensidad indicada (ej. Noruego 4×4).', ej:'4 × 4 min con 3 min de pausa', p:['rondas', 'trabajo', 'descanso'], r:'porRonda'},
  {id:'tabata', n:'Tabata / intervalos', d:'Trabajo y descanso fijos por cada movimiento (clásico: 8 × 20 s / 10 s).', ej:'Tabata de sentadillas', p:['rondas', 'trabajo', 'descanso'], r:'reps'},
  {id:'fgb', n:'Estilo Fight Gone Bad', d:'Estaciones de 1 minuto contando repeticiones, varias rondas.', ej:'3 rondas: wall ball, sumo, cajón, push press, remo', p:['rondas'], r:'reps'},
  {id:'muerte', n:'Muerte por repeticiones', d:'Minuto 1 = 1 repetición, minuto 2 = 2… hasta no completar el minuto.', ej:'Muerte por burpees', p:[], r:'rondas'},
  {id:'calidad', n:'Por calidad', d:'Series de calidad: se anota el resultado de cada movimiento (kg, repeticiones, tiempo o metros).', ej:'5×5 de sentadilla, técnica de arranque', p:['rondas'], r:'porMov'},
];
const estiloDe = id=>ESTILOS.find(e=>e.id===id);
const PDEF = {rondas:'3', esquema:'21-15-9', minutos:'20', cada:'60', intervalos:'10', trabajo:'20', descanso:'10'};
const PLAB = {rondas:'Rondas', esquema:'Esquema (ej. 21-15-9)', minutos:'Minutos', cada:'Cada (segundos)', intervalos:'Intervalos', trabajo:'Trabajo (s)', descanso:'Descanso (s)'};
const BUY = new Set(['rft', 'esquema', 'por_tiempo', 'amrap', 'amreps']);
function paramsDe(id, extra){ const st = estiloDe(id), p = {}; st.p.forEach(k=>p[k] = PDEF[k]); if(id==='tabata') p.rondas = '8'; if(id==='intervalos') Object.assign(p, {rondas:'4', trabajo:'240', descanso:'180'}); return Object.assign(p, extra || {}); }

/* ---------- Entrenamientos populares ---------- */
const Mv = (id, a)=>Object.assign({mov:id, n:movDe(id).n}, a || {});
const POPULARES = [
  {titulo:'Intervalos 2.400', militar:true, estilo:'cada_ronda', params:{rondas:'6'}, main:[Mv('carrera', {dist:'400', distU:'m'}), {descanso:true, tiempo:'1:30'}], nota:'Cada 400 m al ritmo meta de tu 2.400 m.'},
  {titulo:'Preparación PSF brazos y abdomen', militar:true, estilo:'emom_alt', params:{cada:'60', intervalos:'12'}, main:[Mv('abdominales', {reps:'20'}), Mv('flexiones', {reps:'15'})]},
  {titulo:'Escalera de barras', militar:true, estilo:'muerte', main:[Mv('barras')]},
  {titulo:'Circuito de combate', militar:true, estilo:'rft', params:{rondas:'4'}, main:[Mv('sprint', {dist:'100', distU:'m'}), Mv('arrastre', {dist:'20', distU:'m'}), Mv('traslado', {dist:'50', distU:'m'}), Mv('burpees', {reps:'10'}), Mv('farmer', {dist:'100', distU:'m', peso:'20', pesoU:'kg'})]},
  {titulo:'Marcha 10 km', militar:true, uno:{mov:'marcha', dist:'10', distU:'km', peso:'20'}, nota:'Mochila de 20 kg de referencia.'},
  {titulo:'Carrera 2.400 m', militar:true, uno:{mov:'carrera', dist:'2400', distU:'m'}},
  {titulo:'Fran', estilo:'esquema', params:{esquema:'21-15-9'}, main:[Mv('thruster', {peso:'43', pesoU:'kg'}), Mv('barras')], nota:'Mujeres: thruster 30 kg.'},
  {titulo:'Cindy', estilo:'amrap', params:{minutos:'20'}, main:[Mv('barras', {reps:'5'}), Mv('flexiones', {reps:'10'}), Mv('sentadilla_aire', {reps:'15'})]},
  {cat:'heroes', titulo:'Murph', estilo:'por_tiempo', in:[Mv('carrera', {dist:'1600', distU:'m'})], main:[Mv('barras', {reps:'100'}), Mv('flexiones', {reps:'200'}), Mv('sentadilla_aire', {reps:'300'})], out:[Mv('carrera', {dist:'1600', distU:'m'})], nota:'Con chaleco de 9 kg (mujeres 6 kg). Las 600 repeticiones del medio se pueden repartir en 20 rondas de 5-10-15. En honor al teniente SEAL de la Marina de EE. UU. Michael P. Murphy, caído en Afganistán en 2005 (Medalla de Honor).'},
  {titulo:'Helen', estilo:'rft', params:{rondas:'3'}, main:[Mv('carrera', {dist:'400', distU:'m'}), Mv('kb_swing', {reps:'21', peso:'24', pesoU:'kg'}), Mv('barras', {reps:'12'})], nota:'Mujeres: kettlebell 16 kg.'},
  {titulo:'Grace', estilo:'por_tiempo', main:[Mv('envion', {reps:'30', peso:'61', pesoU:'kg'})], nota:'Mujeres: 43 kg.'},
  {titulo:'Diane', estilo:'esquema', params:{esquema:'21-15-9'}, main:[Mv('peso_muerto', {peso:'102', pesoU:'kg'}), Mv('hspu')], nota:'Mujeres: 70 kg.'},
  {titulo:'Annie', estilo:'esquema', params:{esquema:'50-40-30-20-10'}, main:[Mv('dobles'), Mv('abdominales')]},
  {titulo:'Karen', estilo:'por_tiempo', main:[Mv('wall_ball', {reps:'150', peso:'9', pesoU:'kg'})], nota:'Mujeres: 6 kg.'},
  {titulo:'Chelsea', estilo:'emom', params:{cada:'60', intervalos:'30'}, main:[Mv('barras', {reps:'5'}), Mv('flexiones', {reps:'10'}), Mv('sentadilla_aire', {reps:'15'})]},
  {titulo:'Fight Gone Bad', estilo:'fgb', params:{rondas:'3'}, main:[Mv('wall_ball', {peso:'9', pesoU:'kg'}), Mv('sumo_hp', {peso:'34', pesoU:'kg'}), Mv('cajon', {alt:'50'}), Mv('push_press', {peso:'34', pesoU:'kg'}), Mv('remo')], nota:'El remo se cuenta en calorías. 1 minuto de descanso entre rondas.'},
  {titulo:'Tabata abdominales', estilo:'tabata', params:{rondas:'8', trabajo:'20', descanso:'10'}, main:[Mv('abdominales')]},
  {titulo:'Muerte por burpees', estilo:'muerte', main:[Mv('burpees')]},
];

/* ---------- Utilidades ---------- */
const clon = o=>JSON.parse(JSON.stringify(o));
const sinTildes = s=>String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const coma = v=>String(v).replace('.', ',');
const UNID_DIST = {m:['m', 1, 'metros'], km:['km', 1000, 'km'], mi:['mi', 1609.344, 'millas'], yd:['yd', 0.9144, 'yardas'], ft:['ft', 0.3048, 'pies']};
const fmtD = (d, u)=>{ u = UNID_DIST[u] ? u : 'm'; return ((u==='m' || u==='yd' || u==='ft') && num(d) >= 1000 ? num(d).toLocaleString('es-CL') : coma(d)) + ' ' + UNID_DIST[u][0]; };
const opcionesDist = u=>Object.entries(UNID_DIST).map(([k, v])=>`<option value="${k}" ${(u || 'm')===k ? 'selected' : ''}>${v[2]}</option>`).join('');
const fmtAlt = m=>m.altU==='in' ? m.alt + '″' : m.alt + ' cm';
const metros = (d, u)=>{ const v = num(d); return v==null ? null : Math.round(v * (UNID_DIST[u] || UNID_DIST.m)[1]); };
const fmtMetros = m=>m >= 1000 ? coma(m/1000) + ' km' : m + ' m';
/* ---------- Totales en el sistema elegido: Perfil → Distancias (km o millas); los pesos totales siguen la unidad de peso (t o lb) ---------- */
const KM_MI = 1.609344;
const enMillas = ()=>typeof S!=='undefined' && S.perfil && S.perfil.unidadDist==='mi';
const uDist = ()=>enMillas() ? 'mi' : 'km';
const nKm = km=>Math.round((enMillas() ? km / KM_MI : km) * 10) / 10;
const verKm = km=>nKm(km).toLocaleString('es-CL') + ' ' + uDist();
const uTon = ()=>pesoPref()==='lb' ? 'lb' : 't';
const nTon = kg=>pesoPref()==='lb' ? Math.round(kg * KG_LB) : Math.round(kg / 100) / 10;
const verTon = kg=>nTon(kg).toLocaleString('es-CL') + ' ' + uTon();
const verRitmo = sKm=>PSF.verTiempo(Math.round(enMillas() ? sKm * KM_MI : sKm)) + '/' + uDist();
const verDist = m=>enMillas() ? (m >= 1609 ? nKm(m / 1000).toLocaleString('es-CL') + ' mi' : Math.round(m / 0.9144).toLocaleString('es-CL') + ' yd') : m >= 1000 ? coma(Math.round(m / 100) / 10) + ' km' : m + ' m';
const aKg = (p, u)=>{ const v = num(p); return v==null ? null : u==='lb' ? Math.round(v * 0.45359237 * 10)/10 : u==='pood' ? Math.round(v * 16 * 10)/10 : v; };
/* ---------- Unidades de peso: se muestran en la unidad de Perfil (kg o lb); las kettlebell también en pood (1 pood = 16 kg) ---------- */
const KG_LB = 2.20462262;
const pesoPref = ()=>typeof S!=='undefined' && S.perfil && S.perfil.unidadPeso==='lb' ? 'lb' : 'kg';
const esKB = id=>/^kb_|^turco$/.test(id || '');
function lbDeKg(kg){ const lb = kg * KG_LB, r5 = Math.round(lb / 5) * 5; return Math.abs(lb - r5) <= 1.6 ? r5 : Math.round(lb); }   // 43 kg → 95 lb, como en los box
function kgDeLb(lb){ const kg = lb / KG_LB, r = Math.round(kg * 2) / 2; return Math.abs(kg - r) < 0.3 ? r : Math.round(kg * 10) / 10; }
function verPeso(p, u, mov){
  const v = num(p); if(v==null) return String(p || '');
  u = u || 'kg'; const kg = u==='lb' ? v / KG_LB : u==='pood' ? v * 16 : v, pref = pesoPref();
  const base = u===pref ? coma(v) + ' ' + u : pref==='lb' ? lbDeKg(kg) + ' lb' : coma(u==='lb' ? kgDeLb(v) : Math.round(kg * 10) / 10) + ' kg';
  if(u==='pood') return coma(v) + ' pood · ' + base;
  const pd = kg / 16; return esKB(mov) && Math.abs(pd * 4 - Math.round(pd * 4)) < 0.05 && pd >= 0.25 ? base + ' · ' + coma(Math.round(pd * 4) / 4) + ' pood' : base;
}
function fmtMov(m, st){
  if(m.descanso) return 'Descanso' + (m.tiempo ? ' ' + m.tiempo : '');
  const p = [];
  if(m.reps && !(st && st.id==='esquema')) p.push(m.reps);
  if(m.cal) p.push(m.cal + ' cal');
  if(m.dist) p.push(fmtD(m.dist, m.distU));
  let t = (p.length ? p.join(' ') + ' ' : '') + nomMov(m);
  if(m.peso) t += ' ' + verPeso(m.peso, m.pesoU, m.mov);
  if(m.alt) t += ' (' + fmtAlt(m) + ')';
  if(m.tiempo) t += ' · ' + m.tiempo;
  return t;
}
/* Tarjeta de un movimiento al armar el entrenamiento: nombre con el color de su grupo y cuadros (reps, peso, distancia…) */
function celdasMov(m, st){
  const c = [];
  if(m.reps && !(st && st.id==='esquema')) c.push(['Reps', m.reps]);
  if(m.dist) c.push(['Distancia', fmtD(m.dist, m.distU)]);
  if(m.cal) c.push(['Calorías', m.cal]);
  if(m.peso) c.push(['Peso', verPeso(m.peso, m.pesoU, m.mov)]);
  if(m.alt) c.push(['Altura', fmtAlt(m)]);
  if(m.tiempo) c.push(['Tiempo', m.tiempo]);
  return c;
}
function tarjetaMovArmado(m, st, k, i){
  const mv = !m.descanso && m.mov && movDe(m.mov), g = m.descanso ? 'desc' : mv ? mv.g : 'gim', G = GRUPOS[g] || {ic:'⏸'}, cel = celdasMov(m, st);
  if(!cel.length && !m.descanso && k==='main' && st && ['intervalos', 'tabata', 'emom', 'emom_alt'].includes(st.id)){ const p = Object.assign({}, PDEF, W.params);
    if(st.id==='intervalos'){ cel.push(['Rondas', p.rondas], ['Trabajo', PSF.verTiempo(+p.trabajo)], ['Pausa', PSF.verTiempo(+p.descanso)]); }
    else cel.push(['Durante', st.id==='tabata' ? '20 s × 8' : 'cada minuto']); }
  return `<li class="mv-fila g-${g}"><button class="mtxt mv-card" data-ed="${k}:${i}">
      <span class="mv-cab"><span class="mv-ic">${m.descanso ? '⏸' : G.ic}</span><b>${esc(m.descanso ? 'Descanso' : nomMov(m))}</b></span>
      ${cel.length ? `<span class="mv-celdas">${cel.map(([e, v])=>`<span><small>${e}</small><b class="num">${esc(String(v))}</b></span>`).join('')}</span>` : `<span class="suave chico">Toca para indicar repeticiones, peso o distancia</span>`}
      <span class="sr">${esc(fmtMov(m, st))}</span></button>
    <span class="mv-acc"><button class="btn chico-btn" data-dup="${k}:${i}" aria-label="Copiar" title="Copiar">⧉</button><button class="btn chico-btn" data-up="${k}:${i}" aria-label="Subir" ${i ? '' : 'disabled'}>↑</button><button class="btn chico-btn" data-del="${k}:${i}" aria-label="Quitar">✕</button></span></li>`;
}
function cabecera(st, p){
  return {rft:`${p.rondas} rondas por tiempo:`, esquema:`${p.esquema} repeticiones, por tiempo:`, por_tiempo:'Por tiempo:',
    cada_ronda:`${p.rondas} rondas, cada una por tiempo:`, amrap:`AMRAP ${p.minutos} min:`, amreps:`Máximo de repeticiones en ${p.minutos} min:`,
    emom:`EMOM: ${p.intervalos} intervalos de ${p.cada} s:`, emom_alt:`EMOM alternado: ${p.intervalos} intervalos de ${p.cada} s:`,
    intervalos:`${p.rondas} × ${PSF.verTiempo(+p.trabajo || 0)} de trabajo con ${PSF.verTiempo(+p.descanso || 0)} de pausa:`,
    tabata:`Tabata: ${p.rondas} rondas de ${p.trabajo} s trabajo / ${p.descanso} s descanso, de cada uno:`,
    fgb:`${p.rondas} rondas, 1 min por estación (contar repeticiones):`, muerte:'Muerte por repeticiones (minuto 1 = 1 rep, minuto 2 = 2…):',
    calidad:String(p.rondas)==='1' ? 'Una vuelta, por calidad:' : `${p.rondas} rondas por calidad:`}[st.id];
}
function textoWod(w){
  if(w.uno) return w.uno.n;
  const st = estiloDe(w.estilo), sc = w.secc || {in:w.in || [], main:w.main || [], out:w.out || []}, L = [cabecera(st, Object.assign({}, PDEF, w.params))];
  if(sc.in.length) L.push('Antes: ' + sc.in.map(m=>fmtMov(m, st)).join(', '));
  sc.main.forEach(m=>L.push(fmtMov(m, st)));
  if(sc.out.length) L.push('Después: ' + sc.out.map(m=>fmtMov(m, st)).join(', '));
  return L.join('\n');
}

/* ---------- Métodos de entrenamiento por tipo de movimiento («Un solo movimiento») ---------- */
const METODOS = {
  dist:[['libre', 'Libre', ''], ['cext', 'Continuo extensivo', 'Ritmo suave y parejo (60-75 % de la FC máxima), sin pausas.'], ['cint', 'Continuo intensivo', 'Ritmo cerca del umbral (80-88 % de la FC máxima), parejo, 20-40 min.'],
    ['fartlek', 'Fartlek', 'Continuo variable: cambios de ritmo sin detenerte. Anota en notas cómo fueron los cambios.'],
    ['iext', 'Interválico extensivo', 'Tramos medios o largos con pausa incompleta. Se arman las series para anotar el tiempo de cada tramo.', {rondas:'6', dist:'1000', pausa:'1:30'}],
    ['iint', 'Interválico intensivo', 'Tramos cortos y rápidos con pausa incompleta.', {rondas:'12', dist:'200', pausa:'1:00'}],
    ['rep', 'Repeticiones', 'Tramos a alta intensidad con pausa completa.', {rondas:'5', dist:'800', pausa:'5:00'}],
    ['test', 'Test / prueba', 'Esfuerzo máximo en una distancia o tiempo (2.400 m, Cooper…).']],
  peso:[['libre', 'Libre', ''], ['max', 'Esfuerzos máximos', '1-3 repeticiones al 90-100 % del 1RM, pausa completa.', [[2, .92], [2, .92], [2, .92], [2, .92], [2, .92]]],
    ['rep', 'Repeticiones', '6-12 repeticiones al 65-80 % del 1RM, cerca del fallo.', [[10, .72], [10, .72], [10, .72], [10, .72]]],
    ['din', 'Esfuerzos dinámicos', 'Carga del 50-60 % a máxima velocidad.', [[2, .55], [2, .55], [2, .55], [2, .55], [2, .55], [2, .55], [2, .55], [2, .55]]],
    ['5x5', '5×5', '5 series de 5 con el mismo peso (~80 % del 1RM).', [[5, .8], [5, .8], [5, .8], [5, .8], [5, .8]]],
    ['531', '5/3/1 (semana 1)', 'Sobre el 90 % del 1RM: 65 %, 75 % y 85 % × 5 o más.', [[5, .585], [5, .675], [5, .765]]],
    ['gvt', '10×10', 'Volumen alemán: 10 series de 10 al ~60 % del 1RM.', Array.from({length:10}, ()=>[10, .6])],
    ['pir', 'Pirámide', '5-4-3-2-1 subiendo el peso en cada serie.', [[5, .75], [4, .8], [3, .85], [2, .9], [1, .95]]]],
  cuerpo:[['max', 'Máximo', 'Una serie a máximo esfuerzo (sin tiempo límite).'], ['test1', 'Test 1 minuto', 'Máximo en 1 minuto, como en la PSF.'],
    ['series', 'Series', 'Método de repeticiones: varias series al 70-80 % de tu máximo con pausa completa.', 5],
    ['gtg', 'Grease the groove', 'Series cortas repartidas durante el día al 40-50 % de tu máximo, nunca al fallo.', 8],
    ['pir', 'Pirámide', 'Subir y bajar: 1-2-3-4-5-4-3-2-1.', [1, 2, 3, 4, 5, 4, 3, 2, 1]]],
  tiempo:[['max', 'Máximo', ''], ['series', 'Series', 'Varias series; anota los tiempos en notas.']],
  cal:[['libre', 'Libre', ''], ['interv', 'Intervalos', 'Anota trabajo y pausa en notas.']],
};
const metodoDe = (c, k)=>(METODOS[c] || []).find(m=>m[0]===k);
function rm1De(mov){ const l = typeof levantamientos==='function' ? levantamientos().find(x=>x.mov===mov) : null; return l ? Math.max(l.real, l.est) : null; }
function aplicarMetodo(U, k){
  const M = metodoDe(U.c, k); if(!M) return;
  U.metodo = k;
  if(U.c==='dist' && M[3]){   // fraccionado: se arma como «cada ronda por tiempo» con ese movimiento
    const p = M[3];
    W.modo = 'multi'; W.uno = null; W.estilo = 'cada_ronda'; W.params = paramsDe('cada_ronda', {rondas:p.rondas}); W.usaIn = W.usaOut = false;
    W.secc = {in:[], main:[{mov:U.mov, n:U.n, dist:p.dist, distU:'m'}, {descanso:true, tiempo:p.pausa}], out:[]};
    W.titulo = M[1] + ' · ' + U.n.split(' (')[0]; W.nota = M[2] + ' Ajusta rondas, distancia y pausa a lo que hiciste.'; W.res = {};
    irPaso('multi'); return true;
  }
  if(U.c==='peso' && M[3]){ const rm = rm1De(U.mov); U.series = M[3].map(([r, f])=>({reps:String(r), peso:rm ? String(Math.round(rm*f/2.5)*2.5).replace('.', ',') : ''})); }
  if(U.c==='cuerpo'){ U.lim = k==='test1' ? '60' : k==='max' ? '' : U.lim;
    if(M[3]) U.seriesR = Array.isArray(M[3]) ? M[3].map(String) : Array.from({length:M[3]}, ()=>''); else U.seriesR = null; }
}

/* ---------- Estado del registro ---------- */
let W = null;
function nuevoW(x){
  return Object.assign({paso:'inicio', volver:[], modo:null, estilo:null, titulo:'', params:{}, secc:{in:[], main:[], out:[]}, usaIn:false, usaOut:false,
    res:{}, rx:true, fecha:hoyISO(), rpe:'', notas:'', fav:false, uno:null, nota:''}, x || {});
}
let fotosPend = [];   // fotos nuevas (Blob) del registro en curso; se guardan al tocar Guardar
function abrirRegistro(x){ W = nuevoW(x); W.bid = uid(); fotosPend = []; pintar(); }
/* ---------- Borradores ----------
   El registro en curso se guarda solo (en cada paso y al escribir) en S.borradores, para salir a buscar lo que falta (peso, tiempo, la
   canción…) y retomarlo desde Inicio («📝 Sin terminar»). Al cerrar el registro sin guardar, las fotos nuevas pasan al equipo
   (W.fotosBorr) para no perderlas. Al guardar el entrenamiento, el borrador se borra. Hasta 5 borradores. */
const MAX_BORR = 5;
const conContenido = w=>!!(w && ((w.uno && (w.uno.mov || w.uno.n)) || (w.secc && w.secc.main && w.secc.main.length) || String(w.titulo || '').trim() || String(w.notas || '').trim()));
function guardarBorrador(){
  if(!W || !W.bid || !conContenido(W)) return false;
  const w = clon(W); delete w.tmp; delete w.busq; delete w.buscar; delete w.qInicio;
  S.borradores = [{id:W.bid, t:Date.now(), w}].concat((S.borradores || []).filter(b=>b.id!==W.bid)).slice(0, MAX_BORR); guardar(); return true;
}
let tBorr = null;
const borradorPronto = ()=>{ clearTimeout(tBorr); tBorr = setTimeout(guardarBorrador, 600); };
function quitarBorrador(id, conFotos){
  const b = (S.borradores || []).find(x=>x.id===id); if(!b) return;
  if(conFotos) (b.w.fotosBorr || []).forEach(f=>fotoBorrar(f).catch(()=>{}));
  S.borradores = S.borradores.filter(x=>x.id!==id);
}
async function cerrarConBorrador(){
  if(!W || !conContenido(W)) return;
  for(const bl of fotosPend){ const id = 'f' + uid(); try{ await fotoGuardar(id, bl); (W.fotosExist = W.fotosExist || []).push(id); (W.fotosBorr = W.fotosBorr || []).push(id); }catch(e){} }
  fotosPend = [];
  if(guardarBorrador()){ aviso('📝 Quedó como borrador: lo terminas desde Inicio'); if(vistaActual==='hoy') vHoy(); }
}
function continuarBorrador(id){ const b = (S.borradores || []).find(x=>x.id===id); if(!b) return; W = clon(b.w); W.bid = b.id; fotosPend = []; pintar(); }
function nombreBorrador(w){ return String(w.titulo || '').trim() || (w.uno && w.uno.n) || ((w.secc && w.secc.main || []).map(m=>m.n).filter(Boolean).slice(0, 2).join(' + ')) || 'Entrenamiento'; }
function htmlBorradores(){
  const bs = S.borradores || []; if(!bs.length) return '';
  const cuando = t=>{ const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'recién' : m < 60 ? 'hace ' + m + ' min' : m < 1440 ? 'hace ' + Math.round(m / 60) + ' h' : verFecha(new Date(t).toISOString().slice(0, 10)); };
  return `<div class="tarjeta borradores"><div class="entre"><h3>📝 Sin terminar</h3><span class="suave chico">${bs.length === 1 ? '1 borrador' : bs.length + ' borradores'}</span></div>
    ${bs.map(b=>`<div class="borr-item"><div><b>${esc(nombreBorrador(b.w))}</b><small class="suave">${b.w.id ? 'Editando · ' : ''}${verFecha(b.w.fecha)} · guardado ${cuando(b.t)}</small></div>
      <div class="ph-btns"><button class="btn prim" data-bcont="${b.id}">Continuar</button><button class="btn" data-bdesc="${b.id}">Descartar</button></div></div>`).join('')}</div>`;
}
function enlazarBorradores(){
  $$('[data-bcont]').forEach(b=>b.onclick = ()=>continuarBorrador(b.dataset.bcont));
  $$('[data-bdesc]').forEach(b=>b.onclick = ()=>confirmar('¿Descartar este registro sin terminar?', ()=>{ quitarBorrador(b.dataset.bdesc, true); guardar(); vHoy(); }, 'Descartar'));
}
document.addEventListener('visibilitychange', ()=>{ const d = $('#dialogo'); if(document.visibilityState==='hidden' && d && d.open && d.dataset.reg) guardarBorrador(); });
function irPaso(p){ W.volver.push(W.paso); W.paso = p; pintar(); }
function atras(){ W.paso = W.volver.pop() || 'inicio'; pintar(); }
function volverA(p){ let x; while(W.volver.length && (x = W.volver.pop())!==p); W.paso = p; pintar(); }
function unoNuevo(m, extra){
  return Object.assign({mov:m.id || null, n:m.n, c:m.c || 'peso', series:[{reps:'', peso:''}], pesoU:'kg', dist:'', distU:'m', tiempo:'', peso:'', reps:'', lim:'', cal:''}, extra || {});
}
function plantillaDe(w){
  if(w.uno) return {titulo:w.titulo, uno:{mov:w.uno.mov, n:w.uno.n, c:w.uno.c, dist:w.uno.tramos ? '' : w.uno.dist, distU:w.uno.distU, peso:w.uno.peso, lim:w.uno.lim, pesoU:w.uno.pesoU,
    tramos:w.uno.tramos ? clon(w.uno.tramos).map(t=>{ delete t.real; delete t.reales; (t.tramos || []).forEach(x=>delete x.real); return t; }) : undefined}};
  return {titulo:w.titulo, estilo:w.estilo, params:clon(w.params), in:clon(w.secc.in), main:clon(w.secc.main), out:clon(w.secc.out), nota:w.nota};
}
function cargarPlantilla(t, sinApilar){
  const sig = p=>{ if(sinApilar){ W.paso = p; pintar(); } else irPaso(p); };
  W.titulo = t.titulo || ''; W.nota = t.nota || ''; W.res = {}; delete W.base; delete W.nivel;
  if(t.uno){ const m = movDe(t.uno.mov) || {n:t.uno.n, c:t.uno.c}; W.modo = 'uno'; W.uno = unoNuevo(m, {dist:t.uno.dist || '', distU:t.uno.distU || 'm', peso:t.uno.peso || '', lim:t.uno.lim || '', pesoU:t.uno.pesoU || 'kg', tramos:t.uno.tramos ? clon(t.uno.tramos) : null}); 
    if(t.linea && typeof escalarWod==='function' && !W.soloPlan){ W.base = clon(t); aplicarNivel(esPlus() ? nivelSugerido(t.titulo).nivel : 'rx'); }   // WOD del día de un movimiento (Táctico, Runners): 3 versiones
    sig('uno'); return; }
  W.modo = 'multi'; W.estilo = t.estilo; W.params = paramsDe(t.estilo, t.params);
  W.secc = {in:clon(t.in || []), main:clon(t.main || []), out:clon(t.out || [])}; W.usaIn = !!W.secc.in.length; W.usaOut = !!W.secc.out.length;
  // WOD de la biblioteca: 3 versiones (escalar.js); parte en la versión sugerida
  // (solo si es el de la biblioteca o una de sus versiones: un WOD modificado por el usuario se respeta tal cual)
  const base = t.titulo && (POPULARES.find(p=>p.titulo===t.titulo && !p.uno && p.main && typeof mismoWod==='function' && mismoWod(t, p)) || (t.linea && t.main ? t : null));   // de la biblioteca o del WOD del día de una línea
  if(base && typeof escalarWod==='function' && !W.soloPlan){ W.base = clon(base); aplicarNivel(esPlus() ? nivelSugerido(base.titulo).nivel : 'rx'); W.usaIn = !!W.secc.in.length; W.usaOut = !!W.secc.out.length; }
  sig('multi');
}

/* ---------- Dibujo ---------- */
function tiempoMal(d){ const m = $$('[data-tiempo]', d).find(i=>!tiempoValido(i.value)); if(m){ m.focus(); aviso('Revisa el tiempo marcado en rojo: segundos y minutos van de 00 a 59'); return true; } return false; }
function cab(titulo, conAtras){
  return `<div class="cab">${conAtras ? '<button class="btn chico-btn" data-atras>‹</button>' : ''}<h2>${esc(titulo)}</h2><button class="btn chico-btn" data-cerrar aria-label="Cerrar">✕</button></div>`;
}
function pintar(){
  const [html, on] = PASOS[W.paso]();
  const d = dialogo(html, d=>{ $$('[data-atras]', d).forEach(b=>b.onclick = atras); if(on) on(d); });
  d.classList.add('hoja'); d.scrollTop = 0; d.dataset.reg = '1';
  if(!d.__borr){ d.__borr = true;   // una sola vez: guarda al escribir y deja borrador al cerrar sin guardar
    d.addEventListener('input', ()=>{ if(d.dataset.reg) borradorPronto(); });
    d.addEventListener('change', ()=>{ if(d.dataset.reg) borradorPronto(); });
    d.addEventListener('close', ()=>{ if(d.dataset.reg){ delete d.dataset.reg; clearTimeout(tBorr); cerrarConBorrador(); } }); }
  guardarBorrador();
}
const PASOS = {
  inicio(){
    // Registrar más rápido (22-oct-2026): lo de hoy y lo último arriba, un solo buscador «¿Qué hiciste?» y crear desde cero al final
    const ants = anteriores(), nAnt = ants.length, ult = ants[0];
    const wh0 = wodDeHoy(), wh = wh0 && !S.sesiones.some(x=>x.fecha===hoyISO() && x.titulo===wh0.t.titulo) ? wh0 : null;   // si ya lo registró hoy, no se ofrece
    // favoritos sin repetir y con nombre (los «Sin nombre» toman el de sus ejercicios)
    const vistos = new Set(), favs = S.favoritos.slice().reverse().filter(f=>{ const k = JSON.stringify(f.w); if(vistos.has(k)) return false; vistos.add(k); return true; }).slice(0, 6);
    const nomFav = w=>String(w.titulo || '').trim() || (w.uno && w.uno.n) || (w.main || []).map(m=>m.n).filter(Boolean).slice(0, 2).join(' + ') || 'Entrenamiento';
    const rap = (wh ? `<button class="opcion op-rap op-hoy" data-rap="wod"><small>${wh.plan ? 'Hoy en Mi plan' : 'Sugerido para hoy · WOD del día · ' + esc(wh.l.n)}</small><b>${esc(wh.t.titulo)}</b><span>${esc(estiloPlantilla(wh.t))}${typeof metaWod==='function' && metaWod(wh.t) ? ' · ' + textoMeta(metaWod(wh.t)) : ''}</span></button>` : '')
      + (ult ? `<button class="opcion op-rap" data-rap="ult"><small>Repetir el último</small><b>${esc(ult.titulo || etiquetaTipo(ult))}</b><span>${esc(verFecha(ult.fecha) + (ult.txt ? ' · ' + resCorto(ult) : ''))}</span></button>` : '');
    return [`${cab(W.soloPlan ? 'Planificar · ' + verFecha(W.fecha) : 'Registrar entrenamiento')}
      ${rap ? `<div class="reg-rapido">${rap}</div>` : ''}
      ${favs.length ? `<h3>★ Favoritos</h3><div class="chips reg-favs">${favs.map(f=>`<button data-fav="${f.id}">${esc(nomFav(f.w))}</button>`).join('')}</div>` : ''}
      <h3>¿Qué hiciste?</h3>
      <input id="rBus" type="search" placeholder="Ej.: Fran, sentadilla, carrera, noruego…" autocomplete="off" value="${esc(W.qInicio || '')}">
      <div id="rRes"></div>
      <h3>O créalo desde cero</h3>
      <div class="opciones dos">
        <button class="opcion" data-ir="uno"><b>Un ejercicio</b><span>Pesas, carrera, barras, natación…</span></button>
        <button class="opcion" data-ir="multi"><b>Varios ejercicios (WOD)</b><span>Por tiempo, AMRAP, EMOM, Tabata…</span></button>
      </div>
      <div class="chips reg-listas"><button data-b="populares">📖 Biblioteca ›</button><button data-b="anteriores">Anteriores (${nAnt}) ›</button><button data-b="favoritos">★ Favoritos (${S.favoritos.length}) ›</button></div>
      ${W.soloPlan ? '' : `<button class="opcion op-importar" id="rImportar"><b>⌚ Importar de Garmin o Strava</b><span>Trae las carreras, bicicleta o nado que grabó tu reloj (archivo .FIT, .GPX o .TCX)</span></button>`}`, d=>{
      if($('#rImportar', d)) $('#rImportar', d).onclick = ()=>{ delete d.dataset.reg; clearTimeout(tBorr); dialogoImportar(); };
      $$('[data-ir]', d).forEach(b=>b.onclick = ()=>{ if(b.dataset.ir==='uno'){ W.modo = 'uno'; W.destino = 'uno'; W.busq = ''; irPaso('mov'); } else { W.modo = 'multi'; irPaso('estilos'); } });
      $$('[data-b]', d).forEach(b=>b.onclick = ()=>{ W.buscar = b.dataset.b; irPaso('buscar'); });
      $$('[data-rap]', d).forEach(b=>b.onclick = ()=>cargarPlantilla(b.dataset.rap==='wod' ? wh.t : plantillaDe(ult.w)));
      $$('[data-fav]', d).forEach(b=>b.onclick = ()=>cargarPlantilla(S.favoritos.find(f=>f.id===b.dataset.fav).w));
      const res = ()=>{ const q = sinTildes(W.qInicio || '').trim(), out = $('#rRes', d); if(q.length < 2){ out.innerHTML = ''; return; }
        const pops = POPULARES.map((p, i)=>[p, i]).filter(([p])=>sinTildes(p.titulo).includes(q) || sinTildes(p.cat || '').includes(q)).slice(0, 6);
        const ans = ants.map((x, i)=>[x, i]).filter(([x])=>sinTildes(x.titulo || '').includes(q) && !pops.some(([p])=>p.titulo===x.titulo)).slice(0, 3);
        const movs = MOVS.filter(m=>coincideMov(m, W.qInicio)).slice(0, 5);
        out.innerHTML = pops.length || ans.length || movs.length ? `<ul class="r-lista">${ans.map(([x, i])=>tarjetaResultado('a', i, x.titulo, 'Ya lo hiciste', grupoDe(x), verFecha(x.fecha) + (x.txt ? ' · ' + resCorto(x) : ''), null)).join('')}${pops.map(([p, i])=>tarjetaResultado('p', i, p.titulo, p.uno ? 'Un ejercicio' : estiloDe(p.estilo).n, grupoPlantilla(p), resumenPlantilla(p), mejorWod(p.titulo), p)).join('')}${movs.map(m=>tarjetaResultado('m', m.id, nomMov(m), 'Ejercicio · ' + (GRUPOS[m.g] || {}).corto, m.g, '', mejorMov(m.id))).join('')}</ul>`
          : `<div class="vacio chico">No encontré «${esc(W.qInicio)}». Créalo desde cero aquí abajo.</div>`;
        $$('[data-rk]', out).forEach(x=>x.onclick = ()=>{ const k = x.dataset.rk, v = x.dataset.rv;
          if(k==='p') return cargarPlantilla(POPULARES[+v]);
          if(k==='a') return cargarPlantilla(plantillaDe(ants[+v].w));
          W.modo = 'uno'; W.destino = 'uno'; W.uno = unoNuevo(movDe(v)); W.titulo = ''; irPaso('uno'); }); };
      $('#rBus', d).oninput = e=>{ W.qInicio = e.target.value; res(); };
      res();
    }];
  },
  estilos(){
    return [`${cab('¿De qué estilo es tu entrenamiento?', true)}
      <ul class="lista">${ESTILOS.map(e=>`<li class="item" data-e="${e.id}"><div class="titulo acento">${esc(e.n)}</div><div>${esc(e.d)}</div><div class="suave chico">Ej.: ${esc(e.ej)}</div></li>`).join('')}</ul>`, d=>{
      $$('[data-e]', d).forEach(li=>li.onclick = ()=>{ if(W.estilo!==li.dataset.e){ W.estilo = li.dataset.e; W.params = paramsDe(W.estilo); W.res = {}; } irPaso('multi'); });
    }];
  },
  multi(){
    const st = estiloDe(W.estilo), nombres = [...new Set(POPULARES.map(p=>p.titulo).concat(S.sesiones.map(s=>s.titulo).filter(Boolean)))];
    const seccion = (k, titulo)=>`<div class="seccion"><div class="suave chico">${titulo}</div>
      <ul class="movs">${W.secc[k].map((m, i)=>tarjetaMovArmado(m, st, k, i)).join('')
        || `<li class="suave chico">Usa «Agregar movimiento» para armar ${k==='main' ? 'el entrenamiento' : 'esta parte'}.</li>`}</ul>
      <div class="acciones"><button class="link" data-add="${k}">＋ Agregar movimiento</button><button class="link" data-rest="${k}">＋ Agregar descanso</button></div></div>`;
    return [`${cab(st.n, true)}
      ${W.nota ? `<p class="suave chico">${esc(W.nota)}</p>` : ''}
      ${typeof htmlVersionWod==='function' ? htmlVersionWod() : ''}
      <label>Nombre (opcional, para comparar tus resultados)</label><input id="wTit" list="wNombres" value="${esc(W.titulo)}" placeholder="Ej.: Fran, Circuito del martes">
      <datalist id="wNombres">${nombres.map(n=>`<option value="${esc(n)}">`).join('')}</datalist>
      ${st.p.length ? `<div class="fila">${st.p.map(k=>`<div><label>${PLAB[k]}</label><input data-p="${k}" ${k==='esquema' ? '' : 'type="number" inputmode="numeric" min="1"'} value="${esc(W.params[k])}"></div>`).join('')}</div>` : ''}
      <div class="suave chico" style="margin-top:12px" id="wCabTxt">${esc(cabecera(st, Object.assign({}, PDEF, W.params)))}</div>
      ${W.usaIn ? seccion('in', BUY.has(st.id) ? 'Antes (buy-in, dentro del tiempo)' : 'Calentamiento (antes)') : ''}
      ${seccion('main', st.id==='emom_alt' ? 'Movimientos (uno distinto en cada intervalo)' : 'Movimientos')}
      ${W.usaOut ? seccion('out', BUY.has(st.id) ? 'Después (buy-out, dentro del tiempo)' : 'Vuelta a la calma (después)') : ''}
      ${!W.usaIn || !W.usaOut ? `<div class="acciones">${!W.usaIn ? `<button class="link" id="wIn">＋ ${BUY.has(st.id) ? 'Trabajo antes (buy-in)' : 'Calentamiento'}</button>` : ''}${!W.usaOut ? `<button class="link" id="wOut">＋ ${BUY.has(st.id) ? 'Trabajo después (buy-out)' : 'Vuelta a la calma'}</button>` : ''}</div>` : ''}
      <h3>Resultado</h3><div id="wRes">${resultadoHTML(st)}</div>${cargasHTML(st)}
      ${!W.base && !['ninguno', 'porMov', 'porRonda'].includes(st.r) && !(st.r==='tiempos' && medidaCadaRonda(W)!=='t') ? `<label class="check"><input type="checkbox" id="wRx" ${W.rx ? 'checked' : ''}>Rx (como está indicado, sin escalar)</label>` : ''}
      <div class="btns"><button class="btn" data-atras>‹ Atrás</button><button class="btn prim" id="wSig">Siguiente: fecha y notas</button></div>`, d=>{
      $('#wTit', d).oninput = e=>W.titulo = e.target.value;
      $('#wTit', d).onchange = e=>{ const p = POPULARES.find(p=>p.titulo===e.target.value && !p.uno);
        if(p && !W.secc.main.length) cargarPlantilla(p, true); };
      // sin redibujar todo (se perdería el toque en otro campo): solo el texto y los campos de resultado
      $$('[data-p]', d).forEach(i=>i.oninput = ()=>{ W.params[i.dataset.p] = i.value; $('#wCabTxt', d).textContent = cabecera(st, Object.assign({}, PDEF, W.params));
        if(st.r==='tiempos' || st.r==='porRonda'){ $('#wRes', d).innerHTML = resultadoHTML(st); enlazarResultado(d); } });
      enlazarResultado(d);
      if($('#wRx', d)) $('#wRx', d).onchange = e=>W.rx = e.target.checked;
      $$('#wNivel [data-niv]', d).forEach(b=>b.onclick = ()=>{ if(b.dataset.niv!=='rx' && !esPlus()) return pantallaPlus('wod', ()=>{ aplicarNivel(b.dataset.niv); pintar(); }); aplicarNivel(b.dataset.niv); pintar(); });
      $$('[data-add]', d).forEach(b=>b.onclick = ()=>{ W.destino = b.dataset.add; W.editar = null; W.busq = ''; irPaso('mov'); });
      $$('[data-rest]', d).forEach(b=>b.onclick = ()=>{ W.destino = b.dataset.rest; W.editar = null; W.tmp = {descanso:true, tiempo:'1:00'}; irPaso('attr'); });
      $$('[data-ed]', d).forEach(b=>b.onclick = ()=>{ const [k, i] = b.dataset.ed.split(':'); W.destino = k; W.editar = +i; W.tmp = clon(W.secc[k][+i]); irPaso('attr'); });
      $$('[data-dup]', d).forEach(b=>b.onclick = ()=>{ const [k, i] = b.dataset.dup.split(':'); W.secc[k].splice(+i + 1, 0, clon(W.secc[k][+i])); pintar(); aviso('Movimiento copiado'); });
      $$('[data-del]', d).forEach(b=>b.onclick = ()=>{ const [k, i] = b.dataset.del.split(':'); W.secc[k].splice(+i, 1); pintar(); });
      $$('[data-up]', d).forEach(b=>b.onclick = ()=>{ const [k, i] = b.dataset.up.split(':'), a = W.secc[k]; [a[+i-1], a[+i]] = [a[+i], a[+i-1]]; pintar(); });
      if($('#wIn', d)) $('#wIn', d).onclick = ()=>{ W.usaIn = true; pintar(); };
      if($('#wOut', d)) $('#wOut', d).onclick = ()=>{ W.usaOut = true; pintar(); };
      $('#wSig', d).onclick = ()=>{ if(!W.secc.main.some(m=>!m.descanso)){ aviso('Agrega al menos un movimiento'); return; } if(tiempoMal(d)) return; irPaso('notas'); };
    }];
  },
  mov(){
    return [`${cab(W.destino==='uno' ? 'Elige el movimiento' : 'Agregar movimiento', true)}
      <input id="mBus" type="search" placeholder="Buscar (ej.: barras, clean, remo)…" value="${esc(W.busq || '')}" autocomplete="off">
      <div class="chips" id="mGrupos"><button data-g="" class="${!W.grupo ? 'activa' : ''}">Todos</button>${Object.entries(GRUPOS).map(([g, x])=>`<button data-g="${g}" class="g-${g} ${W.grupo===g ? 'activa' : ''}">${x.ic} ${x.corto}</button>`).join('')}</div>
      <div id="mLista"></div>`, d=>{
      const uso = usoMovs();
      const lista = ()=>{
        const q = sinTildes(W.busq), coincide = m=>coincideMov(m, W.busq || '') && (!W.grupo || m.g===W.grupo);
        const rec = q || W.grupo ? [] : recientes();
        const grupos = Object.entries(GRUPOS).map(([g, x])=>[x.n, g, MOVS.filter(m=>m.g===g && coincide(m))]).filter(x=>x[2].length);
        const li = m=>`<li class="item mov-item" data-m="${m.id}"><span class="marca-g g-${m.g}"></span><span class="mov-n">${esc(nomMov(m))}</span>${uso[m.id] ? `<span class="cuenta">${uso[m.id]}×</span>` : ''}</li>`;
        $('#mLista', d).innerHTML = (rec.length ? `<h3>Usados hace poco</h3><ul class="lista">${rec.map(li).join('')}</ul>` : '')
          + grupos.map(([t, g, ms])=>`<h3 class="t-${g}">${t} <span class="suave">· ${ms.length}</span></h3><ul class="lista">${ms.map(li).join('')}</ul>`).join('')
          + (!grupos.length ? '<div class="vacio">No encontré ese movimiento.</div>' : '')
          + (q && !MOVS.some(m=>coincideMov(m, W.busq)) ? `<button class="btn ancho" id="mNuevo" style="margin-top:12px">＋ Crear movimiento «${esc(W.busq)}»</button>` : '');
        $$('[data-m]', d).forEach(x=>x.onclick = ()=>elegir(movDe(x.dataset.m)));
        if($('#mNuevo', d)) $('#mNuevo', d).onclick = ()=>elegir({id:null, n:W.busq.trim().replace(/^./, c=>c.toUpperCase()), g:'gim', c:'cuerpo'});
      };
      const elegir = m=>{
        if(W.destino==='uno'){ W.uno = unoNuevo(m); W.titulo = ''; irPaso('uno'); return; }
        const on = {}; (ATTR_DEF[m.c] || ['reps']).forEach(k=>on[k] = true); if(CON_CARGA.has(m.id)) on.peso = true;
        W.tmp = {mov:m.id, n:m.n, pesoU:'kg', distU:'m', on}; irPaso('attr');
      };
      $('#mBus', d).oninput = e=>{ W.busq = e.target.value; lista(); };
      $$('#mGrupos button', d).forEach(b=>b.onclick = ()=>{ W.grupo = b.dataset.g; $$('#mGrupos button', d).forEach(x=>x.classList.toggle('activa', x===b)); lista(); });
      lista();
    }];
  },
  attr(){
    const m = W.tmp, st = estiloDe(W.estilo);
    if(m.descanso) return [`${cab('Descanso', true)}<label>Duración (min:seg)</label><input id="aT" data-tiempo inputmode="numeric" value="${esc(m.tiempo || '')}" placeholder="ej.: 130 → 1:30">
      <div class="btns"><button class="btn" data-atras>Cancelar</button><button class="btn prim" id="aOk">Guardar</button></div>`, d=>{
      $('#aOk', d).onclick = ()=>{ m.tiempo = $('#aT', d).value.trim(); ponerMov({descanso:true, tiempo:m.tiempo}); }; }];
    m.on = m.on || {}; ATTRS.forEach(([k])=>{ if(m[k]) m.on[k] = true; });
    const unidad = k=>k==='peso' ? `<select data-u="pesoU"><option ${m.pesoU!=='lb' && m.pesoU!=='pood' ? 'selected' : ''} value="kg">kg</option><option ${m.pesoU==='lb' ? 'selected' : ''} value="lb">libras</option>${esKB(m.mov) ? `<option ${m.pesoU==='pood' ? 'selected' : ''} value="pood">pood</option>` : ''}</select>`
      : k==='dist' ? `<select data-u="distU">${opcionesDist(m.distU)}</select>`
      : k==='alt' ? `<select data-u="altU"><option value="cm" ${m.altU!=='in' ? 'selected' : ''}>cm</option><option value="in" ${m.altU==='in' ? 'selected' : ''}>pulgadas</option></select>` : '';
    return [`${cab(nomMov(m), true)}<p class="suave chico">Marca y completa los datos de este movimiento.${st && st.id==='esquema' ? ' Las repeticiones las da el esquema (' + esc(W.params.esquema) + ').' : ''}</p>
      <div class="attrs">${ATTRS.map(([k, lab])=>`<div class="attr ${m.on[k] ? 'on' : ''}" data-k="${k}">
        <button class="tick" data-t="${k}" aria-label="Usar ${lab}">✓</button>
        <input data-a="${k}" ${k==='tiempo' ? 'data-tiempo inputmode="numeric"' : 'inputmode="decimal"'} placeholder="${k==='tiempo' ? 'min:seg' : lab}" value="${esc(m[k] || '')}">${unidad(k)}<span class="lab">${lab}</span></div>`).join('')}</div>
      <div class="btns"><button class="btn" data-atras>Cancelar</button><button class="btn prim" id="aOk">Guardar</button></div>`, d=>{
      $$('[data-t]', d).forEach(b=>b.onclick = ()=>{ const k = b.dataset.t; m.on[k] = !m.on[k]; b.parentNode.classList.toggle('on', m.on[k]); if(m.on[k]) $(`[data-a=${k}]`, d).focus(); });
      $$('[data-a]', d).forEach(i=>i.oninput = ()=>{ const k = i.dataset.a; m[k] = i.value; if(i.value && !m.on[k]){ m.on[k] = true; i.parentNode.classList.add('on'); } });
      $$('[data-u]', d).forEach(s=>s.onchange = ()=>m[s.dataset.u] = s.value);
      $('#aOk', d).onclick = ()=>{
        const it = {mov:m.mov, n:m.n};
        ATTRS.forEach(([k])=>{ if(m.on[k] && String(m[k] || '').trim()) it[k] = String(m[k]).trim(); });
        if(it.peso) it.pesoU = m.pesoU || 'kg'; if(it.dist) it.distU = m.distU || 'm'; if(it.alt && m.altU==='in') it.altU = 'in';
        ponerMov(it);
      };
    }];
  },
  uno(){
    const U = W.uno, carga = CON_CARGA.has(U.mov);
    let campos = '';
    if(U.c==='peso') campos = `<div class="entre"><h3>Series</h3><select data-uv="pesoU" style="width:auto"><option value="kg" ${U.pesoU!=='lb' && U.pesoU!=='pood' ? 'selected' : ''}>kg</option><option value="lb" ${U.pesoU==='lb' ? 'selected' : ''}>libras</option>${esKB(U.mov) ? `<option value="pood" ${U.pesoU==='pood' ? 'selected' : ''}>pood</option>` : ''}</select></div>
      ${U.series.map((s, i)=>`<div class="serie"><span class="suave">${i+1}</span><input data-s="${i}:reps" type="number" inputmode="numeric" min="1" placeholder="reps" value="${esc(s.reps)}"><span>×</span><input data-s="${i}:peso" inputmode="decimal" placeholder="${U.pesoU || 'kg'}" value="${esc(s.peso)}">${U.series.length>1 ? `<button class="btn chico-btn" data-sdel="${i}">✕</button>` : ''}</div>`).join('')}
      <div class="acciones"><button class="link" id="uMas">＋ Serie</button><button class="link" id="uRep">＋ Repetir la última</button></div>
      <p class="nota">Una serie de 1 repetición es tu 1RM. También se guarda tu mejor peso para cada número de repeticiones.</p>`;
    const conTramos = U.tramos && U.tramos.length;
    if(U.c==='dist') campos = `${conTramos ? '' : `<div class="fila"><div><label>Distancia</label><input data-uv="dist" inputmode="decimal" value="${esc(U.dist)}"></div><div><label>&nbsp;</label><select data-uv="distU">${opcionesDist(U.distU)}</select></div></div>`}
      <label>${conTramos ? 'Tiempo total (si no anotas cada tramo)' : 'Tiempo'}</label><input data-uv="tiempo" data-tiempo inputmode="numeric" placeholder="ej.: 1030 → 10:30 · 13000 → 1:30:00" value="${esc(U.tiempo)}">
      ${carga ? `<label>Carga (kg)</label><input data-uv="peso" inputmode="decimal" value="${esc(U.peso)}">` : ''}`;
    if(U.c==='cuerpo' && U.seriesR) campos = `<h3>Series</h3>${U.seriesR.map((r, i)=>`<div class="serie"><span class="suave">${i+1}</span><input data-sr="${i}" type="number" inputmode="numeric" min="0" placeholder="repeticiones" value="${esc(r)}">${U.seriesR.length>1 ? `<button class="btn chico-btn" data-srdel="${i}">✕</button>` : ''}</div>`).join('')}
      <div class="acciones"><button class="link" id="uMasR">＋ Serie</button></div>`;
    else if(U.c==='cuerpo') campos = `<div class="fila"><div><label>Repeticiones</label><input data-uv="reps" type="number" inputmode="numeric" min="0" value="${esc(U.reps)}"></div>
      <div><label>Tiempo límite</label><select data-uv="lim">${[['', 'Sin límite (máximo)'], ['30', '30 s'], ['60', '1 min'], ['120', '2 min'], ['180', '3 min'], ['300', '5 min']].map(([v, t])=>`<option value="${v}" ${String(U.lim)===v ? 'selected' : ''}>${t}</option>`).join('')}</select></div></div>`;
    if(U.c==='cal') campos = `<div class="fila"><div><label>Calorías</label><input data-uv="cal" type="number" inputmode="numeric" min="0" value="${esc(U.cal)}"></div>
      <div><label>En cuánto tiempo</label><input data-uv="tiempo" data-tiempo inputmode="numeric" placeholder="opcional (min:seg)" value="${esc(U.tiempo)}"></div></div>`;
    if(U.c==='tiempo') campos = `<label>Tiempo logrado</label><input data-uv="tiempo" data-tiempo inputmode="numeric" placeholder="ej.: 200 → 2:00" value="${esc(U.tiempo)}">`;
    return [`${cab(nomMov(U), true)}
      ${W.nota ? `<p class="suave chico">${esc(W.nota)}</p>` : ''}
      ${typeof htmlVersionWod==='function' ? htmlVersionWod() : ''}
      ${(METODOS[U.c] || []).length ? `<label>Método de entrenamiento</label><div class="chips" id="uMet" style="padding-top:2px">${METODOS[U.c].map(([k, n])=>`<button data-met="${k}" class="${(U.metodo || METODOS[U.c][0][0])===k ? 'activa' : ''}">${n}</button>`).join('')}</div>
        ${(metodoDe(U.c, U.metodo) || [])[2] ? `<p class="suave chico" style="margin:4px 0 0">${esc(metodoDe(U.c, U.metodo)[2])}${U.c==='peso' && metodoDe(U.c, U.metodo)[3] && !rm1De(U.mov) ? ' Registra tu 1RM para que se calculen los kilos.' : ''}</p>` : ''}` : ''}
      ${!U.mov ? `<label>Tipo de movimiento</label><div class="segmentos" id="uCat">${Object.entries({peso:'Con peso', cuerpo:'Repeticiones', dist:'Distancia', cal:'Calorías', tiempo:'Tiempo'}).map(([k, t])=>`<button data-c="${k}" class="${U.c===k ? 'activa' : ''}">${t}</button>`).join('')}</div>` : ''}
      ${campos}
      ${U.mov || U.c ? htmlEditorTramos(U) + htmlResultadoTramos(U) : ''}
      <div class="btns"><button class="btn" data-atras>‹ Atrás</button><button class="btn prim" id="uSig">Siguiente: fecha y notas</button></div>`, d=>{
      $$('#wNivel [data-niv]', d).forEach(b=>b.onclick = ()=>{ if(b.dataset.niv!=='rx' && !esPlus()) return pantallaPlus('wod', ()=>{ aplicarNivel(b.dataset.niv); pintar(); }); aplicarNivel(b.dataset.niv); pintar(); });
      enlazarEditorTramos(d, U);
      $$('[data-uv]', d).forEach(i=>{ i.oninput = i.onchange = ()=>{ U[i.dataset.uv] = i.value; if(i.dataset.uv==='pesoU') pintar(); }; });
      $$('[data-s]', d).forEach(i=>i.oninput = ()=>{ const [n, k] = i.dataset.s.split(':'); U.series[+n][k] = i.value; });
      $$('[data-sdel]', d).forEach(b=>b.onclick = ()=>{ U.series.splice(+b.dataset.sdel, 1); pintar(); });
      if($('#uMas', d)) $('#uMas', d).onclick = ()=>{ U.series.push({reps:'', peso:''}); pintar(); };
      if($('#uRep', d)) $('#uRep', d).onclick = ()=>{ U.series.push(clon(U.series[U.series.length-1])); pintar(); };
      $$('#uCat button', d).forEach(b=>b.onclick = ()=>{ U.c = b.dataset.c; U.metodo = null; U.seriesR = null; pintar(); });
      $$('#uMet button', d).forEach(b=>b.onclick = ()=>{ if(!aplicarMetodo(U, b.dataset.met)) pintar(); });
      $$('[data-sr]', d).forEach(i=>i.oninput = ()=>U.seriesR[+i.dataset.sr] = i.value);
      $$('[data-srdel]', d).forEach(b=>b.onclick = ()=>{ U.seriesR.splice(+b.dataset.srdel, 1); pintar(); });
      if($('#uMasR', d)) $('#uMasR', d).onclick = ()=>{ U.seriesR.push(''); pintar(); };
      $('#uSig', d).onclick = ()=>{ if(tiempoMal(d)) return; const s = aSesion(W); if(!s.txt){ aviso('Anota tu resultado'); return; } irPaso('notas'); };
    }];
  },
  buscar(){
    const tipo = W.buscar;
    let html = '', items = [];
    const tarjeta = (i, t, sub, txt, extra)=>`<li class="item" data-i="${i}"><div class="entre"><span class="titulo">${esc(t)}</span>${extra || ''}</div>${sub ? `<div class="suave chico">${esc(sub)}</div>` : ''}<div class="pre">${esc(txt)}</div></li>`;
    if(tipo==='populares'){
      items = POPULARES;
      const fila = (p, i)=>tarjeta(i, p.titulo, p.uno ? 'Un movimiento' : estiloDe(p.estilo).n, p.uno ? fmtUnoPlantilla(p.uno) : textoWod(p));
      html = `<input id="popBus" type="search" placeholder="Buscar (ej.: noruego, Fran, 5×5)…" autocomplete="off">
        <button class="btn ancho" id="bPSF" style="margin-top:10px">🎯 Control PSF completo (abre la pestaña PSF)</button>
        ${CAT_POP.map(([c, n, d])=>{ const ps = POPULARES.map((p, i)=>[p, i]).filter(([p])=>p.cat===c).sort((a, b)=>(a[0].orden || 0) - (b[0].orden || 0));
          return ps.length ? `<details class="cat-pop" data-cat="${c}" ${c==='doctrina' || c==='metodos' ? 'open' : ''}><summary><span>${n} <span class="suave chico">· ${ps.length}</span></span><span class="suave chico">${d}</span></summary>
            <ul class="lista">${ps.map(([p, i])=>fila(p, i)).join('')}</ul></details>` : ''; }).join('')}`;
    }
    if(tipo==='anteriores'){
      items = anteriores().map(s=>plantillaDe(s.w));
      const ss = anteriores();
      html = ss.length ? `<ul class="lista">${ss.map((s, i)=>tarjeta(i, s.titulo || etiquetaTipo(s), 'Última vez: ' + verFecha(s.fecha) + (s.txt ? ' · ' + s.txt : ''), s.desc)).join('')}</ul>`
        : '<div class="vacio">Aún no registras entrenamientos.</div>';
    }
    if(tipo==='favoritos'){
      items = S.favoritos.map(f=>f.w);
      html = items.length ? `<ul class="lista">${S.favoritos.map((f, i)=>tarjeta(i, f.w.titulo || 'Sin nombre', '', f.w.uno ? fmtUnoPlantilla(f.w.uno) : textoWod(f.w), `<button class="btn chico-btn" data-quitar="${f.id}" aria-label="Quitar de favoritos">✕</button>`)).join('')}</ul>`
        : '<div class="vacio">Aún no tienes favoritos. Al guardar un entrenamiento, marca «Guardar en favoritos».</div>';
    }
    return [`${cab({populares:'Populares', anteriores:'Entrenamientos anteriores', favoritos:'★ Favoritos'}[tipo], true)}${html}`, d=>{
      $$('[data-i]', d).forEach(li=>li.onclick = e=>{ if(e.target.closest('[data-quitar]')) return; cargarPlantilla(items[+li.dataset.i]); });
      $$('[data-quitar]', d).forEach(b=>b.onclick = ()=>{ S.favoritos = S.favoritos.filter(f=>f.id!==b.dataset.quitar); guardar(); pintar(); });
      if($('#bPSF', d)) $('#bPSF', d).onclick = ()=>{ d.close(); ir('psf'); };
      if($('#popBus', d)) $('#popBus', d).oninput = e=>{ const q = sinTildes(e.target.value);
        $$('.cat-pop', d).forEach(c=>{ let n = 0; $$('li[data-i]', c).forEach(li=>{ const ok = !q || sinTildes($(".titulo", li).textContent).includes(q); li.hidden = !ok; if(ok) n++; }); c.hidden = !n; if(q) c.open = true; }); };
    }];
  },
  notas(){
    const s = aSesion(W);
    return [`${cab('Fecha y notas', true)}
      <div class="tarjeta notas-res"><div class="titulo">${esc(s.titulo || etiquetaTipo(s))}</div>${s.w ? htmlWodVisual(s.w) : `<div class="pre">${esc(s.desc)}</div>`}
        ${s.txt ? `<div class="notas-txt num">${esc(s.txt)}${s.rx ? ' <span class="chip gris">Rx</span>' : ''}</div>` : ''}</div>
      <label>Fecha</label><input id="nFecha" type="date" value="${esc(W.fecha)}"${esPlus() || W.soloPlan ? '' : ' min="' + desdeGratis() + '"'}>
      ${W.soloPlan ? '' : htmlEsfuerzo(W.rpe, W.sens)}
      <div class="fila2"><div><label>Duración total</label><input id="nDur" data-tiempo inputmode="numeric" placeholder="ej.: 5500 → 55:00" value="${esc(W.dur!=null && W.dur!=='' && /^\d+$/.test(String(W.dur)) ? W.dur + ':00' : W.dur || '')}"></div>
      <div><label>FC media (opcional)</label><input id="nFc" type="number" inputmode="numeric" min="0" placeholder="lat/min" value="${esc(W.fc || '')}"></div></div>
      <label>Notas</label><textarea id="nNotas" placeholder="Cómo te sentiste, escalamientos, clima…">${esc(W.notas)}</textarea>
      ${W.soloPlan ? '' : htmlCancion(W)}
      <label>Fotos</label><div class="fotos-reg" id="nFotos">${(W.fotosExist || []).map(id=>`<span class="foto-r"><img data-foto="${id}" alt=""><button class="foto-x" data-qe="${id}" aria-label="Quitar foto">✕</button></span>`).join('')}${fotosPend.map((b, i)=>`<span class="foto-r"><img data-pend="${i}" alt=""><button class="foto-x" data-qp="${i}" aria-label="Quitar foto">✕</button></span>`).join('')}<button class="foto-mas" id="nFotoMas" aria-label="Agregar fotos">📷<span>Agregar</span></button></div>
      <label class="check"><input type="checkbox" id="nFav" ${W.fav ? 'checked' : ''}>★ Guardar en favoritos</label>
      <div class="btns"><button class="btn" data-atras>‹ Atrás</button><button class="btn prim" id="nOk">${W.soloPlan ? '🗓 Guardar en la agenda' : 'Guardar'}</button></div>`, d=>{
      $('#nFecha', d).onchange = e=>W.fecha = e.target.value;
      enlazarEsfuerzo(d, (k, v)=>{ W[k] = v; });
      $('#nNotas', d).oninput = e=>W.notas = e.target.value;
      $('#nDur', d).oninput = e=>W.dur = e.target.value;
      $('#nFc', d).oninput = e=>W.fc = e.target.value;
      enlazarCancion(d, r=>ponerMusica(W, r));
      cargarFotos(d); $$('img[data-pend]', d).forEach(img=>img.src = URL.createObjectURL(fotosPend[+img.dataset.pend]));
      $('#nFotoMas', d).onclick = ()=>elegirFotos(bs=>{ fotosPend.push(...bs); pintar(); });
      $$('[data-qe]', d).forEach(b=>b.onclick = ()=>{ W.fotosExist = W.fotosExist.filter(id=>id!==b.dataset.qe); pintar(); });   // se borra del equipo recién al Guardar
      $$('[data-qp]', d).forEach(b=>b.onclick = ()=>{ fotosPend.splice(+b.dataset.qp, 1); pintar(); });
      $('#nFav', d).onchange = e=>W.fav = e.target.checked;
      $('#nOk', d).onclick = async ()=>{ if(tiempoMal(d)) return; $('#nOk', d).disabled = true; await guardarRegistro(); d.close(); };
    }];
  },
};
function ponerMov(it){
  const a = W.secc[W.destino];
  if(W.editar!=null) a[W.editar] = it; else a.push(it);
  volverA('multi');
}
function fmtUnoPlantilla(u){ return (u.dist ? fmtD(u.dist, u.distU) + ' · ' : '') + (movDe(u.mov) || u).n + (u.peso ? ' · ' + verPeso(u.peso, u.pesoU, u.mov) : ''); }
function usoMovs(){
  const uso = {};
  S.sesiones.forEach(s=>{ if(!s.w) return; const ids = new Set((s.w.uno ? [s.w.uno] : s.w.secc.in.concat(s.w.secc.main, s.w.secc.out)).map(m=>m.mov).filter(Boolean));
    ids.forEach(id=>uso[id] = (uso[id] || 0) + 1); });
  return uso;
}
function recientes(){
  const vistos = [], ids = new Set();
  S.sesiones.slice().sort((a, b)=>(b.creado || 0) - (a.creado || 0)).forEach(s=>{
    if(!s.w) return;
    const ms = s.w.uno ? [s.w.uno] : s.w.secc.in.concat(s.w.secc.main, s.w.secc.out);
    ms.forEach(m=>{ if(m.mov && !ids.has(m.mov) && movDe(m.mov)){ ids.add(m.mov); vistos.push(movDe(m.mov)); } });
  });
  return vistos.slice(0, 6);
}
/* Tarjetas del buscador «¿Qué hiciste?»: color e ícono del grupo, tipo, lo que tiene, tu mejor marca y la meta (23-oct-2026, pedido del usuario:
   «visión muy básica, no resalta») */
function tarjetaResultado(k, v, titulo, tipo, g, detalle, mejor, t){
  const G = GRUPOS[g] || {ic:'◆', n:''}, q = String(W.qInicio || '').trim(), i = q ? titulo.toLowerCase().indexOf(q.toLowerCase()) : -1;
  const tit = i >= 0 ? esc(titulo.slice(0, i)) + '<mark>' + esc(titulo.slice(i, i + q.length)) + '</mark>' + esc(titulo.slice(i + q.length)) : esc(titulo);
  const M = t && typeof metaWod==='function' ? metaWod(t) : null;
  return `<li class="r-res g-${g}" data-rk="${k}" data-rv="${esc(v)}"><span class="rr-ic">${G.ic}</span><div class="rr-c"><div class="rr-t"><b>${tit}</b><span class="rr-tipo ${k==='a' ? 'hecho' : ''}">${esc(tipo)}</span></div>
    ${detalle ? `<div class="rr-d">${esc(detalle)}</div>` : ''}${mejor || M ? `<div class="rr-x">${mejor ? `<span>🏆 Tu mejor: <b>${esc(mejor)}</b></span>` : ''}${M ? `<span>🎯 ${textoMeta(M)}</span>` : ''}</div>` : ''}</div><span class="chev">›</span></li>`;
}
const grupoPlantilla = p=>{ const m = p.uno ? p.uno : (p.main || []).find(x=>x.mov); const mv = m && movDe(m.mov); return mv ? mv.g : 'gim'; };
function resumenPlantilla(p){ if(p.uno) return fmtUnoPlantilla(p.uno); const st = estiloDe(p.estilo), L = (p.main || []).filter(m=>!m.descanso).map(m=>fmtMov(m, st));
  const c = cabecera(st, Object.assign({}, PDEF, p.params)).replace(/:$/, ''); const t = c + ' · ' + L.join(' · '); return t.length > 110 ? t.slice(0, 108) + '…' : t; }
const mejorWod = titulo=>{ const b = mejorDe('wod:' + titulo); return b ? b.txt : null; };
const mejorMov = id=>{ const ks = Object.keys(S.sesiones.reduce((a, s)=>{ (s.recs || []).forEach(r=>{ if(r.ej.indexOf(':' + id + ':') > 0 || r.ej==='tmax:' + id) a[r.ej] = 1; }); return a; }, {}));
  const b = ks.map(k=>mejorDe(k)).filter(Boolean)[0]; return b ? b.txt : null; };
function anteriores(){
  const vistos = new Set();
  return S.sesiones.filter(s=>s.w).sort((a, b)=>a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : (b.creado || 0) - (a.creado || 0))
    .filter(s=>{ const k = (s.titulo || '') + '|' + s.desc; if(vistos.has(k)) return false; vistos.add(k); return true; });
}

/* ---------- Resultado según el estilo ---------- */
/* Qué se anota de un movimiento: kg (pesas), repeticiones, calorías, tiempo (si la distancia es fija) o metros (si el tiempo es fijo) */
function medidaMov(m){
  const c = (movDe(m.mov) || {c:'cuerpo'}).c;
  if(c==='peso') return {k:'kg', lab:'kg (serie más pesada)', ph:'kg'};
  if(c==='dist') return m.dist ? {k:'t', lab:'tiempo', ph:'min:seg'} : {k:'m', lab:'metros', ph:'metros'};
  if(c==='cal') return {k:'cal', lab:'calorías', ph:'cal'};
  if(c==='tiempo') return {k:'t', lab:'tiempo logrado', ph:'min:seg'};
  return {k:'reps', lab:m.tiempo ? 'repeticiones en ' + m.tiempo : 'repeticiones', ph:'reps'};
}
const MED_RONDA = {t:['tiempo', 'min:seg'], m:['metros', 'metros'], cal:['calorías', 'cal'], reps:['repeticiones', 'reps'], kg:['repeticiones', 'reps']};
function medidaCadaRonda(w){ const m = (w.secc.main || []).find(x=>!x.descanso && x.mov); if(!m || m.dist || !m.tiempo) return 't'; const c = movDe(m.mov).c; return c==='dist' ? 'm' : c==='cal' ? 'cal' : 'reps'; }
function medidaRonda(w){ const m = (w.secc.main || []).find(x=>!x.descanso && x.mov); if(!m) return 'reps'; const c = movDe(m.mov).c; return c==='dist' ? 'm' : c==='cal' ? 'cal' : 'reps'; }
/* AMRAP: unidad y meta de cada ejercicio para anotar la ronda incompleta */
const unidadParcial = m=>m.dist ? (m.distU==='km' ? 'km' : UNID_DIST[m.distU] ? UNID_DIST[m.distU][0] : 'm') : m.cal ? 'cal' : (!m.reps && m.tiempo) ? 'seg' : 'reps';
const objetivoParcial = m=>m.dist ? 'de ' + fmtD(m.dist, m.distU) : m.cal ? 'de ' + m.cal + ' cal' : m.reps ? 'de ' + m.reps + ' reps' : '';
const metaParcial = m=>m.dist ? num(m.dist) : m.cal ? num(m.cal) : m.reps ? num(m.reps) : null;
function resultadoHTML(st){
  const r = W.res, v = k=>esc(r[k] ?? '');
  switch(st.r){
    case 'tiempo': return `<label class="check"><input type="radio" name="rTipo" value="t" ${!r.sinTiempo ? 'checked' : ''}>Tiempo total</label>
      <input data-r="t" data-tiempo inputmode="numeric" placeholder="ej.: 1230 → 12:30" value="${v('t')}">
      <label class="check"><input type="radio" name="rTipo" value="s" ${r.sinTiempo ? 'checked' : ''}>No se tomó el tiempo</label>`;
    case 'tiempos': if(medidaCadaRonda(W)!=='t'){ const n = Math.max(1, Math.min(40, ent(W.params.rondas) || 1)), k = medidaCadaRonda(W), [lab, ph] = MED_RONDA[k]; r.pr = (r.pr || []).slice(0, n);
      return `<p class="suave chico">El tramo es por tiempo: anota los <b>${lab}</b> de cada ronda. La app suma el total.</p><div class="fila">${Array.from({length:n}, (_, i)=>`<div><label>Ronda ${i+1}</label><input data-pr="${i}" inputmode="decimal" placeholder="${ph}" value="${esc(r.pr[i] || '')}"></div>`).join('')}</div>`; }
    { const n = Math.max(1, Math.min(30, ent(W.params.rondas) || 1)); r.ts = (r.ts || []).slice(0, n);
      return `<p class="suave chico">Tiempo de cada ronda (min:seg)</p><div class="fila">${Array.from({length:n}, (_, i)=>`<div><label>Ronda ${i+1}</label><input data-ts="${i}" data-tiempo inputmode="numeric" placeholder="min:seg" value="${esc(r.ts[i] || '')}"></div>`).join('')}</div>`; }
    case 'rondas': if(st.id==='amrap'){ const ms = (W.secc.main || []).map((m, i)=>[m, i]).filter(([m])=>!m.descanso); r.pa = r.pa || {};
        return `<label>Rondas completas</label><input data-r="r" type="number" inputmode="numeric" min="0" value="${v('r')}">
          <label style="margin-top:12px">Ronda que quedó a medias: ¿cuánto hiciste de cada ejercicio?</label>
          ${ms.map(([m, i])=>{ const u = unidadParcial(m); return `<div class="pa-fila"><span><b>${esc(nomMov(m))}</b><small>${esc(objetivoParcial(m) || 'sin cantidad indicada')}</small></span>
            <input data-pa="${i}" inputmode="decimal" placeholder="${u}" value="${esc(r.pa[i] ?? '')}"><em>${u}</em></div>`; }).join('')}
          <p class="nota">Anota solo lo que hiciste después de la última ronda completa (ej.: 200 m de remo y 3 cargadas). Lo que no hiciste, déjalo vacío.</p>`; }
      return `<div class="fila"><div><label>Rondas completas</label><input data-r="r" type="number" inputmode="numeric" min="0" value="${v('r')}"></div><div><label>Repeticiones extra</label><input data-r="re" type="number" inputmode="numeric" min="0" value="${v('re')}"></div></div>`;
    case 'reps': return `<label>Total de repeticiones</label><input data-r="reps" type="number" inputmode="numeric" min="0" value="${v('reps')}">`;
    case 'emom': return `<div class="fila"><div><label>¿Cómo resultó?</label><select data-r="c">${['', 'Completo', 'Incompleto'].map(o=>`<option ${r.c===o ? 'selected' : ''}>${o}</option>`).join('')}</select></div>
      <div><label>Intervalos completados</label><input data-r="ok" type="number" inputmode="numeric" min="0" value="${v('ok')}"></div></div>`;
    case 'porRonda': { const n = Math.max(1, Math.min(40, ent(W.params.rondas) || 1)), k = medidaRonda(W), [lab, ph] = MED_RONDA[k]; r.pr = (r.pr || []).slice(0, n);
      return `<p class="suave chico">Anota los <b>${lab}</b> de cada repetición. La app suma el total.</p><div class="fila">${Array.from({length:n}, (_, i)=>`<div><label>Rep. ${i+1}</label><input data-pr="${i}" inputmode="decimal" placeholder="${ph}" value="${esc(r.pr[i] || '')}"></div>`).join('')}</div>`; }
    case 'porMov': { r.pm = r.pm || {}; const ms = (W.secc.main || []).map((m, i)=>[m, i]).filter(([m])=>!m.descanso && m.mov);
      return ms.length ? `<p class="suave chico">Anota tu resultado en cada movimiento (lo que no hiciste, déjalo en blanco).</p>${ms.map(([m, i])=>{ const md = medidaMov(m);
        return `<label>${esc(fmtMov(m, estiloDe(W.estilo)))} · <span class="suave">${md.lab}</span></label><input data-pm="${i}" ${md.k==='t' ? 'data-tiempo inputmode="numeric"' : 'inputmode="decimal"'} placeholder="${md.ph}" value="${esc(r.pm[i] || '')}">`; }).join('')}`
        : '<p class="suave">Agrega movimientos para anotar sus resultados.</p>'; }
    default: return '<p class="suave">Sin puntaje: anota en las notas cómo te fue.</p>';
  }
}
function cargasHTML(st){
  if(st.r==='porMov') return '';
  const ms = ['in', 'main', 'out'].flatMap(k=>(W.secc[k] || []).map((m, i)=>[k, m, i])).filter(([, m])=>!m.descanso && m.mov && (movDe(m.mov) || {}).c==='peso');
  if(!ms.length) return '';
  W.res.cargas = W.res.cargas || {};
  return `<h3>Cargas usadas</h3><p class="suave chico">Si usaste otro peso que el indicado, anótalo (queda en el registro).</p>
    ${ms.map(([k, m, i])=>`<div class="fila"><div><label>${esc(nomMov(m))}</label><input data-carga="${k}:${i}" inputmode="decimal" placeholder="${esc(m.peso ? verPeso(m.peso, m.pesoU, m.mov) : pesoPref())}" value="${esc(W.res.cargas[k + ':' + i] || '')}"></div></div>`).join('')}`;
}
function enlazarResultado(d){
  $$('[data-carga]', d).forEach(i=>i.oninput = ()=>{ W.res.cargas = W.res.cargas || {}; W.res.cargas[i.dataset.carga] = i.value; });
  $$('[data-r]', d).forEach(i=>{ i.oninput = i.onchange = ()=>{ W.res[i.dataset.r] = i.value; if(i.dataset.r==='t' && i.value) { W.res.sinTiempo = false; const rb = $('input[name=rTipo][value=t]', d); if(rb) rb.checked = true; } }; });
  $$('[data-ts]', d).forEach(i=>i.oninput = ()=>{ W.res.ts = W.res.ts || []; W.res.ts[+i.dataset.ts] = i.value; });
  $$('[data-pr]', d).forEach(i=>i.oninput = ()=>{ W.res.pr = W.res.pr || []; W.res.pr[+i.dataset.pr] = i.value; });
  $$('[data-pm]', d).forEach(i=>i.oninput = ()=>{ W.res.pm = W.res.pm || {}; W.res.pm[i.dataset.pm] = i.value; });
  $$('[data-pa]', d).forEach(i=>i.oninput = ()=>{ W.res.pa = W.res.pa || {}; W.res.pa[i.dataset.pa] = i.value; });
  $$('input[name=rTipo]', d).forEach(i=>i.onchange = ()=>W.res.sinTiempo = i.value==='s');
}

/* ---------- Presentación visual del entrenamiento: insignia del estilo, barra de composición y filas por grupo ---------- */
function insigniaEstilo(w){
  const st = estiloDe(w.estilo), p = Object.assign({}, PDEF, w.params || {});
  const n = {rft:p.rondas, cada_ronda:p.rondas, calidad:p.rondas, fgb:p.rondas, tabata:p.rondas, intervalos:p.rondas, esquema:p.esquema, amrap:p.minutos + "'", amreps:p.minutos + "'", emom:p.intervalos, emom_alt:p.intervalos}[w.estilo] || '';
  const t = {rft:'rondas por tiempo', cada_ronda:'rondas, cada una por tiempo', calidad:'rondas por calidad', fgb:'rondas · 1 min por estación', tabata:'rondas · ' + p.trabajo + '″/' + p.descanso + '″',
    intervalos:'× ' + PSF.verTiempo(+p.trabajo || 0) + ' / ' + PSF.verTiempo(+p.descanso || 0), esquema:'repeticiones por tiempo', amrap:'AMRAP', amreps:'máximo de repeticiones', emom:'EMOM · cada ' + p.cada + '″', emom_alt:'EMOM alternado', por_tiempo:'por tiempo', muerte:'muerte por repeticiones'}[w.estilo] || st.n;
  return `<div class="wv-cab">${n ? `<span class="wv-n-ins num">${esc(String(n))}</span>` : ''}<span class="wv-estilo">${esc(t)}</span></div>`;
}
function filaVisual(m, st, p){
  if(m.descanso) return `<div class="wv-desc">⏸ Descanso ${esc(m.tiempo || '')}</div>`;
  const mv = movDe(m.mov) || {g:'gim', n:m.n}, g = GRUPOS[mv.g] || GRUPOS.gim;
  let cant = [m.reps && !(st && st.id==='esquema') ? m.reps : '', m.dist ? fmtD(m.dist, m.distU) : '', m.cal ? m.cal + ' cal' : '', m.tiempo || ''].filter(Boolean).join(' · ');
  if(!cant && p && st && st.id==='intervalos') cant = (p.rondas || 4) + ' × ' + PSF.verTiempo(+p.trabajo || 0);
  if(!cant && st && st.id==='esquema') cant = (p && p.esquema) || PDEF.esquema;
  return `<div class="wv-mov g-${mv.g}"><span class="wv-ic">${g.ic}</span><span class="wv-cant num">${esc(cant || '—')}</span><span class="wv-nom">${esc(nomMov(m))}</span>${m.peso ? `<span class="wv-kg num">${esc(verPeso(m.peso, m.pesoU, m.mov))}</span>` : ''}${m.alt ? `<span class="wv-kg num">${esc(fmtAlt(m))}</span>` : ''}</div>`;
}
function composicion(movs){
  const c = {}; movs.filter(m=>!m.descanso).forEach(m=>{ const g = (movDe(m.mov) || {g:'gim'}).g; c[g] = (c[g] || 0) + 1; });
  const tot = Object.values(c).reduce((a, b)=>a + b, 0); if(!tot) return '';
  return `<div class="wv-comp">${Object.entries(c).map(([g, n])=>`<i class="g-${g}" style="flex:${n}" title="${GRUPOS[g].corto}"></i>`).join('')}</div>
    <div class="wv-ley">${Object.entries(c).map(([g, n])=>`<span><i class="marca-g g-${g}"></i>${GRUPOS[g].corto} ${Math.round(n/tot*100)} %</span>`).join('')}</div>`;
}
/* w: estructura guardada (s.w) o plantilla. compacto: para tarjetas (máx. 5 filas) */
function htmlWodVisual(w, compacto){
  if(!w) return '';
  if(w.uno || w.modo==='uno'){ const U = w.uno; if(!U) return ''; if(U.tramos && U.tramos.length) return `<div class="wodv">${htmlTramosVista(U)}</div>`; const mv = movDe(U.mov) || {g:'gim', n:U.n}, M = typeof metodoDe==='function' ? metodoDe(U.c, U.metodo) : null;
    return `<div class="wodv">${M && !['libre', 'max'].includes(M[0]) ? `<div class="wv-cab"><span class="wv-estilo">${esc(M[1])}</span></div>` : ''}${filaVisual({mov:U.mov, n:U.n, dist:U.dist, distU:U.distU, peso:U.c==='dist' ? U.peso : '', reps:seriesPeso(U).length > 1 ? seriesPeso(U).length + ' series' : ''}, null)}</div>`; }
  const st = estiloDe(w.estilo); if(!st) return '';
  const sc = w.secc || {in:w.in || [], main:w.main || [], out:w.out || []}, todos = sc.in.concat(sc.main, sc.out);
  let filas = sc.main.map(m=>filaVisual(m, st, w.params)), mas = 0;
  const nIn = BUY.has(st.id) ? 'Antes' : 'Calentamiento', nOut = BUY.has(st.id) ? 'Después' : 'Vuelta a la calma';
  if(compacto && filas.length > 5){ mas = filas.length - 5; filas = filas.slice(0, 5); }
  return `<div class="wodv ${compacto ? 'compacto' : ''}">${insigniaEstilo(w)}${composicion(todos)}
    ${sc.in.length ? `<div class="wv-sec">${nIn}</div>${sc.in.map(m=>filaVisual(m, st)).join('')}` : ''}
    ${sc.in.length || sc.out.length ? '<div class="wv-sec">Bloque principal</div>' : ''}${filas.join('')}${mas ? `<div class="wv-mas">+ ${mas} movimiento${mas>1 ? 's' : ''} más</div>` : ''}
    ${sc.out.length ? `<div class="wv-sec">${nOut}</div>${sc.out.map(m=>filaVisual(m, st)).join('')}` : ''}</div>`;
}

/* ---------- Parciales de cada intervalo (también para registros antiguos) ---------- */
/* Series de un levantamiento (un solo movimiento, por peso): la mejor en grande y todas como fichas (antes salía «3 × 95, 3 × 115, …» gigante) */
function seriesPeso(U){ return U && U.c==='peso' && U.series ? U.series.filter(x=>num(x.peso)!=null).map(x=>({reps:ent(x.reps) || 1, peso:x.peso, kg:aKg(x.peso, U.pesoU)})) : []; }
function resumenSeries(s){
  const U = s && s.w && s.w.uno, ok = seriesPeso(U); if(ok.length < 2) return null;
  const u = U.pesoU || 'kg', mejor = ok.reduce((a, x)=>x.kg > a.kg || (x.kg===a.kg && x.reps > a.reps) ? x : a, ok[0]);
  const vol = ok.reduce((a, x)=>a + x.reps * x.kg, 0), reps = ok.reduce((a, x)=>a + x.reps, 0);
  return {mejor:mejor.reps + ' × ' + verPeso(mejor.peso, u, U.mov), html:`<div class="series-res">${ok.map((x, i)=>`<span class="${x===mejor ? 'mejor' : ''}"><small>${i + 1}</small>${x.reps} × ${esc(u==='pood' ? coma(num(x.peso)) : verPeso(x.peso, u).split(' ')[0])}</span>`).join('')}<em>${u==='pood' ? 'pood' : pesoPref()}</em></div>`,
    nota:ok.length + ' series · ' + reps + ' reps · ' + (pesoPref()==='lb' ? Math.round(vol * KG_LB) : Math.round(vol)).toLocaleString('es-CL') + ' ' + pesoPref() + ' levantados'};
}
/* Resultado corto para tarjetas y afiches: en series de un levantamiento, la mejor serie */
function resCorto(s){ const r = resumenSeries(s); return r ? 'Mejor ' + r.mejor : (s.txt || '').split(' (')[0]; }
function parcialesDe(s){
  const w = s && s.w; if(!w || w.uno || !w.res || !w.estilo) return null;
  const st = estiloDe(w.estilo); let k = null, arr = null;
  if(st.r==='porRonda'){ k = medidaRonda(w); arr = w.res.pr; }
  else if(st.r==='tiempos'){ k = medidaCadaRonda(w); arr = k==='t' ? w.res.ts : w.res.pr; }
  if(!arr) return null;
  const f = v=>k==='t' ? PSF.verTiempo(v) : k==='m' ? v.toLocaleString('es-CL') + ' m' : v + (k==='cal' ? ' cal' : ' rep');
  const items = arr.map((x, i)=>{ const v = k==='t' ? PSF.leerTiempo(x) : num(x); return v==null ? null : {n:i+1, v, txt:f(v)}; }).filter(Boolean);
  if(items.length < 2) return null;
  const mejor = k==='t' ? Math.min(...items.map(x=>x.v)) : Math.max(...items.map(x=>x.v));
  items.forEach(x=>x.mejor = x.v===mejor);
  return {items, k};
}
function htmlParciales(s){
  const P = parcialesDe(s); if(!P) return '';
  return `<div class="parciales">${P.items.map(x=>`<div class="${x.mejor ? 'mejor' : ''}"><small>Intervalo ${x.n}</small><b class="num">${esc(x.txt)}</b>${x.mejor ? '<i>mejor</i>' : ''}</div>`).join('')}</div>`;
}

/* ---------- Convertir a entrenamiento guardado ---------- */
const etiquetaTipo = s=>(estiloDe(s.tipo) || {}).n || (s.tipo==='uno' ? (s.metodo || 'Un movimiento') : TIPOS[s.tipo] || 'Entrenamiento');
function aSesion(W){
  if(W.modo==='uno' && W.uno) sincronizarTramos(W.uno);
  const w = clon(W); ['musica', 'musicaUrl', 'musicaArt', 'musicaAlbum', 'musicaImg', 'sens'].forEach(k=>delete w[k]); delete w.paso; delete w.volver; delete w.fotosExist; delete w.tmp; delete w.busq; delete w.buscar; delete w.qInicio; delete w.destino; delete w.editar; delete w.base;
  if(W.modo!=='uno') delete w.uno;   // un registro de series no debe arrastrar el movimiento suelto
  const s = {id:W.id, fecha:W.fecha, titulo:(W.titulo || '').trim(), rpe:W.rpe, notas:(W.notas || '').trim(), w, recs:[], txt:'', valor:null, rx:false};
  if(W.modo==='uno') return unoASesion(s, W.uno);
  const st = estiloDe(W.estilo), r = W.res; let u = null;
  const cg = r.cargas || {}, Wd = Object.keys(cg).some(k=>String(cg[k]).trim()) ? Object.assign({}, W, {secc:Object.fromEntries(['in', 'main', 'out'].map(k=>[k, (W.secc[k] || []).map((m, i)=>{
    const v = String(cg[k + ':' + i] || '').trim(); return v ? Object.assign({}, m, {peso:v, pesoU:m.pesoU || 'kg'}) : m; })]))}) : W;
  s.tipo = st.id; s.desc = textoWod(Wd);
  if(Wd!==W){ s.w.secc = clon(Wd.secc); }
  if(st.r==='tiempo'){ const t = PSF.leerTiempo(r.t); if(!r.sinTiempo && t!=null){ s.valor = t; s.txt = PSF.verTiempo(t); u = 'tiempo'; } else if(r.sinTiempo) s.txt = 'Sin tiempo'; }
  const kR = st.r==='porRonda' ? medidaRonda(W) : st.r==='tiempos' && medidaCadaRonda(W)!=='t' ? medidaCadaRonda(W) : null;
  if(kR){ const vs = (r.pr || []).map(num).filter(x=>x!=null);
    if(vs.length){ const tot = vs.reduce((a, b)=>a + b, 0), f = x=>kR==='m' ? fmtMetros(x) : kR==='cal' ? x + ' cal' : x + ' rep';
      s.valor = tot; u = kR==='m' ? 'm' : kR==='cal' ? 'cal' : 'reps'; s.txt = 'Total ' + f(tot) + (vs.length > 1 ? ' · prom. ' + f(Math.round(tot / vs.length)) : ''); } }
  else if(st.r==='tiempos'){ const ts = (r.ts || []).map(PSF.leerTiempo).filter(t=>t!=null);
    if(ts.length){ const tot = ts.reduce((a, b)=>a + b, 0); s.valor = tot; u = 'tiempo'; s.txt = 'Total ' + PSF.verTiempo(tot) + (ts.length>1 ? ' · prom. ' + PSF.verTiempo(Math.round(tot / ts.length)) : ''); } }
  if(st.r==='rondas'){ const R = ent(r.r), re = ent(r.re) || 0, pa = r.pa || {};
    const parc = st.id==='amrap' ? (W.secc.main || []).map((m, i)=>[m, num(pa[i])]).filter(([m, v])=>!m.descanso && v!=null && v > 0) : [];
    if(R!=null && parc.length){   // ronda incompleta por ejercicio: «7 rondas + 200 m Remo, 3 Power clean»
      const movs = (W.secc.main || []).filter(m=>!m.descanso), frac = movs.reduce((a, m)=>{ const k = (W.secc.main || []).indexOf(m), v = num(pa[k]), meta = metaParcial(m);
        return a + (v==null || v <= 0 ? 0 : meta ? Math.min(1, v / meta) : 1); }, 0) / (movs.length || 1);
      s.valor = R + Math.min(0.99, frac); u = 'rondas';
      s.txt = R + (R===1 ? ' ronda' : ' rondas') + ' + ' + parc.map(([m, v])=>coma(v) + (unidadParcial(m)==='reps' ? '' : ' ' + unidadParcial(m)) + ' ' + nombreEs(nomMov(m).split(' · ').pop())).join(', ');
      s.parcial = parc.map(([m, v])=>({mov:m.mov, n:m.n, v, u:unidadParcial(m)})); }
    else if(R!=null){ const rpr = st.id==='amrap' ? W.secc.main.reduce((a, m)=>a + (ent(m.reps) || 0), 0) : 0;
      s.valor = R + re/(rpr > re ? rpr : 100); u = 'rondas'; s.txt = R + (R===1 ? ' ronda' : ' rondas') + (re ? ' + ' + re : ''); } }
  if(st.r==='reps'){ const n = ent(r.reps); if(n!=null){ s.valor = n; u = 'reps'; s.txt = n + ' repeticiones'; } }
  if(st.r==='emom'){ const ok = ent(r.ok); s.txt = (r.c || '') + (ok!=null ? (r.c ? ' · ' : '') + ok + ' de ' + W.params.intervalos + ' intervalos' : ''); if(ok!=null){ s.valor = ok; u = 'reps'; } }
  if(st.r==='porMov'){ const partes = [];
    (W.secc.main || []).forEach((m, i)=>{ if(m.descanso || !m.mov) return; const raw = (r.pm || {})[i]; if(raw==null || String(raw).trim()==='') return;
      const md = medidaMov(m), mv = movDe(m.mov), nom = mv.n.split(' (')[0], clave = mv.id;
      if(md.k==='kg'){ const kg = aKg(raw, m.pesoU || 'kg'), reps = ent(m.reps) || 1; if(kg==null) return; partes.push(nom + ' ' + coma(raw) + ' kg');
        s.recs.push({ej:reps===1 && LEGADO_1RM[clave] ? LEGADO_1RM[clave] : 'rm:' + clave + ':' + reps, nombre:mv.n + (reps===1 ? ' (1RM)' : ' (mejor serie de ' + reps + ')'), u:'kg', valor:kg, txt:coma(raw) + ' kg'}); }
      else if(md.k==='t'){ const t = PSF.leerTiempo(raw); if(t==null) return; partes.push(nom + ' ' + PSF.verTiempo(t));
        const mt = m.dist ? metros(m.dist, m.distU) : null; if(mt) s.recs.push({ej:clave==='carrera' && mt===2400 ? 'psf2400' : 'dist:' + clave + ':' + mt, nombre:clave==='carrera' && mt===2400 ? 'Carrera 2.400 m' : mv.n + ' ' + fmtMetros(mt), u:'tiempo', valor:t, txt:PSF.verTiempo(t)}); }
      else if(md.k==='m'){ const v = num(raw); if(v==null) return; partes.push(nom + ' ' + fmtMetros(v)); }
      else { const v = ent(raw); if(v==null) return; partes.push(nom + ' ' + v + (md.k==='cal' ? ' cal' : ' rep'));
        const seg = m.tiempo ? PSF.leerTiempo(m.tiempo) : null; if(seg && md.k==='reps') s.recs.push({ej:'reps:' + clave + ':' + seg, nombre:mv.n + ' en ' + PSF.verTiempo(seg), u:'reps', valor:v, txt:v + ' rep'}); }
    });
    s.txt = partes.join(' · '); }
  s.rx = !['ninguno', 'porMov', 'porRonda'].includes(st.r) && !kR && !!W.rx;
  const esc2 = W.base && W.nivel && W.nivel!=='rx';   // versión escalada: su récord va aparte del Rx
  if(W.base && W.nivel){ s.nivel = W.nivel; const M = metaWod(W.base, W.nivel); if(M){ s.enMeta = enMetaDe(s, M); } }
  if(s.valor!=null && s.titulo && u) s.recs.push({ej:'wod:' + s.titulo + (esc2 ? ':' + W.nivel : ''), nombre:s.titulo + (esc2 ? ' (' + NOM_NIVEL[W.nivel] + ')' : ''), u, valor:s.valor, txt:s.txt});
  return s;
}
const LEGADO_1RM = {sentadilla:'sentadilla', peso_muerto:'pesomuerto', banca:'banca', press:'militar', envion:'envion'};
function unoASesion(s, U){
  const m = movDe(U.mov) || {id:null, n:U.n, c:U.c}, clave = m.id || 'x_' + sinTildes(m.n).replace(/[^a-z0-9]+/g, '_');
  const M = metodoDe(U.c, U.metodo), metodo = M && !['libre', 'max'].includes(M[0]) ? M[1] : '';
  s.tipo = 'uno'; s.desc = m.n; s.metodo = metodo || null; if(!s.titulo) s.titulo = m.n + (metodo ? ' · ' + metodo : '');
  if(U.c==='peso'){
    const ok = U.series.filter(x=>num(x.peso)!=null).map(x=>({reps:ent(x.reps) || 1, peso:x.peso, kg:aKg(x.peso, U.pesoU)}));
    if(ok.length){
      s.txt = ok.map(x=>x.reps + ' × ' + coma(x.peso)).join(', ') + ' ' + (U.pesoU || 'kg');
      s.valor = Math.max(...ok.map(x=>x.kg));
      const mejor = {}; ok.forEach(x=>{ if(!mejor[x.reps] || x.kg > mejor[x.reps].kg) mejor[x.reps] = x; });
      Object.values(mejor).forEach(x=>s.recs.push({ej:x.reps===1 && LEGADO_1RM[clave] ? LEGADO_1RM[clave] : 'rm:' + clave + ':' + x.reps,
        nombre:m.n + (x.reps===1 ? ' (1RM)' : ' (mejor serie de ' + x.reps + ')'), u:'kg', valor:x.kg, txt:coma(x.peso) + ' ' + (U.pesoU || 'kg')}));
    }
  }
  if(U.c==='dist'){
    const mt = metros(U.dist, U.distU), t = PSF.leerTiempo(U.tiempo), kg = num(U.peso);
    if(mt){ s.desc = fmtMetros(mt) + ' de ' + m.n.toLowerCase();
      s.txt = t!=null ? PSF.verTiempo(t) + ' (' + PSF.verTiempo(t / (mt/1000)) + '/km)' : fmtMetros(mt);
      if(kg) { s.txt += ' · ' + coma(kg) + ' kg'; s.desc += ' con ' + coma(kg) + ' kg'; } }
    if(mt && t!=null){
      s.valor = t;
      const esp = clave==='carrera' ? {2400:'psf2400', 5000:'5k', 10000:'10k'}[mt] : clave==='marcha' && mt===10000 ? 'marcha10' : null;
      s.recs.push({ej:esp || 'dist:' + clave + ':' + mt, nombre:esp==='psf2400' ? 'Carrera 2.400 m' : m.n + ' ' + fmtMetros(mt), u:'tiempo', valor:t, txt:PSF.verTiempo(t)});
    }
  }
  if(U.c==='cuerpo' && U.seriesR){
    const rs = U.seriesR.map(ent).filter(x=>x!=null);
    if(rs.length){ const tot = rs.reduce((a, b)=>a + b, 0); s.valor = tot; s.txt = rs.length + ' series: ' + rs.join(', ') + ' (' + tot + ' rep)'; }
  } else if(U.c==='cuerpo'){
    const n = ent(U.reps), lim = String(U.lim || '');
    if(n!=null){
      s.valor = n; s.txt = n + ' repeticiones' + (lim ? ' en ' + PSF.verTiempo(+lim) : '');
      const esp = clave==='abdominales' && lim==='60' ? 'abd1' : clave==='barras' && !lim ? 'barras' : (clave==='flexiones' || clave==='flexiones_rod') && lim==='60' ? 'flex1' : null;
      s.recs.push({ej:esp || 'reps:' + clave + ':' + (lim || 0), nombre:m.n + (lim ? ' en ' + PSF.verTiempo(+lim) : ' (máximo)'), u:'reps', valor:n, txt:n + ' rep'});
    }
  }
  if(U.c==='cal'){
    const n = ent(U.cal), t = PSF.leerTiempo(U.tiempo);
    if(n!=null){
      s.valor = n; s.txt = n + ' cal' + (t!=null ? ' en ' + PSF.verTiempo(t) : '');
      if(t!=null) s.recs.push({ej:'cal:' + clave + ':' + t, nombre:m.n + ' en ' + PSF.verTiempo(t), u:'cal', valor:n, txt:n + ' cal'});
    }
  }
  if(U.c==='tiempo'){
    const t = PSF.leerTiempo(U.tiempo);
    if(t!=null){ s.valor = t; s.txt = PSF.verTiempo(t); s.recs.push({ej:'tmax:' + clave, nombre:m.n + ' (tiempo máximo)', u:'tmax', valor:t, txt:PSF.verTiempo(t)}); }
  }
  if(metodo) s.desc = metodo + ' · ' + s.desc;
  if(W.base && W.nivel) s.nivel = W.nivel;
  return s;
}
async function guardarRegistro(){
  if(!esPlus() && !W.soloPlan && W.fecha < desdeGratis()) return pantallaPlus('historial', guardarRegistro);   // gratis: hasta 7 días atrás (plus.js)
  const s = aSesion(W), nuevo = !s.id && !(s.fecha > hoyISO() || W.soloPlan), antes = nuevo ? antesDeGuardar() : null;   // para la celebración
  delete $('#dialogo').dataset.reg; clearTimeout(tBorr); quitarBorrador(W.bid);   // ya no es borrador (sus fotos pasan al entrenamiento)
  { const t = PSF.leerTiempo(W.dur); s.dur = t ? Math.max(1, Math.round(t / 60)) : ent(W.dur) || null; } s.fc = ent(W.fc) || null; s.musica = String(W.musica || '').trim() || null; s.musicaUrl = W.musicaUrl || null; s.musicaArt = W.musicaArt || null; s.musicaAlbum = W.musicaAlbum || null; s.musicaImg = W.musicaImg || null; s.sens = ent(W.sens) || null;
  s.fotos = (W.fotosExist || []).slice();
  for(const b of fotosPend){ const id = 'f' + uid(); try{ await fotoGuardar(id, b); s.fotos.push(id); }catch(e){ aviso('No se pudo guardar una foto en este equipo'); } }
  fotosPend = [];
  { const antes = s.id && S.sesiones.find(x=>x.id===s.id);   // fotos quitadas al editar: se borran del equipo
    if(antes) (antes.fotos || []).filter(id=>!s.fotos.includes(id)).forEach(id=>fotoBorrar(id).catch(()=>{})); }
  if(!s.id && (s.fecha > hoyISO() || W.soloPlan)){
    S.planificadas = (S.planificadas || []).filter(p=>p.id!==W.planId);
    S.planificadas.push({id:uid(), fecha:s.fecha, titulo:s.titulo, notas:s.notas, w:s.w, t:plantillaDe(s.w), creado:Date.now()});
    guardar(); aviso('🗓 Planificado para el ' + verFecha(s.fecha) + (s.fecha > hoyISO() ? ': regístralo ese día' : '')); ir(vistaActual==='reloj' ? 'hoy' : vistaActual); return;
  }
  if(W.planId) S.planificadas = (S.planificadas || []).filter(p=>p.id!==W.planId);
  s.recs.forEach(r=>avisarRecord(r.ej, r.valor, s.id, r));
  if(s.id) S.sesiones = S.sesiones.map(x=>x.id===s.id ? Object.assign(x, s) : x);
  else { s.id = uid(); s.creado = Date.now(); S.sesiones.push(s); }
  if(W.fav){ const t = plantillaDe(s.w), k = JSON.stringify(t);
    if(!S.favoritos.some(f=>JSON.stringify(f.w)===k)) S.favoritos.push({id:uid(), w:t}); }
  guardar();
  if($('#aviso').hidden || !($('#aviso').dataset.t || '').startsWith('🏆')) aviso('Entrenamiento guardado');
  ir(vistaActual==='reloj' ? 'hoy' : vistaActual);
  if(nuevo) celebrarGuardado(s, antes);
}
/* Registrar un entrenamiento planificado: abre el registro con su estructura; al guardar sale de la lista de planificados */
function registrarPlanificado(p){
  abrirRegistro({}); cargarPlantilla(p.t);
  W.planId = p.id; W.titulo = p.titulo || W.titulo; W.notas = p.notas || ''; W.fecha = p.fecha <= hoyISO() ? p.fecha : hoyISO();
}
function editarRegistro(s){ abrirRegistro(Object.assign(clon(s.w), {id:s.id, dur:s.dur || '', fc:s.fc || '', musica:s.musica || '', musicaUrl:s.musicaUrl || null, musicaArt:s.musicaArt || null, musicaAlbum:s.musicaAlbum || null, musicaImg:s.musicaImg || null, sens:s.sens || null, fotosExist:(s.fotos || []).slice(), paso:s.w.modo==='uno' ? 'uno' : 'multi', volver:['inicio']})); }
function repetirRegistro(s){ const t = plantillaDe(s.w); abrirRegistro({}); cargarPlantilla(t); }
