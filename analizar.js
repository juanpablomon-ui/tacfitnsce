/* #TACFITNSCE — Analizar (pestaña): panel de mosaicos con días de entrenamiento, pesos y calculadora de % de 1RM,
   modalidades, desequilibrios, lesiones, sistemas energéticos (80/15/5 de la doctrina), récords, movimientos,
   capacidad física y recompensas.                                                                                   */
'use strict';
const MESES_C = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const hace = n=>iso(new Date(Date.now() - n*86400000));

/* ---------- Clasificaciones ---------- */
const PATRON = [
  ['empuje', /^(banca|banca_inclinada|press|push_press|push_jerk|split_jerk|jerk|thruster|cluster|flexiones|fondos|hspu|wall_ball|mc_press|mc_push_press|mc_banca|mc_thruster|kb_press|devil|mc_devil|balon_pecho|pino|mc_lateral)/],
  ['traccion', /^(barras|muscle_up|remo_barra|mc_remo|remo_anillas|subida_cuerda|curl|mc_curl|jalon|cargada|arranque|sumo_hp|kb_snatch|mc_snatch|kb_clean|mc_clean|encogimientos|envion|mc_envion)/],
  ['pierna', /^(sentadilla|sent_|peso_muerto|pm_|zancadas|mc_zancadas|pistol|hip_thrust|prensa|extension_cuad|cajon|subida_cajon|kb_goblet|buenos_dias|mc_step|kb_swing|trineo|mc_pm|sandbag|atlas|neumatico)/],
  ['core', /^(abdominales|abd_|ghd|hiperextension|toes|rodillas_codos|elev_piernas|v_ups|hollow|crunch|giros|rueda|plancha|l_sit|superman|sent_pared|turco)/],
];
const patronDe = id=>{ for(const [k, re] of PATRON) if(re.test(id)) return k; return null; };
const SISTEMAS = {aer:{n:'Aeróbico', c:'var(--a)', meta:80, ej:'marcha, trote largo, zona 2'}, glu:{n:'Glucolítico', c:'#f08a3a', meta:15, ej:'intervalos, circuitos de combate, metcons'}, fos:{n:'Fosfágeno', c:'var(--na)', meta:5, ej:'sprints máximos, potencia, fuerza máxima'}};
/* Minutos de un entrenamiento repartidos por sistema energético (aproximación con reglas simples) */
function sistemasSesion(s){
  const m = metricas(s), min = m.min || cargaSesion(s).v / (ent(s.rpe) || 6), rpe = ent(s.rpe) || 6, w = s.w, out = {aer:0, glu:0, fos:0};
  const ids = w ? (w.uno ? [w.uno.mov] : (w.secc.in || []).concat(w.secc.main || [], w.secc.out || []).map(x=>x.mov)) : [];
  const dist = w && w.uno ? metros(w.uno.dist, w.uno.distU) || 0 : 0;
  if(w && w.uno){
    const c = w.uno.c;
    const met = w.uno.metodo;
    if(c==='dist' && met==='cext') out.aer += min;
    else if(c==='dist' && met==='fartlek'){ out.aer += min*0.7; out.glu += min*0.3; }
    else if(c==='dist' && (met==='cint' || met==='test')) out.glu += min;
    else if(c==='dist') out[(w.uno.mov==='sprint' || (dist && dist <= 200)) ? 'fos' : rpe >= 8 && min < 20 ? 'glu' : 'aer'] += min;
    else if(c==='peso'){ const maxR = Math.min(...(w.uno.series || []).map(x=>ent(x.reps) || 1)); out[maxR <= 5 ? 'fos' : 'glu'] += min; }
    else out[rpe <= 5 ? 'aer' : 'glu'] += min;
  } else if(w && w.estilo){
    const sprint = ids.some(id=>id==='sprint') || ((w.secc.main || []).some(x=>x.mov && catKm(x.mov) && metros(x.dist, x.distU) && metros(x.dist, x.distU) <= 100));
    if(w.estilo==='intervalos'){ out[(ent(w.params.trabajo) || 60) <= 15 ? 'fos' : 'glu'] += min; }
    else if(w.estilo==='calidad'){ const maxR = Math.min(...(w.secc.main || []).filter(x=>!x.descanso).map(x=>ent(x.reps) || 10)); out[maxR <= 5 ? 'fos' : rpe <= 5 ? 'aer' : 'glu'] += min; }
    else if(sprint){ out.fos += min * 0.35; out.glu += min * 0.65; }
    else if(rpe <= 5) out.aer += min;
    else out.glu += min;
  } else out[rpe <= 5 ? 'aer' : 'glu'] += min;
  return out;
}

/* ---------- Panel principal ---------- */
const ANALISIS = [
  {id:'informe', n:'Informe y comparación', ic:'📊', c:'#4a7fc0'},
  {id:'energia', n:'Energía y calorías', ic:'🔥', c:'#c0552f'},
  {id:'dias', n:'Días de entrenamiento', ic:'📅', c:'#5b6fd6'},
  {id:'sistemas', n:'Sistemas 80/15/5', ic:'🔋', c:'#2f9e8f'},
  {id:'rec', n:'Récords', ic:'🏆', c:'#b8860b'},
  {id:'pesos', n:'Pesos y % 1RM', ic:'🏋️', c:'#c07a1f'},
  {id:'modal', n:'Modalidades', ic:'🧭', c:'#3a8f5c'},
  {id:'deseq', n:'Desequilibrios', ic:'⚖️', c:'#6c63b5'},
  {id:'mov', n:'Movimientos', ic:'🧩', c:'#4b7f9e'},
  {id:'lesiones', n:'Lesiones', ic:'🩹', c:'#b5534b'},
  {id:'capacidad', n:'Nivel de capacidad', ic:'📈', c:'#6f8a2a'},
  {id:'recompensas', n:'Recompensas', ic:'🎖️', c:'#8a6d2a'},
];
function datoMosaico(id){
  const anio = new Date().getFullYear() + '-01-01';
  switch(id){
    case 'informe': return 'Informe de ' + MESES_L[new Date().getMonth()];
    case 'energia': return fmtKcal(gastoDia(hoyISO()).total) + ' hoy';
    case 'dias': return new Set(S.sesiones.filter(s=>s.fecha >= anio).map(s=>s.fecha)).size + ' días este año';
    case 'sistemas': { const d = distribucion(28); return d.total ? Math.round(d.pct.aer) + ' / ' + Math.round(d.pct.glu) + ' / ' + Math.round(d.pct.fos) : 'Sin datos'; }
    case 'rec': return todosEj().filter(e=>mejorDe(e.id)).length + ' con marca';
    case 'pesos': { const l = levantamientos(); return l.length ? l.length + ' levantamientos' : 'Calculadora'; }
    case 'modal': { const g = modalidades(hace(30)); return g[0] && g[0].n ? GRUPOS[g[0].g].corto + ' ' + Math.round(g[0].pct) + ' %' : 'Sin datos'; }
    case 'deseq': { const d = desequilibrios(hace(90)); return d.empuje + d.traccion ? 'Empuje/tracción ' + fmtNum(Math.round(d.ratioET*10)/10) : 'Sin datos'; }
    case 'mov': return Object.keys(usoMovs()).length + ' usados';
    case 'lesiones': { const a = limitesActivos(); return a.length ? a.length + ' activa' + (a.length>1 ? 's' : '') : 'Ninguna activa'; }
    case 'capacidad': { const c = nivelesCapacidad().filter(x=>x.nivel!=null); return c.length ? NIVELES[Math.round(c.reduce((a, x)=>a + x.nivel, 0)/c.length)] : 'Sin evaluar'; }
    case 'recompensas': return puntos().rango;
  }
  return '';
}
function vAnalizar(){
  $('#vista').innerHTML = `<h2>Analizar</h2>
    ${htmlTuProgreso()}
    <h3>Explorar</h3>
    <div class="mosaicos">${ANALISIS.map(a=>`<button class="mosaico" data-an="${a.id}" style="--c:${a.c}"><span class="mo-ic">${a.ic}</span><span class="mo-n">${a.n}</span><span class="mo-dato num">${esc(datoMosaico(a.id))}</span></button>`).join('')}</div>`;
  if($('#tpMuro')) $('#tpMuro').onclick = verMuroCompleto;
  $$('[data-an]').forEach(b=>b.onclick = ()=>{ const k = b.dataset.an;
    if(k==='capacidad' || k==='recompensas'){ ir('perfil'); if(k==='recompensas') setTimeout(()=>{ const x = $('#pInsignias'); if(x) x.scrollIntoView(); }, 50); return; }
    vistaProg = k; pref('vistaProg', k); vProgreso(); window.scrollTo(0, 0); });
}
const VISTAS_AN = {energia:vEnergia, informe:vInforme, dias:vDias, sistemas:vSistemas, pesos:vPesos, modal:vModalidades, deseq:vDesequilibrios, lesiones:vLesiones};

/* ---------- Gráfico de barras simple ---------- */
function barras(datos, alto, color){
  const max = Math.max(1, ...datos.map(d=>d.v));
  return `<div class="barras-an" style="height:${alto + 34}px">${datos.map(d=>`<div><b class="num">${d.v || ''}</b><i style="height:${Math.max(2, d.v/max*alto)}px;background:${d.c || color || 'var(--acento)'}"></i><span>${esc(d.k)}</span></div>`).join('')}</div>`;
}

