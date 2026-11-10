/* #NSCE — Sesiones por tramos (como Garmin o TrainingPeaks): calentamiento, principal (o bloques de trabajo y recuperación
   que se repiten) y vuelta a la calma. Cada tramo por distancia, tiempo o «hasta tocar siguiente», con intensidad por zona (Z1-Z5),
   ritmo o esfuerzo 1-10 (decisión del usuario: ritmo y esfuerzo, sin frecuencia cardiaca). En carrera, las zonas se traducen a tu
   ritmo con tu mejor 2.400 m. Se usa en «Un solo movimiento» (w.uno.tramos). Carga después de registro.js y antes de app.js. */

const ZONAS_INT = {
  Z1:{n:'Muy suave', d:'recuperación, calentamiento y vuelta a la calma', rpe:[1, 2], f:[1.45, 1.65], c:'#9aa0aa'},
  Z2:{n:'Suave', d:'base aeróbica: puedes conversar', rpe:[3, 4], f:[1.30, 1.45], c:'#36b6ea'},
  Z3:{n:'Moderado', d:'tempo: frases cortas', rpe:[5, 6], f:[1.15, 1.30], c:'#4fd17a'},
  Z4:{n:'Fuerte', d:'umbral: pocas palabras', rpe:[7, 8], f:[1.04, 1.15], c:'#f2a33a'},
  Z5:{n:'Muy fuerte', d:'VO₂máx: no puedes hablar', rpe:[9, 10], f:[0.95, 1.04], c:'#ef5b4c'},
};
const TIPO_TRAMO = {cal:'Calentamiento', pri:'Principal', trab:'Trabajo', rec:'Recuperación', calma:'Vuelta a la calma'};
const nuevoTramo = (k, extra)=>Object.assign({k, med:k==='pri' || k==='trab' ? 'dist' : 'tiempo', v:'', u:'km', int:k==='pri' ? 'Z2' : k==='trab' ? 'Z4' : 'Z1', ritmo:'', rpe:'', nota:'', real:{}}, extra || {});
/* Ritmo de referencia (s/km) para carrera: el de tu mejor 2.400 m */
const esCarrera = mov=>typeof catKm==='function' && catKm(mov)==='correr';
const pkRef = ()=>{ const r = typeof ritmos==='function' ? ritmos() : null; return r ? r.pk : null; };
function rangoRitmo(z){ const pk = pkRef(), Z = ZONAS_INT[z]; return pk && Z ? [Math.round(pk * Z.f[0]), Math.round(pk * Z.f[1])] : null; }
function zonaDeRitmo(sKm){ const pk = pkRef(); if(!pk || !sKm) return null; const f = sKm / pk;
  return f < ZONAS_INT.Z5.f[1] ? 'Z5' : f < ZONAS_INT.Z4.f[1] ? 'Z4' : f < ZONAS_INT.Z3.f[1] ? 'Z3' : f < ZONAS_INT.Z2.f[1] ? 'Z2' : 'Z1'; }
