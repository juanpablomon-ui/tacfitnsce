/* #NSCE — PSF anteriores (25-nov-2026, maqueta aprobada; «solo hasta el año anterior»): controles con `antigua:true` (y `per` 'AAAA-1|2' si no se sabe el día; la fecha interna es
   el medio del período). Sirven para comparar y para el récord; no cuentan como entrenamiento, puntos, insignias ni logros, y no se publican. Resultado con la edad de ese día. */
'use strict';
const fechaPer = per=>{ const [a, n] = per.split('-'); return a + (n==='1' ? '-04-15' : '-11-15'); };
const nomCtrl = c=>c.per ? c.per.slice(0, 4) + (c.per.endsWith('1') ? ' · 1.ª evaluación' : ' · 2.ª evaluación') : verFecha(c.fecha);
const sinFechaInventada = h=>S.controles.filter(c=>c.per).reduce((t, c)=>t.split(verFecha(c.fecha)).join(c.per.slice(0, 4) + ' · ' + (c.per.endsWith('1') ? '1.ª' : '2.ª')), h);   // en gráficos y listas: el período, no el día
const anioMinPSF = ()=>new Date().getFullYear() - 1;
/* Períodos ya cerrados desde el año anterior, el más nuevo primero, sin los que ya tienen control */
function periodosAntes(sinId){ const h = hoyISO(), a = anioMinPSF(), L = []; for(let y = a + 1; y >= a; y--) for(const n of ['2', '1']){ const fin = y + (n==='2' ? '-11-30' : '-04-30'); if(fin < h) L.push(y + '-' + n); }
  return L.filter(p=>!S.controles.some(c=>c.id!==sinId && c.fecha >= p.slice(0, 4) + (p.endsWith('1') ? '-03-01' : '-10-01') && c.fecha <= p.slice(0, 4) + (p.endsWith('1') ? '-04-30' : '-11-30'))); }
function evalAntes(x){ const p = perfilPSF(x.fecha); if(!p.sexo || p.edad==null) return {p, niveles:{}, ev:null};
  const c = x.carrera!=null ? PSF.carrera(p, x.carrera) : null, a = x.abd!=null ? PSF.abdominales(p, x.abd) : null, b = x.brazos!=null ? PSF.brazos(p, x.brazos) : null;
  return {p, niveles:{c:c && c.nivel, a:a && a.nivel, b:b && b.nivel}, ev:c && a && b ? PSF.evaluacion([c.nivel, a.nivel, b.nivel]) : null}; }
