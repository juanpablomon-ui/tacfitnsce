/* #TACFITNSCE — Recompensas: puntos de mérito, rangos, insignias por niveles y hábitos acumulados.
   Todo se calcula a partir de los datos (no se guarda el puntaje); solo se recuerda qué insignias ya se avisaron. */
'use strict';

/* ---------- Estadísticas para las recompensas ---------- */
/* Días que cuentan para la racha: los de entrenamiento y hasta 2 de descanso activo por semana (lunes a domingo) */
function fechasRacha(ss){
  ss = ss || S.sesiones; const reales = new Set(ss.filter(s=>s.tipo!=='descanso').map(s=>s.fecha)), out = new Set(reales), porSem = {};
  [...new Set(ss.filter(s=>s.tipo==='descanso' && !reales.has(s.fecha)).map(s=>s.fecha))].sort().forEach(f=>{
    const d = new Date(f + 'T12:00:00'); d.setDate(d.getDate() - (d.getDay() + 6) % 7); const k = iso(d);
    if((porSem[k] || 0) < 2){ porSem[k] = (porSem[k] || 0) + 1; out.add(f); } });
  return [...out];
}
function rachaMaxima(fechas){
  const f = [...new Set(fechas)].sort(); let max = 0, act = 0, prev = null;
  f.forEach(x=>{ const d = new Date(x + 'T12:00:00'); act = prev && (d - prev) / 86400000 === 1 ? act + 1 : 1; max = Math.max(max, act); prev = d; });
  return max;
}
function rachaActual(fechas){
  const set = new Set(fechas), d = new Date(); let n = 0;
  if(!set.has(iso(d))) d.setDate(d.getDate()-1);
  while(set.has(iso(d))){ n++; d.setDate(d.getDate()-1); }
  return n;
}
const HABITOS = [['sueno', 'Sueño', '😴'], ['alim', 'Alimentación', '🥗'], ['energia', 'Energía', '⚡']];
function estadisticas(){
  const ss = ordenCrono(), tot = acumular(ss), st = {n:ss.length, km:tot.m, carga:tot.carga, ton:tot.kg/1000, min:tot.min};
  st.rachaMax = rachaMaxima(fechasRacha(ss)); st.racha = rachaActual(fechasRacha(ss)); st.descansos = ss.filter(s=>s.tipo==='descanso').length; st.kcal = ss.reduce((a, s)=>a + kcalDe(s), 0);
  // récords superados (mejoras sobre una marca anterior)
  const mejor = {}; let recs = 0;
  ss.forEach(s=>(s.recs || []).forEach(r=>{ const b = mejor[r.ej], menos = r.u==='tiempo';
    if(b!=null && (menos ? r.valor < b : r.valor > b)) recs++;
    if(b==null || (menos ? r.valor < b : r.valor > b)) mejor[r.ej] = r.valor; }));
  st.records = recs;
  st.fotos = ss.reduce((a, s)=>a + (s.fotos || []).length, 0);
  // hábitos: días con chequeo completo y rachas de «Bien»
  const D = S.diario || {}, completos = Object.keys(D).filter(f=>HABITOS.every(([k])=>D[f][k]!=null && D[f][k]!==''));
  st.chequeos = completos.length; st.rachaChequeo = rachaMaxima(completos);
  HABITOS.forEach(([k])=>{ const bien = Object.keys(D).filter(f=>D[f][k]==='2'); st['bien_' + k] = rachaMaxima(bien); st['bienAct_' + k] = rachaActual(bien); });
  // agua: cumplida = tomaste toda tu meta del día (metaAgua en energia.js)
  const aguaOk = Object.keys(D).filter(f=>D[f].agua && D[f].agua >= metaAgua(f).total);
  st.bien_agua = rachaMaxima(aguaOk); st.bienAct_agua = rachaActual(aguaOk); st.diasAgua = aguaOk.length;
  st.diasPerfectos = completos.filter(f=>HABITOS.every(([k])=>D[f][k]==='2')).length;
  // PSF, combate, capacidad, variedad, meses cumplidos y logros por movimiento
  const ev = S.controles.map(c=>c.eval); st.psf = ev.includes('MB') ? 2 : ev.includes('A') || ev.includes('ACL') ? 1 : 0;
  st.combate = typeof aptitudCombate==='function' ? aptitudCombate().cumple : 0;
  const movs = new Set(); ss.forEach(s=>Object.keys(contribuciones(s)).forEach(m=>movs.add(m))); st.variedad = movs.size;
  const porMes = {}; ss.forEach(s=>{ const m = s.fecha.slice(0, 7); (porMes[m] = porMes[m] || new Set()).add(s.fecha); });
  const meta = ent(S.perfil.meta) || 4; st.mesesMeta = Object.entries(porMes).filter(([m, d])=>d.size >= Math.round(meta * new Date(+m.slice(0, 4), +m.slice(5, 7), 0).getDate() / 7)).length;
  const totM = {}; ss.forEach(s=>{ const c = contribuciones(s); Object.entries(c).forEach(([id, o])=>{ const t = totM[id] = totM[id] || {reps:0, m:0, cal:0}; t.reps += o.reps; t.m += o.m; t.cal += o.cal; }); });
  st.nivelMov = Math.max(0, ...Object.values(totM).map(t=>{ const u = t.m ? 'm' : t.cal ? 'cal' : 'reps'; return UMBRALES[u].filter(x=>x <= t[u]).length + 1; }));
  return st;
}