/* ---------- Días de entrenamiento ---------- */
function vDias(){
  const dias = new Set(S.sesiones.map(s=>s.fecha)), hoy = new Date(), meses = [];
  for(let i=11;i>=0;i--){ const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1), k = iso(d).slice(0, 7); meses.push({k:MESES_C[d.getMonth()], v:[...dias].filter(f=>f.startsWith(k)).length}); }
  const sem = [0, 0, 0, 0, 0, 0, 0]; [...dias].forEach(f=>sem[(new Date(f + 'T12:00:00').getDay() + 6) % 7]++);
  const meta = ent(S.perfil.meta) || 4; let ok = 0; const lun = inicioSemana();
  for(let i=1;i<=12;i++){ const a = new Date(lun); a.setDate(a.getDate() - 7*i); const b = new Date(a); b.setDate(b.getDate() + 6); if([...dias].filter(f=>f >= iso(a) && f <= iso(b)).length >= meta) ok++; }
  const ult12 = [...dias].filter(f=>f >= hace(84)).length;
  $('#vista').innerHTML = `${segProgreso('Días de entrenamiento')}
    <div class="tiles">
      <div class="tile"><div class="k">Días entrenados (total)</div><div class="v">${dias.size}</div></div>
      <div class="tile"><div class="k">Promedio semanal (12 sem.)</div><div class="v">${fmtNum(Math.round(ult12/12*10)/10)}</div></div>
      <div class="tile"><div class="k">Mejor racha</div><div class="v">${rachaMaxima([...dias])}<span class="suave" style="font-size:13px"> días</span></div></div>
    </div>
    <div class="tarjeta"><div class="etiqueta">Días por mes</div>${barras(meses, 90)}</div>
    <div class="tarjeta"><div class="etiqueta">Día de la semana preferido</div>${barras(['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((k, i)=>({k, v:sem[i]})), 70, 'var(--a)')}</div>
    <div class="tarjeta"><div class="entre"><span>Semanas con tu meta cumplida (${meta}/sem)</span><b class="num" style="color:var(--acento)">${ok} de 12</b></div>
      <div class="barra-logro"><span style="width:${Math.round(ok/12*100)}%"></span></div></div>
    <div class="tarjeta"><div class="etiqueta">Mapa del año</div>${mapaAnio()}</div>`;
  enlazarSegProgreso();
}

/* ---------- Sistemas energéticos 80/15/5 ---------- */
function distribucion(diasN, hasta){
  const desde = hace(diasN), out = {aer:0, glu:0, fos:0};
  S.sesiones.filter(s=>s.fecha >= desde && (!hasta || s.fecha <= hasta)).forEach(s=>{ const x = sistemasSesion(s); out.aer += x.aer; out.glu += x.glu; out.fos += x.fos; });
  const total = out.aer + out.glu + out.fos, pct = {aer:0, glu:0, fos:0};
  if(total) Object.keys(out).forEach(k=>pct[k] = out[k] / total * 100);
  return {min:out, pct, total};
}
function vSistemas(){
  const d = distribucion(28), sem = [];
  for(let i=3;i>=0;i--){ const fin = new Date(Date.now() - i*7*86400000); const x = {aer:0, glu:0, fos:0};
    S.sesiones.filter(s=>s.fecha > iso(new Date(fin - 7*86400000)) && s.fecha <= iso(fin)).forEach(s=>{ const y = sistemasSesion(s); x.aer += y.aer; x.glu += y.glu; x.fos += y.fos; }); sem.push(x); }
  const barra = (p, alto)=>`<div class="barra-sis" style="height:${alto || 26}px">${Object.keys(SISTEMAS).map(k=>`<i style="flex:${Math.max(p[k], 0.001)};background:${SISTEMAS[k].c}" title="${SISTEMAS[k].n}"></i>`).join('')}</div>`;
  const falta = !d.total ? null : Object.keys(SISTEMAS).map(k=>({k, dif:d.pct[k] - SISTEMAS[k].meta})).sort((a, b)=>a.dif - b.dif)[0];
  $('#vista').innerHTML = `${segProgreso('Sistemas energéticos')}
    <p class="suave chico">Tu doctrina (principio 5.2) recomienda 80 % aeróbico, 15 % glucolítico y 5 % fosfágeno. «Lo fácil debe ser fácil; lo intenso debe ser máximo».</p>
    <div class="tarjeta"><div class="etiqueta">Tus últimas 4 semanas</div>
      ${d.total ? `${barra(d.pct, 30)}<div class="sis-leyenda">${Object.entries(SISTEMAS).map(([k, x])=>`<div><i style="background:${x.c}"></i><b class="num">${Math.round(d.pct[k])} %</b><span>${x.n} · meta ${x.meta} %</span></div>`).join('')}</div>` : '<div class="vacio">Registra entrenamientos con duración y esfuerzo para ver tu distribución.</div>'}
      <div class="etiqueta" style="margin-top:14px">Objetivo de la doctrina</div>${barra({aer:80, glu:15, fos:5}, 14)}</div>
    ${falta && Math.abs(falta.dif) >= 5 ? `<div class="tarjeta aviso-sis"><b>Para acercarte al 80/15/5:</b> te falta trabajo <b>${SISTEMAS[falta.k].n.toLowerCase()}</b> (${Math.round(d.pct[falta.k])} % de ${SISTEMAS[falta.k].meta} %). Agrega ${SISTEMAS[falta.k].ej}.</div>` : d.total ? '<div class="tarjeta aviso-sis ok">Tu distribución está cerca de la recomendada. ¡Bien!</div>' : ''}
    <div class="tarjeta"><div class="etiqueta">Semana a semana (minutos)</div>
      ${sem.map((x, i)=>{ const t = x.aer + x.glu + x.fos; return `<div class="sis-sem"><span class="num suave">${i===3 ? 'Esta' : 'S-' + (3-i)}</span>${t ? barra({aer:x.aer/t*100, glu:x.glu/t*100, fos:x.fos/t*100}, 12) : '<div class="barra-sis vacia" style="height:12px"></div>'}<span class="num">${Math.round(t)}′</span></div>`; }).join('')}</div>
    <p class="nota">Estimación con reglas simples: esfuerzo 5 o menos y trabajo continuo = aeróbico; sprints de hasta 100-200 m y series de 5 repeticiones o menos = fosfágeno; circuitos, intervalos y esfuerzo alto = glucolítico.</p>`;
  enlazarSegProgreso();
}

/* ---------- Pesos y calculadora de % de 1RM ---------- */
function levantamientos(){
  const por = {};
  S.sesiones.forEach(s=>(s.recs || []).forEach(r=>{ const m = /^rm:([^:]+):(\d+)$/.exec(r.ej), legado = {sentadilla:'sentadilla', pesomuerto:'peso_muerto', banca:'banca', militar:'press', envion:'envion'}[r.ej];
    const mov = m ? m[1] : legado, reps = m ? +m[2] : legado ? 1 : null; if(!mov) return;
    const est = reps===1 ? r.valor : r.valor * (1 + reps/30), x = por[mov] = por[mov] || {mov, real:0, est:0, fecha:''};
    if(reps===1 && r.valor > x.real){ x.real = r.valor; x.fecha = s.fecha; } if(est > x.est) x.est = est; }));
  S.marcas.forEach(m=>{ const legado = {sentadilla:'sentadilla', pesomuerto:'peso_muerto', banca:'banca', militar:'press', envion:'envion'}[m.ej]; if(!legado) return;
    const x = por[legado] = por[legado] || {mov:legado, real:0, est:0, fecha:''}; if(m.valor > x.real){ x.real = m.valor; x.fecha = m.fecha; } if(m.valor > x.est) x.est = m.valor; });
  return Object.values(por).sort((a, b)=>b.est - a.est);
}
const REPS_PCT = {100:'1', 95:'2', 90:'3-4', 85:'5-6', 80:'7-8', 75:'9-10', 70:'11-12', 65:'13-15', 60:'16-20', 55:'20+', 50:'calentamiento'};
let calc1RM = '';
function vPesos(){
  const L = levantamientos(), peso = medidaReciente('peso');
  $('#vista').innerHTML = `${segProgreso('Pesos y % 1RM')}
    <div class="tarjeta"><div class="etiqueta">Calculadora de porcentajes</div>
      <div class="fila"><div><label>Levantamiento</label><select id="calcMov"><option value="">Escribir 1RM a mano</option>${L.map(l=>`<option value="${l.mov}">${esc(nomMov(movDe(l.mov) || {n:l.mov}))} · ${verPeso(Math.round(Math.max(l.real, l.est)*10)/10, 'kg')}</option>`).join('')}</select></div>
      <div><label>1RM (${pesoPref()})</label><input id="calc1" inputmode="decimal" value="${esc(calc1RM)}" placeholder="${pesoPref()==='lb' ? '225' : '100'}"></div></div>
      <div id="calcTabla"></div><button class="btn ancho" id="bDiscos" style="margin-top:8px">Calculadora de discos</button></div>
    <h3>Tus levantamientos</h3>
    <div class="tarjeta">${L.length ? `<table class="tabla-mov"><tr><th>Movimiento</th><th>1RM real</th><th>1RM est.</th>${peso ? '<th>× peso</th>' : ''}</tr>
      ${L.map(l=>`<tr data-lev="${l.mov}"><td>${esc(nomMov(movDe(l.mov) || {n:l.mov}))}</td><td class="num">${l.real ? verPeso(l.real, 'kg', l.mov) : '—'}</td><td class="num">${verPeso(Math.round(l.est*10)/10, 'kg', l.mov)}</td>${peso ? `<td class="num">${fmtNum(Math.round(Math.max(l.real, l.est)/peso*100)/100)}</td>` : ''}</tr>`).join('')}</table>
      <p class="nota">1RM estimado con la fórmula de Epley (peso × (1 + repeticiones ÷ 30)) a partir de tu mejor serie.${peso ? '' : ' Anota tu peso en Perfil para ver la fuerza relativa.'}</p>`
      : '<div class="vacio">Registra un «Un solo movimiento» con peso (series de repeticiones × kg) para ver tus levantamientos.</div>'}</div>`;
  enlazarSegProgreso();
  const tabla = ()=>{ const v = num($('#calc1').value); calc1RM = $('#calc1').value;
    $('#calcTabla').innerHTML = v ? `<table class="tabla-mov calc"><tr><th>%</th><th>Peso</th><th>Reps aprox.</th></tr>${[100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50].map(p=>{ const u = pesoPref(), paso = u==='lb' ? 5 : 2.5, w = Math.round(v*p/100/paso)*paso; return `<tr data-disco="${w}"><td class="num">${p} %</td><td class="num"><b>${fmtNum(w)} ${u}</b> <span class="suave">›</span></td><td class="num suave">${REPS_PCT[p]}</td></tr>`; }).join('')}</table><p class="nota">Pesos redondeados a ${pesoPref()==='lb' ? '5 lb' : '2,5 kg'}. Toca un peso para ver qué discos poner.</p>` : ''; };
  $('#calcMov').onchange = ()=>{ const l = L.find(x=>x.mov===$('#calcMov').value); if(l){ const kg = Math.max(l.real, l.est); $('#calc1').value = pesoPref()==='lb' ? String(lbDeKg(kg)) : String(Math.round(kg*10)/10).replace('.', ','); } tabla(); };
  $('#calc1').oninput = tabla; tabla();
  $('#calcTabla').onclick = e=>{ const tr = e.target.closest('[data-disco]'); if(tr) calculadoraDiscos(tr.dataset.disco, pesoPref()); };
  if($('#bDiscos')) $('#bDiscos').onclick = ()=>calculadoraDiscos(null, pesoPref());
  $$('[data-lev]').forEach(tr=>tr.onclick = ()=>{ $('#calcMov').value = tr.dataset.lev; $('#calcMov').onchange(); window.scrollTo({top:0, behavior:'smooth'}); });
}