const rangoTxt = r=>{ const c = v=>PSF.verTiempo(Math.round(enMillas() ? v * KM_MI : v)); return c(r[0]) + '–' + c(r[1]) + ' /' + uDist(); };
/* Texto de la intensidad de un tramo: «Z2 · 5:40–6:10 /km · esfuerzo 3-4» */
function textoIntensidad(t, mov){
  if(t.int==='ritmo' && t.ritmo) return t.ritmo + ' /km';
  if(t.int==='rpe' && t.rpe) return 'esfuerzo ' + t.rpe + '/10';
  const Z = ZONAS_INT[t.int]; if(!Z) return '';
  const r = esCarrera(mov) && rangoRitmo(t.int);
  return t.int + ' · ' + (r ? rangoTxt(r) + ' · ' : '') + 'esfuerzo ' + Z.rpe.join('-');
}
const colorTramo = t=>ZONAS_INT[t.int] ? ZONAS_INT[t.int].c : t.int==='rpe' && t.rpe ? ZONAS_INT['Z' + Math.min(5, Math.max(1, Math.ceil(+t.rpe / 2)))].c : t.k==='trab' ? ZONAS_INT.Z4.c : ZONAS_INT.Z1.c;
const altoTramo = t=>{ const z = ZONAS_INT[t.int] ? +t.int[1] : t.int==='rpe' && t.rpe ? Math.ceil(+t.rpe / 2) : t.int==='ritmo' ? 3 : t.k==='trab' ? 4 : 1; return 22 + z * 15; };
/* Los bloques se expanden: [{bloque, veces, tramos}] → tramos sueltos con «Trabajo 2/5» */
function expandirTramos(ts){
  const out = [];
  (ts || []).forEach((t, i)=>{ if(t.bloque){ const n = Math.max(1, ent(t.veces) || 1); for(let r = 1; r <= n; r++) (t.tramos || []).forEach((x, j)=>out.push(Object.assign({}, x, {rep:r, de:n, ref:i + '.' + j, real:((t.reales || {})[r + ':' + j]) || {}}))); }
    else out.push(Object.assign({}, t, {ref:String(i)})); });
  return out;
}
const metrosTramo = t=>t.med==='dist' ? metros(t.v, t.u) : null;
const segTramo = t=>t.med==='tiempo' ? PSF.leerTiempo(t.v) : null;
/* Ritmo estimado del tramo (s/km): ritmo escrito o el centro de la zona (solo carrera) */
function ritmoTramo(t, mov){ if(t.int==='ritmo' && t.ritmo) return PSF.leerTiempo(t.ritmo); const r = esCarrera(mov) && rangoRitmo(t.int); return r ? (r[0] + r[1]) / 2 : null; }
/* Totales planificados (distancia y tiempo estimado) y reales (lo anotado) */
function totalesTramos(U){
  const xs = expandirTramos(U.tramos); let m = 0, mOk = true, s = 0, sOk = true, rm = 0, rs = 0, rsOk = xs.length > 0;
  xs.forEach(t=>{ const pm = metrosTramo(t), ps = segTramo(t), ri = ritmoTramo(t, U.mov);
    const em = pm!=null ? pm : ps && ri ? ps / ri * 1000 : null, es = ps!=null ? ps : pm && ri ? pm / 1000 * ri : null;
    if(em==null) mOk = false; else m += em; if(es==null) sOk = false; else s += es;
    const realT = PSF.leerTiempo((t.real || {}).t), realM = num((t.real || {}).d) != null ? metros(t.real.d, t.u==='km' || t.u==='mi' ? t.u : 'm') : null;
    rm += realM!=null ? realM : pm!=null ? pm : 0; if(realT==null) rsOk = false; else rs += realT; });
  return {plan:{m:Math.round(m), mOk, s:Math.round(s), sOk}, m:Math.round(rm), t:rsOk ? rs : null, n:xs.length};
}
/* Al guardar: la distancia total y el tiempo (si se anotó cada tramo) pasan a los campos del registro */
function sincronizarTramos(U){
  if(!U || !U.tramos || !U.tramos.length || U.c!=='dist') return;
  const T = totalesTramos(U); if(T.m) { U.dist = String(T.m); U.distU = 'm'; } if(T.t!=null) U.tiempo = PSF.verTiempo(T.t);
}
/* Vista: barra de colores por intensidad y la lista de tramos (con lo real si se anotó) */
function barraTramos(U){
  const xs = expandirTramos(U.tramos); if(!xs.length) return '';
  const peso = t=>{ const pm = metrosTramo(t), ps = segTramo(t), ri = ritmoTramo(t, U.mov) || 360; return pm!=null ? pm / 1000 * ri : ps!=null ? ps : 300; };
  return `<div class="tr-barra">${xs.map(t=>`<i style="flex:${Math.max(0.2, peso(t) / 60).toFixed(2)};height:${altoTramo(t)}%;background:${colorTramo(t)}" title="${esc(TIPO_TRAMO[t.k])}"></i>`).join('')}</div>`;
}
function cantTramo(t){ return t.med==='dist' ? fmtD(t.v, t.u) : t.med==='tiempo' ? (t.v || '') : 'libre'; }
function filaTramo(t, mov, pref){
  const real = t.real || {}, rt = PSF.leerTiempo(real.t), rm = num(real.d)!=null ? metros(real.d, t.u==='km' || t.u==='mi' ? t.u : 'm') : metrosTramo(t);
  const rk = rt && rm ? rt / (rm / 1000) : null, zr = rk && esCarrera(mov) ? zonaDeRitmo(rk) : null, enZona = zr && ZONAS_INT[t.int] ? zr===t.int : null;
  return `<div class="tr-fila" style="border-left-color:${colorTramo(t)}">
    <div><div class="tr-k">${pref || ''}${esc(TIPO_TRAMO[t.k] || 'Tramo')}${t.rep ? ' ' + t.rep + '/' + t.de : ''}</div>
      <b class="num">${esc(cantTramo(t))}</b> <span class="tr-int">${esc(textoIntensidad(t, mov))}</span>${t.nota ? `<div class="tr-nota">${esc(t.nota)}</div>` : ''}
      ${rt ? `<div class="tr-real num">${PSF.verTiempo(rt)}${rk ? ' · ' + verRitmo(rk) : ''}${enZona===true ? ' <span class="tr-ok">✓ en zona</span>' : enZona===false ? ` <span class="tr-fuera">${zr}</span>` : ''}</div>` : ''}</div>
    ${ZONAS_INT[t.int] ? `<span class="tr-z" style="background:${ZONAS_INT[t.int].c}">${t.int}</span>` : ''}</div>`;
}
function htmlTramosVista(U){
  if(!U || !U.tramos || !U.tramos.length) return '';
  const T = totalesTramos(U), filas = [];
  U.tramos.forEach((t, i)=>{ if(t.bloque){ const xs = expandirTramos([t]);
      filas.push(`<div class="tr-bloque"><div class="tr-rep">Repetir ${esc(String(t.veces || 1))} veces</div>${(t.tramos || []).map(x=>filaTramo(x, U.mov)).join('')}
        ${xs.some(x=>PSF.leerTiempo((x.real || {}).t)) ? `<details class="tr-det"><summary>Ver cada repetición</summary>${xs.map(x=>filaTramo(x, U.mov)).join('')}</details>` : ''}</div>`); }
    else filas.push(filaTramo(t, U.mov)); });
  return `<div class="tramos-vista">${barraTramos(U)}
    <div class="tr-tot num">${T.plan.mOk && T.plan.m ? `<span><small>Distancia</small><b>${verDist(T.plan.m)}</b></span>` : ''}${T.plan.sOk && T.plan.s ? `<span><small>Tiempo est.</small><b>~${PSF.verTiempo(Math.round(T.plan.s / 60) * 60)}</b></span>` : ''}${T.t!=null ? `<span><small>Tiempo real</small><b>${PSF.verTiempo(T.t)}</b></span>` : ''}</div>
    ${filas.join('')}</div>`;
}

