/* #TACFITNSCE — Compartir un entrenamiento con tu foto, como Strava, Nike o Garmin: 7 plantillas (clásico, número grande,
   entrenamiento, pizarra, emblema, solo la foto y sticker sin fondo), en historia 9:16 o publicación 4:5, con la canción
   del entrenamiento. La canción no puede ir sonando en la imagen (derechos): se copia para el sticker «Música» de Instagram.
   Carga después de diario.js y social.js (reemplaza compartirSesion) y antes de app.js. */

const PLANTILLAS = [
  ['clasico', 'Clásico', 'image'], ['numero', 'Número grande', 'hash'], ['wod', 'Entrenamiento', 'clipboard-text'], ['pizarra', 'Pizarra', 'chalkboard-simple'],
  ['emblema', 'Emblema', 'skull'], ['foto', 'Solo la foto', 'camera'], ['sticker', 'Sticker', 'sticker'],
];
const COLOR_G = {mono:'#35b6e8', gim:'#4fc979', core:'#b48cf0', barra:'#f2a33a', mc:'#ef6f5e', mil:'#a9b85a', desc:'#5fc9b5'};
const LIMA = '#d7ff3a', SANS_C = '-apple-system, "SF Pro Display", "Helvetica Neue", "Segoe UI", Roboto, Arial, sans-serif';
const distTxt = (d, u)=>u==='km' ? coma(d) + ' km' : (num(d)!=null ? num(d).toLocaleString('es-CL') : d) + ' m';
const kmTxt = v=>v.toLocaleString('es-CL', {minimumFractionDigits:2, maximumFractionDigits:2});
const durTxt = min=>min >= 60 ? Math.floor(min/60) + ':' + String(Math.round(min%60)).padStart(2, '0') + ':00' : Math.round(min) + ':00';
const ESTILOS_WOD = new Set(['rft', 'esquema', 'por_tiempo', 'amrap', 'amreps', 'emom', 'emom_alt', 'tabata', 'fgb', 'muerte']);

/* ---------- Datos del entrenamiento para las plantillas ---------- */
function datosCompartir(s){
  const w = s.w || {}, st = estiloDe(s.tipo), p = Object.assign({}, PDEF, w.params || {}), m = metricas(s), kc = kcalDe(s), P = parcialesDe(s);
  const R = esRecord(s), g = grupoDe(s), titulo = s.titulo || etiquetaTipo(s), U = w.uno;
  const D = {titulo, tipo:'', grande:'', unidad:'', extra:'', etiq:'', sub:'', stats:[], lineas:[], bloques:[], barras:null, wod:ESTILOS_WOD.has(s.tipo),
    record:R.length ? 'Nuevo récord' : '', fecha:verFecha(s.fecha) + (horaDe(s) ? ' · ' + horaDe(s) : ''), musica:nombreCancion(s), musicaImg:s.musicaImg || null, rx:!!s.rx, color:COLOR_G[g] || LIMA};
  const TW = {rft:'POR TIEMPO', esquema:'POR TIEMPO', por_tiempo:'POR TIEMPO', amrap:'AMRAP ' + p.minutos + ' MIN', amreps:'MÁX. REPETICIONES', emom:'EMOM', emom_alt:'EMOM ALTERNADO',
    tabata:'TABATA', fgb:'FIGHT GONE BAD', muerte:'MUERTE POR REPS'};
  const H = POPULARES.find(p=>p.cat==='heroes' && p.titulo && titulo.toLowerCase()===p.titulo.toLowerCase());
  if(H){ const m = String(H.nota || '').match(/En honor (al|a la|a los|a) ([^,]+)/); D.honor = m ? 'En honor ' + m[1] + ' ' + m[2].trim() : ''; D.hero = true; }
  if(TW[s.tipo]) D.tipo = (H ? 'HERO WOD · ' : 'WOD · ') + TW[s.tipo];
  else if(s.tipo==='intervalos' || s.tipo==='cada_ronda') D.tipo = 'INTERVALOS';
  else if(s.tipo==='calidad') D.tipo = 'FUERZA';
  else if(s.tipo==='descanso') D.tipo = 'DESCANSO ACTIVO';
  else if(s.tipo==='uno'){ const mv = U && movDe(U.mov); D.tipo = String(s.metodo || (mv ? nomMov(mv) : 'Entrenamiento')).toUpperCase(); }
  else D.tipo = etiquetaTipo(s).toUpperCase();
  // El dato grande según el tipo de entrenamiento
  const res = w.res || {}, fija = (gr, un, et)=>{ D.grande = String(gr); D.unidad = un || ''; D.etiq = et || ''; };
  const fijaDist = (mt, et)=>enMillas() ? (mt >= 1609 ? fija(kmTxt(mt / 1609.344), 'mi', et) : fija(Math.round(mt / 0.9144).toLocaleString('es-CL'), 'yd', et))
    : mt >= 1000 ? fija(kmTxt(mt / 1000), 'km', et) : fija(mt.toLocaleString('es-CL'), 'm', et);
  let esTiempo = false, ritmo = null, tiempoUno = null;
  if(st && st.r==='tiempo' && s.valor!=null){ fija(PSF.verTiempo(s.valor), '', 'Tiempo'); esTiempo = true; }
  else if(st && st.r==='rondas' && ent(res.r)!=null){ fija(ent(res.r), ent(res.r)===1 ? 'ronda' : 'rondas', 'Rondas'); if(ent(res.re)) D.extra = '+' + ent(res.re); }
  else if(st && st.r==='reps' && s.valor!=null) fija(s.valor, 'rep', 'Repeticiones');
  else if(st && st.r==='emom'){ const ok = ent(res.ok); if(ok!=null) fija(ok, '/' + p.intervalos, 'Intervalos'); else fija(p.intervalos, 'intervalos', 'Intervalos'); }
  else if(st && (st.r==='porRonda' || st.r==='tiempos') && s.valor!=null){
    const k = st.r==='porRonda' ? medidaRonda(w) : medidaCadaRonda(w), n = P ? P.items.length : +p.rondas;
    if(k==='t'){ fija(PSF.verTiempo(s.valor), '', 'Tiempo total'); esTiempo = true; D.sub = 'total de ' + n + ' rondas'; }
    else if(k==='m'){ fijaDist(s.valor, 'En intervalos'); D.sub = 'en los ' + n + ' intervalos'; }
    else fija(s.valor, k==='cal' ? 'cal' : 'rep', 'Total'); }
  else if(st && st.r==='porMov'){ const kg = (s.recs || []).filter(r=>r.u==='kg').sort((a, b)=>b.valor - a.valor)[0];
    if(kg){ fija(String(kg.txt).replace(/\s*(kg|lb)$/, ''), /lb$/.test(kg.txt) ? 'lb' : 'kg', 'Carga'); D.sub = kg.nombre; }
    else if(s.txt) fija(s.txt.split(' · ')[0], '', 'Resultado'); }
  else if(s.tipo==='uno' && U){
    if(U.c==='dist'){ const mt = metros(U.dist, U.distU), t = PSF.leerTiempo(U.tiempo);
      if(mt) fijaDist(mt, 'Distancia');
      if(mt && t!=null){ tiempoUno = PSF.verTiempo(t); ritmo = verRitmo(t / (mt/1000)); } }
    else if(U.c==='peso' && s.valor!=null) fija(coma(s.valor), 'kg', 'Carga máxima');
    else if(U.c==='tiempo' && s.valor!=null){ fija(PSF.verTiempo(s.valor), '', 'Tiempo'); esTiempo = true; }
    else if(s.valor!=null) fija(s.valor, U.c==='cal' ? 'cal' : 'rep', U.c==='cal' ? 'Calorías' : 'Repeticiones'); }
  if(!D.grande){ if(s.tipo==='descanso' && m.min) fija(m.min, 'min', 'Minutos');
    else if(m.km) fijaDist(m.km * 1000, 'Distancia'); else if(m.min){ fija(durTxt(m.min), '', 'Tiempo'); esTiempo = true; } else fija('✓', '', ''); }
  // Datos de apoyo (máximo 3, sin repetir el grande)
  const C = [];
  if(m.km && !['km', 'mi', 'm', 'yd'].includes(D.unidad)) C.push(['Distancia', kmTxt(enMillas() ? m.km / KM_MI : m.km) + ' ' + uDist()]);
  if(tiempoUno) C.push(['Tiempo', tiempoUno]); else if((s.dur || m.min) && !esTiempo) C.push(['Tiempo', durTxt(s.dur || m.min)]);
  if(ritmo) C.push(['Ritmo', ritmo]);
  if(P){ const b = P.items.find(x=>x.mejor); if(b) C.push(['Mejor', b.txt]);
    if(P.k!=='t' && P.items.length > 1){ const v = P.items.reduce((a, x)=>a + x.v, 0) / P.items.length; C.push(['Promedio', P.k==='m' ? Math.round(v).toLocaleString('es-CL') + ' m' : Math.round(v) + (P.k==='cal' ? ' cal' : ' rep')]); }
    D.barras = P.items.map(x=>x.v); D.barrasInv = P.k==='t'; }
  if(s.rx && D.wod) C.push(['Nivel', 'RX']);
  if(m.kg && D.unidad!=='kg') C.push(['Carga', m.kg >= 1000 ? verTon(m.kg) : verPeso(Math.round(m.kg), 'kg')]);
  if(kc) C.push(['Energía', kc.toLocaleString('es-CL') + ' kcal']);
  if(s.rpe) C.push(['Esfuerzo', s.rpe + '/10']);
  if(s.fc) C.push(['FC media', s.fc + ' lpm']);
  D.stats = C.slice(0, 3);
  if(!D.sub) D.sub = D.wod ? titulo + (s.rx ? ' · RX' : '') : '';
  // Líneas tipo pizarra y bloques del entrenamiento
  const cant = (x, est)=>{ if(x.descanso) return x.tiempo || '';
    let c = [x.reps && !(est && est.id==='esquema') ? x.reps : '', x.dist ? distTxt(x.dist, x.distU) : '', x.cal ? x.cal + ' cal' : '', x.tiempo || ''].filter(Boolean).join(' · ');
    if(!c && est && est.id==='esquema') c = p.esquema;
    if(!c && est && est.id==='intervalos') c = p.rondas + ' × ' + PSF.verTiempo(+p.trabajo || 0);
    return c; };
  const nom = x=>x.descanso ? 'Descanso' : nomMov(x);
  const fila = (x, est)=>({cant:cant(x, est), nom:nom(x), kg:x.peso ? verPeso(x.peso, x.pesoU, x.mov) : '', g:x.descanso ? 'desc' : (movDe(x.mov) || {g:'gim'}).g, desc:!!x.descanso});
  if(U){ const mv = movDe(U.mov) || {n:U.n, g:'gim'};
    if(U.c==='peso' && U.series) D.bloques = [{n:'', filas:U.series.filter(x=>num(x.peso)!=null).map(x=>({cant:(ent(x.reps) || 1) + ' ×', nom:nomMov(mv), kg:verPeso(x.peso, U.pesoU, U.mov), g:mv.g}))}];
    else D.bloques = [{n:'', filas:[{cant:U.dist ? fmtD(U.dist, U.distU) : U.reps || U.cal || '', nom:nomMov(mv), kg:U.peso ? verPeso(U.peso, U.pesoU, U.mov) : '', g:mv.g}]}];
    D.lineas = [s.desc || mv.n].concat(s.txt ? [resCorto(s)] : []); }
  if(U && U.tramos && U.tramos.length){   // sesión por tramos: cada tramo con su intensidad
    const zt = t=>ZONAS_INT[t.int] ? t.int : t.int==='ritmo' && t.ritmo ? t.ritmo + ' /km' : t.int==='rpe' && t.rpe ? 'esf. ' + t.rpe : '';
    const fl = t=>({cant:cantTramo(t), nom:TIPO_TRAMO[t.k] + (zt(t) ? ' · ' + zt(t) : ''), kg:'', g:'mono', color:colorTramo(t)});
    D.bloques = U.tramos.map(t=>t.bloque ? {n:'REPETIR ' + (t.veces || 1) + ' VECES', filas:(t.tramos || []).map(fl)} : {n:'', filas:[fl(t)]});
    D.bloques = [{n:'TRAMOS', filas:[].concat(...D.bloques.map(b=>b.n ? b.filas.map((f, i)=>i ? f : Object.assign({}, f, {cant:b.n.replace('REPETIR ', '').replace(' VECES', '×') + ' ' + f.cant})) : b.filas))}];
    D.lineas = U.tramos.map(t=>t.bloque ? (t.veces || 1) + ' × (' + (t.tramos || []).map(x=>cantTramo(x) + ' ' + zt(x)).join(' + ') + ')' : cantTramo(t) + ' ' + (zt(t) || '') + ' ' + TIPO_TRAMO[t.k].toLowerCase()); }
  else if(st){ const sc = w.secc || {in:w.in || [], main:w.main || [], out:w.out || []}, buy = BUY.has(st.id);
    const CAB = {rft:p.rondas + ' rondas', esquema:p.esquema, por_tiempo:'Por tiempo', cada_ronda:p.rondas + ' rondas', amrap:'AMRAP ' + p.minutos + ' min', amreps:p.minutos + ' min máx. reps',
      emom:+p.cada===60 ? 'EMOM ' + p.intervalos + ' min' : 'EMOM ' + p.intervalos + ' × ' + p.cada + '″', emom_alt:+p.cada===60 ? 'EMOM alternado ' + p.intervalos + ' min' : 'EMOM alternado ' + p.intervalos + ' × ' + p.cada + '″',
      intervalos:p.rondas + ' × ' + PSF.verTiempo(+p.trabajo || 0) + ' / pausa ' + PSF.verTiempo(+p.descanso || 0), tabata:'Tabata ' + p.rondas + ' × ' + p.trabajo + '″/' + p.descanso + '″',
      fgb:p.rondas + ' rondas FGB', muerte:'Muerte por reps', calidad:String(p.rondas)==='1' ? 'Por calidad' : p.rondas + ' series'}[st.id] || st.n;
    const ln = x=>{ const f = fila(x, st); return f.desc ? 'Descanso ' + f.cant : [st.id==='esquema' ? '' : f.cant, f.nom, f.kg].filter(Boolean).join(' '); };
    D.lineas = [CAB];
    if(sc.in.length) D.lineas.push((buy ? 'Antes: ' : 'Calentamiento: ') + sc.in.map(ln).join(', '));
    sc.main.forEach(x=>D.lineas.push(ln(x)));
    if(sc.out.length) D.lineas.push((buy ? 'Después: ' : 'Calma: ') + sc.out.map(ln).join(', '));
    if(sc.in.length) D.bloques.push({n:buy ? 'ANTES' : 'CALENTAMIENTO', filas:sc.in.map(x=>fila(x, st))});
    D.bloques.push({n:sc.in.length || sc.out.length ? 'BLOQUE PRINCIPAL · ' + CAB.toUpperCase() : D.tipo + ' · ' + CAB.toUpperCase(), filas:sc.main.map(x=>fila(x, st))});
    if(sc.out.length) D.bloques.push({n:buy ? 'DESPUÉS' : 'VUELTA A LA CALMA', filas:sc.out.map(x=>fila(x, st))}); }
  else if(s.desc) D.lineas = String(s.desc).split('\n');
  return D;
}

