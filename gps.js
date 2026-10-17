/* #TACFITNSCE — GPS del teléfono para el reloj guiado por tramos: mide la distancia de cada tramo, cambia solo al completar los tramos por
   distancia y anota los metros de los tramos por tiempo (ej. cada intervalo del Noruego). Solo funciona con la app abierta y la pantalla
   encendida (una app web no usa el GPS en segundo plano). Filtra lecturas imprecisas (> 35 m) y saltos imposibles (> 12 m/s). */
const GPS_MAX_PREC = 35, GPS_MAX_VEL = 12, GPS_MIN_PASO = 2;
const hayGPS = ()=>typeof navigator!=='undefined' && !!navigator.geolocation;
function distGPS(a, b){
  const R0 = 6371000, r = x=>x * Math.PI / 180, dLat = r(b.lat - a.lat), dLon = r(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R0 * Math.asin(Math.sqrt(h));
}
function gpsIniciar(){
  if(!R || !hayGPS()) return false;
  R.gps = {total:0, last:null, prec:null, estado:'buscando señal', segIdx:null, segIni:0, porSeg:{}, watch:null};
  try{ R.gps.watch = navigator.geolocation.watchPosition(gpsPosicion, gpsError, {enableHighAccuracy:true, maximumAge:0, timeout:20000}); }catch(e){ R.gps.estado = 'sin GPS'; }
  return true;
}
function gpsPosicion(pos){
  const G = R && R.gps; if(!G || R.fin) return;
  const c = pos.coords; G.prec = Math.round(c.accuracy);
  if(c.accuracy > GPS_MAX_PREC){ G.estado = 'señal débil'; return; }
  G.estado = 'bueno';
  const p = {lat:c.latitude, lon:c.longitude, t:pos.timestamp || Date.now()};
  if(!R.corriendo){ G.last = null; return; }   // en pausa no suma metros
  if(G.last){ const d = distGPS(G.last, p), dt = (p.t - G.last.t) / 1000;
    if(dt > 0 && d / dt > GPS_MAX_VEL) return;   // salto imposible: se ignora
    if(d < GPS_MIN_PASO) return;                 // ruido estando quieto
    G.total += d; }
  G.last = p;
}
function gpsError(e){ if(R && R.gps) R.gps.estado = e && e.code===1 ? 'sin permiso' : 'sin señal'; }
/* Cierra el tramo en curso y apaga el GPS (al terminar o descartar) */
function gpsCerrar(){
  const G = R && R.gps; if(!G) return;
  if(G.segIdx!=null){ G.porSeg[G.segIdx] = Math.round(G.total - G.segIni); G.segIdx = null; }
  if(G.watch!=null && hayGPS()){ try{ navigator.geolocation.clearWatch(G.watch); }catch(e){} G.watch = null; }
}
/* Desde tic(): distancia del tramo actual; si el tramo es por distancia y se completó, pasa solo al siguiente */
function gpsTramo(e){
  const G = R && R.gps; if(!G || !e || !e.seg || !e.seg.tramo) return null;
  if(G.segIdx!==e.i){ if(G.segIdx!=null) G.porSeg[G.segIdx] = Math.round(G.total - G.segIni); G.segIdx = e.i; G.segIni = G.total; }
  const t = e.seg.tramo, d = G.total - G.segIni, meta = t.med==='dist' ? metrosTramo(t) : null;
  if(meta && d >= meta && R.corriendo){
    G.porSeg[e.i] = Math.round(d); R.plan[e.i].dur = Math.max(1, e.t); G.segIdx = e.i + 1; G.segIni = G.total; sonido(880, 0.45);
    return {d, meta, listo:true}; }
  return {d, meta};
}
function textoGPS(g, e){
  const G = R.gps; if(!g) return '';
  const ritmo = g.d > 50 && e.t > 10 ? ' · ' + verRitmo(e.t / (g.d / 1000)) : '';
  return '📍 ' + verDist(Math.round(g.d)) + (g.meta ? ' de ' + verDist(g.meta) : '') + ritmo + ' · GPS ' + G.estado + (G.prec && G.estado==='bueno' ? ' (±' + G.prec + ' m)' : '');
}
