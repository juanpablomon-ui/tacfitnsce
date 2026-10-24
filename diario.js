/* #TACFITNSCE — Diario de entrenamiento: fotos (IndexedDB), kilómetros/carga/toneladas por entrenamiento,
   muro, calendario con mapa del año, acumulados con hitos y tarjeta para compartir.                       */
'use strict';

/* ---------- Fotos en IndexedDB (localStorage es muy chico para imágenes) ---------- */
const FOTOS_DB = 'tacfit_fotos';
let dbFotos = null;
const urlsFoto = {};
function abrirFotos(){
  if(dbFotos) return Promise.resolve(dbFotos);
  return new Promise((ok, mal)=>{
    const rq = indexedDB.open(FOTOS_DB, 1);
    rq.onupgradeneeded = ()=>rq.result.createObjectStore('fotos');
    rq.onsuccess = ()=>{ dbFotos = rq.result; ok(dbFotos); };
    rq.onerror = ()=>mal(rq.error);
  });
}
async function fotoOp(modo, fn){
  const db = await abrirFotos();
  return new Promise((ok, mal)=>{ const tx = db.transaction('fotos', modo), st = tx.objectStore('fotos'), rq = fn(st);
    tx.oncomplete = ()=>ok(rq && rq.result); tx.onerror = ()=>mal(tx.error); });
}
const fotoGuardar = (id, blob)=>fotoOp('readwrite', st=>st.put(blob, id));
const fotoLeer = id=>fotoOp('readonly', st=>st.get(id));
const fotoBorrar = id=>{ if(urlsFoto[id]){ URL.revokeObjectURL(urlsFoto[id]); delete urlsFoto[id]; } return fotoOp('readwrite', st=>st.delete(id)); };
const fotoIds = ()=>fotoOp('readonly', st=>st.getAllKeys());
async function fotoUrl(id){
  if(urlsFoto[id]) return urlsFoto[id];
  const b = await fotoLeer(id).catch(()=>null);
  return b ? (urlsFoto[id] = URL.createObjectURL(b)) : null;
}
/* Achica la foto (lado mayor 1280 px, JPEG) para que no ocupe espacio */
function comprimirFoto(file, png){
  return new Promise((ok, mal)=>{
    const img = new Image(), u = URL.createObjectURL(file);
    img.onload = ()=>{
      const k = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
      c.toBlob(b=>b ? ok(b) : mal(new Error('foto')), png ? 'image/png' : 'image/jpeg', 0.82);   // png: conserva la transparencia (emblema)
    };
    img.onerror = ()=>{ URL.revokeObjectURL(u); mal(new Error('No se pudo leer la foto')); };
    img.src = u;
  });
}
/* Pinta las fotos de un contenedor: <img data-foto="id"> */
function cargarFotos(raiz){ $$('img[data-foto]', raiz).forEach(async img=>{ const u = await fotoUrl(img.dataset.foto); if(u) img.src = u; else img.remove(); }); }
async function borrarFotosDe(s){ for(const id of s.fotos || []) await fotoBorrar(id).catch(()=>{}); }

