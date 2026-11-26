/* #NSCE — Comparar un entrenamiento con las veces anteriores (13-nov-2026, maqueta aprobada por el usuario: «esta comparación debe ser mejor»).
   valorComparable(s): el número que importa según el tipo (ritmo en carreras, tiempo, rondas, repeticiones o carga) y si menos es mejor.
   Las carreras se comparan por RITMO (comparar el tiempo de 8 km con el de 10 km engaña). La usan el Historial del detalle (verSesion)
   y las plantillas «Logro» y «Antes y ahora» de compartir.js. Carga después de tramos.js y compartir.js, antes de app.js. */

function valorComparable(s){
  if(!s) return null;
  const w = s.w || {}, U = w.uno, st = typeof estiloDe==='function' ? estiloDe(s.tipo) : null;
  if(U && U.c==='dist'){ const mt = metros(U.dist, U.distU), t = PSF.leerTiempo(U.tiempo);
    if(mt && t) return {k:'ritmo', v:t / (mt / 1000), menor:true, txt:verRitmo(t / (mt / 1000)), m:mt, t};
    return mt ? {k:'dist', v:mt, menor:false, txt:verDist(mt), m:mt} : null; }
  if(U && U.c==='peso' && s.valor!=null) return {k:'kg', v:s.valor, menor:false, txt:verPeso(s.valor, 'kg', U.mov)};
  if(s.valor==null) return null;
  if(st && st.r==='tiempo') return {k:'tiempo', v:s.valor, menor:true, txt:PSF.verTiempo(s.valor)};
  if(st && st.r==='rondas') return {k:'rondas', v:s.valor, menor:false, txt:s.txt || String(s.valor)};
  if(st && st.r==='tiempos') return {k:'tiempo', v:s.valor, menor:true, txt:PSF.verTiempo(s.valor)};
  if(U && U.c==='tiempo') return {k:'tiempo', v:s.valor, menor:false, txt:PSF.verTiempo(s.valor)};
  return {k:'num', v:s.valor, menor:false, txt:s.txt || String(s.valor)};
}
/* Las veces que hizo «lo mismo»: mismo título, o (sin título) el mismo ejercicio único; de la más nueva a la más antigua */
function sesionesParecidas(s){
  const t = (s.titulo || '').trim().toLowerCase(), U = s.w && s.w.uno;
  const igual = x=>t ? (x.titulo || '').trim().toLowerCase()===t : U && x.w && x.w.uno && x.w.uno.mov===U.mov && x.w.uno.c===U.c;
  const L = S.sesiones.filter(x=>x.id===s.id || igual(x));
  return L.sort((a, b)=>a.fecha!==b.fecha ? (a.fecha < b.fecha ? 1 : -1) : (b.creado || 0) - (a.creado || 0));
}
/* Diferencia legible: «11 s/km», «1:53», «2,5 kg», «1 ronda» */
function difTexto(k, d){
  const a = Math.abs(d);
  if(k==='ritmo') return a < 60 ? Math.round(a) + ' s/km' : PSF.verTiempo(Math.round(a)) + '/km';
  if(k==='tiempo') return a < 60 ? Math.round(a) + ' s' : PSF.verTiempo(Math.round(a));
  if(k==='kg') return coma(Math.round(a * 10) / 10) + ' kg';
  if(k==='dist') return verDist(Math.round(a));
  if(k==='rondas') return (Math.round(a * 100) / 100).toLocaleString('es-CL') + (a===1 ? ' ronda' : ' rondas');
  return (Math.round(a * 10) / 10).toLocaleString('es-CL');
}
/* Comparación de s con la vez anterior y con todas: {k, prev, dif, mejor, record, txt (corto, para las fotos), frase (larga), prom, serie} */
function comparacionSesion(s){
  const V = valorComparable(s); if(!V) return null;
  const L = sesionesParecidas(s), i = L.findIndex(x=>x.id===s.id), antes = L.slice(i + 1).map(x=>({s:x, V:valorComparable(x)})).filter(x=>x.V && x.V.k===V.k);
  const serie = L.slice(i).map(x=>({s:x, V:valorComparable(x)})).filter(x=>x.V && x.V.k===V.k).slice(0, 8).reverse();
  const C = {k:V.k, V, serie, n:antes.length, prev:antes[0] || null};
  if(!antes.length){ C.frase = 'Primera vez que lo registras: la próxima verás aquí cuánto mejoras.'; return C; }
  const mejor = (a, b)=>V.menor ? a < b : a > b, P = antes[0].V, d = V.v - P.v, prom = antes.reduce((a, x)=>a + x.V.v, 0) / antes.length;
  C.dif = d; C.mejor = Math.abs(d) < 0.5 ? null : mejor(V.v, P.v); C.record = antes.every(x=>mejor(V.v, x.V.v)); C.prom = prom;
  const cuando = verFecha(antes[0].s.fecha), dp = V.v - prom, mejorProm = mejor(V.v, prom);
  if(C.mejor===null) C.txt = '= igual que la vez anterior';
  else C.txt = (C.mejor ? '▲ ' : '▼ ') + difTexto(V.k, d) + (C.mejor ? (V.menor ? ' más rápido' : ' más') : (V.menor ? ' más lento' : ' menos')) + ' que la anterior';
  if(V.k==='ritmo' && C.mejor!==null) C.txt = (C.mejor ? '▲ ' : '▼ ') + difTexto('ritmo', d) + (C.mejor ? ' más rápido' : ' más lento') + ' que la anterior';
  C.titulo = C.record ? (V.k==='ritmo' ? 'Tu mejor ritmo en esta carrera' : 'Tu mejor marca en este entrenamiento') : C.mejor ? 'Mejoraste respecto de la vez anterior' : C.mejor===null ? 'Igual que la vez anterior' : 'Esta vez costó un poco más';
  C.frase = (C.mejor===null ? 'Mismo resultado que el ' + cuando : difTexto(V.k, d) + (C.mejor ? (V.menor ? ' más rápido' : ' más') : (V.menor ? ' más lento' : ' menos')) + ' que el ' + cuando)
    + (antes.length > 1 && Math.abs(dp) >= 0.5 ? ' · ' + difTexto(V.k, dp) + (mejorProm ? ' mejor' : ' peor') + ' que tu promedio' : '');
  return C;
}
/* Tramo principal (el más largo de trabajo) con su ritmo real, para comparar sesiones por tramos */
function tramoPrincipal(s){
  const U = s && s.w && s.w.uno; if(!U || !U.tramos) return null;
  const xs = expandirTramos(U.tramos).filter(t=>t.k==='pri' || t.k==='trab');
  let mejor = null; xs.forEach(t=>{ const tt = PSF.leerTiempo((t.real || {}).t), m = num((t.real || {}).d)!=null ? metros(t.real.d, t.u==='km' || t.u==='mi' ? t.u : 'm') : metrosTramo(t);
    if(tt && m && (!mejor || m > mejor.m)) mejor = {m, r:tt / (m / 1000), n:cantTramo(t)}; });
  return mejor;
}
/* La pestaña «Historial» del detalle: frase verde/roja, barras de cada vez, cuadros con la diferencia y la lista */
function htmlHistorialComparado(s, best){
  const L = sesionesParecidas(s), C = comparacionSesion(s), V = C && C.V;
  let h = '';
  if(C && C.n){ const cl = C.mejor===false ? 'cmp-peor' : C.mejor===null ? 'cmp-igual' : 'cmp-mejor';
    h += `<div class="cmp-ban ${cl}"><b>${C.mejor===false ? '▼' : C.mejor===null ? '=' : '▲'} ${esc(C.titulo)}</b><span>${esc(C.frase)}</span></div>`; }
  else if(C) h += `<div class="cmp-ban cmp-igual"><b>Primera vez</b><span>${esc(C.frase)}</span></div>`;
  if(C && C.serie.length > 1){
    const vs = C.serie.map(x=>x.V.v), mx = Math.max(...vs), mn = Math.min(...vs), rango = mx - mn || 1;
    const alto = v=>Math.round(22 + 78 * (V.menor ? (mx - v) / rango : (v - mn) / rango));
    h += `<div class="cmp-tit suave chico">${V.k==='ritmo' ? 'Ritmo por km' : V.k==='tiempo' ? 'Tiempo' : 'Resultado'} de cada vez${V.menor ? ' (más alta = más rápido)' : ''}</div>
      <div class="cmp-barras">${C.serie.map(x=>`<button class="cmp-b ${x.s.id===s.id ? 'hoy' : ''}" data-hid="${x.s.id}"><small class="num">${esc(x.V.k==='ritmo' ? PSF.verTiempo(Math.round(x.V.v)) : x.V.txt)}</small><i style="height:${alto(x.V.v)}px"></i><span>${x.s.id===s.id ? 'Esta' : esc(verFecha(x.s.fecha).replace(/^\S+\s/, ''))}</span></button>`).join('')}</div>`; }
  if(C && C.prev){ const p = C.prev.s, m1 = metricas(s), m0 = metricas(p);
    const cuadro = (et, val, d, menor, fmt)=>{ const dd = d==null || Math.abs(d) < 0.05 ? '<em class="suave">igual</em>' : `<em class="${(menor ? d < 0 : d > 0) ? 'cmp-sube' : 'cmp-baja'}">${d > 0 ? '+' : '−'}${esc(fmt(Math.abs(d)))}</em>`; return `<div><span class="etiqueta">${et}</span><b class="num">${esc(val)}</b>${dd}</div>`; };
    const c3 = [];
    if(m1.km || m0.km) c3.push(cuadro('Distancia', verKm(m1.km || 0), (m1.km || 0) - (m0.km || 0), false, v=>coma(Math.round(v * 10) / 10) + ' km'));
    const t1 = V.k==='ritmo' ? V.t : m1.min * 60, t0 = V.k==='ritmo' ? C.prev.V.t : m0.min * 60;
    if(t1) c3.push(cuadro('Tiempo', PSF.verTiempo(Math.round(t1)), t0 ? t1 - t0 : null, true, v=>PSF.verTiempo(Math.round(v))));
    if(s.rpe) c3.push(cuadro('Esfuerzo', s.rpe + '/10', p.rpe ? s.rpe - p.rpe : null, true, v=>String(v)));
    if(c3.length) h += `<div class="stats3 cmp-cuadros">${c3.slice(0, 3).join('')}</div><p class="suave chico" style="margin-top:4px">Contra el ${esc(verFecha(p.fecha))}</p>`;
    const t1p = tramoPrincipal(s), t0p = tramoPrincipal(p);
    if(t1p && t0p){ const d = t1p.r - t0p.r; h += `<div class="cmp-tramo"><span>Tramo principal ${esc(t1p.n)}</span><span class="num"><b>${esc(verRitmo(t1p.r))}</b> ${Math.abs(d) < 1 ? '<em class="suave">igual</em>' : `<em class="${d < 0 ? 'cmp-sube' : 'cmp-baja'}">${d < 0 ? '▲' : '▼'} ${Math.round(Math.abs(d))} s</em>`}</span></div>`; } }
  h += `<ul class="lista">${L.map(x=>`<li class="item" data-hid="${x.id}"><div class="entre"><span class="num">${verFecha(x.fecha)}${x.id===s.id ? ' · <span class="etiqueta">esta</span>' : ''}</span>
      <span class="num ${best && best.ref===x.id ? 'pr' : ''}">${best && best.ref===x.id ? '🏆 ' : ''}${esc(x.txt || '—')}${x.rx ? ' · Rx' : ''} <span class="suave">›</span></span></div></li>`).join('')}</ul>`;
  if(L.length < 2) h += '<p class="suave chico">Cuando repitas este entrenamiento verás aquí tu evolución.</p>';
  return h;
}

