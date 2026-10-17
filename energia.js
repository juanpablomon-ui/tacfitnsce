/* #TACFITNSCE — Energía: gasto basal (Mifflin-St Jeor; Katch-McArdle si hay % de grasa), calorías de cada entrenamiento y gasto total
   del día. Calorías por sesión, de la más precisa a la más general:
   1) FC media anotada → Keytel 2005;  2) carrera o caminata con distancia y tiempo → ecuaciones metabólicas del ACSM;
   3) marcha con carga → ecuación de Pandolf (1977, la del Ejército de EE. UU.);  4) el resto → MET del Compendio de actividades
   físicas según el tipo de entrenamiento y el esfuerzo (1-10). Son estimaciones (±10-20 %). */
const ACTIVIDAD = [['oficina', 'Oficina', 'Trabajo sentado la mayor parte del día', 1.25], ['guarnicion', 'Guarnición', 'De pie y en movimiento: instrucción, servicio, taller', 1.45],
  ['terreno', 'Terreno o campaña', 'Ejercicios en terreno, patrullas, trabajo físico todo el día', 1.7]];
const PESO_DEF = 75;
function datosEnergia(){
  const p = S.perfil, pp = perfilPSF(), peso = medidaReciente('peso'), talla = medidaReciente('talla'), grasa = medidaReciente('grasa');
  return {peso:peso || PESO_DEF, pesoReal:!!peso, talla, grasa, edad:pp.edad, sexo:p.sexo, act:ACTIVIDAD.find(a=>a[0]===p.actividad) || ACTIVIDAD[1]};
}
/* Gasto basal (kcal/día) */
function basal(D){
  D = D || datosEnergia();
  if(D.grasa!=null && D.pesoReal) return {v:Math.round(370 + 21.6 * D.peso * (1 - D.grasa / 100)), f:'Katch-McArdle (con tu % de grasa)'};
  if(!D.talla || D.edad==null || !D.sexo) return {v:Math.round(D.peso * 24 * (D.sexo==='M' ? 0.9 : 1)), f:'estimación simple (faltan datos)', falta:true};
  return {v:Math.round(10 * D.peso + 6.25 * D.talla - 5 * D.edad + (D.sexo==='M' ? -161 : 5)), f:'Mifflin-St Jeor'};
}
const MOV_CORRER = ['carrera', 'carrera_cinta', 'carrera_curva', 'trote_z2', 'trail', 'carrera_cerro'], MOV_CAMINAR = ['caminata'], MOV_CARGA = ['marcha', 'carrera_tenida'];
/* MET según tipo y esfuerzo (Compendio de actividades físicas 2024) */
function metSesion(s){
  const r = Math.max(1, Math.min(10, +s.rpe || 6)), g = grupoDe(s);
  if(s.tipo==='descanso') return 2.5;
  if(g==='mono') return [0, 2, 2.5, 3.5, 5, 6, 7, 8.5, 10, 11.5, 13][r];
  if(g==='barra') return [0, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5][r];
  return [0, 2, 3, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 11][r];
}
function kcalSesion(s, D){
  D = D || datosEnergia();
  const U = s.w && s.w.uno, min = ent(s.dur) || (U && U.tiempo ? Math.round((PSF.leerTiempo(U.tiempo) || 0) / 60) : 0);
  if(!min) return null;
  const W = D.peso;
  // 1) frecuencia cardíaca media (Keytel 2005)
  const fc = +s.fc;
  if(fc >= 80 && fc <= 210 && D.edad!=null && D.sexo){
    const k = D.sexo==='M' ? (-20.4022 + 0.4472 * fc - 0.1263 * W + 0.074 * D.edad) / 4.184 : (-55.0969 + 0.6309 * fc + 0.1988 * W + 0.2017 * D.edad) / 4.184;
    if(k > 1) return {v:Math.round(k * min), f:'frecuencia cardíaca', min};
  }
  if(U && U.mov){
    const mt = metros(U.dist, U.distU), t = PSF.leerTiempo(U.tiempo) || (ent(s.dur) || 0) * 60, v = mt && t ? mt / (t / 60) : 0;
    // 3) marcha con carga: Pandolf, terreno de tierra (η = 1,2)
    if(MOV_CARGA.includes(U.mov) && v){ const L = aKg(U.peso, U.pesoU) || 0, V = v / 60, eta = 1.2;
      const watts = 1.5 * W + 2 * (W + L) * Math.pow(L / W, 2) + eta * (W + L) * (1.5 * V * V + 0.35 * V * 0);
      return {v:Math.round(watts * 0.01433 * (t / 60)), f:'Pandolf (marcha con carga)', min:Math.round(t / 60)}; }
    // 2) carrera o caminata: ACSM (VO2 ml/kg/min) × 5 kcal por litro de O2
    if((MOV_CORRER.includes(U.mov) || MOV_CAMINAR.includes(U.mov)) && v){ const vo2 = v > 134 || MOV_CORRER.includes(U.mov) && v > 100 ? 0.2 * v + 3.5 : 0.1 * v + 3.5;
      return {v:Math.round(vo2 * W / 1000 * 5 * (t / 60)), f:'ritmo (ACSM)', min:Math.round(t / 60)}; }
  }
  // 4) MET × peso × horas
  return {v:Math.round(metSesion(s) * W * min / 60), f:'MET ' + fmtNum(metSesion(s)) + ' (tipo y esfuerzo)', min};
}
/* Gasto del día: basal × actividad diaria + entrenamiento (neto: se descuenta el basal de esos minutos) */
function gastoDia(f, D){
  D = D || datosEnergia(); const B = basal(D).v, ss = S.sesiones.filter(s=>s.fecha===f);
  let ent_ = 0; ss.forEach(s=>{ const k = kcalSesion(s, D); if(k) ent_ += Math.max(0, k.v - B / 1440 * k.min); });
  return {basal:B, diaria:Math.round(B * (D.act[3] - 1)), entreno:Math.round(ent_), total:Math.round(B * D.act[3] + ent_)};
}
const kcalDe = s=>{ const k = kcalSesion(s); return k ? k.v : 0; };
const fmtKcal = v=>v.toLocaleString('es-CL') + ' kcal';