/* ---------- Insignias (cada nivel cuenta como una insignia) ---------- */
const INSIGNIAS = [
  {id:'sesiones', n:'Constancia', ic:'🎯', d:'Entrenamientos registrados', v:s=>s.n, t:[1, 10, 25, 50, 100, 250, 500, 1000]},
  {id:'kcal', n:'Horno', ic:'🔥', d:'Calorías quemadas entrenando', v:s=>s.kcal || 0, t:[1000, 10000, 50000, 100000, 250000, 500000]},
  {id:'recup', n:'Recuperación inteligente', ic:'🔋', d:'Descansos activos registrados', v:s=>s.descansos || 0, t:[1, 5, 15, 40, 100]},
  {id:'racha', n:'Racha de hierro', ic:'🔥', d:'Días seguidos entrenando', v:s=>s.rachaMax, t:[3, 7, 14, 30, 60, 100]},
  {id:'correr', n:'Fondista', ic:'🏃', d:'Kilómetros corridos', v:s=>(s.km.correr || 0)/1000, t:[10, 50, 100, 250, 500, 1000, 2500]},
  {id:'marchar', n:'Infante de marcha', ic:'🥾', d:'Kilómetros marchados', v:s=>(s.km.marchar || 0)/1000, t:[10, 32, 100, 250, 500, 1000]},
  {id:'carga', n:'Mula de carga', ic:'🎒', d:'km·kg de carga transportada', v:s=>s.carga, t:[100, 500, 1000, 2500, 5000, 10000, 25000]},
  {id:'ton', n:'Fuerza bruta', ic:'🏋️', d:'Toneladas levantadas', v:s=>s.ton, t:[1, 10, 25, 50, 100, 250, 500]},
  {id:'records', n:'Superación', ic:'🏆', d:'Récords personales superados', v:s=>s.records, t:[1, 5, 10, 25, 50, 100]},
  {id:'mes', n:'Mes cumplido', ic:'📅', d:'Meses en que cumpliste tu meta', v:s=>s.mesesMeta, t:[1, 3, 6, 12, 24]},
  {id:'chequeo', n:'Autodisciplina', ic:'📋', d:'Días seguidos marcando cómo llegas', v:s=>s.rachaChequeo, t:[3, 7, 14, 30, 60, 100]},
  {id:'sueno', n:'Descanso del guerrero', ic:'😴', d:'Días seguidos durmiendo bien', v:s=>s.bien_sueno, t:[3, 7, 14, 30, 60]},
  {id:'agua', n:'Camello', ic:'💧', d:'Días seguidos tomando toda tu agua', v:s=>s.bien_agua || 0, t:[3, 7, 14, 30, 60, 100]},
  {id:'alim', n:'Rancho limpio', ic:'🥗', d:'Días seguidos alimentándote bien', v:s=>s.bien_alim, t:[3, 7, 14, 30, 60]},
  {id:'perfecto', n:'Día perfecto', ic:'⭐', d:'Días con sueño, alimentación y energía en «Bien»', v:s=>s.diasPerfectos, t:[1, 7, 30, 100]},
  {id:'variedad', n:'Versátil', ic:'🧩', d:'Movimientos distintos entrenados', v:s=>s.variedad, t:[5, 10, 25, 50, 100]},
  {id:'especialista', n:'Especialista', ic:'🔷', d:'Nivel máximo alcanzado en un movimiento', v:s=>s.nivelMov, t:[3, 5, 7, 9, 11]},
  {id:'psf', n:'Prueba aprobada', ic:'🎖️', d:'Control PSF: Apto (I) y Apto muy bueno (II)', v:s=>s.psf, t:[1, 2]},
  {id:'combate', n:'Apto para el combate', ic:'🛡️', d:'Estándares de la batería funcional de combate cumplidos', v:s=>s.combate, t:[1, 3, 6]},
  {id:'fotos', n:'Corresponsal', ic:'📷', d:'Fotos en tu diario', v:s=>s.fotos, t:[1, 10, 50, 100]},
];
const ROMANOS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
function estadoInsignias(st){
  st = st || estadisticas();
  return INSIGNIAS.map(b=>{ const v = b.v(st) || 0, nivel = b.t.filter(x=>v >= x).length, sig = b.t[nivel];
    return Object.assign({}, b, {valor:v, nivel, max:b.t.length, sig, pct:sig ? Math.min(100, Math.round(v / sig * 100)) : 100}); });
}
const insigniasGanadas = E=>E.flatMap(b=>b.t.slice(0, b.nivel).map((x, i)=>({id:b.id + '_' + x, n:b.n, nivel:i+1, ic:b.ic, t:x})));

