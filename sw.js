/* Guarda la app en el equipo para que funcione sin internet. Subir VERSION en cada cambio. */
const VERSION = 'tacfit-1.03';
const ARCHIVOS = ['./', 'index.html', 'estilos.css', 'iconos.js', 'psf.js', 'movimientos.js', 'registro.js', 'tramos.js', 'esfuerzo.js', 'gps.js', 'protocolos.js', 'programa.js', 'diario.js', 'perfil.js', 'estado.js', 'recompensas.js', 'analizar.js', 'descanso.js', 'energia.js', 'plan.js', 'agenda.js', 'social.js', 'compartir.js', 'discos.js', 'unidad.js', 'nube-config.js', 'nube.js', 'app.js', 'manifest.webmanifest',
  'iconos/icono.svg', 'iconos/calavera_clara.png', 'iconos/calavera_oscura.png', 'iconos/icono-180.png', 'iconos/icono-192.png', 'iconos/icono-512.png'];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(VERSION).then(c=>c.addAll(ARCHIVOS))); self.skipWaiting(); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k))))); self.clients.claim(); });
// Primero la red (para recibir cambios); sin conexión, lo guardado.
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  // «no-cache»: siempre pregunta al servidor si hay versión nueva (evita mezclar archivos viejos y nuevos)
  const mismo = new URL(e.request.url).origin===location.origin, rq = mismo && e.request.mode!=='navigate' ? new Request(e.request, {cache:'no-cache'}) : e.request;
  e.respondWith(fetch(rq).then(r=>{ const c = r.clone(); caches.open(VERSION).then(k=>k.put(e.request, c)); return r; })
    .catch(()=>caches.match(e.request, {ignoreSearch:true}).then(r=>r || caches.match('index.html'))));
});