/* ---------- Ayudas de dibujo ---------- */
function fnt(x, peso, px, it){ x.font = (it ? 'italic ' : '') + peso + ' ' + Math.round(px) + 'px ' + SANS_C; }
function ajustar(x, t, maxW, px, peso, it, min){ let f = px; fnt(x, peso, f, it); while(f > (min || 12) && x.measureText(t).width > maxW){ f -= 2; fnt(x, peso, f, it); } return f; }
function imagenDe(url){ return new Promise(ok=>{ if(!url) return ok(null); const i = new Image(); if(/^https?:/i.test(url)) i.crossOrigin = 'anonymous'; i.onload = ()=>ok(i); i.onerror = ()=>ok(null); i.src = url; }); }
function cubrir(x, img, X, Y, W, H){ const k = Math.max(W/img.width, H/img.height), w = img.width*k, h = img.height*k; x.save(); x.beginPath(); x.rect(X, Y, W, H); x.clip(); x.drawImage(img, X + (W-w)/2, Y + (H-h)/2, w, h); x.restore(); }
function contener(x, img, X, Y, W, H){ const k = Math.min(W/img.width, H/img.height), w = img.width*k, h = img.height*k; x.drawImage(img, X + (W-w)/2, Y + (H-h)/2, w, h); }
function fondoSinFoto(x, X, Y, W, H, color){
  const g = x.createLinearGradient(X, Y, X + W*0.4, Y + H); g.addColorStop(0, color); g.addColorStop(0.55, '#1a1d24'); g.addColorStop(1, '#0b0c10');
  x.fillStyle = g; x.fillRect(X, Y, W, H);
  x.save(); x.globalAlpha = 0.06; x.strokeStyle = '#fff'; x.lineWidth = 3; for(let i = -H; i < W; i += 46){ x.beginPath(); x.moveTo(X + i, Y + H); x.lineTo(X + i + H*0.6, Y); x.stroke(); } x.restore();
}
function sombra(x, W, y0, y1, a, arriba){
  const g = x.createLinearGradient(0, y0, 0, y1);
  if(arriba){ g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); }
  else { g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.45, 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,' + a + ')'); }
  x.fillStyle = g; x.fillRect(0, y0, W, y1 - y0);
}
function redondo(x, X, Y, w, h, r){ x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
/* Etiqueta #TACFITNSCE: 'pastilla' blanca con el # de colores, o solo texto */
function marcaCompartir(x, X, Y, px, modo, alinear){
  fnt(x, 900, px); const t = 'TACFITNSCE', wn = x.measureText('#').width, wt = x.measureText(t).width, pad = px*0.45, W = wn + wt + pad*2, H = px*1.5;
  const x0 = alinear==='centro' ? X - W/2 : alinear==='der' ? X - W : X;
  x.save(); x.textAlign = 'left'; x.textBaseline = 'middle';
  if(modo==='pastilla'){ x.shadowColor = 'rgba(0,0,0,0.18)'; x.shadowBlur = 10; x.fillStyle = '#fff'; redondo(x, x0, Y, W, H, px*0.35); x.fill(); x.shadowBlur = 0; }
  const gr = x.createLinearGradient(x0 + pad, 0, x0 + pad + wn, 0); gr.addColorStop(0, '#ff8a00'); gr.addColorStop(1, '#e1306c');
  x.fillStyle = gr; x.fillText('#', x0 + pad, Y + H/2); x.fillStyle = modo==='pastilla' ? '#111' : modo || '#fff'; x.fillText(t, x0 + pad + wn, Y + H/2);
  x.restore(); return W;
}
/* Cajita de la canción (como el sticker de música): barritas lima y «Artista · Canción» */
function chipMusica(x, X, Y, txt, px, claro, alinear, maxW){
  if(!txt) return 0;
  fnt(x, 700, px); const pad = px*0.6, eq = px*1.1, t = recortar(x, txt, (maxW || 700) - eq - pad*3), W = pad*2 + eq + pad*0.6 + x.measureText(t).width, H = px*1.9;
  const x0 = alinear==='der' ? X - W : alinear==='centro' ? X - W/2 : X;
  x.save(); x.fillStyle = claro ? '#111' : 'rgba(0,0,0,0.62)'; redondo(x, x0, Y, W, H, H/2); x.fill();
  if(x.__portada){ x.save(); redondo(x, x0 + pad * 0.5, Y + H * 0.12, H * 0.76, H * 0.76, H * 0.12); x.clip(); x.drawImage(x.__portada, x0 + pad * 0.5, Y + H * 0.12, H * 0.76, H * 0.76); x.restore(); }
  else { x.fillStyle = LIMA; [0.45, 1, 0.65].forEach((h, i)=>{ const bh = px*0.95*h; x.fillRect(x0 + pad + i*eq/3, Y + H/2 + px*0.48 - bh, eq/3 - px*0.12, bh); }); }
  x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillText(t, x0 + pad + eq + pad*0.6, Y + H/2 + 1); x.restore();
  return W;
}
function pastillaTipo(x, X, Y, t, px, fondo, color){
  fnt(x, 800, px); const W = x.measureText(t).width + px*1.3, H = px*1.75;
  x.save(); x.fillStyle = fondo || LIMA; redondo(x, X, Y, W, H, H/2); x.fill(); x.fillStyle = color || '#111'; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillText(t, X + px*0.65, Y + H/2 + 1); x.restore();
  return H;
}
/* Dato grande con su unidad chica y el extra (ej. «18 rondas +7»); devuelve el ancho */
function datoGrande(x, D, X, Y, px, color, alinear, it, maxW){
  const peso = 900, un = D.unidad ? ' ' + D.unidad : '', ex = D.extra ? ' ' + D.extra : '';
  const medir = f=>{ fnt(x, peso, f, it); const a = x.measureText(D.grande).width, c = x.measureText(ex).width; fnt(x, 700, f*0.32, it); return a + x.measureText(un).width + c; };
  let f = px; while(maxW && f > 40 && medir(f) > maxW) f -= 4;
  const W = medir(f); let x0 = alinear==='centro' ? X - W/2 : alinear==='der' ? X - W : X;
  x.save(); x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.fillStyle = color;
  fnt(x, peso, f, it); x.fillText(D.grande, x0, Y); x0 += x.measureText(D.grande).width;
  if(un){ fnt(x, 700, f*0.32, it); x.fillText(un, x0, Y); x0 += x.measureText(un).width; }
  if(ex){ fnt(x, peso, f, it); x.fillText(ex, x0, Y); }
  x.restore(); return {w:W, px:f};
}
/* Fila de datos (etiqueta chica arriba, valor grande abajo) repartida en el ancho */
function filaDatos(x, datos, X, Y, W, px, color, colorEt, alinear){
  if(!datos.length) return;
  const col = W / datos.length;
  datos.forEach(([k, v], i)=>{ const cx = alinear==='centro' ? X + col*i + col/2 : X + col*i;
    x.save(); x.textAlign = alinear==='centro' ? 'center' : 'left'; x.fillStyle = colorEt || 'rgba(255,255,255,0.78)'; fnt(x, 700, px*0.4);
    x.fillText(String(k).toUpperCase(), cx, Y - px*1.08); x.fillStyle = color || '#fff'; ajustar(x, String(v), col - 16, px, 800, false, px*0.5); x.fillText(String(v), cx, Y); x.restore(); });
}
function lineasEn(x, t, max){ const out = []; let l = ''; String(t).split(' ').forEach(p=>{ const k = l ? l + ' ' + p : p; if(x.measureText(k).width > max && l){ out.push(l); l = p; } else l = k; }); if(l) out.push(l); return out; }

/* ---------- Las 7 plantillas ---------- */
async function lienzoCompartir(s, o){
  // o = {plantilla, fmt:'historia'|'post', foto (id), fondo:'claro'|'oscuro'}
  const W = 1080, H = o.fmt==='post' ? 1350 : 1920, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), D = datosCompartir(s), k = H/1920, M = 64;
  try{ await document.fonts.ready; }catch(e){}
  const fotoId = o.foto, img = fotoId ? await imagenDe(await fotoUrl(fotoId)) : null;
  const trofeo = D.record ? await icoImagen('trophy', LIMA) : null;
  x.__portada = D.musicaImg ? await imagenDe(D.musicaImg) : null;
  const pie = (y, colTxt, conMarca)=>{ x.save(); x.textBaseline = 'alphabetic';
    if(conMarca!==false) marcaCompartir(x, M, y - 40, 30, colTxt || '#fff');
    x.fillStyle = colTxt==='#111' ? '#444' : 'rgba(255,255,255,0.8)'; fnt(x, 600, 28); x.textAlign = 'right'; x.fillText(D.fecha, W - M, y); x.restore(); };
  const P = o.plantilla;
  if(P==='clasico'){
    img ? cubrir(x, img, 0, 0, W, H) : fondoSinFoto(x, 0, 0, W, H, D.color);
    sombra(x, W, H*0.42, H, 0.82);
    const datos = [[D.etiq || 'Resultado', D.grande + (D.unidad && !D.unidad.startsWith('/') ? ' ' + D.unidad : D.unidad) + (D.extra ? ' ' + D.extra : '')]].concat(D.stats).slice(0, 3);
    let y = H - 70; pie(y);
    y -= 92; filaDatos(x, datos, M, y, W - M*2, 70);
    y -= 120;
    if(D.musica){ chipMusica(x, M, y - 34, D.musica, 26, false, null, W - M*2); y -= 60; }
    const ln = D.lineas.length > 1 && (D.wod || s.tipo==='calidad') ? D.lineas.slice(1).join(' · ') : D.sub;
    if(ln){ x.fillStyle = 'rgba(255,255,255,0.88)'; fnt(x, 500, 32); x.fillText(recortar(x, ln, W - M*2), M, y); y -= 56; }
    if(D.honor){ x.fillStyle = LIMA; fnt(x, 700, 30); x.fillText(recortar(x, D.honor, W - M*2), M, y); y -= 52; }
    x.fillStyle = '#fff'; ajustar(x, D.titulo, W - M*2, 88, 900, false, 50); x.fillText(D.titulo, M, y); y -= 88 + 26;
    pastillaTipo(x, M, y - 10, D.tipo, 28);
  }
  else if(P==='numero'){
    img ? cubrir(x, img, 0, 0, W, H) : fondoSinFoto(x, 0, 0, W, H, D.color);
    sombra(x, W, 0, H*0.55, 0.62, true); sombra(x, W, H*0.7, H, 0.7);
    let y = 90*k + 20; pastillaTipo(x, M, y, D.tipo, 30); y += 60;
    const pxG = 330*k + 60, base = y + pxG*0.76; datoGrande(x, D, M - 6, base, pxG, '#fff', 'izq', false, W - M*2);
    y = base + 80;
    x.fillStyle = '#fff'; fnt(x, 800, 50); x.fillText(recortar(x, D.wod ? D.titulo + (D.rx ? ' · RX' : '') : D.titulo, W - M*2), M, y);
    y += 50; if(D.sub && !D.wod){ fnt(x, 500, 34); x.fillStyle = 'rgba(255,255,255,0.85)'; x.fillText(recortar(x, D.sub, W - M*2), M, y); y += 46; }
    if(D.honor){ fnt(x, 600, 32); x.fillStyle = 'rgba(255,255,255,0.9)'; lineasEn(x, D.honor, W - M*2).slice(0, 2).forEach(l=>{ x.fillText(l, M, y); y += 42; }); y += 6; }
    if(D.record){ fnt(x, 700, 34); x.fillStyle = LIMA; if(trofeo) x.drawImage(trofeo, M, y - 26, 38, 38); x.fillText(D.record, M + 48, y + 6); }
    let yb = H - 70; pie(yb);
    if(D.stats.length){ yb -= 90; filaDatos(x, D.stats, M, yb, W - M*2, 60); yb -= 110; }
    if(D.musica) chipMusica(x, M, yb - 40, D.musica, 26, false, null, W - M*2);
  }
  else if(P==='wod'){
    const hf = Math.round(H*(o.fmt==='post' ? 0.40 : 0.46));
    x.fillStyle = '#111318'; x.fillRect(0, 0, W, H);
    img ? cubrir(x, img, 0, 0, W, hf) : fondoSinFoto(x, 0, 0, W, hf, D.color);
    const g2 = x.createLinearGradient(0, hf - 140, 0, hf); g2.addColorStop(0, 'rgba(17,19,24,0)'); g2.addColorStop(1, 'rgba(17,19,24,1)'); x.fillStyle = g2; x.fillRect(0, hf - 140, W, 140);
    if(D.musica) chipMusica(x, W - M, 60, D.musica, 26, false, 'der', W*0.7);
    let y = hf + 70;
    const gw = datoGrande(x, D, M, y + 40, 120, LIMA, 'izq', false, W*0.62);
    x.fillStyle = '#fff'; fnt(x, 800, 44); x.fillText(recortar(x, D.titulo, W - M*2 - gw.w - 30), M + gw.w + 26, y + 38);
    y += 92; x.fillStyle = '#9aa0aa'; fnt(x, 700, 26); x.fillText(recortar(x, D.tipo + (D.rx && D.wod ? ' · RX' : '') + (D.record ? ' · RÉCORD' : ''), W - M*2), M, y);
    if(D.honor){ fnt(x, 600, 28); x.fillStyle = '#fff'; lineasEn(x, D.honor, W - M*2).slice(0, 2).forEach(l=>{ y += 38; x.fillText(l, M, y); }); }
    y += 30;
    const filasMax = Math.max(2, Math.floor((H - 170 - y) / 92)), hFila = 78; let usadas = 0, mas = 0;
    for(const b of D.bloques){ if(usadas >= filasMax){ mas += b.filas.length; continue; }
      if(D.bloques.length > 1 || b.n.startsWith('BLOQUE')){ y += 34; x.fillStyle = '#9aa0aa'; fnt(x, 700, 24); x.fillText(recortar(x, b.n, W - M*2), M, y); usadas += 0.4; }
      y += 14;
      for(const f of b.filas){ if(usadas >= filasMax){ mas++; continue; }
        x.fillStyle = '#20242c'; redondo(x, M, y, W - M*2, hFila, 16); x.fill(); x.fillStyle = f.color || COLOR_G[f.g] || LIMA; x.fillRect(M, y + 8, 8, hFila - 16);
        x.textBaseline = 'middle'; let xx = M + 34;
        if(f.cant){ x.fillStyle = LIMA; fnt(x, 800, 36); const t = recortar(x, f.cant, 260); x.fillText(t, xx, y + hFila/2 + 1); xx += Math.max(150, x.measureText(t).width + 26); }
        let wkg = 0; if(f.kg){ fnt(x, 700, 28); wkg = x.measureText(f.kg).width + 30; x.fillStyle = '#0e1014'; redondo(x, W - M - 20 - wkg, y + 16, wkg, hFila - 32, (hFila - 32)/2); x.fill(); x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText(f.kg, W - M - 20 - wkg/2, y + hFila/2 + 1); x.textAlign = 'left'; }
        x.fillStyle = f.desc ? '#9aa0aa' : '#fff'; fnt(x, 600, 34); x.fillText(recortar(x, f.nom, W - M - 40 - wkg - xx), xx, y + hFila/2 + 1);
        x.textBaseline = 'alphabetic'; y += hFila + 10; usadas++; } }
    if(mas){ x.fillStyle = '#9aa0aa'; fnt(x, 600, 28); x.fillText('+ ' + mas + ' más', M, y + 30); }
    pie(H - 64);
  }
  else if(P==='pizarra'){
    img ? cubrir(x, img, 0, 0, W, H) : fondoSinFoto(x, 0, 0, W, H, D.color);
    x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, 0, W, H);
    const em = await imagenDe(await emblemaUrl('clara'));
    let y = 70*k + 30;
    if(em){ x.fillStyle = '#000'; x.fillRect(M, y, 190, 190); contener(x, em, M + 12, y + 12, 166, 166); y += 214; }
    marcaCompartir(x, M, y, 40, 'pastilla');
    if(D.musica) chipMusica(x, W - M, 70*k + 30, D.musica, 26, false, 'der', W - M*2 - (em ? 220 : 0));
    // cajas negras de abajo hacia arriba
    const lineas = []; fnt(x, 800, 52);
    D.lineas.forEach(t=>lineasEn(x, t, W - M*2 - 40).forEach(l=>lineas.push(l)));
    const vis = lineas.slice(0, Math.floor((H*0.55) / 74));
    let yb = H - 110*k - 40;
    const res = D.grande + (D.unidad ? (D.unidad.startsWith('/') ? '' : ' ') + D.unidad : '') + (D.extra ? ' ' + D.extra : '');
    fnt(x, 900, 72); const wr = x.measureText(res).width;
    x.fillStyle = LIMA; x.fillRect(M, yb - 96, wr + 36, 100); x.fillStyle = '#111'; x.fillText(res, M + 18, yb - 22);
    if(D.record){ fnt(x, 800, 30); x.fillStyle = '#fff'; const tb = await icoImagen('trophy', '#ffffff'); if(tb) x.drawImage(tb, M + wr + 60, yb - 66, 38, 38); x.fillText(D.record, M + wr + 108, yb - 36); }
    yb -= 126;
    for(let i = vis.length - 1; i >= 0; i--){ fnt(x, 800, 52); const wl = x.measureText(vis[i]).width;
      x.fillStyle = '#000'; x.fillRect(M, yb - 64, wl + 32, 74); x.fillStyle = '#fff'; x.fillText(vis[i], M + 16, yb - 10); yb -= 74; }
    if(D.honor){ fnt(x, 800, 34); const hl = lineasEn(x, D.honor, W - M*2 - 40).slice(0, 2); yb -= 12;
      for(let i = hl.length - 1; i >= 0; i--){ const wl = x.measureText(hl[i]).width; x.fillStyle = LIMA; x.fillRect(M, yb - 52, wl + 32, 58); x.fillStyle = '#111'; x.fillText(hl[i], M + 16, yb - 12); yb -= 58; } }
  }
  else if(P==='emblema'){
    const claro = (o.fondo || (S.perfil.emblema ? 'claro' : 'oscuro'))==='claro', TX = claro ? '#111' : '#fff', SU = claro ? '#444' : 'rgba(255,255,255,0.75)';
    x.fillStyle = claro ? '#f2f2f0' : '#0e1014'; x.fillRect(0, 0, W, H);
    marcaCompartir(x, W/2, 90*k + 20, 48, claro ? 'pastilla' : '#fff', 'centro');
    let y = 270*k + 90; x.fillStyle = TX; ajustar(x, D.titulo, W - M*2, 76, 900, true, 44); x.fillText(D.titulo, M, y);
    x.fillStyle = SU; fnt(x, 600, 32); x.fillText(recortar(x, D.tipo, W - M*2), M, y + 48);
    if(D.honor){ fnt(x, 600, 28); x.fillText(recortar(x, D.honor, W - M*2), M, y + 92); y += 40; }
    const em = await imagenDe(await emblemaUrl(claro ? 'oscura' : 'clara'));
    if(em) contener(x, em, 0, y + 90, W*0.68, H - y - 330*k - 120);
    const datos = [[D.etiq || 'Resultado', D.grande + (D.unidad ? (D.unidad.startsWith('/') ? '' : ' ') + D.unidad : '') + (D.extra ? ' ' + D.extra : '')]].concat(D.stats).slice(0, 3);
    let yd = H - 230*k - 70 - (datos.length - 1)*170;
    const top = yd - 110;
    x.save(); x.textAlign = 'right';
    datos.forEach(([kk, v])=>{ x.shadowColor = claro ? '#f2f2f0' : '#0e1014'; x.shadowBlur = 16; x.fillStyle = TX; ajustar(x, String(v), W*0.62, 104, 900, true, 50); x.fillText(String(v), W - M - 40, yd);
      x.shadowBlur = 0; fnt(x, 600, 30); x.fillStyle = TX; x.fillText(String(kk).toUpperCase(), W - M - 40, yd + 42); yd += 170; });
    x.restore();
    x.save(); x.strokeStyle = TX; x.lineWidth = 4; x.beginPath(); x.rect(W - M - 14, top, 24, yd - 170 + 50 - top); x.clip();
    for(let i = top - 40; i < yd; i += 18){ x.beginPath(); x.moveTo(W - M - 20, i + 30); x.lineTo(W - M + 16, i); x.stroke(); } x.restore();
    x.fillStyle = SU; fnt(x, 600, 30); x.textAlign = 'right'; x.fillText(D.fecha, W - M - 40, yd - 170 + 110); x.textAlign = 'left';
    if(D.musica) chipMusica(x, M, H - 110*k - 50, D.musica, 28, claro, null, W - M*2);
  }
  else if(P==='foto'){
    img ? cubrir(x, img, 0, 0, W, H) : fondoSinFoto(x, 0, 0, W, H, D.color);
    if(!img){ x.fillStyle = 'rgba(255,255,255,0.8)'; fnt(x, 700, 40); x.textAlign = 'center'; x.fillText('Toca «Tomar foto» o «Galería»', W/2, H/2); x.textAlign = 'left'; }
    sombra(x, W, H - 260, H, 0.45);
    const wm = marcaCompartir(x, M, H - 150, 34, 'pastilla');
    if(D.musica) chipMusica(x, M + wm + 20, H - 147, D.musica, 26, false, null, W - M*2 - wm - 20);
  }
  else if(P==='sticker'){
    x.clearRect(0, 0, W, H);
    x.save(); x.shadowColor = 'rgba(0,0,0,0.55)'; x.shadowBlur = 18; x.fillStyle = '#fff'; x.textAlign = 'center';
    let y = H*0.3;
    fnt(x, 900, 40); x.fillText(recortar(x, (D.titulo + (D.rx && D.wod ? ' · RX' : '')).toUpperCase(), W - M*2), W/2, y);
    if(D.honor){ fnt(x, 600, 30); lineasEn(x, D.honor, W - M*2).slice(0, 2).forEach((l, i)=>x.fillText(l, W/2, y + 46 + i*38)); y += 100; }
    datoGrande(x, D, W/2, y + 210, 260, '#fff', 'centro', false, W - M*2); y += 300;
    if(D.barras && D.barras.length > 1){ const n = D.barras.length, bw = Math.min(90, (W*0.6)/n - 14), mx = Math.max(...D.barras), mn = Math.min(...D.barras), x0 = W/2 - (n*(bw + 14) - 14)/2;
      x.fillStyle = LIMA; D.barras.forEach((v, i)=>{ const r = D.barrasInv ? (mx - v + mn*0.2) / (mx - mn + mn*0.2 || 1) : (v - mn*0.8) / (mx - mn*0.8 || 1), h = 40 + r*100; redondo(x, x0 + i*(bw + 14), y + 150 - h, bw, h, 8); x.fill(); });
      y += 200; }
    if(D.stats.length){ const col = (W - M*2) / D.stats.length;
      D.stats.forEach(([kk, v], i)=>{ const cx = M + col*i + col/2; x.fillStyle = '#fff'; ajustar(x, String(v), col - 20, 56, 800, false, 30); x.fillText(String(v), cx, y + 30); fnt(x, 600, 28); x.fillText(String(kk).toLowerCase(), cx, y + 72); });
      y += 130; }
    if(D.wod && D.lineas.length){ y += 30; fnt(x, 800, 40); D.lineas.slice(0, 6).forEach(l=>{ x.fillText(recortar(x, l, W - M*2), W/2, y); y += 54; }); y += 20; }
    if(D.record){ x.shadowBlur = 0; const t = 'RÉCORD'; fnt(x, 800, 34); const wr = x.measureText(t).width + 100; x.fillStyle = LIMA; redondo(x, W/2 - wr/2, y - 10, wr, 64, 32); x.fill();
      const tn = await icoImagen('trophy', '#111111'); if(tn) x.drawImage(tn, W/2 - wr/2 + 22, y + 4, 36, 36); x.fillStyle = '#111'; x.textBaseline = 'middle'; x.fillText(t, W/2 + 20, y + 23); x.textBaseline = 'alphabetic'; y += 100; x.shadowBlur = 18; }
    x.restore();
    marcaCompartir(x, W/2, y, 34, '#fff', 'centro');
    if(D.musica) chipMusica(x, W/2, y + 80, D.musica, 26, false, 'centro', W - M*2);
    return new Promise(ok=>c.toBlob(ok, 'image/png'));
  }
  return new Promise(ok=>c.toBlob(ok, 'image/jpeg', 0.9));
}
/* Emblema del usuario (Perfil) o la calavera de la app: 'clara' para fondo oscuro, 'oscura' para fondo claro */
async function emblemaUrl(tono){
  if(S.perfil.emblema){ const u = await fotoUrl(S.perfil.emblema).catch(()=>null); if(u) return u; }
  return 'iconos/calavera_' + tono + '.png';
}
const plantillaPorDefecto = s=>{ const p = pref('plantillaComp'); if(PLANTILLAS.some(x=>x[0]===p)) return p; return ESTILOS_WOD.has(s.tipo) || s.tipo==='calidad' ? 'wod' : 'clasico'; };

