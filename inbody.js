/* #NSCE — InBody (22-oct-2026, pedido del usuario): se sube la foto del informe y se anotan sus valores. Queda como una medición
   más en S.medidas (peso, talla y grasa = PGC, así lo usan el IMC, la energía y el informe) con m.inbody {mme, mgc, punt, agua, prot, min,
   visc, tmb, rcc, seg:{bd, bi, tr, pd, pi} (masa magra en kg)} y m.fotoIB (foto en IndexedDB, va en el respaldo). La TMB medida reemplaza
   la fórmula del gasto basal por 120 días. La foto se lee sola con internet (ver «Leer la foto sola», abajo); siempre se revisa. */
const CAMPOS_IB = [['peso', 'Peso', 'kg'], ['talla', 'Altura', 'cm'], ['mme', 'Masa músculo esquelético (MME)', 'kg'], ['mgc', 'Masa grasa corporal', 'kg'],
  ['pgc', 'Grasa corporal (PGC)', '%'], ['punt', 'Puntuación InBody', 'puntos'], ['agua', 'Agua corporal total', 'L'], ['prot', 'Proteínas', 'kg'],
  ['min', 'Minerales', 'kg'], ['visc', 'Nivel de grasa visceral', '1 a 20'], ['tmb', 'Tasa metabólica basal', 'kcal'], ['rcc', 'Relación cintura-cadera', '']];
