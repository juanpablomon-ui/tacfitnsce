/* #NSCE — Mi plan: objetivo (militar, deportivo o general) con fecha opcional, fases (base, desarrollo, específico,
   afinamiento), mesociclos 3:1 (3 semanas de carga + 1 de descarga, NSCA), de 2 a 7 días por semana con la sesión larga el fin de
   semana y sin días duros seguidos, descanso activo planificado, cumplimiento y proyección de la forma física si se cumple.
   Afinamiento: −40 a −60 % de volumen manteniendo la intensidad (Bosquet 2007, Mujika). Lo principal es la instrucción física
   para el combate y el entrenamiento personal; la PSF es solo un antecedente. */
const OBJ_PLAN = [
  {id:'combate', g:'Militar', ic:'🎖️', n:'Preparación para el combate', d:'Las 7 capacidades del combatiente: fuerza, resistencia, potencia y carga.', sinFecha:true},
  {id:'marcha', g:'Militar', ic:'🥾', n:'Marcha con carga', subs:['10 km', '20 km', '32 km'], d:'Progresión de distancia y carga.'},
  {id:'carrera', g:'Deportivo', ic:'🏃', n:'Carrera', subs:['5 km', '10 km', 'Media maratón', 'Maratón'], d:'Rodaje largo, intervalos y tempo.'},
  {id:'triatlon', g:'Deportivo', ic:'🏊', n:'Triatlón', subs:['Sprint', 'Olímpico', 'Medio Ironman'], d:'Nado, bicicleta, carrera y transiciones.'},
  {id:'montana', g:'Deportivo', ic:'⛰️', n:'Montaña', subs:['Trekking de varios días', 'Ascenso de alta montaña', 'Trail (carrera de montaña)'], d:'Desnivel con mochila y piernas para la bajada.'},
  {id:'fuerza', g:'General', ic:'🏋️', n:'Fuerza', subs:['Fuerza máxima', 'Masa muscular'], d:'Pierna, empuje y tracción.', sinFecha:true},
  {id:'mantener', g:'General', ic:'⚖️', n:'Mantener la forma', d:'Equilibrio de fuerza, resistencia y movilidad.', sinFecha:true},
  {id:'propio', g:'Personal', ic:'✍️', n:'Mi plan a mi gusto', d:'Tú eliges qué hacer cada día, en ciclos de 1 a 4 semanas.', sinFecha:true},
];
/* Sesiones por objetivo en orden de prioridad (con menos días se toman las primeras). largo = sesión larga del fin de semana. */
const S_ = (n, min, rpe, d, o)=>Object.assign({n, min, rpe, d:d || ''}, o || {});
const CATALOGO = {
  combate:[S_('Fuerza funcional', 50, 7, 'Sentadilla, peso muerto, press y tracciones: 4-5 series de 5 a 8.', {pop:'5×5 · día A', cap:'Fuerza'}),
    S_('Marcha táctica con carga', 60, 6, 'Mochila de 15-25 % de tu peso a paso sostenido.', {largo:true, pop:'Sesión A · Marcha táctica con carga progresiva', cap:'Aeróbica'}),
    S_('Intervalos de alta intensidad', 40, 8, '4 × 4 min fuertes con 3 min de trote suave.', {pop:'Noruego 4×4', cap:'Umbral'}),
    S_('Circuito de combate', 45, 8, 'Arrastres, cargas, burpees, barras y desplazamientos.', {pop:'Sesión B · Circuito de combate integrado', cap:'R. muscular'}),
    S_('Trote base (zona 2)', 40, 4, 'Continuo cómodo: puedes conversar.', {pop:'Zona 2 · 45 min', cap:'Aeróbica'}),
    S_('Potencia y velocidad', 35, 8, 'Sprints cortos, saltos y lanzamientos con pausa completa.', {pop:'Cuestas 10 × 10 s', cap:'Potencia'}),
    S_('Anaeróbica con carga', 35, 9, 'Desplazamientos rápidos con carga variable y evacuación.', {pop:'Sesión C · Desplazamiento rápido con carga variable', cap:'Anaeróbica'})],
  marcha:[S_('Marcha larga con carga', 75, 6, 'Sube la distancia o la carga cada semana, nunca ambas a la vez.', {largo:true, pop:'Marcha 10 km'}),
    S_('Fuerza de piernas y tronco', 45, 7, 'Sentadilla, zancadas, subida al cajón con carga y peso muerto.', {pop:'5×5 · día B'}),
    S_('Trote base (zona 2)', 40, 4, 'Continuo cómodo.', {pop:'Zona 2 · 45 min'}),
    S_('Cuestas', 35, 8, 'Subidas rápidas caminando o trotando; bajar suave.', {pop:'Cuestas 10 × 10 s'}),
    S_('Marcha rápida sin carga', 45, 5, 'Paso exigente, sin mochila.'),
    S_('Core y estabilidad', 25, 5, 'Plancha, carga de maletas, puente de glúteo y bird dog.'),
    S_('Circuito de resistencia muscular', 40, 7, 'Circuito con peso corporal y carga.', {pop:'Circuito de combate'})],
  carrera:[S_('Rodaje largo', 60, 5, 'Continuo suave: el más largo de la semana.', {largo:true, pop:'Continuo extensivo · 45-90 min'}),
    S_('Intervalos', 45, 8, 'Repeticiones a ritmo de 5 km con pausa de trote.', {pop:'Yasso 800'}),
    S_('Tempo (umbral)', 40, 7, '20-30 min a ritmo «cómodamente duro».', {pop:'Tempo 20 min'}),
    S_('Rodaje suave', 35, 4, 'Zona 2.', {pop:'Zona 2 · 45 min'}),
    S_('Fuerza para corredores', 40, 6, 'Sentadilla, zancadas, peso muerto rumano, gemelos y core.'),
    S_('Fartlek', 40, 7, 'Cambios de ritmo libres.', {pop:'Fartlek sueco 30 min'}),
    S_('Rodaje regenerativo', 30, 3, 'Muy suave.')],
  triatlon:[S_('Bicicleta larga', 90, 5, 'Continuo en zona 2.', {largo:true}),
    S_('Nado: técnica y series', 45, 6, 'Técnica y series de 100-200 m.'),
    S_('Carrera con intervalos', 40, 8, 'Repeticiones de 3-5 min.', {pop:'Interválico extensivo medio'}),
    S_('Transición (bici + carrera)', 60, 7, 'Bici 40 min y de inmediato 15-20 min de carrera.'),
    S_('Nado continuo', 40, 5, 'Distancia continua a ritmo de prueba.'),
    S_('Bicicleta con intervalos', 50, 8, '5 × 5 min fuertes con 3 min suaves.'),
    S_('Carrera larga suave', 50, 5, 'Zona 2.')],
  montana:[S_('Caminata larga con mochila y desnivel', 120, 6, 'Cerro o escaleras con la mochila que usarás; sube el desnivel cada semana.', {largo:true}),
    S_('Fuerza de piernas (bajadas)', 45, 7, 'Sentadilla, zancadas y bajada lenta del cajón: protege las rodillas en el descenso.'),
    S_('Cuestas o escaleras', 40, 8, 'Repeticiones en subida.', {pop:'Cuestas 10 × 10 s'}),
    S_('Trote base (zona 2)', 45, 4, 'Continuo cómodo.', {pop:'Zona 2 · 45 min'}),
    S_('Core y estabilidad', 25, 5, 'Plancha, equilibrio en una pierna y carga de maletas.'),
    S_('Escaladora o step con carga', 40, 6, 'Subir y bajar con mochila.'),
    S_('Movilidad de tobillo y cadera', 20, 3, 'Para terreno irregular.')],
  fuerza:[S_('Pierna pesada', 60, 8, 'Sentadilla y accesorios.', {pop:'5×5 · día A'}),
    S_('Empuje (pecho y hombros)', 50, 7, 'Press banca, press militar y fondos.'),
    S_('Tracción (espalda)', 50, 7, 'Barras, remos y peso muerto rumano.', {pop:'Método de repeticiones · barras'}),
    S_('Pierna y peso muerto', 55, 8, 'Peso muerto y sentadilla frontal.', {pop:'5×5 · día B'}),
    S_('Acondicionamiento metabólico', 25, 8, 'Circuito corto e intenso.', {pop:'Cindy'}),
    S_('Tren superior volumen', 50, 7, 'Series de 8-12.'),
    S_('Trote base (zona 2)', 30, 4, 'Recuperación y corazón.')],
  mantener:[S_('Fuerza total', 50, 7, 'Pierna, empuje y tracción.', {pop:'5×5 · día A'}),
    S_('Intervalos', 35, 8, '4 × 4 min fuertes.', {pop:'Noruego 4×4'}),
    S_('Trote base (zona 2)', 40, 4, 'Continuo cómodo.', {largo:true, pop:'Zona 2 · 45 min'}),
    S_('Circuito funcional', 30, 8, 'Carrera, kettlebell y barras.', {pop:'Helen'}),
    S_('Fuerza 2', 45, 7, 'Peso muerto y press.', {pop:'5×5 · día B'}),
    S_('Deporte o actividad libre', 60, 5, 'Fútbol, nado, cerro, bici…'),
    S_('Movilidad y core', 25, 3, 'Movilidad completa y abdomen.')],
};
/* Duración a la que llega la sesión larga al final de la fase específica */
const PICO = {carrera:{'5 km':50, '10 km':75, 'Media maratón':110, 'Maratón':150}, marcha:{'10 km':120, '20 km':200, '32 km':300},
  triatlon:{'Sprint':90, 'Olímpico':150, 'Medio Ironman':240}, montana:{'Trekking de varios días':300, 'Ascenso de alta montaña':360, 'Trail (carrera de montaña)':180}};
