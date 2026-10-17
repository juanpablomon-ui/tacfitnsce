/* #TACFITNSCE — Agenda: planificar libremente semanas y meses. Cada día lleva entrenamientos planificados (armados como en el
   registro, de la biblioteca, de favoritos o copiados de uno anterior), descanso o descanso activo. Copiar día, copiar o repetir la
   semana, mover, y «semanas tipo» guardadas. Lo planificado vive en S.planificadas y no cuenta hasta registrarlo. */
let vistaAgenda = null, lunesAgenda = null, mesAgenda = null;
const planDe = f=>(S.planificadas || []).filter(p=>p.fecha===f);
const hechasDe = f=>S.sesiones.filter(s=>s.fecha===f);
function nombrePlan(p){
  if(p.tipo==='descanso') return 'Descanso'; if(p.tipo==='activo') return 'Descanso activo';
  return p.titulo || (p.w && p.w.uno && nomMov(p.w.uno)) || (p.w && (estiloDe(p.w.estilo) || {}).n) || 'Entrenamiento';
}
const grupoPlan = p=>p.tipo==='activo' || p.tipo==='descanso' ? 'desc' : p.w ? grupoDe({w:p.w}) : 'gim';
const icoPlan = p=>p.tipo==='descanso' ? '😴' : p.tipo==='activo' ? '🔋' : (GRUPOS[grupoPlan(p)] || {ic:'🗓'}).ic;
const DIAS_AG = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
function agregarPlan(f, x){ (S.planificadas = S.planificadas || []).push(Object.assign({id:uid(), fecha:f, creado:Date.now()}, x)); }
const copiaPlan = (p, f)=>Object.assign(JSON.parse(JSON.stringify(p)), {id:uid(), fecha:f, creado:Date.now()});