/* ---------- Editor de tramos en el registro (dentro del paso «Un solo movimiento») ---------- */
function opcionesIntensidad(t){
  return `<option value="">Sin meta</option>${Object.entries(ZONAS_INT).map(([k, Z])=>`<option value="${k}" ${t.int===k ? 'selected' : ''}>${k} · ${Z.n}</option>`).join('')}
    <option value="ritmo" ${t.int==='ritmo' ? 'selected' : ''}>Ritmo (min/km)</option><option value="rpe" ${t.int==='rpe' ? 'selected' : ''}>Esfuerzo 1-10</option>`;
}
function editorTramo(t, ruta, U, enBloque){
  const tipos = U.c==='dist' ? (enBloque ? ['trab', 'rec'] : ['cal', 'pri', 'calma']) : ['cal', 'calma'];
  const unidad = t.med==='dist' ? `<select data-tr="${ruta}:u">${Object.entries(UNID_DIST).map(([k, v])=>`<option value="${k}" ${t.u===k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>` : '';
  return `<div class="tr-ed" style="border-left-color:${colorTramo(t)}">
    <div class="tr-ed-cab"><select data-tr="${ruta}:k">${tipos.map(k=>`<option value="${k}" ${t.k===k ? 'selected' : ''}>${TIPO_TRAMO[k]}</option>`).join('')}</select>
      <span class="tr-acc"><button class="btn chico-btn" data-trdup="${ruta}" aria-label="Copiar">⧉</button><button class="btn chico-btn" data-trdel="${ruta}" aria-label="Quitar">✕</button></span></div>
    <div class="segmentos tr-med">${[['dist', 'Distancia'], ['tiempo', 'Tiempo'], ['libre', 'Libre']].filter(([k])=>U.c==='dist' || k!=='dist').map(([k, n])=>`<button data-trmed="${ruta}:${k}" class="${t.med===k ? 'activa' : ''}">${n}</button>`).join('')}</div>
    ${t.med!=='libre' ? `<div class="tr-val"><input data-tr="${ruta}:v" ${t.med==='tiempo' ? 'data-tiempo inputmode="numeric" placeholder="min:seg"' : 'inputmode="decimal" placeholder="distancia"'} value="${esc(t.v)}">${unidad}</div>` : '<p class="nota" style="margin:4px 0">Termina cuando tú lo decidas.</p>'}
    <div class="tr-val"><select data-tr="${ruta}:int">${opcionesIntensidad(t)}</select>
      ${t.int==='ritmo' ? `<input data-tr="${ruta}:ritmo" data-tiempo inputmode="numeric" placeholder="ej.: 540 → 5:40" value="${esc(t.ritmo)}">` : t.int==='rpe' ? `<select data-tr="${ruta}:rpe">${opcionesEsfuerzo(t.rpe || 5)}</select>` : ''}</div>
    ${ZONAS_INT[t.int] ? `<p class="nota" style="margin:2px 0">${esc(textoIntensidad(t, U.mov))} · ${esc(ZONAS_INT[t.int].d)}</p>` : ''}
    <input data-tr="${ruta}:nota" placeholder="Nota (opcional): ej. trote suave + 4 progresivos" value="${esc(t.nota || '')}">
  </div>`;
}
/* Ruta de un tramo: «i» (suelto) o «i.j» (dentro del bloque i) */
function tramoDe(U, ruta){ const [i, j] = ruta.split('.').map(Number); return j==null || isNaN(j) ? U.tramos[i] : U.tramos[i].tramos[j]; }
function htmlEditorTramos(U){
  const ts = U.tramos || [];
  const items = ts.map((t, i)=>t.bloque
    ? `<div class="tr-bloque-ed"><div class="entre"><span class="tr-rep">Repetir <input class="tr-veces" data-trveces="${i}" type="number" inputmode="numeric" min="1" value="${esc(String(t.veces || 2))}"> veces</span><button class="btn chico-btn" data-trdel="${i}" aria-label="Quitar bloque">✕</button></div>
        ${(t.tramos || []).map((x, j)=>editorTramo(x, i + '.' + j, U, true)).join('')}<button class="link" data-trmasb="${i}">＋ Tramo en el bloque</button></div>`
    : editorTramo(t, String(i), U, false)).join('');
  const T = totalesTramos(U);
  return `<div class="tramos-ed"><div class="entre"><h3 style="margin:14px 0 6px">Tramos</h3>${ts.length ? `<button class="link" id="trQuitar">Quitar tramos</button>` : ''}</div>
    ${ts.length ? `${barraTramos(U)}${items}
      <div class="acciones"><button class="link" data-tradd="${U.c==='dist' ? 'pri' : 'cal'}">＋ Tramo</button>${U.c==='dist' ? '<button class="link" id="trBloque">＋ Bloque que se repite</button>' : ''}</div>
      ${T.plan.m || T.plan.s ? `<p class="suave chico num">Total planificado: ${T.plan.m ? verDist(T.plan.m) : ''}${T.plan.m && T.plan.s ? ' · ' : ''}${T.plan.s && T.plan.sOk ? '~' + PSF.verTiempo(Math.round(T.plan.s / 60) * 60) : ''}</p>` : ''}`
      : `<p class="suave chico" style="margin-top:0">${U.c==='dist' ? 'Arma la sesión como Garmin: calentamiento, el trabajo principal (o bloques que se repiten) y vuelta a la calma, cada uno con su distancia o tiempo y su intensidad.' : 'Agrega calentamiento y vuelta a la calma (tiempo y qué hiciste).'}</p>
        <button class="btn ancho" id="trArmar">＋ Armar por tramos</button>`}</div>`;
}
/* Resultado por tramo (opcional): tiempo real y distancia real si el tramo era por tiempo */
function htmlResultadoTramos(U){
  if(!U.tramos || !U.tramos.length || U.c!=='dist') return '';
  const xs = expandirTramos(U.tramos);
  return `<div class="tr-res"><div class="etiqueta" style="margin-top:12px">Resultado por tramo (opcional)</div>
    ${xs.map(t=>`<div class="tr-res-fila"><span><b>${esc(TIPO_TRAMO[t.k])}${t.rep ? ' ' + t.rep + '/' + t.de : ''}</b><br><span class="suave chico">${esc(cantTramo(t))}${t.int ? ' · ' + esc(ZONAS_INT[t.int] ? t.int : textoIntensidad(t, U.mov)) : ''}</span></span>
      <input data-trreal="${t.ref}${t.rep ? ':' + t.rep : ''}:t" data-tiempo inputmode="numeric" placeholder="tiempo" value="${esc((t.real || {}).t || '')}">
      ${t.med!=='dist' ? `<input data-trreal="${t.ref}${t.rep ? ':' + t.rep : ''}:d" inputmode="decimal" placeholder="${t.u==='mi' ? 'mi' : t.u==='km' ? 'km' : 'metros'}" value="${esc((t.real || {}).d || '')}">` : '<span></span>'}</div>`).join('')}
    <p class="nota">Si anotas el tiempo de todos los tramos, el total se calcula solo. Si no, escribe solo el tiempo total arriba.</p></div>`;
}
function guardarReal(U, clave, valor){
  const [ref, a, b] = clave.split(':'), [i, j] = ref.split('.').map(Number), campo = b || a, rep = b ? a : null;
  if(j==null || isNaN(j)){ const t = U.tramos[i]; t.real = t.real || {}; t.real[campo] = valor; }
  else { const B = U.tramos[i]; B.reales = B.reales || {}; const k = rep + ':' + j; B.reales[k] = B.reales[k] || {}; B.reales[k][campo] = valor; }
}
function enlazarEditorTramos(d, U){
  const re = ()=>{ const y = (d.querySelector('.dlg-cuerpo') || d).scrollTop; pintar(); const n = $('#dialogo'); if(n) (n.querySelector('.dlg-cuerpo') || n).scrollTop = y; };
  if($('#trArmar', d)) $('#trArmar', d).onclick = ()=>{ U.tramos = U.c==='dist' ? [nuevoTramo('cal', {v:'2'}), nuevoTramo('pri', {v:U.dist || '6', u:U.distU==='m' && num(U.dist) >= 1000 ? 'km' : 'km'}), nuevoTramo('calma', {v:'2'})]
      : [nuevoTramo('cal', {v:'10:00'}), nuevoTramo('calma', {v:'5:00'})]; re(); };
  if($('#trQuitar', d)) $('#trQuitar', d).onclick = ()=>{ U.tramos = null; re(); };
  if($('#trBloque', d)) $('#trBloque', d).onclick = ()=>{ const k = U.tramos.findIndex(t=>t.k==='calma'); const B = {bloque:true, veces:'5', tramos:[nuevoTramo('trab', {v:'1'}), nuevoTramo('rec', {med:'tiempo', v:'2:00'})]};
    if(k >= 0) U.tramos.splice(k, 0, B); else U.tramos.push(B); re(); };
  $$('[data-tradd]', d).forEach(b=>b.onclick = ()=>{ const k = U.tramos.findIndex(t=>t.k==='calma'); const t = nuevoTramo(b.dataset.tradd); if(k >= 0) U.tramos.splice(k, 0, t); else U.tramos.push(t); re(); });
  $$('[data-trmasb]', d).forEach(b=>b.onclick = ()=>{ U.tramos[+b.dataset.trmasb].tramos.push(nuevoTramo('trab')); re(); });
  $$('[data-trdel]', d).forEach(b=>b.onclick = ()=>{ const [i, j] = b.dataset.trdel.split('.').map(Number); if(j==null || isNaN(j)) U.tramos.splice(i, 1); else U.tramos[i].tramos.splice(j, 1); if(!U.tramos.length) U.tramos = null; re(); });
  $$('[data-trdup]', d).forEach(b=>b.onclick = ()=>{ const [i, j] = b.dataset.trdup.split('.').map(Number); const lista = j==null || isNaN(j) ? U.tramos : U.tramos[i].tramos, k = j==null || isNaN(j) ? i : j;
    lista.splice(k + 1, 0, Object.assign(clon(lista[k]), {real:{}})); re(); });
  $$('[data-trmed]', d).forEach(b=>b.onclick = ()=>{ const [ruta, m] = b.dataset.trmed.split(':'), t = tramoDe(U, ruta); if(t.med===m) return; t.med = m; t.v = ''; re(); });
  $$('[data-tr]', d).forEach(el=>{ const [ruta, campo] = el.dataset.tr.split(':'), t = tramoDe(U, ruta);
    if(el.tagName==='SELECT') el.onchange = ()=>{ t[campo] = el.value; if(campo==='int' || campo==='k') re(); };
    else el.oninput = ()=>{ t[campo] = el.value; }; });
  $$('[data-trveces]', d).forEach(el=>el.oninput = ()=>{ U.tramos[+el.dataset.trveces].veces = el.value; });
  $$('[data-trreal]', d).forEach(el=>el.oninput = ()=>guardarReal(U, el.dataset.trreal, el.value));
}
