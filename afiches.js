/* #NSCE — Afiches del mes (24-oct-2026, maquetas aprobadas por el usuario): para la unidad o el box (Mi unidad → «📣 Afiches del mes»):
   «Récords del mes», «Club de los comprometidos» (12 días o más) y «Combatiente del mes»; y el personal «Tu mes» (Compartir → «Tu mes»).
   Se arman con los partes de los alumnos (desde la v1.21 el parte trae `rec` = récords de 90 días, `desafios` = lunes de las semanas con el
   desafío cumplido y `rangos` = ascensos) o con tus propios datos. Lienzo 1080 × 1350 (publicación) o 1080 × 1920 (historia), estilo deportivo. */
const AF_FUENTE = '-apple-system, "SF Pro Display", "Helvetica Neue", Arial, sans-serif';
const AF = {fondo:'#0e1014', panel:'#171a20', panel2:'#20242c', borde:'#2a2f38', texto:'#f4f5f7', suave:'#9aa0aa', claro:'#c9ccd2', oscuro:'#111111'};
Object.defineProperty(AF, 'lima', {get:()=>colorApp()});   // el color principal elegido (lima por omisión)
const MESES_AF = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const nombreMes = m=>{ const [y, n] = m.split('-').map(Number); return MESES_AF[n - 1] + ' ' + y; };
function mesDesplazado(k){ const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + k); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
const mesPorDefecto = ()=>new Date().getDate() <= 5 ? mesDesplazado(-1) : mesDesplazado(0);   // a comienzo de mes, el que terminó
/* Récords superados entre dos fechas, con su mejora (para el parte y para «Tu mes») */
function recordsEntre(ini, fin){
  const out = [];
  todosEj().forEach(e=>{ if(e.u==='kgc') return; let best = null;
    valoresDe(e.id).forEach(v=>{ const mejor = best==null || (menorEsMejor(e.u) ? v.valor < best : v.valor > best);
      if(mejor && best!=null && v.fecha >= ini && v.fecha <= fin){ const d = v.valor - best;
        out.push({f:v.fecha, n:e.nombre, u:e.u, v:v.valor, txt:fmt(e, v.valor, v.txt), dTxt:e.u==='tiempo' ? '−' + PSF.verTiempo(Math.abs(d)) : e.u==='kg' ? '+' + fmtNum(d) + ' kg' : e.u==='m' ? '+' + fmtNum(d) + ' m' : e.u==='reps' ? '+' + fmtNum(Math.round(d)) + ' rep.' : '+' + fmtNum(Math.round(d * 10) / 10), rel:Math.abs(d) / (Math.abs(best) || 1)}); }
      if(mejor) best = v.valor; }); });
  return out.sort((a, b)=>a.f < b.f ? 1 : -1);
}
/* Lunes de las semanas con el desafío cumplido (últimas 13) */
function desafiosCumplidosLista(){ const out = []; const d = new Date(inicioSemana());
  for(let k = 0; k < 13; k++){ if(desafioSemana(new Date(d)).cumplido) out.push(iso(d)); d.setDate(d.getDate() - 7); } return out; }

/* ---------- Dibujo ---------- */
function afRect(x, c, X, Y, W, H, r, col){ x.fillStyle = col; x.beginPath(); if(x.roundRect) x.roundRect(X, Y, W, H, r); else x.rect(X, Y, W, H); x.fill(); }
function afTexto(x, t, X, Y, tam, peso, col, alin, espacio){ x.font = `${peso} ${tam}px ${AF_FUENTE}`; x.fillStyle = col; x.textAlign = alin || 'left'; x.textBaseline = 'alphabetic';
  try{ x.letterSpacing = (espacio || 0) + 'px'; }catch(e){} x.fillText(t, X, Y); try{ x.letterSpacing = '0px'; }catch(e){} return x.measureText(t).width; }