const DIAS_DEF = {2:[1, 5], 3:[0, 2, 5], 4:[0, 1, 3, 5], 5:[0, 1, 3, 4, 5], 6:[0, 1, 2, 3, 4, 5], 7:[0, 1, 2, 3, 4, 5, 6]};
const DIAS_C = ['L', 'M', 'M', 'J', 'V', 'S', 'D'], DIAS_N = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const FASES = {base:['Base', '#35b6e8'], des:['Desarrollo', '#6fd06a'], esp:['Específico', '#f2a33a'], afi:['Afinamiento', '#b48cf0'], man:['Mantenimiento', '#6fd06a'], pers:['Personal', '#e0b63c']};
const objDe = id=>OBJ_PLAN.find(o=>o.id===id);
const lunesDe = f=>{ const d = new Date(f + 'T12:00:00'); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return iso(d); };
const masDias = (f, n)=>{ const d = new Date(f + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); };
const diasEntre = (a, b)=>Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
const r5 = x=>Math.max(10, Math.round(x / 5) * 5);

/* Semana i del plan → fase, descarga y avance (0 a 1). Las semanas se cuentan hasta el día ANTES de la fecha: si la prueba cae lunes,
   la última semana (afinamiento) es la anterior completa y no solo el día de la prueba (26-oct-2026). */