function vAgenda(){
  vistaAgenda = vistaAgenda || pref('vistaAgenda') || 'semana';
  lunesAgenda = lunesAgenda || lunesDe(hoyISO());
  const hoy = hoyISO(), cuerpo = vistaAgenda==='semana' ? htmlSemanaAgenda(hoy) : htmlMesAgenda(hoy);
  $('#diarioCuerpo').innerHTML = `<div class="segmentos" id="agVista" style="margin-bottom:10px"><button data-av="semana" class="${vistaAgenda==='semana' ? 'activa' : ''}">Semana</button><button data-av="mes" class="${vistaAgenda==='mes' ? 'activa' : ''}">Mes</button></div>${cuerpo}`;
  $$('#agVista button').forEach(b=>b.onclick = ()=>{ vistaAgenda = b.dataset.av; pref('vistaAgenda', vistaAgenda); if(vistaAgenda==='mes') mesAgenda = lunesAgenda.slice(0, 7); vAgenda(); });
  enlazarAgenda();
}
function itemsDia(f, hoy){
  const hs = hechasDe(f).map(s=>`<button class="ag-it hecho g-${grupoDe(s)}" data-sid="${s.id}"><span>✓</span><b>${esc(s.titulo || etiquetaTipo(s))}</b>${s.txt ? `<small class="num">${esc(s.txt.split(' (')[0])}</small>` : ''}</button>`);
  const ps = planDe(f).map(p=>`<button class="ag-it plan g-${grupoPlan(p)} ${f < hoy ? 'atrasado' : ''}" data-pid="${p.id}"><span>${icoPlan(p)}</span><b>${esc(nombrePlan(p))}</b>${f < hoy && !p.tipo ? '<small>sin registrar</small>' : ''}</button>`);
  return hs.concat(ps).join('');
}
function htmlSemanaAgenda(hoy){
  const L = lunesAgenda, D = masDias(L, 6), dias = Array.from({length:7}, (_, k)=>masDias(L, k));
  const nPlan = dias.reduce((a, f)=>a + planDe(f).filter(p=>!p.tipo).length, 0), nHechas = dias.reduce((a, f)=>a + hechasDe(f).filter(s=>s.tipo!=='descanso').length, 0);
  const fc = f=>{ const d = new Date(f + 'T12:00:00'); return d.getDate() + ' ' + MESES_C[d.getMonth()]; };
  return `<div class="tarjeta ag-cab"><div class="entre"><button class="btn chico-btn" id="agAnt" aria-label="Semana anterior">‹</button>
      <div style="text-align:center"><div class="etiqueta">${L===lunesDe(hoy) ? 'Esta semana' : L > hoy ? 'Próxima' + (diasEntre(lunesDe(hoy), L) > 7 ? 's' : '') : 'Semana pasada'}</div><b>${fc(L)} – ${fc(D)}</b></div>
      <button class="btn chico-btn" id="agSig" aria-label="Semana siguiente">›</button></div>
      <div class="ag-res suave chico num">${nHechas} hecho${nHechas===1 ? '' : 's'} · ${nPlan} planificado${nPlan===1 ? '' : 's'}</div></div>
    <div class="ag-sem">${dias.map((f, k)=>`<div class="ag-dia ${f===hoy ? 'hoy' : ''} ${f < hoy ? 'pasado' : ''}">
      <div class="ag-f"><b>${DIAS_AG[k]}</b><span class="num">${+f.slice(8)}</span></div>
      <div class="ag-items">${itemsDia(f, hoy) || '<span class="suave chico">—</span>'}</div>
      <button class="ag-mas" data-agf="${f}" aria-label="Planificar el ${verFecha(f)}">＋</button></div>`).join('')}</div>
    <div class="ag-acc">
      <button class="btn" id="agCopiar">⧉ Copiar a la semana siguiente</button>
      <button class="btn" id="agRepetir">🔁 Repetir esta semana…</button>
      <button class="btn" id="agGuardarTipo">💾 Guardar como semana tipo</button>
      <button class="btn" id="agAplicarTipo">📥 Aplicar una semana tipo${(S.semanasTipo || []).length ? ' (' + S.semanasTipo.length + ')' : ''}</button>
    </div>
    <p class="nota">Toca ＋ para planificar un día. Toca un planificado para registrarlo, editarlo, moverlo o copiarlo. Lo planificado no cuenta como entrenado hasta que lo registras.</p>`;
}
function htmlMesAgenda(hoy){
  mesAgenda = mesAgenda || hoy.slice(0, 7);
  const [y, m] = mesAgenda.split('-').map(Number), ini = (new Date(y, m - 1, 1).getDay() + 6) % 7, n = new Date(y, m, 0).getDate(), celdas = [];
  for(let i = 0; i < ini; i++) celdas.push('<div></div>');
  for(let d = 1; d <= n; d++){ const f = iso(new Date(y, m - 1, d)), hs = hechasDe(f), ps = planDe(f);
    celdas.push(`<button class="ag-cel ${f===hoy ? 'hoy' : ''} ${hs.length ? 'con' : ''} ${ps.length ? 'pl' : ''}" data-agdia="${f}"><span class="num">${d}</span>
      <span class="ag-pts">${hs.slice(0, 3).map(s=>`<i class="h g-${grupoDe(s)}"></i>`).join('')}${ps.slice(0, 3).map(p=>`<i class="p g-${grupoPlan(p)}"></i>`).join('')}</span></button>`); }
  const del = (S.planificadas || []).filter(p=>p.fecha.startsWith(mesAgenda) && !p.tipo).length, hech = S.sesiones.filter(s=>s.fecha.startsWith(mesAgenda) && s.tipo!=='descanso').length;
  return `<div class="tarjeta"><div class="entre"><button class="btn chico-btn" id="agMAnt" aria-label="Mes anterior">‹</button><span class="titulo">${MESES_L[m - 1].replace(/^./, c=>c.toUpperCase())} ${y}</span><button class="btn chico-btn" id="agMSig" aria-label="Mes siguiente">›</button></div>
      <div class="cal-sem">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d=>`<span>${d}</span>`).join('')}</div>
      <div class="ag-mes">${celdas.join('')}</div>
      <div class="leyenda chico"><span><i class="ag-ley h"></i>Hecho</span><span><i class="ag-ley p"></i>Planificado</span><span class="suave num">${hech} hechos · ${del} planificados</span></div></div>
    <p class="nota">Toca un día para ver o planificar.</p>`;
}
function enlazarAgenda(){
  const re = ()=>{ const y = window.scrollY; vAgenda(); window.scrollTo(0, y); };
  if($('#agAnt')){ $('#agAnt').onclick = ()=>{ lunesAgenda = masDias(lunesAgenda, -7); vAgenda(); }; $('#agSig').onclick = ()=>{ lunesAgenda = masDias(lunesAgenda, 7); vAgenda(); }; }
  if($('#agMAnt')){ const mv = k=>{ const [y, m] = mesAgenda.split('-').map(Number), d = new Date(y, m - 1 + k, 1); mesAgenda = iso(d).slice(0, 7); vAgenda(); };
    $('#agMAnt').onclick = ()=>mv(-1); $('#agMSig').onclick = ()=>mv(1); }
  $$('[data-agf]').forEach(b=>b.onclick = ()=>dialogoPlanificar(b.dataset.agf));
  $$('[data-agdia]').forEach(b=>b.onclick = ()=>dialogoDiaAgenda(b.dataset.agdia));
  $$('#diarioCuerpo [data-sid]').forEach(b=>b.onclick = ()=>verSesion(S.sesiones.find(s=>s.id===b.dataset.sid)));
  $$('#diarioCuerpo [data-pid]').forEach(b=>b.onclick = ()=>accionesPlan(S.planificadas.find(p=>p.id===b.dataset.pid)));
  if($('#agCopiar')) $('#agCopiar').onclick = ()=>{ const it = semanaItems(); if(!it.length) return aviso('Esta semana no tiene nada planificado');
    it.forEach(p=>S.planificadas.push(copiaPlan(p, masDias(p.fecha, 7)))); guardar(); aviso('Semana copiada a la siguiente'); lunesAgenda = masDias(lunesAgenda, 7); vAgenda(); };
  if($('#agRepetir')) $('#agRepetir').onclick = dialogoRepetir;
  if($('#agGuardarTipo')) $('#agGuardarTipo').onclick = dialogoGuardarTipo;
  if($('#agAplicarTipo')) $('#agAplicarTipo').onclick = dialogoAplicarTipo;
}
const semanaItems = ()=>Array.from({length:7}, (_, k)=>planDe(masDias(lunesAgenda, k))).flat();
function refrescarAgenda(){ if(vistaActual==='diario' && vistaDiario==='agenda') vAgenda(); else if(vistaActual==='hoy') vHoy(); }