function afRecortar(x, t, max){ if(x.measureText(t).width <= max) return t; while(t.length > 1 && x.measureText(t + '…').width > max) t = t.slice(0, -1); return t + '…'; }
/* o = {H, mes, unidad, t1, t2, grande, grandeTxt[2], datos:[[k, v, sub]], lista:[[nom, val, u]], barras:[{v, on}], foto:{img, nombre, sub}, chips:[[ico, txt, dest]], pie, medalla, avatar} */
async function lienzoAfiche(o){
  const W = 1080, H = o.H || 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = AF.fondo; x.fillRect(0, 0, W, H);
  x.strokeStyle = hexA(colorApp(), 0.035); x.lineWidth = 4; for(let i = -H; i < W; i += 44){ x.beginPath(); x.moveTo(i, H); x.lineTo(i + H, 0); x.stroke(); }
  const M = 68; let y = (H - 1350) / 2 + 76;
  afTexto(x, o.mes.toUpperCase(), M, y + 20, 30, 700, AF.suave, 'left', 6); y += 52;
  if(o.unidad){ x.font = `800 30px ${AF_FUENTE}`; afTexto(x, afRecortar(x, o.unidad.toUpperCase(), W - 2 * M - (o.medalla || o.avatar ? 170 : 0)), M, y + 12, 30, 800, AF.lima, 'left', 1); }
  y += 50;
  if(o.medalla){ x.fillStyle = hexA(colorApp(), 0.18); x.beginPath(); x.arc(W - 128, (H - 1350) / 2 + 134, 86, 0, 7); x.fill(); x.fillStyle = AF.lima; x.beginPath(); x.arc(W - 128, (H - 1350) / 2 + 134, 74, 0, 7); x.fill();
    afTexto(x, '1', W - 128, (H - 1350) / 2 + 146, 56, 900, AF.oscuro, 'center'); afTexto(x, 'DEL MES', W - 128, (H - 1350) / 2 + 178, 18, 800, AF.oscuro, 'center', 2); }
  if(o.avatar){ const R = 74, cx = W - 128, cy = (H - 1350) / 2 + 134; x.save(); x.beginPath(); x.arc(cx, cy, R, 0, 7); x.clip(); const im = o.avatar, s = Math.max(2 * R / im.width, 2 * R / im.height);
    x.drawImage(im, cx - im.width * s / 2, cy - im.height * s / 2, im.width * s, im.height * s); x.restore(); x.strokeStyle = AF.lima; x.lineWidth = 6; x.beginPath(); x.arc(cx, cy, R + 3, 0, 7); x.stroke(); }
  y += 92; afTexto(x, o.t1.toUpperCase(), M, y, 112, 900, AF.texto, 'left', -3);
  x.font = `900 112px ${AF_FUENTE}`; try{ x.letterSpacing = '-3px'; }catch(e){} const w2 = x.measureText(o.t2.toUpperCase()).width; try{ x.letterSpacing = '0px'; }catch(e){}
  afRect(x, c, M, y + 16, w2 + 40, 116, 0, AF.lima); afTexto(x, o.t2.toUpperCase(), M + 20, y + 112, 112, 900, AF.oscuro, 'left', -3); y += 150;
  if(o.foto){ const fy = y + 20, fh = o.lista ? 380 : 450; const g = x.createLinearGradient(0, fy, 0, fy + fh); g.addColorStop(0, '#2b3324'); g.addColorStop(1, '#14171c');
    x.save(); x.beginPath(); if(x.roundRect) x.roundRect(M, fy, W - 2 * M, fh, 36); else x.rect(M, fy, W - 2 * M, fh); x.clip(); x.fillStyle = g; x.fillRect(M, fy, W - 2 * M, fh);
    if(o.foto.img){ const im = o.foto.img, s = Math.max((W - 2 * M) / im.width, fh / im.height); x.drawImage(im, W / 2 - im.width * s / 2, fy + fh / 2 - im.height * s / 2, im.width * s, im.height * s); }
    else { x.fillStyle = 'rgba(201,204,210,0.55)'; x.beginPath(); x.arc(W / 2, fy + fh * 0.34, fh * 0.17, 0, 7); x.fill(); x.beginPath(); x.ellipse(W / 2, fy + fh * 1.02, fh * 0.36, fh * 0.42, 0, Math.PI, 0); x.fill(); }
    const sg = x.createLinearGradient(0, fy + fh - 180, 0, fy + fh); sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(0,0,0,0.78)'); x.fillStyle = sg; x.fillRect(M, fy + fh - 180, W - 2 * M, 180); x.restore();
    x.font = `900 68px ${AF_FUENTE}`; afTexto(x, afRecortar(x, o.foto.nombre.toUpperCase(), W - 2 * M - 60), M + 32, fy + fh - 66, 68, 900, AF.texto, 'left', -1);
    if(o.foto.sub) afTexto(x, o.foto.sub, M + 32, fy + fh - 26, 28, 800, AF.lima); y = fy + fh; }
  if(o.grande!=null){ y += 196; const w = afTexto(x, String(o.grande), M, y, 192, 900, AF.lima, 'left', -6);
    (o.grandeTxt || []).forEach((t, i)=>afTexto(x, t, M + w + 28, y - 52 + i * 42, 34, 600, AF.claro)); y += 30; }
  if(o.datos && o.datos.length){ y += 22; const n = o.datos.length, g = 20, bw = (W - 2 * M - g * (n - 1)) / n, bh = o.datos.some(d=>d[2]) ? 156 : 124;
    o.datos.forEach(([k, v, sub], i)=>{ const bx = M + i * (bw + g); afRect(x, c, bx, y, bw, bh, 28, AF.panel);
      afTexto(x, k.toUpperCase(), bx + 24, y + 42, 22, 700, AF.suave, 'left', 3); x.font = `900 48px ${AF_FUENTE}`; afTexto(x, afRecortar(x, v, bw - 40), bx + 24, y + 98, 48, 900, AF.texto);
      if(sub){ x.font = `500 24px ${AF_FUENTE}`; afTexto(x, afRecortar(x, sub, bw - 40), bx + 24, y + 134, 24, 500, AF.claro); } }); y += bh; }
  if(o.barras && o.barras.length){ y += 28; const n = o.barras.length, g = 10, bw = (W - 2 * M - g * (n - 1)) / n, hm = 140, mx = Math.max(...o.barras.map(b=>b.v), 1);
    o.barras.forEach((b, i)=>{ const h = Math.max(10, b.v / mx * hm); afRect(x, c, M + i * (bw + g), y + hm - h, bw, h, 8, b.on ? AF.lima : AF.panel2); }); y += hm; }
  if(o.lista && o.lista.length){ y += 30; o.lista.slice(0, 4).forEach(([nom, val, u], i)=>{ afRect(x, c, M, y, W - 2 * M, 80, 24, AF.panel);
      x.fillStyle = i ? AF.panel2 : AF.lima; x.beginPath(); x.arc(M + 50, y + 40, 26, 0, 7); x.fill(); afTexto(x, String(i + 1), M + 50, y + 50, 26, 800, i ? AF.suave : AF.oscuro, 'center');
      x.font = `500 22px ${AF_FUENTE}`; const wu = u ? x.measureText(String(u).toUpperCase()).width + 12 : 0;
      if(u) afTexto(x, String(u).toUpperCase(), W - M - 24, y + 52, 22, 700, AF.suave, 'right');
      afTexto(x, String(val), W - M - 24 - wu, y + 54, 38, 900, AF.lima, 'right');
      x.font = `700 34px ${AF_FUENTE}`; afTexto(x, afRecortar(x, nom, W - 2 * M - 300), M + 100, y + 52, 34, 700, AF.texto); y += 96; }); y -= 16; }
  if(o.chips && o.chips.length){ y += 30; let cx = M;
    for(const [ic, txt, dest] of o.chips){ x.font = `700 26px ${AF_FUENTE}`; const w = x.measureText(txt + (dest ? ' ' + dest : '')).width + 40 + (ic ? 40 : 0);
      if(cx + w > W - M){ cx = M; y += 78; }
      x.strokeStyle = AF.borde; x.lineWidth = 2; x.beginPath(); if(x.roundRect) x.roundRect(cx, y, w, 64, 32); else x.rect(cx, y, w, 64); x.stroke();
      let tx = cx + 20; if(ic){ const im = await icoImagen(ic, AF.lima); if(im) x.drawImage(im, tx, y + 16, 32, 32); tx += 40; }
      const wt = afTexto(x, txt, tx, y + 42, 26, 700, '#e8eaee'); if(dest) afTexto(x, dest, tx + wt + 8, y + 42, 26, 800, AF.lima);
      cx += w + 12; }
    y += 64; }
  const py = (H - 1350) / 2 + 1350 - 56;
  if(o.pie){ x.font = `500 26px ${AF_FUENTE}`; afTexto(x, afRecortar(x, o.pie, W - 2 * M - 300), M, py, 26, 500, AF.suave); }
  afTexto(x, '#NSCE', W - M, py, 32, 900, AF.texto, 'right', 1);
  return new Promise(ok=>c.toBlob(ok, 'image/jpeg', 0.93));
}

