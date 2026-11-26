/* #NSCE — Agregar amigos, guiado (25-nov-2026, maqueta aprobada). Un enlace (amigo.html#A-XXXXXX, sin nombre ni correo) que abre la app (nsce://amigo/A-XXXXXX, complemento
   NSCEEnlace) o lleva a la App Store; «Agregar amigo» en una pantalla (enviar, QR, pegar); quien lo recibe ve el nombre antes de aceptar (`buscar_amigo`); si no tiene
   cuenta lo guía. La invitación queda en pref invPend hasta aceptarla o descartarla. Aviso «X ya es tu amigo» (NC.amVistos / NC.amNuevos) y saludo (tabla saludos). */
'use strict';
const RE_COD = /(?:^|[^A-Z0-9])(A-[A-Z0-9]{6})(?![A-Z0-9])/i;
const codEn = t=>{ const m = RE_COD.exec(String(t || '')); return m ? m[1].toUpperCase() : ''; };
const enlaceInvitar = c=>WEB_PUBLICA + 'amigo.html#' + c;
async function copiarTxt(t, msg){ try{ await navigator.clipboard.writeText(t); aviso(msg); }catch(e){ aviso('No se pudo copiar'); } }
async function enviarInvitacion(){
  try{ const p = await nubeMiPerfil(), nom = (S.perfil.nombre || '').trim();
    const txt = `${nom ? nom + ' te invita' : 'Te invito'} a entrenar en NSCE 💪\nToca para ser amigos: ${enlaceInvitar(p.codigo)}`;
    if(navigator.share) await navigator.share({text:txt}).catch(()=>{}); else await copiarTxt(txt, 'Invitación copiada: pégala en WhatsApp');
  }catch(e){ aviso(e.message, 3500); }
}
const htmlPasosInv = ()=>`<div class="tarjeta inv-guia"><div class="titulo">👥 Entrena con un amigo</div><div class="suave chico">Se agregan en 3 pasos</div>
  ${[['Mándale tu invitación', 'Por WhatsApp o mensaje'], ['Tu amigo toca el enlace', 'Se abre NSCE o la App Store'], ['Listo, son amigos', 'Sin escribir ningún código']].map(([a, b], i)=>`<div class="inv-paso"><i>${i + 1}</i><div><b>${a}</b><div class="suave chico">${b}</div></div></div>`).join('')}
  <button class="btn prim ancho" id="amInvitar">↗ Invitar por WhatsApp o mensaje</button><button class="btn ancho" id="amAgregar">Otras formas de agregar</button>
  <p class="suave chico">🔒 Tus amigos ven tus entrenamientos (con sus fotos y notas) y tus logros: nunca tus medidas, tu salud ni Mi ciclo.</p></div>`;
