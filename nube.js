/* #NSCE — Nube (Supabase por su REST, sin librerías): cuenta con código al correo, respaldo personal, unidad en línea
   (unirse con código, parte automático), tarea del día que publica el instructor y resultado que el alumno envía solo al registrar.
   La sesión y el caché van aparte (newen_nube, newen_nube_cache), no en S ni en el respaldo. Sin nube_config la app sigue sin nube. */
const NUBE = {url:String(window.NUBE_URL || '').replace(/\/$/, ''), clave:window.NUBE_CLAVE || ''};
const nubeLista = ()=>!!(NUBE.url && NUBE.clave);
let SES = null, NC = null;
try{ SES = JSON.parse(localStorage.getItem('newen_nube')); }catch(e){}
try{ NC = JSON.parse(localStorage.getItem('newen_nube_cache')); }catch(e){}
NC = NC || {tareas:{}, enviados:{}, respaldo:null};
const guardarSes = ()=>{ try{ SES ? localStorage.setItem('newen_nube', JSON.stringify(SES)) : localStorage.removeItem('newen_nube'); }catch(e){} };
const guardarNC = ()=>{ try{ localStorage.setItem('newen_nube_cache', JSON.stringify(NC)); }catch(e){} };
const conectado = ()=>nubeLista() && !!SES;

async function authPost(ruta, cuerpo){
  const r = await fetch(NUBE.url + '/auth/v1/' + ruta, {method:'POST', headers:{apikey:NUBE.clave, 'Content-Type':'application/json'}, body:JSON.stringify(cuerpo)});
  const j = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(j.msg || j.error_description || j.message || 'Error ' + r.status);
  return j;
}
const pedirCodigo = email=>authPost('otp', {email, create_user:true});
async function verificarCodigo(email, token){
  const j = await authPost('verify', {type:'email', email, token});
  SES = {token:j.access_token, refresh:j.refresh_token, exp:Date.now() + (j.expires_in || 3600) * 1000, uid:j.user.id, email:j.user.email}; guardarSes();
}
async function refrescar(){
  const j = await authPost('token?grant_type=refresh_token', {refresh_token:SES.refresh});
  Object.assign(SES, {token:j.access_token, refresh:j.refresh_token, exp:Date.now() + (j.expires_in || 3600) * 1000}); guardarSes();
}
async function api(ruta, o){
  o = o || {}; if(!conectado()) throw new Error('Ingresa con tu correo');
  if(Date.now() > SES.exp - 60000) await refrescar();
  const pedir = ()=>fetch(NUBE.url + '/rest/v1/' + ruta, {method:o.method || 'GET', body:o.body ? JSON.stringify(o.body) : undefined,
    headers:Object.assign({apikey:NUBE.clave, Authorization:'Bearer ' + SES.token, 'Content-Type':'application/json'}, o.prefer ? {Prefer:o.prefer} : {})});
  let r = await pedir(); if(r.status===401){ await refrescar(); r = await pedir(); }
  const t = await r.text(), j = t ? JSON.parse(t) : null;
  if(!r.ok) throw new Error((j && (j.message || j.msg)) || 'Error ' + r.status);
  return j;
}
const upsert = (tabla, filas, conflicto)=>api(tabla + '?on_conflict=' + conflicto, {method:'POST', body:filas, prefer:'resolution=merge-duplicates,return=representation'});
const rpc = (fn, args)=>api('rpc/' + fn, {method:'POST', body:args});
function cerrarSesion(){ SES = null; guardarSes(); NC = {tareas:{}, enviados:{}, respaldo:null}; guardarNC(); }