function infoSemana(i){
  if(S.plan.obj==='propio'){ const P = S.plan, N = P.fecha ? Math.max(1, Math.floor(diasEntre(P.inicio, lunesDe(masDias(P.fecha, -1))) / 7) + 1) : null;
    return {fase:'pers', desc:!!P.descarga && (i + 1) % 4===0 && (!N || i < N - 1), p:0.5, N, cic:(i % (P.ciclo || 1)) + 1}; }
  const P = S.plan, N = P.fecha ? Math.max(1, Math.floor(diasEntre(P.inicio, lunesDe(masDias(P.fecha, -1))) / 7) + 1) : null;
  if(!N) return {fase:'man', desc:(i + 1) % 4===0, p:((i % 4) + 1) / 4 * 0.5, N:null};
  const T = N >= 12 ? 2 : N >= 3 ? 1 : 0, R = N - T, nb = Math.round(R * 0.4), nd = Math.round(R * 0.35);
  if(i >= R) return {fase:'afi', desc:false, p:1, N, T, afi:i - R};
  return {fase:i < nb ? 'base' : i < nb + nd ? 'des' : 'esp', desc:(i + 1) % 4===0 && i < R - 1, p:R > 1 ? i / (R - 1) : 1, N, R, nb, nd, T};
}
/* Plan de un día: {tipo:'sesion'|'activo'|'descanso'|'evento'|'fuera', ses, ...semana} */
function planCrudo(f){
  const P = S.plan; if(!P || f < (P.desde || P.inicio)) return {tipo:'fuera'};
  if(P.fecha && f > P.fecha) return {tipo:'fuera'};
  const i = Math.floor(diasEntre(P.inicio, f) / 7), W = infoSemana(i), dow = (new Date(f + 'T12:00:00').getDay() + 6) % 7, o = objDe(P.obj);
  const base = Object.assign({sem:i + 1}, W);
  if(P.fecha && f===P.fecha) return Object.assign(base, {tipo:'evento', ses:{n:'🎯 ' + (P.obj==='propio' ? (P.evento || 'Mi objetivo') : o.n) + (P.sub ? ' · ' + P.sub : ''), min:PICO[P.obj] && PICO[P.obj][P.sub] ? Math.round(PICO[P.obj][P.sub] * 1.1) : 60, rpe:9, d:'Hoy es el día. Calienta bien, hidrátate y disfruta el resultado de tu preparación.'}});
  if(P.obj==='propio'){
    const it = ((P.semanas || [])[i % (P.ciclo || 1)] || [])[dow];
    if(!it) return Object.assign(base, {tipo:'descanso'});
    if(it.activo) return Object.assign(base, {tipo:'activo', ses:{n:'Descanso activo', min:it.min || 25, rpe:2, d:it.d || 'Trote muy suave, caminata, bici, nado o movilidad.'}});
    const ses = Object.assign({}, it); if(W.desc){ ses.min = r5(ses.min * 0.6); ses.rpe = Math.max(3, ses.rpe - 1); }
    return Object.assign(base, {tipo:'sesion', ses});
  }
  const dias = (P.diasSem || DIAS_DEF[P.dias]).slice().sort(), cat = CATALOGO[P.obj].slice(0, dias.length).map(x=>Object.assign({}, x));
  if(dias.length===7) cat[6] = {n:'Descanso activo', activo:true, min:25, rpe:2, d:'Recuperación a muy baja intensidad.'};
  // la sesión larga al último día del fin de semana elegido; el resto alterna duras y suaves
  const asign = {}, finde = dias.filter(d=>d >= 5), dl = finde.length ? finde[finde.length - 1] : dias[dias.length - 1];
  const li = cat.findIndex(x=>x.largo); let resto = dias.slice();
  if(li >= 0){ asign[dl] = cat[li]; resto = resto.filter(d=>d!==dl); }
  const otras = cat.filter((x, k)=>k!==li), duras = otras.filter(x=>x.rpe >= 7), suaves = otras.filter(x=>x.rpe < 7), orden = [];
  while(duras.length || suaves.length){ if(duras.length) orden.push(duras.shift()); if(suaves.length) orden.push(suaves.shift()); }
  resto.forEach((d, k)=>{ if(orden[k]) asign[d] = orden[k]; });
  let ses = asign[dow];
  if(!ses){ const libres = [0, 1, 2, 3, 4, 5, 6].filter(d=>!dias.includes(d)), act = libres.find(d=>d > dl) ?? libres[0];
    return Object.assign(base, dow===act ? {tipo:'activo', ses:{n:'Descanso activo', min:25, rpe:2, d:'Trote muy suave, caminata, bici, nado o movilidad.'}} : {tipo:'descanso'}); }
  if(ses.activo) return Object.assign(base, {tipo:'activo', ses});
  // volumen según fase, avance, descarga y afinamiento
  const pico = PICO[P.obj] && PICO[P.obj][P.sub];
  let min = ses.largo ? (pico && W.fase!=='man' ? ses.min + (pico - ses.min) * W.p : ses.min * (0.8 + 0.5 * W.p)) : ses.min * (0.85 + 0.3 * W.p), rpe = ses.rpe;
  if(W.fase==='base' && rpe >= 8) rpe--;
  if(W.desc){ min *= 0.6; rpe = Math.max(3, rpe - 1); }
  if(W.fase==='afi') min *= 0.5;
  return Object.assign(base, {tipo:'sesion', ses:Object.assign({}, ses, {min:r5(min), rpe})});
}
function planDia(f){
  const P = S.plan; let g = f;
  (P && P.swaps || []).forEach(([a, b])=>{ if(g===a) g = b; else if(g===b) g = a; });
  const x = planCrudo(g); if(g!==f && x.tipo!=='fuera') x.movida = true;
  const c = P && P.cambios && P.cambios[f];
  if(c && x.tipo!=='fuera'){ x.editado = true; delete x.movida;
    if(c.tipo==='descanso'){ x.tipo = 'descanso'; delete x.ses; } else if(c.activo){ x.tipo = 'activo'; x.ses = {n:'Descanso activo', min:c.min || 25, rpe:2, d:'Recuperación a muy baja intensidad.'}; } else { x.tipo = 'sesion'; x.ses = Object.assign({}, c); } }
  return typeof ajustarSesionInBody==='function' ? ajustarSesionInBody(x) : x;   // el InBody ajusta la sesión (inbody.js)
}
const cargaPlan = x=>x.ses ? x.ses.min * x.ses.rpe : 0;
const hechoEn = (f, x)=>x.tipo==='activo' ? S.sesiones.some(s=>s.fecha===f) : S.sesiones.some(s=>s.fecha===f && s.tipo!=='descanso');
function cumplimiento(){
  const P = S.plan, hoy = hoyISO(); let plan = 0, ok = 0;
  for(let f = P.desde || P.inicio; f < hoy; f = masDias(f, 1)){ const x = planDia(f); if(x.tipo==='sesion' || x.tipo==='activo'){ plan++; if(hechoEn(f, x)) ok++; } }
  return {plan, ok, pct:plan ? Math.round(ok / plan * 100) : null};
}
/* Proyección: forma real hasta hoy y, desde mañana, la carga del plan. Con pocos registros (menos de 8 días con carga en 4 semanas) se
   supone que ya entrenaba parecido a las 2 primeras semanas del plan (`estimado`): si no, partir de cero hacía ver «Sobrecargado» cualquier
   plan corto (24-oct-2026, lo vio el usuario en un plan PSF de 3 semanas). */
