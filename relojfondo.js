/* #NSCE — El reloj con la pantalla bloqueada (23-nov-2026, revisión del mercado; maqueta aprobada por el usuario). Solo en la app del iPhone.
   (1) Actividad en vivo (complemento NSCERelojVivo, extensión NSCEReloj): el tiempo se ve en la pantalla bloqueada y en la Dynamic Island y lo
       cuenta el propio iPhone. Con un final conocido (AMRAP, EMOM, intervalos, tope) cuenta hacia atrás hasta el final; si no, hacia arriba.
   (2) Pitidos con la pantalla apagada: al salir de la app con el reloj corriendo se dejan programados como avisos con sonido (complemento
       LocalNotifications, ids 7500…) los cambios de minuto/ronda/descanso, la mitad, el último minuto y «¡Tiempo!»; al volver se borran
       (la app vuelve a pitar sola). La web no puede: ahí sigue igual. */
const RVIVO = ()=>esNativa() && window.Capacitor.Plugins && window.Capacitor.Plugins.NSCERelojVivo;
const ID_PITIDOS = 7500, MAX_PITIDOS = 50;
const segPlan = s=>isFinite(s.dur) ? s.dur : Infinity;

function datosVivo(){
  if(!R) return null;
  const e = estadoReloj(), ahora = Date.now() / 1000, titulo = (relojWod && relojWod.titulo) || (cfgReloj.modo==='cron' ? 'Por tiempo' : MODOS[cfgReloj.modo] || 'Reloj');
  const det = relojWod && typeof detalleCorto==='function' ? detalleCorto(relojWod, 4).join(' · ') : '';
  if(e.fin) return {titulo, detalle:det, fase:'¡Terminado!', pausa:PSF.verTiempo(R.total || 0)};
  const resto = R.plan.slice(e.i + 1).reduce((a, s)=>a + segPlan(s), 0) + (isFinite(e.resta) ? e.resta : Infinity);
  const fase = e.seg.fase==='prep' ? 'Preparados' : e.seg.fase==='descanso' ? 'Descanso' : (e.seg.txt || titulo);
  const out = {titulo, detalle:det, fase};
  if(!R.corriendo) out.pausa = PSF.verTiempo(e.seg.sube ? Math.floor(e.mostrar) : Math.ceil(e.mostrar));
  if(isFinite(resto)){ out.fin = ahora + resto; out.desde = ahora - (R.acc + (R.corriendo ? (Date.now() - R.t0) / 1000 : 0)); }
  else out.inicio = ahora - e.trabajo;
  return out;
}
let vivoActivo = false;
async function relojVivo(accion){
  const P = RVIVO(); if(!P) return;
  try{
    if(accion==='terminar' || !R){ if(vivoActivo){ vivoActivo = false; await P.terminar(); } return; }
    const D = datosVivo(); if(!D) return;
    if(accion==='iniciar' || !vivoActivo){ const r = await P.iniciar(D); vivoActivo = !!(r && r.ok); }
    else await P.actualizar(D);
  }catch(e){}
}
/* Avisos futuros desde ahora: [{at (ms), t}] */
function pitidosFuturos(){
  if(!R || !R.corriendo || R.fin) return [];
  const e = estadoReloj(); if(e.fin) return [];
  const ahora = Date.now(), out = [], titulo = (relojWod && relojWod.titulo) || MODOS[cfgReloj.modo] || 'Reloj';
  let t = ahora + (isFinite(e.resta) ? e.resta * 1000 : Infinity);
  const dentro = (seg, ini)=>{ const d = segPlan(seg); if(!isFinite(d) || seg.fase==='prep' || d < 120) return;
    [[d / 2, 'Mitad del tiempo'], [d - 60, 'Último minuto']].forEach(([s, txt])=>{ const at = ini + s * 1000; if(at > ahora + 1500) out.push({at, t:txt}); }); };
  dentro(e.seg, ahora - e.t * 1000);
  let nTrab = R.plan.slice(0, e.i + 1).filter(x=>x.fase==='trabajo').length;
  for(let k = e.i + 1; k < R.plan.length && isFinite(t); k++){
    const s = R.plan[k]; if(s.fase==='trabajo') nTrab++;
    out.push({at:t, t:s.fase==='descanso' ? 'Descanso' : cfgReloj.modo==='emom' ? 'Minuto ' + nTrab : R.plan[k - 1] && R.plan[k - 1].fase==='prep' ? '¡Vamos!' : (s.txt || '¡Vamos!')});
    dentro(s, t); t += segPlan(s) * 1000;
  }
  if(isFinite(t)) out.push({at:t, t:'¡Tiempo! ' + titulo + ' terminado'});
  return out.sort((a, b)=>a.at - b.at).slice(0, MAX_PITIDOS).map(x=>Object.assign(x, {titulo}));
}
async function programarPitidos(){
  const P = typeof LN==='function' && LN(); if(!P) return;
  await cancelarPitidos(); const L = pitidosFuturos(); if(!L.length) return;
  try{ await P.schedule({notifications:L.map((x, i)=>({id:ID_PITIDOS + i, title:'NSCE · ' + x.titulo, body:x.t, schedule:{at:new Date(x.at), allowWhileIdle:true}}))}); }catch(e){}
}
async function cancelarPitidos(){
  const P = typeof LN==='function' && LN(); if(!P) return;
  try{ await P.cancel({notifications:Array.from({length:MAX_PITIDOS}, (_, k)=>({id:ID_PITIDOS + k}))}); }catch(e){}
}
/* Permiso de avisos la primera vez que se usa el reloj en la app del iPhone (así suenan los pitidos con la pantalla apagada) */
async function permisoPitidos(){
  const P = typeof LN==='function' && LN(); if(!P || pref('permPitidos')==='1') return;
  pref('permPitidos', '1'); try{ await P.requestPermissions(); }catch(e){}
}
if(typeof document!=='undefined') document.addEventListener('visibilitychange', ()=>{
  if(!esNativa()) return;
  if(document.visibilityState==='hidden'){ if(R && R.corriendo && !R.fin) programarPitidos(); }
  else { cancelarPitidos(); if(R && !R.fin) relojVivo('actualizar'); }
});
