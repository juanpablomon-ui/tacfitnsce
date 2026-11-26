/* #NSCE — Apple Salud (23-nov-2026, revisión del mercado; maqueta aprobada por el usuario). Solo en la app del iPhone (complemento NSCESalud,
   ios_nsce/ios/App/App/Salud.swift); en la web no aparece nada.
   · Ajustes → «🩺 Apple Salud» (`htmlSaludAjustes`): conectar (pide permiso) y apagar. `pref('salud')==='1'` = conectada.
   · Al guardar, editar o borrar un entrenamiento se refleja en Salud (`guardarEnSalud`, `actualizarEnSalud`, `quitarDeSalud`).
   · Al abrir la app y al volver a ella (máximo una vez por hora) trae de Salud (`leerSalud`):
     VO₂máx → S.reloj[fecha].vo2 (como el anotado a mano; no pisa uno anotado ese día), pulso en reposo → S.medidas {fecha, fcr} (la preparación lo usa)
     y las horas de sueño de anoche → S.diario[hoy].suenoH; si «Sueño» de «¿Cómo llegas hoy?» está vacío, lo marca (7 h o más Bien, 6 a 7 Regular, menos Mal). */
const SALUD = ()=>esNativa() && window.Capacitor.Plugins && window.Capacitor.Plugins.NSCESalud;
const saludActiva = ()=>!!SALUD() && pref('salud')==='1';

function tipoSalud(s){
  if(s.tipo==='descanso') return 'movilidad';
  const U = s.w && s.w.uno, id = (U && U.mov) || '';
  if(/^(carrera|trote|sprint|trail|shuttle)/.test(id)) return 'carrera';
  if(/^caminata/.test(id)) return 'caminata';
  if(/^marcha/.test(id)) return 'marcha';
  if(/^(bici|spinning|bike)/.test(id)) return 'bici';
  if(/^nado/.test(id)) return 'nado';
  if(/^remo/.test(id)) return 'remo';
  if(/^eliptica/.test(id)) return 'eliptica';
  const g = grupoDe(s);
  if(g==='barra' || g==='maq') return 'fuerza';
  if(g==='core') return 'core';
  if(U) return g==='mono' ? 'carrera' : 'funcional';
  const st = s.w && s.w.estilo; return ['amrap', 'por_tiempo', 'emom', 'tabata', 'intervalos'].includes(st) ? 'hiit' : 'funcional';
}
/* Guardar, reemplazar y borrar (25-nov-2026, aprobado por el usuario; la 12 inventaba 45 min y no borraba): s.enSalud = enviado, s.saludF = firma de lo enviado,
   s.saludDup = app que ya lo tenía. Sin duración no se manda. Solo se toca lo que guardó NSCE (metadato con el id del entrenamiento). Se borra SOLO por acción de la persona
   (nunca por comparar listas: al cargar un respaldo se borraría todo); si Salud está bloqueada queda en pref saludPend. */
