/* #NSCE — Modo gimnasio (31-oct-2026; maqueta aprobada por el usuario: «seguimiento de cada atleta, sus marcas y récords»).
   Quien crea el grupo elige el tipo: unidad o curso (militar / policial, código U-…) o box / gimnasio (código B-…). Quien se une lo hereda.
   En el box, el COACH elige las marcas que sigue (levantamientos 1RM, benchmarks, cardio y propias: «Marcas del box»); el atleta las ve en
   Pruebas y su mejor marca de cada una va en su parte (marcasParte). El coach ve «Mis atletas» (récords de la semana, quién dejó de venir)
   y la ficha de cada atleta (mejor marca, mejora en 3 meses, fecha del récord, evolución). Felicitar = mensaje para WhatsApp. */
'use strict';
/* Catálogo de marcas. ids = de dónde salen los valores (valoresDe): 1RM legado o «rm:mov:1», «wod:Nombre» (Rx), «dist:mov:metros» */
const MARCAS_BOX = [
  {id:'sentadilla', n:'Back squat', g:'lev', u:'kg', ids:['sentadilla']},
  {id:'sent_frontal', n:'Front squat', g:'lev', u:'kg', ids:['rm:sent_frontal:1']},
  {id:'pesomuerto', n:'Peso muerto', g:'lev', u:'kg', ids:['pesomuerto']},
  {id:'banca', n:'Press banca', g:'lev', u:'kg', ids:['banca']},
  {id:'militar', n:'Press militar', g:'lev', u:'kg', ids:['militar']},
  {id:'cargada', n:'Power clean', g:'lev', u:'kg', ids:['rm:cargada:1']},
  {id:'cargada_sent', n:'Squat clean', g:'lev', u:'kg', ids:['rm:cargada_sent:1']},
  {id:'envion', n:'Clean & jerk', g:'lev', u:'kg', ids:['envion']},
  {id:'arranque', n:'Snatch', g:'lev', u:'kg', ids:['rm:arranque:1']},
  {id:'thruster', n:'Thruster', g:'lev', u:'kg', ids:['rm:thruster:1']},
  ...['Fran', 'Grace', 'Helen', 'Cindy', 'Murph', 'Diane', 'Isabel', 'Karen', 'DT'].map(n=>({id:'b:' + n, n, g:'bench', u:n==='Cindy' ? 'rondas' : 'tiempo', ids:['wod:' + n]})),
  {id:'remo2k', n:'Remo 2.000 m', g:'cardio', u:'tiempo', ids:['dist:remo:2000', 'wod:Test 2.000 m de remo']},
  {id:'c2400', n:'Carrera 2.400 m', g:'cardio', u:'tiempo', ids:['psf2400']},
  {id:'c5k', n:'Carrera 5 km', g:'cardio', u:'tiempo', ids:['5k', 'dist:carrera:5000']},
  {id:'c10k', n:'Carrera 10 km', g:'cardio', u:'tiempo', ids:['10k', 'dist:carrera:10000']},
];
const MARCAS_DEF = ['sentadilla', 'pesomuerto', 'militar', 'envion', 'arranque', 'b:Fran', 'b:Grace', 'b:Helen', 'b:Cindy', 'b:Murph', 'remo2k', 'c5k'];
const G_MARCA = {lev:'🏋️ Levantamientos · 1RM', bench:'⏱️ Benchmarks', cardio:'🫁 Cardio', propia:'⭐ Del box'};
const U_PROPIA = [['tiempo', 'Por tiempo'], ['rondas', 'Rondas (AMRAP)'], ['kg', 'Peso (kg)'], ['reps', 'Repeticiones']];
const esBox = ()=>!!(S.unidad && S.unidad.tipo==='box');
const jefeU = ()=>esBox() ? 'coach' : 'instructor';
/* Marca: id del catálogo o {n, u} propia del box (se registra con ese nombre) */
function marcaDe(x){
  if(typeof x==='string') return MARCAS_BOX.find(m=>m.id===x) || null;
  if(x && x.n) return {id:'p:' + sinTildes(x.n).toLowerCase().replace(/[^a-z0-9]+/g, '_'), n:x.n, g:'propia', u:x.u || 'tiempo', ids:['wod:' + x.n], propia:true};
  return null;
}
const marcasLista = L=>(L || MARCAS_DEF).map(marcaDe).filter(Boolean);
function valoresMarca(m){ return m.ids.flatMap(id=>valoresDe(id)).filter(v=>v.valor!=null).sort((a, b)=>a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0); }
const mejorVal = (m, vs)=>vs.length ? vs.reduce((b, o)=>(menorEsMejor(m.u) ? o.valor < b.valor : o.valor > b.valor) ? o : b) : null;
function verMarca(m, v, txt){
  if(v==null) return '—';
  if(m.u==='tiempo') return PSF.verTiempo(v);
  if(m.u==='kg') return verPeso(Math.round(v * 10) / 10, 'kg');
  if(m.u==='rondas') return txt || Math.floor(v) + ' rondas';
  if(m.u==='reps') return Math.round(v) + ' rep';
  return String(v);
}
/* Diferencia legible (mejor - antes): tiempo «−0:33», kg «+10 kg», rondas «+2» */
function difMarca(m, v, antes){
  if(v==null || antes==null || v===antes) return '';
  const d = v - antes, mejora = menorEsMejor(m.u) ? d < 0 : d > 0; if(!mejora) return '';
  if(m.u==='tiempo') return '−' + PSF.verTiempo(Math.abs(d));
  if(m.u==='kg') return '+' + fmtNum(Math.round(d * 10) / 10) + ' kg';
  return '+' + fmtNum(Math.floor(Math.abs(d)) || Math.round(Math.abs(d) * 10) / 10);
}
/* Para el parte: por cada marca del box, el mejor (b), el mejor anterior a ese récord (p), el mejor de hace más de 3 meses (a) y los últimos 12 */
function marcasParte(L){
  const out = {};
  marcasLista(L).forEach(m=>{ const vs = valoresMarca(m); if(!vs.length) return; const b = mejorVal(m, vs), p = mejorVal(m, vs.filter(v=>v.fecha < b.fecha)), a = mejorVal(m, vs.filter(v=>v.fecha < hace(90)));
    out[m.id] = {b:[b.fecha, b.valor, b.txt || ''], p:p ? p.valor : null, a:a ? a.valor : null, h:vs.slice(-12).map(v=>[v.fecha, v.valor, v.txt || ''])}; });
  return out;
}

