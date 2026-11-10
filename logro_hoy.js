/* #NSCE — «¡Hecho!» (28-oct-2026): la tarjeta del entrenamiento completado hoy como un momento de logro.
   Arriba el sello y cuántos logros sacaste; luego LO QUE HICISTE (cifras grandes, barras de los intervalos y el WOD) y LOGROS DE HOY
   (récords, insignias nuevas, mejora frente a la última vez que hiciste el mismo entrenamiento, hitos acumulados y la insignia más cerca);
   la semana, la racha y la meta no van aquí: ya están en el cuadro «Hola» de arriba. Los logros entran uno a uno la primera vez que se ve la tarjeta. */
'use strict';
let ldAnimado = null;
const fmtV = v=>fmtNum(Math.round(v * 10) / 10);

/* Cifras de la sesión: las 3 primeras van grandes, el resto como fichas chicas */
function cifrasSesion(s){
  const m = metricas(s), k = kcalDe(s), c = [];
  if(m.km){ const t = verKm(m.km).split(' '); c.push([t[0], t[1]]); }
  if(m.min) c.push([m.min, 'min']);
  if(k) c.push([k.toLocaleString('es-CL'), 'kcal']);
  if(m.kg) c.push([(pesoPref()==='lb' ? Math.round(m.kg * KG_LB) : Math.round(m.kg)).toLocaleString('es-CL'), pesoPref() + ' levantados']);
  if(m.carga) c.push([fmtNum(m.carga), 'km·kg']);
  if(s.rpe) c.push([s.rpe + '/10', 'esfuerzo']);
  if(s.rx) c.push(['Rx', 'nivel']);
  return c;
}

/* Barras de los intervalos (la mejor en color) y una frase que los resume */
function htmlBarras(s){
  const P = parcialesDe(s); if(!P) return '';
  const vs = P.items.map(x=>x.v), mx = Math.max(...vs), mn = Math.min(...vs), alto = P.k!=='t';
  const h = v=>mx===mn ? 100 : Math.round(35 + 65 * (alto ? v - mn : mx - v) / (mx - mn));
  const sube = vs.every((v, i)=>!i || (alto ? v >= vs[i-1] : v <= vs[i-1]));
  const frase = mx===mn || (mx - mn) / mx <= 0.03 ? 'muy parejos' : sube ? 'fuiste de menos a más' : 'tu mejor fue el ' + P.items.find(x=>x.mejor).n + '.º';
  const txt = x=>P.k==='m' ? x.v.toLocaleString('es-CL') : x.txt;
  return `<div class="ld-barras">${P.items.map(x=>`<div class="${x.mejor ? 'mejor' : ''}"><b class="num">${esc(txt(x))}</b><span style="height:${Math.round(h(x.v) * 0.62)}%"></span><small>${x.n}</small></div>`).join('')}</div>
    <div class="ld-frase">Intervalo 1 a ${P.items.length}${P.k==='m' ? ' en metros' : ''} · ${frase}</div>`;
}

