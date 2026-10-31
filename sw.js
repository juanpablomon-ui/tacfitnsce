/* Guarda la app en el equipo para que funcione sin internet. Subir VERSION en cada cambio. */
const VERSION = 'tacfit-1.53';
const ARCHIVOS = ['./', 'index.html', 'privacidad.html', 'terminos.html', 'estilos.css', 'iconos.js', 'psf.js', 'movimientos.js', 'registro.js', 'escalar.js', 'tramos.js', 'esfuerzo.js', 'gps.js', 'protocolos.js', 'programa.js', 'diario.js', 'perfil.js', 'inbody.js', 'estado.js', 'recompensas.js', 'desafio.js', 'analizar.js', 'descanso.js', 'energia.js', 'plan.js', 'psfplan.js', 'mujer.js', 'agenda.js', 'social.js', 'proteger.js', 'bienvenida.js', 'pruebas.js', 'repetir.js', 'compartir.js', 'discos.js', 'afiches.js', 'importar.js', 'unidad.js', 'box.js', 'nube-config.js', 'nube.js', 'avisos.js', 'reloj_datos.js', 'plus.js', 'logro_hoy.js', 'app.js', 'manifest.webmanifest',
  'iconos/icono.svg', 'iconos/emblema_nsce_clara.png', 'iconos/emblema_nsce_oscura.png', 'iconos/icono-180.png', 'iconos/icono-192.png', 'iconos/icono-512.png'];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(VERSION).then(c=>c.addAll(ARCHIVOS))); self.skipWaiting(); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k))))); self.clients.claim(); });
/* Avisos al teléfono (avisos.js): los manda la función «aviso-tarea» de Supabase con {titulo, texto, url} */
self.addEventListener('push', e=>{ let d = {}; try{ d = e.data ? e.data.json() : {}; }catch(x){ d = {texto:e.data && e.data.text()}; }
  e.waitUntil(self.registration.showNotification(d.titulo || '#NSCE', {body:d.texto || '', icon:'iconos/icono-192.png', badge:'iconos/icono-192.png', data:{url:d.url || './'}, tag:d.tag || 'tarea'})); });
self.addEventListener('notificationclick', e=>{ e.notification.close(); const url = new URL((e.notification.data || {}).url || './', self.registration.scope).href;
  e.waitUntil(clients.matchAll({type:'window', includeUncontrolled:true}).then(ws=>{ const w = ws.find(x=>x.url.startsWith(self.registration.scope)); return w ? w.focus() : clients.openWindow(url); })); });
// Primero la red (para recibir cambios); sin conexión, lo guardado.
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  // «no-cache»: siempre pregunta al servidor si hay versión nueva (evita mezclar archivos viejos y nuevos)
  const mismo = new URL(e.request.url).origin===location.origin, rq = mismo && e.request.mode!=='navigate' ? new Request(e.request, {cache:'no-cache'}) : e.request;
  e.respondWith(fetch(rq).then(r=>{ const c = r.clone(); caches.open(VERSION).then(k=>k.put(e.request, c)); return r; })
    .catch(()=>caches.match(e.request, {ignoreSearch:true}).then(r=>r || caches.match('index.html'))));
});