/* ---------- Pantalla para compartir un entrenamiento ---------- */
function compartirSesion(s, fotoIni){
  if(!s) return;
  const o = {plantilla:plantillaPorDefecto(s), fmt:pref('fmtComp')==='post' ? 'post' : 'historia', foto:fotoIni || (s.fotos || [])[0] || null, fondo:null};
  let blob = null, url = null, n = 0;
  const canciones = cancionesUsadas();
  dialogo(`<div class="cab"><h2>Compartir</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <div class="c2-vista ${o.fmt}" id="c2Vista"><img id="c2Img" alt="Imagen para compartir"><span class="c2-cargando" id="c2Carg">Preparando…</span></div>
    <div class="c2-plant" id="c2Plant">${PLANTILLAS.map(([k, t, ic])=>`<button data-p="${k}"><span>${IC(ic)}</span>${t}</button>`).join('')}</div>
    <div class="segmentos" id="c2Fmt" style="margin-top:8px"><button data-f="historia">Historia <small>9:16</small></button><button data-f="post">Publicación <small>4:5</small></button></div>
    <div class="c2-fotos" id="c2Fotos"></div>
    <div id="c2Emb" class="c2-emb" hidden><div class="segmentos" id="c2Fondo"><button data-fo="claro">Fondo claro</button><button data-fo="oscuro">Fondo oscuro</button></div>
      <button class="btn" id="c2CambiarEmb">${S.perfil.emblema ? '🔁 Cambiar mi emblema' : '＋ Usar mi emblema'}</button></div>
    ${htmlCancion(s)}
    <div class="btns"><button class="btn" id="c2Bajar">⬇ Guardar</button><button class="btn" id="c2Copiar" hidden>⧉ Copiar imagen</button><button class="btn prim" id="c2Enviar">↗ Compartir…</button></div>
    <p class="nota" id="c2Nota"></p>`, d=>{
    const pintarFotos = ()=>{ const ids = s.fotos || [];
      $('#c2Fotos', d).innerHTML = `<button class="c2-f-btn" id="c2Camara">📷<span>Tomar foto</span></button><button class="c2-f-btn" id="c2Galeria">🖼️<span>Galería</span></button>
        ${ids.map(id=>`<button class="c2-f ${id===o.foto ? 'activa' : ''}" data-fid="${id}"><img data-foto="${id}" alt=""></button>`).join('')}
        ${ids.length ? `<button class="c2-f c2-sin ${o.foto ? '' : 'activa'}" data-fid="">Sin foto</button>` : ''}`;
      cargarFotos($('#c2Fotos', d));
      $$('[data-fid]', d).forEach(b=>b.onclick = ()=>{ o.foto = b.dataset.fid || null; pintarFotos(); actualizar(); });
      const agregar = bs=>{ if(!bs.length) return; agregarFotosA(s, bs).then(()=>{ o.foto = s.fotos[s.fotos.length - 1]; pintarFotos(); actualizar(); aviso('Foto agregada al entrenamiento'); }); };
      $('#c2Camara', d).onclick = ()=>elegirFotos(agregar, true);
      $('#c2Galeria', d).onclick = ()=>elegirFotos(agregar); };
    const marcar = ()=>{
      $$('#c2Plant button', d).forEach(b=>b.classList.toggle('activa', b.dataset.p===o.plantilla));
      $$('#c2Fmt button', d).forEach(b=>b.classList.toggle('activa', b.dataset.f===o.fmt));
      const fo = o.fondo || (S.perfil.emblema ? 'claro' : 'oscuro'); $$('#c2Fondo button', d).forEach(b=>b.classList.toggle('activa', b.dataset.fo===fo));
      $('#c2Emb', d).hidden = o.plantilla!=='emblema';
      $('#c2Vista', d).className = 'c2-vista ' + o.fmt + (o.plantilla==='sticker' ? ' sticker' : '');
      const puedeCopiar = o.plantilla==='sticker' && !!(navigator.clipboard && window.ClipboardItem);
      $('#c2Copiar', d).hidden = !puedeCopiar;
      $('#c2Nota', d).textContent = (o.plantilla==='sticker' ? (puedeCopiar ? '«Copiar imagen» y luego, en tu historia de Instagram, mantén el dedo y elige «Pegar»: queda como sticker sobre tu foto o video. ' : 'Guarda la imagen y agrégala como sticker en tu historia. ') : '')
        + (s.musica ? 'Para que suene la canción: en la historia de Instagram toca el sticker «Música» y pega el nombre (se copia solo al compartir).' : 'Al compartir se copia el texto con #TACFITNSCE para pegarlo en tu publicación. Si anotas la canción que escuchabas, aparece en la imagen y se copia para el sticker «Música» de Instagram.'); };
    const actualizar = async ()=>{ const mi = ++n; marcar(); $('#c2Carg', d).hidden = false;
      const b = await lienzoCompartir(s, o); if(mi!==n) return;
      blob = b; if(url) URL.revokeObjectURL(url); url = URL.createObjectURL(b); $('#c2Img', d).src = url; $('#c2Carg', d).hidden = true; };
    const archivo = ()=>new File([blob], 'tacfit_' + s.fecha + '_' + o.plantilla + (blob.type==='image/png' ? '.png' : '.jpg'), {type:blob.type});
    const copiarCancion = ()=>{ try{ navigator.clipboard.writeText(s.musica || textoSesion(s)).catch(()=>{}); }catch(e){} };   // la canción (para el sticker «Música») o el texto con etiquetas
    $$('#c2Plant button', d).forEach(b=>b.onclick = ()=>{ o.plantilla = b.dataset.p; pref('plantillaComp', o.plantilla); actualizar(); });
    $$('#c2Fmt button', d).forEach(b=>b.onclick = ()=>{ o.fmt = b.dataset.f; pref('fmtComp', o.fmt); actualizar(); });
    $$('#c2Fondo button', d).forEach(b=>b.onclick = ()=>{ o.fondo = b.dataset.fo; actualizar(); });
    $('#c2CambiarEmb', d).onclick = ()=>elegirEmblema(()=>{ o.fondo = null; $('#c2CambiarEmb', d).textContent = '🔁 Cambiar mi emblema'; actualizar(); });
    enlazarCancion(d, r=>{ ponerMusica(s, r); guardar(); actualizar(); });
    $('#c2Bajar', d).onclick = ()=>{ if(blob) guardarImagen(archivo(), url); };
    $('#c2Copiar', d).onclick = async ()=>{ try{ await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]); aviso('Imagen copiada: pégala en tu historia'); }catch(e){ aviso('No se pudo copiar: usa «Guardar»'); } };
    $('#c2Enviar', d).onclick = ()=>{ if(!blob) return; copiarCancion(); const f = archivo();
      if(navigator.canShare && navigator.canShare({files:[f]})) navigator.share({files:[f], title:s.titulo || 'Entrenamiento'}).catch(()=>{});
      else { const a = document.createElement('a'); a.href = url; a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); aviso('Imagen guardada: súbela desde Instagram o WhatsApp'); } };
    pintarFotos(); actualizar();
  });
  const dg = $('#dialogo'); dg.classList.add('dlg-compartir');
}
/* Emblema personal para las imágenes (calavera, casco, escudo de la unidad…): se guarda como foto en el equipo */
function elegirEmblema(alListo){
  elegirFotos(async bs=>{ if(!bs.length) return; const id = 'f' + uid(); await fotoGuardar(id, bs[0]); if(S.perfil.emblema) await fotoBorrar(S.perfil.emblema).catch(()=>{});
    S.perfil.emblema = id; guardar(); aviso('Emblema guardado'); if(alListo) alListo(); }, false, true);
}