const hayParaCargar = ()=>S.controles.filter(c=>c.antigua).length < 8;
function htmlPSFAntes(){
  if(S.controles.length >= 2 || pref('psfAntesNo')==='1') return '';
  return `<div class="tarjeta psfa"><div class="titulo">🎖️ ¿Ya rendiste la PSF antes?</div><p class="suave chico">Cárgalas y verás cuánto has mejorado. Toma 1 minuto.</p><button class="btn prim ancho" data-psfantes>Cargar mis PSF anteriores</button><button class="link chico" id="psfaNo">Ahora no</button></div>`;
}
function enlazarPSFAntes(){ $$('[data-psfantes]').forEach(b=>b.onclick = ()=>dialogoPSFAntes()); if($('#psfaNo')) $('#psfaNo').onclick = ()=>{ pref('psfAntesNo', '1'); $('.psfa').remove(); aviso('Quedan más abajo, en «Mis controles»'); }; }
function dialogoPSFAntes(ed){
  const P = periodosAntes(ed && ed.id), anios = [...new Set(P.map(p=>p.slice(0, 4)))]; let per = ed ? ed.per || '' : P[0] || '', dia = ed && !ed.per ? ed.fecha : '', n = S.controles.filter(c=>c.antigua).length;
  const min = anioMinPSF() + '-01-01', max = masDias(hoyISO(), -1);
  dialogo(`<div class="cab"><h2>${ed ? 'Editar PSF anterior' : 'PSF anteriores'}</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    ${!ed && n ? `<p class="suave chico">Llevas ${n} ${n===1 ? 'cargada' : 'cargadas'}.</p>` : ''}
    <b>¿Cuándo fue?</b><div class="chips ap-chips" id="paPer">${P.map(p=>`<button data-per="${p}">${p.slice(0, 4)} · ${p.endsWith('1') ? '1.ª (mar–abr)' : '2.ª (oct–nov)'}</button>`).join('')}</div>
    <label>${P.length ? '¿Sabes el día? (opcional)' : '¿Qué día fue?'}</label><input id="paDia" type="date" min="${min}" max="${max}" value="${dia}">
    <div class="fila3"><div><label>2.400 m</label><input id="paC" data-tiempo inputmode="numeric" placeholder="9:48" value="${ed && ed.carrera!=null ? PSF.verTiempo(ed.carrera) : ''}"></div><div><label>Abdominales</label><input id="paA" type="number" inputmode="numeric" min="0" max="200" value="${ed && ed.abd!=null ? ed.abd : ''}"></div><div><label id="paBn">Barras</label><input id="paB" type="number" inputmode="numeric" min="0" max="200" value="${ed && ed.brazos!=null ? ed.brazos : ''}"></div></div>
    <p class="nota">Deja en blanco lo que no recuerdes. Solo del ${anioMinPSF()} en adelante. Sirve para comparar: no suma entrenamientos ni puntos.</p><div class="psfa-res" id="paRes"></div>
    <div class="btns">${ed ? '' : `<button class="btn" id="paFin">${n ? 'Terminé' : 'Cancelar'}</button>`}<button class="btn prim" id="paOk">${ed ? 'Guardar' : 'Guardar y agregar otra'}</button></div>`, d=>{
    const leer = ()=>{ const f = $('#paDia', d).value, fecha = f || (per ? fechaPer(per) : ''); return {fecha, per:f ? null : per || null, carrera:PSF.leerTiempo($('#paC', d).value), abd:ent($('#paA', d).value), brazos:ent($('#paB', d).value)}; };
    const pintar = ()=>{ const f = $('#paDia', d).value; $$('[data-per]', d).forEach(b=>b.classList.toggle('activa', !f && b.dataset.per===per)); const x = leer(); if(!x.fecha){ $('#paRes', d).innerHTML = ''; return; }
      const r = evalAntes(x); $('#paBn', d).textContent = r.p.sexo && r.p.edad!=null && PSF.pruebaBrazos(r.p)!=='barra' ? 'Flexiones' : 'Barras';
      $('#paRes', d).innerHTML = r.p.edad==null ? '' : `<span class="suave chico">A tus ${r.p.edad} años</span>${r.ev ? chip(r.ev) : '<span class="suave chico">Con las 3 pruebas sale el resultado</span>'}`; };
    pintar(); $$('[data-per]', d).forEach(b=>b.onclick = ()=>{ per = b.dataset.per; $('#paDia', d).value = ''; pintar(); }); ['paDia', 'paC', 'paA', 'paB'].forEach(i=>$('#' + i, d).addEventListener('input', pintar));
    if($('#paFin', d)) $('#paFin', d).onclick = ()=>{ if(n) resumenPSFAntes(); else d.close(); };
    $('#paOk', d).onclick = ()=>{ const x = leer(); if(tiempoMal(d)) return;
      if(!x.fecha) return aviso('Elige cuándo fue'); if(x.fecha < min || x.fecha > max) return aviso('Solo del ' + anioMinPSF() + ' hasta ayer');
      if(x.carrera==null && x.abd==null && x.brazos==null) return aviso('Anota al menos una marca'); if(x.carrera!=null && (x.carrera < 360 || x.carrera > 1800)) return aviso('Revisa el tiempo de los 2.400 m');
      if(S.controles.some(c=>c.id!==(ed && ed.id) && c.fecha===x.fecha)) return aviso('Ya tienes una PSF de ese día');
      const r = evalAntes(x), p = r.p, c = Object.assign({id:ed ? ed.id : uid(), antigua:true, peso:null, talla:null, lm:{c:false, a:false, b:false}}, x, {per:x.per || undefined, prueba:p.sexo && p.edad!=null ? PSF.pruebaBrazos(p) : 'barra', niveles:r.niveles, eval:r.ev, edad:p.edad, bonif:!!p.bonif});
      if(ed) S.controles = S.controles.map(y=>y.id===ed.id ? c : y); else S.controles.push(c); guardar(); if(vistaActual==='psf') vPSF();
      if(ed){ aviso('PSF guardada'); return verControl(c); } aviso('PSF guardada'); if(periodosAntes().length) dialogoPSFAntes(); else resumenPSFAntes(); };
  });
}
/* Al terminar: primera contra la última y la curva */
function resumenPSFAntes(){
  const C = S.controles.slice().sort((a, b)=>a.fecha < b.fecha ? -1 : 1), serie = k=>C.filter(c=>k==='carrera' ? c.carrera!=null : k==='abd' ? c.abd!=null : c.brazos!=null && c.prueba===C[C.length - 1].prueba);
  const car = serie('carrera'), p = car[0], u = car[car.length - 1], dif = car.length > 1 ? p.carrera - u.carrera : null;
  const fila = (k, t)=>{ const s = serie(k); if(s.length < 2) return ''; const a = s[0][k], b = s[s.length - 1][k], df = b - a; return `<div class="entre"><span class="suave">${t}</span><b class="num">${a} → ${b} ${df > 0 ? '▲ ' + df : df < 0 ? '▼ ' + -df : '='}</b></div>`; };
  const frase = dif==null ? '' : dif > 0 ? `▲ ${dif} s mejor en 2.400 m` : dif < 0 ? `▼ ${-dif} s más lento que en tu primera` : '= igual que en tu primera';
  dialogo(`<div class="cab"><h2>Tu PSF en el tiempo</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    ${dif!=null ? `<div class="frase-est psfa-dest" style="--fc:${colorFrase()}"><small>Desde tu primera PSF · ${esc(nomCtrl(p))}</small><div class="psfa-g num">${PSF.verTiempo(p.carrera)} → ${PSF.verTiempo(u.carrera)}</div><b>${frase}</b></div>` : '<p class="suave">Cuando tengas dos carreras guardadas verás cuánto cambiaste.</p>'}
    ${car.length > 1 ? `<div class="etiqueta">Tu carrera</div>${sinFechaInventada(grafico({id:'psf2400', nombre:'Carrera 2.400 m', u:'tiempo'}, car.map(c=>({fecha:c.fecha, valor:c.carrera}))))}` : ''}
    ${fila('abd', 'Abdominales')}${fila('brazos', C.length && C[C.length - 1].prueba==='barra' ? 'Barras' : 'Flexiones')}
    <div class="btns">${periodosAntes().length ? '<button class="btn" id="paOtra">＋ Otra</button>' : ''}${dif > 0 ? '<button class="btn" id="paComp">↗ Compartir</button>' : ''}<button class="btn prim" data-cerrar>Listo</button></div>`, d=>{
    if($('#paOtra', d)) $('#paOtra', d).onclick = ()=>dialogoPSFAntes(); if($('#paComp', d)) $('#paComp', d).onclick = ()=>compartirLogro({ic:'🎖️', t:'2.400 m: ' + PSF.verTiempo(p.carrera) + ' → ' + PSF.verTiempo(u.carrera), d:dif + ' s mejor', fecha:u.fecha, tipo:'psf'}); });
}