/* ---------- Puntos de mérito y rangos ---------- */
const RANGOS = [[0, 'Recluta'], [250, 'Explorador'], [750, 'Combatiente'], [1500, 'Veterano'], [3000, 'Élite'], [6000, 'Especial'], [12000, 'Leyenda']];
function puntos(st, E){
  st = st || estadisticas(); E = E || estadoInsignias(st);
  const det = [
    ['Entrenamientos', st.n * 10 + Math.round(Math.min(st.min, st.n * 90) / 3)],
    ['Kilómetros', Math.round(Object.values(st.km).reduce((a, b)=>a + b, 0) / 1000 * 2)],
    ['Carga transportada', Math.round(st.carga / 50)],
    ['Toneladas levantadas', Math.round(st.ton * 2)],
    ['Récords superados', st.records * 25],
    ['Hábitos (cómo llegas)', st.chequeos * 3 + st.diasPerfectos * 5],
    ['Insignias', insigniasGanadas(E).length * 50],
  ];
  const total = det.reduce((a, d)=>a + d[1], 0);
  let i = 0; while(i+1 < RANGOS.length && total >= RANGOS[i+1][0]) i++;
  const sig = RANGOS[i+1];
  return {total, det, rango:RANGOS[i][1], idx:i, sig:sig ? sig[1] : null, falta:sig ? sig[0] - total : 0, pct:sig ? Math.round((total - RANGOS[i][0]) / (sig[0] - RANGOS[i][0]) * 100) : 100};
}

/* ---------- Aviso de insignias nuevas (se revisa después de cada guardado) ---------- */
let tInsig = null;
function programarRevision(){ clearTimeout(tInsig); tInsig = setTimeout(revisarInsignias, 500); }
function revisarInsignias(){
  const ganadas = insigniasGanadas(estadoInsignias()).map(x=>x.id);
  const rango = puntos().rango; S.rangoHist = S.rangoHist || [];
  const ultR = S.rangoHist[S.rangoHist.length - 1];
  if(!ultR) S.rangoHist.push({fecha:hoyISO(), rango, inicial:true}); else if(ultR.rango!==rango) S.rangoHist.push({fecha:hoyISO(), rango});
  if(!Array.isArray(S.insVistas)){ S.insVistas = ganadas; try{ localStorage.setItem(CLAVE, JSON.stringify(S)); }catch(e){} return; }   // primera vez: sin avisos
  const nuevas = insigniasGanadas(estadoInsignias()).filter(x=>!S.insVistas.includes(x.id));
  if(!nuevas.length){ if(!ultR || ultR.rango!==rango){ try{ localStorage.setItem(CLAVE, JSON.stringify(S)); }catch(e){} } return; }
  S.insFechas = S.insFechas || {}; nuevas.forEach(x=>S.insFechas[x.id] = hoyISO());
  S.insVistas = S.insVistas.concat(nuevas.map(x=>x.id)); try{ localStorage.setItem(CLAVE, JSON.stringify(S)); }catch(e){}
  const n = nuevas[nuevas.length-1], txt = '🎖️ Nueva insignia: ' + n.n + ' ' + ROMANOS[n.nivel] + (nuevas.length > 1 ? ' (+' + (nuevas.length-1) + ' más)' : '');
  const a = $('#aviso'); setTimeout(()=>aviso(txt, 4000), a && !a.hidden ? 2600 : 0);
}