/* ---------- Modalidades ---------- */
function modalidades(desde){
  const c = {}; let t = 0;
  S.sesiones.filter(s=>s.fecha >= desde).forEach(s=>{ const g = grupoDe(s), m = metricas(s).min || 45; c[g] = (c[g] || 0) + m; t += m; });
  return Object.keys(GRUPOS).map(g=>({g, n:c[g] || 0, pct:t ? (c[g] || 0)/t*100 : 0})).sort((a, b)=>b.n - a.n);
}
let periodoModal = 90;
function dona(partes){
  let a = 0; const R = 40, C = 2*Math.PI*R;
  return `<svg viewBox="0 0 100 100" class="dona">${partes.filter(p=>p.pct > 0).map(p=>{ const el = `<circle cx="50" cy="50" r="${R}" fill="none" stroke="var(--g-${p.g})" stroke-width="16" stroke-dasharray="${p.pct/100*C} ${C}" stroke-dashoffset="${-a/100*C}" transform="rotate(-90 50 50)"/>`; a += p.pct; return el; }).join('')}</svg>`;
}
function vModalidades(){
  const G = modalidades(hace(periodoModal)), con = G.filter(x=>x.n);
  $('#vista').innerHTML = `${segProgreso('Modalidades')}
    <div class="chips" id="perMod" style="padding-top:0">${[[30, '30 días'], [90, '90 días'], [365, 'Un año'], [99999, 'Total']].map(([d, n])=>`<button data-d="${d}" class="${periodoModal===d ? 'activa' : ''}">${n}</button>`).join('')}</div>
    <div class="tarjeta">${con.length ? `<div class="dona-caja">${dona(G)}<div class="dona-ley">${con.map(x=>`<div><i class="marca-g g-${x.g}"></i><span>${GRUPOS[x.g].ic} ${GRUPOS[x.g].corto}</span><b class="num">${Math.round(x.pct)} %</b></div>`).join('')}</div></div>
      <p class="nota">Porcentaje del tiempo de entrenamiento según el grupo del movimiento principal de cada sesión.</p>` : '<div class="vacio">Sin entrenamientos en este período.</div>'}</div>
    ${con.length ? `<div class="tarjeta">${G.map(x=>`<div class="entre" style="margin:6px 0"><span><i class="marca-g g-${x.g}" style="display:inline-block;margin-right:6px"></i>${GRUPOS[x.g].n}</span><span class="num">${Math.round(x.n)} min</span></div>`).join('')}</div>` : ''}`;
  enlazarSegProgreso();
  $$('#perMod button').forEach(b=>b.onclick = ()=>{ periodoModal = +b.dataset.d; vModalidades(); });
}

/* ---------- Desequilibrios ---------- */
function desequilibrios(desde){
  const t = {empuje:0, traccion:0, pierna:0, core:0};
  S.sesiones.filter(s=>s.fecha >= desde).forEach(s=>Object.entries(contribuciones(s)).forEach(([id, o])=>{ const p = patronDe(id); if(p) t[p] += o.reps; }));
  t.ratioET = t.traccion ? t.empuje / t.traccion : t.empuje ? 9 : 1;
  const torso = t.empuje + t.traccion; t.ratioPT = torso ? t.pierna / torso : t.pierna ? 9 : 1;
  return t;
}
function vDesequilibrios(){
  const d = desequilibrios(hace(90));
  const balanza = (a, an, b, bn, ideal)=>{ const tot = a + b, pa = tot ? a/tot*100 : 50;
    return `<div class="balanza"><div class="entre"><span>${an} <b class="num">${a}</b></span><span><b class="num">${b}</b> ${bn}</span></div>
      <div class="bal-barra"><i style="width:${pa}%"></i><span class="bal-ideal" style="left:${ideal}%"></span></div></div>`; };
  const consejo = [];
  if(d.empuje + d.traccion > 50){ if(d.ratioET > 1.5) consejo.push('Haces mucho más empuje que tracción: agrega barras, remos y cargadas para proteger tus hombros.'); else if(d.ratioET < 0.67) consejo.push('Haces mucha más tracción que empuje: agrega flexiones, press y fondos.'); }
  if(d.pierna + d.empuje + d.traccion > 50){ if(d.ratioPT < 0.6) consejo.push('Tu tren inferior está por debajo del superior: la marcha con carga y la evacuación de heridos dependen de piernas y cadera fuertes.'); else if(d.ratioPT > 2) consejo.push('Entrenas mucho más piernas que torso: agrega trabajo de tracción y empuje.'); }
  $('#vista').innerHTML = `${segProgreso('Desequilibrios')}
    <p class="suave chico">Repeticiones de los últimos 90 días por patrón de movimiento. Un desequilibrio sostenido aumenta el riesgo de lesión.</p>
    <div class="tarjeta">${balanza(d.empuje, 'Empuje', d.traccion, 'Tracción', 50)}${balanza(d.pierna, 'Pierna', d.empuje + d.traccion, 'Torso', 50)}
      <div class="entre" style="margin-top:12px"><span>Core</span><b class="num">${d.core} repeticiones</b></div></div>
    ${consejo.length ? `<div class="tarjeta aviso-sis">${consejo.map(c=>`<p>⚠ ${esc(c)}</p>`).join('')}</div>` : d.empuje + d.traccion + d.pierna > 50 ? '<div class="tarjeta aviso-sis ok">Tus patrones de movimiento están equilibrados.</div>' : '<div class="tarjeta vacio">Con más entrenamientos de fuerza o gimnasia verás tu equilibrio.</div>'}
    <p class="nota">La línea marca el equilibrio 1:1. Empuje: press, flexiones, fondos, thrusters. Tracción: barras, remos, cargadas, arranques. Pierna: sentadillas, peso muerto, zancadas, saltos.</p>`;
  enlazarSegProgreso();
}

/* ---------- Lesiones ---------- */
function vLesiones(){
  const act = limitesActivos(), todas = S.perfil.limites || [], pq = estadoParq();
  const riesgo = act.length ? S.sesiones.filter(s=>s.fecha >= hace(30)).filter(s=>{ const ids = Object.keys(contribuciones(s)).concat(s.w && s.w.uno ? [s.w.uno.mov] : []); return act.some(l=>ZONAS[l.zona] && l.zona!=='cardio' && ids.some(id=>ZONAS[l.zona].re.test(id))); }) : [];
  $('#vista').innerHTML = `${segProgreso('Lesiones')}
    <div class="tarjeta"><div class="entre"><span class="titulo">PAR-Q+</span><span class="chip ${pq.k==='ok' ? 'MB' : pq.k==='si' ? 'NA' : 'gris'}">${pq.txt}</span></div><div class="suave chico" style="margin-top:6px">${esc(pq.det)}</div></div>
    <h3>Limitaciones activas</h3>
    <div class="tarjeta">${act.length ? act.map(l=>`<div class="lesion"><div class="entre"><b>${esc(ZONAS[l.zona].n)}</b><span class="chip A">${l.tipo==='permanente' ? 'Permanente' : l.hasta ? 'hasta ' + verFecha(l.hasta) : 'Temporal'}</span></div>
      ${l.nota ? `<div class="suave chico">${esc(l.nota)}</div>` : ''}<div class="chico" style="margin-top:4px">Recomendación: ${esc(ZONAS[l.zona].alt)}.</div>
      ${l.zona!=='cardio' ? `<div class="suave chico" style="margin-top:4px">Movimientos a cuidar: ${MOVS.filter(m=>ZONAS[l.zona].re.test(m.id)).slice(0, 12).map(m=>nomMov(m)).join(', ')}…</div>` : ''}</div>`).join('') : '<div class="suave">Sin limitaciones activas. 💪</div>'}</div>
    ${riesgo.length ? `<div class="tarjeta aviso-sis"><b>${riesgo.length} entrenamiento${riesgo.length>1 ? 's' : ''} de los últimos 30 días</b> incluyeron movimientos que cargan una zona lesionada. Revisa si fueron adaptados.</div>` : ''}
    <h3>Historial</h3>
    <div class="tarjeta">${todas.length ? `<ul class="lista">${todas.map(l=>`<li class="entre"><span>${esc(ZONAS[l.zona].n)}${l.nota ? ' · ' + esc(l.nota) : ''}</span><span class="suave chico">${l.tipo==='permanente' ? 'permanente' : l.hasta ? 'hasta ' + verFecha(l.hasta) : 'temporal'}</span></li>`).join('')}</ul>` : '<div class="suave">Sin registros.</div>'}
      <button class="btn ancho" id="lesPerfil" style="margin-top:10px">Agregar o editar en Perfil</button></div>`;
  enlazarSegProgreso();
  $('#lesPerfil').onclick = ()=>ir('perfil');
}

