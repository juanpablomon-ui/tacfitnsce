/* #NSCE — Escalamiento de los WOD (23-oct-2026, pedido del usuario tras revisar cómo se escala: «haz la 1 y la 3»).
   Idea de CrossFit: escalar es mantener el estímulo (la intención y el tiempo del WOD), no hacerlo «fácil». Cada WOD de la biblioteca tiene
   3 versiones —Rx, Intermedio y Principiante— armadas con reglas (`escalarWod`): carga (Intermedio ~75 %, Principiante ~55 %; mujeres ~70 % del
   Rx), repeticiones y distancias según el volumen, y cambio de ejercicio por otro del mismo patrón (`SUST`). La intención y el tiempo meta
   salen de una tabla de los WOD conocidos (`META_WOD`) o del «método matemático» (`estimarSeg`: tiempo por repetición, metro o caloría; el lento
   es el doble del rápido). Al registrar se marca la versión (`s.nivel`) y si quedó dentro de la meta (`s.enMeta`); la próxima vez se sugiere
   subir o bajar (`nivelSugerido`). */
const NIVELES_WOD = [['rx', 'Rx'], ['int', 'Intermedio'], ['pri', 'Principiante']];
const NOM_NIVEL = {rx:'Rx', int:'Intermedio', pri:'Principiante'};
/* Tiempo meta de WOD conocidos (minutos, versión Rx) o rondas para AMRAP */
const META_WOD = {Fran:[3, 8], Grace:[2, 6], Isabel:[2, 6], Diane:[4, 10], Elizabeth:[5, 12], Helen:[8, 14], Karen:[6, 12], Annie:[8, 15], DT:[8, 15],
  Murph:[40, 70], Jackie:[7, 12], Nancy:[12, 20], Kelly:[25, 40], Amanda:[4, 10], Barbara:[30, 45], Eva:[35, 60], Angie:[15, 30], Linda:[18, 35],
  Cindy:{r:[12, 20]}, Mary:{r:[8, 15]}};
/* Cambios de ejercicio por nivel: [id, factor de repeticiones] (mismo patrón de movimiento) */
const SUST = {
  barras:{int:['barras', 0.6], pri:['remo_anillas', 1]}, barras_kipping:{int:['barras', 0.7], pri:['remo_anillas', 1]}, barras_butterfly:{int:['barras', 0.7], pri:['remo_anillas', 1]},
  barras_lastre:{int:['barras', 1], pri:['remo_anillas', 1]}, barras_estrictas:{int:['barras', 0.8], pri:['remo_anillas', 1]}, barras_pecho:{int:['barras', 1], pri:['remo_anillas', 1]}, burpee_dominada:{int:['burpees', 1], pri:['burpees', 0.7]},
  muscle_up:{int:['barras_pecho', 2], pri:['remo_anillas', 3]}, muscle_up_anillas:{int:['barras_pecho', 2], pri:['remo_anillas', 3]},
  hspu:{int:['flexiones_pike', 1], pri:['flexiones', 1]}, hspu_estrictas:{int:['flexiones_pike', 1], pri:['flexiones', 1]},
  toes:{int:['rodillas_codos', 1], pri:['abdominales', 1]}, ghd:{int:['abd_abmat', 1], pri:['abdominales', 1]},
  dobles:{int:['dobles', 0.5], pri:['cuerda', 2]}, triples:{int:['dobles', 1], pri:['cuerda', 3]},
  subida_cuerda:{int:['subida_cuerda', 0.6], pri:['remo_anillas', 5]}, subida_cuerda_sin:{int:['subida_cuerda', 1], pri:['remo_anillas', 5]},
  pistol:{int:['subida_cajon', 1], pri:['sentadilla_aire', 1.5]}, cajon:{int:['cajon', 1], pri:['subida_cajon', 1]}, cajon_sobre:{int:['cajon', 1], pri:['subida_cajon', 1]},
  burpee_cajon:{int:['burpees', 1], pri:['burpees', 0.7]}, burpee_barra:{int:['burpees', 1], pri:['burpees', 0.7]},
  fondos_anillas:{int:['fondos', 1], pri:['fondos_banco', 1]}, fondos:{int:['fondos', 0.6], pri:['fondos_banco', 1]},
  flexiones:{pri:['flexiones_rod', 1]}, flexiones_mano:{pri:['flexiones_rod', 1]},
};
/* Segundos por repetición, metro o caloría (ritmo de un atleta rápido; el «método matemático» de CrossFit) */
const SEG_REP = {barras:2.5, barras_pecho:2.8, flexiones:2, sentadilla_aire:1.8, burpees:4, thruster:3, envion:4, peso_muerto:2.5, kb_swing:2.2, wall_ball:3,
  dobles:0.6, cuerda:0.4, cajon:3, toes:2.5, hspu:3, muscle_up:5, muscle_up_anillas:5.5, subida_cuerda:15, abdominales:2, cargada:3.5, arranque:3.5, remo_anillas:2.2};