/* ---------- Hábitos en «¿Cómo llegas hoy?» ---------- */
function htmlHabitos(){
  const D = S.diario || {}, st = estadisticas(), dias = Array.from({length:14}, (_, i)=>{ const d = new Date(); d.setDate(d.getDate() - 13 + i); return iso(d); });
  return `<div class="habitos">
    ${HABITOS.map(([k, n, ic])=>`<div class="habito"><span class="hab-n">${ic} ${n}</span>
      <span class="hab-puntos">${dias.map(f=>`<i class="h${D[f] && D[f][k]!=null && D[f][k]!=='' ? D[f][k] : 'x'}" title="${f}"></i>`).join('')}</span>
      <span class="hab-racha num">${st['bienAct_' + k] ? '🔥 ' + st['bienAct_' + k] : '—'}</span></div>`).join('')}
    <div class="habito"><span class="hab-n">💧 Agua</span>
      <span class="hab-puntos">${dias.map(f=>{ const a = D[f] && D[f].agua; if(!a) return `<i class="hx" title="${f}"></i>`; const p = a / metaAgua(f).total; return `<i class="h${p >= 1 ? 2 : p >= 0.5 ? 1 : 0}" title="${f}"></i>`; }).join('')}</span>
      <span class="hab-racha num">${st.bienAct_agua ? '🔥 ' + st.bienAct_agua : '—'}</span></div>
    <div class="suave chico" style="margin-top:6px">Últimos 14 días · ${st.chequeos} días registrados · ${st.diasPerfectos} días perfectos ⭐</div>
  </div>`;
}

/* ---------- Tarjetas de recompensas ---------- */
function htmlRango(p){
  return `<div class="rango-caja"><div class="rango-ins"><span>${p.idx + 1}</span></div>
    <div style="flex:1;min-width:0"><div class="etiqueta">Rango</div><div class="rango-n">${p.rango}</div>
      <div class="barra-logro"><span style="width:${p.pct}%"></span></div>
      <div class="suave chico num">${p.total.toLocaleString('es-CL')} puntos de mérito${p.sig ? ' · faltan ' + p.falta.toLocaleString('es-CL') + ' para ' + p.sig : ' · rango máximo'}</div></div></div>`;
}
function htmlInsignias(E){
  return `<div class="insignias-grid">${E.map(b=>`<button class="insig ${b.nivel ? 'on' : ''}" data-insig="${b.id}">
    <span class="insig-ic">${b.nivel ? b.ic : '🔒'}</span><span class="insig-n">${esc(b.n)}</span>
    <span class="insig-niv num">${b.nivel ? ROMANOS[b.nivel] + (b.nivel===b.max ? ' · máx.' : '') : 'bloqueada'}</span>
    <span class="insig-barra"><i style="width:${b.pct}%"></i></span></button>`).join('')}</div>`;
}
function verInsignia(b){
  const fmtV = v=>fmtNum(Math.round(v*10)/10);
  dialogo(`<div class="cab"><h2>${b.ic} ${esc(b.n)}</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <p class="suave">${esc(b.d)}</p><div class="grande num" style="color:var(--acento)">${fmtV(b.valor)}</div>
    <ul class="lista">${b.t.map((x, i)=>`<li class="entre"><span>${b.valor >= x ? '✅' : '🔒'} Nivel ${ROMANOS[i+1]}</span><span class="num ${b.valor >= x ? 'pr' : 'suave'}">${fmtV(x)}</span></li>`).join('')}</ul>
    <p class="nota">Cada nivel desbloqueado suma 50 puntos de mérito.</p>`);
}
function verPuntos(p){
  dialogo(`<div class="cab"><h2>Puntos de mérito</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    ${htmlRango(p)}
    <ul class="lista">${p.det.map(([n, v])=>`<li class="entre"><span>${n}</span><span class="num">${v.toLocaleString('es-CL')}</span></li>`).join('')}</ul>
    <h3>Rangos</h3><ul class="lista">${RANGOS.map(([x, n], i)=>`<li class="entre"><span>${i <= p.idx ? '🎖️' : '🔒'} ${n}</span><span class="num suave">${x.toLocaleString('es-CL')}</span></li>`).join('')}</ul>
    <p class="nota">Ganas puntos por entrenar (10 por sesión + minutos), kilómetros (2 por km), carga transportada, toneladas, récords (25), hábitos e insignias (50 cada nivel).</p>`);
}