/* ---------- Datos de la unidad ---------- */
function datosUnidadMes(partes, m, modoNom){
  const nom = P=>modoNom==='nombre' ? (P.alumno.nombre || '').split(' ')[0] : nomAl(P);
  const A = partes.map(P=>{ const dias = new Set((P.ses || []).filter(s=>s.f && s.f.startsWith(m) && !s.d).map(s=>s.f)).size, recs = (P.rec || []).filter(r=>r.f.startsWith(m));
    const des = (P.desafios || []).filter(f=>f.startsWith(m)).length, sube = (P.rangos || []).filter(r=>r.f.startsWith(m)).length;
    const km = (P.ses || []).filter(s=>s.f && s.f.startsWith(m)).reduce((a, s)=>a + (s.km || 0), 0), c24 = ((P.pruebas || {}).psf2400 || []).filter(v=>v.f.startsWith(m)).map(v=>v.v);
    return {P, nom:nom(P), dias, recs, des, sube, km, c24:c24.length ? Math.min(...c24) : null, rango:(P.resumen || {}).rango || '', puntaje:dias * 3 + recs.length * 5 + des * 8 + sube * 15,
      sec:[P.alumno.seccion, P.alumno.escuadra].filter(Boolean).join(' · ')}; });
  const recs = A.flatMap(a=>a.recs.map(r=>Object.assign({quien:a.nom}, r)));
  const pesado = recs.filter(r=>r.u==='kg').sort((a, b)=>b.v - a.v)[0], mejora = recs.slice().sort((a, b)=>b.rel - a.rel)[0];
  return {A, recs, pesado, mejora, sinRec:partes.filter(P=>!P.rec).length};
}
async function afUnidad(tipo, D, u, m, H, elegido){
  const base = {H, mes:nombreMes(m), unidad:u.nombre};
  if(tipo==='rec'){ const conRec = D.A.filter(a=>a.recs.length).sort((a, b)=>b.recs.length - a.recs.length);
    return lienzoAfiche(Object.assign(base, {t1:'Récords', t2:'del mes', grande:D.recs.length, grandeTxt:['récords personales', 'superados por ' + conRec.length + ' alumno' + (conRec.length===1 ? '' : 's')],
      datos:[D.pesado ? ['Más pesado', D.pesado.txt.replace(/^.*?:\s*/, ''), D.pesado.n.split(' (')[0] + ' · ' + D.pesado.quien] : ['Más pesado', '—', ''], D.mejora ? ['Mayor mejora', D.mejora.dTxt, D.mejora.n.split(' (')[0] + ' · ' + D.mejora.quien] : ['Mayor mejora', '—', '']],
      lista:conRec.map(a=>[a.nom, a.recs.length, a.recs.length===1 ? 'récord' : 'récords']), pie:'Cada marca anotada en la app'})); }
  if(tipo==='club'){ const club = D.A.filter(a=>a.dias >= 12).sort((a, b)=>b.dias - a.dias), todos = D.A.slice().sort((a, b)=>a.dias - b.dias).slice(-16);
    return lienzoAfiche(Object.assign(base, {t1:'Club de los', t2:'comprometidos', grande:club.length, grandeTxt:['alumno' + (club.length===1 ? '' : 's') + ' entrenaron', '12 días o más'],
      barras:todos.map(a=>({v:a.dias, on:a.dias >= 12})), lista:club.map(a=>[a.nom, a.dias, 'días']), pie:'La constancia gana'})); }
  const a = elegido || D.A.slice().sort((x, y)=>y.puntaje - x.puntaje)[0]; if(!a) return null;
  const chips = []; if(a.recs.length) chips.push(['trophy', 'Récords del mes', String(a.recs.length)]); if(a.des) chips.push(['target', 'Desafío semanal', a.des + ' semana' + (a.des===1 ? '' : 's')]);
  if(a.c24) chips.push(['person-simple-run', '2.400 m', PSF.verTiempo(a.c24)]); else if(a.km) chips.push(['person-simple-run', 'Kilómetros', fmtNum(Math.round(a.km))]);
  return lienzoAfiche(Object.assign(base, {t1:'Combatiente', t2:'del mes', medalla:true, foto:{img:null, nombre:a.nom, sub:a.sec},
    datos:[['Días', String(a.dias)], ['Récords', String(a.recs.length)], ['Rango', a.rango || '—', a.sube ? 'subió ' + a.sube : '']], chips, pie:'Elegido por constancia, récords y desafíos'}));
}
function dialogoAfiches(u, partes){
  let m = mesPorDefecto(), tipo = 'rec', modoNom = pref('afNombres') || 'grado', elegido = null;
  const pintarD = ()=>{ const D = datosUnidadMes(partes, m, modoNom), orden = D.A.slice().sort((a, b)=>b.puntaje - a.puntaje), sel = elegido!=null ? D.A[elegido] : orden[0];
    dialogo(`<div class="cab"><h2>📣 Afiches del mes</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
      <div class="entre af-mes"><button class="btn chico-btn" id="afAnt">‹</button><b>${nombreMes(m)}</b><button class="btn chico-btn" id="afSig" ${m >= mesDesplazado(0) ? 'disabled' : ''}>›</button></div>
      <div class="opciones af-ops">${[['rec', '🏆', 'Récords del mes', D.recs.length + ' récords de ' + D.A.filter(a=>a.recs.length).length + ' alumnos'], ['club', '🔥', 'Club de los comprometidos', D.A.filter(a=>a.dias >= 12).length + ' entrenaron 12 días o más'], ['comb', '🎖️', 'Combatiente del mes', sel ? sel.nom + ' · ' + sel.dias + ' días, ' + sel.recs.length + ' récords' : 'Sin datos']].map(([k, ic, t, d])=>`<button class="opcion ${tipo===k ? 'activa' : ''}" data-af="${k}"><b>${ic} ${t}</b><span>${esc(d)}</span></button>`).join('')}</div>
      ${tipo==='comb' && D.A.length ? `<label>Combatiente (la app propone el de más puntaje; puedes cambiarlo)</label><select id="afQuien">${orden.map(a=>`<option value="${D.A.indexOf(a)}" ${a===sel ? 'selected' : ''}>${esc(a.nom)} · ${a.dias} días · ${a.recs.length} récords</option>`).join('')}</select>` : ''}
      <label>Nombres</label><div class="segmentos" id="afNom"><button data-nm="grado" class="${modoNom==='grado' ? 'activa' : ''}">Grado y nombre</button><button data-nm="nombre" class="${modoNom==='nombre' ? 'activa' : ''}">Solo el nombre</button></div>
      ${D.sinRec ? `<p class="nota">${D.sinRec} alumno${D.sinRec===1 ? ' tiene' : 's tienen'} un parte antiguo: pídeles que actualicen la app y te manden uno nuevo para contar sus récords y desafíos.</p>` : ''}
      <div class="btns"><button class="btn prim ancho" id="afVer" ${D.A.length ? '' : 'disabled'}>Ver y compartir</button></div>`, d=>{
      $('#afAnt', d).onclick = ()=>{ const [y, n] = m.split('-').map(Number); const t = new Date(y, n - 2, 1); m = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0'); elegido = null; pintarD(); };
      $('#afSig', d).onclick = ()=>{ const [y, n] = m.split('-').map(Number); const t = new Date(y, n, 1); m = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0'); elegido = null; pintarD(); };
      $$('[data-af]', d).forEach(b=>b.onclick = ()=>{ tipo = b.dataset.af; pintarD(); });
      $$('[data-nm]', d).forEach(b=>b.onclick = ()=>{ modoNom = b.dataset.nm; pref('afNombres', modoNom); pintarD(); });
      if($('#afQuien', d)) $('#afQuien', d).onchange = e=>{ elegido = +e.target.value; };
      $('#afVer', d).onclick = ()=>{ const D2 = datosUnidadMes(partes, m, modoNom), el = elegido!=null ? D2.A[elegido] : null, t = {rec:'Récords del mes', club:'Club de los comprometidos', comb:'Combatiente del mes'}[tipo];
        mostrarCompartir({titulo:t, nombre:'nsce_' + tipo + '_' + m, formatos:['post', 'historia'], texto:t + ' · ' + nombreMes(m) + ' · ' + u.nombre + ' #NSCE',
          generar:f=>afUnidad(tipo, D2, u, m, FORMATOS[f][2], el)}); };
    }); };
  pintarD();
}

/* ---------- «Tu mes» (personal) ---------- */
async function afTuMes(m, H){
  const [y, n] = m.split('-').map(Number), fin = iso(new Date(y, n, 0)), ini = m + '-01', ss = S.sesiones.filter(s=>s.fecha >= ini && s.fecha <= fin);
  const dias = new Set(ss.filter(s=>s.tipo!=='descanso').map(s=>s.fecha)).size, T = acumular(ss), recs = recordsEntre(ini, fin).sort((a, b)=>b.rel - a.rel);
  const des = desafiosCumplidosLista().filter(f=>f.startsWith(m)).length, pt = puntos();
  let avatar = null; if(S.perfil.avatar){ const b = await fotoLeer(S.perfil.avatar).catch(()=>null); if(b) avatar = await new Promise(ok=>{ const i = new Image(); i.onload = ()=>ok(i); i.onerror = ()=>ok(null); i.src = URL.createObjectURL(b); }); }
  const chips = []; if(des) chips.push(['target', 'Desafío semanal', des + ' semana' + (des===1 ? '' : 's')]); chips.push(['medal-military', 'Rango', pt.rango]); if(racha()) chips.push(['fire', 'Racha', racha() + (racha()===1 ? ' día' : ' días')]);
  return lienzoAfiche({H, mes:nombreMes(m), unidad:(S.perfil.nombre || '').toUpperCase() || (S.unidad && S.unidad.unidad) || '', avatar, t1:'Tu mes', t2:MESES_AF[n - 1],
    grande:dias, grandeTxt:['días entrenados', ss.length + ' entrenamiento' + (ss.length===1 ? '' : 's')],
    datos:[['Kilómetros', fmtNum(Math.round(nKm(T.km) * 10) / 10)], ['Horas', fmtHoras(T.min)], ['Récords', String(recs.length)]],
    lista:recs.map(r=>[r.n.split(' (')[0], r.dTxt, '']), chips, pie:recs.length ? 'Tus mayores mejoras del mes' : 'Cada entrenamiento cuenta'});
}
function compartirTuMes(){
  const m = mesPorDefecto();
  mostrarCompartir({titulo:'Tu mes · ' + nombreMes(m), nombre:'nsce_mes_' + m, formatos:['post', 'historia'], texto:'Mi ' + nombreMes(m) + ' de entrenamiento #NSCE', generar:f=>afTuMes(m, FORMATOS[f][2])});
}