/* ---------- Atleta: «Marcas de tu box» (pestaña Pruebas) ---------- */
function htmlMarcasBox(){
  if(!esBox()) return '';
  const L = marcasLista(S.unidad.marcas), grupos = Object.keys(G_MARCA).filter(g=>L.some(m=>m.g===g));
  return `<div class="tarjeta bx-mias"><div class="titulo">🏋️ Marcas de ${esc(S.unidad.unidad || 'tu box')}</div><div class="suave chico">Las elige tu coach.</div>
    ${grupos.map(g=>`<div class="etiqueta">${G_MARCA[g]}</div><ul class="lista chico">${L.filter(m=>m.g===g).map(m=>{ const vs = valoresMarca(m), b = mejorVal(m, vs);
      return `<li class="entre"><span>${esc(m.n)}</span>${b ? `<span class="num"><b>${esc(verMarca(m, b.valor, b.txt))}</b> <span class="suave">${verFecha(b.fecha)}</span></span>` : '<span class="suave">sin marca</span>'}</li>`; }).join('')}</ul>`).join('')}
    <p class="nota">👉 Regístralas con ＋: el WOD por su nombre (Fran, Murph…) o el levantamiento a 1 repetición. Tu mejor marca le llega sola a tu coach.</p></div>`;
}