/* ---------- Vista Analizar → Energía ---------- */
let tabEnergia = null;
function vEnergia(){
  tabEnergia = tabEnergia || pref('tabEnergia') || 'cal';
  if(tabEnergia==='peso') return vPeso(); if(tabEnergia==='agua') return vAgua();
  const D = datosEnergia(), B = basal(D), hoy = gastoDia(hoyISO(), D);
  const dias = Array.from({length:7}, (_, k)=>{ const f = hace(6 - k); return [f, gastoDia(f, D)]; }), max = Math.max(1, ...dias.map(([, g])=>g.total));
  const prom = Math.round(dias.reduce((a, [, g])=>a + g.total, 0) / 7);
  const ult = S.sesiones.slice().sort((a, b)=>a.fecha < b.fecha ? 1 : -1).slice(0, 8).map(s=>[s, kcalSesion(s, D)]).filter(x=>x[1]);
  const falta = [!D.pesoReal && 'peso', !D.talla && 'estatura', D.edad==null && 'fecha de nacimiento', !D.sexo && 'sexo'].filter(Boolean);
  const pct = k=>Math.round(hoy[k] / Math.max(1, hoy.total) * 100);
  $('#vista').innerHTML = `${segProgreso('Energía y calorías')}${tabsEnergia()}
    ${falta.length ? `<div class="tarjeta aviso-resp chico">Para calcular mejor, completa en Perfil: <b>${falta.join(', ')}</b>.${!D.pesoReal ? ` Mientras tanto se usan ${PESO_DEF} kg.` : ''}</div>` : ''}
    <div class="tarjeta en-hoy"><div class="etiqueta">Gasto de hoy</div>
      <div class="en-total num">${fmtKcal(hoy.total)}</div>
      <div class="en-barra"><span class="b" style="flex:${hoy.basal}"></span><span class="d" style="flex:${Math.max(1, hoy.diaria)}"></span><span class="e" style="flex:${Math.max(0.01, hoy.entreno)}"></span></div>
      <div class="en-ley chico">
        <div><i class="b"></i><span>Basal</span><b class="num">${fmtKcal(hoy.basal)}</b><small>${pct('basal')} %</small></div>
        <div><i class="d"></i><span>Actividad diaria</span><b class="num">${fmtKcal(hoy.diaria)}</b><small>${pct('diaria')} %</small></div>
        <div><i class="e"></i><span>Entrenamiento</span><b class="num">${fmtKcal(hoy.entreno)}</b><small>${pct('entreno')} %</small></div>
      </div></div>
    <div class="tarjeta"><div class="entre"><span class="etiqueta">Gasto basal</span><b class="num" style="font-size:20px;color:var(--acento)">${fmtKcal(B.v)}</b></div>
      <p class="suave chico" style="margin:4px 0 10px">Lo que gasta tu cuerpo en reposo total (respirar, corazón, temperatura). Fórmula: ${esc(B.f)} · ${fmtNum(D.peso)} kg${D.talla ? ' · ' + D.talla + ' cm' : ''}${D.edad!=null ? ' · ' + D.edad + ' años' : ''}${D.grasa!=null ? ' · ' + fmtNum(D.grasa) + ' % grasa' : ''}.</p>
      <div class="etiqueta">Tu actividad diaria (fuera del entrenamiento)</div>
      <div class="act-sel">${ACTIVIDAD.map(([k, n, d, f])=>`<button data-act-d="${k}" class="${D.act[0]===k ? 'activa' : ''}"><b>${n}</b><small>${d}</small><span class="num">× ${f.toLocaleString('es-CL', {minimumFractionDigits:2})}</span></button>`).join('')}</div>
      <p class="nota">Si una marcha o patrulla la registras como entrenamiento, elige un día de «Guarnición» para no contarla dos veces.</p></div>
    <div class="tarjeta"><div class="entre"><span class="etiqueta">Últimos 7 días</span><span class="suave chico">promedio <b class="num">${fmtKcal(prom)}</b></span></div>
      <div class="en-sem">${dias.map(([f, g])=>`<div><div class="en-col"><i class="e" style="height:${g.entreno / max * 100}%"></i><i class="b" style="height:${(g.total - g.entreno) / max * 100}%"></i></div><b class="num">${fmtNum(Math.round(g.total / 100) / 10)}k</b><span>${DIAS_C[(new Date(f + 'T12:00:00').getDay() + 6) % 7]}</span></div>`).join('')}</div></div>
    <div class="tarjeta"><div class="etiqueta">Calorías por entrenamiento</div>
      ${ult.length ? `<ul class="lista en-ses">${ult.map(([s, k])=>`<li class="entre" data-id="${s.id}"><div><b>${esc(s.titulo || etiquetaTipo(s))}</b><small class="suave">${verFecha(s.fecha)} · ${k.min} min · ${esc(k.f)}</small></div><b class="num en-k">🔥 ${fmtKcal(k.v)}</b></li>`).join('')}</ul>`
        : '<div class="vacio chico">Registra entrenamientos con duración para ver sus calorías.</div>'}
      <p class="nota">Método más preciso disponible: FC media anotada → ritmo de carrera (ACSM) → marcha con carga (Pandolf) → MET según tipo y esfuerzo. Son estimaciones (±10-20 %); no reemplazan a un nutricionista.</p></div>`;
  enlazarSegProgreso(); enlazarTabsEnergia();
  $$('[data-act-d]').forEach(b=>b.onclick = ()=>{ S.perfil.actividad = b.dataset.actD; guardar(); vEnergia(); });
  $$('.en-ses li').forEach(li=>li.onclick = ()=>verSesion(S.sesiones.find(s=>s.id===li.dataset.id)));
}