/* ---------- Cabecera del perfil (portada, foto, frase y cifras) ---------- */
function htmlCabeceraPerfil(generalCap){
  const p = S.perfil, st = estadisticas(), E = estadoInsignias(st), pt = puntos(st, E), g = insigniasGanadas(E).length, totalIns = INSIGNIAS.reduce((a, b)=>a + b.t.length, 0);
  const ini = (p.nombre || '?').split(' ').filter(Boolean).slice(0, 2).map(x=>x[0].toUpperCase()).join('');
  return `<div class="perfil-cab">
    <div class="pc-portada">${p.banner ? `<img data-foto="${p.banner}" alt="">` : ''}</div>
    <div class="pc-fila"><div class="pc-avatar">${p.avatar ? `<img data-foto="${p.avatar}" alt="Foto de perfil">` : `<span>${esc(ini)}</span>`}</div>
      <div class="pc-btns"><button class="btn chico-btn" id="pcEditar" aria-label="Editar perfil">✎</button><button class="btn chico-btn" id="pcCompartir" aria-label="Compartir">↗</button></div></div>
    <div class="pc-nombre">${esc(p.nombre || 'Tu nombre')} <span class="pc-bandera">🇨🇱</span></div>
    ${p.frase ? `<div class="pc-frase">${esc(p.frase)}</div>` : ''}
    <div class="pc-cifras">
      <div><b class="num">${st.n.toLocaleString('es-CL')}</b><span>Sesiones</span></div>
      <button id="pcIns"><b class="num">${g}<small>/${totalIns}</small></b><span>Insignias</span></button>
      <button id="pcRango"><b class="txt">${pt.rango}</b><span>${pt.total.toLocaleString('es-CL')} pts</span></button>
      <div><b class="txt">${generalCap ? NIVELES[Math.round(generalCap)] : "—"}</b><span>Capacidad</span></div>
    </div></div>`;
}
function dialogoEditarPerfil(){
  const p = S.perfil;
  dialogo(`<div class="cab"><h2>Editar perfil</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <label>Nombre</label><input id="epNombre" value="${esc(p.nombre)}">
    <label>Tu frase o lema (puede tener varias líneas)</label><textarea id="epFrase" rows="4" placeholder="Ej.: 2 simples reglas…">${esc(p.frase || '')}</textarea>
    <div class="btns"><button class="btn" id="epAvatar">📷 Foto de perfil</button><button class="btn" id="epBanner">🖼️ Foto de portada</button></div>
    <div class="btns"><button class="btn" data-cerrar>Cancelar</button><button class="btn prim" id="epOk">Guardar</button></div>`, d=>{
    const foto = campo=>elegirFotos(async bs=>{ if(!bs.length) return; const id = 'f' + uid(); await fotoGuardar(id, bs[0]); if(p[campo]) await fotoBorrar(p[campo]).catch(()=>{}); p[campo] = id; guardar(); aviso('Foto guardada'); if(vistaActual==='hoy') vHoy(); });
    $('#epAvatar', d).onclick = ()=>foto('avatar'); $('#epBanner', d).onclick = ()=>foto('banner');
    $('#epOk', d).onclick = ()=>{ p.nombre = $('#epNombre', d).value.trim(); p.frase = $('#epFrase', d).value.trim(); guardar(); subtitulo(); d.close(); VISTAS[vistaActual](); };
  });
}
function compartirPerfil(){
  const st = estadisticas();
  mostrarCompartir({titulo:'Compartir perfil', nombre:'tacfit_perfil', texto:`${st.n} entrenamientos registrados 💪\n${ETIQ}`,
    generar:f=>tarjetaPerfil(f==='historia' ? 1920 : 1080)});
}
