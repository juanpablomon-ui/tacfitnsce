/* #NSCE — Desafío de la semana (22-oct-2026, etapa «Inicio simple»): la meta de entrenamientos de la semana (perfil.meta) más un
   reto extra que cambia cada semana (DESAFIOS, rota por el número de semana). Todo se calcula de los datos: también las semanas pasadas,
   así los desafíos cumplidos suman puntos de mérito (desafiosCumplidos → puntos() en recompensas.js). */
const DESAFIOS = [
  {id:'hero', t:'1 Hero WOD', d:'Cualquier WOD de la línea Héroes', ok:ss=>ss.some(s=>POPULARES.some(p=>p.cat==='heroes' && p.titulo===s.titulo))},
  {id:'km', t:'5 km corriendo o marchando', d:'Suma lo de toda la semana', ok:ss=>acumular(ss).km >= 5},
  {id:'activo', t:'1 descanso activo', d:'Trote suave, movilidad, nado…', ok:ss=>ss.some(s=>s.tipo==='descanso')},
  {id:'agua', t:'Meta de agua 3 días', d:'El vaso de «¿Cómo llegas hoy?»', ok:(ss, dias)=>dias.filter(f=>(S.diario[f] || {}).agua >= metaAgua(f).total).length >= 3},
  {id:'fuerza', t:'2 sesiones con pesas', d:'Levantamientos o WOD con barra, mancuernas o kettlebell', ok:ss=>ss.filter(s=>s.w && JSON.stringify(s.w).match(/"peso":"?\d/)).length >= 2},
  {id:'bien', t:'Dormir «Bien» 3 días', d:'Márcalo en «¿Cómo llegas hoy?»', ok:(ss, dias)=>dias.filter(f=>(S.diario[f] || {}).sueno==='2').length >= 3},
];
const numSemana = f=>Math.floor((new Date(f + 'T12:00:00') - new Date('2024-01-01T12:00:00')) / (7*86400000));   // 2024-01-01 fue lunes
function desafioSemana(lunes){
  const ini = iso(lunes), dias = Array.from({length:7}, (_, i)=>{ const d = new Date(lunes); d.setDate(d.getDate() + i); return iso(d); });
  const ss = S.sesiones.filter(s=>s.fecha >= ini && s.fecha <= dias[6]), meta = ent(S.perfil.meta) || 4;
  const hechos = new Set(ss.filter(s=>s.tipo!=='descanso').map(s=>s.fecha)).size, extra = DESAFIOS[((numSemana(ini) % DESAFIOS.length) + DESAFIOS.length) % DESAFIOS.length];
  const okExtra = !!extra.ok(ss, dias);
  return {meta, hechos, extra, okExtra, cumplido:hechos >= meta && okExtra};
}
function desafiosCumplidos(){
  if(!S.sesiones.length) return 0;
  const prim = S.sesiones.reduce((a, s)=>s.fecha < a ? s.fecha : a, hoyISO()), d = new Date(prim + 'T12:00:00'); d.setDate(d.getDate() - (d.getDay() + 6) % 7);
  let n = 0; for(let k = 0; k < 156 && iso(d) <= hoyISO(); k++){ if(desafioSemana(new Date(d)).cumplido) n++; d.setDate(d.getDate() + 7); }
  return n;
}
function htmlDesafio(){
  const D = desafioSemana(inicioSemana()), pt = puntos(), pct = Math.min(100, Math.round(D.hechos / D.meta * 100));
  return `<div class="tarjeta desafio ${D.cumplido ? 'cumplido' : ''}">
    <div class="entre"><span class="etiqueta">Desafío de la semana</span>${D.cumplido ? '<span class="chip MB">¡Cumplido! +40 pts</span>' : '<span class="suave chico">+40 pts</span>'}</div>
    <div class="ds-fila"><span class="ds-ok ${D.hechos >= D.meta ? 'si' : ''}">${D.hechos >= D.meta ? '✓' : ''}</span><div><b>${D.meta} entrenamientos</b> <span class="suave num">· ${Math.min(D.hechos, D.meta)}/${D.meta}</span>
      <div class="ds-barra"><span style="width:${pct}%"></span></div></div></div>
    <div class="ds-fila"><span class="ds-ok ${D.okExtra ? 'si' : ''}">${D.okExtra ? '✓' : ''}</span><div><b>${esc(D.extra.t)}</b><div class="suave chico">${esc(D.extra.d)}</div></div></div>
    <button class="ds-rango" id="bRango2"><span>🎖️ <b>${esc(pt.rango)}</b>${pt.sig ? ` · te faltan <b class="num">${pt.falta.toLocaleString('es-CL')}</b> pts para ${esc(pt.sig)}` : ' · rango máximo'}</span>
      <span class="ds-barra"><span style="width:${pt.pct}%"></span></span></button>
  </div>`;
}

/* ---------- Celebración al guardar un entrenamiento (etapa 5, 22-oct-2026) ----------
   Pantalla con confeti, el resultado, los récords, los puntos ganados, la barra al próximo rango (o «¡Subiste a …!»), el desafío de la
   semana y la racha; «Compartir» abre las fotos para redes. Solo entrenamientos nuevos (no al editar ni al planificar). En las pruebas
   automáticas no sale (navigator.webdriver), salvo window.__celebrar. */
const FRASES_CEL = ['¡Bien hecho!', '¡Otro más!', '¡Así se hace!', '¡Cumplido!', '¡Sumando!', '¡Vamos que se puede!'];
const celebrarActivo = ()=>window.__celebrar || !navigator.webdriver;
function antesDeGuardar(){ return celebrarActivo() ? {pt:puntos(), D:desafioSemana(inicioSemana())} : null; }
function celebrarGuardado(s, antes){
  if(!antes || !s) return;
  const pt = puntos(), D = desafioSemana(inicioSemana()), gan = Math.max(0, pt.total - antes.pt.total), subio = pt.idx > antes.pt.idx, r = racha();
  const recs = esRecord(s), desNuevo = D.cumplido && !antes.D.cumplido;
  const conf = Array.from({length:36}, (_, i)=>`<i style="left:${(i * 37) % 100}%;background:${['var(--acento)', '#36b6ea', '#ff5d4f', '#b48cf0', '#4fd17a'][i % 5]};animation-delay:${(i % 9) * 0.12}s;animation-duration:${2.2 + (i % 5) * 0.35}s"></i>`).join('');
  try{ if(navigator.vibrate) navigator.vibrate([60, 40, 120]); }catch(e){}
  dialogo(`<div class="cel"><div class="confeti" aria-hidden="true">${conf}</div>
    <div class="cel-sello">${subio ? '🎖️' : '✓'}</div>
    <h2>${subio ? '¡Subiste a ' + esc(pt.rango) + '!' : FRASES_CEL[S.sesiones.length % FRASES_CEL.length]}</h2>
    <div class="cel-tit">${esc(s.titulo || etiquetaTipo(s))}</div>
    ${s.txt ? `<div class="cel-res num">${esc(resCorto(s))}</div>` : ''}
    ${s.nivel ? `<div class="cel-niv">${NOM_NIVEL[s.nivel]}${s.enMeta==='ok' ? ' · ✓ dentro de la meta' : s.enMeta==='lento' ? ' · sobre la meta: la próxima vez prueba un nivel más simple' : s.enMeta==='rapido' ? ' · bajo la meta: ¡la próxima vez sube de nivel!' : ''}</div>` : ''}
    ${recs.length ? `<div class="cel-rec">🏆 ${recs.length===1 ? 'Nuevo récord' : recs.length + ' récords nuevos'}: ${esc(recs.map(x=>x.nombre).slice(0, 2).join(', '))}</div>` : ''}
    <div class="cel-pts num">+${gan.toLocaleString('es-CL')} pts</div>
    <div class="cel-fila"><span>🎖️ ${esc(pt.rango)}${pt.sig ? ` · faltan ${pt.falta.toLocaleString('es-CL')} para ${esc(pt.sig)}` : ''}</span>
      <span class="ds-barra"><span class="cel-anim" style="--de:${subio ? 0 : antes.pt.pct}%;--a:${pt.pct}%"></span></span></div>
    <div class="cel-fila"><span>${desNuevo ? '🎯 ¡Desafío de la semana cumplido! +40 pts' : `Desafío: ${Math.min(D.hechos, D.meta)}/${D.meta} entrenamientos${D.okExtra ? ' · ✓ ' + esc(D.extra.t) : ' · falta ' + esc(D.extra.t.toLowerCase())}`}</span></div>
    ${r ? `<div class="cel-fila"><span>🔥 Racha de ${r} ${r===1 ? 'día' : 'días'}</span></div>` : ''}
    <div class="btns"><button class="btn" id="celComp">↗ Compartir</button><button class="btn prim" data-cerrar>Listo</button></div></div>`, d=>{
    d.classList.add('dlg-cel');
    $('#celComp', d).onclick = ()=>compartirSesion(s);
  });
}