/* ---------- Música del entrenamiento ---------- */
const cancionesUsadas = ()=>cancionesRecientes().map(s=>s.musica);
/* Listas de música para entrenar (Spotify, Apple Music, YouTube…): se abren antes de partir */
const listasMusica = ()=>(S.perfil.listas || []).filter(l=>l && /^https:\/\//i.test(l.url || ''));
function abrirMiMusica(){
  const L = listasMusica();
  if(!L.length){ dialogoListasMusica(); return; }
  if(L.length===1){ window.open(L[0].url, '_blank', 'noopener'); return; }
  dialogo(`<div class="cab"><h2>🎵 Mi música</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <div class="cmp-ops">${L.map((l, i)=>`<a class="cmp-op" href="${esc(l.url)}" target="_blank" rel="noopener" data-cerrar><span class="cmp-ic">🎵</span><span><b>${esc(l.n || 'Mi lista')}</b><small>${esc(appMusica(l.url))}</small></span><span class="chev">›</span></a>`).join('')}</div>
    <button class="btn ancho" id="mmEditar" style="margin-top:10px">✎ Editar mis listas</button>`, d=>{ $('#mmEditar', d).onclick = dialogoListasMusica; });
}
const appMusica = u=>/spotify/i.test(u) ? 'Spotify' : /music\.apple/i.test(u) ? 'Apple Music' : /youtu/i.test(u) ? 'YouTube' : /deezer/i.test(u) ? 'Deezer' : /tidal/i.test(u) ? 'Tidal' : 'Enlace';
/* ---------- Canción del entrenamiento: nombre, artista, álbum y portada ----------
   Spotify y YouTube entregan nombre y portada por oEmbed; el buscador de Apple (iTunes) da artista, álbum y portada de cualquier canción.
   Los tres permiten consultarlos desde la app y usar la portada en las fotos para compartir. */
const esEnlace = t=>/^\s*https?:\/\//i.test(String(t || ''));
async function buscarITunes(q, titulo){
  try{ const j = await (await fetch('https://itunes.apple.com/search?entity=song&limit=6&country=CL&term=' + encodeURIComponent(q))).json(), rs = j.results || [];
    if(!titulo) return rs[0] || null; const t = _norm(titulo).replace(/[^a-z0-9]/g, '');
    return rs.find(r=>{ const n = _norm(r.trackName).replace(/[^a-z0-9]/g, ''); return n===t || n.startsWith(t) || t.startsWith(n); }) || null; }catch(e){ return null; }
}
const portadaITunes = r=>r && r.artworkUrl100 ? r.artworkUrl100.replace('100x100bb', '600x600bb') : null;
async function resolverMusica(txt){
  txt = String(txt || '').trim(); if(!txt) return null;
  const m = txt.match(/https?:\/\/\S+/);
  if(!m || !/^https:\/\//i.test(m[0])){   // texto escrito: «AC/DC · Hells Bells» o solo «Hells Bells»
    const t = (m ? txt.replace(m[0], '') : txt).trim().slice(0, 90), par = t.split(/\s+[·\-–]\s+/), cancion = par.length > 1 ? par.slice(1).join(' ') : t;
    const it = await buscarITunes(t, cancion);
    return {n:it ? it.trackName : cancion, art:it ? it.artistName : par.length > 1 ? par[0] : null, album:it ? it.collectionName : null, img:portadaITunes(it), url:null, app:null}; }
  const url = m[0], antes = txt.slice(0, m.index).replace(/[\s:–-]+$/, '').trim(), app = appMusica(url);
  let n = '', art = null, img = null;
  try{
    if(/spotify\.com/i.test(url)){ const j = await (await fetch('https://open.spotify.com/oembed?url=' + encodeURIComponent(url))).json(); n = j.title || ''; img = j.thumbnail_url || null; }
    else if(/youtu\.?be/i.test(url)){ const j = await (await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(url))).json();
      const t = String(j.title || '').replace(/\s*[\(\[][^\)\]]*(official|oficial|video|audio|lyric|letra|hd|4k)[^\)\]]*[\)\]]/ig, '').trim(), par = t.split(/\s+[\-–]\s+/);
      if(par.length > 1){ art = par[0]; n = par.slice(1).join(' - '); } else n = t; img = j.thumbnail_url || null; }
    else if(/music\.apple\.com/i.test(url)){ const partes = url.split('?')[0].split('/').filter(Boolean), k = partes.findIndex(x=>x==='album' || x==='song' || x==='playlist');
      const slug = k >= 0 ? partes[k + 1] || '' : ''; n = slug.split('-').filter(Boolean).map(w=>w[0].toUpperCase() + w.slice(1)).join(' '); }
  }catch(e){}
  if(!n && antes.length > 2 && antes.length < 90) n = antes;
  let album = null;
  if(n && !/playlist|album\//i.test(url.replace(/album\/[^/]+\/\d+\?i=/, ''))){ const it = await buscarITunes((art ? art + ' ' : '') + n, n);
    if(it){ art = art || it.artistName; album = it.collectionName; if(!img || /ytimg/.test(img)) img = portadaITunes(it) || img; } }
  return {n:n || '', art, album, img, url, app};
}
/* Copia la canción a un entrenamiento o al registro en curso (W) */
function ponerMusica(o, r){ o.musica = r && r.n || null; o.musicaArt = r && r.art || null; o.musicaAlbum = r && r.album || null; o.musicaImg = r && r.img || null; o.musicaUrl = r && r.url || null; }
const musicaDe = o=>o && o.musica ? {n:esEnlace(o.musica) ? 'Canción en ' + appMusica(o.musica) : o.musica, art:o.musicaArt, album:o.musicaAlbum, img:o.musicaImg, url:o.musicaUrl || (esEnlace(o.musica) ? o.musica.trim() : null)} : null;
const nombreCancion = s=>{ const r = musicaDe(s); return r ? r.n + (r.art ? ' · ' + r.art : '') : ''; };
const claseApp = u=>/spotify/i.test(u || '') ? 'spotify' : /youtu/i.test(u || '') ? 'youtube' : /apple/i.test(u || '') ? 'apple' : '';
/* Tarjeta de la canción (como la de Spotify): portada, nombre, artista y álbum, y la app; si hay enlace, la abre */
function htmlTarjetaMusica(o, chico){
  const r = musicaDe(o); if(!r) return '';
  const ok = r.url && /^https:\/\//i.test(r.url), et = ok ? 'a' : 'div';
  if(chico) return `<${et} class="mus-card chico" ${ok ? `href="${esc(r.url)}" target="_blank" rel="noopener"` : ''}>
    ${r.img ? `<img class="mus-img" src="${esc(r.img)}" alt="" referrerpolicy="no-referrer">` : `<span class="mus-img mus-sin">${IC('music-notes')}</span>`}
    <span class="mus-txt"><b>${esc(r.n)}</b><small>${esc([r.art, r.album].filter(Boolean).join(' · ') || 'Canción del entrenamiento')}</small></span>
    <span class="mus-der"><span class="eq-mini"><i></i><i></i><i></i></span>${r.url ? `<small class="mus-app ${claseApp(r.url)}">${esc(appMusica(r.url))}</small>` : ''}</span></${et}>`;
  // grande (muro y detalle): portada grande, fondo con la portada difuminada y «Escuchar»
  return `<${et} class="mus-card grande" ${ok ? `href="${esc(r.url)}" target="_blank" rel="noopener"` : ''}>
    ${r.img ? `<img class="mus-fondo" src="${esc(r.img)}" alt="" aria-hidden="true" referrerpolicy="no-referrer">` : ''}
    ${r.img ? `<img class="mus-img" src="${esc(r.img)}" alt="Portada" referrerpolicy="no-referrer">` : `<span class="mus-img mus-sin">${IC('music-notes')}</span>`}
    <span class="mus-txt"><span class="mus-et"><span class="eq-mini"><i></i><i></i><i></i></span>Música del entrenamiento</span><b>${esc(r.n)}</b>
      ${r.art ? `<span class="mus-art">${esc(r.art)}</span>` : ''}${r.album ? `<small>${esc(r.album)}</small>` : ''}</span>
    ${ok ? `<span class="mus-esc ${claseApp(r.url)}">▶ ${esc(appMusica(r.url))}</span>` : ''}</${et}>`;
}
/* Campo «Canción del entrenamiento»: pegar el enlace copiado, elegir una reciente o escribirla. alCambiar(resultado | null) */
function htmlCancion(o){
  const actual = musicaDe(o), rec = cancionesRecientes().filter(x=>!actual || x.musica!==o.musica).slice(0, 6);
  return `<div class="cancion"><div class="entre"><label style="margin:0">🎵 Canción del entrenamiento <span class="suave">(opcional)</span></label><button type="button" class="btn-link" data-cquitar ${actual ? '' : 'hidden'}>Quitar</button></div>
    <div class="can-actual" data-cactual>${actual ? htmlTarjetaMusica(o, true) : '<span class="suave chico">En tu app de música toca Compartir → Copiar enlace y luego «Pegar canción».</span>'}</div>
    <div class="can-btns"><button type="button" class="btn prim" data-cpegar>📋 Pegar canción</button><button type="button" class="btn" data-cescribir>✎ Escribir</button></div>
    <input class="can-input" data-cinput placeholder="Artista · Canción, o pega el enlace aquí" hidden autocomplete="off">
    ${rec.length ? `<div class="chips can-rec">${rec.map(x=>`<button type="button" data-crec="${esc(x.musica)}">${esc(nombreCancion(x))}</button>`).join('')}</div>` : ''}</div>`;
}
function enlazarCancion(raiz, alCambiar){
  const caja = $('.cancion', raiz); if(!caja) return;
  const rec = cancionesRecientes(), pinta = r=>{ const o = {}; ponerMusica(o, r);
    $('[data-cactual]', caja).innerHTML = r && r.n ? htmlTarjetaMusica(o, true) : '<span class="suave chico">Sin canción.</span>'; $('[data-cquitar]', caja).hidden = !(r && r.n); };
  const usar = async txt=>{ if(!txt || !txt.trim()) return; $('[data-cactual]', caja).innerHTML = '<span class="suave chico">Buscando la canción…</span>';
    const r = await resolverMusica(txt); if(!r) return;
    if(!r.n){ pinta(null); const i = $('[data-cinput]', caja); i.hidden = false; i.value = ''; i.placeholder = 'No se pudo leer el nombre: escríbelo'; i.focus(); return; }
    pinta(r); alCambiar(r); aviso('🎵 ' + r.n + (r.art ? ' · ' + r.art : '')); };
  $('[data-cpegar]', caja).onclick = async ()=>{ let t = '';
    try{ t = await navigator.clipboard.readText(); }catch(e){}
    if(t && t.trim()) usar(t); else { const i = $('[data-cinput]', caja); i.hidden = false; i.focus(); aviso('Pega aquí el enlace (mantén el dedo → Pegar)'); } };
  $('[data-cescribir]', caja).onclick = ()=>{ const i = $('[data-cinput]', caja); i.hidden = false; i.focus(); };
  $('[data-cinput]', caja).onchange = e=>usar(e.target.value);
  $('[data-cquitar]', caja).onclick = ()=>{ pinta(null); alCambiar(null); };
  $$('[data-crec]', caja).forEach(b=>b.onclick = ()=>{ const x = rec.find(y=>y.musica===b.dataset.crec); if(!x) return; const r = {n:x.musica, art:x.musicaArt, album:x.musicaAlbum, img:x.musicaImg, url:x.musicaUrl}; pinta(r); alCambiar(r); });
}
/* Canciones ya usadas (sin repetir, la más reciente primero) */
function cancionesRecientes(){ const vistas = new Set(), out = []; ordenadas().forEach(s=>{ if(s.musica && !esEnlace(s.musica) && !vistas.has(s.musica)){ vistas.add(s.musica); out.push(s); } }); return out.slice(0, 30); }
/* Al abrir la app: enlaces guardados → nombre; canciones sin portada → se completan (hasta 12 por vez, sin internet no hace nada) */
async function repararMusicas(){
  const xs = (S.sesiones || []).filter(s=>s.musica && (esEnlace(s.musica) || (!s.musicaImg && !s.musicaSinDatos))).slice(0, 12); if(!xs.length) return;
  let cambio = false;
  for(const s of xs){ const r = await resolverMusica(s.musica).catch(()=>null); if(!r) continue;
    if(r.n){ const nombre = esEnlace(s.musica) ? r.n : s.musica.split(/\s+[·\-–]\s+/).length > 1 && !r.art ? s.musica : r.n; ponerMusica(s, Object.assign({}, r, {n:nombre, url:r.url || s.musicaUrl})); cambio = true; }
    if(!r.img) s.musicaSinDatos = true; }
  if(cambio || xs.length){ guardar(); if(cambio && typeof VISTAS!=='undefined' && VISTAS[vistaActual] && !$('#dialogo').open) VISTAS[vistaActual](); }
}
/* Mis listas para entrenar: pegar el enlace de la lista y la app pone el nombre sola */
function dialogoListasMusica(){
  const pintar = ()=>{ const L = S.perfil.listas || [];
    dialogo(`<div class="cab"><h2>🎵 Mis listas de música</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
      <p class="suave chico" style="margin-top:0">En Spotify, Apple Music o YouTube abre tu lista → Compartir → Copiar enlace, y toca «Pegar lista». El botón «🎵 Mi música» del reloj y del WOD del día la abre antes de partir.</p>
      ${L.length ? `<ul class="lista">${L.map((l, i)=>`<li class="entre"><div><b>${esc(l.n)}</b><div class="suave chico">${esc(appMusica(l.url))}</div></div><button class="btn chico-btn" data-lquitar="${i}" aria-label="Quitar">✕</button></li>`).join('')}</ul>` : '<p class="vacio chico">Aún no tienes listas.</p>'}
      <button class="btn prim ancho" id="lmPegar" style="margin-top:10px">📋 Pegar lista</button>
      <input id="lmInput" placeholder="o pega aquí el enlace" hidden style="margin-top:8px">
      <div class="btns"><button class="btn" data-cerrar>Listo</button></div>`, d=>{
      const agregar = async txt=>{ const r = await resolverMusica(txt); if(!r || !r.url){ aviso('Eso no parece un enlace de música'); return; }
        S.perfil.listas = (S.perfil.listas || []).concat({n:r.n || (r.app + ' ' + ((S.perfil.listas || []).length + 1)), url:r.url}).slice(0, 8); guardar(); aviso('Lista agregada: ' + (r.n || r.app)); pintar(); if(vistaActual==='perfil') vPerfil(); };
      $('#lmPegar', d).onclick = async ()=>{ let t = ''; try{ t = await navigator.clipboard.readText(); }catch(e){}
        if(t && /https?:\/\//.test(t)) agregar(t); else { $('#lmInput', d).hidden = false; $('#lmInput', d).focus(); aviso('Pega aquí el enlace (mantén el dedo → Pegar)'); } };
      $('#lmInput', d).onchange = e=>agregar(e.target.value);
      $$('[data-lquitar]', d).forEach(b=>b.onclick = ()=>{ S.perfil.listas.splice(+b.dataset.lquitar, 1); guardar(); pintar(); if(vistaActual==='perfil') vPerfil(); });
    }); };
  pintar();
}
function htmlMusicaPerfil(){
  const L = listasMusica();
  return `<h3>Música y compartir</h3>
    <div class="tarjeta">
      <div class="entre"><div><b>🎵 Mis listas para entrenar</b><div class="suave chico">${L.length ? L.map(l=>esc(l.n) + ' (' + appMusica(l.url) + ')').join(' · ') : 'Sin listas: agrega el enlace de tu lista de Spotify, Apple Music o YouTube.'}</div></div>
        <button class="btn chico-btn" id="pmListas">✎</button></div>
      <div class="entre" style="margin-top:12px"><div><b>💀 Mi emblema</b><div class="suave chico">${S.perfil.emblema ? 'Se usa en las plantillas «Emblema» y «Pizarra».' : 'Sin emblema: se usa la calavera de la app. Sube tu imagen (escudo de la unidad, calavera, casco…).'}</div></div>
        <span class="fila-btns">${S.perfil.emblema ? `<img class="pm-emb" data-foto="${S.perfil.emblema}" alt=""><button class="btn chico-btn" id="pmQuitarEmb" aria-label="Quitar emblema">✕</button>` : ''}<button class="btn chico-btn" id="pmEmb">${S.perfil.emblema ? '🔁' : '＋'}</button></span></div>
      <p class="nota">Usa imágenes propias o con permiso.</p>
    </div>`;
}
function enlazarMusicaPerfil(){
  if(!$('#pmListas')) return;
  cargarFotos($('#vista'));
  $('#pmListas').onclick = dialogoListasMusica;
  $('#pmEmb').onclick = ()=>elegirEmblema(vPerfil);
  if($('#pmQuitarEmb')) $('#pmQuitarEmb').onclick = ()=>confirmar('¿Quitar tu emblema? Se volverá a usar la calavera de la app.', async ()=>{ await fotoBorrar(S.perfil.emblema).catch(()=>{}); S.perfil.emblema = null; guardar(); vPerfil(); }, 'Sí, quitar');
}

/* ---------- Tarjetas de logros, perfil e informe del mes (estilo deportivo) ---------- */
const FONDO_C = '#0e1014', PANEL_C = '#171a20', PANEL2_C = '#20242c', SUAVE_C = '#9aa0aa';
function fondoTarjeta(x, W, H, color){
  x.fillStyle = FONDO_C; x.fillRect(0, 0, W, H);
  const g = x.createRadialGradient(W*0.8, H*0.12, 40, W*0.8, H*0.12, W*0.95); g.addColorStop(0, (color || LIMA) + '38'); g.addColorStop(1, 'rgba(14,16,20,0)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
}
function cuadrosDatos(x, datos, X, Y, W, cols, h, px){
  const gap = 18, cw = (W - gap*(cols - 1)) / cols;
  datos.forEach(([v, k], i)=>{ const cx = X + (i % cols)*(cw + gap), cy = Y + Math.floor(i / cols)*(h + gap);
    x.fillStyle = PANEL_C; redondo(x, cx, cy, cw, h, 28); x.fill();
    x.textAlign = 'left'; x.fillStyle = SUAVE_C; fnt(x, 700, 26); x.fillText(String(k), cx + 30, cy + 50);
    x.fillStyle = '#fff'; ajustar(x, String(v), cw - 60, px || 76, 900, false, 34); x.fillText(String(v), cx + 30, cy + h - 34); });
}
const TIPO_LOGRO_C = {rec:'Récord personal', ins:'Nueva insignia', hito:'Hito alcanzado', rango:'Ascenso de rango', psf:'Control PSF'};
async function tarjetaLogro(e, H){
  const W = 1080, H2 = H || 1350, c = document.createElement('canvas'); c.width = W; c.height = H2; const x = c.getContext('2d'), M = 80;
  try{ await document.fonts.ready; }catch(er){}
  fondoTarjeta(x, W, H2); const cy = H2/2 - 120;
  marcaCompartir(x, M, 70, 34, '#fff');
  x.fillStyle = SUAVE_C; fnt(x, 600, 30); x.textAlign = 'right'; x.fillText(e.fecha ? verFecha(e.fecha) : '', W - M, 112); x.textAlign = 'left';
  // círculo con el ícono del logro
  x.fillStyle = LIMA; x.beginPath(); x.arc(W/2, cy - 120, 170, 0, Math.PI*2); x.fill();
  x.strokeStyle = 'rgba(215,255,58,0.25)'; x.lineWidth = 16; x.beginPath(); x.arc(W/2, cy - 120, 200, 0, Math.PI*2); x.stroke();
  const im = await icoImagen(icDeEmoji(e.ic) || 'trophy', '#111111'); if(im) x.drawImage(im, W/2 - 110, cy - 230, 220, 220);
  x.textAlign = 'center';
  const tt = TIPO_LOGRO_C[e.tipo] || 'Logro'; fnt(x, 800, 32); const wt = x.measureText(tt).width + 60;
  x.fillStyle = PANEL2_C; redondo(x, W/2 - wt/2, cy + 130, wt, 64, 32); x.fill(); x.fillStyle = LIMA; x.textBaseline = 'middle'; x.fillText(tt, W/2, cy + 163); x.textBaseline = 'alphabetic';
  x.fillStyle = '#fff'; fnt(x, 900, 80); lineasEn(x, e.t, W - M*2).slice(0, 3).forEach((l, i)=>x.fillText(l, W/2, cy + 300 + i*92));
  if(e.d){ x.fillStyle = SUAVE_C; fnt(x, 600, 38); x.fillText(recortar(x, e.tipo==='rec' ? e.d.replace('récord · ', 'mejora ') : e.d, W - M*2), W/2, cy + 300 + Math.min(3, lineasEn(x, e.t, W - M*2).length)*92 + 20); }
  x.fillStyle = '#fff'; fnt(x, 800, 40); if(S.perfil.nombre) x.fillText(recortar(x, S.perfil.nombre, W - M*2), W/2, H2 - 130);
  x.fillStyle = SUAVE_C; fnt(x, 600, 30); x.fillText('Rango: ' + puntos().rango, W/2, H2 - 80);
  x.textAlign = 'left';
  return new Promise(ok=>c.toBlob(ok, 'image/jpeg', 0.92));
}
async function tarjetaPerfil(alto){
  const p = S.perfil, st = estadisticas(), E = estadoInsignias(st), pt = puntos(st, E);
  const W = 1080, H = 1080, c = document.createElement('canvas'); c.width = W; c.height = alto || H; const x = c.getContext('2d'), M = 70;
  try{ await document.fonts.ready; }catch(er){}
  fondoTarjeta(x, W, c.height); x.translate(0, (c.height - H) / 2); marcaCompartir(x, M, 60, 32, '#fff');
  const av = p.avatar ? await imagenDe(await fotoUrl(p.avatar).catch(()=>null)) : null;
  x.save(); x.beginPath(); x.arc(M + 90, 250, 90, 0, Math.PI*2); x.clip();
  if(av) cubrir(x, av, M, 160, 180, 180); else { x.fillStyle = PANEL2_C; x.fillRect(M, 160, 180, 180); x.fillStyle = LIMA; fnt(x, 900, 70); x.textAlign = 'center'; x.fillText((p.nombre || '?').split(' ').filter(Boolean).slice(0, 2).map(w=>w[0].toUpperCase()).join(''), M + 90, 275); x.textAlign = 'left'; }
  x.restore(); x.strokeStyle = LIMA; x.lineWidth = 8; x.beginPath(); x.arc(M + 90, 250, 96, 0, Math.PI*2); x.stroke();
  x.fillStyle = '#fff'; ajustar(x, p.nombre || 'Mi perfil', W - M*2 - 230, 72, 900, false, 40); x.fillText(p.nombre || 'Mi perfil', M + 220, 240);
  const rt = pt.rango + ' · ' + pt.total.toLocaleString('es-CL') + ' pts'; fnt(x, 800, 30); const wr = x.measureText(rt).width + 50;
  x.fillStyle = LIMA; redondo(x, M + 220, 270, wr, 56, 28); x.fill(); x.fillStyle = '#111'; x.textBaseline = 'middle'; x.fillText(rt, M + 245, 299); x.textBaseline = 'alphabetic';
  let y = 420; if(p.frase){ x.fillStyle = SUAVE_C; fnt(x, 500, 36); lineasEn(x, p.frase.replace(/\n/g, ' '), W - M*2).slice(0, 2).forEach(l=>{ x.fillText(l, M, y); y += 48; }); }
  const km = Object.values(st.km).reduce((a, b)=>a + b, 0) / 1000;
  cuadrosDatos(x, [[st.n.toLocaleString('es-CL'), 'Entrenamientos'], [verKm(Math.round(km)), 'Distancia'], [insigniasGanadas(E).length, 'Insignias'], [st.rachaMax + ' días', 'Mejor racha']], M, Math.max(y + 20, 540), W - M*2, 2, 190, 84);
  return new Promise(ok=>c.toBlob(ok, 'image/jpeg', 0.92));
}
async function tarjetaInforme(I, alto){
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = alto || H; const x = c.getContext('2d'), M = 70;
  try{ await document.fonts.ready; }catch(er){}
  fondoTarjeta(x, W, c.height); x.translate(0, (c.height - H) / 2); marcaCompartir(x, M, 60, 32, '#fff');
  x.fillStyle = SUAVE_C; fnt(x, 700, 30); x.fillText('Informe del mes', M, 220);
  x.fillStyle = '#fff'; fnt(x, 900, 96); x.fillText(I.nombre.charAt(0).toUpperCase() + I.nombre.slice(1), M, 320);
  if(S.perfil.nombre){ x.fillStyle = SUAVE_C; fnt(x, 600, 34); x.fillText(recortar(x, S.perfil.nombre, W - M*2), M, 372); }
  cuadrosDatos(x, [[I.t.n, 'Sesiones'], [I.dias, 'Días'], [fmtNum(nKm(I.t.km)), uDist()==='mi' ? 'Millas' : 'Km'], [fmtHoras(I.t.min), 'Horas'], [nTon(I.t.kg).toLocaleString('es-CL'), uTon()==='lb' ? 'Libras' : 'Toneladas'], [I.recs, 'Récords']], M, 420, W - M*2, 3, 160, 70);
  const tot = Object.values(I.porGrupo).reduce((a, b)=>a + b, 0); let bx = M;
  if(tot) Object.entries(I.porGrupo).sort((a, b)=>b[1] - a[1]).forEach(([g, n])=>{ const w = (W - M*2) * n / tot; x.fillStyle = COLOR_G[g] || SUAVE_C; redondo(x, bx, 800, Math.max(6, w - 8), 24, 12); x.fill(); bx += w; });
  x.fillStyle = '#fff'; fnt(x, 800, 42); x.fillText('Logros del mes', M, 920);
  const L = I.logros.slice(0, 4); fnt(x, 600, 34);
  if(!L.length){ x.fillStyle = SUAVE_C; x.fillText('Constancia: ' + I.t.n + ' sesiones', M, 990); }
  for(const [i, e] of L.entries()){ const y = 990 + i*70, col = i ? '#fff' : LIMA, im = await icoImagen(icDeEmoji(e.ic) || 'trophy', col);
    if(im) x.drawImage(im, M, y - 36, 44, 44); x.fillStyle = col; fnt(x, 600, 34); x.fillText(recortar(x, e.t, W - M*2 - 64), M + 62, y); }
  x.fillStyle = SUAVE_C; fnt(x, 600, 30); x.fillText('Rango: ' + puntos().rango, M, H - 70);
  return new Promise(ok=>c.toBlob(ok, 'image/jpeg', 0.92));
}
/* Lleva una tarjeta 4:5 o cuadrada a formato historia 9:16 (fondo grafito y la tarjeta al centro) */
async function aHistoria(blob){
  const W = 1080, H = 1920, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  fondoTarjeta(x, W, H);
  const u = URL.createObjectURL(blob), img = await imagenDe(u);
  if(img){ const h = img.height * W / img.width; x.drawImage(img, 0, (H - h) / 2, W, h); }
  URL.revokeObjectURL(u);
  return new Promise(ok=>c.toBlob(ok, 'image/jpeg', 0.92));
}