async function dialogoAgregarAmigo(){
  let p; try{ NC.perfil = null; p = await nubeMiPerfil(); }catch(e){ return aviso(e.message, 3500); }
  dialogo(`<div class="cab"><h2>Agregar amigo</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <div class="tarjeta"><button class="btn prim ancho" id="aaEnviar">↗ Enviar invitación</button><div class="suave chico">La forma más fácil si no están juntos.</div></div>
    <div class="tarjeta inv-qr"><b>¿Están juntos?</b><div class="suave chico">👉 Que lo escanee con la cámara de su iPhone</div>${qrSvg(enlaceInvitar(p.codigo))}
      <div class="chico am-cod"><span class="suave">Tu código:</span> <b class="num">${esc(p.codigo)}</b> · <button class="link chico" id="aaCopiar">Copiar</button></div></div>
    <div class="tarjeta"><b>¿Te mandaron una invitación?</b><button class="btn ancho" id="aaPegar">📋 Pegar invitación</button>
      <div class="inv-cod"><input id="aaCod" placeholder="o escribe: A-7KQ2MX" autocapitalize="characters" autocomplete="off" aria-label="Código de tu amigo"><button class="btn" id="aaOk">Seguir</button></div></div>
    <details class="chico"><summary>¿Alguien que no quieres tiene tu código?</summary><p class="suave">Cámbialo: los enlaces y QR que ya mandaste dejan de servir. Tus amigos de ahora siguen.</p><button class="btn" id="aaCambiar">Cambiar mi código</button></details>`, d=>{
    const seguir = t=>{ const c = codEn(t); if(!c) return aviso('No encontré una invitación. El código tiene la forma A-XXXXXX', 3500); recibirInvitacion(c); };
    $('#aaEnviar', d).onclick = enviarInvitacion; $('#aaCopiar', d).onclick = ()=>copiarTxt(p.codigo, 'Código copiado');
    $('#aaPegar', d).onclick = async ()=>{ let t = ''; try{ t = await navigator.clipboard.readText(); }catch(e){ $('#aaCod', d).focus(); return aviso('Pégala en la casilla de abajo'); } seguir(t); };
    $('#aaOk', d).onclick = ()=>seguir($('#aaCod', d).value);
    $('#aaCambiar', d).onclick = ()=>confirmar('¿Cambiar tu código? Los enlaces y QR que ya mandaste dejarán de servir.', async ()=>{
      try{ await cambiarCodigo(); aviso('Tienes un código nuevo'); dialogoAgregarAmigo(); }catch(e){ aviso(e.message, 3500); } }, 'Cambiar');
  });
}
async function cambiarCodigo(){
  for(let i = 0; i < 4; i++){ const codigo = codigoAmigo();
    try{ await api('perfiles?usuario=eq.' + SES.uid, {method:'PATCH', body:{codigo, actualizado:new Date().toISOString()}}); NC.perfil = Object.assign({}, NC.perfil, {uid:SES.uid, codigo}); guardarNC(); return codigo; }
    catch(e){ if(!/duplicate|unique/i.test(e.message)) throw e; } }
  throw new Error('No se pudo cambiar tu código');
}
/* Recibir una invitación (enlace, QR, pegar o código): guía cuenta → reglas → confirmar con el nombre */
async function recibirInvitacion(cod){
  pref('invPend', cod);
  const pasos = n=>`<div class="inv-ps">${['Correo', 'Código', 'Listo'].map((t, i)=>`<div class="${i < n ? 'on' : ''}"><u></u>${t}</div>`).join('')}</div>`;
  const fuera = d=>{ $('#ciNo', d).onclick = ()=>{ pref('invPend', ''); d.close(); VISTAS[vistaActual](); }; };
  if(!conectado()) return dialogo(`<div class="cab"><h2>👥 Te invitaron</h2><button class="btn chico-btn" data-cerrar>✕</button></div>${pasos(1)}
    <p>👉 <b>Ahora:</b> ingresa con tu correo. Te llega un código, lo escribes y vuelves aquí para aceptar.</p><button class="btn prim ancho" id="ciEntrar">☁️ Ingresar con mi correo</button><button class="btn ancho" id="ciNo">Ahora no</button>`, d=>{
      $('#ciEntrar', d).onclick = ()=>dialogoIngresar(()=>recibirInvitacion(cod)); fuera(d); });
  if(pref('amReglas')!=='1') return dialogo(`<div class="cab"><h2>👥 Te invitaron</h2><button class="btn chico-btn" data-cerrar>✕</button></div>${htmlReglasAm()}<button class="btn ancho" id="ciNo">Ahora no</button>`, d=>{
      $('#amAcepto', d).onclick = ()=>{ pref('amReglas', '1'); recibirInvitacion(cod); }; fuera(d); });
  let r = {nombre:''};
  try{ await nubeMiPerfil(); r = await rpc('buscar_amigo', {p_codigo:cod}) || r; }
  catch(e){ if(!/could not find|schema cache|does not exist|no existe la función/i.test(e.message)){ if(/No hay nadie|tu propio|No se puede agregar/.test(e.message)) pref('invPend', ''); return aviso(e.message, 3500); } }
  if(r.amigo){ pref('invPend', ''); if($('#dialogo').open) $('#dialogo').close(); return aviso('Ya eres amigo de ' + r.nombre); }
  const nom = r.nombre || '';
  dialogo(`<div class="inv-conf"><span class="bx-av inv-av">${esc(nom ? iniciales(nom) : '👥')}</span><h2>¿Agregar a ${esc(nom || cod)}?</h2>
    <p class="suave">Verán los entrenamientos y logros del otro, y competirán cada semana.</p><button class="btn prim ancho" id="ciOk">Agregar</button><button class="btn ancho" id="ciNo">Ahora no</button></div>`, d=>{
    fuera(d);
    $('#ciOk', d).onclick = async ()=>{ $('#ciOk', d).disabled = true;
      try{ const a = await rpc('agregar_amigo', {p_codigo:cod}); pref('invPend', ''); NC.pubFirma = null; NC.amVistos = (NC.amVistos || []).concat(a.usuario); d.close(); aviso('👥 Ahora eres amigo de ' + (a.nombre || 'tu amigo'));
        await cargarAmigos(); vistaDiario = 'amigos'; pref('vistaDiario', 'amigos'); ir('diario');
        nubePublicar().catch(e=>anotarError(e, 'amigos')); }
      catch(e){ $('#ciOk', d).disabled = false; aviso(e.message, 3500); } };
  });
}
/* Tarjetas de Inicio y Amigos: invitación por aceptar, amigos nuevos y saludos */
function htmlAvisosAm(){
  const pend = codEn(pref('invPend')); let h = pend && nubeLista() ? `<div class="tarjeta inv-nuevo"><b>👥 Tienes una invitación</b><div class="suave chico">Alguien te invitó a ser su amigo en NSCE.</div><div class="btns"><button class="btn" data-invno>Descartar</button><button class="btn prim" data-invver="${pend}">Ver invitación</button></div></div>` : '';
  if(!conectado()) return h;
  const ams = (NC.am && NC.am.amigos) || [];
  ams.filter(a=>(NC.amNuevos || []).includes(a.usuario)).forEach(a=>{ h += `<div class="tarjeta inv-nuevo"><div class="inv-fila"><span class="bx-av">${esc(iniciales(a.nombre))}</span><div><b>${esc(a.nombre)} ya es tu amigo</b><div class="suave chico">Aceptó tu invitación</div></div></div><div class="btns"><button class="btn" data-nuevook="${a.usuario}">Listo</button><button class="btn prim" data-saludar="${a.usuario}">💪 Saludar</button></div></div>`; });
  ((NC.am && NC.am.saludos) || []).filter(s=>s.creado > (NC.saludoVisto || '')).forEach(s=>{ h += `<div class="tarjeta inv-nuevo"><div class="inv-fila"><span class="bx-av">${esc(iniciales(nombreAmigo(s.de)))}</span><div><b>${esc(nombreAmigo(s.de))} te saludó 💪</b><div class="suave chico">¡A entrenar!</div></div><button class="btn chico-btn" data-saludook="${esc(s.creado)}">Listo</button></div></div>`; });
  return h;
}
function enlazarAvisosAm(){
  const re = ()=>{ guardarNC(); VISTAS[vistaActual](); }, quita = u=>{ NC.amNuevos = (NC.amNuevos || []).filter(x=>x!==u); };
  $$('[data-invver]').forEach(b=>b.onclick = ()=>recibirInvitacion(b.dataset.invver));
  $$('[data-invno]').forEach(b=>b.onclick = ()=>{ pref('invPend', ''); re(); });
  $$('[data-nuevook]').forEach(b=>b.onclick = ()=>{ quita(b.dataset.nuevook); re(); });
  $$('[data-saludook]').forEach(b=>b.onclick = ()=>{ NC.saludoVisto = b.dataset.saludook > (NC.saludoVisto || '') ? b.dataset.saludook : NC.saludoVisto; re(); });
  $$('[data-saludar]').forEach(b=>b.onclick = async ()=>{ b.disabled = true; const u = b.dataset.saludar;
    try{ await api('saludos', {method:'POST', body:{de:SES.uid, para:u}}); }catch(e){ if(!/duplicate|unique/i.test(e.message)){ b.disabled = false; return aviso('No se pudo saludar: ' + e.message, 3500); } }
    quita(u); aviso('💪 Saludaste a ' + nombreAmigo(u)); re(); });
}
/* Después de traer los amigos: quién es nuevo (la primera vez no se avisa de los que ya estaban) */
function marcarAmigosNuevos(){
  const ids = ((NC.am && NC.am.amigos) || []).map(a=>a.usuario);
  if(NC.amUid!==SES.uid){ NC.amUid = SES.uid; NC.amVistos = ids; NC.amNuevos = []; return; }
  const V = NC.amVistos = NC.amVistos || []; ids.filter(u=>!V.includes(u)).forEach(u=>{ V.push(u); NC.amNuevos = (NC.amNuevos || []).concat(u); });
  NC.amVistos = V.filter(u=>ids.includes(u)); NC.amNuevos = (NC.amNuevos || []).filter(u=>ids.includes(u));
}
/* Enlaces: en la web index.html#amigo=A-…; en el iPhone nsce://amigo/A-… (complemento NSCEEnlace) */
function abrirEnlace(t){ const c = codEn(t); if(!c) return; pref('invPend', c); const d = $('#dialogo'); if(d && d.open){ if(vistaActual==='hoy') vHoy(); return; } recibirInvitacion(c); }
async function leerEnlaceIOS(){ const P = esNativa() && window.Capacitor.Plugins && window.Capacitor.Plugins.NSCEEnlace; if(!P) return;
  try{ const r = await P.tomar(); if(r && r.url && /^nsce:\/\/amigo/i.test(r.url)) abrirEnlace(r.url); }catch(e){} }
async function refrescarAmigos(){ if(!conectado() || !NC.perfil || (NC.am && Date.now() - NC.am.t < 60000)) return;
  try{ const antes = (NC.amNuevos || []).length; await cargarAmigos(); if((NC.amNuevos || []).length > antes || (NC.am.saludos || []).some(s=>s.creado > (NC.saludoVisto || ''))){ if(vistaActual==='hoy' && !$('#dialogo').open){ const y = window.scrollY; vHoy(); window.scrollTo(0, y); } } }catch(e){} }
if(typeof document!=='undefined'){
  const hash = ()=>{ if(/^#amigo=/i.test(location.hash)){ const h = location.hash; history.replaceState(null, '', location.pathname + location.search); abrirEnlace(h); } };
  window.addEventListener('load', ()=>{ setTimeout(()=>{ hash(); leerEnlaceIOS(); const P = esNativa() && window.Capacitor.Plugins.NSCEEnlace; if(P && P.addListener) P.addListener('enlace', leerEnlaceIOS); }, 400); setTimeout(refrescarAmigos, 3000); });
  window.addEventListener('hashchange', hash);
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible'){ setTimeout(leerEnlaceIOS, 300); refrescarAmigos(); } });
}