function tabsEnergia(){ return `<div class="segmentos" id="tabEn" style="margin-bottom:12px">${[['cal', '🔥 Calorías'], ['peso', '⚖️ Peso'], ['agua', '💧 Agua']].map(([k, t])=>`<button data-te="${k}" class="${tabEnergia===k ? 'activa' : ''}">${t}</button>`).join('')}</div>`; }
function enlazarTabsEnergia(){ $$('#tabEn button').forEach(b=>b.onclick = ()=>{ tabEnergia = b.dataset.te; pref('tabEnergia', tabEnergia); vEnergia(); window.scrollTo(0, 0); }); }

/* ======================= Plan de peso ======================= */
/* 1 kg de grasa ≈ 7.700 kcal. Ritmo seguro: bajar 0,5-1 % del peso por semana; subir 0,25-0,5 %. Nunca comer menos que el basal.
   Proteína 1,6-2,2 g/kg (más alta en déficit para cuidar el músculo, Morton 2018 / ISSN); grasa ~0,9 g/kg; el resto carbohidratos. */
const KCAL_KG = 7700;
function pesosHistoria(){ return (S.medidas || []).filter(m=>num(m.peso)!=null).map(m=>({f:m.fecha, v:num(m.peso)})).sort((a, b)=>a.f < b.f ? -1 : 1); }
/* Tendencia: media móvil exponencial diaria (suaviza el agua y la comida del día) */
function tendenciaPeso(H){
  if(!H.length) return [];
  const out = []; let t = H[0].v, k = 0;
  for(let f = H[0].f; f <= hoyISO(); f = masDias(f, 1)){ while(k < H.length && H[k].f===f){ t += 0.1 * (H[k].v - t); k++; } out.push({f, t}); }
  return out;
}
function tdeePromedio(D){ const g = Array.from({length:14}, (_, k)=>gastoDia(hace(k), D).total); return Math.round(g.reduce((a, b)=>a + b, 0) / g.length); }
function planPeso(){
  const M = S.metaPeso, H = pesosHistoria(); if(!M || !H.length) return null;
  const D = datosEnergia(), T = tendenciaPeso(H), act = T.length ? T[T.length - 1].t : H[H.length - 1].v, delta = M.peso - act, baja = delta < 0;
  const tdee = tdeePromedio(D), B = basal(D).v, maxPct = baja ? 1 : 0.5, recPct = baja ? 0.75 : 0.35;
  let dias = M.fecha ? Math.max(1, diasEntre(hoyISO(), M.fecha)) : null;
  const ritmoRec = act * recPct / 100;                                  // kg/semana recomendado
  if(!dias) dias = Math.max(7, Math.round(Math.abs(delta) / ritmoRec * 7));
  let ritmo = Math.abs(delta) / (dias / 7);                             // kg/semana necesario
  const pct = ritmo / act * 100, inseguro = Math.abs(delta) >= 0.3 && pct > maxPct;
  const fechaSegura = masDias(hoyISO(), Math.round(Math.abs(delta) / ritmoRec * 7));
  let diff = Math.round(ritmo * KCAL_KG / 7) * (baja ? -1 : 1); if(Math.abs(delta) < 0.3) diff = 0;
  let kcal = tdee + diff, piso = Math.max(B, D.sexo==='M' ? 1200 : 1500), bajoPiso = kcal < piso; if(bajoPiso) kcal = piso;
  const gProt = Math.round(D.peso * (baja ? 2.0 : delta > 0 ? 1.8 : 1.6)), gGrasa = Math.round(D.peso * 0.9), gCarb = Math.max(0, Math.round((kcal - gProt * 4 - gGrasa * 9) / 4));
  return {M, H, T, act, delta, baja, tdee, B, dias, ritmo, pct, inseguro, fechaSegura, diff, kcal, bajoPiso, piso, gProt, gGrasa, gCarb, fechaFin:M.fecha || masDias(hoyISO(), dias)};
}
function graficoPeso(P){
  const H = P.H.filter(x=>x.f >= hace(120)), T = P.T.filter(x=>x.f >= hace(120)), f0 = (H[0] || T[0]).f, f1 = P.fechaFin, dTot = Math.max(1, diasEntre(f0, f1));
  const vs = H.map(x=>x.v).concat(T.map(x=>x.t), [P.M.peso]), mn = Math.min(...vs) - 1, mx = Math.max(...vs) + 1;
  const W = 360, Hh = 150, X = f=>diasEntre(f0, f) / dTot * (W - 10) + 5, Y = v=>Hh - 16 - (v - mn) / (mx - mn) * (Hh - 28);
  const hoy = hoyISO();
  return `<svg class="peso-graf" viewBox="0 0 ${W} ${Hh}" aria-label="Peso, tendencia y meta">
    <line x1="5" x2="${W - 5}" y1="${Y(P.M.peso)}" y2="${Y(P.M.peso)}" class="pg-meta"/><text x="${W - 6}" y="${Y(P.M.peso) - 4}" text-anchor="end">meta ${fmtNum(P.M.peso)} kg</text>
    ${H.map(x=>`<circle cx="${X(x.f).toFixed(1)}" cy="${Y(x.v).toFixed(1)}" r="2.5" class="pg-pt"/>`).join('')}
    <polyline points="${T.map(x=>X(x.f).toFixed(1) + ',' + Y(x.t).toFixed(1)).join(' ')}" class="pg-tend"/>
    <line x1="${X(hoy)}" y1="${Y(P.act)}" x2="${X(f1)}" y2="${Y(P.M.peso)}" class="pg-proy"/>
    <line x1="${X(hoy)}" x2="${X(hoy)}" y1="0" y2="${Hh - 14}" class="pg-hoy"/><text x="${X(hoy) + 3}" y="10">hoy</text>
    <text x="5" y="${Hh - 2}">${verFecha(f0)}</text><text x="${W - 5}" y="${Hh - 2}" text-anchor="end">${verFecha(f1)}</text></svg>`;
}
function vPeso(){
  const P = planPeso(), H = pesosHistoria(), D = datosEnergia(), ult = H[H.length - 1];
  const sem = (()=>{ const T = tendenciaPeso(H); if(T.length < 15) return null; return T[T.length - 1].t - T[T.length - 8].t; })();
  $('#vista').innerHTML = `${segProgreso('Energía y calorías')}${tabsEnergia()}
    <div class="tarjeta"><div class="entre"><div><div class="etiqueta">Peso</div>
      <div class="peso-act num">${ult ? fmtNum(ult.v) + ' kg' : '—'}</div><div class="suave chico">${ult ? 'Último: ' + verFecha(ult.f) : 'Aún no anotas tu peso'}${sem!=null ? ` · tendencia ${sem <= 0 ? '' : '+'}${fmtNum(Math.round(sem * 10) / 10)} kg/semana` : ''}</div></div>
      <button class="btn prim" id="psAnotar">＋ Peso de hoy</button></div>
      <p class="nota">Pésate en ayunas, después del baño, 2-3 veces por semana. La línea de tendencia ignora los cambios de agua del día.</p></div>
    ${!P ? `<div class="tarjeta"><div class="etiqueta">Plan de peso</div><p class="suave">${H.length ? 'Define tu meta: bajar, mantener o subir, con o sin fecha.' : 'Anota tu peso de hoy y define una meta.'}</p>
        <button class="btn ancho" id="psMeta" ${H.length ? '' : 'disabled'}>🎯 Definir mi meta de peso</button></div>`
      : `<div class="tarjeta"><div class="entre"><span class="etiqueta">Plan de peso · ${P.baja ? 'bajar' : P.delta > 0.3 ? 'subir' : 'mantener'}</span><button class="btn chico-btn" id="psMeta" aria-label="Cambiar meta">✎</button></div>
        <div class="peso-meta"><div><span>Hoy (tendencia)</span><b class="num">${fmtNum(Math.round(P.act * 10) / 10)} kg</b></div><div class="flecha">→</div><div><span>Meta</span><b class="num">${fmtNum(P.M.peso)} kg</b></div><div><span>${P.M.fecha ? 'Fecha' : 'Estimada'}</span><b>${verFecha(P.fechaFin)}</b></div></div>
        ${graficoPeso(P)}
        ${P.inseguro ? `<p class="chico alerta-lim">⚠ Ritmo de ${fmtNum(Math.round(P.ritmo * 100) / 100)} kg/semana (${fmtNum(Math.round(P.pct * 10) / 10)} % de tu peso): es demasiado rápido. Pierdes músculo y rendimiento. Fecha segura: <b>${verFecha(P.fechaSegura)}</b>.</p>` : Math.abs(P.delta) >= 0.3 ? `<p class="chico" style="color:var(--mb)">Ritmo de ${fmtNum(Math.round(P.ritmo * 100) / 100)} kg/semana (${fmtNum(Math.round(P.pct * 10) / 10)} % de tu peso por semana): seguro.</p>` : ''}
        ${S.plan && S.plan.fecha && P.baja && diasEntre(hoyISO(), S.plan.fecha) >= 0 && diasEntre(hoyISO(), S.plan.fecha) <= 14 ? '<p class="chico alerta-lim">⚠ Tu objetivo de entrenamiento es en menos de 2 semanas: evita un déficit grande hasta después.</p>' : ''}
      </div>
      <div class="tarjeta"><div class="etiqueta">Calorías para comer al día</div>
        <div class="en-total num">${fmtKcal(P.kcal)}</div>
        <p class="suave chico">Tu gasto promedio (14 días) es <b>${fmtKcal(P.tdee)}</b>${P.diff ? `; ${P.diff < 0 ? 'déficit' : 'superávit'} de <b>${fmtKcal(Math.abs(P.diff))}</b> por día` : ''}.${P.bajoPiso ? ` Se dejó en <b>${fmtKcal(P.piso)}</b> para no comer menos que tu gasto basal.` : ''}</p>
        <div class="macros">
          <div class="mc-p"><b class="num">${P.gProt} g</b><span>Proteína</span><small>${fmtNum(Math.round(P.gProt / D.peso * 10) / 10)} g/kg · ${fmtKcal(P.gProt * 4)}</small></div>
          <div class="mc-g"><b class="num">${P.gGrasa} g</b><span>Grasas</span><small>${fmtKcal(P.gGrasa * 9)}</small></div>
          <div class="mc-c"><b class="num">${P.gCarb} g</b><span>Carbohidratos</span><small>${fmtKcal(P.gCarb * 4)}</small></div>
        </div>
        <div class="macro-barra"><span class="mc-p" style="flex:${P.gProt * 4}"></span><span class="mc-g" style="flex:${P.gGrasa * 9}"></span><span class="mc-c" style="flex:${Math.max(1, P.gCarb * 4)}"></span></div>
        <p class="nota">1 kg de grasa ≈ 7.700 kcal. Proteína alta para cuidar el músculo: repártela en 3-5 comidas de 25-40 g. Son estimaciones: ajusta según tu tendencia de 2-3 semanas. No reemplaza a un nutricionista.</p></div>`}`;
  enlazarSegProgreso(); enlazarTabsEnergia();
  $('#psAnotar').onclick = dialogoPesoHoy;
  if($('#psMeta')) $('#psMeta').onclick = dialogoMetaPeso;
}
function dialogoPesoHoy(){
  const H = pesosHistoria(), u = H[H.length - 1];
  dialogo(`<div class="cab"><h2>Peso de hoy</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <label>Peso (kg)</label><input id="phPeso" inputmode="decimal" value="${u ? esc(String(u.v).replace('.', ',')) : ''}">
    <div class="btns"><button class="btn" data-cerrar>Cancelar</button><button class="btn prim" id="phOk">Guardar</button></div>`, d=>{
    $('#phOk', d).onclick = ()=>{ const v = num($('#phPeso', d).value); if(!(v > 30 && v < 250)){ aviso('Peso no válido'); return; }
      const h = hoyISO(), m = (S.medidas || []).find(x=>x.fecha===h); if(m) m.peso = v; else (S.medidas = S.medidas || []).push({id:uid(), fecha:h, peso:v});
      guardar(); d.close(); aviso('Peso guardado'); vEnergia(); };
  });
}
function dialogoMetaPeso(){
  const M = S.metaPeso || {}, H = pesosHistoria(), u = H[H.length - 1];
  dialogo(`<div class="cab"><h2>Meta de peso</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <p class="suave chico">Peso actual: <b>${u ? fmtNum(u.v) + ' kg' : '—'}</b>. Pon la misma cifra para mantener.</p>
    <label>Peso meta (kg)</label><input id="mpPeso" inputmode="decimal" value="${M.peso ? esc(String(M.peso).replace('.', ',')) : ''}">
    <label>Fecha (opcional)</label><input id="mpFecha" type="date" min="${masDias(hoyISO(), 7)}" value="${esc(M.fecha || '')}">
    <p class="nota" style="margin-top:4px">Sin fecha, la app usa un ritmo seguro: bajar 0,75 % o subir 0,35 % de tu peso por semana.</p>
    <div class="btns">${S.metaPeso ? '<button class="btn" id="mpBorrar">Quitar meta</button>' : '<button class="btn" data-cerrar>Cancelar</button>'}<button class="btn prim" id="mpOk">Guardar</button></div>`, d=>{
    $('#mpOk', d).onclick = ()=>{ const v = num($('#mpPeso', d).value); if(!(v > 30 && v < 250)){ aviso('Peso meta no válido'); return; }
      S.metaPeso = {peso:v, fecha:$('#mpFecha', d).value || null}; guardar(); d.close(); vEnergia(); };
    if($('#mpBorrar', d)) $('#mpBorrar', d).onclick = ()=>{ S.metaPeso = null; guardar(); d.close(); vEnergia(); };
  });
}

