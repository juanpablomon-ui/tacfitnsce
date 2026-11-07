/* #NSCE — Amigos y desafíos (3-nov-2026; maqueta aprobada por el usuario: «que sirva para comunicarse con otros o ver a otros»).
   Con la cuenta en la nube: cada uno tiene un código (A-XXXXXX, tabla perfiles) para que un amigo lo agregue (función agregar_amigo: la amistad
   queda en los dos sentidos). Se publican SOLO entrenamientos y logros (tipo, resultado, minutos, km, récords, insignias y ascensos de los últimos
   21 días; nunca medidas, salud, fotos ni Mi ciclo) y solo si hay al menos un amigo. Los amigos los ven en Diario → Amigos y les dan «💪»
   (aplausos, sin texto libre). El desafío de la semana entre amigos cambia cada lunes (entrenamientos, km, minutos o días) y se calcula en el
   teléfono con las publicaciones. Caché en NC.am. Esquema en nube/esquema.sql («Amigos y desafíos»). */
'use strict';
const DESAF_AM = [{k:'ent', n:'entrenamientos', meta:4}, {k:'km', n:'kilómetros', meta:20}, {k:'min', n:'minutos', meta:240}, {k:'dias', n:'días entrenados', meta:4}];
const desafioAmigos = ()=>{ const lun = iso(inicioSemana()); return Object.assign({lun, fin:masDias(lun, 6)}, DESAF_AM[Math.floor(diasEntre('2026-01-05', lun) / 7) % DESAF_AM.length]); };
const codigoAmigo = ()=>{ const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = 'A-'; for(let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)]; return s; };
const iniciales = t=>String(t || '?').trim().split(/\s+/).slice(0, 2).map(x=>x[0] || '').join('').toUpperCase() || '?';
/* Mi perfil público (nombre y código): se crea la primera vez y se actualiza si cambia el nombre */
async function nubeMiPerfil(){
  if(!conectado()) return null;
  const nombre = (S.perfil.nombre || '').trim().slice(0, 60) || 'Atleta';
  if(NC.perfil && NC.perfil.uid===SES.uid && NC.perfil.nombre===nombre) return NC.perfil;
  const [p] = await api('perfiles?usuario=eq.' + SES.uid) || [];
  if(p){ if(p.nombre!==nombre) await api('perfiles?usuario=eq.' + SES.uid, {method:'PATCH', body:{nombre, actualizado:new Date().toISOString()}});
    NC.perfil = {uid:SES.uid, codigo:p.codigo, nombre}; guardarNC(); return NC.perfil; }
  for(let i = 0; i < 4; i++){ const codigo = codigoAmigo();
    try{ await api('perfiles', {method:'POST', body:{usuario:SES.uid, nombre, codigo}}); NC.perfil = {uid:SES.uid, codigo, nombre}; guardarNC(); return NC.perfil; }
    catch(e){ if(!/duplicate|unique/i.test(e.message)) throw e; } }
  throw new Error('No se pudo crear tu código');
}
/* Nombres de los ejercicios de un entrenamiento, para la tarjeta del muro de amigos */
function ejerciciosDe(s){
  const w = s.w; if(!w) return [];
  if(w.uno) return [String((movDe(w.uno.mov) || {n:w.uno.n || ''}).n).split(' (')[0]].filter(Boolean);
  const sc = w.secc || {}; return (sc.main || []).filter(m=>m.mov || m.n).slice(0, 6).map(m=>{ const mv = movDe(m.mov) || {n:m.n || ''}, cant = m.reps || m.dist && (m.dist + (m.distU || 'm')) || m.cal && (m.cal + ' cal') || '';
    return (cant ? cant + ' ' : '') + String(mv.n).split(' (')[0]; });
}
/* Plantilla con que se ve la foto en el muro de amigos: la que eligió para compartir (el sticker, que es sin fondo, pasa a «Clásico») */
const plantillaMuroAmigos = s=>{ const p = plantillaPorDefecto(s); return p==='sticker' ? 'clasico' : p; };
/* Achica una foto del teléfono a JPEG (lado mayor `lado`) como data URL */
function fotoDataUrl(blob, lado, cal){ return new Promise((ok, mal)=>{ const u = URL.createObjectURL(blob), img = new Image();
  img.onload = ()=>{ const k = Math.min(1, lado / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); ok(c.toDataURL('image/jpeg', cal)); };
  img.onerror = e=>{ URL.revokeObjectURL(u); mal(e); }; img.src = u; }); }
