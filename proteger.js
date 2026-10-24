/* #TACFITNSCE — Que no se pierdan los registros (21-oct-2026, pedido del usuario). Los datos viven solo en el navegador donde se abrió
   la app, así que: (1) aviso si se abrió dentro de Instagram, Facebook, WhatsApp, TikTok… (su navegador propio borra o separa los datos);
   (2) recordatorio para instalarla en la pantalla de inicio (en el iPhone, Safari borra los datos de un sitio que no se usa en 7 días; la
   app instalada no) — ojo: en el iPhone la app instalada empieza vacía, por eso se ofrece guardar el respaldo antes; (3) se pide al
   navegador guardado persistente (navigator.storage.persist: no borra los datos cuando falta espacio). En las pruebas automáticas
   (navigator.webdriver) los avisos no salen, salvo window.__proteger. */
const UA_ = navigator.userAgent || '';
const NAV_DE_APP = [[/Instagram/i, 'Instagram'], [/FBAN|FBAV|FB_IAB|FBIOS|MessengerForiOS/i, 'Facebook'], [/WhatsApp/i, 'WhatsApp'],
  [/TikTok|musical_ly|BytedanceWebview/i, 'TikTok'], [/LinkedInApp/i, 'LinkedIn'], [/Snapchat/i, 'Snapchat'], [/\bLine\//, 'LINE'], [/Twitter/i, 'X (Twitter)']];
const navegadorDeApp = ()=>{ const x = NAV_DE_APP.find(([r])=>r.test(UA_)); return x ? x[1] : null; };
const esIOS = ()=>/iPhone|iPad|iPod/.test(UA_) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints > 1);
const esTelefono = ()=>esIOS() || /Android/i.test(UA_);
const esInstalada = ()=>(window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone===true;
const avisosProteger = ()=>window.__proteger || !navigator.webdriver;
let pedidoInstalar = null, datosPersistentes = null;
addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); pedidoInstalar = e; if(typeof vistaActual!=='undefined' && vistaActual==='hoy') vHoy(); });
addEventListener('appinstalled', ()=>{ pedidoInstalar = null; aviso('📱 App instalada'); });
async function protegerDatos(){
  try{ if(navigator.storage && navigator.storage.persist){ datosPersistentes = await navigator.storage.persisted() || await navigator.storage.persist(); } }catch(e){}
  return datosPersistentes;
}
function htmlProteger(){
  if(!avisosProteger()) return '';
  const app = navegadorDeApp();
  if(app) return `<div class="tarjeta proteger peligro-borde"><b>⚠️ Estás dentro de ${esc(app)}</b>
    <p>${esc(app)} abre los enlaces en su propio navegador: lo que anotes aquí se puede borrar o no aparecer después. Abre la app en ${esIOS() ? 'Safari' : 'Chrome'}:
    toca <b>⋯</b> (arriba o abajo) y elige <b>«Abrir en el navegador»</b>${esIOS() ? ' o «Abrir en Safari»' : ''}.</p>
    <div class="btns"><button class="btn prim" id="prCopiar">⧉ Copiar el enlace</button></div></div>`;
  if(esInstalada() || !esTelefono() || Date.now() < (ent(pref('instalarLuego')) || 0)) return '';
  const hay = S.sesiones.length > 0;
  const como = esIOS() ? `En Safari toca <b>Compartir</b> (el cuadrado con la flecha ↑) y elige <b>«Agregar a inicio»</b>.`
    : pedidoInstalar ? 'Toca «Instalar» y queda como una app más.' : 'En Chrome toca <b>⋮</b> y elige <b>«Instalar app»</b> o «Agregar a la pantalla principal».';
  return `<div class="tarjeta proteger"><b>📱 Instala ${APP} en tu teléfono</b>
    <p>Así abre a pantalla completa, funciona sin señal y ${esIOS() ? 'el iPhone no borra tus datos (Safari borra los de los sitios que no usas en 7 días)' : 'tus datos quedan más seguros'}. ${como}</p>
    ${esIOS() && hay ? `<p class="suave chico"><b>Importante:</b> en el iPhone la app instalada empieza vacía. Antes, toca «Guardar respaldo»; después ábrelo en la app instalada (Perfil → Cargar respaldo).</p>` : ''}
    <div class="btns">${pedidoInstalar ? '<button class="btn prim" id="prInstalar">📱 Instalar</button>' : ''}${esIOS() && hay ? '<button class="btn prim" id="prResp">⬇ Guardar respaldo</button>' : ''}<button class="btn" id="prLuego">Más tarde</button></div></div>`;
}
function enlazarProteger(){
  if($('#prCopiar')) $('#prCopiar').onclick = ()=>{ try{ navigator.clipboard.writeText(location.href.split('#')[0]).then(()=>aviso('Enlace copiado: pégalo en ' + (esIOS() ? 'Safari' : 'Chrome'))).catch(()=>aviso(location.href)); }catch(e){ aviso(location.href); } };
  if($('#prInstalar')) $('#prInstalar').onclick = async ()=>{ const e = pedidoInstalar; if(!e) return; pedidoInstalar = null; e.prompt(); try{ await e.userChoice; }catch(x){} vHoy(); };
  if($('#prResp')) $('#prResp').onclick = exportar;
  if($('#prLuego')) $('#prLuego').onclick = ()=>{ pref('instalarLuego', String(Date.now() + 14*86400000)); vHoy(); };
}
/* Estado para Perfil → Respaldo */
function htmlEstadoDatos(){
  const ult = ent(pref('ultimoRespaldo')) || 0, dias = ult ? Math.floor((Date.now() - ult) / 86400000) : null;
  const prot = datosPersistentes===true ? '🛡 Datos protegidos: el teléfono no los borra para liberar espacio.'
    : esInstalada() ? '🛡 App instalada.' : '⚠️ Sin protección completa: instala la app en la pantalla de inicio.';
  return `<p class="suave chico">${prot} ${dias===null ? 'Aún no guardas un respaldo.' : 'Último respaldo: ' + (dias===0 ? 'hoy' : dias===1 ? 'ayer' : 'hace ' + dias + ' días') + '.'}</p>`;
}