const FAM_SALUD = t=>['fuerza', 'funcional', 'hiit', 'core', 'cruzado'].includes(t) ? 'fuerza' : ['caminata', 'marcha'].includes(t) ? 'caminata' : t;
const minSalud = s=>ent(s.dur) || Math.round(metricas(s).min || 0) || 0;
function datosSalud(s){
  const min = minSalud(s); if(!min) return null;
  const fin = s.creado && iso(new Date(s.creado))===s.fecha ? s.creado : new Date(s.fecha + 'T12:00:00').getTime() + min * 60000;
  return {id:s.id, inicio:fin - min * 60000, fin, tipo:tipoSalud(s), kcal:Math.round(kcalDe(Object.assign({}, s, {dur:min})) || 0), metros:Math.round(Object.values(metricas(s).m || {}).reduce((a, b)=>a + (+b || 0), 0))};
}
const firmaSalud = D=>[D.tipo, D.inicio, D.fin, D.metros].join('|');
async function permisoSalud2(P){ if(pref('saludLee2')==='1') return; pref('saludLee2', '1'); try{ await P.autorizar(); }catch(e){} }   // quien conectó antes: falta el permiso de leer entrenamientos (no repetir los de otro reloj)
/* ¿Otra app ya registró lo mismo? Mismo tipo, a menos de 3 h y duración (±25 %) o distancia (±10 %) parecidas */
async function duplicadoSalud(P, D){
  if(!P.entrenos) return null; const H = 3 * 3600000; let L = []; try{ L = ((await P.entrenos({desde:D.inicio - H, hasta:D.fin + H})) || {}).lista || []; }catch(e){ return null; }
  const md = D.fin - D.inicio; return L.find(x=>!/^nsce$/i.test(String(x.app || '').trim()) && FAM_SALUD(x.tipo)===FAM_SALUD(D.tipo) && x.inicio < D.fin + H && x.fin > D.inicio - H
    && (D.metros && x.metros ? Math.abs(x.metros - D.metros) / D.metros <= .1 : Math.abs((x.fin - x.inicio) - md) / md <= .25)) || null;
}
async function guardarEnSalud(s0){
  const P = SALUD(), s = s0 && S.sesiones.find(y=>y.id===s0.id); if(!P || !saludActiva() || !s || s.enSalud || s.saludDup) return;
  const D = datosSalud(s); if(!D) return pedirDuracionSalud(s.id);
  await permisoSalud2(P); const d = await duplicadoSalud(P, D); const x = S.sesiones.find(y=>y.id===s.id); if(!x) return;
  if(d){ x.saludDup = d.app || 'Otra app'; guardar(); return aviso('🩺 ' + x.saludDup + ' ya registró este entrenamiento: no lo repetí en Apple Salud', 4500); }
  try{ const r = await P.guardarEntreno(D); const y = S.sesiones.find(z=>z.id===s.id);
    if(r && r.ok){ if(y){ y.enSalud = true; y.saludF = firmaSalud(D); guardar(); } else await borrarDeSalud(D.id); } }catch(e){ anotarError && anotarError(e, 'Apple Salud'); }
}
const pendSalud = ()=>{ try{ return JSON.parse(pref('saludPend') || '[]'); }catch(e){ return []; } };
async function borrarDeSalud(id, cerca){
  const P = SALUD(); if(!P || !P.borrarEntreno) return false;
  try{ const r = await P.borrarEntreno(cerca ? {id, cerca} : {id}); if(r && r.ok && !r.n && cerca) aviso('🩺 No lo encontré en Apple Salud: si sigue ahí, bórralo en la app Salud', 5000); borrarDeSalud.n = r ? r.n : null; if(!r || !r.ok) throw new Error('sin respuesta'); pref('saludPend', JSON.stringify(pendSalud().filter(x=>x!==id))); return true; }
  catch(e){ pref('saludPend', JSON.stringify([...new Set(pendSalud().concat(id))])); anotarError && anotarError(e, 'Apple Salud'); return false; }
}
/* Al editar: reemplaza si cambió la duración, el tipo, la fecha o la distancia */
async function actualizarEnSalud(id){
  const s = S.sesiones.find(x=>x.id===id); if(!s || !SALUD() || !saludActiva()) return;
  const D = datosSalud(s); if(!s.enSalud) return s.saludDup ? undefined : guardarEnSalud(s);
  if(D && s.saludF===firmaSalud(D)) return;
  if(!await borrarDeSalud(id, s.creado)) return aviso('🩺 No se pudo actualizar en Apple Salud', 3500);
  if(borrarDeSalud.n===0 && !s.saludF) return;   // no se encontró el de una versión anterior: mandar otro lo dejaría repetido
  const x = S.sesiones.find(y=>y.id===id); if(!x) return; delete x.enSalud; delete x.saludF; guardar(); return guardarEnSalud(x);
}
const avisoBorraSalud = s=>s.enSalud && SALUD() ? ' También se quitará de Apple Salud.' : '';
function quitarDeSalud(s){ if(s && s.enSalud && SALUD()) borrarDeSalud(s.id, s.creado).then(ok=>{ if(!ok) aviso('🩺 Se quitará de Apple Salud cuando esté disponible', 3500); }); }
/* Una vez: lo que mandaron las versiones anteriores (sin firma; la 1.4 de la compilación 12 ponía 45 min si no había duración) se corrige: con duración se reemplaza,
   sin duración se quita de Salud (cuando se anote, se manda); los que tienen la duración anotada se dejan tal cual (26-nov-2026: el usuario los hizo) */