/* Sube las fotos de las publicaciones que cambiaron (las de una publicación se reemplazan juntas) */
async function subirFotosAmigos(L){
  NC.fotosAm = NC.fotosAm || {};
  for(const x of L.filter(x=>x.datos.k==='ses')){ const firma = x.datos.ff || '', s = S.sesiones.find(z=>'s:' + z.id===x.id), pl = s && firma ? plantillaMuroAmigos(s) : '';
    const clave = firma ? firma + '|' + pl + '|' + (x.datos.r || '') + '|' + (x.datos.rec || []).length + '|' + (pref('logrosComp')!=='0') : ''; if((NC.fotosAm[x.id] || '')===clave) continue;
    await api(`fotos_pub?usuario=eq.${SES.uid}&pub=eq.${encodeURIComponent(x.id)}`, {method:'DELETE'});
    // una foto por envío y livianas (7-nov-2026: todas juntas y grandes daban «Load failed» en Safari); si una falla, se reintenta en la próxima sincronización
    const ids = firma ? firma.split(',') : []; let todas = true;
    for(let n = 0; n < ids.length; n++){ try{
      // la primera se ve como al exportarla a redes (7-nov-2026, pedido del usuario): tu plantilla con el resultado y los datos encima, en 4:5
      let b = n===0 && s ? await lienzoCompartir(s, {plantilla:pl, fmt:'post', foto:ids[0], fondo:null, logros:pref('logrosComp')!=='0'}).catch(()=>null) : null;
      b = b || await fotoLeer(ids[n]); if(!b) continue;
      await upsert('fotos_pub', [{usuario:SES.uid, pub:x.id, n, chica:await fotoDataUrl(b, n===0 ? 600 : 360, 0.66), grande:await fotoDataUrl(b, 1080, 0.7)}], 'usuario,pub,n'); }
      catch(e){ todas = false; anotarError(e, 'foto para amigos'); } }
    if(todas){ NC.fotosAm[x.id] = clave; guardarNC(); } }
  Object.keys(NC.fotosAm).forEach(k=>{ if(!L.some(x=>x.id===k)) delete NC.fotosAm[k]; });
}
/* Lo que ven mis amigos: entrenamientos (con récords), insignias y ascensos de los últimos 21 días */
function misPublicaciones(){
  const desde = hace(90), hoy = hoyISO(), out = [];   // el muro completo de un amigo muestra 3 meses (7-nov-2026); las fotos, 3 semanas
  S.sesiones.filter(s=>s.fecha >= desde && s.fecha <= hoy).forEach(s=>{ const m = metricas(s);
    const conFotos = pref('amFotos')!=='no', fotosOk = conFotos && s.fecha >= hace(21), w = s.w ? JSON.parse(JSON.stringify(s.w, (k, v)=>['fotosExist', 'fotosBorr', 'tmp', 'busq', 'buscar', 'qInicio', 'res'].includes(k) ? undefined : v)) : null;
    out.push({id:'s:' + s.id, fecha:s.fecha, datos:{k:'ses', t:s.titulo || etiquetaTipo(s), ti:etiquetaTipo(s), r:s.tipo==='descanso' ? '' : resCorto(s) || '', min:Math.round(m.min || 0),
      km:Math.round((m.km || 0) * 10) / 10, g:grupoDe(s), d:s.tipo==='descanso', rec:esRecord(s).slice(0, 3).map(rc=>rc.nombre.split(' (')[0] + ' ' + rc.txt),
      ej:ejerciciosDe(s), dur:ent(s.dur) || null, rpe:ent(s.rpe) || null, w, rx:!!s.rx, notas:conFotos ? String(s.notas || '').slice(0, 600) : '', nf:fotosOk ? Math.min(4, (s.fotos || []).length) : 0,
      ff:fotosOk ? (s.fotos || []).slice(0, 4).join(',') : ''}}); });
  const ins = insigniasGanadas(estadoInsignias());
  Object.entries(S.insFechas || {}).filter(([, f])=>f >= desde && f <= hoy).forEach(([k, f])=>{ const x = ins.find(i=>i.id===k);
    if(x) out.push({id:'i:' + k, fecha:f, datos:{k:'ins', t:x.n + ' ' + ROMANOS[x.nivel]}}); });
  (S.rangoHist || []).filter(r=>!r.inicial && r.fecha >= desde && r.fecha <= hoy).forEach(r=>out.push({id:'r:' + r.fecha + ':' + r.rango, fecha:r.fecha, datos:{k:'rango', t:r.rango}}));
  // sin repetidos (dos ascensos iguales el mismo día o un entrenamiento duplicado hacían fallar el envío: «cannot affect row a second time», 7-nov-2026)
  return [...new Map(out.map(x=>[x.id, x])).values()];
}
/* Publica (solo si tengo amigos y solo si cambió algo) y borra lo que ya no está o es antiguo */
async function nubePublicar(){
  if(!conectado()) return;
  await nubeMiPerfil();
  const am = await api('amistades?usuario=eq.' + SES.uid) || []; NC.am = Object.assign(NC.am || {}, {n:am.length}); guardarNC();
  if(!am.length) return;
  const L = misPublicaciones(), firma = JSON.stringify(L); if(NC.pubFirma===firma) return;
  for(let i = 0; i < L.length; i += 25) await upsert('publicaciones', L.slice(i, i + 25).map(x=>Object.assign({usuario:SES.uid}, x)), 'usuario,id');
  try{ await subirFotosAmigos(L); }catch(e){ anotarError(e, 'fotos para amigos'); }
  const ya = await api(`publicaciones?usuario=eq.${SES.uid}&fecha=gte.${hace(90)}`) || [], ids = new Set(L.map(x=>x.id));
  for(const p of ya.filter(p=>!ids.has(p.id))) await api(`publicaciones?usuario=eq.${SES.uid}&id=eq.${encodeURIComponent(p.id)}`, {method:'DELETE'});
  await api(`publicaciones?usuario=eq.${SES.uid}&fecha=lt.${hace(90)}`, {method:'DELETE'});
  NC.pubFirma = firma; guardarNC();
}
/* Trae amigos, sus publicaciones de 21 días y los aplausos */
async function cargarAmigos(){
  if(!conectado()) return null;
  const am = await api('amistades?usuario=eq.' + SES.uid) || [], ids = am.map(a=>a.amigo);
  if(!ids.length){ NC.am = {t:Date.now(), n:0, amigos:[], pubs:[], apl:{}}; guardarNC(); return NC.am; }
  const lista = '(' + ids.join(',') + ')';
  const [per, pubs, apl, fot] = await Promise.all([api('perfiles?usuario=in.' + lista), api(`publicaciones?usuario=in.${lista}&fecha=gte.${hace(21)}&order=fecha.desc,creada.desc&limit=80`), api('aplausos?autor=in.' + lista),
    api(`fotos_pub?select=usuario,pub,n,chica&usuario=in.${lista}&n=eq.0`).catch(()=>[])]);
  FOTOS_AM = {}; (fot || []).forEach(x=>FOTOS_AM[x.usuario + '|' + x.pub] = x.chica);
  const A = {}; (apl || []).forEach(a=>{ const k = a.autor + '|' + a.pub; A[k] = A[k] || {n:0, mio:false}; A[k].n++; if(a.de===SES.uid) A[k].mio = true; });
  NC.am = {t:Date.now(), n:ids.length, amigos:(per || []).map(p=>({usuario:p.usuario, nombre:p.nombre || 'Atleta', codigo:p.codigo})), pubs:pubs || [], apl:A}; guardarNC();
  return NC.am;
}
let FOTOS_AM = {}, MURO_AM = {};   // primera foto (chica) de cada publicación de amigos; no va al caché del teléfono
const nombreAmigo = u=>((NC.am && NC.am.amigos || []).find(a=>a.usuario===u) || {nombre:'Atleta'}).nombre;
/* Tabla del desafío: yo (con mis datos del teléfono) y mis amigos (con sus publicaciones de la semana) */
function tablaDesafio(){
  const D = desafioAmigos(), val = ses=>{ const s = ses.filter(x=>!x.d);
    return D.k==='ent' ? s.length : D.k==='dias' ? new Set(s.map(x=>x.f)).size : D.k==='km' ? Math.round(s.reduce((a, x)=>a + (x.km || 0), 0) * 10) / 10 : s.reduce((a, x)=>a + (x.min || 0), 0); };
  const mias = S.sesiones.filter(s=>s.fecha >= D.lun && s.fecha <= D.fin).map(s=>{ const m = metricas(s); return {f:s.fecha, d:s.tipo==='descanso', km:m.km || 0, min:m.min || 0}; });
  const filas = [{yo:true, nombre:'Tú', v:val(mias)}].concat((NC.am && NC.am.amigos || []).map(a=>({usuario:a.usuario, nombre:a.nombre,
    v:val((NC.am.pubs || []).filter(p=>p.usuario===a.usuario && p.datos.k==='ses' && p.fecha >= D.lun && p.fecha <= D.fin).map(p=>({f:p.fecha, d:p.datos.d, km:p.datos.km, min:p.datos.min})))})));
  return {D, filas:filas.sort((a, b)=>b.v - a.v || (a.yo ? -1 : 1))};
}
function htmlDesafioAmigos(chico){
  if(!conectado() || !NC.am || !(NC.am.amigos || []).length) return '';
  const {D, filas} = tablaDesafio(), yo = filas.findIndex(f=>f.yo), quedan = diasEntre(hoyISO(), D.fin) + 1, fmtV = v=>D.k==='km' ? fmtNum(v) : String(v);
  const lider = filas[0], falta = Math.max(0, D.meta - filas[yo].v);
  const frase = filas[yo].v >= D.meta ? (yo===0 ? '¡Cumpliste y vas primero! 🏆' : '¡Cumpliste! Ahora alcanza a ' + esc(lider.nombre.split(' ')[0]) + '.')
    : 'Te ' + (falta===1 ? 'falta ' : 'faltan ') + fmtV(Math.round(falta * 10) / 10) + ' ' + (falta===1 && D.k==='ent' ? 'entrenamiento' : D.n) + ' para cumplir.' + (yo > 0 ? ' ¡Alcanza a ' + esc(lider.nombre.split(' ')[0]) + '!' : '');
  if(chico) return `<button class="tarjeta desaf-am chico-am" id="daIr"><div class="entre"><span class="etiqueta">👥 Desafío con amigos</span><span class="suave chico">quedan ${quedan} ${quedan===1 ? 'día' : 'días'}</span></div>
    <div><b>${D.meta} ${D.n}</b> · vas <b>${yo + 1}.º</b> de ${filas.length} con ${fmtV(filas[yo].v)}</div><div class="suave chico">${frase}</div></button>`;
  return `<div class="tarjeta desaf-am"><div class="entre"><span class="titulo">🏁 Desafío con amigos</span><span class="suave chico">quedan ${quedan} ${quedan===1 ? 'día' : 'días'}</span></div>
    <p style="margin:4px 0 6px">Esta semana: <b>${D.meta} ${D.n}</b></p>
    ${filas.map((f, i)=>`<div class="da-fila ${f.yo ? 'yo' : ''}" ${f.yo ? '' : `data-veramigo="${f.usuario}"`}><span class="da-pos">${i + 1}</span><span class="bx-av">${f.yo ? 'TÚ' : esc(iniciales(f.nombre))}</span>
      <div><b>${esc(f.yo ? 'Tú' : f.nombre)}</b><div class="barra-logro"><span style="width:${Math.min(100, Math.round(f.v / D.meta * 100))}%"></span></div></div><b class="num">${fmtV(f.v)}/${D.meta}${f.v >= D.meta ? ' ✓' : ''}</b></div>`).join('')}
    <p class="suave chico" style="margin:8px 0 0">${frase} Cada lunes cambia el desafío.</p></div>`;
}
function tarjetaPub(p){
  const x = p.datos, k = p.usuario + '|' + p.id, A = (NC.am.apl || {})[k] || {n:0, mio:false}, dd = diasEntre(p.fecha, hoyISO());
  const cuando = dd===0 ? 'hoy' : dd===1 ? 'ayer' : verFecha(p.fecha), foto = FOTOS_AM[k];
  const que = x.k==='ins' ? `Ganó la insignia <b>${esc(x.t)}</b> 🎖️` : x.k==='rango' ? `Subió a <b>${esc(x.t)}</b> 🏅` : x.d ? `<b>${esc(x.t)}</b> · descanso activo`
    : `<b>${esc(x.t)}</b>${x.r ? ' · ' + esc(x.r) : ''}`;
  const datos = x.k==='ses' && !x.d ? [x.dur || x.min ? '⏱ ' + (x.dur || x.min) + ' min' : '', x.km ? '📍 ' + fmtNum(x.km) + ' km' : '', x.rpe ? '💢 esfuerzo ' + x.rpe : ''].filter(Boolean) : [];
  // el récord que repite el resultado del entrenamiento se dice «Récord personal»
  const recs = (x.rec || []).map(r=>r.startsWith(x.t) ? 'Récord personal' : r);
  return `<div class="am-pub" ${x.k==='ses' ? `data-verpub="${esc(k)}"` : ''}><div class="am-cab" data-veramigo="${p.usuario}"><span class="bx-av">${esc(iniciales(nombreAmigo(p.usuario)))}</span><div><b>${esc(nombreAmigo(p.usuario))}</b><small class="suave">${cuando}${x.k==='ses' && x.ti && x.ti!==x.t ? ' · ' + esc(x.ti) : ''}</small></div>${recs.length ? '<span class="bx-pr">récord</span>' : ''}</div>
    ${foto ? `<img class="am-foto" src="${foto}" alt="Foto del entrenamiento">` : ''}
    <div class="am-que">${que}</div>
    ${(x.ej || []).length ? `<div class="suave chico am-ej">${x.ej.map(esc).join(' · ')}</div>` : ''}
    ${datos.length ? `<div class="am-datos chico">${datos.map(d=>`<span>${d}</span>`).join('')}</div>` : ''}
    ${recs.length ? `<div class="chico am-rec">🏆 ${[...new Set(recs)].map(esc).join(' · ')}</div>` : ''}
    ${x.notas ? `<div class="chico am-nota">“${esc(x.notas.length > 140 ? x.notas.slice(0, 140) + '…' : x.notas)}”</div>` : ''}
    <div class="entre"><button class="am-apl ${A.mio ? 'mio' : ''}" data-apl="${esc(k)}">💪 ${A.n ? A.n + ' · ' : ''}${A.mio ? 'Aplaudiste' : 'Aplaudir'}</button>${x.k==='ses' ? '<span class="link chico">Ver detalle ›</span>' : ''}</div></div>`;
}
/* Detalle del entrenamiento de un amigo: fotos grandes, ejercicios (como en el diario propio), resultado, récords y notas */
async function verPubAmigo(k){
  const p = ((NC.am && NC.am.pubs) || []).concat(MURO_AM.pubs || []).find(q=>q.usuario + '|' + q.id===k); if(!p) return; const x = p.datos, A = (NC.am.apl || {})[k] || {n:0, mio:false};
  const recs = [...new Set((x.rec || []).map(r=>r.startsWith(x.t) ? 'Récord personal' : r))];
  const datos = [[x.dur || x.min ? (x.dur || x.min) + ' min' : '', 'duración'], [x.km ? fmtNum(x.km) + ' km' : '', 'distancia'], [x.rpe ? textoEsfuerzo(x.rpe) : '', 'esfuerzo']].filter(d=>d[0]);
  dialogo(`<div class="cab"><div class="am-cab"><span class="bx-av">${esc(iniciales(nombreAmigo(p.usuario)))}</span><div><b>${esc(nombreAmigo(p.usuario))}</b><small class="suave">${verFecha(p.fecha)} · ${esc(x.ti || '')}</small></div></div><button class="btn chico-btn" data-cerrar>✕</button></div>
    <div id="apFotos">${x.nf ? '<p class="suave chico">Cargando fotos…</p>' : ''}</div>
    <h2 style="margin:6px 0 2px">${esc(x.t)}</h2>${x.r ? `<div class="am-res num">${esc(x.r)}${x.rx ? ' <span class="chip MB">Rx</span>' : ''}</div>` : ''}
    ${datos.length ? `<div class="u-res bx-kpi">${datos.map(([v, n])=>`<div><b class="num">${esc(v)}</b><span>${n}</span></div>`).join('')}</div>` : ''}
    ${recs.length ? `<div class="am-rec">🏆 ${recs.map(esc).join(' · ')}</div>` : ''}
    ${x.w ? `<div class="etiqueta" style="margin-top:12px">Entrenamiento</div>${htmlWodVisual(x.w)}` : (x.ej || []).length ? `<div class="etiqueta">Ejercicios</div><p>${x.ej.map(esc).join(' · ')}</p>` : ''}
    ${x.notas ? `<div class="etiqueta">Notas</div><p class="am-nota">${esc(x.notas)}</p>` : ''}
    <button class="am-apl ${A.mio ? 'mio' : ''}" id="apApl">💪 ${A.n ? A.n + ' · ' : ''}${A.mio ? 'Aplaudiste' : 'Aplaudir'}</button>`, d=>{
    $('#apApl', d).onclick = async ()=>{ await aplaudir(k); verPubAmigo(k); };
  });
  // las fotos se buscan siempre (7-nov-2026: si las publicaciones se trajeron antes de que terminaran de subir, el detalle quedaba sin foto)
  try{ const f = await api(`fotos_pub?usuario=eq.${p.usuario}&pub=eq.${encodeURIComponent(p.id)}&order=n.asc`) || [], c = $('#apFotos');
    if(f.length) FOTOS_AM[k] = f[0].chica;
    if(c && $('#dialogo').open) c.innerHTML = f.length ? `<div class="am-fotos">${f.map(z=>`<img src="${z.grande || z.chica}" alt="Foto del entrenamiento">`).join('')}</div>` : ''; }
  catch(e){ anotarError(e, 'fotos de amigos'); const c = $('#apFotos'); if(c) c.innerHTML = ''; }
}
/* Diario → Amigos */
let cargandoAm = false;
function vAmigos(){
  const v = $('#diarioCuerpo'); if(!v) return; v.innerHTML = ''; const cont = document.createElement('div'); cont.id = 'amigos';
  if(!conectado()){ cont.innerHTML = `<div class="tarjeta"><div class="titulo">👥 Entrena con tus amigos</div><p class="suave">Mira sus entrenamientos y logros, dales 💪 y compitan en el desafío de cada semana.</p>
      <p class="suave chico">Tus amigos ven tus entrenamientos (con sus fotos y notas) y tus logros: nunca tus medidas, tu salud ni Mi ciclo.</p><button class="btn prim ancho" id="amIngresar">☁️ Ingresar con mi correo</button></div>`;
    v.appendChild(cont); $('#amIngresar').onclick = ()=>dialogoIngresar(()=>{ ir('diario'); }); return; }
  const A = NC.am || {}, ams = A.amigos || [], cod = NC.perfil && NC.perfil.uid===SES.uid ? NC.perfil.codigo : '…';
  cont.innerHTML = `${htmlDesafioAmigos()}
    ${!ams.length ? `<div class="tarjeta"><div class="titulo">👥 Entrena con tus amigos</div><p class="suave chico">👉 <b>Ahora:</b> invita a un amigo con tu código o agrega el suyo. Verán sus entrenamientos y logros, se darán 💪 y competirán en el desafío de cada semana.</p>
      <p class="suave chico">Tus amigos ven tus entrenamientos (con sus fotos y notas) y tus logros: nunca tus medidas, tu salud ni Mi ciclo.</p></div>` : ''}
    <div class="am-btns"><button class="btn prim" id="amInvitar">＋ Invitar a un amigo</button><button class="btn" id="amAgregar">Agregar con un código</button></div>
    ${ams.length ? `<label class="check am-check"><input type="checkbox" id="amFotos" ${pref('amFotos')!=='no' ? 'checked' : ''}><span>Mostrar a mis amigos las fotos y notas de mis entrenamientos</span></label>` : ''}
    <div class="suave chico am-cod">Tu código: <b class="num">${esc(cod)}</b>${ams.length ? ` · <button class="link chico" id="amLista">Mis amigos (${ams.length}) ›</button>` : ''}</div>
    ${ams.length ? ((A.pubs || []).length ? (A.pubs || []).map(tarjetaPub).join('') : '<div class="tarjeta vacio chico">Tus amigos aún no registran entrenamientos esta semana.</div>') : ''}`;
  v.appendChild(cont);
  $('#amInvitar').onclick = async ()=>{ try{ const p = await nubeMiPerfil(); const txt = `Entrena conmigo en NSCE 💪 Abre la app → Diario → Amigos → «Agregar con un código» y escribe: ${p.codigo}`;
      if(navigator.share) navigator.share({text:txt}).catch(()=>{}); else { try{ navigator.clipboard.writeText(txt); }catch(e){} aviso('Invitación copiada: pégala en WhatsApp', 3000); } }catch(e){ aviso(e.message); } };
  $('#amAgregar').onclick = dialogoAgregarAmigo;
  if($('#amLista')) $('#amLista').onclick = dialogoMisAmigos;
  $$('#amigos [data-apl]').forEach(b=>b.onclick = e=>{ e.stopPropagation(); aplaudir(b.dataset.apl); });
  $$('#amigos [data-verpub]').forEach(c=>c.onclick = ()=>verPubAmigo(c.dataset.verpub));
  const faltan = (A.pubs || []).filter(p=>p.datos.nf && !FOTOS_AM[p.usuario + '|' + p.id]);
  if(faltan.length && !vAmigos.buscando){ vAmigos.buscando = true;
    api(`fotos_pub?select=usuario,pub,n,chica&usuario=in.(${[...new Set(faltan.map(p=>p.usuario))].join(',')})&n=eq.0`).then(fot=>{ vAmigos.buscando = false; let nuevas = 0;
      (fot || []).forEach(x=>{ const k = x.usuario + '|' + x.pub; if(!FOTOS_AM[k]){ FOTOS_AM[k] = x.chica; nuevas++; } });
      if(nuevas && vistaActual==='diario' && vistaDiario==='amigos') vAmigos(); }).catch(e=>{ vAmigos.buscando = false; anotarError(e, 'fotos de amigos'); }); }
  $$('#amigos [data-veramigo]').forEach(c=>c.onclick = e=>{ e.stopPropagation(); verMuroAmigo(c.dataset.veramigo); });
  if($('#amFotos')) $('#amFotos').onchange = e=>{ pref('amFotos', e.target.checked ? '' : 'no'); NC.pubFirma = null; aviso(e.target.checked ? 'Tus amigos verán las fotos y notas de tus entrenamientos' : 'Tus fotos y notas ya no se comparten'); nubePublicar().catch(()=>{}); };
  if(!cargandoAm && (!A.t || Date.now() - A.t > 60000)){ cargandoAm = true;
    Promise.all([nubeMiPerfil(), cargarAmigos()]).then(()=>{ cargandoAm = false; if(vistaActual==='diario' && vistaDiario==='amigos') vAmigos(); }).catch(e=>{ cargandoAm = false; aviso(e.message); }); }
}
async function aplaudir(k){
  const [autor, ...r] = k.split('|'), pub = r.join('|'), A = NC.am.apl[k] = NC.am.apl[k] || {n:0, mio:false};
  try{ if(A.mio){ await api(`aplausos?autor=eq.${autor}&pub=eq.${encodeURIComponent(pub)}&de=eq.${SES.uid}`, {method:'DELETE'}); A.mio = false; A.n = Math.max(0, A.n - 1); }
    else { await api('aplausos', {method:'POST', body:{autor, pub, de:SES.uid}}); A.mio = true; A.n++; if(navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) navigator.vibrate(15); }
    guardarNC(); vAmigos(); }catch(e){ aviso('No se pudo: ' + e.message); }
}
function dialogoAgregarAmigo(){
  dialogo(`<div class="cab"><h2>Agregar un amigo</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <p class="suave chico">👉 <b>Ahora:</b> pídele a tu amigo su código (en su app: Diario → Amigos) o pega su invitación.</p>
    <label>Código de tu amigo</label><input id="aaCod" placeholder="Ej.: A-7KQ2MX" autocapitalize="characters">
    <div class="btns"><button class="btn" data-cerrar>Cancelar</button><button class="btn prim" id="aaOk">Agregar</button></div>`, d=>{
    $('#aaOk', d).onclick = async ()=>{ const m = /A-[A-Z0-9]{6}/i.exec($('#aaCod', d).value); if(!m){ aviso('El código tiene la forma A-XXXXXX'); return; }
      $('#aaOk', d).disabled = true;
      try{ await nubeMiPerfil(); const r = await rpc('agregar_amigo', {p_codigo:m[0].toUpperCase()}); NC.pubFirma = null; d.close(); aviso('👥 Ahora eres amigo de ' + (r.nombre || 'tu amigo'));
        try{ await nubePublicar(); }catch(e){ anotarError(e, 'amigos'); } await cargarAmigos(); if(vistaActual==='diario') vDiario(); }
      catch(e){ $('#aaOk', d).disabled = false; aviso(e.message, 3500); } };
  });
}
function dialogoMisAmigos(){
  const ams = (NC.am && NC.am.amigos) || [];
  dialogo(`<div class="cab"><h2>Mis amigos</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <ul class="lista">${ams.map(a=>`<li class="entre am-fila"><button class="link" data-veramigo="${a.usuario}"><span class="bx-av">${esc(iniciales(a.nombre))}</span> ${esc(a.nombre)}</button><button class="link chico" data-quitar="${a.usuario}">Quitar</button></li>`).join('')}</ul>
    <p class="nota">Al quitar a alguien, dejan de verse los dos.</p>`, d=>{
    $$('[data-veramigo]', d).forEach(b=>b.onclick = ()=>verMuroAmigo(b.dataset.veramigo));
    $$('[data-quitar]', d).forEach(b=>b.onclick = ()=>confirmar('¿Quitar a ' + nombreAmigo(b.dataset.quitar) + ' de tus amigos? Dejarán de verse los dos.', async ()=>{
      try{ await rpc('quitar_amigo', {p_amigo:b.dataset.quitar}); await cargarAmigos(); aviso('Listo'); if(vistaActual==='diario') vDiario(); }catch(e){ aviso(e.message); } }, 'Quitar'));
  });
}
function enlazarDesafioAmigos(){ if($('#daIr')) $('#daIr').onclick = ()=>{ vistaDiario = 'amigos'; pref('vistaDiario', 'amigos'); ir('diario'); }; }