/* ---------- Métricas de cada entrenamiento ---------- */
const CAT_KM = {correr:'Corriendo', marchar:'Marchando', nadar:'Nadando', bici:'En bicicleta', remo:'Remo y ski'};
function catKm(id){
  if(!id) return null;
  if(/^(carrera|sprint|trote|shuttle|trail)/.test(id)) return 'correr';
  if(id==='marcha' || id==='caminata') return 'marchar';
  if(id.startsWith('nado')) return 'nadar';
  if(id.startsWith('bici')) return 'bici';
  if(id==='remo' || id==='ski') return 'remo';
  return null;
}
const ES_CARGA = new Set(['marcha', 'farmer', 'traslado', 'cajas_municion', 'yugo', 'caminata', 'carrera_tenida', 'arrastre_herido']);
function vecesMain(w){
  const p = Object.assign({}, PDEF, w.params), main = (w.secc.main || []).filter(m=>!m.descanso).length || 1, res = w.res || {};
  switch(w.estilo){
    case 'rft': case 'cada_ronda': case 'fgb': case 'calidad': return ent(p.rondas) || 1;
    case 'amrap': return ent(res.r) || 0;
    case 'emom': return ent(res.ok) ?? ent(p.intervalos) ?? 1;
    case 'emom_alt': return (ent(res.ok) ?? ent(p.intervalos) ?? main) / main;
    case 'tabata': case 'amreps': return 0;
    default: return 1;
  }
}
/* Metros anotados como resultado (intervalos por tiempo y movimientos con tiempo fijo en «por calidad») */
function metrosAnotados(w){
  const out = [], res = w.res || {}, main = (w.secc.main || []);
  if(w.estilo==='intervalos' || (w.estilo==='cada_ronda' && medidaCadaRonda(w)==='m')){ const m = main.find(x=>!x.descanso && x.mov); if(m && movDe(m.mov) && movDe(m.mov).c==='dist'){ const t = (res.pr || []).map(num).filter(x=>x!=null).reduce((a, b)=>a + b, 0); if(t) out.push([m.mov, t]); } }
  if(w.estilo==='calidad') main.forEach((m, i)=>{ if(!m.descanso && m.mov && !m.dist && movDe(m.mov) && movDe(m.mov).c==='dist'){ const v = num((res.pm || {})[i]); if(v) out.push([m.mov, v]); } });
  return out;
}
function repsEsquema(w){ return String(w.params.esquema || '').split(/[^0-9]+/).filter(Boolean).reduce((a, b)=>a + +b, 0); }
function metricas(s){
  const r = {m:{}, carga:0, kg:0, min:ent(s.dur) || 0};
  const sumar = (mov, veces, reps)=>{
    if(!mov || mov.descanso || !veces) return;
    const mt = mov.dist ? metros(mov.dist, mov.distU) || 0 : 0, c = catKm(mov.mov), kg = mov.peso ? aKg(mov.peso, mov.pesoU) || 0 : 0;
    if(mt && c) r.m[c] = (r.m[c] || 0) + mt * veces;
    if(mt && kg && ES_CARGA.has(mov.mov)) r.carga += mt/1000 * kg * veces;
    const n = reps!=null ? reps : ent(mov.reps) || 0;
    if(kg && n && !mt) r.kg += kg * n * veces;
  };
  const w = s.w;
  if(w && w.uno){
    const U = w.uno, mt = metros(U.dist, U.distU), c = catKm(U.mov);
    if(U.c==='dist' && mt){ if(c) r.m[c] = mt; const kg = num(U.peso); if(kg && (ES_CARGA.has(U.mov) || c==='marchar' || c==='correr')) r.carga = mt/1000 * kg;
      if(!r.min){ const t = PSF.leerTiempo(U.tiempo); if(t) r.min = Math.round(t/60); } }
    if(U.c==='peso') (U.series || []).forEach(x=>{ const kg = aKg(x.peso, U.pesoU); if(kg) r.kg += kg * (ent(x.reps) || 1); });
  } else if(w && w.secc){
    const v = vecesMain(w), esq = w.estilo==='esquema' ? repsEsquema(w) : null, R = ent((w.res || {}).r) || 0;
    (w.secc.in || []).forEach(m=>sumar(m, 1));
    (w.secc.main || []).forEach(m=>{
      if(w.estilo==='esquema') sumar(m, 1, m.dist ? null : esq);
      else if(w.estilo==='muerte') sumar(m, 1, R*(R+1)/2);
      else sumar(m, v);
    });
    (w.secc.out || []).forEach(m=>sumar(m, 1));
    metrosAnotados(w).forEach(([mov, mt])=>{ const c = catKm(mov); if(c) r.m[c] = (r.m[c] || 0) + mt; });
    if(!r.min && (w.estilo==='amrap' || w.estilo==='amreps')) r.min = ent(w.params.minutos) || 0;
    if(!r.min && s.u!=='rondas' && s.valor && estiloDe(w.estilo).r==='tiempo') r.min = Math.round(s.valor/60);
  } else if(s.tipo==='carrera' || s.tipo==='marcha'){   // entrenamientos antiguos
    const mt = metros((s.res || {}).dist, 'km'); if(mt){ r.m[s.tipo==='carrera' ? 'correr' : 'marchar'] = mt; const kg = num((s.res || {}).kg); if(kg && s.tipo==='marcha') r.carga = mt/1000 * kg; }
    if(!r.min && s.valor) r.min = Math.round(s.valor/60);
  }
  r.km = Object.values(r.m).reduce((a, b)=>a + b, 0) / 1000;
  return r;
}
const carga = s=>(metricas(s).min || 0) * (ent(s.rpe) || 0);   // método sRPE: minutos × esfuerzo
function grupoDe(s){
  if(s.tipo==='descanso') return 'desc';
  const w = s.w; let id = null;
  if(w && w.uno) id = w.uno.mov; else if(w && w.secc) id = ((w.secc.main || []).find(m=>m.mov) || {}).mov;
  else if(s.tipo==='carrera') id = 'carrera'; else if(s.tipo==='marcha') id = 'marcha'; else if(s.tipo==='fuerza') id = 'sentadilla';
  const m = id && movDe(id); return m ? m.g : 'gim';
}