/* ---------- Cuenta (tarjeta en Perfil) ---------- */
function htmlCuentaNube(){
  if(!nubeLista()) return '';
  return `<h3>Cuenta</h3><div class="tarjeta cuenta-nube">${conectado()
    ? `<div class="entre"><div><div class="etiqueta">☁️ Conectado</div><b>${esc(SES.email)}</b>
        <div class="suave chico">${NC.respaldo ? 'Respaldo en la nube: ' + verFecha(NC.respaldo.slice(0, 10)) + ' ' + NC.respaldo.slice(11, 16) : 'Tus datos se respaldan solos en la nube.'}</div></div>
        <button class="btn chico-btn" id="cnSalir">Salir</button></div>
        <button class="link chico" id="cnBorrar" style="margin-top:10px">Borrar mi cuenta en la nube</button>`
    : `<p class="suave chico" style="margin-top:0">Ingresa con tu correo para respaldar tus datos en la nube, recibir las tareas de tu unidad y enviar tus resultados solos. Sin contraseña: te llega un código.</p>
       <button class="btn prim ancho" id="cnEntrar">☁️ Ingresar con mi correo</button>`}</div>`;
}
function enlazarCuentaNube(){
  if($('#cnEntrar')) $('#cnEntrar').onclick = dialogoIngresar;
  if($('#cnBorrar')) $('#cnBorrar').onclick = borrarCuentaNube;
  if($('#cnSalir')) $('#cnSalir').onclick = ()=>confirmar('¿Salir de tu cuenta en este teléfono? Tus datos quedan en el teléfono y en la nube.', ()=>{ cerrarSesion(); VISTAS[vistaActual](); }, 'Salir');
}
/* Borrar la cuenta en la nube (respaldo, unidades, partes y resultados); los datos del teléfono no se tocan */
function borrarCuentaNube(){
  confirmar('¿Borrar tu cuenta en la nube? Se borran tu respaldo en la nube, tus unidades (si eres instructor), tus partes y resultados. Lo que está en este teléfono no se borra. No se puede deshacer.', async ()=>{
    try{ await rpc('borrar_mi_cuenta', {}); cerrarSesion(); aviso('Cuenta en la nube borrada'); VISTAS[vistaActual](); }
    catch(e){ aviso('No se pudo borrar: ' + e.message); } }, 'Borrar cuenta');
}
function dialogoIngresar(alListo){
  dialogo(`<div class="cab"><h2>☁️ Ingresar</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <label>Tu correo</label><input id="inMail" type="email" inputmode="email" autocomplete="email" placeholder="nombre@correo.cl">
    <button class="btn prim ancho" id="inPedir" style="margin-top:8px">Enviarme el código</button>
    <div id="inPaso2" hidden><label>Código que te llegó al correo</label><input id="inCod" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="123456">
      <button class="btn prim ancho" id="inOk" style="margin-top:8px">Ingresar</button></div>
    <p class="nota">Revisa también la carpeta de correo no deseado. El código vence en pocos minutos.</p>`, d=>{
    $('#inPedir', d).onclick = async ()=>{ const m = $('#inMail', d).value.trim().toLowerCase(); if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)) return aviso('Correo no válido');
      $('#inPedir', d).disabled = true; try{ await pedirCodigo(m); $('#inPaso2', d).hidden = false; $('#inCod', d).focus(); aviso('Código enviado a ' + m); }catch(e){ aviso(e.message); } $('#inPedir', d).disabled = false; };
    $('#inOk', d).onclick = async ()=>{ try{ await verificarCodigo($('#inMail', d).value.trim().toLowerCase(), $('#inCod', d).value.trim()); }catch(e){ return aviso(e.message); }
      d.close(); aviso('☁️ Conectado'); await despuesDeIngresar(); if(typeof alListo==='function') alListo(); else VISTAS[vistaActual](); };
  });
}
/* Al ingresar: si este teléfono está vacío y hay respaldo, ofrecer recuperarlo; si no, subir el respaldo */
async function despuesDeIngresar(){
  try{ const r = await api('respaldos?usuario=eq.' + SES.uid), n = r && r[0] ? (r[0].datos.sesiones || []).length : 0;
    if(n && !S.sesiones.length){ confirmar('Encontramos tus datos en la nube (' + n + ' entrenamientos). ¿Recuperarlos en este teléfono?', ()=>{
        S = r[0].datos; guardar(); aviso('Datos recuperados'); setTimeout(()=>location.reload(), 400); }, 'Recuperar'); return; }
  }catch(e){}
  nubeSincronizar(true);
}