/* ======================= «Tu progreso»: resumen al inicio de Analizar ======================= */
/* 1) Este mes vs el mismo período del mes anterior */
function comparacionMes(){
  const h = new Date(), d = h.getDate(), ini = new Date(h.getFullYear(), h.getMonth(), 1), iniAnt = new Date(h.getFullYear(), h.getMonth()-1, 1);
  const finAnt = new Date(h.getFullYear(), h.getMonth()-1, Math.min(d, new Date(h.getFullYear(), h.getMonth(), 0).getDate()));
  const a = acumular(S.sesiones.filter(s=>s.fecha >= iso(ini))), b = acumular(S.sesiones.filter(s=>s.fecha >= iso(iniAnt) && s.fecha <= iso(finAnt)));
  return {a, b, mesAnt:MESES_L[iniAnt.getMonth()], dias:d};
}
/* 2) Forma física: condición (promedio de 42 días) y fatiga (7 días) de la carga diaria; forma = condición − fatiga */
function formaFisica(dias){
  dias = dias || 90; const porDia = cargasPorDia(), out = []; let ctl = 0, atl = 0;
  for(let i = dias + 120; i >= 0; i--){ const f = hace(i), c = porDia[f] || 0; ctl += (c - ctl) / 42; atl += (c - atl) / 7; if(i < dias) out.push({f, ctl, atl, tsb:ctl - atl}); }
  return out;
}
/* Estado según la forma relativa a la condición (forma ÷ condición): evita que cargas normales parezcan sobrecarga */
const formaPct = x=>x && x.ctl > 1 ? x.tsb / x.ctl * 100 : 0;
const ESTADO_FORMA = t=>t > 5 ? ['Fresco', 'var(--a)', 'Descansado: buen momento para una prueba o una marca.'] : t >= -10 ? ['En forma', 'var(--mb)', 'Equilibrio entre entrenamiento y recuperación.']
  : t >= -35 ? ['Entrenando', '#e0b63c', 'Acumulando carga: es normal sentirse cansado.'] : ['Sobrecargado', 'var(--na)', 'Mucha fatiga acumulada: prioriza recuperar.'];
function graficoForma(F){
  if(!F.length || F.every(x=>x.ctl < 0.5)) return '<div class="vacio chico">Registra entrenamientos con duración y esfuerzo para ver tu curva de forma.</div>';
  const W = 360, H = 130, max = Math.max(1, ...F.map(x=>Math.max(x.ctl, x.atl))), X = i=>i / (F.length - 1) * W, Y = v=>H - 18 - v / max * (H - 26);
  const linea = k=>F.map((x, i)=>X(i).toFixed(1) + ',' + Y(x[k]).toFixed(1)).join(' ');
  const banda = F.map((x, i)=>`<rect x="${X(i).toFixed(1)}" y="${H - 10}" width="${(W / F.length + 0.6).toFixed(1)}" height="8" fill="${ESTADO_FORMA(formaPct(x))[1]}"/>`).join('');
  return `<svg class="forma-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Curva de condición y fatiga de los últimos 90 días">
    <polyline points="${linea('ctl')}" fill="none" stroke="var(--a)" stroke-width="2.5"/>
    <polyline points="${linea('atl')}" fill="none" stroke="#f08a3a" stroke-width="1.5" stroke-dasharray="4 3"/>${banda}</svg>
    <div class="forma-ley"><span style="color:var(--a)">━ condición</span><span style="color:#f08a3a">┅ fatiga</span><span>▬ estado (abajo)</span></div>`;
}
/* 3) Muro de logros: récords superados, hitos, insignias, rangos y controles PSF */
function muroLogros(){
  const ev = [];
  todosEj().forEach(e=>{ if(e.u==='kgc') return; let best = null;
    valoresDe(e.id).forEach(v=>{ const mejor = best==null || (menorEsMejor(e.u) ? v.valor < best : v.valor > best);
      if(mejor && best!=null){ const d = v.valor - best, dTxt = e.u==='tiempo' ? '−' + PSF.verTiempo(Math.abs(d)) : e.u==='kg' ? '+' + fmtNum(d) + ' kg' : e.u==='m' ? '+' + fmtNum(d) + ' m' : '+' + fmtNum(Math.round(d*10)/10);
        ev.push({fecha:v.fecha, ic:'🏆', t:e.nombre + ': ' + fmt(e, v.valor, v.txt), d:'récord · ' + dTxt, tipo:'rec'}); }
      if(mejor) best = v.valor; }); });
  hitos().logrados.forEach(h=>ev.push({fecha:h.fecha, ic:'🎯', t:h.txt, d:'hito', tipo:'hito'}));
  Object.entries(S.insFechas || {}).forEach(([id, f])=>{ const [b, x] = id.split('_'), I = INSIGNIAS.find(i=>i.id===b); if(!I) return;
    ev.push({fecha:f, ic:I.ic, t:I.n + ' ' + ROMANOS[I.t.indexOf(+x) + 1], d:'insignia', tipo:'ins'}); });
  (S.rangoHist || []).filter(r=>!r.inicial).forEach(r=>ev.push({fecha:r.fecha, ic:'⭐', t:'Rango ' + r.rango, d:'subiste de rango', tipo:'rango'}));
  S.controles.filter(c=>c.eval).forEach(c=>ev.push({fecha:c.fecha, ic:'🎖️', t:'Control PSF: ' + PSF.NOMBRES[c.eval], d:'PSF', tipo:'psf'}));
  return ev.sort((a, b)=>a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0);
}
/* 4) Proyección: tendencia lineal de una prueba PSF hacia el nivel Apto MB de tu edad */
function proyeccionPSF(){
  const pp = perfilPSF(); if(!pp.sexo || pp.edad==null) return null;
  const per = PSF.proximoPeriodo(), finEval = new Date(Date.now() + per.dias * 86400000), out = [];
  [['psf2400', 'Carrera 2.400 m', v=>PSF.carrera(pp, v), true], ['abd1', 'Abdominales', v=>PSF.abdominales(pp, v), false],
   [PSF.pruebaBrazos(pp)==='barra' ? 'barras' : 'flex1', PSF.pruebaBrazos(pp)==='barra' ? 'Barras' : 'Flexiones', v=>PSF.brazos(pp, v), false]].forEach(([ej, n, cl, tiempo])=>{
    const vs = valoresDe(ej).filter(v=>v.fecha >= hace(180)); if(vs.length < 3) return;
    const xs = vs.map(v=>new Date(v.fecha + 'T12:00:00').getTime() / 86400000), ys = vs.map(v=>v.valor), mx = xs.reduce((a, b)=>a + b, 0) / xs.length, my = ys.reduce((a, b)=>a + b, 0) / ys.length;
    const den = xs.reduce((a, x)=>a + (x - mx) ** 2, 0); if(!den) return;
    const pend = xs.reduce((a, x, i)=>a + (x - mx) * (ys[i] - my), 0) / den, mejora = tiempo ? pend < 0 : pend > 0;
    const ult = vs[vs.length - 1].valor, r = cl(ult), meta = r.mb, hoyX = Date.now() / 86400000;
    const enEval = my + pend * (finEval.getTime() / 86400000 - mx), nivelEval = cl(tiempo ? Math.round(enEval) : Math.round(enEval)).nivel;
    let fechaMeta = null;
    if(r.nivel!=='MB' && mejora){ const x = mx + (meta - my) / pend; if(x > hoyX && x - hoyX < 400) fechaMeta = new Date(x * 86400000); }
    out.push({n, ej, tiempo, ult, r, mejora, fechaMeta, enEval, nivelEval, per, pendMes:pend * 30});
  });
  return out;
}
function htmlTuProgreso(){
  const C = comparacionMes(), F = formaFisica(90), ult = F[F.length - 1] || {ctl:0, atl:0, tsb:0}, ef = ESTADO_FORMA(formaPct(ult)), M = muroLogros(), P = proyeccionPSF();
  const fl = (a, b)=>!b ? (a ? '<span class="sube">nuevo</span>' : '<span class="suave">—</span>') : a > b*1.02 ? `<span class="sube">▲ ${Math.round((a/b - 1)*100)} %</span>` : a < b*0.98 ? `<span class="baja">▼ ${Math.round((1 - a/b)*100)} %</span>` : '<span class="suave">＝</span>';
  const fechaC = d=>d.getDate() + ' ' + MESES_C[d.getMonth()];
  return `<div class="tp">
    <div class="entre"><h3 style="margin:0">Tu progreso · ${MESES_L[new Date().getMonth()]}</h3><span class="suave chico">vs. 1-${C.dias} de ${C.mesAnt}</span></div>
    <div class="tp-comp">
      <div><span class="k">Sesiones</span><b class="num">${C.a.n}</b>${fl(C.a.n, C.b.n)}</div>
      <div><span class="k">${uDist()==='mi' ? 'Millas' : 'Km'}</span><b class="num">${fmtNum(nKm(C.a.km))}</b>${fl(C.a.km, C.b.km)}</div>
      <div><span class="k">Horas</span><b class="num">${fmtHoras(C.a.min)}</b>${fl(C.a.min, C.b.min)}</div>
      <div><span class="k">${uTon()==='lb' ? 'Libras' : 'Toneladas'}</span><b class="num">${nTon(C.a.kg).toLocaleString('es-CL')}</b>${fl(C.a.kg, C.b.kg)}</div>
    </div>
    <div class="tarjeta tp-forma"><div class="entre"><span class="etiqueta">Forma física · 90 días</span><span class="chip-estado" style="background:${ef[1]}">${ef[0]}</span></div>
      ${graficoForma(F)}
      <div class="tp-forma-num num"><span>Condición <b>${Math.round(ult.ctl)}</b></span><span>Fatiga <b>${Math.round(ult.atl)}</b></span><span>Forma <b>${Math.round(formaPct(ult)) > 0 ? '+' : ''}${Math.round(formaPct(ult))} %</b></span></div>
      <p class="suave chico" style="margin:4px 0 0">${ef[2]} La condición sube con semanas constantes; la fatiga baja rápido al descansar.</p></div>
    <div class="tarjeta"><div class="entre"><span class="etiqueta">Muro de logros</span><span class="suave chico">${M.length} en total</span></div>
      ${M.length ? `<ul class="muro-logros">${M.slice(0, 6).map(e=>`<li class="ml-${e.tipo}" ${attrLogro(e)}><span class="ml-ic">${e.ic}</span><div><b>${esc(e.t)}</b><span>${esc(e.d)} · ${verFecha(e.fecha)}</span></div></li>`).join('')}</ul>
        ${M.length > 6 ? '<button class="link" id="tpMuro">Ver todos los logros ›</button>' : ''}` : '<div class="vacio chico">Tus récords, insignias, hitos y ascensos aparecerán aquí.</div>'}</div>
    ${P && P.length ? `<div class="tarjeta tp-proy"><div class="etiqueta">Proyección PSF · ${esc(P[0].per.nombre)}</div>
      ${P.map(p=>`<div class="proy"><div class="entre"><b>${p.n}</b>${chip(p.r.nivel)}</div><div class="suave chico">
        ${p.r.nivel==='MB' ? 'Ya estás en Apto MB. ' : p.fechaMeta ? `Al ritmo actual llegas a <b class="l">Apto MB</b> (${p.tiempo ? PSF.verTiempo(p.r.mb) : p.r.mb}) cerca del <b>${fechaC(p.fechaMeta)}</b>. ` : p.mejora ? 'Mejorando, pero a este ritmo no alcanzas Apto MB pronto. ' : 'Sin mejora en los últimos registros: revisa tu plan. '}
        ${`Si sigues así, ${p.per.enCurso ? 'al cierre del período' : 'al comenzar la ' + esc(p.per.nombre)} (${fechaC(new Date(Date.now() + p.per.dias * 86400000))}) marcarías <b>${p.tiempo ? PSF.verTiempo(Math.round(p.enEval)) : Math.max(0, Math.round(p.enEval)) + ' rep'}</b> ${chip(p.nivelEval)}. `}Tendencia: ${p.tiempo ? (p.pendMes < 0 ? '−' : '+') + PSF.verTiempo(Math.abs(Math.round(p.pendMes))) + ' por mes' : (p.pendMes >= 0 ? '+' : '') + fmtNum(Math.round(p.pendMes*10)/10) + ' rep por mes'}.</div></div>`).join('')}
      <p class="nota">Estimación lineal con tus registros de los últimos 6 meses (al menos 3).</p></div>` : ''}
    ${htmlPrediccion()}
  </div>`;
}
function verMuroCompleto(){
  const M = muroLogros();
  dialogo(`<div class="cab"><h2>Muro de logros</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <ul class="muro-logros">${M.map(e=>`<li class="ml-${e.tipo}" ${attrLogro(e)}><span class="ml-ic">${e.ic}</span><div><b>${esc(e.t)}</b><span>${esc(e.d)} · ${verFecha(e.fecha)}</span></div></li>`).join('')}</ul>`);
}