/* ＋ Planificar un día */
function dialogoPlanificar(f){
  dialogo(`<div class="cab"><h2>Planificar · ${esc(verFecha(f))}</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <div class="opciones">
      <button class="opcion" id="plEnt"><b>🏋️ Entrenamiento</b><span>Ármalo (uno o varios movimientos) o búscalo en la biblioteca, tus favoritos o uno que ya hiciste</span></button>
      <button class="opcion" id="plAct"><b>🔋 Descanso activo</b><span>Trote suave, movilidad, nado…</span></button>
      <button class="opcion" id="plDesc"><b>😴 Descanso</b><span>Día libre</span></button>
    </div>`, d=>{
    $('#plEnt', d).onclick = ()=>{ d.close(); abrirRegistro({soloPlan:true, fecha:f}); };
    $('#plAct', d).onclick = ()=>{ agregarPlan(f, {tipo:'activo'}); guardar(); d.close(); aviso('🔋 Descanso activo planificado'); refrescarAgenda(); };
    $('#plDesc', d).onclick = ()=>{ agregarPlan(f, {tipo:'descanso'}); guardar(); d.close(); aviso('😴 Descanso planificado'); refrescarAgenda(); };
  });
}
/* Un día del mes: lo hecho, lo planificado y ＋ */
function dialogoDiaAgenda(f){
  const hoy = hoyISO();
  dialogo(`<div class="cab"><h2>${esc(verFecha(f))}</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <div class="ag-items ag-items-dlg">${itemsDia(f, hoy) || '<span class="suave">Nada todavía.</span>'}</div>
    <button class="btn prim ancho" id="dPlan" style="margin-top:12px">＋ Planificar este día</button>`, d=>{
    $$('[data-sid]', d).forEach(b=>b.onclick = ()=>verSesion(S.sesiones.find(s=>s.id===b.dataset.sid)));
    $$('[data-pid]', d).forEach(b=>b.onclick = ()=>accionesPlan(S.planificadas.find(p=>p.id===b.dataset.pid)));
    $('#dPlan', d).onclick = ()=>dialogoPlanificar(f);
  });
}
/* Acciones sobre un planificado */
function accionesPlan(p){
  if(!p) return; const hoy = hoyISO();
  dialogo(`<div class="cab"><h2>${icoPlan(p)} ${esc(nombrePlan(p))}</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <div class="suave chico">Planificado para el ${esc(verFecha(p.fecha))}${p.fecha < hoy ? ' · sin registrar' : ''}</div>
    ${p.w ? `<div style="margin-top:10px">${htmlWodVisual(p.w, true)}</div>` : ''}
    <div class="ag-btns">
      ${p.tipo==='descanso' ? '' : `<button class="btn prim" id="apReg">${p.tipo==='activo' ? '🔋 Registrar descanso activo' : '＋ Registrar'}</button>`}
      ${p.w ? '<button class="btn" id="apEd">✎ Editar</button>' : ''}
      <button class="btn" id="apMover">📅 Mover</button><button class="btn" id="apCopiar">⧉ Copiar a…</button><button class="btn" id="apQuitar">Quitar</button>
    </div>`, d=>{
    if($('#apReg', d)) $('#apReg', d).onclick = ()=>{ d.close();
      if(p.tipo==='activo'){ S.planificadas = S.planificadas.filter(x=>x.id!==p.id); guardar(); dialogoDescanso(); } else registrarPlanificado(p); };
    if($('#apEd', d)) $('#apEd', d).onclick = ()=>{ d.close(); abrirRegistro({soloPlan:true, fecha:p.fecha}); cargarPlantilla(p.t); W.planId = p.id; W.fecha = p.fecha; W.titulo = p.titulo || W.titulo; W.soloPlan = true; };
    $('#apMover', d).onclick = ()=>elegirFechas(p, false);
    $('#apCopiar', d).onclick = ()=>elegirFechas(p, true);
    $('#apQuitar', d).onclick = ()=>{ S.planificadas = S.planificadas.filter(x=>x.id!==p.id); guardar(); d.close(); aviso('Quitado de la agenda'); refrescarAgenda(); };
  });
}
/* Mover (una fecha) o copiar (varias fechas): días de esta semana y las 3 siguientes */
function elegirFechas(p, varias){
  const L = lunesDe(p.fecha), dias = Array.from({length:28}, (_, k)=>masDias(L, k)), sel = new Set();
  dialogo(`<div class="cab"><h2>${varias ? '⧉ Copiar a…' : '📅 Mover a…'}</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <p class="suave chico" style="margin-top:0">${esc(nombrePlan(p))} · ${varias ? 'elige uno o más días' : 'elige el nuevo día'}</p>
    <div class="ag-fechas">${[0, 1, 2, 3].map(s=>`<div class="ag-fsem">${dias.slice(s*7, s*7 + 7).map((f, k)=>`<button data-fx="${f}" class="${f===p.fecha ? 'actual' : ''}"><small>${DIAS_AG[k]}</small><b class="num">${+f.slice(8)}</b></button>`).join('')}</div>`).join('')}</div>
    ${varias ? '<div class="btns"><button class="btn" data-cerrar>Cancelar</button><button class="btn prim" id="fxOk">Copiar</button></div>' : ''}`, d=>{
    $$('[data-fx]', d).forEach(b=>b.onclick = ()=>{ const f = b.dataset.fx;
      if(!varias){ p.fecha = f; guardar(); d.close(); aviso('Movido al ' + verFecha(f)); refrescarAgenda(); return; }
      if(sel.has(f)) sel.delete(f); else sel.add(f); b.classList.toggle('sel', sel.has(f)); });
    if($('#fxOk', d)) $('#fxOk', d).onclick = ()=>{ if(!sel.size) return aviso('Elige al menos un día');
      sel.forEach(f=>S.planificadas.push(copiaPlan(p, f))); guardar(); d.close(); aviso('Copiado a ' + sel.size + ' día' + (sel.size > 1 ? 's' : '')); refrescarAgenda(); };
  });
}
function dialogoRepetir(){
  const it = semanaItems(); if(!it.length) return aviso('Esta semana no tiene nada planificado');
  dialogo(`<div class="cab"><h2>🔁 Repetir esta semana</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <p class="suave chico" style="margin-top:0">${it.length} elemento${it.length > 1 ? 's' : ''} planificado${it.length > 1 ? 's' : ''}. ¿Cuántas semanas más?</p>
    <div class="chips" id="rpN" style="padding:0">${[1, 2, 3, 4, 6, 8, 12].map(n=>`<button data-n="${n}">${n}</button>`).join('')}</div>`, d=>{
    $$('#rpN button', d).forEach(b=>b.onclick = ()=>{ const n = +b.dataset.n;
      for(let k = 1; k <= n; k++) it.forEach(p=>S.planificadas.push(copiaPlan(p, masDias(p.fecha, 7*k))));
      guardar(); d.close(); aviso('Semana repetida ' + n + ' vez' + (n > 1 ? 'es' : '')); vAgenda(); });
  });
}
function dialogoGuardarTipo(){
  const it = semanaItems(); if(!it.length) return aviso('Planifica la semana primero');
  dialogo(`<div class="cab"><h2>💾 Semana tipo</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <label>Nombre</label><input id="stNom" placeholder="Ej.: Semana de fuerza, Semana de marcha">
    <div class="btns"><button class="btn" data-cerrar>Cancelar</button><button class="btn prim" id="stOk">Guardar</button></div>`, d=>{
    $('#stOk', d).onclick = ()=>{ const n = $('#stNom', d).value.trim(); if(!n) return aviso('Ponle un nombre');
      (S.semanasTipo = S.semanasTipo || []).push({id:uid(), nombre:n, items:it.map(p=>{ const x = JSON.parse(JSON.stringify(p)); x.dia = diasEntre(lunesAgenda, p.fecha); delete x.id; delete x.fecha; return x; })});
      guardar(); d.close(); aviso('Semana tipo «' + n + '» guardada'); vAgenda(); };
  });
}
function dialogoAplicarTipo(){
  const T = S.semanasTipo || [];
  if(!T.length) return aviso('Aún no guardas semanas tipo: planifica una semana y toca «Guardar como semana tipo»');
  dialogo(`<div class="cab"><h2>📥 Aplicar semana tipo</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <p class="suave chico" style="margin-top:0">Se agrega a la semana que estás viendo (se suma a lo que ya tenga).</p>
    <ul class="lista">${T.map(t=>`<li class="item entre"><button class="link" data-st="${t.id}"><b>${esc(t.nombre)}</b> <span class="suave chico">${t.items.length} elementos</span></button><button class="btn chico-btn" data-stdel="${t.id}" aria-label="Borrar">✕</button></li>`).join('')}</ul>`, d=>{
    $$('[data-st]', d).forEach(b=>b.onclick = ()=>{ const t = T.find(x=>x.id===b.dataset.st);
      t.items.forEach(x=>{ const c = JSON.parse(JSON.stringify(x)), dia = c.dia; delete c.dia; agregarPlan(masDias(lunesAgenda, dia), c); });
      guardar(); d.close(); aviso('«' + t.nombre + '» aplicada'); vAgenda(); });
    $$('[data-stdel]', d).forEach(b=>b.onclick = ()=>{ S.semanasTipo = T.filter(x=>x.id!==b.dataset.stdel); guardar(); d.close(); dialogoAplicarTipo(); });
  });
}