/* ¿Mejoraste frente a la última vez que hiciste este mismo entrenamiento? */
function mejoraSesion(s){
  const tit = (s.titulo || '').trim().toLowerCase(); if(!tit) return null;
  const crono = ordenCrono(), i = crono.findIndex(x=>x.id===s.id);
  const prev = crono.slice(0, i).reverse().find(x=>(x.titulo || '').trim().toLowerCase()===tit && x.tipo===s.tipo);
  if(!prev) return crono.length > 1 ? {ic:'✨', t:'Primera vez', d:esc(s.titulo) + ': ya tienes tu marca para superar', p:5} : null;
  const cuando = ` <span>vs. tu último ${esc(s.titulo)} (${verFecha(prev.fecha)})</span>`, ok = d=>({ic:'📈', t:'Mejoraste', d:d + cuando, p:2});
  const P = parcialesDe(s), Q = parcialesDe(prev);
  if(P && Q && P.k===Q.k){
    const pr = I=>I.items.reduce((a, x)=>a + x.v, 0) / I.items.length, dif = P.k==='t' ? pr(Q) - pr(P) : pr(P) - pr(Q);
    if(dif <= 0) return null;
    return ok(P.k==='t' ? PSF.verTiempo(Math.round(dif)) + ' más rápido por intervalo' : '+' + fmtV(dif) + (P.k==='m' ? ' m' : P.k==='cal' ? ' cal' : ' rep') + ' por intervalo');
  }
  const U = s.w && s.w.uno, V = prev.w && prev.w.uno;
  if(U && V && U.c==='peso'){ const top = X=>Math.max(0, ...seriesPeso(X).map(x=>x.kg)), a = top(U), b = top(V);
    return a > b && b ? ok('Más peso: ' + esc(resCorto(s)) + ' (antes ' + esc(resCorto(prev)) + ')') : null; }
  if(U && V && U.c==='dist'){ const rit = X=>{ const mt = metros(X.dist, X.distU), t = PSF.leerTiempo(X.tiempo); return mt && t ? t / (mt / 1000) : null; }, a = rit(U), b = rit(V);
    return a && b && a < b ? ok('Ritmo ' + verRitmo(a) + ' (antes ' + verRitmo(b) + ')') : null; }
  if(s.valor!=null && prev.valor!=null && s.u===prev.u){
    const menos = s.u==='tiempo' || (estiloDe(s.tipo) || {}).r==='tiempo';
    return (menos ? s.valor < prev.valor : s.valor > prev.valor) ? ok(esc(resCorto(s)) + ' (antes ' + esc(resCorto(prev)) + ')') : null;
  }
  return null;
}

/* Insignias: las que subieron de nivel con estas sesiones (por omisión, las de hoy) y la que quedó más cerca del siguiente */
function insigniasHoy(ids){
  const hoy = hoyISO(), todas = S.sesiones, fuera = x=>ids ? ids.includes(x.id) : x.fecha===hoy; let A;
  try{ S.sesiones = todas.filter(x=>!fuera(x)); A = estadoInsignias(); }finally{ S.sesiones = todas; }
  const D = estadoInsignias(), out = [];
  D.forEach((b, i)=>{ if(b.nivel > A[i].nivel) out.push({ic:b.ic, cls:'oro', t:'Insignia nueva', d:esc(b.n) + ' ' + ROMANOS[b.nivel] + ` <span>${esc(b.d.toLowerCase())}</span>`, p:1.5}); });
  const cerca = D.filter((b, i)=>b.sig && b.nivel===A[i].nivel && b.valor > A[i].valor).sort((a, b)=>(a.id==='sesiones') - (b.id==='sesiones') || b.pct - a.pct)[0];
  if(cerca) out.push({ic:cerca.ic, t:'Insignia ' + esc(cerca.n), d:fmtV(cerca.valor) + ' de ' + fmtV(cerca.sig) + ` <span>${esc(cerca.d.toLowerCase())}</span>`, barra:cerca.pct,
    nota:'Te faltan ' + fmtV(cerca.sig - cerca.valor) + ' para el nivel ' + ROMANOS[cerca.nivel + 1], p:6});
  return out;
}

function logrosHoy(ss, soloEstas){
  const L = [], fmtR = (rc, o)=>o.txt || (rc.u==='tiempo' ? PSF.verTiempo(o.valor) : fmtV(o.valor) + ' ' + (rc.u==='reps' ? 'rep' : rc.u));
  ss.forEach(s=>{ const n0 = L.length;
    (s.recs || []).forEach(rc=>{ const b = mejorDe(rc.ej); if(!b || b.ref!==s.id) return; const a = mejorDe(rc.ej, s.id);
      L.push(a ? {ic:'🏆', cls:'oro', t:'Récord personal', d:esc(rc.nombre) + ': ' + esc(fmtR(rc, rc)) + ` <span>antes ${esc(fmtR(rc, a))}</span>`, p:1}
               : {ic:'📍', t:'Primera marca', d:esc(rc.nombre) + ': ' + esc(fmtR(rc, rc)) + ' <span>ya tienes una marca para superar</span>', p:5}); });
    const m = L.slice(n0).some(x=>x.p===1) ? null : mejoraSesion(s); if(m && !(m.p===5 && L.some(x=>x.p===5))) L.push(m);   // con récord, «Mejoraste» sobra
    logrosSesion(s).filter(x=>x.cumplida).forEach(x=>L.push({ic:'🎯', t:'Hito', d:fmtCantidad(x.u, x.meta) + ' de ' + esc(x.n) + ' <span>en total</span>', p:4}));
  });
  return L.concat(insigniasHoy(soloEstas ? ss.map(x=>x.id) : null)).sort((a, b)=>a.p - b.p);
}
/* Logros de una sesión para la imagen de compartir (compartir.js): texto simple, solo los de verdad (sin «primera vez» ni la insignia por ganar), hasta 3.
   Las insignias son las que ganó ESA sesión (sin contar las otras del mismo día). */
