/* #TACFITNSCE — Importar entrenamientos de Garmin, Strava y otros relojes (24-oct-2026, pedido del usuario). Archivos .FIT (Garmin y la
   mayoría de los relojes), .GPX y .TCX, también dentro de un .zip (el «Exportar original» de Garmin Connect o el archivo completo de Strava)
   o comprimidos .gz (las actividades del archivo de Strava). Todo se lee en el teléfono, sin internet ni cuenta: no se conecta con Garmin ni
   con Strava. Cada actividad pasa a ser un entrenamiento de un movimiento (carrera, trote en cinta, trail, bicicleta, nado, remo, caminata,
   elíptica) con su distancia, tiempo, FC media y desnivel; las de fuerza u otras sin distancia quedan como «Otro» con su duración. No se
   repite lo ya importado (`s.importado.inicio`). */

/* ---------- FIT (protocolo de Garmin) ---------- */
const FIT_EPOCA = 631065600;   // 31-12-1989 en segundos Unix
function leerFIT(buf){
  const dv = new DataView(buf), hs = dv.getUint8(0);
  if(hs < 12 || String.fromCharCode(dv.getUint8(8), dv.getUint8(9), dv.getUint8(10), dv.getUint8(11))!=='.FIT') throw new Error('no es FIT');
  const fin = Math.min(buf.byteLength, hs + dv.getUint32(4, true)), defs = {}, ses = [], laps = []; let p = hs, fid = null;
  const TAM = {0:1, 1:1, 2:1, 3:2, 4:2, 5:4, 6:4, 7:1, 8:4, 9:8, 10:1, 11:2, 12:4, 13:1, 14:8, 15:8, 16:8};
  const valor = (q, c, le)=>{ const t = c.tipo & 0x1F, n = TAM[t] || 1; if(c.tam < n) return null;
    let v; switch(t){ case 0: case 2: case 10: case 13: v = dv.getUint8(q); return (t===10 ? v===0 : v===0xFF) ? null : v;
      case 1: v = dv.getInt8(q); return v===0x7F ? null : v; case 3: v = dv.getInt16(q, le); return v===0x7FFF ? null : v;
      case 4: case 11: v = dv.getUint16(q, le); return (t===11 ? v===0 : v===0xFFFF) ? null : v; case 5: v = dv.getInt32(q, le); return v===0x7FFFFFFF ? null : v;
      case 6: case 12: v = dv.getUint32(q, le); return (t===12 ? v===0 : v===0xFFFFFFFF) ? null : v; case 8: return dv.getFloat32(q, le);
      case 7: { let s = ''; for(let i = 0; i < c.tam; i++){ const k = dv.getUint8(q + i); if(!k) break; s += String.fromCharCode(k); } return s; }
      default: return null; } };
  const datos = (d, q)=>{ const v = {}; d.campos.forEach(c=>{ v[c.num] = valor(q, c, d.le); q += c.tam; }); q += d.dev;
    if(d.glob===18) ses.push(v); else if(d.glob===19) laps.push(v); else if(d.glob===0 && !fid) fid = v; return q; };
  while(p < fin - 1){
    const h = dv.getUint8(p++);
    if(h & 0x80){ const d = defs[(h >> 5) & 3]; if(!d) break; p = datos(d, p); continue; }
    const loc = h & 0x0F;
    if(h & 0x40){ p++; const le = dv.getUint8(p++)===0, glob = dv.getUint16(p, le); p += 2; const n = dv.getUint8(p++), campos = [];
      for(let i = 0; i < n; i++){ campos.push({num:dv.getUint8(p), tam:dv.getUint8(p + 1), tipo:dv.getUint8(p + 2)}); p += 3; }
      let dev = 0; if(h & 0x20){ const nd = dv.getUint8(p++); for(let j = 0; j < nd; j++){ dev += dv.getUint8(p + 1); p += 3; } }
      defs[loc] = {glob, le, campos, dev}; }
    else { const d = defs[loc]; if(!d) break; p = datos(d, p); }
  }
  const S0 = ses.length ? ses : laps.length ? [laps.reduce((a, l)=>({2:a[2] || l[2], 5:a[5] ?? l[5], 7:(a[7] || 0) + (l[7] || 0), 8:(a[8] || 0) + (l[8] || 0), 9:(a[9] || 0) + (l[9] || 0), 11:(a[11] || 0) + (l[11] || 0)}), {})] : [];
  return S0.filter(s=>s[2]).map(s=>({inicio:new Date((s[2] + FIT_EPOCA) * 1000), deporte:fitDeporte(s[5], s[6]), seg:Math.round((s[8] || s[7] || 0) / 1000),
    m:s[9]!=null ? s[9] / 100 : null, kcal:s[11] || null, fc:s[16] || null, fcMax:s[17] || null, subida:s[22] || null, fuente:'Garmin (FIT)'}));
}
function fitDeporte(sp, sub){
  if(sp===1) return sub===1 ? 'carrera_cinta' : sub===3 ? 'trail' : 'carrera';
  if(sp===2) return sub===6 ? 'bici_estatica' : 'bici';
  if(sp===5) return sub===18 ? 'nado_abierto' : 'nado';
  if(sp===11) return 'caminata'; if(sp===17 || sp===16) return 'caminata'; if(sp===15) return 'remo';
  if(sp===4 && sub===15) return 'eliptica'; if(sp===4 && sub===14) return 'remo';
  return null;   // fuerza, deportes y otros: «Otro» con su duración
}
/* ---------- GPX y TCX (texto XML) ---------- */
const distGeo = (a, b)=>{ const R = 6371000, r = x=>x * Math.PI / 180, dl = r(b.lat - a.lat), dn = r(b.lon - a.lon), h = Math.sin(dl / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
function subidaDe(eles){ let s = 0, base = null; eles.forEach(e=>{ if(e==null || isNaN(e)) return; if(base==null) base = e; else if(e - base > 2){ s += e - base; base = e; } else if(e < base) base = e; }); return Math.round(s); }
const TIPO_TXT = t=>{ t = String(t || '').toLowerCase();
  return /trail/.test(t) ? 'trail' : /treadmill|cinta/.test(t) ? 'carrera_cinta' : /run|carrera|correr|^9$/.test(t) ? 'carrera' : /bik|cicl|ride|^1$/.test(t) ? 'bici' : /swim|nat|nado/.test(t) ? 'nado'
    : /row|remo/.test(t) ? 'remo' : /walk|hik|camin|senderismo|^10$|^11$/.test(t) ? 'caminata' : /ellip/.test(t) ? 'eliptica' : null; };
function leerGPX(txt){
  const x = new DOMParser().parseFromString(txt, 'application/xml'), pts = [...x.getElementsByTagName('trkpt')];
  if(!pts.length) throw new Error('GPX sin recorrido');
  const P = pts.map(e=>({lat:+e.getAttribute('lat'), lon:+e.getAttribute('lon'), ele:+((e.getElementsByTagName('ele')[0] || {}).textContent), t:Date.parse((e.getElementsByTagName('time')[0] || {}).textContent || ''),
    hr:+(([...e.getElementsByTagName('*')].find(n=>/(^|:)hr$/i.test(n.nodeName)) || {}).textContent || NaN)}));
  let m = 0; for(let i = 1; i < P.length; i++) m += distGeo(P[i - 1], P[i]);
  const ts = P.map(p=>p.t).filter(t=>!isNaN(t)), hrs = P.map(p=>p.hr).filter(h=>h > 0), tipo = (x.getElementsByTagName('type')[0] || {}).textContent;
  return [{inicio:new Date(ts[0] || Date.now()), deporte:TIPO_TXT(tipo) || 'carrera', seg:ts.length > 1 ? Math.round((ts[ts.length - 1] - ts[0]) / 1000) : 0, m:Math.round(m),
    fc:hrs.length ? Math.round(hrs.reduce((a, b)=>a + b, 0) / hrs.length) : null, fcMax:hrs.length ? Math.max(...hrs) : null, subida:subidaDe(P.map(p=>p.ele)),
    nombre:((x.getElementsByTagName('name')[0] || {}).textContent || '').trim(), fuente:'GPX'}];
}
function leerTCX(txt){
  const x = new DOMParser().parseFromString(txt, 'application/xml'), acts = [...x.getElementsByTagName('Activity')]; if(!acts.length) throw new Error('TCX sin actividad');
  const num = (e, tag)=>{ const n = e.getElementsByTagName(tag)[0]; return n ? +n.textContent : null; };
  return acts.map(a=>{ const laps = [...a.getElementsByTagName('Lap')], ini = Date.parse((a.getElementsByTagName('Id')[0] || {}).textContent || (laps[0] && laps[0].getAttribute('StartTime')) || '');
    const seg = laps.reduce((s, l)=>s + (num(l, 'TotalTimeSeconds') || 0), 0), m = laps.reduce((s, l)=>s + ([...l.children].filter(c=>c.nodeName==='DistanceMeters').map(c=>+c.textContent)[0] || 0), 0);
    const kcal = laps.reduce((s, l)=>s + (num(l, 'Calories') || 0), 0), hrs = laps.map(l=>{ const h = l.getElementsByTagName('AverageHeartRateBpm')[0]; return h ? +h.textContent.trim() : null; }).filter(Boolean);
    const fcm = laps.map(l=>{ const h = l.getElementsByTagName('MaximumHeartRateBpm')[0]; return h ? +h.textContent.trim() : null; }).filter(Boolean);
    const eles = [...a.getElementsByTagName('AltitudeMeters')].map(e=>+e.textContent);
    return {inicio:new Date(isNaN(ini) ? Date.now() : ini), deporte:TIPO_TXT(a.getAttribute('Sport')), seg:Math.round(seg), m:Math.round(m), kcal:kcal || null,
      fc:hrs.length ? Math.round(hrs.reduce((p, q)=>p + q, 0) / hrs.length) : null, fcMax:fcm.length ? Math.max(...fcm) : null, subida:subidaDe(eles), fuente:'TCX'}; });
}
/* ---------- .zip y .gz ---------- */
async function inflar(datos, formato){ const s = new Blob([datos]).stream().pipeThrough(new DecompressionStream(formato)); return await new Response(s).arrayBuffer(); }
async function abrirZip(buf){
  const dv = new DataView(buf), out = []; let e = buf.byteLength - 22; while(e >= 0 && dv.getUint32(e, true)!==0x06054b50) e--; if(e < 0) throw new Error('zip dañado');
  let p = dv.getUint32(e + 16, true); const n = dv.getUint16(e + 10, true);
  for(let i = 0; i < n; i++){ if(dv.getUint32(p, true)!==0x02014b50) break;
    const met = dv.getUint16(p + 10, true), tc = dv.getUint32(p + 20, true), ln = dv.getUint16(p + 28, true), lx = dv.getUint16(p + 30, true), lc = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
    const nombre = new TextDecoder().decode(new Uint8Array(buf, p + 46, ln)); p += 46 + ln + lx + lc;
    if(!/\.(fit|gpx|tcx)(\.gz)?$/i.test(nombre)) continue;
    const ini = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true), crudo = buf.slice(ini, ini + tc);
    out.push({nombre:nombre.split('/').pop(), buf:met===8 ? await inflar(crudo, 'deflate-raw') : crudo}); }
  return out;
}
/* Lee un archivo (o los de un .zip) y entrega las actividades */
async function leerArchivoEntreno(nombre, buf){
  if(/\.zip$/i.test(nombre)){ const fs = await abrirZip(buf), out = []; for(const f of fs){ try{ out.push(...await leerArchivoEntreno(f.nombre, f.buf)); }catch(e){} } return out; }
  if(/\.gz$/i.test(nombre)) return leerArchivoEntreno(nombre.replace(/\.gz$/i, ''), await inflar(buf, 'gzip'));
  const acts = /\.fit$/i.test(nombre) ? leerFIT(buf) : /\.gpx$/i.test(nombre) ? leerGPX(new TextDecoder().decode(buf)) : /\.tcx$/i.test(nombre) ? leerTCX(new TextDecoder().decode(buf).trim()) : null;
  if(!acts) throw new Error('tipo');
  return acts.map(a=>Object.assign(a, {archivo:nombre}));
}
/* ---------- Pasar una actividad al diario ---------- */
const isoLocal = d=>d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const yaImportada = a=>S.sesiones.some(s=>s.importado && Math.abs(Date.parse(s.importado.inicio) - a.inicio.getTime()) < 60000);
function nombreDeporte(a){ return a.deporte ? (movDe(a.deporte) || {}).n : 'Otro entrenamiento'; }
function actividadASesion(a){
  const fecha = isoLocal(a.inicio), imp = {fuente:a.fuente, archivo:a.archivo, inicio:a.inicio.toISOString(), m:a.m, seg:a.seg, subida:a.subida, fcMax:a.fcMax, kcal:a.kcal};
  const extra = [a.subida ? 'desnivel +' + a.subida + ' m' : '', a.fcMax ? 'FC máx ' + a.fcMax : ''].filter(Boolean).join(' · '), nota = 'Importado de ' + a.fuente + (extra ? ' · ' + extra : '');
  let s;
  if(a.deporte && a.m > 50){
    const w = nuevoW({}); w.modo = 'uno'; w.uno = unoNuevo(movDe(a.deporte), {dist:String(Math.round(a.m / 10) / 100).replace('.', ','), distU:'km'});
    w.uno.tiempo = a.seg ? PSF.verTiempo(a.seg) : ''; w.fecha = fecha; w.titulo = (a.nombre || '').trim(); w.notas = nota; w.rpe = '';
    s = aSesion(w);
  } else s = {fecha, titulo:a.nombre || nombreDeporte(a), tipo:'otro', txt:a.seg ? PSF.verTiempo(a.seg) : '', recs:[], notas:nota, w:null};
  s.id = uid(); s.creado = a.inicio.getTime(); s.dur = a.seg ? Math.max(1, Math.round(a.seg / 60)) : null; s.fc = a.fc || null; s.importado = imp;
  return s;
}
function dialogoImportar(){
  let acts = [];
  const pintarLista = d=>{ const L = $('#imLista', d);
    if(!acts.length){ L.innerHTML = ''; $('#imOk', d).hidden = true; return; }
    acts.sort((a, b)=>b.inicio - a.inicio);
    L.innerHTML = `<div class="entre"><b>${acts.length} actividad${acts.length===1 ? '' : 'es'}</b><button class="link" id="imTodas">Marcar todas</button></div><ul class="lista im-lista">${acts.slice(0, 400).map((a, i)=>{ const ya = yaImportada(a);
      return `<li class="item"><label class="check" style="margin:0"><input type="checkbox" data-im="${i}" ${ya ? 'disabled' : 'checked'}><span><b>${esc(a.nombre || nombreDeporte(a))}</b> · ${verFecha(isoLocal(a.inicio))}<br><span class="suave chico num">${a.m ? fmtMetros(a.m >= 1000 ? Math.round(a.m / 10) * 10 : Math.round(a.m)) : ''}${a.seg ? ' · ' + PSF.verTiempo(a.seg) : ''}${a.fc ? ' · FC ' + a.fc : ''}${a.subida ? ' · desnivel +' + a.subida + ' m' : ''}${ya ? ' · ya importada' : ''}</span></span></label></li>`; }).join('')}</ul>`;
    $('#imOk', d).hidden = false;
    $('#imTodas', d).onclick = ()=>$$('[data-im]:not([disabled])', d).forEach(c=>c.checked = true); };
  dialogo(`<div class="cab"><h2>⌚ Importar de Garmin o Strava</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <p class="suave chico">Elige uno o varios archivos <b>.FIT</b>, <b>.GPX</b> o <b>.TCX</b> (o el <b>.zip</b> que te entregan). Se leen en este teléfono: no hace falta tu clave de Garmin ni de Strava.</p>
    <details class="tc-como"><summary>¿Cómo saco el archivo?</summary><ol>
      <li><b>Garmin Connect</b> (en el computador o el navegador del teléfono, connect.garmin.com): abre la actividad → ⚙ → «Exportar original» (un .zip con el .fit) o «Exportar a GPX».</li>
      <li><b>Reloj Garmin por cable</b>: en la carpeta GARMIN/Activity están los .fit de cada actividad.</li>
      <li><b>Strava</b> (en strava.com): abre tu actividad → ⋯ → «Exportar GPX» o «Exportar original».</li>
      <li><b>Todo tu Strava de una vez</b>: Ajustes → Mi cuenta → «Descargar o eliminar tu cuenta» → pide tu archivo; llega por correo un .zip con todas tus actividades.</li></ol></details>
    <div class="btns"><button class="btn prim ancho" id="imElegir">📂 Elegir archivos</button></div><p class="chico" id="imEst"></p>
    <div id="imLista"></div><div class="btns"><button class="btn prim ancho" id="imOk" hidden>Importar las marcadas</button></div>`, d=>{
    $('#imElegir', d).onclick = ()=>{ const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true;   // sin filtro: el iPhone bloquea extensiones que no conoce
      inp.onchange = async ()=>{ const fs = [...inp.files]; if(!fs.length) return; let malos = 0; $('#imEst', d).textContent = 'Leyendo ' + fs.length + ' archivo' + (fs.length===1 ? '' : 's') + '…';
        for(const f of fs){ try{ acts.push(...await leerArchivoEntreno(f.name, await f.arrayBuffer())); }catch(e){ malos++; } }
        $('#imEst', d).textContent = (malos ? (malos===1 ? '1 archivo no se pudo leer' : malos + ' archivos no se pudieron leer') + ' (¿no es .fit, .gpx, .tcx o .zip?). ' : '') + (acts.length ? 'Revisa la lista y toca «Importar».' : 'No encontré actividades.');
        pintarLista(d); }; inp.click(); };
    $('#imOk', d).onclick = ()=>{ const sel = $$('[data-im]:checked', d).map(c=>acts[+c.dataset.im]); if(!sel.length){ aviso('Marca al menos una'); return; }
      let n = 0; sel.forEach(a=>{ if(yaImportada(a)) return; S.sesiones.push(actividadASesion(a)); n++; });
      guardar(); d.close(); aviso('⌚ ' + n + ' entrenamiento' + (n===1 ? '' : 's') + ' importado' + (n===1 ? '' : 's')); ir(vistaActual==='reloj' ? 'hoy' : vistaActual); };
  });
}