/* ---------- Plantillas «Logro» para compartir (13-nov-2026, maqueta aprobada: «que se entienda el ejercicio, que destaque la foto y que dé ganas
   de usar la app») ---------- La foto va arriba, limpia; abajo una franja con el tipo, el dato grande, cuánto mejoró, una fila de datos, el
   entrenamiento en dibujo (tramos en colores, barras de los intervalos o la lista de ejercicios), la canción chica y «Entrena conmigo en NSCE».
   Variantes: 'logro' (franja oscura), 'logro_claro' (blanca), 'logro_color' (del color principal) y 'antes' (Antes y ahora: contra la vez anterior). */
const TEMA_LOGRO = {
  logro:{fondo:'#14161b', tx:'#ffffff', sub:'#9aa0aa', linea:'rgba(255,255,255,0.14)', grande:null, chipTx:'#111'},
  logro_claro:{fondo:'#ffffff', tx:'#111111', sub:'#6b6f76', linea:'rgba(0,0,0,0.12)', grande:'#111111', chipTx:'#111'},
  logro_color:{fondo:null, tx:'#111111', sub:'rgba(17,17,17,0.68)', linea:'rgba(0,0,0,0.18)', grande:'#111111', chipTx:'#fff'},
  antes:{fondo:'#14161b', tx:'#ffffff', sub:'#9aa0aa', linea:'rgba(255,255,255,0.14)', grande:null, chipTx:'#111'},
};
/* Lo que se hizo, en dibujo; devuelve el alto usado (con medir=true solo calcula) */
function contenidoLogro(x, s, D, X, Y, Wd, T, medir){
  const U = s.w && s.w.uno;
  if(U && U.tramos && U.tramos.length){
    const xs = expandirTramos(U.tramos), largo = t=>metrosTramo(t) || (segTramo(t) || 300) / 300 * 1000, tot = xs.reduce((a, t)=>a + largo(t), 0) || 1;
    if(medir) return 96;
    let xx = X; xs.forEach(t=>{ const w = Math.max(6, (Wd - (xs.length - 1) * 5) * largo(t) / tot); x.fillStyle = t.k==='cal' || t.k==='calma' || t.k==='rec' ? '#5fc9b5' : (T.grande && T.fondo!=='#ffffff' ? '#111' : T.grande ? '#2a7de1' : colorApp()); redondo(x, xx, Y, w, 22, 6); x.fill(); xx += w + 5; });
    const grupos = U.tramos.map(t=>t.bloque ? (t.veces || 1) + '× ' + (t.tramos || []).map(z=>cantTramo(z) + (ZONAS_INT[z.int] ? ' ' + z.int : '')).join(' + ')
      : cantTramo(t) + ' ' + (t.k==='cal' || t.k==='calma' ? 'suave' : t.int==='ritmo' && t.ritmo ? 'a ' + t.ritmo : ZONAS_INT[t.int] ? t.int : '').trim());
    fnt(x, 600, 28); x.fillStyle = T.sub; x.textBaseline = 'alphabetic';
    x.fillText(recortar(x, grupos.join('  ·  '), Wd), X, Y + 70); return 96; }
  if(D.barras && D.barras.length > 1){
    if(medir) return 130;
    const n = D.barras.length, gap = 8, bw = Math.min(70, (Wd - gap * (n - 1)) / n), mx = Math.max(...D.barras), mn = Math.min(...D.barras);
    D.barras.forEach((v, i)=>{ const r = D.barrasInv ? (mx - v) / ((mx - mn) || 1) : (v - mn) / ((mx - mn) || 1), h = 30 + r * 80;
      x.fillStyle = r > 0.99 ? (T.grande || colorApp()) : T.linea.replace(/0\.1\d/, '0.35'); redondo(x, X + i * (bw + gap), Y + 110 - h, bw, h, 6); x.fill(); });
    return 130; }
  const filas = [].concat(...(D.bloques || []).map(b=>b.filas)).filter(f=>!f.desc).slice(0, 4), mas = [].concat(...(D.bloques || []).map(b=>b.filas)).length - filas.length;
  if(!filas.length) return 0;
  const h = filas.length * 50 + (mas > 0 ? 40 : 0); if(medir) return h;
  x.textBaseline = 'middle';
  filas.forEach((f, i)=>{ const y = Y + i * 50 + 20; x.fillStyle = f.color || COLOR_G[f.g] || colorApp(); redondo(x, X, y - 12, 8, 24, 4); x.fill();
    let xx = X + 26; if(f.cant){ fnt(x, 800, 32); x.fillStyle = T.tx; x.fillText(f.cant, xx, y); xx += x.measureText(f.cant).width + 16; }
    let wkg = 0; if(f.kg){ fnt(x, 700, 28); wkg = x.measureText(f.kg).width; x.fillStyle = T.sub; x.textAlign = 'right'; x.fillText(f.kg, X + Wd, y); x.textAlign = 'left'; wkg += 20; }
    fnt(x, 600, 30); x.fillStyle = T.tx; x.fillText(recortar(x, f.nom, X + Wd - wkg - xx), xx, y); });
  if(mas > 0){ fnt(x, 600, 26); x.fillStyle = T.sub; x.fillText('+ ' + mas + ' más', X + 26, Y + filas.length * 50 + 18); }
  x.textBaseline = 'alphabetic'; return h;
}
async function lienzoLogro(x, s, D, o, img, W, H){
  const P = o.plantilla, T = Object.assign({}, TEMA_LOGRO[P] || TEMA_LOGRO.logro), M = 60, C = comparacionSesion(s), acento = colorApp();
  if(P==='logro_color') T.fondo = acento;
  const gr = T.grande || acento, antes = P==='antes';
  // alto de la franja según lo que lleva
  const U = s.w && s.w.uno, tipo = (U && U.tramos && U.tramos.length ? D.tipo + ' POR TRAMOS' : D.tipo).replace(/\s+/g, ' ');
  const conTitulo = D.titulo && !tipo.includes(D.titulo.toUpperCase()), hCont = antes ? 0 : contenidoLogro(x, s, D, 0, 0, W - M * 2, T, true);
  const hAntes = antes ? (C && C.prev ? 260 : 150) + (C && C.serie && C.serie.length > 2 ? 170 : 0) : 0;
  const hPanel = 44 + 40 + (conTitulo ? 62 : 0) + (antes ? hAntes : 150 + (C && C.txt ? 50 : 0) + (D.stats.length ? 108 : 0) + (hCont ? hCont + 26 : 0)) + 130;
  const yP = Math.max(Math.round(H * 0.28), H - hPanel);
  // la foto arriba, sin nada encima salvo la marca y el sello
  if(img) cubrir(x, img, 0, 0, W, yP + 2); else fondoSinFoto(x, 0, 0, W, yP + 2, D.color);
  sombra(x, W, 0, 170, 0.35, true);
  x.fillStyle = '#111'; redondo(x, M, 52, 168, 64, 12); x.fill();
  fnt(x, 900, 34); x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.fillText('NSCE', M + 22, 86); x.fillStyle = acento; x.fillRect(M + 22, 100, 96, 5);
  const sello = C && C.record ? 'Récord personal' : D.record ? 'Nuevo récord' : C && C.mejor ? 'Mejoraste' : '';
  if(sello){ fnt(x, 800, 30); const ws = x.measureText(sello).width + 92, tb = await icoImagen('trophy', '#3d2a00');
    x.fillStyle = '#f2b632'; redondo(x, W - M - ws, 54, ws, 60, 30); x.fill(); if(tb) x.drawImage(tb, W - M - ws + 20, 66, 36, 36);
    x.fillStyle = '#3d2a00'; x.fillText(sello, W - M - ws + 66, 85); }
  x.textBaseline = 'alphabetic';
  // la franja
  x.fillStyle = T.fondo; x.fillRect(0, yP, W, H - yP);
  let y = yP + 44 + 30;
  fnt(x, 700, 28); x.fillStyle = T.sub; x.fillText(recortar(x, tipo + (D.rx && D.wod ? ' · RX' : ''), W - M * 2), M, y);
  if(conTitulo){ y += 62; x.fillStyle = T.tx; ajustar(x, D.titulo, W - M * 2, 52, 800, false, 32); x.fillText(D.titulo, M, y); }
  if(antes){ y += 20;
    if(C && C.prev){ const col = (W - M * 2 - 40) / 2, vAnt = C.prev.V.k==='ritmo' ? verRitmo(C.prev.V.v) : C.prev.V.txt, vHoy = C.V.k==='ritmo' ? verRitmo(C.V.v) : C.V.txt;
      fnt(x, 700, 28); x.fillStyle = T.sub; x.fillText(verFecha(C.prev.s.fecha).toUpperCase(), M, y + 40); x.fillText('HOY', M + col + 40, y + 40);
      x.fillStyle = T.sub; ajustar(x, vAnt, col, 84, 900, false, 40); x.fillText(vAnt, M, y + 130);
      x.fillStyle = gr; ajustar(x, vHoy, col, 84, 900, false, 40); x.fillText(vHoy, M + col + 40, y + 130);
      fnt(x, 800, 34); x.fillStyle = C.mejor===false ? '#ef6f5e' : C.mejor===null ? T.tx : (P==='antes' ? '#7ee08a' : T.tx); x.fillText(recortar(x, C.txt, W - M * 2), M, y + 200); y += 260; }
    else { x.fillStyle = gr; datoGrande(x, D, M - 4, y + 110, 120, gr, 'izq', false, W - M * 2); fnt(x, 600, 30); x.fillStyle = T.sub; x.fillText('Primera vez: la próxima, a superarla', M, y + 150); y += 150; }
    if(C && C.serie && C.serie.length > 2){ const vs = C.serie.map(z=>z.V.v), mx = Math.max(...vs), mn = Math.min(...vs), n = vs.length, bw = Math.min(90, (W - M * 2 - 10 * (n - 1)) / n);
      C.serie.forEach((z, i)=>{ const r = C.V.menor ? (mx - z.V.v) / ((mx - mn) || 1) : (z.V.v - mn) / ((mx - mn) || 1), h = 24 + r * 96;
        x.fillStyle = z.s.id===s.id ? gr : T.linea.replace(/0\.1\d/, '0.3'); redondo(x, M + i * (bw + 10), y + 130 - h, bw, h, 8); x.fill(); });
      y += 150; } }
  else {
    y += 26; const g = datoGrande(x, D, M - 4, y + 112, 132, gr, 'izq', false, W - M * 2); y += 132;
    if(C && C.txt){ fnt(x, 800, 32); x.fillStyle = C.mejor===false ? '#ef6f5e' : P==='logro' ? '#7ee08a' : T.tx; x.fillText(recortar(x, C.txt, W - M * 2), M, y + 40); y += 50; }
    if(D.stats.length){ y += 18; const col = (W - M * 2) / D.stats.length;
      D.stats.forEach(([k, v], i)=>{ const cx = M + col * i; fnt(x, 700, 24); x.fillStyle = T.sub; x.fillText(String(k).toUpperCase(), cx, y + 28);
        x.fillStyle = T.tx; ajustar(x, String(v), col - 16, 46, 800, false, 26); x.fillText(String(v), cx, y + 80); });
      y += 108; }
    if(hCont){ y += 26; contenidoLogro(x, s, D, M, y, W - M * 2, T); y += hCont; } }
  // pie: canción chica e invitación
  const yPie = H - 52; x.fillStyle = T.linea; x.fillRect(M, yPie - 58, W - M * 2, 2);
  fnt(x, 700, 28); x.fillStyle = T.tx; x.textAlign = 'right'; x.fillText('Entrena conmigo en NSCE', W - M, yPie - 8); x.textAlign = 'left';
  fnt(x, 600, 26); x.fillStyle = T.sub;
  const izq = D.musica ? '♫ ' + D.musica : D.fecha; x.fillText(recortar(x, izq, W - M * 2 - 400), M, yPie - 8);
}