/* ======================= Movimientos con progreso: mapa del cuerpo y tarjetas ======================= */
/* Zonas del cuerpo que trabaja cada movimiento (principal = 1, secundaria = 0,5) */
const ZONAS_C = [
  ['pecho', 'Pecho', /^(banca|banca_inclinada|flexiones|fondos|mc_banca|aperturas|balon_pecho|burpee|mc_man_maker|devil|mc_devil)/],
  ['hombros', 'Hombros', /^(press|push_press|push_jerk|split_jerk|jerk|hspu|pino|caminata_manos|mc_press|mc_push_press|kb_press|mc_lateral|elev_frontales|face_pull|thruster|mc_thruster|kb_thruster|wall_ball|overhead|zancadas_overhead|sent_overhead|arranque|mc_snatch|kb_snatch|snatch|muscle_snatch|envion|mc_envion|turco|press_hombro|flexiones_pike|clean_press|cluster)/],
  ['espalda', 'Espalda', /^(barras|remo_barra|remo_anillas|mc_remo|remo_polea|jalon|peso_muerto|pm_|sumo_hp|muscle_up|subida_cuerda|pegboard|pullover|hiperextension|buenos_dias|encogimientos|kb_swing|sandbag|atlas|cargada|kb_clean|mc_clean|arrastre|trineo_tiro|remo$|remo_cal|ski|skin_cat|neumatico)/],
  ['brazos', 'Brazos', /^(curl|mc_curl|press_frances|triceps_polea|fondos|flexiones_diamante|barras_supinas|subida_cuerda|barras_comando|farmer|maleta_carry)/],
  ['core', 'Core', /^(abdominales|abd_|ghd|hiperextension|toes|rodillas_codos|elev_piernas|pies_anillas|v_ups|hollow|crunch|giros_rusos|rueda|plancha|l_sit|superman|sent_pared|turco|dead_bug|bird_dog|dragon_flag|patadas_tijera|escaladores|inchworm|gateo)/],
  ['piernas', 'Piernas', /^(sentadilla|sent_|zancadas|mc_zancadas|kb_lunges|pistol|cajon|subida_cajon|mc_step|salto|saltos|tuck_jumps|burpee|prensa|extension_cuad|curl_femoral|nordic|hip_thrust|puente_gluteo|elev_talones|kb_goblet|thruster|mc_thruster|kb_thruster|wall_ball|peso_muerto|pm_|kb_swing|cargada|arranque|envion|cluster|trineo|sumo_hp|marcha|carrera_cerro|sprint|tijeras|rodillas_arriba)/],
];
function zonasDe(id){ const m = movDe(id); const z = ZONAS_C.filter(([, , re])=>re.test(id)).map(([k])=>k); if(m && (m.g==='mono' || m.c==='dist' || m.c==='cal')) z.push('cardio'); return z; }
let periodoCuerpo = 30;
function cargaZonas(dias){
  const t = {pecho:0, hombros:0, espalda:0, brazos:0, core:0, piernas:0, cardio:0};
  S.sesiones.filter(s=>s.fecha >= hace(dias)).forEach(s=>Object.entries(contribuciones(s)).forEach(([id, o])=>{
    const pts = o.reps / 10 + o.m / 200 + o.cal / 5, z = zonasDe(id); z.forEach(k=>t[k] += pts / Math.max(1, z.length - (z.includes('cardio') ? 0.5 : 0))); }));
  return t;
}
function mapaCuerpo(t){
  const max = Math.max(1, ...Object.entries(t).filter(([k])=>k!=='cardio').map(([, v])=>v)), op = k=>0.12 + 0.88 * (t[k] / max), col = k=>`fill="var(--acento)" fill-opacity="${op(k).toFixed(2)}"`;
  const frente = `<svg viewBox="0 0 100 200" class="silueta" aria-label="Frente"><circle cx="50" cy="16" r="11" class="cabeza"/>
    <ellipse cx="27" cy="44" rx="10" ry="8" ${col('hombros')}/><ellipse cx="73" cy="44" rx="10" ry="8" ${col('hombros')}/>
    <rect x="33" y="38" width="34" height="26" rx="8" ${col('pecho')}/><rect x="35" y="66" width="30" height="30" rx="8" ${col('core')}/>
    <rect x="13" y="54" width="11" height="44" rx="5" ${col('brazos')}/><rect x="76" y="54" width="11" height="44" rx="5" ${col('brazos')}/>
    <rect x="34" y="99" width="14" height="88" rx="6" ${col('piernas')}/><rect x="52" y="99" width="14" height="88" rx="6" ${col('piernas')}/></svg>`;
  const espalda = `<svg viewBox="0 0 100 200" class="silueta" aria-label="Espalda"><circle cx="50" cy="16" r="11" class="cabeza"/>
    <ellipse cx="27" cy="44" rx="10" ry="8" ${col('hombros')}/><ellipse cx="73" cy="44" rx="10" ry="8" ${col('hombros')}/>
    <path d="M33 38 h34 l-4 52 h-26 z" ${col('espalda')}/><rect x="13" y="54" width="11" height="44" rx="5" ${col('brazos')}/><rect x="76" y="54" width="11" height="44" rx="5" ${col('brazos')}/>
    <rect x="35" y="92" width="30" height="16" rx="6" ${col('piernas')}/><rect x="34" y="110" width="14" height="77" rx="6" ${col('piernas')}/><rect x="52" y="110" width="14" height="77" rx="6" ${col('piernas')}/></svg>`;
  return `<div class="cuerpo">${frente}${espalda}</div>`;
}
/* Serie de progreso de un movimiento: 1RM estimado, ritmo por km, máximo de repeticiones o volumen */
function serieMov(id){
  const m = movDe(id) || {c:'cuerpo'}, porFecha = {}, push = (f, v, menor)=>{ if(v==null || !isFinite(v)) return; const a = porFecha[f]; porFecha[f] = a==null ? v : menor ? Math.min(a, v) : Math.max(a, v); };
  const LEG = {sentadilla:'sentadilla', peso_muerto:'pesomuerto', banca:'banca', press:'militar', envion:'envion'}[id], PSFE = {barras:'barras', abdominales:'abd1', flexiones:'flex1'}[id];
  if(m.c==='peso'){
    S.sesiones.forEach(s=>(s.recs || []).forEach(r=>{ const x = /^rm:([^:]+):(\d+)$/.exec(r.ej); if(x && x[1]===id) push(s.fecha, r.valor * (+x[2]===1 ? 1 : 1 + x[2]/30)); else if(LEG && r.ej===LEG) push(s.fecha, r.valor); }));
    if(LEG) S.marcas.filter(x=>x.ej===LEG).forEach(x=>push(x.fecha, x.valor));
    return {tipo:'1RM estimado', u:'kg', menor:false, puntos:Object.entries(porFecha).sort().map(([f, v])=>({f, v}))};
  }
  if(m.c==='dist'){
    S.sesiones.forEach(s=>{ const w = s.w; if(!w) return;
      if(w.uno && w.uno.mov===id){ const mt = metros(w.uno.dist, w.uno.distU), t = PSF.leerTiempo(w.uno.tiempo); if(mt >= 200 && t) push(s.fecha, t / (mt/1000), true); }
      (s.recs || []).forEach(r=>{ const x = /^dist:([^:]+):(\d+)$/.exec(r.ej); if(x && x[1]===id && !(w.uno && w.uno.mov===id)) push(s.fecha, r.valor / (+x[2]/1000), true); }); });
    if(id==='carrera') valoresDe('psf2400').forEach(v=>push(v.fecha, v.valor / 2.4, true));
    if(Object.keys(porFecha).length) return {tipo:'ritmo', u:'/km', menor:true, puntos:Object.entries(porFecha).sort().map(([f, v])=>({f, v}))};
  }
  if(m.c==='cuerpo'){
    S.sesiones.forEach(s=>{ (s.recs || []).forEach(r=>{ const x = /^reps:([^:]+):/.exec(r.ej); if(x && x[1]===id) push(s.fecha, r.valor); });
      if(s.w && s.w.uno && s.w.uno.mov===id && s.w.uno.seriesR) push(s.fecha, Math.max(...s.w.uno.seriesR.map(r=>ent(r) || 0))); });
    if(PSFE) valoresDe(PSFE).forEach(v=>push(v.fecha, v.valor));
    if(Object.keys(porFecha).length) return {tipo:'máximo de repeticiones', u:'rep', menor:false, puntos:Object.entries(porFecha).sort().map(([f, v])=>({f, v}))};
  }
  // Volumen por sesión (repeticiones, metros o calorías)
  let u = 'rep';
  S.sesiones.forEach(s=>{ const o = contribuciones(s)[id]; if(!o) return; const v = o.m || o.cal || o.reps; u = o.m ? 'm' : o.cal ? 'cal' : 'rep'; porFecha[s.fecha] = (porFecha[s.fecha] || 0) + v; });
  return {tipo:'volumen por sesión', u, menor:false, puntos:Object.entries(porFecha).sort().map(([f, v])=>({f, v}))};
}
const fmtSerie = (S_, v)=>S_.u==='kg' ? verPeso(Math.round(v*10)/10, 'kg') : S_.u==='/km' ? verRitmo(v) : S_.u==='m' ? verDist(Math.round(v)) : Math.round(v) + ' ' + S_.u;
function sparkline(pts, menor){
  if(pts.length < 2) return '<div class="spark-vacio">Con 2 registros aparece la curva</div>';
  const W = 160, H = 38, vs = pts.map(p=>p.v), a = Math.min(...vs), b = Math.max(...vs), r = b - a || 1;
  const P = pts.map((p, i)=>[i / (pts.length - 1) * (W - 6) + 3, menor ? 4 + (p.v - a) / r * (H - 8) : H - 4 - (p.v - a) / r * (H - 8)]);
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" aria-hidden="true"><polyline points="${P.map(x=>x.join(',')).join(' ')}" fill="none" stroke="var(--acento)" stroke-width="2"/>
    <circle cx="${P[P.length-1][0]}" cy="${P[P.length-1][1]}" r="3" fill="var(--acento)"/></svg>`;
}
function totalesMov(){
  const t = {}; ordenCrono().forEach(s=>Object.entries(contribuciones(s)).forEach(([id, o])=>{ const x = t[id] = t[id] || {reps:0, m:0, cal:0, n:0, ult:''}; x.reps += o.reps; x.m += o.m; x.cal += o.cal; x.n++; x.ult = s.fecha; }));
  return t;
}
let grupoMovAn = '';
function vMovimientos(){
  const zonas = cargaZonas(periodoCuerpo), totZ = Object.entries(zonas).filter(([k])=>k!=='cardio').reduce((a, [, b])=>a + b, 0), T = totalesMov(), uso = usoMovs();
  const ids = Object.keys(uso).filter(id=>movDe(id) && (!grupoMovAn || movDe(id).g===grupoMovAn)).sort((a, b)=>((T[b] || {}).ult || '') < ((T[a] || {}).ult || '') ? -1 : 1);
  const cardioP = {m:0, min:0}; S.sesiones.filter(s=>s.fecha >= hace(periodoCuerpo)).forEach(s=>{ const c = Object.entries(contribuciones(s)).filter(([id])=>zonasDe(id).includes('cardio')); c.forEach(([, o])=>cardioP.m += o.m); if(c.length && s.dur) cardioP.min += Math.round(s.dur); });
  const flojas = totZ ? ['pecho', 'hombros', 'espalda', 'core', 'piernas'].filter(k=>zonas[k] / totZ < 0.06) : [];
  const SUG = {pecho:'flexiones o press banca', hombros:'press militar o HSPU', espalda:'barras, remos o peso muerto', core:'abdominales, plancha o toes to bar', piernas:'sentadillas, zancadas o saltos'};
  const tarjeta = id=>{ const m = movDe(id), g = GRUPOS[m.g], S_ = serieMov(id), pts = S_.puntos, t = T[id] || {reps:0, m:0, cal:0, n:uso[id] || 0};
    const u = t.m ? 'm' : t.cal ? 'cal' : 'reps', U = UMBRALES[u], niv = U.filter(x=>x <= t[u]).length + 1, sig = U.find(x=>x > t[u]);
    let mejor = null, mejora = null;
    if(pts.length){ mejor = S_.menor ? Math.min(...pts.map(p=>p.v)) : Math.max(...pts.map(p=>p.v));
      if(pts.length >= 2 && S_.tipo!=='volumen por sesión'){ const p0 = pts[0].v; mejora = S_.menor ? (p0 - mejor) / p0 * 100 : (mejor - p0) / p0 * 100; } }
    return `<button class="mov-card g-${m.g}" data-movp="${id}">
      <div class="entre"><span class="mc-n">${g.ic} ${esc(nomMov(m))}</span>${insignia(niv)}</div>
      <div class="mc-cuerpo"><div><div class="mc-v num">${mejor!=null ? esc(fmtSerie(S_, mejor)) : '—'}</div><div class="mc-k">${esc(S_.tipo==='volumen por sesión' ? 'mejor sesión' : 'mejor ' + S_.tipo)}</div>
        ${mejora!=null ? `<div class="mc-mejora num ${mejora >= 0 ? 'sube' : 'baja'}">${mejora >= 0 ? '▲ +' : '▼ '}${fmtNum(Math.round(mejora*10)/10)} % desde el inicio</div>` : ''}</div>${sparkline(pts, S_.menor)}</div>
      <div class="mc-pie"><span>${t.n || uso[id]} sesión${(t.n || uso[id])===1 ? '' : 'es'} · total ${esc(fmtCantidad(u, t[u]))}</span>${sig ? `<span>meta ${esc(fmtCantidad(u, sig))}</span>` : ''}</div>
      ${sig ? `<div class="barra-logro"><span style="width:${Math.min(100, Math.round(t[u] / sig * 100))}%"></span></div>` : ''}</button>`; };
  $('#vista').innerHTML = `${segProgreso('Movimientos')}
    <div class="tarjeta"><span class="etiqueta">Mapa del cuerpo</span><div class="chips" id="perCuerpo" style="padding:4px 0 0">${[[7, '7 días'], [30, '30 días'], [90, '90 días']].map(([d, n])=>`<button data-d="${d}" class="${periodoCuerpo===d ? 'activa' : ''}">${n}</button>`).join('')}</div>
      ${totZ || cardioP.m || cardioP.min ? `<div class="cuerpo-caja">${mapaCuerpo(zonas)}<div class="zonas-lista">${Object.entries(zonas).filter(([k])=>k!=='cardio').sort((a, b)=>b[1] - a[1]).map(([k, v])=>`<div><span>${ZONAS_C.find(z=>z[0]===k)[1]}</span><b class="num">${totZ ? Math.round(v / totZ * 100) : 0} %</b></div>`).join('')}
          <div class="z-cardio"><span>❤️ Cardio</span><b class="num">${cardioP.m ? esc(verKm(cardioP.m / 1000)) : cardioP.min + ' min'}</b></div></div></div>
        ${!totZ ? '<p class="chico suave">Solo cardio en este período: suma fuerza para el resto del cuerpo.</p>' : flojas.length ? `<p class="chico alerta-lim">⚠ Poco trabajo de ${flojas.map(k=>ZONAS_C.find(z=>z[0]===k)[1].toLowerCase()).join(', ')}: agrega ${flojas.map(k=>SUG[k]).join('; ')}.</p>` : '<p class="chico" style="color:var(--mb)">Trabajo bien repartido en todo el cuerpo.</p>'}`
        : '<div class="vacio chico">Sin entrenamientos en este período.</div>'}</div>
    <div class="entre"><h3>Tu progreso por movimiento</h3><span class="suave chico">${ids.length}</span></div>
    <div class="chips" id="grMovAn" style="padding-top:0"><button data-g="" class="${!grupoMovAn ? 'activa' : ''}">Todos</button>${Object.entries(GRUPOS).map(([g, x])=>`<button data-g="${g}" class="${grupoMovAn===g ? 'activa' : ''}">${x.ic} ${x.corto}</button>`).join('')}</div>
    <div class="mov-cards">${ids.map(tarjeta).join('') || '<div class="tarjeta vacio">Aún no registras movimientos de este grupo.</div>'}</div>
    <button class="btn ancho" id="verCatalogo" style="margin-top:12px">Ver el catálogo completo (${MOVS.length} movimientos)</button>`;
  enlazarSegProgreso();
  $$('#perCuerpo button').forEach(b=>b.onclick = ()=>{ periodoCuerpo = +b.dataset.d; vMovimientos(); });
  $$('#grMovAn button').forEach(b=>b.onclick = ()=>{ grupoMovAn = b.dataset.g; vMovimientos(); });
  $$('[data-movp]').forEach(b=>b.onclick = ()=>detalleMovimiento(b.dataset.movp));
  $('#verCatalogo').onclick = vCatalogoMov;
}
function detalleMovimiento(id){
  const m = movDe(id), S_ = serieMov(id), pts = S_.puntos;
  const grande = pts.length >= 2 ? grafico({id:'mov:' + id, nombre:nomMov(m), u:S_.u==='/km' ? 'tiempo' : S_.u==='kg' ? 'kg' : 'reps'}, pts.map(p=>({fecha:p.f, valor:S_.u==='/km' ? Math.round(p.v) : Math.round(p.v*10)/10}))) : '<div class="vacio chico">Con 2 o más registros aparece el gráfico.</div>';
  historialMov(id);
  const d = $('#dialogo'), cab = $('.cab', d) || d.firstElementChild;
  cab.insertAdjacentHTML('afterend', `<div class="etiqueta" style="margin-top:8px">${esc(S_.tipo)}</div>${grande}`);
}

/* ======================= Predicción de carrera (fórmula de Riegel) ======================= */
/* T2 = T1 × (D2 ÷ D1)^1,06. Se usan carreras de 1,5 a 42 km con tiempo de los últimos 6 meses (si no hay, todas). */
const RIEGEL = 1.06, CORRER = ['carrera', 'carrera_cinta', 'carrera_curva', 'carrera_tenida'];
const DIST_PRED = [[2400, '2.400 m (PSF)'], [5000, '5 km'], [10000, '10 km'], [21097, 'Media maratón'], [42195, 'Maratón']];
const riegel = (t, d, d2)=>t * Math.pow(d2 / d, RIEGEL);
function esfuerzosCarrera(){
  const out = [], add = (fecha, m, t, n)=>{ if(m >= 1500 && m <= 42195 && t > 0 && t / (m / 1000) >= 150 && !out.some(e=>e.fecha===fecha && e.m===m && e.t===t)) out.push({fecha, m, t, n}); };
  [['psf2400', 2400], ['5k', 5000], ['10k', 10000]].forEach(([id, m])=>valoresDe(id).forEach(v=>add(v.fecha, m, v.valor, id==='psf2400' ? '2.400 m' : fmtMetros(m))));
  S.sesiones.forEach(s=>{
    (s.recs || []).forEach(r=>{ const x = /^dist:([^:]+):(\d+)$/.exec(r.ej); if(x && CORRER.includes(x[1])) add(s.fecha, +x[2], r.valor, fmtMetros(+x[2])); });
    const U = s.w && s.w.uno; if(U && CORRER.includes(U.mov)){ const m = metros(U.dist, U.distU), t = PSF.leerTiempo(U.tiempo); if(m && t) add(s.fecha, m, t, fmtMetros(m)); }
  });
  const rec = out.filter(e=>e.fecha >= hace(180));
  return {lista:rec.length ? rec : out, antiguas:!rec.length && out.length > 0};
}
function prediccionCarrera(){
  const E = esfuerzosCarrera(); if(!E.lista.length) return null;
  return {antiguas:E.antiguas, n:E.lista.length, filas:DIST_PRED.map(([d, n])=>{
    // la referencia más parecida en distancia (hasta un 50 % más lejos que la más cercana); de esas, la más rápida
    const lej = e=>Math.abs(Math.log(d / e.m)), min = Math.min(...E.lista.map(lej));
    const c = E.lista.filter(e=>lej(e) <= min + 0.4).map(e=>({e, t:riegel(e.t, e.m, d)})).sort((a, b)=>a.t - b.t)[0];
    const confianza = lej(c.e) < 0.7 ? 'alta' : lej(c.e) < 1.5 ? 'media' : 'baja';
    const mejor = valoresDe({2400:'psf2400', 5000:'5k', 10000:'10k'}[d] || '-').reduce((a, v)=>a==null || v.valor < a ? v.valor : a, null);
    return {d, n, t:Math.round(c.t), ritmo:Math.round(c.t / (d / 1000)), ref:c.e, confianza, mejor};
  })};
}
function htmlPrediccion(){
  const P = prediccionCarrera(), pp = perfilPSF();
  if(!P) return `<div class="tarjeta"><div class="etiqueta">Predicción de carrera</div><div class="vacio chico">Registra una carrera de 1,5 km o más con su tiempo (o tu 2.400 m) y aquí verás tus tiempos posibles en 2.400 m, 5 km, 10 km y media maratón.</div></div>`;
  const CONF = {alta:'●●●', media:'●●○', baja:'●○○'};
  return `<div class="tarjeta tp-pred"><div class="entre"><span class="etiqueta">Predicción de carrera</span><span class="suave chico">${P.n} carrera${P.n===1 ? '' : 's'}</span></div>
    <div class="pred-filas">${P.filas.map(f=>`<div class="pred-fila${f.d===2400 ? ' psf' : ''}">
      <div class="pred-n"><b>${f.n}</b><span class="suave chico">según tu ${esc(f.ref.n)} del ${verFecha(f.ref.fecha)} <span class="conf" title="confianza ${f.confianza}">${CONF[f.confianza]}</span></span></div>
      <div class="pred-t"><b class="num">${PSF.verTiempo(f.t)}</b><span class="suave chico num">${verRitmo(f.ritmo)}</span>
        ${f.d===2400 && pp.sexo && pp.edad!=null ? chip(PSF.carrera(pp, f.t).nivel) : ''}${f.mejor && f.mejor > f.t ? `<span class="pred-margen chico">puedes bajar ${PSF.verTiempo(f.mejor - f.t)}</span>` : ''}</div></div>`).join('')}</div>
    <p class="nota">Fórmula de Riegel (tiempo × (distancia nueva ÷ distancia hecha)^1,06), con tus carreras ${P.antiguas ? '<b>antiguas (más de 6 meses)</b>' : 'de los últimos 6 meses'}. Supone que entrenaste para esa distancia: para media maratón y maratón necesitas fondo largo. ●●● = referencia de distancia parecida.</p></div>`;
}

/* ======================= Informe: mes compartible, año vs año y radar antes/ahora ======================= */
let mesInf = 0, metAnio = 'n', antesRadar = 6;
const desde_ = (y, m)=>iso(new Date(y, m, 1)), hasta_ = (y, m)=>iso(new Date(y, m + 1, 0));
function informeMes(off){
  const h = new Date(), D = new Date(h.getFullYear(), h.getMonth() - off, 1), y = D.getFullYear(), m = D.getMonth();
  const ini = desde_(y, m), fin = off ? hasta_(y, m) : iso(h), ss = S.sesiones.filter(s=>s.fecha >= ini && s.fecha <= fin);
  // mes anterior: completo, o los mismos días si el mes está en curso
  const A = new Date(y, m - 1, 1), finA = off ? hasta_(A.getFullYear(), A.getMonth()) : iso(new Date(A.getFullYear(), A.getMonth(), Math.min(h.getDate(), new Date(y, m, 0).getDate())));
  const ant = acumular(S.sesiones.filter(s=>s.fecha >= desde_(A.getFullYear(), A.getMonth()) && s.fecha <= finA));
  const t = acumular(ss), dias = new Set(ss.map(s=>s.fecha)).size, logros = muroLogros().filter(e=>e.fecha && e.fecha >= ini && e.fecha <= fin);
  const mejor = ss.slice().sort((a, b)=>cargaSesion(b) - cargaSesion(a))[0];
  const porGrupo = {}; ss.forEach(s=>{ const g = grupoDe(s); porGrupo[g] = (porGrupo[g] || 0) + 1; });
  return {y, m, nombre:MESES_L[m] + ' ' + y, enCurso:!off, t, ant, mesAnt:MESES_L[A.getMonth()], dias, logros, mejor, porGrupo,
    racha:rachaMaxima(fechasRacha(ss)), kcal:ss.reduce((x, y)=>x + kcalDe(y), 0), recs:logros.filter(e=>e.tipo==='rec').length, ins:logros.filter(e=>e.tipo==='ins').length};
}
function comparacionAnio(){
  const h = new Date(), y = h.getFullYear(), hoyMD = iso(h).slice(5);
  const de = yy=>S.sesiones.filter(s=>s.fecha.slice(0, 4)===String(yy) && s.fecha.slice(5) <= hoyMD);
  const meses = yy=>Array.from({length:12}, (_, m)=>acumular(S.sesiones.filter(s=>s.fecha >= desde_(yy, m) && s.fecha <= hasta_(yy, m))));
  return {y, a:acumular(de(y)), b:acumular(de(y - 1)), ma:meses(y), mb:meses(y - 1), mesHoy:h.getMonth()};
}
const VAL_ANIO = {n:['Sesiones', t=>t.n], km:['Km', t=>t.km], min:['Horas', t=>t.min / 60], kg:['Toneladas', t=>t.kg / 1000]};
function barrasAnio(C){
  const f = VAL_ANIO[metAnio][1], va = C.ma.map(f), vb = C.mb.map(f), max = Math.max(1, ...va, ...vb), W = 360, H = 130, bw = 11;
  return `<svg class="barras-anio" viewBox="0 0 ${W} ${H + 18}" role="img" aria-label="Por mes, este año y el anterior">
    ${va.map((v, m)=>{ const x = 6 + m * 29.5, hb = vb[m] / max * H, ha = v / max * H;
      return `<rect x="${x}" y="${H - hb}" width="${bw}" height="${hb}" rx="2" class="ba-ant"/>${m <= C.mesHoy ? `<rect x="${x + bw + 1}" y="${H - ha}" width="${bw}" height="${ha}" rx="2" class="ba-act"/>` : ''}
        <text x="${x + bw}" y="${H + 14}" text-anchor="middle">${MESES_C[m][0].toUpperCase()}</text>`; }).join('')}</svg>`;
}
/* Niveles de capacidad con los datos que había en una fecha (se calcula como si fuera ese día) */
function nivelesEn(fecha){
  const S0 = S, n0 = Date.now, t = new Date(fecha + 'T12:00:00').getTime(), f = x=>(x || []).filter(o=>!o.fecha || o.fecha <= fecha);
  S = Object.assign({}, S0, {sesiones:f(S0.sesiones), marcas:f(S0.marcas), controles:f(S0.controles), evals:f(S0.evals), medidas:f(S0.medidas)});
  Date.now = ()=>t;
  try{ return nivelesCapacidad(); } finally { S = S0; Date.now = n0; }
}
function radarDoble(antes, ahora){
  const W = 420, H = 270, cx = 210, cy = 140, R = 104, n = ahora.length;
  const pt = (i, r)=>{ const a = -Math.PI/2 + i * 2*Math.PI/n; return [cx + r*Math.cos(a), cy + r*Math.sin(a)]; };
  const pol = cs=>cs.map((c, i)=>pt(i, R*(c.nivel || 0)/5).join(',')).join(' ');
  return `<svg class="radar" viewBox="0 0 ${W} ${H}" role="img" aria-label="Capacidades antes y ahora">
    ${[1, 2, 3, 4, 5].map(k=>`<polygon points="${ahora.map((_, i)=>pt(i, R*k/5).join(',')).join(' ')}" class="radar-anillo ${k===3 ? 'tres' : ''}"/>`).join('')}
    ${ahora.map((_, i)=>{ const [x, y] = pt(i, R); return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="radar-eje"/>`; }).join('')}
    <polygon points="${pol(antes)}" class="radar-antes"/><polygon points="${pol(ahora)}" class="radar-datos"/>
    ${ahora.map((c, i)=>{ const [x, y] = pt(i, R + 22), anc = Math.abs(x - cx) < 10 ? 'middle' : x > cx ? 'start' : 'end';
      return `<text x="${x}" y="${y + 4}" text-anchor="${anc}" class="${c.nivel ? '' : 'sin'}">${esc(c.corto)}</text>`; }).join('')}
  </svg>`;
}
function vInforme(){
  const I = informeMes(mesInf), C = comparacionAnio(), fA = VAL_ANIO[metAnio][1];
  const fechaAntes = hace(Math.round(antesRadar * 30.4)), antes = nivelesEn(fechaAntes), ahora = nivelesCapacidad();
  const fl = (a, b)=>!b ? (a ? '<span class="sube">nuevo</span>' : '<span class="suave">—</span>') : a > b*1.02 ? `<span class="sube">▲ ${Math.round((a/b - 1)*100)} %</span>` : a < b*0.98 ? `<span class="baja">▼ ${Math.round((1 - a/b)*100)} %</span>` : '<span class="suave">＝</span>';
  const cif = (k, a, b, txt)=>`<div><span class="k">${k}</span><b class="num">${txt}</b>${fl(a, b)}</div>`;
  const gTot = Object.values(I.porGrupo).reduce((a, b)=>a + b, 0);
  const cambios = ahora.map((c, i)=>({c, a:antes[i].nivel, b:c.nivel})).filter(x=>x.b!=null || x.a!=null);
  $('#vista').innerHTML = `${segProgreso('Informe y comparación')}
    <div class="tarjeta inf-mes">
      <div class="entre"><button class="btn chico-btn" id="infAnt" aria-label="Mes anterior">‹</button><div style="text-align:center"><div class="etiqueta">Informe mensual</div><h3 style="margin:2px 0 0;text-transform:capitalize">${I.nombre}</h3></div>
        <button class="btn chico-btn" id="infSig" aria-label="Mes siguiente" ${mesInf ? '' : 'disabled'}>›</button></div>
      <div class="tp-comp">${cif('Sesiones', I.t.n, I.ant.n, I.t.n)}${cif('Días', I.dias, null, I.dias).replace(/<span class="(sube|suave)">(nuevo|—)<\/span>/, '<span class="suave">entrenados</span>')}${cif(uDist()==='mi' ? 'Millas' : 'Km', I.t.km, I.ant.km, fmtNum(nKm(I.t.km)))}${cif('Horas', I.t.min, I.ant.min, fmtHoras(I.t.min))}</div>
      <p class="suave chico" style="margin:-4px 0 8px">Flechas: vs. ${I.mesAnt}${I.enCurso ? ' (mismos días)' : ''}. ${uTon()==='lb' ? 'Levantado' : 'Toneladas'}: <b class="num">${verTon(I.t.kg)}</b> · 🔥 <b class="num">${I.kcal.toLocaleString('es-CL')}</b> kcal · mejor racha: <b class="num">${I.racha}</b> día${I.racha===1 ? '' : 's'}</p>
      ${gTot ? `<div class="inf-barra">${Object.entries(I.porGrupo).sort((a, b)=>b[1] - a[1]).map(([g, n])=>`<span class="g-${g}" style="flex:${n}" title="${esc(GRUPOS[g] ? GRUPOS[g].n : g)}"></span>`).join('')}</div>
        <div class="inf-leyenda chico">${Object.entries(I.porGrupo).sort((a, b)=>b[1] - a[1]).map(([g, n])=>`<span><i class="g-${g}"></i>${esc(GRUPOS[g] ? GRUPOS[g].corto : 'Otro')} ${Math.round(n / gTot * 100)} %</span>`).join('')}</div>` : ''}
      ${I.mejor ? `<div class="inf-mejor"><span class="etiqueta">Sesión más dura</span><b>${esc(I.mejor.titulo || etiquetaTipo(I.mejor))}</b> <span class="suave chico">${verFecha(I.mejor.fecha)}</span></div>` : ''}
      <div class="etiqueta" style="margin-top:10px">Logros del mes · ${I.logros.length}</div>
      ${I.logros.length ? `<ul class="muro-logros">${I.logros.slice(0, 5).map(e=>`<li class="ml-${e.tipo}" ${attrLogro(e)}><span class="ml-ic">${e.ic}</span><div><b>${esc(e.t)}</b><span>${esc(e.d)} · ${verFecha(e.fecha)}</span></div></li>`).join('')}</ul>${I.logros.length > 5 ? `<p class="suave chico">y ${I.logros.length - 5} más</p>` : ''}`
        : `<div class="vacio chico">${I.t.n ? 'Sin récords ni insignias este mes: ¡a buscarlos!' : 'Sin entrenamientos este mes.'}</div>`}
      <button class="btn prim ancho" id="infCompartir" style="margin-top:10px" ${I.t.n ? '' : 'disabled'}>Compartir informe del mes</button>
    </div>
    <div class="tarjeta">
      <div class="entre"><span class="etiqueta">${C.y} vs. ${C.y - 1}</span><span class="suave chico">al ${new Date().getDate()} ${MESES_C[C.mesHoy]}</span></div>
      <div class="tp-comp">${Object.entries(VAL_ANIO).map(([k, [n, f]])=>cif(n, f(C.a), f(C.b), k==='min' ? fmtHoras(C.a.min) : fmtNum(Math.round(f(C.a)*10)/10))).join('')}</div>
      <div class="chips" id="metAnio" style="padding:0 0 6px">${Object.entries(VAL_ANIO).map(([k, [n]])=>`<button data-k="${k}" class="${metAnio===k ? 'activa' : ''}">${n}</button>`).join('')}</div>
      ${barrasAnio(C)}
      <div class="inf-leyenda chico"><span><i class="ba-ant"></i>${C.y - 1}</span><span><i class="ba-act"></i>${C.y}</span><span class="suave">${VAL_ANIO[metAnio][0]} por mes</span></div>
      ${!C.b.n ? `<p class="suave chico">Aún no hay datos de ${C.y - 1}: la comparación se completa con el tiempo.</p>` : ''}
    </div>
    <div class="tarjeta">
      <div class="etiqueta">Capacidades: antes y ahora</div><div class="suave chico">Comparar con hace:</div>
      <div class="chips" id="antesR" style="padding:4px 0 0">${[[3, '3 meses'], [6, '6 meses'], [12, '1 año']].map(([n, t])=>`<button data-n="${n}" class="${antesRadar===n ? 'activa' : ''}">${t}</button>`).join('')}</div>
      ${cambios.length ? `${radarDoble(antes, ahora)}
        <div class="inf-leyenda chico"><span><i class="r-antes"></i>${verFecha(fechaAntes)}</span><span><i class="r-ahora"></i>Hoy</span></div>
        <ul class="lista cap-cambios">${cambios.map(x=>{ const d = x.a!=null && x.b!=null ? x.b - x.a : null;
          return `<li class="entre"><span>${esc(x.c.n)}</span><span class="num">${x.a!=null ? fmtNum(Math.round(x.a*10)/10) : '—'} → <b>${x.b!=null ? fmtNum(Math.round(x.b*10)/10) : '—'}</b> ${d==null ? (x.a==null ? '<span class="sube">nuevo</span>' : '') : d > 0.05 ? `<span class="sube">▲</span>` : d < -0.05 ? `<span class="baja">▼</span>` : '<span class="suave">＝</span>'}</span></li>`; }).join('')}</ul>
        <p class="nota">Nivel 1 a 5 de cada capacidad con las pruebas y medidas que tenías en esa fecha (Perfil → Nivel de capacidad). 3 = cumple el estándar.</p>`
        : '<div class="vacio chico">Haz las pruebas del Perfil (2.400, abdominales, barras, SDC…) para ver cómo cambian tus capacidades.</div>'}
    </div>`;
  enlazarSegProgreso();
  $('#infAnt').onclick = ()=>{ mesInf++; vInforme(); };
  $('#infSig').onclick = ()=>{ if(mesInf){ mesInf--; vInforme(); } };
  $$('#metAnio button').forEach(b=>b.onclick = ()=>{ metAnio = b.dataset.k; vInforme(); });
  $$('#antesR button').forEach(b=>b.onclick = ()=>{ antesRadar = +b.dataset.n; vInforme(); });
  $('#infCompartir').onclick = ()=>compartirInforme(I);
}
function compartirInforme(I){
  mostrarCompartir({titulo:'Informe de ' + MESES_L[I.m], nombre:'tacfit_informe_' + I.y + '-' + String(I.m + 1).padStart(2, '0'),
    texto:`Mi informe de ${I.nombre}: ${I.t.n} sesiones, ${verKm(I.t.km)}, ${fmtHoras(I.t.min)} h.\n${ETIQ}`,
    generar:f=>tarjetaInforme(I, FORMATOS[f][2])});
}