const SEG_IB = [['bi', 'Brazo izquierdo'], ['bd', 'Brazo derecho'], ['tr', 'Tronco'], ['pi', 'Pierna izquierda'], ['pd', 'Pierna derecha']];
const conInBody = ()=>(S.medidas || []).filter(m=>m.inbody).sort((a, b)=>a.fecha < b.fecha ? 1 : -1);
/* TMB medida por InBody (últimos 120 días) para el gasto basal de energia.js */
function tmbInBody(){ const m = conInBody()[0]; return m && num(m.inbody.tmb) && diasEntre(m.fecha, hoyISO()) <= 120 ? num(m.inbody.tmb) : null; }
function dialogoInBody(){
  if(!esPlus()) return pantallaPlus('inbody', dialogoInBody);   // el InBody completo es Plus (plus.js)
  const u = ultimaMedida(); let fotoBlob = null;
  const campo = ([k, n, un])=>`<div><label>${esc(n)}${un ? ' (' + un + ')' : ''}</label><input data-ib="${k}" inputmode="decimal" value="${k==='talla' && u.talla ? esc(u.talla) : ''}"></div>`;
  dialogo(`<div class="cab"><h2>📊 Cargar InBody</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <p class="suave chico">Sube la foto del informe: la app lee los números sola y tú los revisas. Saca la foto derecha, de cerca y con buena luz.</p>
    <div class="btns"><button class="btn" id="ibFoto">📷 Foto del informe</button></div><div id="ibVista" class="ib-vista"></div>
    <label>Fecha de la prueba</label><input id="ibF" type="date" value="${hoyISO()}">
    <div class="fila">${CAMPOS_IB.slice(0, 6).map(campo).join('')}</div>
    <details class="ib-mas"><summary>Más datos (agua, proteínas, visceral, TMB…)</summary><div class="fila">${CAMPOS_IB.slice(6).map(campo).join('')}</div></details>
    <details class="ib-mas"><summary>Masa magra por segmento (kg)</summary><div class="fila">${SEG_IB.map(([k, n])=>`<div><label>${n}</label><input data-seg="${k}" inputmode="decimal"></div>`).join('')}</div>
      <p class="nota">En el informe: «Análisis de Masa Magra Segmental», el número en kg de cada brazo, el tronco y cada pierna.</p></details>
    <div class="btns"><button class="btn" data-cerrar>Cancelar</button><button class="btn prim" id="ibOk">Guardar</button></div>`, d=>{
    // la foto original se lee (la comprimida para guardar pierde detalle); se guarda comprimida
    $('#ibFoto', d).onclick = ()=>{ const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = async ()=>{ const orig = inp.files[0]; if(!orig) return; try{ fotoBlob = await comprimirFoto(orig); }catch(e){ fotoBlob = orig; }
      $('#ibVista', d).innerHTML = `<img src="${URL.createObjectURL(fotoBlob)}" alt="Informe InBody" title="Tocar para agrandar"><div class="ib-leer" id="ibLeer">🔎 Leyendo la foto…</div>`;
      $('#ibVista img', d).onclick = e=>e.target.classList.toggle('grande');
      leerYLlenar(d, orig); }; inp.click(); };
    $('#ibOk', d).onclick = async ()=>{
      const v = {}; $$('[data-ib]', d).forEach(i=>{ const x = num(i.value); if(x!=null) v[i.dataset.ib] = x; });
      const seg = {}; $$('[data-seg]', d).forEach(i=>{ const x = num(i.value); if(x!=null) seg[i.dataset.seg] = x; });
      if(v.peso==null && v.mme==null && v.pgc==null){ aviso('Anota al menos el peso, la MME o el % de grasa'); return; }
      const m = {id:uid(), fecha:$('#ibF', d).value || hoyISO(), peso:v.peso ?? null, talla:v.talla ?? null, grasa:v.pgc ?? null, inbody:Object.assign({}, v, Object.keys(seg).length ? {seg} : {})};
      delete m.inbody.peso; delete m.inbody.talla;
      if(fotoBlob){ const id = 'f' + uid(); try{ await fotoGuardar(id, fotoBlob); m.fotoIB = id; }catch(e){ aviso('No se pudo guardar la foto en este equipo'); } }
      S.medidas = (S.medidas || []).concat([m]); guardar(); d.close(); vPerfil(); const s = $('#pfMedidas'); if(s){ s.open = true; s.scrollIntoView(); } aviso('InBody guardado');
    };
  });
}
/* Lee la foto y llena el formulario: verde = leído y comprobado, rojo = revisar con la foto */
async function leerYLlenar(d, blob){
  const est = t=>{ const e = $('#ibLeer', d); if(e) e.textContent = t; };
  try{
    const R = await leerFotoInBody(blob, est), n = Object.keys(R.v).length;
    if(!n){ est('No pude leer números en la foto. Escríbelos a mano (o saca otra foto más de cerca, derecha y con buena luz).'); return; }
    $$('.ib-mas', d).forEach(x=>x.open = true);
    Object.entries(R.v).forEach(([k, v])=>{ if(k==='fecha'){ $('#ibF', d).value = v; return; } const i = $(`[data-ib="${k}"]`, d); if(!i) return;
      i.value = String(v).replace('.', ','); i.classList.toggle('ib-duda', R.duda.includes(k)); i.classList.toggle('ib-auto', !R.duda.includes(k)); i.oninput = ()=>i.classList.remove('ib-duda', 'ib-auto'); });
    Object.entries(R.seg || {}).forEach(([k, v])=>{ const i = $(`[data-seg="${k}"]`, d); if(!i) return; const du = (R.dudaSeg || []).includes(k);
      i.value = String(v).replace('.', ','); i.classList.toggle('ib-duda', du); i.classList.toggle('ib-auto', !du); i.oninput = ()=>i.classList.remove('ib-duda', 'ib-auto'); });
    const nSeg = Object.keys(R.seg || {}).length;
    const hayDuda = R.duda.length || (R.dudaSeg || []).length;
    est(`✓ Leí ${n} datos${nSeg ? ' y ' + nSeg + ' segmentos' : ''}. ${hayDuda ? 'Revisa los marcados en rojo comparando con la foto (toca la foto para agrandarla).' : 'Revísalos con la foto antes de guardar.'}${nSeg < 5 ? ' Lo que falte de la masa por segmento se escribe a mano.' : ''}`);
  }catch(e){ est('Sin internet no puedo leer la foto (la primera vez se descarga el lector). Escribe los números a mano.'); }
}
/* Tarjeta con el último InBody: valores, cambio contra el anterior y equilibrio entre lados */
function htmlInBody(){
  const L = conInBody(); if(!L.length) return '';
  const m = L[0], a = L[1], I = m.inbody, A = a ? a.inbody : null;
  const dif = (k, malo)=>{ if(!A) return ''; const x = k==='peso' ? m.peso : I[k], y = k==='peso' ? a.peso : A[k]; if(x==null || y==null) return '';
    const dd = Math.round((x - y) * 10) / 10; if(!dd) return '<small class="suave">=</small>'; const bueno = malo ? dd < 0 : dd > 0;
    return `<small style="color:${bueno ? 'var(--mb)' : 'var(--na)'}">${dd > 0 ? '+' : ''}${fmtNum(dd)}</small>`; };
  const cel = (v, k, u, d)=>v==null ? '' : `<div class="tile"><div class="v">${fmtNum(v)}${u ? ' <small>' + u + '</small>' : ''} ${d || ''}</div><div class="k">${k}</div></div>`;
  const S2 = I.seg || {}, lado = (i, d, n)=>{ if(S2[i]==null || S2[d]==null) return null; const mx = Math.max(S2[i], S2[d]), p = Math.round(Math.abs(S2[i] - S2[d]) / mx * 100);
    const f = n==='Pierna', ld = S2[i] < S2[d] ? (f ? 'izquierda' : 'izquierdo') : (f ? 'derecha' : 'derecho');
    return p >= 8 ? `${n} ${ld} ${p} % más ${f ? 'liviana' : 'liviano'}: agrega trabajo de un lado a la vez (unilateral).` : null; };
  const avisos = [lado('bi', 'bd', 'Brazo'), lado('pi', 'pd', 'Pierna')].filter(Boolean);
  return `<div class="tarjeta inbody"><div class="entre"><span class="etiqueta">InBody · ${verFecha(m.fecha)}</span>${I.punt!=null ? `<span class="ib-punt num">${fmtNum(I.punt)}<small>/100</small></span>` : ''}</div>
    <div class="tiles acum">${cel(m.peso, 'peso', 'kg', dif('peso', true))}${cel(I.mme, 'músculo (MME)', 'kg', dif('mme'))}${cel(I.mgc, 'masa grasa', 'kg', dif('mgc', true))}${cel(m.grasa, 'grasa', '%', A ? dif('pgc', true) : '')}${cel(I.visc, 'grasa visceral', '', dif('visc', true))}${cel(I.tmb, 'basal', 'kcal')}</div>
    ${Object.keys(S2).length ? `<div class="ib-seg">${SEG_IB.map(([k, n])=>S2[k]==null ? '' : `<div><b class="num">${fmtNum(S2[k])}</b><span>${n}</span></div>`).join('')}</div>` : ''}
    ${avisos.map(x=>`<p class="chico alerta-lim">⚖️ ${esc(x)}</p>`).join('')}
    ${htmlSaludInBody(m)}
    ${A ? `<p class="suave chico">Comparado con el InBody del ${verFecha(a.fecha)} (verde = mejora).</p>` : ''}
    ${m.fotoIB ? `<button class="btn ancho" id="ibVer">🖼️ Ver el informe</button>` : ''}</div>`;
}
function enlazarInBody(){
  enlazarRecomposicion();
  if($('#pInBody')) $('#pInBody').onclick = dialogoInBody;
  if($('#ibVer')) $('#ibVer').onclick = async ()=>{ const m = conInBody()[0], b = await fotoLeer(m.fotoIB).catch(()=>null); if(!b){ aviso('La foto no está en este equipo'); return; }
    dialogo(`<div class="cab"><h2>Informe InBody · ${verFecha(m.fecha)}</h2><button class="btn chico-btn" data-cerrar>✕</button></div><img class="ib-img" src="${URL.createObjectURL(b)}" alt="Informe InBody">`); };
}