/* ---------- Acumulados e hitos ---------- */
function acumular(ss){
  const t = {m:{}, km:0, carga:0, kg:0, min:0, n:ss.length};
  ss.forEach(s=>{ const r = metricas(s); Object.entries(r.m).forEach(([k, v])=>t.m[k] = (t.m[k] || 0) + v); t.km += r.km; t.carga += r.carga; t.kg += r.kg; t.min += r.min; });
  return t;
}
const HITOS = [
  {k:'correr', n:'km corridos', f:t=>(t.m.correr || 0)/1000, u:[10, 50, 100, 250, 500, 1000, 2000]},
  {k:'marchar', n:'km marchados', f:t=>(t.m.marchar || 0)/1000, u:[10, 25, 50, 100, 250, 500]},
  {k:'carga', n:'km·kg de carga transportada', f:t=>t.carga, u:[100, 500, 1000, 2500, 5000, 10000]},
  {k:'kg', n:'toneladas levantadas', f:t=>t.kg/1000, u:[1, 10, 25, 50, 100, 250]},
  {k:'n', n:'entrenamientos', f:t=>t.n, u:[1, 10, 25, 50, 100, 250, 500]},
];
function hitos(){
  const ss = S.sesiones.slice().sort((a, b)=>a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : (a.creado || 0) - (b.creado || 0));
  const logrados = [], prox = [], acum = [];
  ss.forEach((s, i)=>{ acum.push(s); const t = acumular(acum);
    HITOS.forEach(h=>h.u.forEach(u=>{ const id = h.k + u; if(h.f(t) >= u && !logrados.some(x=>x.id===id)) logrados.push({id, txt:fmtNum(u) + ' ' + h.n, fecha:s.fecha}); })); });
  const t = acumular(ss);
  HITOS.forEach(h=>{ const v = h.f(t), sig = h.u.find(u=>u > v); if(sig) prox.push({txt:fmtNum(sig) + ' ' + h.n, pct:Math.round(v / sig * 100), falta:fmtNum(Math.round((sig - v) * 10)/10)}); });
  return {logrados:logrados.reverse(), prox:prox.sort((a, b)=>b.pct - a.pct)};
}
const fmtNum = v=>(Math.round(v * 10)/10).toLocaleString('es-CL');
const fmtKm = m=>fmtNum(m/1000);
const fmtHoras = min=>Math.floor(min/60) + ':' + String(Math.round(min%60)).padStart(2, '0');

/* ---------- Vista Diario ---------- */
let vistaDiario = null, mesCal = null, periodoAc = null, verMasMuro = 20;   // se leen al abrir (app.js carga después)
function vDiario(){
  vistaDiario = vistaDiario || pref('vistaDiario') || 'muro'; periodoAc = periodoAc || pref('periodoAc') || 'mes';
  const seg = `<div class="segmentos" id="segDiario" style="margin-bottom:12px">${[['muro', 'Muro'], ['agenda', 'Agenda'], ['cal', 'Calendario'], ['acum', 'Acumulados']].map(([k, t])=>`<button data-s="${k}" class="${vistaDiario===k ? 'activa' : ''}">${t}</button>`).join('')}</div>`;
  $('#vista').innerHTML = `<h2>Diario</h2>${seg}<div id="diarioCuerpo"></div>`;
  $$('#segDiario button').forEach(b=>b.onclick = ()=>{ vistaDiario = b.dataset.s; pref('vistaDiario', vistaDiario); vDiario(); });
  ({muro:vMuro, agenda:vAgenda, cal:vCalendario, acum:vAcumulados})[vistaDiario]();
}
const ordenadas = ()=>S.sesiones.slice().sort((a, b)=>a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : (b.creado || 0) - (a.creado || 0));
function lineaMetricas(s){
  const r = metricas(s), p = [];
  if(r.min) p.push(r.min + ' min');
  if(r.km) p.push(verKm(r.km));
  if(r.carga) p.push(fmtNum(r.carga) + ' km·kg');
  if(r.kg) p.push(fmtNum(r.kg) + ' kg');
  { const k = kcalDe(s); if(k) p.push(k.toLocaleString('es-CL') + ' kcal'); }
  if(s.fc) p.push('FC ' + s.fc);
  if(s.rpe) p.push('esfuerzo ' + s.rpe);
  return p.join(' · ');
}
/* ---------- Muro tipo red social: publicaciones (feed) o cuadrícula ---------- */
let modoMuro = null;
const ICON_MET = {kcal:'🔥', min:'⏱', km:'📍', carga:'🎒', kg:'🏋️', fc:'❤️', rpe:'💢'};
function chipsMetricas(s){
  const r = metricas(s), c = [];
  if(r.min) c.push(['min', r.min + ' min']); if(r.km) c.push(['km', verKm(r.km)]); if(r.carga) c.push(['carga', fmtNum(r.carga) + ' km·kg']);
  if(r.kg) c.push(['kg', fmtNum(r.kg) + ' kg']); { const k = kcalDe(s); if(k) c.push(['kcal', k.toLocaleString('es-CL') + ' kcal']); } if(s.fc) c.push(['fc', 'FC ' + s.fc]); if(s.rpe) c.push(['rpe', 'esfuerzo ' + s.rpe]);
  return c.map(([k, t])=>`<span class="pm-${k}">${ICON_MET[k]} ${esc(t)}</span>`).join('');
}
function fechaRel(f){ const h = hoyISO(), a = new Date(); a.setDate(a.getDate() - 1); return f===h ? 'Hoy' : f===iso(a) ? 'Ayer' : verFecha(f); }
function avatarMini(){ const p = S.perfil, ini = (p.nombre || '').split(' ').filter(Boolean).slice(0, 2).map(x=>x[0].toUpperCase()).join('') || '◆';
  return `<span class="post-av">${p.avatar ? `<img data-foto="${p.avatar}" alt="">` : `<b>${esc(ini)}</b>`}</span>`; }