function proyeccionPlan(){
  const P = S.plan, F = formaFisica(42), ult = F[F.length - 1] || {ctl:0, atl:0}, hoy = hoyISO(), porDia = cargasPorDia();
  const fin = P.fecha || masDias(hoy, 56), dCarga = Array.from({length:28}, (_, i)=>porDia[masDias(hoy, -i)] || 0).filter(c=>c > 0).length;
  let out = F.map(x=>Object.assign({real:true}, x)), ctl = ult.ctl, atl = ult.atl, estimado = false;
  if(dCarga < 8){ const ini = P.desde && P.desde > hoy ? P.desde : hoy, base = Array.from({length:14}, (_, i)=>cargaPlan(planDia(masDias(ini, i)))).reduce((a, b)=>a + b, 0) / 14;
    if(base > ctl){ ctl = atl = base; estimado = true; out = [{f:hoy, ctl, atl, tsb:0, real:true}]; } }
  for(let f = masDias(hoy, 1); f <= fin; f = masDias(f, 1)){ const c = cargaPlan(planDia(f)); ctl += (c - ctl) / 42; atl += (c - atl) / 7; out.push({f, ctl, atl, tsb:ctl - atl}); }
  out.estimado = estimado;
  return out;
}
function graficoPlan(F){
  const W = 360, H = 140, max = Math.max(1, ...F.map(x=>Math.max(x.ctl, x.atl))), X = i=>i / Math.max(1, F.length - 1) * W, Y = v=>H - 16 - v / max * (H - 26);
  const k0 = F.findIndex(x=>!x.real), hoyX = X(k0 < 0 ? F.length - 1 : k0 - 1);
  const ln = (k, a, b)=>F.slice(a, b).map((x, i)=>X(i + a).toFixed(1) + ',' + Y(x[k]).toFixed(1)).join(' ');
  const corte = k0 < 0 ? F.length : k0;
  return `<svg class="plan-graf" viewBox="0 0 ${W} ${H}" aria-label="Condición y fatiga: real y proyectada">
    <rect x="${hoyX}" y="0" width="${W - hoyX}" height="${H - 14}" class="pg-fut"/>
    <polyline points="${ln('atl', 0, corte)}" class="pg-atl"/><polyline points="${ln('ctl', 0, corte)}" class="pg-ctl"/>
    ${k0 >= 0 ? `<polyline points="${ln('atl', corte - 1, F.length)}" class="pg-atl fut"/><polyline points="${ln('ctl', corte - 1, F.length)}" class="pg-ctl fut"/>` : ''}
    <line x1="${hoyX}" x2="${hoyX}" y1="0" y2="${H - 14}" class="pg-hoy"/><text x="${hoyX + 3}" y="10">hoy</text>
    ${S.plan.fecha ? `<text x="${W - 2}" y="10" text-anchor="end">🎯</text>` : ''}</svg>`;
}

/* ---------- Tarjeta «Plan de hoy» (Inicio) ---------- */
function htmlPlanHoy(){
  const P = S.plan, hoy = hoyISO();
  if(!P) return `<button class="plan-hoy vacio-plan" id="phVer"><span class="ph-ic">📅</span><div><small>Mi plan${esPlus() ? '' : ' <span class="plus-mini">PLUS</span>'}</small><b>Arma tu plan de entrenamiento</b><span class="suave chico">Combate, PSF, marcha, carrera, para mujeres, fuerza… de 2 a 7 días por semana.</span></div><span class="chev">›</span></button>`;
  if(!esPlus()) return `<button class="plan-hoy vacio-plan" id="phVer"><span class="ph-ic">📅</span><div><small>Mi plan <span class="plus-mini">PLUS</span></small><b>Tu plan está en pausa</b><span class="suave chico">Mi plan es parte de Plus: vuelve a activarlo para seguir con tu semana.</span></div><span class="chev">›</span></button>`;
  const x = planDia(hoy), o = objDe(P.obj);
  if(x.tipo==='fuera') return `<button class="plan-hoy" id="phVer"><span class="ph-ic">${o.ic}</span><div><small>Mi plan</small><b>${P.fecha && hoy > P.fecha ? 'Plan terminado: ¡arma el siguiente!' : 'Tu plan comienza el ' + verFecha(P.inicio)}</b></div><span class="chev">›</span></button>`;
  const hecho = (x.tipo==='sesion' || x.tipo==='activo') && hechoEn(hoy, x), D = senalesDescanso(), F = FASES[x.fase];
  const prox = (()=>{ for(let k = 1; k < 8; k++){ const f = masDias(hoy, k), y = planDia(f); if(y.tipo==='sesion' || y.tipo==='evento') return [f, y]; } return null; })();
  return `<div class="plan-hoy ${x.tipo}">
    <div class="ph-cab"><span class="ph-fase" style="--fc:${F[1]}">${F[0]}${x.desc ? ' · descarga' : ''}</span><small>${o.ic} ${esc(o.n)}${P.sub ? ' · ' + esc(P.sub) : ''} · semana ${x.sem}${x.N ? '/' + x.N : ''}</small><button class="link" id="phVer">Ver plan ›</button></div>
    ${x.tipo==='descanso' ? `<b class="ph-tit">Descanso</b><p class="suave chico">Sueño, hidratación y comida también son entrenamiento.${prox ? ` Próxima: <b>${esc(prox[1].ses.n)}</b> (${DIAS_N[(new Date(prox[0] + 'T12:00:00').getDay() + 6) % 7]}).` : ''}</p>`
      : `<b class="ph-tit">${esc(x.ses.n)}${hecho ? ' <span class="ph-ok">✓ cumplida</span>' : ''}${x.movida ? ' <span class="suave chico">(movida)</span>' : ''}</b>
        <div class="ph-dat num"><span>⏱ ${x.ses.min} min</span><span>💢 esfuerzo ${x.ses.rpe}</span>${x.ses.cap ? `<span>${esc(x.ses.cap)}</span>` : ''}</div>
        ${x.ses.d ? `<p class="chico">${esc(x.ses.d)}</p>` : ''}${(x.ses.inbody || []).map(n=>`<p class="chico ib-nota">⚖️ ${esc(n)}</p>`).join('')}
        ${!hecho && x.tipo==='sesion' && x.ses.rpe >= 7 && D.nivel==='recomendado' ? '<p class="chico ph-alerta">🔋 Hoy la app recomienda descanso activo: puedes mover esta sesión a mañana.</p>' : ''}
        ${hecho ? '' : `<div class="ph-btns">${x.tipo==='activo' ? '<button class="btn prim" id="phActivo">🔋 Elegir descanso activo</button>' : '<button class="btn prim" id="phReg">＋ Registrar</button>'}${x.tipo==='sesion' ? '<button class="btn" id="phMover">Mover a mañana</button>' : ''}</div>`}`}
  </div>`;
}
function enlazarPlanHoy(){
  if($('#phVer')) $('#phVer').onclick = ()=>ir('plan');
  const hoy = hoyISO(), x = S.plan ? planDia(hoy) : null;
  if($('#phReg')) $('#phReg').onclick = ()=>{ const t = x.ses.plantilla || x.ses.pop && POPULARES.find(p=>p.titulo===x.ses.pop); if(t) registrarWod(t); else abrirRegistro(); };
  if($('#phActivo')) $('#phActivo').onclick = dialogoDescanso;
  if($('#phMover')) $('#phMover').onclick = ()=>{ S.plan.swaps = (S.plan.swaps || []).concat([[hoy, masDias(hoy, 1)]]); guardar(); aviso('Sesión movida a mañana'); const y = window.scrollY; vHoy(); window.scrollTo(0, y); };
}