/* ---------- Leer la foto sola (23-oct-2026, pedido del usuario: «prueba que lea la foto sola») ----------
   Tesseract.js (lector de texto de código abierto, Apache 2.0) desde internet la primera vez (≈ 15 MB con el idioma español; después queda
   guardado en el equipo). La foto se agranda a ~2.200 px de ancho y se pasa a gris antes de leer (con la imagen chica perdía las comas).
   `leerTextoInBody(texto)` saca los valores por su rótulo, repone la coma perdida según los decimales de cada dato y su rango, y los
   revisa entre sí: peso = agua + proteínas + minerales + masa grasa (así es el informe); PGC = masa grasa ÷ peso; la TMB del InBody es
   370 + 21,6 × masa magra (si no calza se corrige). Lo dudoso se marca para revisarlo con la foto. La masa por segmento se lee en una segunda pasada sobre su cuadro recortado (solo números, por posición). */
const IB_LEER = {
  agua:{re:/Agua\s*Corp\w*\s*Total/i, dec:1, r:[15, 90]}, prot:{re:/Prote[ií]nas/i, dec:1, r:[4, 30]}, min:{re:/Minerales/i, dec:2, r:[1, 9]},
  mgc:{re:/Masa\s*Grasa\s*Corporal/i, dec:1, r:[1, 90]}, peso:{re:/suma\s*de\s*lo\s*anterior|^\s*Peso\b(?!\s*Ideal)/i, dec:1, r:[30, 250]},
  mme:{re:/\bMME\b|M[uú]sculo\s*Esquel/i, dec:1, r:[10, 80], coma:true, lineas:2},
};
function arreglarNum(t, dec, r){
  const lim = v=>v >= r[0] && v <= r[1] ? v : null;
  if(/[.,]/.test(t)){ const v = parseFloat(t.replace(',', '.')); if(lim(v)!=null) return {v, ok:true}; }
  const d = t.replace(/\D/g, ''); if(!d) return null;
  for(const k of [dec, 0, 1, 2]){ if(k >= d.length) continue; const v = k ? parseFloat(d.slice(0, d.length - k) + '.' + d.slice(d.length - k)) : parseInt(d, 10); if(lim(v)!=null) return {v, ok:k===dec}; }
  return null;
}
function leerTextoInBody(txt){
  const L = String(txt || '').split(/\n/), out = {}, duda = new Set();
  for(const [k, c] of Object.entries(IB_LEER)){
    for(let i = 0; i < L.length && out[k]==null; i++){ const m = L[i].match(c.re); if(!m) continue;
      const resto = [L[i].slice(m.index + m[0].length)].concat(L.slice(i + 1, i + 1 + (c.lineas || 0))).join(' ').replace(/\([^)]{0,14}\)/g, ' ');
      for(const t of resto.match(/\d{1,4}(?:[.,]\d{1,2})?/g) || []){ if(c.coma && !/[.,]/.test(t)) continue; const a = arreglarNum(t, c.dec, c.r); if(a){ out[k] = a.v; if(!a.ok) duda.add(k); break; } } }
  }
  let m;
  if((m = txt.match(/(\d{2,3})\s*\/\s*1[0O]{2}/))) { const v = +m[1]; if(v >= 30 && v <= 130) out.punt = v; }
  if((m = txt.match(/Basal\D{0,8}(\d{4})/i))) { const v = +m[1]; if(v >= 800 && v <= 4500) out.tmb = v; }
  if((m = txt.match(/Cadera\D{0,10}(\d)[.,](\d{2})/i))) { const v = +(m[1] + '.' + m[2]); if(v >= 0.6 && v <= 1.3) out.rcc = v; }
  if((m = txt.match(/Visceral\D{0,8}(\d{1,2})\b/i))) { const v = +m[1]; if(v >= 1 && v <= 20) out.visc = v; }
  if((m = txt.match(/\b(1[2-9]\d|2[0-2]\d)\s*[ce][mn]\b/i))) out.talla = +m[1];
  if((m = txt.match(/\b(\d{2})[.\/-](\d{2})[.\/-](20\d{2})\b/))) out.fecha = m[3] + '-' + m[2] + '-' + m[1];
  // revisiones entre datos
  if(['agua', 'prot', 'min', 'mgc', 'peso'].every(k=>out[k]!=null)){
    const suma = out.agua + out.prot + out.min + out.mgc;
    if(Math.abs(suma - out.peso) > 0.6){ ['agua', 'prot', 'min', 'mgc', 'peso'].forEach(k=>duda.add(k)); } else ['agua', 'prot', 'min', 'mgc', 'peso'].forEach(k=>duda.delete(k)); }
  else ['agua', 'prot', 'min', 'mgc', 'peso'].forEach(k=>{ if(out[k]!=null) duda.add(k); });   // sin los cinco no se puede comprobar: a revisar
  if(out.peso!=null && out.mgc!=null && !duda.has('peso')){ out.pgc = Math.round(out.mgc / out.peso * 1000) / 10;
    const tmb = Math.round(370 + 21.6 * (out.peso - out.mgc));
    if(out.tmb==null || Math.abs(out.tmb - tmb) > 15){ duda.add('tmb'); out.tmb = tmb; } }   // calculada: a revisar (puede diferir en 1)
  return {v:out, duda:[...duda]};
}
let tesseractCarga = null;
const cargarTesseract = ()=>tesseractCarga = tesseractCarga || new Promise((ok, mal)=>{ if(window.Tesseract) return ok(window.Tesseract);
  const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  s.onload = ()=>ok(window.Tesseract); s.onerror = ()=>{ tesseractCarga = null; mal(new Error('sin conexión')); }; document.head.appendChild(s); });