const esRecord = s=>(s.recs || []).filter(rc=>{ const b = mejorDe(rc.ej); return b && b.ref===s.id; });
/* Afiche de color cuando el entrenamiento no tiene foto: color del grupo, ícono grande y el resultado */
function aficheMuro(s, chico){
  const g = grupoDe(s), G = GRUPOS[g] || {ic:g==='desc' ? '🔋' : '◆', n:''}, n = ordenCrono().findIndex(x=>x.id===s.id) + 1;
  if(chico) return `<div class="afiche g-${g} chico"><span class="af-ic">${G.ic}</span><span class="af-tit">${esc(s.titulo || etiquetaTipo(s))}</span>
    ${s.txt ? `<span class="af-res num">${esc(resCorto(s))}${s.rx ? ' <small>Rx</small>' : ''}</span>` : ''}</div>`;
  // Resumen al estilo de las apps deportivas: resultado grande, cuadros de datos y los ejercicios
  const m = metricas(s), kc = kcalDe(s), est = [];
  if(m.min) est.push(['Tiempo', fmtHoras(m.min), 'h']);
  if(m.km) est.push(['Dist.', fmtNum(nKm(m.km)), uDist()]);
  if(m.kg) est.push(['Carga', m.kg >= 1000 ? fmtNum(Math.round(m.kg / 100) / 10) : fmtNum(m.kg), m.kg >= 1000 ? 't' : 'kg']);
  if(kc) est.push(['Gasto', kc.toLocaleString('es-CL'), 'kcal']);
  if(s.rpe && est.length < 4) est.push(['Esf.', s.rpe, '/10']);
  const w = s.w, movs = !w ? [] : w.uno && w.uno.tramos && w.uno.tramos.length ? w.uno.tramos.map(t=>t.bloque ? {cant:(t.veces || 1) + ' ×', n:(t.tramos || []).map(x=>cantTramo(x) + (ZONAS_INT[x.int] ? ' ' + x.int : '')).join(' + '), mov:w.uno.mov}
      : {cant:cantTramo(t), n:TIPO_TRAMO[t.k] + (ZONAS_INT[t.int] ? ' · ' + t.int : ''), mov:w.uno.mov}) : w.uno ? [w.uno] : (w.secc ? w.secc.in.concat(w.secc.main, w.secc.out) : []).filter(x=>x && !x.descanso);
  const cant = x=>x.cant ? x.cant : x.reps ? x.reps : x.dist ? fmtD(x.dist, x.distU) : x.cal ? x.cal + ' cal' : x.tiempo || '';
  const res = s.txt ? resCorto(s) : '';
  return `<div class="afiche afiche2 g-${g}">
    <div class="a2-cab"><span class="a2-tipo">${G.ic} ${esc(etiquetaTipo(s))}</span><span class="af-n num">N.º ${n}</span></div>
    <div class="a2-tit">${esc(s.titulo || etiquetaTipo(s))}</div>
    ${res ? `<div class="a2-res num">${esc(res)}${s.rx ? ' <small>Rx</small>' : ''}</div>` : ''}
    ${est.length ? `<div class="a2-est">${est.slice(0, 4).map(([k, v, u])=>`<div><small>${k}</small><b class="num">${esc(String(v))}<i>${u}</i></b></div>`).join('')}</div>` : ''}
    ${movs.length ? `<ul class="a2-movs">${movs.slice(0, 6).map(x=>{ const mv = x.mov && movDe(x.mov), gg = mv ? mv.g : g;
        return `<li class="g-${gg}"><b class="num">${esc(String(cant(x)))}</b><span>${esc(x.cant ? x.n : nomMov(x))}</span>${x.peso ? `<em class="num">${esc(verPeso(x.peso, x.pesoU, x.mov))}</em>` : ''}</li>`; }).join('')}
      ${movs.length > 6 ? `<li class="a2-mas">y ${movs.length - 6} más</li>` : ''}</ul>` : ''}
  </div>`;
}
function tarjetaMuro(s){
  const f = (s.fotos || [])[0], g = grupoDe(s), R = esRecord(s), L = logrosSesion(s).filter(l=>l.cumplida);
  return `<article class="muro-item post" data-id="${s.id}">
    <header class="post-cab">${avatarMini()}<div><b>${esc(S.perfil.nombre || 'Yo')}</b><small><span class="marca-g g-${g}"></span>${esc(etiquetaTipo(s))} · ${fechaRel(s.fecha)}${horaDe(s) ? ' · ' + horaDe(s) : ''}</small></div>
      ${R.length ? '<span class="post-pr">🏆 Récord</span>' : ''}</header>
    <div class="post-media">${f ? `<div class="muro-foto"><img data-foto="${f}" alt="Foto del entrenamiento">${s.txt ? `<span class="muro-sello num">${esc(resCorto(s))}</span>` : ''}${s.fotos.length>1 ? `<span class="muro-mas num">1/${s.fotos.length}</span>` : ''}</div>` : aficheMuro(s)}</div>
    <div class="post-acc"><button data-pa="compartir" aria-label="Compartir">↗</button><button data-pa="foto" aria-label="Agregar foto">📷</button>${s.w ? '<button data-pa="repetir" aria-label="Repetir">⧉</button>' : ''}<span class="suave chico num">${f ? '' : 'sin foto · toca 📷'}</span></div>
    ${f ? `<div class="post-txt"><b>${esc(s.titulo || etiquetaTipo(s))}</b>${s.txt ? ` <span class="num" style="color:var(--acento)">${esc(resCorto(s))}</span>` : ''}${s.notas ? ` ${esc(s.notas)}` : ''}</div>
    <div class="post-chips num">${chipsMetricas(s)}</div>` : s.notas ? `<div class="post-txt">${esc(s.notas)}</div>` : '<div style="height:6px"></div>'}
    ${s.musica ? `<div class="post-musica">${htmlTarjetaMusica(s)}</div>` : ''}
    ${R.length ? `<div class="post-logro">🏆 ${R.map(r=>esc(r.nombre + ': ' + (r.txt || r.valor))).join(' · ')}</div>` : ''}
    ${L.length ? `<div class="post-logro">🎯 ${L.map(l=>esc(l.n.split(' (')[0] + ': ' + fmtCantidad(l.u, l.meta) + ' acumulados')).join(' · ')}</div>` : ''}
  </article>`;
}
/* Insignias, hitos y ascensos aparecen en el muro como tarjetas de celebración */
function celebracionMuro(e){
  return `<div class="post-cele ml-${e.tipo}" data-logro="${esc(JSON.stringify({ic:e.ic, t:e.t, d:e.d, fecha:e.fecha, tipo:e.tipo}))}"><span class="pc-ic">${e.ic}</span>
    <div><small>${esc({ins:'Nueva insignia', hito:'Hito alcanzado', rango:'Ascenso', psf:'Control PSF'}[e.tipo] || 'Logro')} · ${fechaRel(e.fecha)}</small><b>${esc(e.t)}</b></div><span class="pc-sh">↗</span></div>`;
}
function vMuro(){
  modoMuro = modoMuro || pref('modoMuro') || 'feed';
  const ss = ordenadas(), conFotos = S.sesiones.some(s=>(s.fotos || []).length), ult = ent(pref('ultimoRespaldo')) || 0;
  const avisoResp = conFotos && Date.now() - ult > 30*86400000 ? `<div class="tarjeta aviso-resp"><b>Respalda tus fotos.</b> Viven solo en este equipo. <a href="#" id="irResp">Guardar respaldo</a></div>` : '';
  const sem = acumular(S.sesiones.filter(s=>s.fecha >= iso(inicioSemana()))), r = racha();
  const tabs = `<div class="muro-tabs"><button data-mm="feed" class="${modoMuro==='feed' ? 'activa' : ''}" aria-label="Publicaciones">☰ Publicaciones</button><button data-mm="grid" class="${modoMuro==='grid' ? 'activa' : ''}" aria-label="Cuadrícula">▦ Cuadrícula</button></div>`;
  const cab = ss.length ? `<div class="muro-resumen num"><span><b>${sem.n}</b> esta semana</span><span><b>${fmtNum(nKm(sem.km))}</b> ${uDist()}</span><span><b>${fmtHoras(sem.min)}</b> h</span><span>${r ? `<b>${r}</b> 🔥 racha` : 'sin racha'}</span></div>${tabs}` : '';
  let cuerpo = '';
  if(!ss.length) cuerpo = '<div class="tarjeta vacio">Tu diario está vacío.<br>Registra un entrenamiento con el botón <b style="color:var(--acento)">＋</b> y agrégale una foto.</div>';
  else if(modoMuro==='grid') cuerpo = `<div class="muro-grid">${ss.slice(0, verMasMuro * 2).map(s=>{ const f = (s.fotos || [])[0];
      return `<button class="mg-item muro-item" data-id="${s.id}">${f ? `<img data-foto="${f}" alt="">${s.txt ? `<span class="mg-res num">${esc(resCorto(s))}</span>` : ''}` : aficheMuro(s, true)}${esRecord(s).length ? '<span class="mg-pr">🏆</span>' : ''}${(s.fotos || []).length > 1 ? '<span class="mg-mas">❐</span>' : ''}</button>`; }).join('')}</div>`
      + (ss.length > verMasMuro * 2 ? `<button class="btn ancho" id="muroMas">Ver más</button>` : '');
  else {
    const vis = ss.slice(0, verMasMuro), hasta = vis.length ? vis[vis.length - 1].fecha : '', cel = muroLogros().filter(e=>e.tipo!=='rec' && e.fecha && e.fecha >= hasta);
    let dia = '';
    vis.forEach(s=>{ if(s.fecha!==dia){ cel.filter(e=>e.fecha >= s.fecha && (!dia || e.fecha < dia)).forEach(e=>cuerpo += celebracionMuro(e)); dia = s.fecha; } cuerpo += tarjetaMuro(s); });
    cuerpo += ss.length > verMasMuro ? `<button class="btn ancho" id="muroMas">Ver más</button>` : '';
  }
  $('#diarioCuerpo').innerHTML = htmlPortadaIG() + avisoResp + cab + cuerpo;   // la portada tipo Instagram vive en el Diario (antes en Inicio)
  cargarFotos($('#diarioCuerpo')); enlazarPortadaIG();
  $$('[data-mm]').forEach(b=>b.onclick = ()=>{ modoMuro = b.dataset.mm; pref('modoMuro', modoMuro); vMuro(); });
  $$('#diarioCuerpo .muro-item').forEach(a=>a.onclick = ev=>{ const s = S.sesiones.find(x=>x.id===a.dataset.id), acc = ev.target.closest('[data-pa]');
    if(!acc) return verSesion(s); ev.stopPropagation();
    if(acc.dataset.pa==='compartir') compartirSesion(s);
    else if(acc.dataset.pa==='repetir') repetirRegistro(s);
    else elegirFotos(async bs=>{ if(!bs.length) return; await agregarFotosA(s, bs); aviso('Foto agregada'); vMuro(); }); });
  if($('#muroMas')) $('#muroMas').onclick = ()=>{ verMasMuro += 20; vMuro(); };
  if($('#irResp')) $('#irResp').onclick = e=>{ e.preventDefault(); exportar(); };
}
function vCalendario(){
  const hoy = new Date(); mesCal = mesCal || new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const y = mesCal.getFullYear(), m = mesCal.getMonth(), ini = (new Date(y, m, 1).getDay() + 6) % 7, dias = new Date(y, m+1, 0).getDate();
  const porDia = {}; S.sesiones.forEach(s=>(porDia[s.fecha] = porDia[s.fecha] || []).push(s));
  const celdas = [];
  for(let i=0;i<ini;i++) celdas.push('<div></div>');
  for(let d=1; d<=dias; d++){ const f = iso(new Date(y, m, d)), ss = porDia[f] || [];
    celdas.push(`<button class="cal-dia ${ss.length ? 'con' : ''} ${f===hoyISO() ? 'hoy' : ''}" data-f="${f}"><span class="num">${d}</span><span class="cal-marcas">${ss.slice(0, 3).map(s=>`<i class="marca-g g-${grupoDe(s)}"></i>`).join('')}</span></button>`); }
  const delMes = S.sesiones.filter(s=>s.fecha.startsWith(iso(mesCal).slice(0, 7))), t = acumular(delMes);
  $('#diarioCuerpo').innerHTML = `
    <div class="tarjeta">
      <div class="entre"><button class="btn chico-btn" id="calAnt" aria-label="Mes anterior">‹</button><span class="titulo">${MESES_L[m].replace(/^./, c=>c.toUpperCase())} ${y}</span><button class="btn chico-btn" id="calSig" aria-label="Mes siguiente">›</button></div>
      <div class="cal-sem">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d=>`<span>${d}</span>`).join('')}</div>
      <div class="cal-grid">${celdas.join('')}</div>
      <div class="suave chico num" style="margin-top:8px">${delMes.length} entrenamientos · ${fmtNum(t.km)} km · ${fmtHoras(t.min)} h</div>
      <div class="leyenda chico">${Object.entries(GRUPOS).map(([g, x])=>`<span><i class="marca-g g-${g}"></i>${x.corto}</span>`).join('')}</div>
    </div>
    <h3>Mapa del año</h3>
    <div class="tarjeta">${mapaAnio()}<div class="suave chico" style="margin-top:6px">Cada cuadro es un día de las últimas 52 semanas. Más verde, más carga.</div></div>
    <div id="calLista"></div>`;
  $('#calAnt').onclick = ()=>{ mesCal = new Date(y, m-1, 1); vCalendario(); };
  $('#calSig').onclick = ()=>{ mesCal = new Date(y, m+1, 1); vCalendario(); };
  $$('.cal-dia').forEach(b=>b.onclick = ()=>{
    const ss = porDia[b.dataset.f] || []; $$('.cal-dia').forEach(x=>x.classList.toggle('sel', x===b));
    $('#calLista').innerHTML = `<h3>${verFecha(b.dataset.f)}</h3>` + (ss.length ? ss.map(tarjetaMuro).join('') : '<div class="tarjeta vacio">Día de descanso.</div>');
    cargarFotos($('#calLista')); $$('#calLista .muro-item').forEach(a=>a.onclick = ()=>verSesion(S.sesiones.find(s=>s.id===a.dataset.id)));
  });
}
function mapaAnio(){
  const porDia = {}; S.sesiones.forEach(s=>{ porDia[s.fecha] = (porDia[s.fecha] || 0) + Math.max(1, carga(s)); });
  const fin = new Date(), ini = new Date(fin); ini.setDate(ini.getDate() - 7*52 - (fin.getDay() + 6) % 7);
  const vals = Object.values(porDia).sort((a, b)=>a - b), p = q=>vals.length ? vals[Math.floor((vals.length-1) * q)] : 1;
  const niv = v=>!v ? 0 : v <= p(0.33) ? 1 : v <= p(0.66) ? 2 : 3;
  let cols = '', d = new Date(ini);
  while(d <= fin){ let col = ''; for(let i=0;i<7;i++){ const f = iso(d); col += d <= fin ? `<i class="n${niv(porDia[f])}" title="${f}"></i>` : '<i class="vacia"></i>'; d.setDate(d.getDate() + 1); } cols += `<div>${col}</div>`; }
  return `<div class="mapa-anio">${cols}</div>`;
}
function rangoPeriodo(k){
  const h = new Date();
  if(k==='semana') return iso(inicioSemana());
  if(k==='mes') return iso(new Date(h.getFullYear(), h.getMonth(), 1));
  if(k==='anio') return h.getFullYear() + '-01-01';
  return '0000';
}
function vAcumulados(){
  const desde = rangoPeriodo(periodoAc), ss = S.sesiones.filter(s=>s.fecha >= desde), t = acumular(ss), H = hitos();
  const tile = (v, k, extra)=>`<div class="tile"><div class="v">${v}</div><div class="k">${k}</div>${extra || ''}</div>`;
  $('#diarioCuerpo').innerHTML = `
    <div class="chips" id="perAc" style="padding-top:0">${[['semana', 'Esta semana'], ['mes', 'Este mes'], ['anio', 'Este año'], ['total', 'Total']].map(([k, n])=>`<button data-p="${k}" class="${periodoAc===k ? 'activa' : ''}">${n}</button>`).join('')}</div>
    <div class="tiles acum">
      ${tile(t.n, 'entrenamientos')}${tile(fmtHoras(t.min), 'horas')}${tile(fmtNum(nKm(t.km)), uDist() + ' en total')}
      ${Object.entries(CAT_KM).filter(([k])=>t.m[k]).map(([k, n])=>tile(fmtNum(nKm(t.m[k] / 1000)), uDist() + ' ' + n.toLowerCase())).join('')}
      ${t.carga ? tile(fmtNum(t.carga), 'km·kg de carga', '<div class="suave" style="font-size:10px">km × kg transportados</div>') : ''}${t.kg ? tile(nTon(t.kg).toLocaleString('es-CL'), uTon()==='lb' ? 'libras levantadas' : 'toneladas levantadas') : ''}
    </div>
    <h3>Próximos hitos</h3>
    <div class="tarjeta">${H.prox.slice(0, 4).map(h=>`<div class="hito"><div class="entre"><span>${esc(h.txt)}</span><span class="num suave chico">faltan ${h.falta}</span></div><div class="barra-seg"><span class="si" style="flex:${h.pct}"></span><span style="flex:${100-h.pct}"></span></div></div>`).join('') || '<div class="suave">Registra entrenamientos para empezar a sumar.</div>'}</div>
    <h3>Hitos logrados</h3>
    <div class="tarjeta">${H.logrados.length ? `<ul class="lista">${H.logrados.slice(0, 12).map(h=>`<li class="entre"><span>🎖️ ${esc(h.txt)}</span><span class="suave chico num">${verFecha(h.fecha)}</span></li>`).join('')}</ul>` : '<div class="suave">Tu primer hito llega con tu primer entrenamiento.</div>'}</div>`;
  $$('#perAc button').forEach(b=>b.onclick = ()=>{ periodoAc = b.dataset.p; pref('periodoAc', periodoAc); vAcumulados(); });
}

