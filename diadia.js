/* #NSCE — Día de descanso, día sin registro y pruebas como entrenamiento del día (25-nov-2026, maqueta aprobada).
   Pruebas: cada día con un control PSF, una marca de la PSF, una prueba de la batería o un test tiene UNA sesión automática (id `pr-<fecha>`, tipo 'pruebas',
   `s.pr` {filas, psf, m}) que arma y mantiene `sincronizarPruebas` (en guardar() y al abrir); desde PR_DESDE para no cambiar los totales antiguos. Duración y
   esfuerzo son estimados hasta que la persona los cambia (`s.prEd`). S.prFuera[fecha] = la quitó. A los amigos solo con pref amPruebas==='1'. */
'use strict';
const PR_DESDE = '2026-11-25', PR_EJ = ['psf2400', 'abd1', 'barras', 'flex1'];
const PR_NOM = {psf2400:'Carrera 2.400 m', abd1:'Abdominales 1 min', barras:'Barras', flex1:'Flexiones 1 min'};
const PR_CORTO = {psf2400:v=>PSF.verTiempo(v), abd1:v=>v + ' abdominales', barras:v=>v + ' barras', flex1:v=>v + ' flexiones'};
function filasPruebas(f){
  const F = [], ya = new Set(), pon = (ej, v, ref)=>{ if(v==null || ya.has(ej)) return; ya.add(ej); F.push({ej, v, n:PR_NOM[ej], txt:ej==='psf2400' ? PSF.verTiempo(v) : String(v), c:PR_CORTO[ej](v), ref}); };
  const C = (S.controles || []).filter(c=>c.fecha===f && !c.antigua).slice().reverse();
  C.forEach(c=>{ pon('psf2400', c.carrera, c.id); pon('abd1', c.abd, c.id); pon(c.prueba==='barra' ? 'barras' : 'flex1', c.brazos, c.id); });
  (S.marcas || []).filter(m=>m.fecha===f && (m.eval || PR_EJ.includes(m.ej)) && PR_NOM[m.ej]).slice().reverse().forEach(m=>pon(m.ej, m.valor, m.id));
  (S.evals || []).filter(e=>e.fecha===f).forEach(e=>{ const P = pruebaDe(e.prueba), r = P && evaluarPrueba(e); if(r) F.push({n:P.n.split(':')[0], txt:r.txt, c:r.txt, ref:e.id, mt:e.prueba==='despl' || e.prueba==='marcha' ? (num(e.d) || 0) * 1000 : 0, cat:e.prueba==='marcha' ? 'marchar' : 'correr', kg:num(e.kg)}); });
  (S.tests || []).filter(t=>t.fecha===f && TESTS[t.t]).forEach(t=>{ const T = TESTS[t.t], tx = T.tiempo || T.u==='min:seg' ? PSF.verTiempo(t.v) : fmtNum(t.v) + (T.u==='repeticiones' ? ' rep' : T.u==='segundos' ? ' s' : T.u==='metros' ? ' m' : ' ' + T.u);
    F.push({n:T.n, txt:tx, c:tx, ref:t.id, test:t.t, mt:t.t==='cooper' ? t.v : t.t==='cam6' ? t.v : 0, cat:t.t==='cooper' ? 'correr' : 'marchar'}); });
  return {F, control:C.find(c=>c.eval) || C[0] || null};
}
/* ¿La misma prueba ya está registrada como entrenamiento ese día? (no se cuenta dos veces) */
const yaRegistrada = (f, x)=>S.sesiones.some(s=>{ if(s.fecha!==f || s.tipo==='pruebas') return false; const U = s.w && s.w.uno; if(!U) return false;
  if(x.ej==='psf2400') return U.c==='dist' && catKm(U.mov)==='correr' && Math.abs((metros(U.dist, U.distU) || 0) - 2400) < 60;
  return x.ej && U.mov && ({abd1:/^abdominal/, barras:/^barras$/, flex1:/^flexiones$/}[x.ej] || /^$/).test(U.mov) && ent(U.reps)===x.v; });