async function imagenParaLeer(blob){
  const img = await createImageBitmap(blob), esc2 = Math.min(3, Math.max(1, 2200 / img.width)), c = document.createElement('canvas');
  c.width = Math.round(img.width * esc2); c.height = Math.round(img.height * esc2);
  const x = c.getContext('2d'); x.filter = 'grayscale(1) contrast(1.4)'; x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, c.width, c.height);
  return c;
}
async function leerFotoInBody(blob, avance){
  const T = await cargarTesseract(); avance && avance('Leyendo la foto…');
  const w = await T.createWorker('spa', 1, {logger:m=>{ if(avance && m.status==='recognizing text') avance('Leyendo la foto… ' + Math.round(m.progress * 100) + ' %'); }});
  try{
    const c = await imagenParaLeer(blob), r = await w.recognize(c, {}, {blocks:true}), R = leerTextoInBody(r.data.text);
    // segunda pasada: el cuadro «Masa Magra Segmental» recortado, solo números (entre su título y «Historial», a la izquierda de «Grasa Segmental»)
    try{ avance && avance('Leyendo la masa por segmento…');
      const rect = rectSegmental(palabrasOCR(r.data));
      if(rect){ await w.setParameters({tessedit_char_whitelist:'0123456789,.kg%', tessedit_pageseg_mode:'11'});
        const r2 = await w.recognize(c, {rectangle:rect}, {blocks:true}), sg = leerSegmentos(palabrasOCR(r2.data));
        if(sg){ R.seg = sg.v; R.dudaSeg = sg.duda; } } }catch(e){}
    return R;
  } finally { w.terminate(); }
}
const palabrasOCR = d=>{ const out = []; (d.blocks || []).forEach(b=>(b.paragraphs || []).forEach(p=>(p.lines || []).forEach(l=>(l.words || []).forEach(x=>out.push({t:x.text, x:x.bbox.x0, y:x.bbox.y0, x1:x.bbox.x1, y1:x.bbox.y1}))))); return out; };
function rectSegmental(W){
  const mg = W.find(x=>/Magra/i.test(x.t)); if(!mg) return null;
  const linea = W.filter(x=>Math.abs(x.y - mg.y) < 30 && x.x > mg.x1), der = linea.find(x=>/n[aá]lisis/i.test(x.t)) || linea.find(x=>/Grasa/i.test(x.t));
  const hi = W.find(x=>/Historial/i.test(x.t) && x.y > mg.y1), alto = (hi ? hi.y : mg.y1 + (mg.x1 - mg.x) * 7) - mg.y1;
  const ancho = der ? der.x - 10 : Math.round((mg.x1 + 40) * 1.5);
  return ancho > 50 && alto > 50 ? {left:0, top:mg.y1, width:ancho, height:alto} : null;
}
/* De los números con «kg» del cuadro: fila de arriba = brazos, la del medio = tronco, la de abajo = piernas; a la izquierda = izquierdo
   (así lo dibuja el informe: «Izquierdo» a la izquierda de la figura) */