/* Muro completo de un amigo (7-nov-2026, pedido del usuario: «ver todo el muro»): sus 3 meses de entrenamientos y logros, con un resumen arriba */
async function verMuroAmigo(u){
  const nom = nombreAmigo(u);
  dialogo(`<div class="cab"><div class="am-cab"><span class="bx-av grande">${esc(iniciales(nom))}</span><div><h2 style="margin:0">${esc(nom)}</h2><small class="suave">Su muro · últimos 3 meses</small></div></div><button class="btn chico-btn" data-cerrar>✕</button></div>
    <div id="maCuerpo"><p class="suave chico">Cargando…</p></div>`);
  try{
    const [pubs, apl, fot] = await Promise.all([api(`publicaciones?usuario=eq.${u}&order=fecha.desc,creada.desc&limit=300`), api('aplausos?autor=eq.' + u),
      api(`fotos_pub?select=usuario,pub,n,chica&usuario=eq.${u}&n=eq.0`).catch(()=>[])]);
    MURO_AM = {u, pubs:pubs || []};
    (apl || []).forEach(a=>{ const k = a.autor + '|' + a.pub, A = NC.am.apl[k] = NC.am.apl[k] || {n:0, mio:false}; if(!A.cargado){ A.n = 0; A.mio = false; A.cargado = true; } });
    (apl || []).forEach(a=>{ const A = NC.am.apl[a.autor + '|' + a.pub]; A.n++; if(a.de===SES.uid) A.mio = true; });
    Object.values(NC.am.apl).forEach(A=>delete A.cargado);
    (fot || []).forEach(x=>FOTOS_AM[x.usuario + '|' + x.pub] = x.chica);
    const ses = MURO_AM.pubs.filter(p=>p.datos.k==='ses' && !p.datos.d), s30 = ses.filter(p=>p.fecha >= hace(29));
    const km = ses.reduce((a, p)=>a + (p.datos.km || 0), 0), recs = ses.reduce((a, p)=>a + (p.datos.rec || []).length, 0);
    const c = $('#maCuerpo'); if(!c || !$('#dialogo').open) return;
    c.innerHTML = `<div class="u-res bx-kpi"><div><b class="num">${s30.length}</b><span>entrenamientos en 30 días</span></div><div><b class="num">${fmtNum(Math.round(km))}</b><span>km en 3 meses</span></div><div><b class="num">${recs}</b><span>récords en 3 meses</span></div></div>
      ${MURO_AM.pubs.length ? MURO_AM.pubs.map(tarjetaPub).join('') : '<p class="suave chico">Aún no registra entrenamientos.</p>'}`;
    $$('#maCuerpo [data-apl]').forEach(b=>b.onclick = async e=>{ e.stopPropagation(); await aplaudir(b.dataset.apl); verMuroAmigo(u); });
    $$('#maCuerpo [data-verpub]').forEach(x=>x.onclick = ()=>verPubAmigo(x.dataset.verpub));
  }catch(e){ const c = $('#maCuerpo'); if(c) c.innerHTML = `<p class="suave chico">No se pudo cargar: ${esc(e.message)}</p>`; }
}
