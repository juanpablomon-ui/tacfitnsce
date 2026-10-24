/* #TACFITNSCE — Recordatorio para repetir las pruebas (24-oct-2026, pedido del usuario). Cada prueba hecha (S.tests), el control PSF
   (S.controles) y el InBody (S.medidas con m.inbody) se repiten cada S.perfil.repetirSem semanas (8 por omisión; se cambia en Pruebas).
   Cuando toca, Inicio muestra «🔁 Toca repetir» con «Hacerla» (lleva a la prueba) y «En una semana» (S.posponerPrueba[k] = fecha).
   En cada tarjeta de prueba se ve la próxima fecha y cuánto mejoraste respecto de la vez anterior. */
const SEM_REPETIR = [4, 6, 8, 12];
const semRepetir = ()=>ent(S.perfil.repetirSem) || 8;
const MENOR_MEJOR = ['levanta', 'aft_sdc', 'aft_2m', 'rockport', 'hyrox'];   // en estas, menos es mejor
const bateriaDeTest = t=>(BATERIAS.find(b=>(b.tests || []).includes(t)) || {}).id;
/* La última vez de cada prueba que la persona ya hizo */
function ultimasPruebas(){
  const out = {}, tomar = (k, n, fecha, txt, bat)=>{ if(!out[k] || fecha > out[k].fecha) out[k] = {k, n, fecha, txt, bat}; };
  (S.tests || []).forEach(r=>{ const T = TESTS[r.t]; if(T) tomar(r.t, T.n, r.fecha, verValorTest(r.t, r), bateriaDeTest(r.t)); });
  (S.controles || []).forEach(c=>tomar('psf', 'Control PSF', c.fecha, c.carrera ? '2.400 m en ' + PSF.verTiempo(c.carrera) : '', 'psf'));
  if(typeof conInBody==='function'){ const m = conInBody()[0]; if(m) tomar('inbody', 'InBody', m.fecha, m.grasa ? coma(m.grasa) + ' % de grasa' : '', null); }
  return Object.values(out);
}
function proximaPrueba(fecha){ const p = masDias(fecha, semRepetir() * 7); return {fecha:p, dias:diasEntre(hoyISO(), p)}; }
function pruebasPorRepetir(){
  const hoy = hoyISO(), pos = S.posponerPrueba || {};
  return ultimasPruebas().map(x=>Object.assign(x, proximaPrueba(x.fecha), {hace:diasEntre(x.fecha, hoy)}))
    .filter(x=>x.dias <= 0 && !(pos[x.k] && pos[x.k] > hoy)).sort((a, b)=>a.fecha < b.fecha ? -1 : 1);
}
const haceTxt = d=>d < 14 ? 'hace ' + d + ' días' : d < 60 ? 'hace ' + Math.floor(d / 7) + ' semanas' : 'hace ' + Math.floor(d / 30) + ' meses';
function htmlRepetir(){
  const L = pruebasPorRepetir(); if(!L.length) return '';
  const ver = L.slice(0, 2);
  return `<div class="tarjeta repetir" id="repTarjeta"><div class="etiqueta">🔁 Toca repetir ${L.length===1 ? 'una prueba' : L.length + ' pruebas'}</div>
    ${ver.map(x=>`<div class="rep-fila"><div><b>${esc(x.n)}</b><div class="suave chico num">${x.txt ? esc(x.txt) + ' · ' : ''}${haceTxt(x.hace)}</div></div><button class="btn chico-btn prim" data-rep="${x.k}">Hacerla ›</button></div>`).join('')}
    ${L.length > 2 ? `<div class="suave chico">y ${L.length - 2} más en Pruebas</div>` : ''}
    <div class="ahora-txt chico">👉 <b>Ahora:</b> hazla esta semana, a la misma hora, en el mismo lugar y descansado, para comparar bien.</div>
    <details class="tc-como"><summary>❔ ¿Por qué repetirla?</summary><p class="chico">El cuerpo cambia en 6 a 12 semanas de entrenamiento. Repetir la misma prueba, en las mismas condiciones, es la única forma de saber si tu entrenamiento está funcionando. Ejemplo: si en el Cooper pasaste de 2.300 a 2.450 m, tu resistencia subió.</p></details>
    <button class="link chico" id="repPos">Recuérdamelo en una semana</button></div>`;
}
function irAPrueba(k){
  if(k==='inbody'){ ir('perfil'); if(typeof dialogoInBody==='function') dialogoInBody(); return; }
  bateriaSel = k==='psf' ? 'psf' : bateriaDeTest(k) || bateriaSel; pref('bateria', bateriaSel); ir('psf');
  setTimeout(()=>{ const c = document.getElementById('tc_' + k); if(c){ c.scrollIntoView({block:'center'}); c.classList.add('destacar'); } }, 80);
}
function enlazarRepetir(){
  $$('[data-rep]').forEach(b=>b.onclick = ()=>irAPrueba(b.dataset.rep));
  if($('#repPos')) $('#repPos').onclick = ()=>{ const p = masDias(hoyISO(), 7); S.posponerPrueba = S.posponerPrueba || {};
    pruebasPorRepetir().forEach(x=>S.posponerPrueba[x.k] = p); guardar(); aviso('Te lo recuerdo el ' + verFecha(p)); const y = window.scrollY; vHoy(); window.scrollTo(0, y); };
}
/* Cuánto cambió entre la última vez (a) y la anterior (b) */
function mejoraTest(t, a, b){
  if(!a || !b || a.v==null || b.v==null || a.v===b.v) return null;
  const T = TESTS[t], d = a.v - b.v, mejor = MENOR_MEJOR.includes(t) ? d < 0 : d > 0, ad = Math.abs(d);
  const txt = T.tiempo ? PSF.verTiempo(Math.round(ad)) : fmtNum(Math.round(ad * 10) / 10) + ' ' + (t==='navette' ? (ad===1 ? 'palier' : 'paliers') : T.u);
  return {mejor, txt:(mejor ? 'mejoraste ' : 'bajaste ') + txt};
}
function htmlProximaTest(t){
  const H = (S.tests || []).filter(r=>r.t===t).sort((a, b)=>a.fecha < b.fecha ? 1 : -1); if(!H.length) return '';
  const m = mejoraTest(t, H[0], H[1]), p = proximaPrueba(H[0].fecha);
  return `<div class="tc-rep chico">${m ? `<span class="${m.mejor ? 'sube' : 'baja'}">${m.mejor ? '▲' : '▼'} ${esc(m.txt)}</span> · ` : ''}<span class="${p.dias <= 0 ? 'toca' : 'suave'}">🔁 ${p.dias <= 0 ? 'Toca repetirla' : 'Repetir el ' + verFecha(p.fecha) + ' (en ' + (p.dias < 14 ? p.dias + ' días' : Math.round(p.dias / 7) + ' semanas') + ')'}</span></div>`;
}
const htmlSelRepetir = ()=>`<label class="pr-rep chico">🔁 Recordarme repetir cada <select id="prRep">${SEM_REPETIR.map(n=>`<option value="${n}"${n===semRepetir() ? ' selected' : ''}>${n} semanas</option>`).join('')}</select></label>`;
function enlazarSelRepetir(alCambiar){ const s = $('#prRep'); if(s) s.onchange = ()=>{ S.perfil.repetirSem = +s.value; guardar(); aviso('Te aviso cada ' + s.value + ' semanas'); alCambiar(); }; }