/* ---------- Coach: elegir las marcas del box ---------- */
function dialogoMarcasBox(u, alListo){
  let sel = (u.marcas || MARCAS_DEF).slice();
  const marcado = id=>sel.some(x=>typeof x==='string' && x===id);
  const pintar = d=>{ $('#mbLista', d).innerHTML = ['lev', 'bench', 'cardio'].map(g=>`<div class="etiqueta">${G_MARCA[g]}</div><div class="bx-chips">${MARCAS_BOX.filter(m=>m.g===g).map(m=>`<button data-mb="${m.id}" class="${marcado(m.id) ? 'activa' : ''}">${marcado(m.id) ? '✓ ' : ''}${esc(m.n)}</button>`).join('')}</div>`).join('')
      + `<div class="etiqueta">${G_MARCA.propia}</div>${sel.filter(x=>typeof x!=='string').map((x, i)=>`<div class="entre bx-propia"><span>${esc(x.n)} <span class="suave chico">${(U_PROPIA.find(t=>t[0]===x.u) || ['', ''])[1]}</span></span><button class="link chico" data-mbq="${i}">Quitar</button></div>`).join('') || '<p class="suave chico">Ninguna todavía.</p>'}`;
    $$('[data-mb]', d).forEach(b=>b.onclick = ()=>{ const id = b.dataset.mb; sel = marcado(id) ? sel.filter(x=>x!==id) : sel.concat(id); pintar(d); });
    $$('[data-mbq]', d).forEach(b=>b.onclick = ()=>{ const p = sel.filter(x=>typeof x!=='string')[+b.dataset.mbq]; sel = sel.filter(x=>x!==p); pintar(d); }); };
  dialogo(`<div class="cab"><h2>🎯 Marcas del box</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <p class="suave chico">👉 <b>Ahora:</b> toca las marcas que quieres seguir. Tus atletas las ven en su app y su mejor marca de cada una te llega sola.</p>
    <div id="mbLista"></div>
    <details class="que"><summary>＋ Agregar una propia</summary><p class="chico">Ej.: el WOD del aniversario del box. Tus atletas la registran con ese mismo nombre.</p>
      <div class="fila"><div><label>Nombre</label><input id="mbN" placeholder="Ej.: WOD aniversario"></div><div><label>Se mide</label><select id="mbU">${U_PROPIA.map(([k, t])=>`<option value="${k}">${t}</option>`).join('')}</select></div></div>
      <button class="btn ancho" id="mbAgregar">＋ Agregar</button></details>
    <div class="btns"><button class="btn" data-cerrar>Cancelar</button><button class="btn prim" id="mbOk">Guardar</button></div>`, d=>{
    pintar(d);
    $('#mbAgregar', d).onclick = ()=>{ const n = $('#mbN', d).value.trim(); if(!n){ aviso('Ponle nombre'); return; }
      if(sel.some(x=>typeof x!=='string' && x.n.toLowerCase()===n.toLowerCase())){ aviso('Ya está'); return; }
      sel.push({n:n.slice(0, 60), u:$('#mbU', d).value}); $('#mbN', d).value = ''; pintar(d); };
    $('#mbOk', d).onclick = async ()=>{ if(!sel.length){ aviso('Elige al menos una marca'); return; }
      u.marcas = sel; guardarMando();
      if(u.nube && conectado()){ try{ await api('unidades?id=eq.' + u.nube, {method:'PATCH', body:{marcas:sel}}); }catch(e){ aviso(e.message); return; } }
      d.close(); aviso('🎯 Marcas del box guardadas'); if(alListo) alListo(); else vUnidad(); };
  });
}