const SEG_GRUPO = {gim:2.5, barra:3, mc:2.5, core:2, mono:2, mil:3};
const SEG_M = {carrera:0.27, remo:0.22, caminata:0.6, bici_aire:0.12, farmer:0.9, yugo:1, carrera_tenida:0.33};
function rondasDe(t){
  const p = Object.assign({}, typeof PDEF!=='undefined' ? PDEF : {}, t.params || {});
  if(t.estilo==='esquema'){ const n = String(p.esquema || '').split(/[^\d]+/).map(Number).filter(Boolean); return {reps:n.reduce((a, b)=>a + b, 0), n:n.length}; }
  if(/rft|rondas/.test(t.estilo) || (t.params && t.params.rondas)) return {veces:+p.rondas || 1};
  return {veces:1};
}
function segMov(m){ const mv = movDe(m.mov) || {g:'gim'};
  if(m.dist){ const mt = metros(m.dist, m.distU || 'm'); return mt * (SEG_M[m.mov] || (mv.g==='mil' ? 0.9 : 0.3)); }
  if(m.cal) return +m.cal * 4; if(m.tiempo && !m.reps) return (typeof PSF!=='undefined' && PSF.leerTiempo(m.tiempo)) || 30;
  return null; }
/* Segundos estimados del WOD (rápido) o de una ronda (AMRAP) */
function estimarSeg(t){
  const R = rondasDe(t), mains = (t.main || []).filter(m=>!m.descanso), extra = (t.in || []).concat(t.out || []).filter(m=>!m.descanso);
  const repSeg = m=>SEG_REP[m.mov] || SEG_GRUPO[(movDe(m.mov) || {g:'gim'}).g] || 2.5;
  let ronda = 0; mains.forEach(m=>{ const s = segMov(m); ronda += s!=null ? s : (+m.reps || 0) * repSeg(m); ronda += 8; });
  if(R.reps){ ronda = 0; mains.forEach(m=>{ const s = segMov(m); ronda += (s!=null ? s * R.n : R.reps * repSeg(m)) + 8 * R.n; }); }
  const fuera = extra.reduce((a, m)=>{ const s = segMov(m); return a + (s!=null ? s : (+m.reps || 0) * repSeg(m)); }, 0);
  return {ronda, total:ronda * (R.veces || 1) + fuera};
}
/* Intención y meta de un WOD en la versión pedida */
function metaWod(t, nivel){
  if(!t || t.uno || !(t.main || []).length) return null;
  const st = typeof estiloDe==='function' ? estiloDe(t.estilo) : null, p = Object.assign({}, typeof PDEF!=='undefined' ? PDEF : {}, t.params || {}), conocido = META_WOD[t.titulo];
  if(t.estilo==='amrap' || (st && st.r==='rondas')){ const min = +p.minutos || 20, E = estimarSeg(t);
    let r = conocido && conocido.r ? conocido.r.slice() : E.ronda ? [Math.max(1, Math.round(min * 60 / E.ronda / 2)), Math.max(2, Math.round(min * 60 / E.ronda))] : null;
    return {tipo:'rondas', min, rondas:r, int:min <= 8 ? 'Corto e intenso' : min <= 15 ? 'Intensidad media: ritmo que puedas sostener' : 'Largo y sostenido: no te detengas'}; }
  if(/cada_ronda|intervalos/.test(t.estilo || '')){   // series: la meta es por repetición, parejas entre sí
    const r1 = estimarSeg(Object.assign({}, t, {params:Object.assign({}, t.params, {rondas:'1'})})).ronda - 8; if(!(r1 > 0)) return null;
    return {tipo:'serie', rep:[Math.round(r1), Math.round(r1 * 1.3)], int:'Series: el mismo ritmo en todas las repeticiones'}; }
  if(st && !['tiempo', 'tiempos'].includes(st.r) && t.estilo!=='por_tiempo' && t.estilo!=='esquema' && !/rft/.test(t.estilo)) return null;
  let rango = conocido && !conocido.r ? conocido.slice() : null;
  if(!rango){ const s = estimarSeg(t).total; if(!s) return null; const f = Math.max(1, Math.round(s / 60)); rango = [f, f * 2]; }
  const r = rango[1];
  return {tipo:'tiempo', rango, int:r <= 8 ? 'Corto e intenso: casi sin pausas' : r <= 15 ? 'Intensidad media: pausas cortas' : r <= 25 ? 'Sostenido: ritmo parejo' : 'Largo: administra el ritmo'};
}
/* Redondeo de cargas como en el box */
const KB_KG = [4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48];
function redondearCarga(v, u, mov){
  if(u==='lb') return Math.max(5, Math.round(v / 5) * 5);
  if(/^kb_/.test(mov)) return KB_KG.reduce((a, b)=>Math.abs(b - v) < Math.abs(a - v) ? b : a, KB_KG[0]);
  if(mov==='wall_ball') return Math.max(3, Math.round(v));
  const g = (movDe(mov) || {}).g; return g==='barra' ? Math.max(15, Math.round(v / 2.5) * 2.5) : Math.max(2.5, Math.round(v / 2.5) * 2.5);
}
const sexoMujer = ()=>S.perfil.sexo==='M';
/* Versión escalada de una plantilla */
function escalarWod(t, nivel){
  const w = clon(t);
  if(w.uno){   // un movimiento (trote, marcha con carga…): distancia y carga
    if(nivel!=='rx'){ const u = w.uno, kD = nivel==='int' ? 0.75 : 0.5, d = num(u.dist);
      if(d){ const v = d * kD; u.dist = String(u.distU==='km' ? Math.max(1, Math.round(v * 2) / 2) : Math.round(v / 50) * 50).replace('.', ','); }
      if(num(u.peso)) u.peso = String(redondearCarga(num(u.peso) * (nivel==='int' ? 0.75 : 0.55) * (sexoMujer() ? 0.7 : 1), u.pesoU || 'kg', u.mov)).replace('.', ','); }
    else if(sexoMujer() && num(w.uno.peso)) w.uno.peso = String(redondearCarga(num(w.uno.peso) * 0.7, w.uno.pesoU || 'kg', w.uno.mov)).replace('.', ',');
    w.nivel = nivel; return w; }
  if(!w.main) return w;
  const series = /cada_ronda|intervalos/.test(w.estilo || '') && (w.main || []).some(m=>m.dist);   // series de carrera: se baja el número de repeticiones, no la distancia
  const fc = {rx:1, int:0.75, pri:0.55}[nivel] * (sexoMujer() ? 0.7 : 1);
  const tot = rondasDe(w), vol = (w.main || []).reduce((a, m)=>a + (+m.reps || 0), 0) * (tot.veces || 1) + (tot.reps || 0) * (w.main || []).length;
  const esAmrap = w.estilo==='amrap' || /emom/.test(w.estilo || '');
  const fr = nivel==='rx' ? 1 : esAmrap ? (nivel==='pri' ? 0.8 : 1) : vol >= 150 ? (nivel==='pri' ? 0.5 : 0.7) : (nivel==='pri' ? 0.7 : 1);
  const escR = (v, f)=>v ? String(Math.max(1, Math.round(+v * f))) : v;
  const cambiar = m=>{ if(m.descanso) return m; const x = Object.assign({}, m);
    const s = nivel!=='rx' && SUST[x.mov] && SUST[x.mov][nivel]; let f = fr;
    if(s){ const [id, k] = s; if(id!==x.mov){ x.mov = id; x.n = movDe(id).n; } f = fr * k; }
    if(x.reps) x.reps = escR(x.reps, f);
    if(x.cal) x.cal = escR(x.cal, nivel==='rx' ? 1 : nivel==='int' ? 0.8 : 0.6);
    if(x.dist && nivel!=='rx' && !series){ const k = nivel==='pri' ? 0.5 : metros(x.dist, x.distU || 'm') >= 1600 ? 0.75 : 1; if(k!==1) x.dist = String(Math.round(+String(x.dist).replace(',', '.') * k * 10) / 10).replace('.', ','); }
    if(x.peso && num(x.peso)!=null && (nivel!=='rx' || sexoMujer())) x.peso = String(redondearCarga(num(x.peso) * fc, x.pesoU, x.mov)).replace('.', ',');
    return x; };
  ['in', 'main', 'out'].forEach(k=>{ if(w[k]) w[k] = w[k].map(cambiar); });
  if(w.estilo==='esquema' && w.params && w.params.esquema && fr!==1) w.params.esquema = String(w.params.esquema).split('-').map(n=>Math.max(1, Math.round(+n * fr))).join('-');
  if(series && w.params && w.params.rondas && nivel!=='rx') w.params.rondas = String(Math.max(2, Math.round(+w.params.rondas * (nivel==='int' ? 0.75 : 0.5))));
  else if(w.params && w.params.rondas && nivel==='pri' && +w.params.rondas >= 5 && !esAmrap) w.params.rondas = String(Math.max(2, Math.round(+w.params.rondas * 0.6)));
  w.nivel = nivel;
  return w;
}
/* Si terminó dentro de la meta: 'rapido' | 'ok' | 'lento' (por tiempo) o según rondas (AMRAP) */
function enMetaDe(s, M){
  if(!M || s.valor==null) return null;
  if(M.tipo==='tiempo'){ const v = s.valor / 60; return v < M.rango[0] ? 'rapido' : v > M.rango[1] ? 'lento' : 'ok'; }
  if(M.tipo==='rondas' && M.rondas){ const v = s.valor; return v < M.rondas[0] ? 'lento' : v > M.rondas[1] * 1.1 ? 'rapido' : 'ok'; }
  return null;
}
/* Versión sugerida para un WOD: la última que hizo, ajustada por cómo le fue; si nunca lo hizo, según su nivel de la bienvenida */
function nivelSugerido(titulo){
  const ult = S.sesiones.filter(s=>s.titulo===titulo && s.nivel).sort((a, b)=>a.fecha < b.fecha ? 1 : -1)[0], orden = ['pri', 'int', 'rx'];
  if(ult){ const i = orden.indexOf(ult.nivel);
    if(ult.enMeta==='lento' && i > 0) return {nivel:orden[i - 1], por:`La última vez (${NOM_NIVEL[ult.nivel]}, ${ult.txt}) quedaste sobre la meta: baja un nivel o el peso.`};
    if(ult.enMeta==='rapido' && i < 2) return {nivel:orden[i + 1], por:`La última vez (${NOM_NIVEL[ult.nivel]}, ${ult.txt}) te sobró: prueba ${NOM_NIVEL[orden[i + 1]]}.`};
    return {nivel:ult.nivel, por:`La última vez hiciste ${NOM_NIVEL[ult.nivel]} (${ult.txt}).`}; }
  const nb = S.perfil.nivelBien; return {nivel:nb==='inicio' ? 'pri' : nb==='medio' ? 'int' : 'rx', por:nb ? 'Según tu nivel.' : ''};
}
const textoMeta = M=>!M ? '' : M.tipo==='serie' ? `cada repetición ${PSF.verTiempo(M.rep[0])}–${PSF.verTiempo(M.rep[1])}` : M.tipo==='tiempo' ? `meta ${M.rango[0]}–${M.rango[1]} min` : M.rondas ? `meta ${M.rondas[0]}–${M.rondas[1]} rondas en ${M.min} min` : `${M.min} min`;
/* Bloque del registro: elegir versión, intención y meta, sugerencia */
function htmlVersionWod(){
  if(!W.base) return '';
  const M = metaWod(W.base, W.nivel), sg = nivelSugerido(W.base.titulo);
  return `<div class="ver-wod"><div class="segmentos" id="wNivel">${NIVELES_WOD.map(([k, n])=>`<button data-niv="${k}" class="${W.nivel===k ? 'activa' : ''}">${n}${sg.nivel===k && esPlus() ? ' ★' : ''}${k!=='rx' && !esPlus() ? ' <span class="plus-mini">PLUS</span>' : ''}</button>`).join('')}</div>
    ${M ? `<div class="vw-meta">🎯 <b>${esc(M.int)}</b> · ${textoMeta(M)}${W.nivel!=='rx' ? ' (como Rx)' : ''}</div>` : ''}
    ${sg.por ? `<div class="suave chico">★ ${esc(sg.por)}</div>` : ''}
    <div class="suave chico">${W.base.uno ? (W.nivel==='rx' ? 'Como está indicado.' : W.nivel==='int' ? 'Intermedio: ~75 % de la distancia (o del tiempo indicado) y de la carga.' : 'Principiante: ~50 % de la distancia (o del tiempo) y ~55 % de la carga.') : W.nivel==='rx' ? (sexoMujer() ? 'Rx con las cargas de mujer (~70 %).' : 'Como está indicado.') : W.nivel==='int' ? 'Intermedio: ~75 % de la carga y ejercicios más simples donde hace falta.' : 'Principiante: ~55 % de la carga, menos volumen y ejercicios básicos.'} Busca terminar dentro de la meta: si vas a demorar mucho más, escala.</div></div>`;
}
function aplicarNivel(nivel){
  const t = escalarWod(W.base, nivel); W.nivel = nivel; W.rx = nivel==='rx';
  if(t.uno){ if(W.uno){ W.uno.dist = t.uno.dist || ''; W.uno.peso = t.uno.peso || ''; } return; }
  W.params = paramsDe(t.estilo, t.params); W.secc = {in:clon(t.in || []), main:clon(t.main || []), out:clon(t.out || [])};
}
/* Línea corta para tarjetas (WOD del día) */
function lineaEscala(t){
  if(!t) return ''; const M = t.uno ? null : metaWod(t, 'rx'), sg = nivelSugerido(t.titulo);
  if(!M){ return t.linea && (sg.nivel!=='rx' || sg.por) ? `<div class="vw-linea chico">Versiones Rx · Intermedio · Principiante · sugerido: <b>${NOM_NIVEL[sg.nivel]}</b></div>` : ''; }
  return `<div class="vw-linea chico">🎯 ${esc(M.int.split(':')[0])} · ${textoMeta(M)}${sg.nivel!=='rx' || sg.por ? ` · sugerido: <b>${NOM_NIVEL[sg.nivel]}</b>` : ''}</div>`;
}
/* ¿La plantilla es el WOD de la biblioteca o una de sus 3 versiones? (mismos ejercicios en el mismo orden) */
const claveWod = t=>['in', 'main', 'out'].map(k=>(t[k] || []).map(m=>m.descanso ? '-' : m.mov).join(',')).join('|');
function mismoWod(t, base){ const k = claveWod(t); return ['rx', 'int', 'pri'].some(n=>claveWod(escalarWod(base, n))===k); }