function sincronizarPruebas(){
  if(!S || !Array.isArray(S.sesiones)) return false;
  const hoy = hoyISO(), fechas = new Set([].concat((S.controles || []).filter(c=>!c.antigua), S.marcas || [], S.evals || [], S.tests || []).map(x=>x.fecha).filter(f=>f && f >= PR_DESDE && f <= hoy)); let cambio = false;
  for(let k = S.sesiones.length - 1; k >= 0; k--){ const s = S.sesiones[k]; if(s.tipo==='pruebas' && (!fechas.has(s.fecha) || (S.prFuera || {})[s.fecha])){ S.sesiones.splice(k, 1); cambio = true; } }   // sin reemplazar el arreglo: alguien puede tenerlo en uso
  fechas.forEach(f=>{ if((S.prFuera || {})[f]) return;
    const {F, control} = filasPruebas(f), L = F.filter(x=>!yaRegistrada(f, x)), id = 'pr-' + f, i = S.sesiones.findIndex(s=>s.id===id), s0 = i >= 0 ? S.sesiones[i] : null;
    if(!L.length || (control && control.eval && S.sesiones.some(s=>s.fecha===f && s.tipo!=='pruebas' && /^(control|prueba)s?\b.*(psf|suficiencia)|^psf$/i.test(s.titulo || '')))){ if(s0){ S.sesiones.splice(i, 1); cambio = true; } return; }
    const psf = L.some(x=>x.ej), m = {}; if(L.some(x=>x.ej==='psf2400')) m.correr = 2400; L.forEach(x=>{ if(x.mt) m[x.cat] = (m[x.cat] || 0) + x.mt; });
    const ev = control && control.eval && PSF.NOMBRES[control.eval], titulo = ev ? 'PSF · ' + ev : control ? 'Control PSF' : psf ? 'Pruebas PSF' : L.length===1 ? L[0].n : 'Pruebas físicas';
    const n = Object.assign({id, fecha:f, creado:Date.now(), tipo:'pruebas', recs:[], rpe:'8', dur:Math.min(60, 15 + 8 * L.length)}, s0 || {}, {titulo, txt:L.map(x=>x.c).join(' · '), pr:{filas:L, psf, m, ev:control && control.eval || ''}});
    if(!s0){ S.sesiones.push(n); cambio = true; } else if(JSON.stringify(n)!==JSON.stringify(s0)){ S.sesiones[i] = n; cambio = true; } });
  return cambio;
}
/* Cuánto cambió una prueba frente a la anterior, y si es récord */
function cambioPrueba(x, f){
  if(x.ej){ const prev = valoresDe(x.ej).filter(o=>o.fecha < f), p = prev[prev.length - 1]; if(!p) return {t:'primera marca', k:0};
    const dif = x.ej==='psf2400' ? p.valor - x.v : x.v - p.valor, a = Math.abs(dif), u = x.ej==='psf2400' ? ' s' : '';
    const rec = prev.every(o=>x.ej==='psf2400' ? x.v < o.valor : x.v > o.valor);
    return dif===0 ? {t:'= igual', k:0} : {t:(dif > 0 ? '▲ ' : '▼ ') + a + u + (x.ej==='psf2400' ? (dif > 0 ? ' mejor' : ' más lento') : dif > 0 ? ' más' : ' menos'), k:dif > 0 ? 1 : -1, rec}; }
  if(x.test){ const L = S.tests.filter(t=>t.t===x.test && t.fecha < f).sort((a, b)=>a.fecha < b.fecha ? 1 : -1)[0], n = S.tests.find(t=>t.id===x.ref), m = L && n && mejoraTest(x.test, n, L);
    if(!L) return {t:'primera marca', k:0}; const mej = MENOR_MEJOR && (MENOR_MEJOR.has ? MENOR_MEJOR.has(x.test) : MENOR_MEJOR.includes && MENOR_MEJOR.includes(x.test)) ? L.v - n.v : n.v - L.v;
    return mej===0 ? {t:'= igual', k:0} : {t:mej > 0 ? '▲ mejoraste' : '▼ bajaste', k:mej > 0 ? 1 : -1}; }
  return {t:'', k:0};
}
function faltaPSF(s){   // lo que falta para el nivel siguiente, en la prueba más cerca
  if(!s.pr.psf) return ''; const p = perfilPSF(); if(!p.sexo || p.edad==null) return '';
  const R = s.pr.filas.filter(x=>x.ej).map(x=>{ try{ if((x.ej==='barras' && PSF.pruebaBrazos(p)!=='barra') || (x.ej==='flex1' && PSF.pruebaBrazos(p)==='barra')) return null;
    const r = x.ej==='psf2400' ? PSF.carrera(p, x.v) : x.ej==='abd1' ? PSF.abdominales(p, x.v) : PSF.brazos(p, x.v); return r && r.nivel!=='MB' ? {x, r} : null; }catch(e){ return null; } }).filter(Boolean);
  if(!R.length) return s.pr.filas.filter(x=>x.ej).length >= 3 ? 'Tus tres pruebas están en Apto muy bueno.' : '';
  const a = R.find(q=>q.r.nivel!=='A') || R[0], meta = a.r.nivel==='A' ? 'Apto muy bueno' : 'Apto', n = a.r.nivel==='A' ? a.r.faltaMB : a.r.faltaA;
  return a.x.ej==='psf2400' ? `En la carrera te sobran ${PSF.verTiempo(n)} para ${meta}.` : `Te faltan ${n} ${a.x.ej==='abd1' ? 'abdominales' : a.x.ej==='barras' ? 'barras' : 'flexiones'} para ${meta}.`;
}
function htmlPruebasDia(s, sin){
  const C = s.pr.filas.map(x=>[x, cambioPrueba(x, s.fecha)]), recs = C.filter(([, c])=>c.rec), falta = faltaPSF(s);
  return `<div class="pr-caja"><small>${s.pr.psf ? 'Pruebas de suficiencia física' : 'Pruebas físicas'}</small>${s.pr.ev ? `<div class="pr-ev">${PSF.NOMBRES[s.pr.ev]}</div>` : ''}
    ${C.map(([x, c])=>`<div class="pr-fila"><span>${esc(x.n)}</span><span><b class="num">${esc(x.txt)}</b>${c.t ? ` <em class="${c.k > 0 ? 'sube' : c.k < 0 ? 'baja' : ''}">${c.t}</em>` : ''}</span></div>`).join('')}</div>
    ${(a=>a ? `<div class="suave chico">Tu PSF anterior: ${esc(nomCtrl(a))}</div>` : '')(s.pr.psf && (S.controles || []).filter(c=>c.fecha < s.fecha).sort((a, b)=>a.fecha < b.fecha ? 1 : -1)[0])}${recs.map(([x])=>`<div class="pr-rec">🏆 Récord personal en ${esc(x.n.toLowerCase())}</div>`).join('')}${falta ? `<div class="suave chico">${falta}</div>` : ''}${sin ? '' : `<button class="btn ancho" data-prver="${s.id}">Ver el detalle</button>`}`;
}
function verPruebasDia(s){
  const m = metricas(s), kc = kcalDe(s);
  dialogo(`<div class="cab"><div style="flex:1;min-width:0"><div class="etiqueta">Pruebas físicas</div><h2 style="margin:2px 0">${esc(s.titulo)}</h2><div class="suave chico num">📅 ${verFecha(s.fecha)}</div></div><button class="btn chico-btn" data-cerrar aria-label="Cerrar">✕</button></div>
    ${(s.fotos || []).length ? `<div class="galeria">${s.fotos.map(id=>`<img data-foto="${id}" alt="Foto de la prueba">`).join('')}</div>` : ''}${htmlPruebasDia(s, true)}
    <div class="fila2"><div><label>Duración (min)</label><input id="prDur" type="number" inputmode="numeric" min="5" max="300" value="${ent(s.dur) || 30}"></div><div><label>Esfuerzo</label><select id="prRpe">${opcionesEsfuerzo(s.rpe)}</select></div></div>
    <p class="nota">${s.prEd ? '' : 'La duración y el esfuerzo son estimados: cámbialos si quieres. '}Cuenta para tu racha, semana, mes${m.km ? ', ' + verKm(m.km) : ''}${kc ? ' y ' + kc + ' kcal' : ''}. Las marcas se cambian en Pruebas.</p>
    <label class="check"><input type="checkbox" id="prAm" ${pref('amPruebas')==='1' ? 'checked' : ''}><span>Mostrar mis pruebas a mis amigos</span></label>
    <div class="btns"><button class="btn" id="prFoto">📷 Agregar foto</button><button class="btn prim" id="prComp">↗ Compartir</button></div>
    <div class="btns"><button class="btn" id="prIr">Ver en Pruebas</button><button class="btn peligro" id="prQuitar">No contarla</button></div>`, d=>{
    cargarFotos(d); $$('.galeria img', d).forEach(i=>i.onclick = ()=>verFoto(s, i.dataset.foto));
    const ses = ()=>S.sesiones.find(x=>x.id===s.id) || s, ed = ()=>{ const x = ses(); x.dur = Math.max(5, Math.min(300, ent($('#prDur', d).value) || 30)); x.rpe = $('#prRpe', d).value || '8'; x.prEd = true; guardar(); VISTAS[vistaActual](); };
    $('#prDur', d).onchange = ed; $('#prRpe', d).onchange = ed;
    $('#prAm', d).onchange = e=>{ pref('amPruebas', e.target.checked ? '1' : ''); NC.pubFirma = null; if(conectado()) nubePublicar().catch(()=>{}); aviso(e.target.checked ? 'Tus amigos verán tus pruebas' : 'Tus pruebas quedan solo para ti'); };
    $('#prFoto', d).onclick = ()=>elegirFotos(async bs=>{ if(!bs.length) return; await agregarFotosA(ses(), bs); verPruebasDia(ses()); if(vistaActual==='diario') vDiario(); });
    $('#prComp', d).onclick = ()=>compartirSesion(ses()); $('#prIr', d).onclick = ()=>{ d.close(); ir('psf'); };
    $('#prQuitar', d).onclick = ()=>confirmar('¿Dejar de contarla como entrenamiento? Tus marcas quedan guardadas en Pruebas.', async ()=>{ await borrarFotosDe(ses()); (S.prFuera = S.prFuera || {})[s.fecha] = true; guardar(); ir(vistaActual); }, 'No contarla');
  });
}
/* ---------- Días sin entrenamiento ---------- */
const puedeAnotar = f=>f <= hoyISO() && (esPlus() || f >= desdeGratis());
function musculosDe(f){   // zonas trabajadas en los 3 días anteriores
  const z = {}; S.sesiones.filter(s=>s.fecha < f && s.fecha >= masDias(f, -3)).forEach(s=>Object.entries(contribuciones(s)).forEach(([id, o])=>{ const p = o.reps / 10 + o.m / 200 + o.cal / 5; zonasDe(id).filter(k=>k!=='cardio').forEach(k=>z[k] = (z[k] || 0) + p); }));
  const t = Object.values(z).reduce((a, b)=>a + b, 0); return t ? Object.entries(z).sort((a, b)=>b[1] - a[1]).slice(0, 3).map(([k, v])=>[k[0].toUpperCase() + k.slice(1), Math.round(v / t * 100)]).filter(x=>x[1] >= 5) : [];
}
function htmlDescansoDia(f){
  const hoy = f===hoyISO(), d = S.diario[f] || {}, K = [], r = racha();
  if(d.suenoH) K.push([Math.floor(d.suenoH) + ' h' + (Math.round(d.suenoH % 1 * 60) ? ' ' + Math.round(d.suenoH % 1 * 60) : ''), 'dormiste']); else if(d.sueno!=null && d.sueno!=='') K.push([['Mal', 'Regular', 'Bien'][+d.sueno] || '', 'dormiste']);
  if(d.agua) K.push([fmtL(d.agua), 'de agua']);
  const F = formaFisica(90), i = F.findIndex(x=>x.f===f); if(i > 0 && !F[i].est && F[i - 1].atl > 5){ const c = Math.round((F[i].atl / F[i - 1].atl - 1) * 100); if(c < 0) K.push(['−' + Math.abs(c) + ' %', 'cansancio']); }
  const M = musculosDe(f), g = masDias(f, 1), dm = !hoy && disposicion(S.diario[g]), sm = !hoy && S.sesiones.find(s=>s.fecha===g && s.tipo!=='descanso'), cuenta = fechasRacha().includes(f);
  const frase = dm ? `👉 Al día siguiente llegaste ${dm.pct} · ${dm.txt}` : sm ? '👉 Al día siguiente: ' + esc(tituloDe(sm)) : '';
  return `<div class="logro-dia otro dia-desc dd-desc"><div class="dd-cab"><span class="dd-luna">😴</span><div><div class="ld-tit">${hoy ? 'Hoy descanso' : 'Día de recuperación'}</div>
      <div class="ld-sub">${hoy ? 'Recuperar también es entrenar.' + (r ? ' Tu racha de ' + r + (r===1 ? ' día' : ' días') + ' sigue 🔥' : '') : verFecha(f) + (cuenta ? ' · no cortó tu racha' : '')}</div></div></div>
    ${K.length ? `<div class="dd-k">${K.map(([a, b])=>`<div><b class="num">${esc(a)}</b><small>${b}</small></div>`).join('')}</div>` : ''}
    <div class="dd-cuerpo">${M.length ? `<b>Tus músculos descansaron de</b><div class="dd-ch">${M.map(([k, v])=>`<span>${k} ${v} %</span>`).join('')}</div>` : ''}${frase ? `<div class="dd-frase">${frase}</div>` : ''}
      <div class="ld-btns">${hoy ? '<button class="btn" id="ldReg">＋ Entrené</button><button class="btn" id="ldDeshacer">Deshacer</button>' : `${puedeAnotar(f) ? `<button class="btn" data-ddent="${f}">＋ Sí entrené</button>` : ''}<button class="btn" data-dddes="${f}">Deshacer</button>`}</div></div></div>`;
}
function tocabaPlan(f){ if(!S.plan || (S.plan.desde && f < S.plan.desde)) return null; try{ const x = planDia(f); return x.tipo==='sesion' ? x : null; }catch(e){ return null; } }
function libreDesdeHoy(){ for(let k = 0; k <= 6; k++){ const g = masDias(hoyISO(), k); try{ const x = planDia(g); if(x.tipo==='fuera') return null; if(x.tipo==='descanso' && !S.sesiones.some(s=>s.fecha===g) && !(S.diario[g] || {}).descanso) return g; }catch(e){ return null; } } return null; }
function htmlSinRegistro(f){
  const fut = f > hoyISO(), x = tocabaPlan(f), lib = !fut && x && f >= masDias(hoyISO(), -7) ? libreDesdeHoy() : null;
  if(fut) return `<div class="logro-dia otro"><div class="ld-cab"><span class="ld-sello vacio">🗓</span><div><div class="ld-tit">${verFecha(f)}</div><div class="ld-sub">${x ? 'Mi plan: ' + esc(x.ses.n) + ' · ' + x.ses.min + ' min' : 'Aún sin nada planificado'}</div></div></div></div>`;
  const an = puedeAnotar(f);
  return `<div class="logro-dia otro"><div class="ld-tit">${verFecha(f)} · sin registro</div>${an ? `<div class="ld-sub">¿Qué pasó este día?</div><div class="dd-op">
      <button data-ddent="${f}">🏋️<b>Entrené</b><small>Anotarlo</small></button><button data-ddact="${f}">🔋<b>Activo</b><small>Caminé, movilidad</small></button><button data-dddesc="${f}">😴<b>Descansé</b><small>Día de recuperación</small></button></div>`
      : `<div class="ld-sub">Con el plan gratis se anotan los últimos ${DIAS_GRATIS} días.</div>`}
    ${x ? `<div class="dd-tocaba"><b>Lo que tocaba ese día</b><div class="suave chico">${esc(x.ses.n)} · ${x.ses.min} min (Mi plan)</div>${lib ? `<button class="btn ancho" data-ddmover="${f}|${lib}">Pasarla a ${lib===hoyISO() ? 'hoy' : verFecha(lib)}</button>` : ''}</div>` : ''}</div>`;
}
function enlazarDia(){
  $$('[data-ddent]').forEach(b=>b.onclick = ()=>{ abrirRegistro(); W.fecha = b.dataset.ddent; });
  $$('[data-ddact]').forEach(b=>b.onclick = ()=>{ dialogoDescanso(b.dataset.ddact); });
  $$('[data-dddesc]').forEach(b=>b.onclick = ()=>{ const f = b.dataset.dddesc; (S.diario[f] = S.diario[f] || {}).descanso = true; guardar(); aviso('😴 Día de descanso anotado'); vHoy(); });
  $$('[data-dddes]').forEach(b=>b.onclick = ()=>{ const d = S.diario[b.dataset.dddes]; if(d) delete d.descanso; guardar(); vHoy(); });
  $$('[data-ddmover]').forEach(b=>b.onclick = ()=>{ const [f, g] = b.dataset.ddmover.split('|'), x = planDia(f); if(x.tipo!=='sesion') return; const P = S.plan, ses = Object.assign({}, x.ses); delete ses.inbody; P.cambios = P.cambios || {}; P.cambios[g] = ses; P.cambios[f] = {tipo:'descanso'}; guardar(); aviso('Sesión pasada a ' + (g===hoyISO() ? 'hoy' : verFecha(g))); vHoy(); });
  $$('[data-prver]').forEach(b=>b.onclick = e=>{ e.stopPropagation(); verPruebasDia(S.sesiones.find(s=>s.id===b.dataset.prver)); });
}
/* Cambio de día con la app abierta: vuelve sola a hoy (antes seguía mostrando el día anterior) */
let diaVisto = '';
function revisarCambioDia(){ const h = hoyISO(); if(h===diaVisto) return false; if(!diaVisto){ diaVisto = h; return false; } diaVisto = h; diaSel = new Date(); mesPortada = null; subtitulo(); if(sincronizarPruebas()) guardar(); return true; }
if(typeof document!=='undefined') document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible' && revisarCambioDia() && vistaActual==='hoy') vHoy(); });