/* ======================= Hidratación ======================= */
/* Base 35 ml/kg/día + 600 ml por hora de entrenamiento (ACSM: 0,4-0,8 L/h) + terreno 500 ml + día caluroso 750 ml.
   Tope de seguridad: no más de 1,5 L por hora ni 12 L al día (riesgo de hiponatremia, guía del Ejército de EE. UU.). */
function metaAgua(f){
  f = f || hoyISO(); const D = datosEnergia(), dd = S.diario[f] || {};
  let min = S.sesiones.filter(s=>s.fecha===f).reduce((a, s)=>a + (ent(s.dur) || 0), 0), plan = false;
  if(!min && S.plan && f===hoyISO()){ const x = planDia(f); if(x.ses && x.tipo!=='descanso'){ min = x.ses.min; plan = true; } }
  const base = Math.round(D.peso * 35 / 50) * 50, ent_ = Math.round(min / 60 * 600 / 50) * 50, terreno = D.act[0]==='terreno' ? 500 : 0, calor = dd.calor ? 750 : 0;
  return {base, ent:ent_, min, plan, terreno, calor, total:Math.min(12000, base + ent_ + terreno + calor), tomada:dd.agua || 0};
}
function sumarAgua(ml){ const h = hoyISO(), dd = S.diario[h] = S.diario[h] || {}, meta = metaAgua(h).total, antes = dd.agua || 0;
  dd.agua = Math.max(0, antes + ml); guardar();
  if(antes < meta && dd.agua >= meta) setTimeout(()=>aviso('💧 ¡Meta de agua cumplida! Cuenta para tu racha', 3000), 50); }