/* ---------- Etapa 3 de la revisión (23-nov-2026): ver el progreso ----------
   mejorasPersonales(desde): los entrenamientos repetidos (mismo título o mismo ejercicio) y cuánto mejoraste de la primera vez a tu mejor marca.
   En carreras de la misma distancia se muestra el TIEMPO («Tu 8 km: 43:00 → 39:40»); si no, el ritmo. Con `desde`, solo las mejores marcas hechas desde esa fecha. */
function mejorasPersonales(desde){
  const G = {};
  S.sesiones.forEach(s=>{ const V = valorComparable(s); if(!V || V.k==='num') return; const U = s.w && s.w.uno;
    const k = (s.titulo || '').trim().toLowerCase() || (U ? 'mov:' + U.mov + ':' + U.c : ''); if(!k) return;
    (G[k + '|' + V.k] = G[k + '|' + V.k] || []).push({s, V}); });
  const out = [];
  Object.values(G).forEach(L=>{ if(L.length < 2) return;
    L.sort((a, b)=>a.s.fecha < b.s.fecha ? -1 : a.s.fecha > b.s.fecha ? 1 : (a.s.creado || 0) - (b.s.creado || 0));
    const pri = L[0], menor = pri.V.menor, mejor = (a, b)=>menor ? a.V.v < b.V.v : a.V.v > b.V.v;
    const top = L.reduce((x, y)=>mejor(y, x) ? y : x, pri); if(top===pri || (desde && top.s.fecha < desde)) return;
    const pct = Math.abs(top.V.v - pri.V.v) / (pri.V.v || 1) * 100; if(pct < 0.5) return;
    // carreras de la misma distancia: el tiempo dice más que el ritmo
    const mismaD = pri.V.k==='ritmo' && pri.V.m && top.V.m && Math.abs(top.V.m - pri.V.m) / pri.V.m < 0.03;
    const txt = x=>mismaD ? PSF.verTiempo(Math.round(x.V.t)) : x.V.txt, nombre = tituloDe(top.s) + (mismaD && !/\d/.test(tituloDe(top.s)) ? ' ' + verDist(top.V.m) : '');
    out.push({nombre, antes:txt(pri), ahora:txt(top), fAntes:pri.s.fecha, fAhora:top.s.fecha, pct, n:L.length, k:pri.V.k, menor, s:top.s,
      dif:mismaD ? difTexto('tiempo', top.V.t - pri.V.t) + (top.V.t < pri.V.t ? ' menos' : ' más') : difTexto(pri.V.k, top.V.v - pri.V.v) + (menor ? (pri.V.k==='ritmo' ? ' más rápido' : ' menos') : ' más')}); });
  return out.sort((a, b)=>b.pct - a.pct);
}
function htmlTusMejoras(){
  const M = mejorasPersonales();
  if(!M.length) return S.sesiones.length ? `<div class="tarjeta tm-card"><div class="etiqueta">🏆 Tus mejoras</div>
    <p class="chico">👉 <b>Ahora:</b> repite un entrenamiento que ya hiciste (un WOD con nombre, tu carrera de siempre o un levantamiento). La segunda vez verás aquí cuánto mejoraste.</p></div>` : '';
  const P = M[0];
  return `<div class="tarjeta tm-card"><div class="entre"><span class="etiqueta">🏆 Tus mejoras</span><span class="suave chico">${M.length} ${M.length===1 ? 'entrenamiento' : 'entrenamientos'}</span></div>
    <button class="tm-top" data-tm="0"><span class="tm-nom">Tu ${esc(P.nombre)}</span>
      <span class="tm-aa num"><s>${esc(P.antes)}</s><i>→</i><b>${esc(P.ahora)}</b></span>
      <span class="tm-dif">▲ ${esc(P.dif)} · ${fmtNum(Math.round(P.pct))} % mejor desde el ${verFecha(P.fAntes)}</span></button>
    ${M.length > 1 ? `<ul class="tm-lista">${M.slice(1, 5).map((x, i)=>`<li data-tm="${i + 1}"><span>${esc(x.nombre)}</span><span class="num"><s>${esc(x.antes)}</s> → <b>${esc(x.ahora)}</b></span></li>`).join('')}</ul>` : ''}
    <button class="link chico" id="tmComp">↗ Compartir mi mejora</button></div>`;
}
function enlazarTusMejoras(){
  const M = mejorasPersonales();
  $$('[data-tm]').forEach(b=>b.onclick = ()=>verSesion(M[+b.dataset.tm].s, 'hist'));
  if($('#tmComp')) $('#tmComp').onclick = ()=>compartirSesion(M[0].s);
}