/* ---------- Vista «Mi plan» ---------- */
let semPlan = 0;
function vPlan(){
  const P = S.plan; if(P && editandoPlan) return vEditorPlan();
  if(!P){ $('#vista').innerHTML = `<div class="cab-an"><button class="btn chico-btn" id="plAtras" aria-label="Volver">‹</button><h2>Mi plan</h2></div>
      <p class="suave">Elige un objetivo (combate, PSF, marcha, carrera, fuerza…) y cuántos días entrenas. La app arma las fases, alterna días duros y suaves, programa descargas y descanso activo, y proyecta tu forma física.</p>
      <button class="btn prim ancho" id="plCrear">📅 Armar mi plan${esPlus() ? '' : ' <span class="plus-mini">PLUS</span>'}</button>${esPlus() ? '' : `<p class="nota">Mi plan es parte de Plus: pruébalo ${PLUS_PRUEBA} días gratis.</p>`}`;
    $('#plAtras').onclick = ()=>ir('hoy'); $('#plCrear').onclick = dialogoPlan; return; }
  const o = objDe(P.obj), hoy = hoyISO(), lun = masDias(lunesDe(hoy), semPlan * 7), C = cumplimiento(), F = proyeccionPlan();
  const iHoy = Math.floor(diasEntre(P.inicio, hoy) / 7), W0 = infoSemana(Math.max(0, iHoy)), N = W0.N;
  const fin = F[F.length - 1], antes = P.fecha ? F.find(x=>x.f===masDias(P.fecha, -1)) || fin : fin, real = F.filter(x=>x.real).pop() || {ctl:0};
  const fp = formaPct(antes), ef = ESTADO_FORMA(fp), dCtl = real.ctl > 1 ? Math.round((antes.ctl / real.ctl - 1) * 100) : null;
  const barra = N ? Array.from({length:N}, (_, i)=>{ const w = infoSemana(i); return `<span class="pb-s ${w.desc ? 'desc' : ''} ${i===iHoy ? 'hoy' : ''}" style="background:${FASES[w.fase][1]}" title="Semana ${i + 1}: ${FASES[w.fase][0]}${w.desc ? ' (descarga)' : ''}"></span>`; }).join('') : '';
  const sem = Array.from({length:7}, (_, k)=>{ const f = masDias(lun, k), x = planDia(f), pas = f < hoy, ok = (x.tipo==='sesion' || x.tipo==='activo') && hechoEn(f, x);
    const est = x.tipo==='fuera' || x.tipo==='descanso' ? '' : ok ? '<span class="pd-est ok">✓</span>' : pas ? '<span class="pd-est no">✗</span>' : f===hoy ? '<span class="pd-est hoy">hoy</span>' : '';
    return `<li class="pd ${x.tipo} ${f===hoy ? 'es-hoy' : ''}" ${x.tipo==='fuera' ? '' : `data-pdia="${f}"`}><div class="pd-dia"><b>${DIAS_C[k]}</b><span class="num">${+f.slice(8)}</span></div>
      <div class="pd-ses">${x.tipo==='fuera' ? '<span class="suave">—</span>' : x.tipo==='descanso' ? '<span class="suave">Descanso</span>' : `<b>${esc(x.ses.n)}${x.ses.tag ? ` <span class="pd-tag">${esc(x.ses.tag)}</span>` : ''}</b><span class="suave chico num">${x.ses.min} min · esfuerzo ${x.ses.rpe}${x.desc ? ' · descarga' : ''}${x.movida ? ' · movida' : ''}${x.editado ? ' · cambiada' : ''}</span>`}</div>${est}${x.tipo==='fuera' ? '' : '<span class="pd-ed">✎</span>'}</li>`; }).join('');
  const W1 = infoSemana(Math.floor(diasEntre(P.inicio, lun) / 7));
  $('#vista').innerHTML = `<div class="cab-an"><button class="btn chico-btn" id="plAtras" aria-label="Volver">‹</button><h2>Mi plan</h2></div>
    <div class="tarjeta plan-cab"><div class="entre"><div><div class="etiqueta">${esc(o.g)}</div><h3 style="margin:2px 0">${o.ic} ${esc(P.obj==='propio' ? P.nombre || o.n : o.n)}${P.sub ? ' · ' + esc(P.sub) : ''}</h3>
      <div class="suave chico">${P.fecha ? `🎯 ${verFecha(P.fecha)} · faltan <b>${Math.max(0, diasEntre(hoy, P.fecha))}</b> días` : P.obj==='propio' ? 'Sin fecha de término' : 'Sin fecha: bloques de 4 semanas (3 de carga + 1 de descarga)'} · ${P.obj==='propio' ? `ciclo de ${P.ciclo || 1} semana${(P.ciclo || 1) > 1 ? 's' : ''}${P.descarga ? ' · descarga cada 4.ª' : ''}` : P.dias + ' días por semana'}</div></div>
      <button class="btn chico-btn" id="plEditar" aria-label="Cambiar plan">✎</button></div>
      ${N ? `<div class="plan-barra">${barra}</div><div class="plan-ley chico">${(P.obj==='propio' ? ['pers'] : ['base', 'des', 'esp', 'afi']).map(k=>`<span><i style="background:${FASES[k][1]}"></i>${FASES[k][0]}</span>`).join('')}<span><i class="desc"></i>Descarga</span></div>` : ''}
    </div>
    ${P.obj==='psf' && typeof htmlMiRendimiento==='function' ? htmlMiRendimiento() : P.obj==='combate' && typeof htmlRendCombate==='function' ? htmlRendCombate() : P.obj==='mujer' && typeof htmlMujerPlan==='function' ? htmlMujerPlan() : ''}
    ${htmlAjustesInBody()}
    <div class="tarjeta">
      <div class="entre"><button class="btn chico-btn" id="semAnt">‹</button><div style="text-align:center"><div class="etiqueta">Semana ${Math.floor(diasEntre(P.inicio, lun) / 7) + 1}${N ? '/' + N : ''}</div><b>${FASES[W1.fase] ? FASES[W1.fase][0] : ''}${W1.desc ? ' · descarga' : ''}</b></div><button class="btn chico-btn" id="semSig">›</button></div>
      <ul class="plan-sem">${sem}</ul>
      <p class="nota" style="margin-top:6px">Toca un día para cambiar solo esa fecha.</p>
      ${P.obj==='propio' ? '<button class="btn prim ancho" id="plSemanas" style="margin-top:8px">✍️ Editar mis semanas</button>' : ''}
    </div>
    <div class="tarjeta"><div class="entre"><span class="etiqueta">Proyección si cumples el plan</span><span class="chip-estado" style="background:${ef[1]}">${ef[0]}</span></div>
      ${graficoPlan(F)}
      <div class="plan-ley chico"><span><i style="background:var(--acento)"></i>Condición</span><span><i style="background:#ef6f5e"></i>Fatiga</span><span class="suave">punteado = proyectado</span></div>
      <p class="chico">${P.fecha ? `Llegas al ${verFecha(P.fecha)}` : 'En 8 semanas llegas'} con la condición ${dCtl==null ? 'en construcción' : dCtl >= 0 ? `<b class="sube">+${dCtl} %</b> sobre hoy` : `<b class="baja">${dCtl} %</b> frente a hoy`} y la forma en <b>${fp > 0 ? '+' : ''}${Math.round(fp)} %</b> (${ef[0].toLowerCase()}). ${P.fecha ? (fp > 5 ? 'Descansado para rendir el día D.' : 'Si quieres llegar más fresco, alarga el afinamiento.') : ''}</p>
      ${F.estimado ? '<p class="nota">Estimado: tienes pocos entrenamientos registrados con duración y esfuerzo, así que supuse que ya entrenabas parecido a este plan. Se ajusta solo a medida que registras.</p>' : ''}
    </div>
    <div class="tarjeta"><div class="etiqueta">Cumplimiento</div>
      ${C.plan ? `<div class="plan-cumple"><b class="num">${C.pct} %</b><span>${C.ok} de ${C.plan} sesiones planificadas</span></div><div class="barra-logro"><span style="width:${C.pct}%"></span></div>`
        : '<p class="suave chico">Se calcula desde el primer día del plan.</p>'}
      <p class="nota">${P.obj==='propio' ? (P.descarga ? 'Cada 4.ª semana es de descarga (−40 % de minutos y −1 de esfuerzo). ' : '') + 'Si la app detecta fatiga, te ofrece descanso activo y mover la sesión.' : 'Descargas cada 4.ª semana (−40 % de volumen). Afinamiento final: −50 % de volumen manteniendo la intensidad. Si la app detecta fatiga, te ofrece descanso activo y mover la sesión.'}</p>
    </div>
    <button class="btn ancho" id="plBorrar" style="margin-top:4px">Terminar este plan</button>`;
  $('#plAtras').onclick = ()=>ir('hoy'); $('#plEditar').onclick = ()=>dialogoPlan(); if(typeof enlazarRendCombate==='function') enlazarRendCombate();
  $('#semAnt').onclick = ()=>{ semPlan--; vPlan(); }; $('#semSig').onclick = ()=>{ semPlan++; vPlan(); };
  if($('#plSemanas')) $('#plSemanas').onclick = ()=>{ semEd = 0; vEditorPlan(); window.scrollTo(0, 0); };
  $$('[data-pdia]').forEach(li=>li.onclick = ()=>cambiarDia(li.dataset.pdia));
  $('#plBorrar').onclick = ()=>confirmar('¿Terminar este plan? Tus entrenamientos registrados no se borran.', ()=>{ S.plan = null; guardar(); semPlan = 0; vPlan(); });
  if(!esPlus()) cubrirPlus('plan');
}
function dialogoPlan(pre){
  if(!esPlus()) return pantallaPlus('plan', ()=>dialogoPlan(pre));   // Mi plan es parte de Plus (plus.js)
  const P = S.plan || {}, q = pre && pre.obj ? pre : {}, st = {obj:q.obj || P.obj || 'combate', sub:q.sub || P.sub || null, fecha:q.fecha || P.fecha || '', dias:(P.diasSem || DIAS_DEF[P.dias || 5]).slice(),
    nombre:P.nombre || '', evento:P.evento || '', ciclo:P.ciclo || 1, descarga:P.obj==='propio' ? !!P.descarga : true};
  const pintar = ()=>{
    const o = objDe(st.obj); if(o.subs && !o.subs.includes(st.sub)) st.sub = o.subs[0]; if(!o.subs) st.sub = null;
    const min = masDias(hoyISO(), 14);
    dialogo(`<div class="cab"><h2>Mi plan</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
      <label>Objetivo</label>
      ${['Militar', 'Deportivo', 'General', 'Personal'].map(g=>`<div class="etiqueta" style="margin:8px 0 4px">${g}</div><div class="obj-grid">${OBJ_PLAN.filter(x=>x.g===g).map(x=>`<button data-obj="${x.id}" class="${x.id===st.obj ? 'activa' : ''}"><span>${x.ic}</span><b>${esc(x.n)}</b><small>${esc(x.d)}</small></button>`).join('')}</div>`).join('')}
      ${o.subs ? `<label>Distancia o tipo</label><div class="chips" id="plSub" style="padding:0">${o.subs.map(s=>`<button data-sub="${esc(s)}" class="${s===st.sub ? 'activa' : ''}">${esc(s)}</button>`).join('')}</div>` : ''}
      <label>Fecha del objetivo ${o.sinFecha ? '(opcional)' : ''}</label><input type="date" id="plFecha" min="${min}" value="${esc(st.fecha)}">
      ${o.sinFecha ? '<p class="nota" style="margin-top:4px">Sin fecha, el plan sigue en bloques de 4 semanas (3 de carga + 1 de descarga).</p>' : '<p class="nota" style="margin-top:4px">Ideal: 8 a 20 semanas de preparación.</p>'}
      ${st.obj==='propio' ? `<label>Nombre de tu plan</label><input id="plNombre" value="${esc(st.nombre)}" placeholder="Ej.: Preparación curso de comandos">
      <label>Qué hay en la fecha (opcional)</label><input id="plEvento" value="${esc(st.evento)}" placeholder="Ej.: Marcha de 40 km">
      <label>Ciclo: semanas distintas que se repiten</label><div class="chips" id="plCiclo" style="padding:0">${[1, 2, 3, 4].map(n=>`<button data-cic="${n}" class="${st.ciclo===n ? 'activa' : ''}">${n} semana${n > 1 ? 's' : ''}</button>`).join('')}</div>
      <label class="agua-calor"><input type="checkbox" id="plDescarga" ${st.descarga ? 'checked' : ''}><span>Semana de descarga automática cada 4.ª semana (recomendado)</span></label>
      <p class="nota" style="margin-top:4px">Después eliges qué hacer cada día: sesiones de la biblioteca, tus favoritos o las que escribas.</p>`
      : `<label>Días de entrenamiento · <b id="plN">${st.dias.length}</b> por semana</label>
      <div class="dias-sel">${DIAS_C.map((d, k)=>`<button data-dw="${k}" class="${st.dias.includes(k) ? 'activa' : ''}" aria-label="${DIAS_N[k]}">${d}</button>`).join('')}</div>
      <p class="nota" style="margin-top:4px">De 2 a 7 días. La sesión larga va el fin de semana; con 7 días, uno es de descanso activo.</p>`}
      <div class="btns"><button class="btn" data-cerrar>Cancelar</button><button class="btn prim" id="plOk">Guardar plan</button></div>`, d=>{
      const leer = ()=>{ st.fecha = $('#plFecha', d).value; if($('#plNombre', d)){ st.nombre = $('#plNombre', d).value.trim(); st.evento = $('#plEvento', d).value.trim(); st.descarga = $('#plDescarga', d).checked; } };
      $$('[data-cic]', d).forEach(b=>b.onclick = ()=>{ leer(); st.ciclo = +b.dataset.cic; pintar(); });
      $$('[data-obj]', d).forEach(b=>b.onclick = ()=>{ leer(); st.obj = b.dataset.obj; if(st.obj==='psf' && !st.fecha && typeof fechaPSFSugerida==='function') st.fecha = fechaPSFSugerida(); pintar(); });
      $$('[data-sub]', d).forEach(b=>b.onclick = ()=>{ leer(); st.sub = b.dataset.sub; pintar(); });
      $$('[data-dw]', d).forEach(b=>b.onclick = ()=>{ const k = +b.dataset.dw; if(st.dias.includes(k)){ if(st.dias.length > 2) st.dias = st.dias.filter(x=>x!==k); }
        else st.dias.push(k); b.classList.toggle('activa', st.dias.includes(k)); $('#plN', d).textContent = st.dias.length; });
      $('#plOk', d).onclick = ()=>{ leer(); const o2 = objDe(st.obj);
        if(!o2.sinFecha && !st.fecha) return aviso('Indica la fecha del objetivo');
        if(st.fecha && st.fecha < masDias(hoyISO(), 7)) return aviso('La fecha debe ser al menos en una semana más');
        if(st.obj==='propio'){ const viejo = P.obj==='propio' ? P : null, sem = Array.from({length:st.ciclo}, (_, k)=>(viejo && viejo.semanas && viejo.semanas[k]) || (viejo && viejo.semanas && viejo.semanas[0] ? viejo.semanas[0].slice() : Array(7).fill(null)));
          S.plan = {obj:'propio', nombre:st.nombre || 'Mi plan', evento:st.evento, fecha:st.fecha || null, ciclo:st.ciclo, descarga:st.descarga, semanas:sem,
            inicio:viejo ? viejo.inicio : lunesDe(hoyISO()), desde:viejo ? viejo.desde : hoyISO(), dias:sem[0].filter(x=>x && !x.activo).length, swaps:viejo ? viejo.swaps || [] : [], cambios:viejo ? viejo.cambios || {} : {}};
          guardar(); d.close(); aviso('Plan guardado'); semPlan = 0; editandoPlan = !viejo; semEd = 0; ir('plan'); return; }
        S.plan = {obj:st.obj, sub:st.sub, fecha:st.fecha || null, inicio:P.obj===st.obj && P.inicio ? P.inicio : lunesDe(hoyISO()), desde:P.obj===st.obj && P.desde ? P.desde : hoyISO(), dias:st.dias.length, diasSem:st.dias.slice().sort(), swaps:[]};
        guardar(); d.close(); semPlan = 0; aviso('Plan guardado'); ir('plan'); };
    });
  };
  pintar();
}