function leerSegmentos(W){
  const kg = W.map(x=>{ const m = x.t.match(/^(\d{1,2})[.,](\d{1,2})(kg|k)?$/i); return m && !/%/.test(x.t) ? Object.assign({v:+(m[1] + '.' + m[2]), kg:!!m[3]}, x) : null; }).filter(Boolean);
  const L = kg.some(x=>x.kg) ? kg.filter(x=>x.kg) : kg; if(L.length < 3) return null;
  const filas = []; L.sort((a, b)=>a.y - b.y).forEach(x=>{ const f = filas.find(f=>Math.abs(f[0].y - x.y) < 40); f ? f.push(x) : filas.push([x]); });
  const v = {}, duda = [];
  const par = (f, i, d)=>{ if(!f) return; f.sort((a, b)=>a.x - b.x); if(f.length >= 2){ v[i] = f[0].v; v[d] = f[f.length - 1].v; } };
  const tr = filas.find(f=>f.length===1 && f[0].v >= 10); if(tr) v.tr = tr[0].v;
  const dos = filas.filter(f=>f.length >= 2); par(dos[0], 'bi', 'bd'); par(dos[1], 'pi', 'pd');
  const R = {bi:[0.5, 15], bd:[0.5, 15], tr:[8, 70], pi:[2, 30], pd:[2, 30]};
  Object.keys(v).forEach(k=>{ if(v[k] < R[k][0] || v[k] > R[k][1]) duda.push(k); });
  [['bi', 'bd'], ['pi', 'pd']].forEach(([a, b])=>{ if(v[a]!=null && v[b]!=null && Math.abs(v[a] - v[b]) / Math.max(v[a], v[b]) > 0.35){ duda.push(a, b); } });
  if(v.bi!=null && v.pi!=null && v.bi > v.pi){ duda.push('bi', 'bd', 'pi', 'pd'); }   // los brazos no pesan más que las piernas: filas cruzadas
  return Object.keys(v).length ? {v, duda} : null;
}

/* ---------- Recomposición, desequilibrios y programación (23-oct-2026, pedido del usuario: «haz la 1 y la 2… y que se considere en la
   programación») ----------
   Recomposición: músculo (MME) y masa grasa en el tiempo, peso meta por % de grasa sin perder músculo (masa magra ÷ (1 − meta)), proteína por kg
   de masa magra e insignia «Recomposición» (InBody seguidos con más músculo y menos grasa). Desequilibrio: brazo o pierna con 8 % o más de
   diferencia → complemento unilateral en el WOD del día y en los días de fuerza de Mi plan. Programación: `ajustesInBody()` (grasa alta →
   +10 min de aeróbico suave; músculo bajo para el peso → prioridad fuerza; visceral alta → aviso) se aplica en `planDia` (plan.js). */
const META_PGC = {H:[12, 15, 18], M:[20, 23, 26]};
const ibReciente = (m, dias)=>m && diasEntre(m.fecha, hoyISO()) <= (dias || 180);
function magraInBody(){ const m = conInBody()[0]; return m && m.peso!=null && m.inbody.mgc!=null && ibReciente(m) ? {m, magra:Math.round((m.peso - m.inbody.mgc) * 10) / 10} : null; }
function recomposiciones(){ const L = conInBody().slice().reverse(); let n = 0;
  for(let i = 1; i < L.length; i++){ const a = L[i - 1].inbody, b = L[i].inbody; if(a.mme!=null && b.mme!=null && a.mgc!=null && b.mgc!=null && b.mme - a.mme >= 0.1 && b.mgc - a.mgc <= -0.1) n++; }
  return n; }