/* ---------- Coach: «Mis atletas» ---------- */
const inicialesDe = t=>String(t || '?').trim().split(/\s+/).slice(0, 2).map(x=>x[0] || '').join('').toUpperCase() || '?';
const ultimaVez = P=>{ const s = (P.ses || []).find(x=>!x.d); return s ? s.f : null; };
const recordsMes = P=>(P.rec || []).filter(r=>r.f >= hoyISO().slice(0, 8) + '01').length;
/* Récords de las marcas del box en los últimos días: [{P, m, b, dif}] */
function recordsBox(ps, L, dias){
  const out = []; ps.forEach(P=>L.forEach(m=>{ const x = (P.marcas || {})[m.id]; if(!x || x.b[0] < hace(dias - 1)) return;
    out.push({P, m, f:x.b[0], v:x.b[1], txt:x.b[2], dif:difMarca(m, x.b[1], x.p)}); }));
  return out.sort((a, b)=>a.f < b.f ? 1 : -1);
}
function vBox(u){
  const M = mando(), todos = partesDe(u.codigo), L = marcasLista(u.marcas), lun = iso(inicioSemana()), hoy = hoyISO();
  const semana = todos.filter(P=>(P.ses || []).some(s=>!s.d && s.f >= lun)).length, ausentes = todos.filter(P=>{ const f = ultimaVez(P); return !f || diasEntre(f, hoy) >= 10; });
  const recM = todos.reduce((a, P)=>a + recordsMes(P), 0), recS = recordsBox(todos, L, 7);
  const ultRec = P=>{ const fs = Object.values(P.marcas || {}).map(x=>x.b[0]).concat((P.rec || []).map(r=>r.f)); return fs.sort().pop() || ''; };
  const orden = todos.slice().sort((a, b)=>ultRec(a) < ultRec(b) ? 1 : ultRec(a) > ultRec(b) ? -1 : nomAl(a).localeCompare(nomAl(b)));
  const fila = P=>{ const f = ultimaVez(P), d = f ? diasEntre(f, hoy) : null, sem = (P.ses || []).filter(s=>!s.d && s.f >= lun).length, rm = recordsMes(P);
    return `<li class="bx-fila" data-at="${esc(P.codigo + '|' + P.id)}"><span class="bx-av">${esc(inicialesDe(P.alumno.nombre))}</span><div><b>${esc(P.alumno.nombre || 'Atleta')}</b>
      ${d==null || d >= 10 ? `<small class="bx-rojo">${d==null ? 'Aún no registra entrenamientos' : 'Sin venir hace ' + d + ' días'}</small>` : `<small class="suave">${sem} esta semana · ${rm} récord${rm===1 ? '' : 's'} en ${MESES_L[new Date().getMonth()]}</small>`}</div><span class="chev">›</span></li>`; };
  $('#vista').innerHTML = `<div class="cab-an"><button class="btn chico-btn" id="uAtras" aria-label="Volver">‹</button><h2>Mi box</h2></div>
    <div class="chips" id="uSel" style="padding-top:0">${M.unidades.map(x=>`<button data-u="${esc(x.codigo)}" class="${x.codigo===u.codigo ? 'activa' : ''}">${esc(x.nombre)}</button>`).join('')}<button id="uNueva">＋</button></div>
    <div class="tarjeta"><div class="entre"><div><div class="etiqueta">Código ${esc(u.codigo)}</div><h3 style="margin:2px 0">${esc(u.nombre)}</h3><div class="suave chico">${todos.length} atleta${todos.length===1 ? '' : 's'}</div></div>
      <button class="btn chico-btn" id="uInvitar" aria-label="Invitar">＋👤</button></div>
      <div class="u-acc">${u.nube ? '<button class="btn prim" id="uActualizar">🔄 Actualizar</button>' : '<button class="btn prim" id="uCargar">📥 Cargar partes</button>'}<button class="btn" id="uMarcas">🎯 Marcas</button><button class="btn" id="uExcel">⬇ Excel</button></div>
      ${u.nube ? `<p class="chico" style="color:var(--mb);margin:8px 0 0">☁️ En línea${conectado() ? '' : ': <b>ingresa con tu correo para ver los datos</b>'}${NU[u.codigo] && NU[u.codigo].t && !NU[u.codigo].cargando ? ' · actualizado ' + new Date(NU[u.codigo].t).toTimeString().slice(0, 5) : ''}</p>` : ''}
      ${todos.length ? '<button class="btn ancho" id="uAfiches" style="margin-top:8px">📣 Afiches del mes</button>' : ''}</div>
    ${u.nube ? htmlTareaInstructor(u) : ''}
    ${!todos.length ? `<div class="tarjeta vacio chico">👉 <b>Ahora:</b> invita a tus atletas con ＋👤. Cuando se unan, aquí verás sus marcas y récords.</div>` : `
    <div class="u-res bx-kpi"><div><b class="num">${recM}</b><span>récords en ${MESES_L[new Date().getMonth()]}</span></div><div><b class="num">${semana}</b><span>entrenaron esta semana</span></div>
      <div><b class="num" style="${ausentes.length ? 'color:var(--na)' : ''}">${ausentes.length}</b><span>sin venir 10+ días</span></div></div>
    <div class="tarjeta"><div class="etiqueta">🏆 Récords de la semana</div>
      ${recS.length ? `<ul class="lista">${recS.slice(0, 12).map(r=>`<li class="bx-fila" data-at="${esc(r.P.codigo + '|' + r.P.id)}"><span class="bx-av">${esc(inicialesDe(r.P.alumno.nombre))}</span><div><b>${esc(r.P.alumno.nombre || 'Atleta')}</b><small class="suave">${esc(r.m.n)} ${esc(verMarca(r.m, r.v, r.txt))}</small></div>${r.dif ? `<span class="bx-pr num">${esc(r.dif)}</span>` : '<span class="bx-pr">1.ª marca</span>'}</li>`).join('')}</ul>`
        : '<p class="suave chico">Esta semana nadie ha superado una marca del box todavía.</p>'}</div>
    <div class="tarjeta"><div class="etiqueta">Atletas · por último récord</div><ul class="lista">${orden.map(fila).join('')}</ul></div>`}`;
  $('#uAtras').onclick = ()=>ir('perfil');
  $$('#uSel [data-u]').forEach(b=>b.onclick = ()=>{ M.sel = b.dataset.u; guardarMando(); vUnidad(); });
  $('#uNueva').onclick = dialogoCrearUnidad; $('#uInvitar').onclick = ()=>dialogoInvitar(u); $('#uMarcas').onclick = ()=>dialogoMarcasBox(u);
  $('#uExcel').onclick = ()=>exportarExcel(u, todos); if($('#uCargar')) $('#uCargar').onclick = cargarPartes;
  if($('#uAfiches')) $('#uAfiches').onclick = ()=>dialogoAfiches(u, todos);
  if($('#uActualizar')) $('#uActualizar').onclick = ()=>{ if(!conectado()) return dialogoIngresar(); NU[u.codigo] = {t:0}; vUnidad(); };
  if(u.nube) enlazarTareaInstructor(u);
  $$('[data-at]').forEach(li=>li.onclick = ()=>fichaAtleta(M.partes[li.dataset.at], u));
}
/* Gráfico simple de la evolución (sube = mejora, también en los tiempos) */
function svgEvolucion(m, h){
  if(!h || h.length < 2) return '<p class="suave chico">Con 2 registros o más aparece su evolución.</p>';
  const vs = h.map(x=>x[1]), mn = Math.min(...vs), mx = Math.max(...vs), W = 300, H = 70, inv = menorEsMejor(m.u);
  const pt = (x, i)=>{ const X = 8 + i * (W - 16) / (h.length - 1), r = mx===mn ? 0.5 : (x[1] - mn) / (mx - mn); return [X, 8 + (inv ? r : 1 - r) * (H - 16)]; };
  const P = h.map(pt), u = P[P.length - 1];
  return `<svg viewBox="0 0 ${W} ${H}" class="bx-evo" role="img" aria-label="Evolución de ${esc(m.n)}"><polyline points="${P.map(p=>p.map(n=>Math.round(n)).join(',')).join(' ')}" fill="none" stroke="var(--acento)" stroke-width="2.5"/>
    ${P.map(p=>`<circle cx="${Math.round(p[0])}" cy="${Math.round(p[1])}" r="3" fill="var(--acento)"/>`).join('')}<circle cx="${Math.round(u[0])}" cy="${Math.round(u[1])}" r="5" fill="#EF9F27"/></svg>
    <div class="entre suave chico num"><span>${verFecha(h[0][0])} · ${esc(verMarca(m, h[0][1], h[0][2]))}</span><span>${verFecha(h[h.length - 1][0])} · ${esc(verMarca(m, h[h.length - 1][1], h[h.length - 1][2]))}</span></div>`;
}
let marcaEvo = null;
function fichaAtleta(P, u){
  if(!P) return; const L = marcasLista(u.marcas), X = P.marcas || {}, hoy = hoyISO(), s30 = (P.ses || []).filter(s=>!s.d && s.f >= hace(29)).length;
  const con = L.filter(m=>X[m.id]), sin = L.filter(m=>!X[m.id]), grupos = Object.keys(G_MARCA).filter(g=>con.some(m=>m.g===g));
  const evos = con.filter(m=>X[m.id].h.length >= 2); if(!evos.some(m=>m.id===marcaEvo)) marcaEvo = evos[0] ? evos[0].id : null;
  const insignia = m=>{ const x = X[m.id], dA = difMarca(m, x.b[1], x.a);
    const dP = difMarca(m, x.b[1], x.p);
    return x.b[0] >= hace(29) ? `<span class="bx-pr num" title="Récord del ${verFecha(x.b[0])}">🏆 ${dP ? esc(dP) : 'récord'}</span>` : dA ? `<span class="sube chico num">${esc(dA)} en 3 meses</span>` : `<span class="suave chico">${verFecha(x.b[0])}</span>`; };
  const ult = con.filter(m=>X[m.id].b[0] >= hace(29)).sort((a, b)=>X[a.id].b[0] < X[b.id].b[0] ? 1 : -1)[0];
  const f = ultimaVez(P), d = f ? diasEntre(f, hoy) : null;
  dialogo(`<div class="cab"><div class="bx-cab"><span class="bx-av grande">${esc(inicialesDe(P.alumno.nombre))}</span><div><h2 style="margin:0">${esc(P.alumno.nombre || 'Atleta')}</h2>
      <div class="suave chico">${[P.alumno.edad ? P.alumno.edad + ' años' : '', d==null ? 'sin entrenamientos' : d===0 ? 'entrenó hoy' : 'entrenó hace ' + d + ' día' + (d===1 ? '' : 's')].filter(Boolean).join(' · ')}</div></div></div><button class="btn chico-btn" data-cerrar>✕</button></div>
    <div class="u-res bx-kpi"><div><b class="num">${s30}</b><span>sesiones en 30 días</span></div><div><b class="num">${recordsMes(P)}</b><span>récords en ${MESES_L[new Date().getMonth()]}</span></div><div><b class="num">${(P.rec || []).length}</b><span>récords en 90 días</span></div></div>
    ${grupos.map(g=>`<div class="etiqueta">${G_MARCA[g]}</div><ul class="lista chico bx-marcas">${con.filter(m=>m.g===g).map(m=>`<li><span>${esc(m.n)}</span><b class="num">${esc(verMarca(m, X[m.id].b[1], X[m.id].b[2]))}</b>${insignia(m)}</li>`).join('')}</ul>`).join('')}
    ${!con.length ? '<p class="suave chico">Aún no registra ninguna marca del box.</p>' : ''}
    ${sin.length ? `<p class="nota">Sin marca todavía: ${sin.map(m=>esc(m.n)).join(', ')}.</p>` : ''}
    ${evos.length ? `<div class="entre" style="margin-top:12px"><span class="etiqueta" style="margin:0">Evolución</span><select id="faEvo">${evos.map(m=>`<option value="${m.id}" ${m.id===marcaEvo ? 'selected' : ''}>${esc(m.n)}</option>`).join('')}</select></div><div id="faGraf"></div>` : ''}
    <div class="btns"><button class="btn" id="faTodo">📋 Ficha completa</button><button class="btn prim" id="faFeli">🏆 Felicitar</button></div>`, dd=>{
    const graf = ()=>{ const m = L.find(x=>x.id===marcaEvo); if(m && $('#faGraf', dd)) $('#faGraf', dd).innerHTML = svgEvolucion(m, X[m.id].h); };
    graf(); if($('#faEvo', dd)) $('#faEvo', dd).onchange = e=>{ marcaEvo = e.target.value; graf(); };
    $('#faTodo', dd).onclick = ()=>{ dd.close(); fichaAlumno(P); };
    $('#faFeli', dd).onclick = ()=>{ const nom = (P.alumno.nombre || '').split(' ')[0] || 'campeón';
      const txt = ult ? `🏆 ¡Felicitaciones, ${nom}! Nuevo récord en ${ult.n}: ${verMarca(ult, X[ult.id].b[1], X[ult.id].b[2])}${difMarca(ult, X[ult.id].b[1], X[ult.id].p) ? ' (' + difMarca(ult, X[ult.id].b[1], X[ult.id].p) + ')' : ''}. ¡Sigue así! — ${u.nombre}`
        : `💪 ¡Buen trabajo, ${nom}! ${s30} sesiones en los últimos 30 días. ¡Sigue así! — ${u.nombre}`;
      if(navigator.share) navigator.share({text:txt}).catch(()=>{}); else { try{ navigator.clipboard.writeText(txt).catch(()=>{}); }catch(e){} aviso('Mensaje copiado: pégalo en WhatsApp', 3000); } };
  });
}