/* ---------- Sincronización automática ---------- */
let tNube = null;
function programarNube(){ if(!conectado()) return; if(typeof sincronizarRacha==='function') sincronizarRacha(); clearTimeout(tNube); tNube = setTimeout(()=>nubeSincronizar(), 4000); }
async function nubeSincronizar(forzar){
  if(!conectado() || (!navigator.onLine && !forzar)) return;
  try{
    // «Mi ciclo» (S.ciclo) nunca va a la nube
    if(S.sesiones.length){ await upsert('respaldos', {usuario:SES.uid, datos:Object.assign({}, S, {ciclo:undefined}), actualizado:new Date().toISOString()}, 'usuario'); NC.respaldo = new Date().toISOString(); }
    const U = S.unidad;
    if(U && U.nube){ await upsert('partes', {unidad:U.nube, usuario:SES.uid, datos:generarParte(), actualizado:new Date().toISOString()}, 'unidad,usuario');
      U.ultParte = hoyISO(); await nubeTraerTareas(); await nubeEnviarResultado(); }
    guardarNC();
  }catch(e){ console.warn('nube', e.message); }
}
async function nubeTraerTareas(){
  const U = S.unidad; if(!conectado() || !U || !U.nube) return;
  const r = await api(`tareas?unidad=eq.${U.nube}&fecha=gte.${hace(1)}&fecha=lte.${masDias(hoyISO(), 14)}`);
  NC.tareas = {}; (r || []).forEach(t=>NC.tareas[t.fecha] = t.sesion); guardarNC();
  // tipo y marcas del grupo (el coach puede cambiar las marcas del box): solo se guarda si cambió, para no volver a sincronizar
  try{ const [g] = await api(`unidades?id=eq.${U.nube}&select=nombre,tipo,marcas`) || []; if(g){ const nv = {unidad:g.nombre, tipo:g.tipo || 'unidad', marcas:g.marcas || null};
    if(JSON.stringify([U.unidad, U.tipo, U.marcas || null])!==JSON.stringify([nv.unidad, nv.tipo, nv.marcas])){ Object.assign(U, nv); guardar(); } } }catch(e){}
}
const tareaDe = f=>S.unidad && S.unidad.nube ? (NC.tareas || {})[f] || null : null;
/* Resultado del día: lo que el alumno registró hoy, se envía solo (y se actualiza si registra más) */
function resultadoDia(f){
  const ss = S.sesiones.filter(s=>s.fecha===f).sort((a, b)=>(a.creado || 0) - (b.creado || 0));
  return ss.map(s=>{ const m = metricas(s); return {n:s.titulo || etiquetaTipo(s), r:s.txt || '', rx:!!s.rx, min:m.min || 0, rpe:+s.rpe || null, km:Math.round(m.km * 10) / 10, kcal:kcalDe(s), d:s.tipo==='descanso'}; });
}
async function nubeEnviarResultado(){
  const U = S.unidad, f = hoyISO(), t = tareaDe(f); if(!t || !U || !U.nube) return;
  const ses = resultadoDia(f); if(!ses.length) return;
  const firma = JSON.stringify(ses); if(NC.enviados[f]===firma) return;
  const dp = disposicionDia();
  await upsert('resultados', {unidad:U.nube, fecha:f, usuario:SES.uid, enviado:new Date().toISOString(),
    datos:{tarea:t.n || 'Tarea', ses, alist:dp ? dp.v : null, alumno:{grado:U.grado, nombre:U.nombre, compania:U.compania, seccion:U.seccion, escuadra:U.escuadra}}}, 'unidad,fecha,usuario');
  const primera = !NC.enviados[f]; NC.enviados[f] = firma; guardarNC();
  if(primera) aviso('📤 Resultado enviado a ' + (U.unidad || 'tu unidad'), 3000);
  if(vistaActual==='hoy'){ const y = window.scrollY; vHoy(); window.scrollTo(0, y); }
}
/* Al abrir la app y al volver a ella: traer tareas y sincronizar */
function nubeAlAbrir(){ if(!conectado()) return; nubeSincronizar().then(()=>{ if(vistaActual==='hoy'){ const y = window.scrollY; vHoy(); window.scrollTo(0, y); } }); }
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') nubeAlAbrir(); });
window.addEventListener('online', ()=>nubeAlAbrir());

/* ---------- Tarea de la unidad en el Inicio (alumno) ---------- */
function htmlTareaUnidad(){
  const U = S.unidad; if(!U || !nubeLista()) return '';
  if(!conectado()) return U.nube ? `<button class="aviso-parte" id="tuIngresar">☁️ <span>Ingresa con tu correo para recibir las tareas de ${esc(U.unidad || 'tu unidad')}</span><span class="chev">›</span></button>` : '';
  if(!U.nube) return '';
  const hoy = hoyISO(), t = tareaDe(hoy); if(!t) return '';
  const hecho = resultadoDia(hoy).some(s=>t.tipo==='descanso' || t.activo || !s.d), env = NC.enviados[hoy];
  if(t.tipo==='descanso') return `<div class="tarea-u descanso"><div class="tu-cab"><span>${esBox() ? '🏋️' : '🎖️'} ${esc(U.unidad || (esBox() ? 'Tu box' : 'Tu unidad'))}</span><small>Tarea de hoy</small></div><b class="ph-tit">Descanso</b><p class="suave chico">Hoy ${esBox() ? 'el box descansa' : 'la unidad descansa'}: recupérate.</p></div>`;
  return `<div class="tarea-u ${hecho ? 'ok' : ''}">
    <div class="tu-cab"><span>${esBox() ? '🏋️' : '🎖️'} ${esc(U.unidad || (esBox() ? 'Tu box' : 'Tu unidad'))}</span><small>Tarea de hoy</small></div>
    <b class="ph-tit">${esc(t.activo ? 'Descanso activo' : t.n)}</b>
    <div class="ph-dat num">${t.min ? `<span>⏱ ${t.min} min</span>` : ''}${t.rpe ? `<span>💢 esfuerzo ${t.rpe}</span>` : ''}</div>
    ${t.d ? `<p class="chico">${esc(t.d)}</p>` : ''}
    ${hecho ? `<p class="tu-env">${env ? '✓ Cumplida · resultado enviado a tu ' + jefeU() : '✓ Cumplida · enviando resultado…'}</p>`
      : `<div class="ph-btns"><button class="btn prim" id="tuReg">${t.activo ? '🔋 Elegir descanso activo' : '＋ Registrar'}</button></div>
         <p class="nota">Al registrar, tu resultado le llega solo a tu ${jefeU()}.</p>`}
  </div>`;
}
function enlazarTareaUnidad(){
  if($('#tuIngresar')) $('#tuIngresar').onclick = ()=>dialogoIngresar();
  if($('#tuReg')) $('#tuReg').onclick = ()=>{ const t = tareaDe(hoyISO()); if(t.activo) return dialogoDescanso();
    const p = t.plantilla || t.pop && POPULARES.find(x=>x.titulo===t.pop); if(p) registrarWod(p); else abrirRegistro(); };
}