/* ---------- Plan a mi gusto: editor de semanas ---------- */
let editandoPlan = false, semEd = 0;
const resumenIt = it=>!it ? '<span class="suave">Descanso</span>' : it.activo ? '<b style="color:#5fc9b5">🔋 Descanso activo</b>' : `<b>${esc(it.n)}</b><span class="suave chico num">${it.min} min · esfuerzo ${it.rpe}</span>`;
function vEditorPlan(){
  const P = S.plan, n = P.ciclo || 1; semEd = Math.min(semEd, n - 1); const W = P.semanas[semEd];
  const ses = W.filter(x=>x && !x.activo), carga = ses.reduce((a, x)=>a + x.min * x.rpe, 0), min = ses.reduce((a, x)=>a + x.min, 0);
  $('#vista').innerHTML = `<div class="cab-an"><button class="btn chico-btn" id="edAtras" aria-label="Volver">‹</button><h2>Mis semanas</h2></div>
    <p class="suave chico">Toca cada día y elige qué hacer. ${n > 1 ? `Las ${n} semanas se repiten en orden.` : 'Esta semana se repite.'}</p>
    ${n > 1 ? `<div class="segmentos" id="edSem" style="margin-bottom:10px">${Array.from({length:n}, (_, k)=>`<button data-es="${k}" class="${k===semEd ? 'activa' : ''}">Semana ${k + 1}</button>`).join('')}</div>` : ''}
    <div class="tarjeta"><ul class="plan-sem ed">${W.map((it, k)=>`<li class="pd ${!it ? 'descanso' : it.activo ? 'activo' : 'sesion'}" data-ed="${k}"><div class="pd-dia"><b>${DIAS_C[k]}</b></div><div class="pd-ses">${resumenIt(it)}</div><span class="pd-ed">✎</span></li>`).join('')}</ul>
      <div class="ed-resumen num"><span><b>${ses.length}</b> sesiones</span><span><b>${fmtHoras(min)}</b> h</span><span><b>${carga.toLocaleString('es-CL')}</b> de carga</span></div>
      ${(()=>{ const duras = W.map((x, k)=>x && !x.activo && x.rpe >= 8 ? k : -1).filter(k=>k >= 0), seguidas = duras.some((k, i)=>duras[i + 1]===k + 1);
        const libres = W.filter(x=>!x).length + W.filter(x=>x && x.activo).length;
        return (seguidas ? '<p class="chico alerta-lim">⚠ Tienes dos días duros seguidos (esfuerzo 8 o más): alterna con uno suave.</p>' : '') + (!libres && ses.length ? '<p class="chico alerta-lim">⚠ Sin ningún día de descanso: agrega al menos un descanso o descanso activo.</p>' : ''); })()}
    </div>
    ${n > 1 ? `<button class="btn ancho" id="edCopiar">⧉ Copiar la semana ${semEd + 1} a las demás</button>` : ''}
    <button class="btn prim ancho" id="edListo" style="margin-top:8px">✓ Listo</button>`;
  $('#edAtras').onclick = $('#edListo').onclick = ()=>{ editandoPlan = false; vPlan(); window.scrollTo(0, 0); };
  $$('#edSem button').forEach(b=>b.onclick = ()=>{ semEd = +b.dataset.es; vEditorPlan(); });
  if($('#edCopiar')) $('#edCopiar').onclick = ()=>{ P.semanas = P.semanas.map((w, k)=>k===semEd ? w : W.map(x=>x ? Object.assign({}, x) : null)); guardar(); aviso('Semana copiada'); vEditorPlan(); };
  $$('[data-ed]').forEach(li=>li.onclick = ()=>{ const k = +li.dataset.ed;
    elegirSesion(W[k], DIAS_N[k], it=>{ W[k] = it; P.dias = P.semanas[0].filter(x=>x && !x.activo).length; guardar(); vEditorPlan(); }); });
}
/* Cambiar solo una fecha (cualquier plan) */
function cambiarDia(f){
  const P = S.plan, x = planDia(f), dw = DIAS_N[(new Date(f + 'T12:00:00').getDay() + 6) % 7];
  const actual = x.tipo==='descanso' ? null : x.tipo==='activo' ? {activo:true} : x.ses;
  elegirSesion(actual, dw + ' ' + +f.slice(8), it=>{ P.cambios = P.cambios || {}; P.cambios[f] = it || {tipo:'descanso'}; guardar(); vPlan(); },
    P.cambios && P.cambios[f] ? ()=>{ delete P.cambios[f]; guardar(); vPlan(); } : null);
}
/* Selector de sesión: descanso, descanso activo, escrita a mano, de la biblioteca, de favoritos o sesiones tipo */
function elegirSesion(actual, cuando, alElegir, alRestaurar, opc = {}){   // opc.esfOpcional: la tarea de la unidad puede ir sin esfuerzo
  const it = actual && !actual.activo ? actual : {};
  let ref = {pop:it.pop || null, plantilla:it.plantilla || null};
  const tipos = []; OBJ_PLAN.forEach(o=>(CATALOGO[o.id] || []).forEach(c=>{ if(!tipos.some(t=>t.n===c.n)) tipos.push(Object.assign({g:o.n}, c)); }));
  const fav = (S.favoritos || []).map(f=>f.w).filter(w=>w && w.titulo);
  const fila = (k, i, t, sub)=>`<li class="item" data-src="${k}" data-i="${i}"><div class="titulo">${esc(t)}</div>${sub ? `<div class="suave chico">${esc(sub)}</div>` : ''}</li>`;
  const lista = q=>{ const ok = t=>!q || coincideMov({n:t, al:[]}, q) || t.toLowerCase().includes(q.toLowerCase());
    const a = tipos.map((t, i)=>ok(t.n) ? fila('tipo', i, t.n, t.min + ' min · esfuerzo ' + t.rpe + ' · ' + t.g) : '').join('');
    const b = fav.map((w, i)=>ok(w.titulo) ? fila('fav', i, '★ ' + w.titulo, 'Favorito') : '').join('');
    const c = POPULARES.map((p, i)=>p.titulo && ok(p.titulo) ? fila('pop', i, p.titulo, (CAT_POP.find(x=>x[0]===p.cat) || ['', ''])[1]) : '').join('');
    return (b ? '<div class="etiqueta">Tus favoritos</div><ul class="lista">' + b + '</ul>' : '') + (a ? '<div class="etiqueta">Sesiones tipo</div><ul class="lista">' + a + '</ul>' : '')
      + (c ? '<div class="etiqueta">Biblioteca</div><ul class="lista">' + c + '</ul>' : '') || '<div class="vacio chico">Sin resultados: escríbela arriba.</div>'; };
  dialogo(`<div class="cab"><h2>${esc(cuando.charAt(0).toUpperCase() + cuando.slice(1))}</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <div class="es-rapido"><button class="btn" id="esDesc">😴 Descanso</button><button class="btn" id="esAct">🔋 Descanso activo</button></div>
    <div class="etiqueta" style="margin-top:12px">Sesión</div>
    <label>Nombre</label><input id="esN" value="${esc(it.n || '')}" placeholder="Ej.: Pierna pesada, trote 8 km, natación">
    <div class="fila"><div><label>Minutos</label><input id="esMin" type="number" inputmode="numeric" min="5" max="600" value="${it.min || 45}"></div>
      <div><label>Esfuerzo (1-10)</label><select id="esRpe">${opc.esfOpcional ? opcionesEsfuerzo(it.rpe || '', true) : opcionesEsfuerzo(it.rpe || 6)}</select></div></div>
    <label>Detalle (opcional)</label><input id="esD" value="${esc(it.d || '')}" placeholder="Ej.: 5 × 5 sentadilla al 80 %">
    <div class="btns">${alRestaurar ? '<button class="btn" id="esRest">↺ Volver a lo planificado</button>' : ''}<button class="btn prim" id="esOk">Guardar sesión</button></div>
    <div class="etiqueta" style="margin-top:14px">O elige una lista</div>
    <input id="esBus" placeholder="Buscar: noruego, marcha, 5×5, Murph…">
    <div id="esLista" class="es-lista">${lista('')}</div>`, d=>{
    $('#esDesc', d).onclick = ()=>{ d.close(); alElegir(null); };
    $('#esAct', d).onclick = ()=>{ d.close(); alElegir({activo:true, min:25}); };
    if($('#esRest', d)) $('#esRest', d).onclick = ()=>{ d.close(); alRestaurar(); };
    $('#esBus', d).oninput = e=>{ $('#esLista', d).innerHTML = lista(e.target.value.trim()); };
    $('#esLista', d).onclick = e=>{ const li = e.target.closest('[data-src]'); if(!li) return; const i = +li.dataset.i;
      if(li.dataset.src==='tipo'){ const t = tipos[i]; $('#esN', d).value = t.n; $('#esMin', d).value = t.min; $('#esRpe', d).value = t.rpe; $('#esD', d).value = t.d || ''; ref = {pop:t.pop || null, plantilla:null}; }
      else if(li.dataset.src==='fav'){ const w = fav[i]; $('#esN', d).value = w.titulo; $('#esD', d).value = ''; ref = {pop:null, plantilla:w}; }
      else { const p = POPULARES[i]; $('#esN', d).value = p.titulo; $('#esD', d).value = (p.estrategia || '').slice(0, 140); ref = {pop:p.titulo, plantilla:null}; }
      $('#esN', d).scrollIntoView({block:'center'}); aviso('Ajusta minutos y esfuerzo, y guarda'); };
    $('#esOk', d).onclick = ()=>{ const n = $('#esN', d).value.trim(); if(!n){ aviso('Ponle nombre a la sesión'); return; }
      const nn = {n, min:Math.max(5, Math.min(600, ent($('#esMin', d).value) || 45)), rpe:+$('#esRpe', d).value || null, d:$('#esD', d).value.trim()};
      if(ref.pop) nn.pop = ref.pop; if(ref.plantilla) nn.plantilla = ref.plantilla;
      d.close(); alElegir(nn); };
  });
}