function graficoRecomp(L){
  const W = 320, H = 120, P = 22, xs = L.map(m=>new Date(m.fecha + 'T12:00:00').getTime()), x0 = Math.min(...xs), x1 = Math.max(...xs) || x0 + 1;
  const serie = (k, col)=>{ const vs = L.map(m=>m.inbody[k]).filter(v=>v!=null); if(vs.length < 2) return ''; const lo = Math.min(...vs) - 1, hi = Math.max(...vs) + 1;
    const pts = L.map((m, i)=>m.inbody[k]==null ? null : [P + (xs[i] - x0) / ((x1 - x0) || 1) * (W - 2 * P), H - P - (m.inbody[k] - lo) / (hi - lo) * (H - 2 * P), m.inbody[k]]).filter(Boolean);
    return `<polyline points="${pts.map(p=>p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="none" stroke="${col}" stroke-width="2.5"/>${pts.map(p=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" fill="${col}"/><text x="${p[0].toFixed(1)}" y="${(p[1] - 7).toFixed(1)}" fill="${col}" font-size="10" text-anchor="middle">${fmtNum(p[2])}</text>`).join('')}`; };
  return `<svg class="ib-graf" viewBox="0 0 ${W} ${H}" role="img" aria-label="Músculo y grasa en el tiempo">${serie('mme', 'var(--acento)')}${serie('mgc', '#f08a3a')}</svg>
    <div class="forma-ley"><span style="color:var(--acento)">━ músculo (MME)</span><span style="color:#f08a3a">━ masa grasa</span></div>`;
}
function htmlRecomposicion(){
  const L = conInBody().slice().reverse(); if(!L.length) return '';
  const u = L[L.length - 1], I = u.inbody, sx = S.perfil.sexo==='M' ? 'M' : 'H', metas = META_PGC[sx], meta = ent(pref('pgcMeta')) || metas[1], mg = magraInBody();
  let evo = '';
  if(L.length >= 2){ const a = L[0].inbody, dM = I.mme!=null && a.mme!=null ? Math.round((I.mme - a.mme) * 10) / 10 : null, dG = I.mgc!=null && a.mgc!=null ? Math.round((I.mgc - a.mgc) * 10) / 10 : null;
    const t = v=>(v > 0 ? '+' : '') + fmtNum(v) + ' kg', rec = dM > 0 && dG < 0;
    evo = `${graficoRecomp(L)}<p class="ib-evo">${rec ? '💪 <b>¡Recomposición!</b> ' : ''}Desde el ${verFecha(L[0].fecha)}: músculo <b style="color:${dM >= 0 ? 'var(--mb)' : 'var(--na)'}">${dM==null ? '—' : t(dM)}</b>, grasa <b style="color:${dG <= 0 ? 'var(--mb)' : 'var(--na)'}">${dG==null ? '—' : t(dG)}</b>.</p>`; }
  let obj = '';
  if(mg && u.grasa!=null){ const pm = Math.round(mg.magra / (1 - meta / 100) * 10) / 10, baja = Math.round((u.peso - pm) * 10) / 10;
    obj = `<div class="ib-meta"><div class="entre"><span class="etiqueta">Tu meta de grasa</span><div class="segmentos ib-metas">${metas.map(v=>`<button data-pgc="${v}" class="${v===meta ? 'activa' : ''}">${v} %</button>`).join('')}</div></div>
      <p>${u.grasa <= meta ? `Ya estás en ${fmtNum(u.grasa)} %: mantén el músculo y sigue entrenando.` : `Para llegar a <b>${meta} %</b> de grasa sin perder músculo, tu peso meta es <b>${fmtNum(pm)} kg</b> (bajar ${fmtNum(baja)} kg de grasa). El IMC no sirve en personas con mucho músculo: esta meta usa tu masa magra (${fmtNum(mg.magra)} kg).`}</p>
      <p class="suave chico">Proteína diaria: unos <b>${Math.round(mg.magra * (u.grasa > meta ? 2.3 : 2.0))} g</b> (${u.grasa > meta ? '2,3' : '2,0'} g por kg de masa magra${u.grasa > meta ? ', más alta para no perder músculo al bajar' : ''}).</p>
      ${u.grasa > meta ? `<button class="btn ancho" id="ibUsarMeta">🎯 Usar ${fmtNum(pm)} kg como meta de peso</button>` : ''}</div>`; }
  return `<div class="tarjeta recomp"><div class="etiqueta">Recomposición</div>${evo || '<p class="suave chico">Con el próximo InBody verás cuánto músculo ganas y cuánta grasa bajas. Repítelo cada 8 a 12 semanas, en las mismas condiciones (en ayunas, a la misma hora).</p>'}${obj}</div>`;
}
function enlazarRecomposicion(){
  $$('[data-pgc]').forEach(b=>b.onclick = ()=>{ pref('pgcMeta', b.dataset.pgc); vPerfil(); const s = $('#pfMedidas'); if(s){ s.open = true; s.querySelector('.recomp').scrollIntoView({block:'center'}); } });
  if($('#ibUsarMeta')) $('#ibUsarMeta').onclick = ()=>{ const mg = magraInBody(), meta = ent(pref('pgcMeta')) || META_PGC[S.perfil.sexo==='M' ? 'M' : 'H'][1];
    S.metaPeso = {peso:Math.round(mg.magra / (1 - meta / 100) * 10) / 10, fecha:null}; guardar(); aviso('Meta de peso guardada: la ves en Analizar → Energía → Peso'); };
}
/* Desequilibrio entre lados del último InBody (hasta 6 meses) */
const UNILAT = {pierna:['Zancada búlgara 3 × 8 por pierna', 'Subida al cajón con mancuernas 3 × 10 por pierna', 'Peso muerto a una pierna 3 × 8 por pierna'],
  brazo:['Remo con mancuerna a un brazo 3 × 10', 'Press con mancuerna a un brazo 3 × 8', 'Paseo del granjero con una mano 3 × 30 m por lado']};
function desequilibrioInBody(){
  const m = conInBody()[0], s = m && ibReciente(m) && m.inbody.seg; if(!s) return null;
  for(const [parte, i, d] of [['pierna', 'pi', 'pd'], ['brazo', 'bi', 'bd']]){
    if(s[i]==null || s[d]==null) continue; const p = Math.round(Math.abs(s[i] - s[d]) / Math.max(s[i], s[d]) * 100);
    if(p >= 8){ const izq = s[i] < s[d], f = parte==='pierna'; return {parte, pct:p, lado:izq ? (f ? 'izquierda' : 'izquierdo') : (f ? 'derecha' : 'derecho'), txt:(f ? 'Pierna ' : 'Brazo ') + (izq ? (f ? 'izquierda' : 'izquierdo') : (f ? 'derecha' : 'derecho'))}; } }
  return null;
}
function htmlComplementoUnilateral(){
  const D = desequilibrioInBody(); if(!D) return '';
  return `<div class="ib-uni"><b>⚖️ Complemento para tu ${D.txt.toLowerCase()}</b> <span class="suave">(${D.pct} % más ${D.parte==='pierna' ? 'liviana' : 'liviano'} según tu InBody)</span>
    <div class="chico">Al final, 2 de estos, partiendo por el lado más débil: ${UNILAT[D.parte].map(esc).join(' · ')}.</div></div>`;
}
/* Ajustes de la programación según el último InBody */
function ajustesInBody(){
  const m = conInBody()[0]; if(!m || !ibReciente(m)) return [];
  const I = m.inbody, M = S.perfil.sexo==='M', A = [];
  if(m.grasa!=null && m.grasa > (M ? 32 : 25)) A.push({k:'aero', t:`Grasa ${fmtNum(m.grasa)} %: las sesiones suaves (zona 2, trote, marcha) suman 10 minutos.`});
  if(I.mme!=null && m.peso && I.mme / m.peso < (M ? 0.33 : 0.40)) A.push({k:'fuerza', t:'Músculo bajo para tu peso: en los días de fuerza suma una serie a los ejercicios básicos.'});
  const D = desequilibrioInBody(); if(D) A.push({k:'uni', t:`${D.txt} ${D.pct} % más ${D.parte==='pierna' ? 'liviana' : 'liviano'}: complemento de un lado a la vez en los días de fuerza.`});
  if(I.visc!=null && I.visc >= 10) A.push({k:'visc', t:`Grasa visceral ${fmtNum(I.visc)} (alta desde 10): más trabajo aeróbico y conviene control médico.`});
  if(I.rcc!=null && I.rcc > (M ? 0.85 : 0.90)) A.push({k:'rcc', t:`Cintura-cadera ${String(I.rcc).replace(".", ",")}: sobre lo recomendado (${M ? '0,85' : '0,90'}); el aeróbico y la alimentación ayudan a bajarla.`});
  return A;
}
function ajustarSesionInBody(x){
  if(!x || x.tipo!=='sesion' || !x.ses) return x; const A = ajustesInBody(); if(!A.length) return x;
  const ses = Object.assign({}, x.ses), txt = ses.n + ' ' + (ses.cap || '') + ' ' + (ses.d || ''), notas = [], tiene = k=>A.some(a=>a.k===k);
  const esFuerza = /fuerza|piernas|sentadilla|peso muerto/i.test(txt), esSuave = ses.rpe <= 5 && /zona 2|trote|marcha|continuo|base/i.test(txt);
  if(tiene('aero') && esSuave){ ses.min += 10; notas.push('+10 min por tu % de grasa (InBody)'); }
  if(tiene('fuerza') && esFuerza) notas.push('+1 serie en los básicos (InBody: músculo bajo para tu peso)');
  if(tiene('uni') && esFuerza){ const D = desequilibrioInBody(); notas.push('Complemento ' + D.txt.toLowerCase() + ': ' + UNILAT[D.parte].slice(0, 2).join(' · ')); }
  if(notas.length) ses.inbody = notas;
  return Object.assign({}, x, {ses});
}
function htmlAjustesInBody(){
  const A = ajustesInBody(); if(!A.length) return '';
  return `<div class="tarjeta ib-plan"><div class="etiqueta">Tu InBody en tu plan</div><ul>${A.map(a=>`<li>${esc(a.t)}</li>`).join('')}</ul>
    <p class="suave chico">Se aplica solo en las sesiones de cada día. Repite el InBody cada 8 a 12 semanas para ajustarlo.</p></div>`;
}
/* ---------- InBody parte 2 (24-oct-2026, pedido del usuario): salud, próximo InBody y parte de la unidad ----------
   Semáforo por indicador (no es diagnóstico): grasa visceral (InBody: 1-9 normal, 10-14 alta, 15+ muy alta), cintura-cadera (OMS: obesidad
   abdominal sobre 0,90 hombres / 0,85 mujeres), % de grasa (rangos habituales de InBody: H 10-20, M 18-28; muy baja H < 5, M < 12) y músculo
   para el peso. Con algo en rojo, Inicio lo avisa una vez por InBody (S.ibAvisoVisto) y sugiere conversarlo con el médico o sanidad. */
function saludInBody(m){
  m = m || conInBody()[0]; if(!m) return [];
  const I = m.inbody, M = S.perfil.sexo==='M', out = [], add = (k, n, v, nivel, txt)=>out.push({k, n, v, nivel, txt});
  if(I.visc!=null) add('visc', 'Grasa visceral', fmtNum(I.visc), I.visc >= 15 ? 'alto' : I.visc >= 10 ? 'atento' : 'ok',
    I.visc >= 15 ? 'Muy alta (15 o más): es la grasa entre los órganos, la de más riesgo para el corazón.' : I.visc >= 10 ? 'Alta (desde 10): el aeróbico y la alimentación la bajan rápido.' : 'Normal (1 a 9).');
  if(I.rcc!=null){ const lim = M ? 0.85 : 0.90; add('rcc', 'Cintura-cadera', String(I.rcc).replace('.', ','), I.rcc > lim + 0.05 ? 'alto' : I.rcc > lim ? 'atento' : 'ok',
    I.rcc > lim ? `Sobre ${lim.toFixed(2).replace('.', ',')} (OMS): grasa acumulada en el abdomen.` : `Bajo ${lim.toFixed(2).replace('.', ',')}: bien.`); }
  if(m.grasa!=null){ const g = m.grasa, [bajo, ok1, ok2, alto] = M ? [12, 18, 28, 32] : [5, 10, 20, 25];
    add('pgc', '% de grasa', fmtNum(g) + ' %', g < bajo || g > alto ? 'alto' : g < ok1 || g > ok2 ? 'atento' : 'ok',
      g < bajo ? 'Muy baja: puede afectar la energía, las hormonas y los huesos.' : g > alto ? 'Alta: prioriza aeróbico, fuerza y alimentación.' : g > ok2 ? 'Algo alta.' : g < ok1 ? 'Baja, propia de deportistas.' : 'En el rango saludable.'); }
  if(I.mme!=null && m.peso){ const r = I.mme / m.peso, lim = M ? 0.33 : 0.40; add('mme', 'Músculo para tu peso', Math.round(r * 100) + ' %', r < lim ? 'atento' : 'ok', r < lim ? 'Bajo: la fuerza 2-3 veces por semana lo sube.' : 'Bien.'); }
  return out;
}
const COL_SAL = {ok:'var(--mb)', atento:'#e0b63c', alto:'var(--na)'}, NOM_SAL = {ok:'Bien', atento:'Atento', alto:'Alto'};
function htmlSaludInBody(m){
  const L = saludInBody(m); if(!L.length) return '';
  const rojo = L.some(x=>x.nivel==='alto'), p = typeof proximaPrueba==='function' ? proximaPrueba(m.fecha) : null;
  return `<div class="ib-salud"><div class="etiqueta">🩺 Tu salud en el InBody</div>
    ${L.map(x=>`<div class="ib-sal-fila"><div class="entre"><span>${esc(x.n)} <b class="num">${esc(x.v)}</b></span><span class="chip-niv" style="--nc:${COL_SAL[x.nivel]}">${NOM_SAL[x.nivel]}</span></div><div class="suave chico">${esc(x.txt)}</div></div>`).join('')}
    ${rojo ? '<p class="chico ib-consulta">👉 Conversa estos resultados con tu médico o con sanidad.</p>' : ''}
    <p class="nota">Referencias generales (InBody y OMS); no es un diagnóstico.${p ? ` 🔁 Próximo InBody: ${verFecha(p.fecha)}${p.dias > 0 ? ' (en ' + (p.dias < 14 ? p.dias + ' días' : Math.round(p.dias / 7) + ' semanas') + ')' : ' (ya toca)'}.` : ''}</p></div>`;
}
/* Línea en «Pendientes» de Inicio: una vez por InBody con algo en rojo */
function htmlAvisoSaludIB(){
  const m = conInBody()[0]; if(!m || S.ibAvisoVisto===m.fecha || !ibReciente(m)) return '';
  const R = saludInBody(m).filter(x=>x.nivel==='alto'); if(!R.length) return '';
  return `<button class="aviso-parte" id="ibAviso">🩺 <span>Tu InBody: ${esc(R.map(x=>x.n.toLowerCase()).join(' y '))} para conversar con tu médico</span><span class="chev">›</span></button>`;
}
function enlazarAvisoSaludIB(){ if($('#ibAviso')) $('#ibAviso').onclick = ()=>{ S.ibAvisoVisto = conInBody()[0].fecha; guardar(); ir('perfil'); setTimeout(()=>{ const s = $('#pfMedidas'); if(s){ s.open = true; const c = $('.ib-salud'); (c || s).scrollIntoView({block:'start'}); } }, 80); }; }
/* Resumen para el parte de la unidad (solo si el alumno comparte su salud) */
function inbodyParte(){
  const m = conInBody()[0]; if(!m) return null; const I = m.inbody, D = desequilibrioInBody();
  return {fecha:m.fecha, peso:m.peso, mme:I.mme ?? null, mgc:I.mgc ?? null, pgc:m.grasa ?? null, visc:I.visc ?? null, rcc:I.rcc ?? null, punt:I.punt ?? null,
    deseq:D ? D.txt + ' ' + D.pct + ' %' : null, alertas:saludInBody(m).filter(x=>x.nivel!=='ok').map(x=>({n:x.n, v:x.v, nivel:x.nivel}))};
}