function logrosParaCompartir(s){
  const plano = h=>{ const d = document.createElement('div'); d.innerHTML = String(h).replace(/<span>/g, ' · <span>'); return d.textContent.replace(/\s+/g, ' ').trim(); };
  return logrosHoy([s], true).filter(x=>x.p < 5).slice(0, 3).map(x=>({ic:x.ic, t:x.t, d:plano(x.p===2 ? x.d.replace(/ ?<span>.*<\/span>/, '') : x.d), oro:x.cls==='oro'}));
}

function htmlHechoHoy(ss, o){
  const clave = ss.map(s=>s.id).join(), anim = ldAnimado!==clave; ldAnimado = clave;
  if(anim && Date.now() - (ss[ss.length-1].creado || 0) < 120000 && navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) try{ navigator.vibrate(30); }catch(e){}
  const L = logrosHoy(ss), n = L.filter(x=>x.p < 6).length, nombre = ((S.perfil || {}).nombre || '').trim().split(' ')[0];
  const tit = tactico() ? 'Misión cumplida' : '¡Hecho' + (nombre ? ', ' + esc(nombre) : '') + '!';
  return `<div class="logro-dia hoy ld-hoy${anim ? ' anim' : ''}">
    <div class="ld-cab"><span class="ld-sello">✓</span><div><div class="ld-titg">${tit}</div>
      <div class="ld-sub num">Entrenamiento N.º ${o.nro.toLocaleString('es-CL')}${n ? ' · <b>' + n + (n===1 ? ' logro' : ' logros') + ' hoy</b>' : ''}</div></div></div>
    <div class="ld-sec">${tactico() ? 'Lo que cumpliste' : 'Lo que hiciste'}</div>
    ${ss.map(s=>{ const rsr = resumenSeries(s), [g, ch0] = rsr ? ['Mejor ' + rsr.mejor, ''] : o.res(s), ch = parcialesDe(s) ? '' : ch0, C = cifrasSesion(s);
      return `<button class="ld-item" data-sid="${s.id}">
      <div class="entre"><span class="ld-nombre">${esc(s.titulo || etiquetaTipo(s))}</span>${o.esPR(s) ? '<span class="ld-pr">🏆 Récord</span>' : '<span class="chev">›</span>'}</div>
      ${g ? `<div class="ld-res num">${esc(g)}${ch ? ` <small>${esc(ch)}</small>` : ''}</div>` : ''}
      ${C.length ? `<div class="ld-cifras num">${C.slice(0, 3).map(([v, u])=>`<div><b>${esc(String(v))}</b><small>${esc(u)}</small></div>`).join('')}</div>` : ''}
      ${htmlBarras(s)}${rsr ? rsr.html : ''}
      ${htmlWodVisual(s.w, true)}
      ${C.length > 3 ? `<div class="ld-chips num">${C.slice(3).map(([v, u])=>`<span>${esc(u==='nivel' ? v : v + ' ' + u)}</span>`).join('')}</div>` : ''}</button>`; }).join('')}
    ${L.length ? `<div class="ld-sec">${tactico() ? 'Logros de la misión' : 'Logros de hoy'}</div>
      <div class="ld-logros">${L.map((x, i)=>`<div class="ld-logro ${x.cls || ''}" style="--i:${i}"><span class="ld-lic">${x.ic}</span><div><b>${x.t}</b><div class="ld-ld">${x.d}</div>
        ${x.barra!=null ? `<div class="barra-logro"><span style="width:${x.barra}%"></span></div><small class="suave">${x.nota}</small>` : ''}</div></div>`).join('')}</div>` : ''}
    <button class="btn prim ancho ld-compartir" data-compartir-sid="${ss[ss.length-1].id}">↗ Compartir mi logro</button>
  </div>`;
}