async function repararSalud(){
  // 26-nov-2026: la 1.4 (13 y 14) confundía lo propio con lo de otra app y lo marcaba «ya lo tiene NSCE»: se le devuelve la marca para poder borrarlo
  if(pref('saludRepara2')!=='1'){ pref('saludRepara2', '1'); let c = false; S.sesiones.filter(x=>/^nsce$/i.test(String(x.saludDup || '').trim())).forEach(x=>{ delete x.saludDup; x.enSalud = true; x.saludF = 'antigua'; c = true; }); if(c) guardar(); }
  if(pref('saludRepara1')==='1' || !SALUD() || !saludActiva()) return; pref('saludRepara1', '1');
  for(const s of S.sesiones.filter(x=>x.enSalud && !x.saludF)){ const id = s.id;
    if(datosSalud(s)){ const x = S.sesiones.find(y=>y.id===id); if(x && ent(x.dur)){ x.saludF = 'antigua'; guardar(); } continue; }   // con duración anotada está bien: no se toca (no se arriesga repetirlo)
    if(await borrarDeSalud(id, s.creado)){ const x = S.sesiones.find(y=>y.id===id); if(x){ delete x.enSalud; guardar(); } } }
}
/* Lo que llegó después de otro reloj (Garmin sincroniza tarde): se quita el nuestro. Y se reintenta lo pendiente */
async function repasarSalud(){
  const P = SALUD(); if(!P || !saludActiva()) return; await repararSalud(); for(const id of pendSalud()) await borrarDeSalud(id);
  for(const s of S.sesiones.filter(x=>x.enSalud && x.fecha >= masDias(hoyISO(), -1))){ const D = datosSalud(s), d = D && await duplicadoSalud(P, D);
    if(d && await borrarDeSalud(s.id)){ const x = S.sesiones.find(y=>y.id===s.id); if(x){ delete x.enSalud; delete x.saludF; x.saludDup = d.app || 'Otra app'; guardar(); } } }
}
function pedirDuracionSalud(id){
  const d = $('#dialogo'), abrir = ()=>{ const s = S.sesiones.find(x=>x.id===id); if(!s || d.open || minSalud(s)) return;
    dialogo(`<div class="cab"><h2>🩺 Apple Salud</h2><button class="btn chico-btn" data-cerrar>✕</button></div><p>Anota la duración para enviarlo a Apple Salud.</p>
      <label>Minutos</label><input id="sdMin" type="number" inputmode="numeric" min="1" max="600" placeholder="Ej.: 45"><div class="btns"><button class="btn" data-cerrar>Ahora no</button><button class="btn prim" id="sdOk">Anotar duración</button></div>`, x=>{
      $('#sdOk', x).onclick = ()=>{ const m = ent($('#sdMin', x).value); if(!m || m > 600) return aviso('Anota los minutos (1 a 600)'); const y = S.sesiones.find(z=>z.id===id); if(y){ y.dur = m; guardar(); guardarEnSalud(y); } x.close(); VISTAS[vistaActual](); }; }); };
  if(d.open) d.addEventListener('close', ()=>setTimeout(abrir, 250), {once:true}); else abrir();
}
let ultLecturaSalud = 0;
async function leerSalud(forzar){
  const P = SALUD(); if(!P || !saludActiva() || (!forzar && Date.now() - ultLecturaSalud < 3600000)) return null;
  ultLecturaSalud = Date.now(); repasarSalud().catch(e=>anotarError(e, 'Apple Salud'));
  let r; try{ r = await P.leer(); }catch(e){ return null; }
  if(!r) return null; let cambio = false;
  if(r.vo2 && r.vo2.v >= 20 && r.vo2.v <= 90){ S.reloj = S.reloj || {}; const x = S.reloj[r.vo2.fecha];
    if(!x || x.salud){ const v = Math.round(r.vo2.v * 10) / 10; if(!x || x.vo2!==v){ S.reloj[r.vo2.fecha] = {vo2:v, salud:true}; cambio = true; } } }
  if(r.fcr && r.fcr.v >= 30 && r.fcr.v <= 120){ const v = Math.round(r.fcr.v), M = S.medidas = S.medidas || [], x = M.find(m=>m.fecha===r.fcr.fecha && m.fcr!=null);
    if(!x){ M.push({id:uid(), fecha:r.fcr.fecha, fcr:v, salud:true}); cambio = true; } else if(x.salud && x.fcr!==v){ x.fcr = v; cambio = true; } }
  if(r.sueno && r.sueno.h > 0 && r.sueno.fecha===hoyISO()){ const d = S.diario[hoyISO()] = S.diario[hoyISO()] || {};
    if(d.suenoH!==r.sueno.h){ d.suenoH = r.sueno.h; cambio = true; }
    if(d.sueno==null || d.sueno===''){ d.sueno = r.sueno.h >= 7 ? '2' : r.sueno.h >= 6 ? '1' : '0'; d.suenoAuto = true; cambio = true; } }
  if(cambio){ guardar(); if(vistaActual==='hoy'){ const y = window.scrollY; vHoy(); window.scrollTo(0, y); } }
  return r;
}
/* Línea en «¿Cómo llegas hoy?»: «🌙 Dormiste 6 h 10 min (Apple Salud) · pulso en reposo 52 · VO₂máx 51» */
function htmlSaludHoy(){
  if(!saludActiva()) return '';
  const d = S.diario[hoyISO()] || {}, h = d.suenoH, fc = (S.medidas || []).filter(m=>m.fcr && m.salud).sort((a, b)=>a.fecha < b.fecha ? 1 : -1)[0];
  const vo = Object.entries(S.reloj || {}).filter(([, x])=>x.salud && x.vo2).sort((a, b)=>a[0] < b[0] ? 1 : -1)[0];
  const P = [h ? `🌙 Dormiste ${Math.floor(h)} h${Math.round((h % 1) * 60) ? ' ' + Math.round((h % 1) * 60) + ' min' : ''}${d.suenoAuto ? ' → Sueño marcado solo' : ''}` : '',
    fc && fc.fecha >= masDias(hoyISO(), -2) ? 'pulso en reposo ' + fc.fcr : '', vo ? 'VO₂máx ' + fmtNum(vo[1].vo2) : ''].filter(Boolean);
  return P.length ? `<div class="chico salud-hoy">${P.join(' · ')} <span class="suave">(Apple Salud)</span></div>` : '';
}
function htmlSaludAjustes(){
  if(!SALUD()) return '';
  const on = saludActiva();
  return `<div class="tarjeta"><p class="chico">${on ? '✓ <b>Conectada.</b> ' : ''}Guarda tus entrenamientos en Apple Salud y trae de tu reloj (Garmin, Apple Watch u otro que escriba en Salud):
    <b>VO₂máx</b>, <b>pulso en reposo</b> y <b>horas de sueño</b>. Se usan en tu preparación de hoy y en tu edad física. Si borras o editas uno en NSCE, también cambia en Salud; lo de otras apps no se toca ni se repite. Nada sale de tu teléfono.</p>
    ${on ? `<div class="btns"><button class="btn" id="slLeer">↻ Traer ahora</button><button class="btn" id="slApagar">Desconectar</button></div>
      <p class="nota">Para cambiar qué datos comparte: app Salud → tu foto → Apps → NSCE.</p>`
      : '<button class="btn prim ancho" id="slConectar">🩺 Conectar con Apple Salud</button><p class="nota">👉 Ahora: toca el botón y en la pantalla de Apple marca «Activar todo».</p>'}</div>`;
}
function enlazarSaludAjustes(alListo){
  const re = alListo || (()=>{});
  if($('#slConectar')) $('#slConectar').onclick = async ()=>{ try{ const r = await SALUD().autorizar(); if(!r || !r.ok) return aviso('No se pudo conectar con Apple Salud');
    pref('salud', '1'); pref('saludLee2', '1'); await leerSalud(true); aviso('🩺 Conectada con Apple Salud'); re(); }catch(e){ aviso('No se pudo conectar con Apple Salud'); } };
  if($('#slLeer')) $('#slLeer').onclick = async ()=>{ const r = await leerSalud(true); aviso(r && (r.vo2 || r.fcr || r.sueno) ? '🩺 Datos de Apple Salud al día' : 'Apple Salud no tiene datos nuevos'); re(); };
  if($('#slApagar')) $('#slApagar').onclick = ()=>{ pref('salud', '0'); aviso('Apple Salud desconectada'); re(); };
}
if(typeof document!=='undefined'){
  setTimeout(()=>leerSalud(), 2500);
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') leerSalud(); });
}
