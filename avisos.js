/* #NSCE — Avisos al teléfono (28-oct-2026): «tu instructor publicó la tarea de hoy» y (29-oct-2026) el recordatorio de racha
   («🔥 No cortes tu racha»: a la hora que elijas, solo si hoy no has entrenado). Web Push: el teléfono se suscribe con la clave pública
   (NUBE_VAPID en nube-config.js) y guarda su suscripción en la tabla public.avisos, con la hora del recordatorio (racha_hora), el último día
   entrenado (ultimo) y la racha (racha), que se actualizan al guardar (sincronizarRacha). La función «aviso-tarea» de Supabase
   (nube/aviso-tarea) manda los dos avisos: la tarea por el webhook de la tabla tareas y la racha por una tarea programada cada hora.
   El aviso lo muestra sw.js. En el iPhone solo funciona con la app instalada en la pantalla de inicio (iOS 16.4 o más nuevo).
   Se activa en Ajustes → 🔔 Avisos (con la cuenta en la nube). */
'use strict';
const avisosSoportados = ()=>'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && !!window.NUBE_VAPID;
const avisosActivos = ()=>pref('avisos')==='1' && avisosSoportados() && Notification.permission==='granted';
const claveBytes = b64=>{ const s = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - b64.length % 4) % 4)); return Uint8Array.from(s, c=>c.charCodeAt(0)); };
const b64url = buf=>btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
/* Hora del recordatorio de racha (0–23) o null si está apagado; por omisión a las 20:00 */
const horaRacha = ()=>{ const v = pref('rachaHora'); return v==='no' ? null : v!=='' && v!=null && !isNaN(+v) ? +v : 20; };
/* Resumen del instructor (30-oct-2026): solo si tiene una unidad en línea; hora 21:00 por omisión, 'no' = apagado */
const esInstructorNube = ()=>typeof mando==='function' && mando().unidades.some(u=>u.nube);
const horaCumpl = ()=>{ if(!esInstructorNube()) return null; const v = pref('cumplHora'); return v==='no' ? null : v!=='' && v!=null && !isNaN(+v) ? +v : 21; };
/* Último día que cuenta para la racha (hasta hoy) y la racha actual: lo que la nube necesita para no avisar si ya entrenaste */
function datosRacha(){ const f = fechasRacha().filter(x=>x <= hoyISO()).sort(); return {ultimo:f.length ? f[f.length - 1] : null, racha:racha(), cumpl_hora:horaCumpl()}; }
async function activarAvisos(){
  if(!conectado()){ dialogoIngresar(()=>{ vPerfil(); activarAvisos(); }); return; }
  if(!avisosSoportados()){ aviso(esIOS() && !esInstalada() ? 'Primero instala la app en tu pantalla de inicio' : 'Este teléfono no permite avisos', 3500); return; }
  const permiso = await Notification.requestPermission();
  if(permiso!=='granted'){ aviso('Sin permiso: actívalo en Ajustes del teléfono → Notificaciones', 4000); return; }
  try{
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:claveBytes(window.NUBE_VAPID)});
    await upsert('avisos', [Object.assign({endpoint:sub.endpoint, p256dh:b64url(sub.getKey('p256dh')), auth:b64url(sub.getKey('auth')), racha_hora:horaRacha()}, datosRacha())], 'endpoint');
    pref('avisos', '1'); aviso('🔔 Avisos activados'); vPerfil();
  }catch(e){ aviso('No se pudieron activar los avisos: ' + (e.message || e), 4000); }
}
async function apagarAvisos(){
  try{ const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
    if(sub){ if(conectado()) await api('avisos?endpoint=eq.' + encodeURIComponent(sub.endpoint), {method:'DELETE'}); await sub.unsubscribe(); } }catch(e){}
  pref('avisos', ''); aviso('Avisos apagados'); vPerfil();
}
/* Cambia la hora del recordatorio en todos los teléfonos del usuario (la regla de la tabla solo deja tocar los propios) */
async function cambiarHoraRacha(v){
  pref('rachaHora', v==='' ? 'no' : String(v));
  if(!avisosActivos() || !conectado()) return;
  try{ await api('avisos?endpoint=neq.', {method:'PATCH', body:{racha_hora:horaRacha()}}); aviso(horaRacha()==null ? 'Recordatorio de racha apagado' : '🔥 Te recuerdo a las ' + horaRacha() + ':00 si no has entrenado'); }
  catch(e){ aviso('No se pudo guardar: ' + (e.message || e), 3500); }
}
async function cambiarHoraCumpl(v){
  pref('cumplHora', v==='' ? 'no' : String(v));
  if(!avisosActivos() || !conectado()) return;
  try{ await api('avisos?endpoint=neq.', {method:'PATCH', body:{cumpl_hora:horaCumpl()}}); aviso(horaCumpl()==null ? 'Resumen de tu unidad apagado' : '📋 Te aviso a las ' + horaCumpl() + ':00 quién no ha cumplido la tarea'); }
  catch(e){ aviso('No se pudo guardar: ' + (e.message || e), 3500); }
}
/* Después de guardar (programarRevision): avisa a la nube el último día entrenado y la racha. Solo si cambió, para no gastar. */
let tRacha = null;
function sincronizarRacha(){
  if(!avisosActivos() || !conectado()) return;
  clearTimeout(tRacha); tRacha = setTimeout(async ()=>{
    const d = datosRacha(), k = d.ultimo + '|' + d.racha + (d.cumpl_hora!=null ? '|' + d.cumpl_hora : ''); if(pref('rachaNube')===k) return;
    try{ await api('avisos?endpoint=neq.', {method:'PATCH', body:d}); pref('rachaNube', k); }catch(e){}
  }, 1500);
}
/* También al abrir la app y al volver a ella (29-oct-2026): si no, la nube no sabía la racha de quien no había guardado nada desde que activó los avisos */
setTimeout(()=>{ try{ sincronizarRacha(); }catch(e){} }, 3000);
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') try{ sincronizarRacha(); }catch(e){} });
/* Sección «🔔 Avisos» de Ajustes (perfil.js) */
function resumenAvisos(){ return avisosActivos() ? 'Activados' + (horaRacha()!=null ? ' · racha ' + horaRacha() + ':00' : '') : 'Apagados'; }
function htmlAvisos(){
  if(!window.NUBE_VAPID || !nubeLista()) return '';
  const U = S.unidad, falta = esIOS() && !esInstalada();
  const que = `<ul class="chico av-que"><li>🔥 <b>Racha:</b> si a la hora que elijas no has entrenado, te recuerdo para que no la cortes.</li>${U && U.nube ? '<li>👥 <b>Tu unidad:</b> cuando tu instructor publique la tarea de hoy o mañana.</li>' : ''}${esInstructorNube() ? '<li>📋 <b>Instructor:</b> quiénes no han cumplido la tarea del día.</li>' : ''}</ul>`;
  if(!conectado()) return `<div class="tarjeta avisos-off">${que}${falta ? '<p class="nota">👉 En el iPhone primero instala la app: Compartir → «Agregar a pantalla de inicio», y ábrela desde ahí.</p>' : ''}<p class="nota">Los avisos llegan por la nube: entra con tu correo.</p><button class="btn ancho" id="avIngresar">☁️ Ingresar con mi correo</button></div>`;
  if(!avisosActivos()) return `<div class="tarjeta avisos-off">${que}<button class="btn prim ancho" id="avActivar">🔔 Activar avisos</button>
    <p class="nota">${falta ? '👉 En el iPhone primero instala la app: Compartir → «Agregar a pantalla de inicio», y ábrela desde ahí.' : 'El teléfono te pedirá permiso para mostrar notificaciones.'}</p></div>`;
  const h = horaRacha();
  return `<div class="tarjeta avisos-on"><div class="entre"><span>🔔 <b>Avisos activados</b> en este teléfono</span><button class="link chico" id="avApagar">Apagar</button></div>
    <label>🔥 Recordatorio de racha</label><select id="avHora"><option value="">Apagado</option>${Array.from({length:17}, (_, i)=>i + 6).map(x=>`<option value="${x}"${x===h ? ' selected' : ''}>${x}:00</option>`).join('')}</select>
    <p class="nota">Solo si ese día no has entrenado ni marcado descanso. Máximo un aviso al día.</p>
    ${U && U.nube ? '<p class="chico">👥 También te aviso cuando tu instructor publique la tarea de hoy o mañana.</p>' : ''}
    ${esInstructorNube() ? `<label>📋 Resumen de tu unidad</label><select id="avCumpl"><option value="">Apagado</option>${Array.from({length:18}, (_, i)=>i + 6).map(x=>`<option value="${x}"${x===horaCumpl() ? ' selected' : ''}>${x}:00</option>`).join('')}</select>
      <p class="nota" style="margin-bottom:0">Los días con tarea, a esa hora te digo cuántos alumnos no la han cumplido y quiénes.</p>` : ''}</div>`;
}
function enlazarAvisos(){
  if($('#avActivar')) $('#avActivar').onclick = activarAvisos; if($('#avApagar')) $('#avApagar').onclick = apagarAvisos;
  if($('#avIngresar')) $('#avIngresar').onclick = ()=>dialogoIngresar(()=>vPerfil());
  if($('#avCumpl')) $('#avCumpl').onchange = e=>cambiarHoraCumpl(e.target.value);
  if($('#avHora')) $('#avHora').onchange = e=>{ cambiarHoraRacha(e.target.value); const r = $('#pfAvisos .pf-res'); if(r) r.textContent = resumenAvisos(); };
}