const ML_OZ = 29.5735;
const enOz = ()=>S.perfil.unidadAgua==='oz';   // Perfil → Líquidos: litros u onzas
const fmtL = ml=>enOz() ? Math.round(ml / ML_OZ).toLocaleString('es-CL') + ' oz' : (ml / 1000).toLocaleString('es-CL', {minimumFractionDigits:1, maximumFractionDigits:1}) + ' L';
const VASOS = ()=>enOz() ? [[Math.round(8 * ML_OZ), '8 oz', 'vaso'], [Math.round(16 * ML_OZ), '16 oz', 'botella'], [Math.round(32 * ML_OZ), '32 oz', 'caramayola']]
  : [[250, '250 ml', 'vaso'], [500, '500 ml', 'botella'], [1000, '1 L', 'caramayola']];
function vAgua(){
  const A = metaAgua(), pct = Math.min(100, Math.round(A.tomada / A.total * 100)), dd = S.diario[hoyISO()] || {};
  const sem = Array.from({length:7}, (_, k)=>{ const f = hace(6 - k), x = metaAgua(f); return [f, x]; });
  $('#vista').innerHTML = `${segProgreso('Energía y calorías')}${tabsEnergia()}
    <div class="tarjeta agua-hoy"><div class="etiqueta">Agua de hoy</div>
      <div class="agua-fila"><div class="agua-vaso" style="--p:${pct}%"><span class="num">${pct} %</span></div>
        <div><div class="en-total num" style="margin:0">${fmtL(A.tomada)}</div><div class="suave">de ${fmtL(A.total)}${A.tomada >= A.total ? ' · <b style="color:var(--mb)">¡meta cumplida!</b>' : ''}</div></div></div>
      <div class="agua-btns"><button class="btn" data-agua="-${VASOS()[0][0]}">−</button>${VASOS().map(([ml, t, n])=>`<button class="btn" data-agua="${ml}">＋ ${t}<small>${n}</small></button>`).join('')}</div>
      <label class="agua-calor"><input type="checkbox" id="agCalor" ${dd.calor ? 'checked' : ''}><span>☀️ Día caluroso (sobre 28 °C) o con mucha sudoración</span></label></div>
    <div class="tarjeta"><div class="etiqueta">Cómo se calcula tu meta</div>
      <ul class="lista agua-cal">
        <li class="entre"><span>Base: 35 ml (≈ 1,2 oz) × ${fmtNum(datosEnergia().peso)} kg</span><b class="num">${fmtL(A.base)}</b></li>
        <li class="entre"><span>Entrenamiento: ${A.min} min${A.plan ? ' (planificado hoy)' : ''} × 600 ml/h</span><b class="num">${fmtL(A.ent)}</b></li>
        ${A.terreno ? `<li class="entre"><span>Actividad en terreno</span><b class="num">${fmtL(A.terreno)}</b></li>` : ''}
        ${A.calor ? `<li class="entre"><span>Calor</span><b class="num">${fmtL(A.calor)}</b></li>` : ''}
      </ul>
      <p class="nota">Bebe de a poco durante el día; en el entrenamiento, 150-250 ml cada 15-20 min. Orina de color claro (como limonada) = bien hidratado; oscura = bebe más. No tomes más de 1,5 L por hora: el exceso de agua también es peligroso. Pésate antes y después de entrenar: por cada kg perdido, repón 1,5 L.</p></div>
    <div class="tarjeta"><div class="etiqueta">Últimos 7 días</div>
      <div class="en-sem">${sem.map(([f, x])=>`<div><div class="en-col"><i class="agua" style="height:${Math.min(100, x.tomada / x.total * 100)}%"></i></div><b class="num">${x.tomada ? fmtNum(Math.round(x.tomada / 100) / 10) : '—'}</b><span>${DIAS_C[(new Date(f + 'T12:00:00').getDay() + 6) % 7]}</span></div>`).join('')}</div></div>`;
  enlazarSegProgreso(); enlazarTabsEnergia();
  $$('[data-agua]').forEach(b=>b.onclick = ()=>{ sumarAgua(+b.dataset.agua); vAgua(); });
  $('#agCalor').onchange = e=>{ const h = hoyISO(), d = S.diario[h] = S.diario[h] || {}; d.calor = e.target.checked; guardar(); vAgua(); };
}
/* Fila de agua en «¿Cómo llegas hoy?» del Inicio */
function htmlAguaInicio(){
  const A = metaAgua(), pct = Math.min(100, Math.round(A.tomada / A.total * 100));
  return `<div class="agua-inicio"><span class="ai-ic">💧</span><div class="ai-txt"><b class="num">${fmtL(A.tomada)} / ${fmtL(A.total)}</b><div class="ai-barra"><span style="width:${pct}%"></span></div></div>
    <button class="btn chico-btn" id="aiMas" aria-label="Sumar un vaso de agua">＋ vaso</button></div>`;
}
