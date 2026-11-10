/* #NSCE — VO₂máx del reloj anotado a mano (27-oct-2026, pedido del usuario: tiene Garmin; al principio eran 6 datos diarios y pidió dejar
   solo el VO₂máx porque el resto era tedioso). Sirve con cualquier marca. S.reloj = {'AAAA-MM-DD': {vo2}}.
   Anotar es GRATIS (Pruebas → «⌚ VO₂máx de tu reloj»); usarlo es Plus (plus.js): el VO₂máx del estado del día y la edad física, y la curva. */
'use strict';
const serieReloj = (k, dias)=>{ const desde = masDias(hoyISO(), -(dias || 30)); return Object.entries(S.reloj || {}).filter(([f, d])=>f >= desde && d[k]!=null).map(([f, d])=>({f, v:d[k]})).sort((a, b)=>a.f < b.f ? 1 : -1); };
/* VO₂máx del reloj de los últimos 90 días (solo Plus) */
const vo2Reloj = ()=>{ if(!esPlus()) return null; const r = serieReloj('vo2', 90)[0]; return r ? {v:r.v, fecha:r.f} : null; };
function htmlVo2Reloj(){
  const u = serieReloj('vo2', 3650)[0];
  return `<button class="reloj-hoy" id="rlVo2"><span>⌚</span><span>${u ? `VO₂máx de tu reloj: <b class="num">${fmtNum(u.v)}</b> <span class="suave chico">(${verFecha(u.f)})</span>` : 'Anotar el VO₂máx de tu reloj'}</span><span class="link">${u ? 'actualizar' : '＋'}</span></button>`;
}
function enlazarVo2Reloj(){ if($('#rlVo2')) $('#rlVo2').onclick = dialogoVo2Reloj; }
function dialogoVo2Reloj(){
  const S_ = serieReloj('vo2', 3650), u = S_[0];
  dialogo(`<div class="cab"><h2>⌚ VO₂máx de tu reloj</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <p class="ahora-txt chico">👉 <b>Ahora:</b> en <b>Garmin Connect</b> toca <b>Rendimiento → VO₂ máximo</b> y copia el número. Anótalo solo cuando cambie.</p>
    <div class="fila"><div><label>VO₂máx (ml/kg/min)</label><input id="rlV" inputmode="decimal" placeholder="${u ? 'último: ' + fmtNum(u.v) : 'ej.: 48'}"></div>
      <div><label>Fecha</label><input id="rlF" type="date" value="${hoyISO()}" max="${hoyISO()}"></div></div>
    <details class="rl-que"><summary>❔ ¿Qué es?</summary><p>Tu motor aeróbico: cuánto oxígeno usa tu cuerpo al máximo. Garmin lo calcula al correr con GPS y pulso. Más alto = más resistencia. Ejemplo: 50 o más es muy bueno para un hombre de 40 años.</p></details>
    <div class="btns"><button class="btn" data-cerrar>Cancelar</button><button class="btn prim" id="rlOk">Guardar</button></div>
    <h3 style="margin:16px 0 6px">Tu VO₂máx en el tiempo</h3>
    ${esPlus() ? (S_.length ? `${sparkline(S_.slice().reverse(), false)}<ul class="lista">${S_.slice(0, 6).map(x=>`<li class="entre"><span>${verFecha(x.f)}</span><b class="num">${fmtNum(x.v)}</b></li>`).join('')}</ul>` : '<div class="vacio chico">Anota tu VO₂máx y aquí verás cómo cambia.</div>') : htmlCandadoPlus('garmin')}`, d=>{
    $('#rlOk', d).onclick = ()=>{ const v = num($('#rlV', d).value), f = $('#rlF', d).value || hoyISO();
      if(v==null || v < 20 || v > 90){ aviso('Anota un VO₂máx entre 20 y 90'); return; }
      S.reloj = S.reloj || {}; S.reloj[f] = Object.assign({}, S.reloj[f], {vo2:Math.round(v)}); guardar(); d.close(); aviso('⌚ VO₂máx guardado'); if(vistaActual==='psf') vPSF(); };
  });
}
