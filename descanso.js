/* #TACFITNSCE — Descanso activo: la app lo anuncia en Inicio cuando las señales de fatiga lo piden (carga de la semana,
   forma física, alistamiento, días duros seguidos, días sin descanso, FC en reposo) y ofrece sesiones de recuperación
   de 10 a 40 min a esfuerzo 2-3 que se registran con un toque. Cuentan para la racha (hasta 2 por semana) y dan insignia.
   Base: recuperación activa a baja intensidad (zona 1, < 65 % FC máx.), consenso de sobreentrenamiento (Meeusen 2013),
   relación de carga aguda:crónica (Gabbett 2016). */
const ACTIVOS = [
  {id:'trote', ic:'🏃', n:'Trote muy suave', min:25, d:'Ritmo en que puedes conversar: bajo 65 % de tu FC máxima (zona 1).'},
  {id:'caminata', ic:'🚶', n:'Caminata', min:40, d:'Paso ágil en terreno plano y sin carga.'},
  {id:'bici', ic:'🚴', n:'Bicicleta suave', min:30, d:'Pedaleo liviano, sin resistencia alta.'},
  {id:'nado', ic:'🏊', n:'Nado suave', min:25, d:'Técnica y respiración; el agua descarga las articulaciones.'},
  {id:'movilidad', ic:'🤸', n:'Movilidad articular', min:15, d:'De cuello a tobillos: 10 movimientos lentos por articulación.'},
  {id:'rodillo', ic:'🧘', n:'Rodillo y estiramientos', min:20, d:'1 min de rodillo por zona cargada y estiramientos suaves de 30 s.'},
  {id:'respira', ic:'🌬️', n:'Respiración y relajación', min:10, d:'Respiración cuadrada 4-4-4-4 acostado: baja el estrés y mejora el sueño.'},
];
const esDescanso = s=>s.tipo==='descanso';
function senalesDescanso(){
  const out = [], add = (peso, t)=>out.push({peso, t}), hoy = hoyISO(), dia = n=>{ const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
  const es = estadoEntreno();
  if(es && es.ratio && es.k!=='recopilando'){ const r = fmtNum(Math.round(es.ratio*100)/100);
    if(es.ratio > 1.5) add(2, `Carga de esta semana muy alta frente a tu promedio (relación ${r}; sobre 1,5 aumenta el riesgo de lesión).`);
    else if(es.ratio > 1.3) add(1, `Carga de esta semana exigente (relación ${r}).`); }
  const F = formaFisica(1), u = F[F.length - 1];
  if(u && u.ctl > 10 && formaPct(u) < -35) add(2, 'Fatiga acumulada alta: tu forma física está en «Sobrecargado».');
  const dp = disposicionDia();
  if(dp){ if(dp.v < 25) add(2, `Alistamiento en condición roja (${dp.v}/100): dormiste o comiste mal, o llegas sin energía.`);
    else if(dp.v < 50) add(1, `Alistamiento en condición naranja (${dp.v}/100).`); }
  const maxRpe = f=>Math.max(0, ...S.sesiones.filter(s=>s.fecha===f && !esDescanso(s)).map(s=>+s.rpe || 0));
  if([1, 2, 3].every(n=>maxRpe(dia(n)) >= 8)) add(2, '3 días seguidos con esfuerzo 8 o más.');
  else if(maxRpe(dia(1)) >= 10) add(1, 'Ayer hiciste un esfuerzo máximo (10 de 10).');
  let seguidos = 0; while(S.sesiones.some(s=>s.fecha===dia(seguidos + 1) && !esDescanso(s))) seguidos++;
  if(seguidos >= 6) add(seguidos >= 9 ? 2 : 1, `${seguidos} días seguidos entrenando sin descanso.`);
  const fcHoy = (S.medidas || []).find(m=>m.fecha===hoy && m.fcr), base = (S.medidas || []).filter(m=>m.fcr && m.fecha < hoy && m.fecha >= dia(30));
  if(fcHoy && base.length >= 3){ const dl = fcHoy.fcr - base.reduce((a, m)=>a + m.fcr, 0) / base.length; if(dl >= 5) add(dl >= 8 ? 2 : 1, `FC en reposo ${Math.round(dl)} latidos sobre tu promedio de 30 días.`); }
  const peso = out.reduce((a, x)=>a + x.peso, 0);
  return {peso, nivel:peso >= 2 ? 'recomendado' : peso ? 'sugerido' : null, razones:out.sort((a, b)=>b.peso - a.peso)};
}
function htmlDescansoActivo(){
  const hoy = hoyISO(), ss = S.sesiones.filter(s=>s.fecha===hoy), hecho = ss.find(esDescanso), dd = S.diario[hoy] || {};
  if(hecho) return `<div class="descanso-card ok"><span class="dc-ic">🔋</span><div><small>Recuperación de hoy</small><b>Descanso activo cumplido · ${esc(hecho.metodo || '')} ${hecho.dur ? hecho.dur + ' min' : ''}</b></div></div>`;
  if(ss.length || dd.descanso) return '';   // «Hoy descanso» ya anotado: no insistir
  const D = senalesDescanso(); if(!D.nivel) return '';
  if(dd.sinDescanso || D.nivel==='sugerido') return `<button class="descanso-card mini" id="dcAbrir"><span class="dc-ic">🔋</span><div><small>${dd.sinDescanso ? 'Entrenas hoy: baja la intensidad' : 'Considera descanso activo'}</small><b>${esc(D.razones[0].t)}</b></div><span class="chev">›</span></button>`;
  return `<div class="descanso-card">
    <div class="dc-cab"><span class="dc-ic">🔋</span><div><small>Recomendación de hoy</small><b>Descanso activo</b></div></div>
    <ul class="dc-por">${D.razones.map(r=>`<li class="p${r.peso}">${esc(r.t)}</li>`).join('')}</ul>
    <p class="chico">Mueve el cuerpo de 10 a 40 min a esfuerzo 2-3 de 10: circula la sangre, se recuperan músculos y articulaciones, y mañana rindes más. Elige una:</p>
    <div class="dc-ops">${ACTIVOS.map(a=>`<button data-act="${a.id}"><span>${a.ic}</span><b>${a.n}</b><small class="num">${a.min} min</small></button>`).join('')}</div>
    <button class="link" id="dcIgnorar">Hoy entreno igual (bajaré la intensidad)</button>
  </div>`;
}
function dialogoDescanso(){
  const D = senalesDescanso();
  dialogo(`<div class="cab"><h2>🔋 Descanso activo</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    ${D.razones.length ? `<ul class="dc-por">${D.razones.map(r=>`<li class="p${r.peso}">${esc(r.t)}</li>`).join('')}</ul>` : '<p class="suave chico">Hoy no hay señales de fatiga, pero un día de recuperación siempre suma.</p>'}
    <div class="dc-ops">${ACTIVOS.map(a=>`<button data-act="${a.id}"><span>${a.ic}</span><b>${a.n}</b><small class="num">${a.min} min</small></button>`).join('')}</div>
    <p class="nota">Cuenta para tu racha (hasta 2 por semana) y para la insignia «Recuperación inteligente».</p>`, d=>enlazarOpciones(d));
}
function enlazarOpciones(raiz){ $$('[data-act]', raiz).forEach(b=>b.onclick = ()=>registrarDescanso(ACTIVOS.find(a=>a.id===b.dataset.act))); }
function registrarDescanso(a){
  dialogo(`<div class="cab"><h2>${a.ic} ${esc(a.n)}</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <p class="suave">${esc(a.d)}</p>
    <label>Minutos</label><input id="dcMin" type="number" inputmode="numeric" min="5" max="120" value="${a.min}">
    <label>Notas (opcional)</label><input id="dcNotas" placeholder="Ej.: piernas cargadas, buena sensación">
    <div class="btns"><button class="btn" data-cerrar>Cancelar</button><button class="btn prim" id="dcOk">Registrar descanso activo</button></div>`, d=>{
    $('#dcOk', d).onclick = ()=>{ const min = Math.max(5, Math.min(180, ent($('#dcMin', d).value) || a.min));
      S.sesiones.push({id:uid(), fecha:hoyISO(), creado:Date.now(), tipo:'descanso', titulo:'Descanso activo · ' + a.n, metodo:a.n, txt:min + ' min',
        notas:$('#dcNotas', d).value.trim(), dur:min, rpe:'2', recs:[]});
      guardar(); d.close(); aviso('🔋 Descanso activo registrado'); if(vistaActual==='hoy') vHoy(); };
  });
}
function enlazarDescanso(){
  const c = $('.descanso-card'); if(c) enlazarOpciones(c);
  if($('#dcAbrir')) $('#dcAbrir').onclick = dialogoDescanso;
  if($('#dcIgnorar')) $('#dcIgnorar').onclick = ()=>{ const h = hoyISO(), dd = S.diario[h] = S.diario[h] || {}; dd.sinDescanso = true; guardar(); const y = window.scrollY; vHoy(); window.scrollTo(0, y); };
  if($('#ldDesc')) $('#ldDesc').onclick = dialogoDescanso;
}