/* ---------- Unidad en línea: alumno se une; instructor crea, ve y publica ---------- */
async function nubeUnirse(datos){
  const r = await rpc('unirse', {p_codigo:datos.codigo, p_grado:datos.grado, p_nombre:datos.nombre, p_compania:datos.compania, p_seccion:datos.seccion, p_escuadra:datos.escuadra, p_salud:!!datos.salud});
  return r;
}
async function nubeSalir(){ const U = S.unidad; if(conectado() && U && U.nube) await api(`miembros?unidad=eq.${U.nube}&usuario=eq.${SES.uid}`, {method:'DELETE'}); }
async function nubeCrearUnidad(nombre, tipo, marcas){
  for(let i = 0; i < 4; i++){ const codigo = nuevoCodigo(tipo);
    try{ const r = await api('unidades', {method:'POST', body:Object.assign({codigo, nombre}, tipo==='box' ? {tipo, marcas} : {}), prefer:'return=representation'}); return r[0]; }catch(e){ if(!/duplicate|unique/i.test(e.message)) throw e; } }
  throw new Error('No se pudo crear el código');
}
/* Trae mis unidades de instructor y las suma a «Mi unidad» */
async function nubeMisUnidades(){
  const M = mando(), r = await api('unidades?instructor=eq.' + SES.uid + '&order=creada');
  (r || []).forEach(u=>{ const x = M.unidades.find(y=>y.codigo===u.codigo); if(x) Object.assign(x, {nube:u.id, tipo:u.tipo || 'unidad', marcas:u.marcas || null}); else M.unidades.push({codigo:u.codigo, nombre:u.nombre, creada:u.creada.slice(0, 10), nube:u.id, tipo:u.tipo || 'unidad', marcas:u.marcas || null}); });
  guardarMando();
}
const NU = {};
/* Carga alumnos, partes, tareas y resultados de una unidad en línea; los partes quedan en el formato de «Mi unidad» */
async function nubeCargarUnidad(u){
  const [miem, partes, tareas, res] = await Promise.all([api('miembros?unidad=eq.' + u.nube), api('partes?unidad=eq.' + u.nube),
    api(`tareas?unidad=eq.${u.nube}&fecha=gte.${hace(30)}&fecha=lte.${masDias(hoyISO(), 30)}`), api(`resultados?unidad=eq.${u.nube}&fecha=gte.${hace(30)}`)]);
  const M = mando(); Object.keys(M.partes).filter(k=>k.startsWith(u.codigo + '|')).forEach(k=>delete M.partes[k]);
  miem.forEach(m=>{ const p = partes.find(x=>x.usuario===m.usuario), al = {grado:m.grado, nombre:m.nombre, compania:m.compania || '', seccion:m.seccion || '', escuadra:m.escuadra || ''};
    M.partes[u.codigo + '|' + m.usuario] = p ? Object.assign({}, p.datos, {codigo:u.codigo, id:m.usuario, alumno:Object.assign({}, p.datos.alumno, al)})
      : {tipo:'parte-tacfit', codigo:u.codigo, id:m.usuario, hoy:m.unido.slice(0, 10), generado:m.unido, alumno:al, resumen:{rango:'—', insignias:0}, carga:{}, ses:[], pruebas:{}, evals:{}, caps:[], plan:null, salud:null}; });
  guardarMando();
  NU[u.codigo] = {t:Date.now(), miembros:miem, tareas:Object.fromEntries(tareas.map(t=>[t.fecha, t.sesion])), resultados:res};
}
async function nubePublicarTareas(u, filas){ await upsert('tareas', filas.map(([fecha, sesion])=>({unidad:u.nube, fecha, sesion, actualizada:new Date().toISOString()})), 'unidad,fecha'); }