/* ---------- Fotos de un entrenamiento ya guardado ---------- */
function elegirFotos(alListo, camara, png){
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = !camara && !png;
  if(camara) inp.setAttribute('capture', 'environment');   // abre la cámara del teléfono
  inp.onchange = async ()=>{ const out = [];
    for(const f of inp.files){ try{ out.push(await comprimirFoto(f, png)); }catch(e){ aviso('No se pudo leer una foto'); } }
    alListo(out); };
  inp.click();
}
async function agregarFotosA(s, blobs){
  s.fotos = s.fotos || [];
  for(const b of blobs){ const id = 'f' + uid(); await fotoGuardar(id, b); s.fotos.push(id); }
  guardar();
}

function recortar(x, t, max){ t = String(t); if(x.measureText(t).width <= max) return t; while(t.length > 1 && x.measureText(t + '…').width > max) t = t.slice(0, -1); return t + '…'; }
/* compartirSesion: ver compartir.js (7 plantillas con foto) */

/* ---------- Logros por movimiento: acumulado de toda la vida, nivel y próxima meta ---------- */
/* Lo que aportó un entrenamiento a cada movimiento: repeticiones, metros y calorías */
function contribuciones(s){
  const out = {}, w = s.w;
  const sumar = (m, veces, reps)=>{
    if(!m || m.descanso || !m.mov || !veces) return;
    const o = out[m.mov] = out[m.mov] || {reps:0, m:0, cal:0};
    const n = reps!=null ? reps : ent(m.reps) || 0;
    o.reps += n * veces; o.m += (m.dist ? metros(m.dist, m.distU) || 0 : 0) * veces; o.cal += (ent(m.cal) || 0) * veces;
  };
  if(w && w.uno){ const U = w.uno; if(!U.mov) return out; const o = out[U.mov] = {reps:0, m:0, cal:0};
    if(U.c==='dist') o.m = metros(U.dist, U.distU) || 0;
    if(U.c==='peso') (U.series || []).forEach(x=>{ if(num(x.peso)!=null) o.reps += ent(x.reps) || 1; });
    if(U.c==='cuerpo') o.reps = U.seriesR ? U.seriesR.reduce((a, r)=>a + (ent(r) || 0), 0) : ent(U.reps) || 0;
    if(U.c==='cal') o.cal = ent(U.cal) || 0;
  } else if(w && w.secc){
    const v = vecesMain(w), esq = w.estilo==='esquema' ? repsEsquema(w) : null, R = ent((w.res || {}).r) || 0;
    (w.secc.in || []).forEach(m=>sumar(m, 1));
    const main = (w.secc.main || []).filter(m=>!m.descanso);
    const totR = ent((w.res || {}).reps);
    if(['tabata', 'amreps', 'fgb'].includes(w.estilo) && totR) main.forEach(m=>sumar(m, 1, m.dist ? null : Math.round(totR / main.length)));   // total repartido en partes iguales
    else main.forEach(m=>{ if(w.estilo==='esquema') sumar(m, 1, m.dist ? null : esq); else if(w.estilo==='muerte') sumar(m, 1, R*(R+1)/2); else sumar(m, v); });
    (w.secc.out || []).forEach(m=>sumar(m, 1));
    metrosAnotados(w).forEach(([mov, mt])=>{ const o = out[mov] = out[mov] || {reps:0, m:0, cal:0}; o.m += mt; });
    if(w.estilo==='intervalos' && medidaRonda(w)!=='m'){ const m = main.find(x=>x.mov), t = ((w.res || {}).pr || []).map(num).filter(x=>x!=null).reduce((a, b)=>a + b, 0);
      if(m && t){ const o = out[m.mov] = out[m.mov] || {reps:0, m:0, cal:0}; o[medidaRonda(w)==='cal' ? 'cal' : 'reps'] += t; } }
  }
  Object.keys(out).forEach(k=>{ const o = out[k]; if(!o.reps && !o.m && !o.cal) delete out[k]; });
  return out;
}
const UMBRALES = {
  reps:[100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000],
  m:[1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000, 5000000],
  cal:[100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000],
};
const ordenCrono = ()=>S.sesiones.slice().sort((a, b)=>a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : (a.creado || 0) - (b.creado || 0));
const fmtCantidad = (u, v)=>u==='m' ? verDist(v) : fmtNum(v) + (u==='cal' ? ' calorías' : ' repeticiones');
function logrosSesion(s){
  const mio = contribuciones(s), ids = Object.keys(mio); if(!ids.length) return [];
  const tot = {}; ids.forEach(id=>tot[id] = {reps:0, m:0, cal:0});
  for(const x of ordenCrono()){ const c = contribuciones(x); ids.forEach(id=>{ if(c[id]){ tot[id].reps += c[id].reps; tot[id].m += c[id].m; tot[id].cal += c[id].cal; } }); if(x.id===s.id) break; }
  return ids.map(id=>{
    const u = mio[id].m ? 'm' : mio[id].cal ? 'cal' : 'reps', total = tot[id][u], delta = mio[id][u], U = UMBRALES[u];
    const pasados = U.filter(x=>x <= total).length, ant = pasados ? U[pasados-1] : 0, sig = U[pasados] || null;
    const cumplida = pasados && total - delta < ant;
    return {id, n:nomMov(movDe(id) || {n:id}), u, total, delta, nivel:pasados + 1, sig, pct:sig ? Math.round((total - ant) / (sig - ant) * 100) : 100, cumplida, meta:cumplida ? ant : sig};
  });
}
