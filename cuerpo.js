/* #NSCE — «Medidas y salud» (3-nov-2026; propuesta aprobada por el usuario: «simplificar los datos de salud y medidas corporales»).
   Una sola tarjeta en el Perfil, después de Recompensas (elegido por el usuario), que reemplaza las secciones Medidas y Salud y limitaciones:
   las 3 cifras que importan (peso, cintura, % de grasa) con su cambio, gráfico chico del peso, una frase en palabras simples, la meta de peso
   (antes solo en Analizar → Energía), «Salud: Bien / Atento / Alto» (IMC, cintura/estatura e InBody resumidos; el detalle con «❔»), las lesiones
   en una línea, el PAR-Q+ solo si dijo que tiene un problema de salud (la pregunta va en la bienvenida), el InBody completo plegado y Mi ciclo.
   Para anotar: un diálogo con el peso (lo único obligatorio), la cintura y «Más datos» plegado; el InBody se carga desde ahí mismo. */
'use strict';
const MS_CAMPOS = [['peso', 'kg', 'peso'], ['cintura', 'cm', 'cintura'], ['grasa', '%', 'grasa']];
/* Cambio de una medida en los últimos 90 días: {v (último), d (diferencia con el primero del período), desde (fecha)} */
function cambioMedida(k){
  const L = (S.medidas || []).filter(m=>num(m[k])!=null).sort((a, b)=>a.fecha < b.fecha ? -1 : 1); if(!L.length) return null;
  const u = L[L.length - 1], P = L.filter(m=>m.fecha >= masDias(u.fecha, -90) && m!==u), p = P[0];
  return {v:num(u[k]), f:u.fecha, d:p ? Math.round((num(u[k]) - num(p[k])) * 10) / 10 : null, desde:p ? p.fecha : null};
}
/* ¿Bajar es bueno? Cintura y grasa siempre; el peso según la meta (si no hay meta, neutro) */
function bajarEsBueno(k){ if(k!=='peso') return true; const M = S.metaPeso, u = medidaReciente('peso'); return M && u ? M.peso < u : null; }
function tiempoDesde(f){ const d = diasEntre(f, hoyISO()); return d < 14 ? d + ' días' : d < 60 ? Math.round(d / 7) + ' semanas' : Math.round(d / 30) + ' meses'; }
/* Índices de masa grasa y de masa magra (kg por estatura²; 8-nov-2026, aprobado por el usuario: el IMC marcaba «obesidad» a un usuario
   musculoso con 17,9 % de grasa). Masa grasa (FMI): rangos de Kelly y col. 2009 (NHANES): hombres normal 3-6, exceso 6-9, obesidad desde 9;
   mujeres normal 5-9, exceso 9-13, obesidad desde 13. Masa magra (FFMI ajustado a 1,80 m, Kouri y col. 1995): hombres 17-20 normal,
   20-23 sobre el promedio, 23-25 muy alta, más de 25 propia de atletas de fuerza; mujeres unos 3 puntos menos. No es diagnóstico. */
function indicesComposicion(peso, talla, grasa){
  if(!peso || !talla || grasa==null || !(grasa > 0 && grasa < 70)) return null;
  const h = talla / 100, mg = peso * grasa / 100, M = S.perfil.sexo==='M', fmi = Math.round(mg / (h * h) * 10) / 10;
  const ffmi = Math.round(((peso - mg) / (h * h) + 6.1 * (1.8 - h)) * 10) / 10, k = M ? 3 : 0;
  const [b, n1, n2, ob] = M ? [3.5, 5, 9, 13] : [2, 3, 6, 9];
  const fmiNivel = fmi < b ? 'atento' : fmi > ob ? 'alto' : fmi > n2 ? 'atento' : 'ok';
  const fmiTxt = fmi < b ? 'Muy baja: puede afectar la energía, las hormonas y los huesos.' : fmi > ob ? 'Alta: prioriza aeróbico, fuerza y alimentación.'
    : fmi > n2 ? 'Algo alta para tu estatura.' : fmi < n1 ? 'Baja, propia de deportistas.' : 'Normal para tu estatura.';
  const ffmiNivel = ffmi < 17 - k ? 'atento' : 'ok';
  const ffmiTxt = ffmi < 17 - k ? 'Baja: la fuerza 2-3 veces por semana la sube.' : ffmi <= 20 - k ? 'Normal.' : ffmi <= 23 - k ? 'Sobre el promedio: buen músculo para tu estatura.'
    : ffmi <= 25 - k ? 'Muy alta: mucho músculo para tu estatura.' : 'Excepcional: propia de atletas de fuerza.';
  return {fmi, fmiNivel, fmiTxt, ffmi, ffmiNivel, ffmiTxt};
}
/* Salud resumida: el peor de cintura/estatura, masa grasa, InBody e IMC (el IMC solo cuenta si no hay % de grasa ni cintura); con el detalle en palabras */
function saludResumen(){
  const talla = medidaReciente('talla'), cin = medidaReciente('cintura'), peso = medidaReciente('peso'), out = [];
  const comp = indicesComposicion(peso, talla, medidaReciente('grasa'));
  if(cin && talla){ const ict = Math.round(cin / talla * 100) / 100, c = clasifICT(ict), nivel = c[0]==='MB' ? 'ok' : c[0]==='A' ? 'atento' : 'alto';
    out.push({nivel, n:'Cintura / estatura', v:fmtNum(ict), txt:c[1] + '. Lo sano es que tu cintura mida menos de la mitad de tu estatura (' + fmtNum(Math.round(talla / 2)) + ' cm).'}); }
  const imc = PSF.imc(peso, talla);
  if(imc && (comp || cin)) out.push({nivel:'info', n:'IMC', v:fmtNum(imc.valor), txt:imc.valor >= 25 && comp && comp.fmiNivel==='ok'
      ? 'Según el IMC sería «' + imc.categoria.toLowerCase() + '», pero tu grasa está bien: tu peso viene del músculo. Por eso aquí el IMC es solo de referencia.'
      : 'Solo de referencia: el IMC no distingue músculo de grasa. Con tu ' + (comp ? '% de grasa' : 'cintura') + ' medido, eso es lo que cuenta.'});
  else if(imc) out.push({nivel:imc.valor >= 30 ? 'alto' : imc.valor >= 25 || imc.valor < 18.5 ? 'atento' : 'ok', n:'IMC', v:fmtNum(imc.valor), txt:imc.categoria + '. Mide tu cintura o tu % de grasa para un resultado más justo (el IMC no distingue músculo de grasa).'});
  if(comp){ out.push({nivel:comp.fmiNivel, n:'Masa grasa para tu estatura', v:fmtNum(comp.fmi), txt:comp.fmiTxt + ' (kg de grasa ÷ estatura²)'});
    out.push({nivel:comp.ffmiNivel, n:'Masa magra para tu estatura', v:fmtNum(comp.ffmi), txt:comp.ffmiTxt + ' (kg sin grasa ÷ estatura², ajustado)'}); }
  if(typeof saludInBody==='function' && conInBody()[0] && ibReciente(conInBody()[0])) saludInBody().forEach(x=>out.push(x));
  const orden = {info:-1, ok:0, atento:1, alto:2}, peor = out.reduce((a, x)=>orden[x.nivel] > orden[a] ? x.nivel : a, 'ok');
  return {nivel:out.length ? peor : null, L:out};
}
/* ---------- «🎯 Mis objetivos» (9-nov-2026, propuesta aprobada por el usuario: «cómo una persona registra su objetivo físico y de salud») ----------
   Una tarjeta en el Perfil, arriba de Medidas y salud. Físico: los objetivos de la bienvenida (OBJ_BIEN), se pueden cambiar cuando quiera y cambian
   las líneas del WOD del día; con objetivo de Mi plan, «Mi plan con este objetivo». Salud: meta de peso (S.metaPeso, la de siempre), de % de grasa y
   de cintura (S.metasSalud), cada una opcional y con lo que falta. El «Objetivo principal» de Ajustes (no cambiaba nada) se quitó. */
const metaGrasa = ()=>num((S.metasSalud || {}).grasa) || ent(pref('pgcMeta')) || null;
function ponerMetaGrasa(v){ S.metasSalud = Object.assign({}, S.metasSalud, {grasa:v ? String(v) : ''}); if(v) pref('pgcMeta', String(v)); guardar(); }
const objFisico = ()=>OBJ_BIEN.find(o=>o.id===S.perfil.objBien) || null;
function filaMeta(id, nombre, meta, act, un, bajar){
  if(meta==null) return `<button class="ms-fila" id="${id}"><span>${nombre}</span><span class="link chico">ponerme una ›</span></button>`;
  const d = act==null ? null : Math.round((act - meta) * 10) / 10, listo = d!=null && (bajar ? d <= 0.2 : d >= -0.2);
  return `<button class="ms-fila" id="${id}"><span>${nombre}: <b>${fmtNum(meta)} ${un}</b></span><span class="suave chico">${act==null ? 'anota tu medida' : listo ? '¡lograda! ✓' : 'hoy ' + fmtNum(act) + ' ' + un + ' · ' + (d > 0 ? 'faltan ' : 'faltan ') + fmtNum(Math.abs(d)) + ' ' + un} ›</span></button>`;
}
function htmlMisObjetivos(){
  const o = objFisico(), act = medidaReciente('peso'), pp = S.metaPeso && typeof planPeso==='function' ? planPeso() : null;
  const enPlan = o && o.plan && S.plan && S.plan.obj===o.plan.obj;
  const peso = S.metaPeso ? `<button class="ms-fila" id="msMeta"><span>Peso: <b>${fmtNum(S.metaPeso.peso)} kg</b></span><span class="suave chico">${act!=null ? (Math.abs(act - S.metaPeso.peso) < 0.3 ? '¡lograda! ✓' : 'hoy ' + fmtNum(act) + ' kg · faltan ' + fmtNum(Math.round(Math.abs(act - S.metaPeso.peso) * 10) / 10) + ' kg' + (pp ? ' · ~' + Math.max(1, Math.round(pp.dias / 7)) + ' semanas' : '')) : 'anota tu peso'} ›</span></button>`
    : '<button class="ms-fila" id="msMeta"><span>Peso</span><span class="link chico">ponerme una ›</span></button>';
  return `<div class="tarjeta ob" id="pfObjetivos"><span class="titulo">🎯 Mis objetivos</span>
    <div class="etiqueta ob-et">Físico</div>
    <button class="ms-fila" id="obFis"><span><b>${o ? esc(o.n) : 'Elegir mi objetivo'}</b>${o ? `<small class="suave chico ob-d">${esc(o.d)}</small>` : ''}</span><span class="link chico">${o ? 'cambiar' : 'elegir'} ›</span></button>
    ${o && o.plan ? `<button class="ms-fila" id="obPlan"><span>📅 Mi plan ${enPlan ? 'con este objetivo ✓' : 'para este objetivo'}</span><span class="link chico">${enPlan ? 'ver' : 'armar'} ›${esPlus() ? '' : ' <span class="plus-mini">PLUS</span>'}</span></button>` : ''}
    <div class="etiqueta ob-et">Salud <span class="suave">· cada meta es opcional</span></div>
    ${peso}
    ${filaMeta('obGrasa', '% de grasa', metaGrasa(), medidaReciente('grasa'), '%', true)}
    ${filaMeta('obCin', 'Cintura', num((S.metasSalud || {}).cintura), medidaReciente('cintura'), 'cm', true)}
    <details class="que"><summary>❔ ¿Para qué sirve?</summary><p>Tu objetivo físico decide qué WOD del día te salen y cómo se arma Mi plan. Las metas de salud te muestran cuánto te falta cada vez que anotas tus medidas. <b>Ejemplo:</b> objetivo «Combate y servicio», cintura 88 cm y 15 % de grasa.</p></details></div>`;
}
function dialogoObjetivo(){
  const L = OBJ_BIEN.filter(o=>!o.soloM || S.perfil.sexo==='M'), act = S.perfil.objBien;
  dialogo(`<div class="cab"><h2>🎯 Tu objetivo físico</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <p class="suave chico">👉 <b>Ahora:</b> elige el que más se parece a lo que buscas. Puedes cambiarlo cuando quieras.</p>
    <div class="opciones">${L.map(o=>`<button class="opcion ${o.id===act ? 'sel' : ''}" data-obj="${o.id}"><b>${esc(o.n)}${o.id===act ? ' ✓' : ''}</b><span>${esc(o.d)}</span></button>`).join('')}</div>`, d=>{
    $$('[data-obj]', d).forEach(b=>b.onclick = ()=>{ const o = OBJ_BIEN.find(x=>x.id===b.dataset.obj);
      S.perfil.objBien = o.id; S.perfil.lineas = o.lineas ? o.lineas.slice() : null; S.perfil.lineaHero = true; S.perfil.lineaMujer = true;
      if(S.perfil.lineas && S.perfil.sexo==='M' && !S.perfil.lineas.includes('mujer')) S.perfil.lineas.push('mujer');
      { const k = o.lineas ? lineasVisibles().findIndex(l=>l.id===o.lineas[0]) : 0; pref('pista', String(Math.max(0, k))); }
      guardar(); d.close(); aviso('🎯 Objetivo: ' + o.n + '. Tus WOD del día cambiaron.', 3000); vPerfil(); }); });
}
function dialogoMetaSalud(k){
  const G = k==='grasa', v = G ? metaGrasa() : num((S.metasSalud || {}).cintura), act = medidaReciente(G ? 'grasa' : 'cintura');
  const sug = G ? META_PGC[S.perfil.sexo==='M' ? 'M' : 'H'] : null, talla = medidaReciente('talla');
  dialogo(`<div class="cab"><h2>${G ? 'Meta de % de grasa' : 'Meta de cintura'}</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <p class="suave chico">${G ? `👉 <b>Ahora:</b> escribe el % de grasa al que quieres llegar.${act!=null ? ' Hoy tienes ' + fmtNum(act) + ' %.' : ''} Referencias: ${sug.join(' %, ')} % (atlético, en forma, saludable).`
      : `👉 <b>Ahora:</b> escribe la cintura (en cm, a la altura del ombligo) a la que quieres llegar.${act!=null ? ' Hoy mides ' + fmtNum(act) + ' cm.' : ''}${talla ? ' Lo sano es menos de la mitad de tu estatura: ' + fmtNum(Math.round(talla / 2)) + ' cm.' : ''}`}</p>
    ${G ? `<div class="chips">${sug.map(x=>`<button data-sug="${x}">${x} %</button>`).join('')}</div>` : ''}
    <label>${G ? 'Meta (%)' : 'Meta (cm)'}</label><input id="msV" type="number" inputmode="decimal" step="0.5" value="${v!=null ? v : ''}">
    <div class="btns">${v!=null ? '<button class="btn" id="msQuitar">Quitar meta</button>' : '<button class="btn" data-cerrar>Cancelar</button>'}<button class="btn prim" id="msOk">Guardar</button></div>`, d=>{
    $$('[data-sug]', d).forEach(b=>b.onclick = ()=>{ $('#msV', d).value = b.dataset.sug; });
    const poner = x=>{ if(G) ponerMetaGrasa(x); else { S.metasSalud = Object.assign({}, S.metasSalud, {cintura:x ? String(x) : ''}); guardar(); } d.close(); vPerfil(); };
    $('#msOk', d).onclick = ()=>{ const x = num($('#msV', d).value); if(x==null || x <= (G ? 2 : 40) || x >= (G ? 60 : 200)){ aviso('Escribe un valor válido'); return; } poner(x); };
    if($('#msQuitar', d)) $('#msQuitar', d).onclick = ()=>{ if(G){ S.metasSalud = Object.assign({}, S.metasSalud, {grasa:''}); pref('pgcMeta', ''); guardar(); d.close(); vPerfil(); } else poner(''); };
  });
}
function enlazarMisObjetivos(){
  if($('#obFis')) $('#obFis').onclick = dialogoObjetivo;
  if($('#obPlan')) $('#obPlan').onclick = ()=>{ const o = objFisico(); if(S.plan && S.plan.obj===o.plan.obj) return ir('plan');
    dialogoPlan(Object.assign({}, o.plan, o.id==='psf' && typeof fechaPSFSugerida==='function' ? {fecha:fechaPSFSugerida()} : {})); };
  if($('#obGrasa')) $('#obGrasa').onclick = ()=>dialogoMetaSalud('grasa');
  if($('#obCin')) $('#obCin').onclick = ()=>dialogoMetaSalud('cintura');
}
function svgPesoChico(){
  const L = (S.medidas || []).filter(m=>num(m.peso)!=null).sort((a, b)=>a.fecha < b.fecha ? -1 : 1).slice(-12); if(L.length < 2) return '';
  const vs = L.map(m=>num(m.peso)), mn = Math.min(...vs), mx = Math.max(...vs), W = 300, H = 46;
  const P = L.map((m, i)=>[6 + i * (W - 12) / (L.length - 1), 6 + (mx===mn ? 0.5 : 1 - (num(m.peso) - mn) / (mx - mn)) * (H - 12)]), u = P[P.length - 1];
  return `<svg viewBox="0 0 ${W} ${H}" class="ms-graf" role="img" aria-label="Tu peso en el tiempo"><polyline points="${P.map(p=>p.map(Math.round).join(',')).join(' ')}" fill="none" stroke="var(--acento)" stroke-width="2.5"/><circle cx="${Math.round(u[0])}" cy="${Math.round(u[1])}" r="4" fill="var(--acento)"/></svg>`;
}
function htmlMedidasSalud(){
  const u = ultimaMedida(), C = MS_CAMPOS.map(([k, un, n])=>Object.assign({k, un, n}, cambioMedida(k) || {})).filter(x=>x.v!=null);
  const pq = estadoParq(), lims = limitesActivos(), sal = saludResumen(), ib = conInBody()[0];
  const flecha = x=>{ if(!x.d) return ''; const b = bajarEsBueno(x.k), bien = b==null ? null : (x.d < 0)===b;
    return `<div class="ms-dif ${bien==null ? '' : bien ? 'bien' : 'mal'}">${x.d < 0 ? '▼' : '▲'} ${fmtNum(Math.abs(x.d))}</div>`; };
  // frase: lo que cambió en palabras simples
  const conD = C.filter(x=>x.d), buenos = conD.filter(x=>{ const b = bajarEsBueno(x.k); return b!=null && (x.d < 0)===b; });
  const partes = conD.map(x=>(x.d > 0 ? '+' : '−') + fmtNum(Math.abs(x.d)) + (x.k==='peso' ? ' kg' : x.k==='cintura' ? ' cm de cintura' : ' % de grasa'));
  const frase = conD.length ? `<p class="ms-frase">${buenos.length===conD.length ? 'Vas bien: ' : 'Desde el ' + verFecha(conD[0].desde) + ': '}<b>${partes.length > 1 ? partes.slice(0, -1).join(', ') + ' y ' + partes[partes.length - 1] : partes[0]}</b> en ${tiempoDesde(conD[0].desde)}.</p>` : '';
  const pp = S.metaPeso && typeof planPeso==='function' ? planPeso() : null, act = medidaReciente('peso');
  const meta = S.metaPeso ? `<button class="ms-fila" id="msMeta"><span>🎯 Meta ${fmtNum(S.metaPeso.peso)} kg</span><span class="suave chico">${act!=null ? (Math.abs(act - S.metaPeso.peso) < 0.3 ? '¡lograda!' : 'faltan ' + fmtNum(Math.round(Math.abs(act - S.metaPeso.peso) * 10) / 10) + ' kg' + (pp ? ' · ~' + Math.max(1, Math.round(pp.dias / 7)) + ' semanas' : '')) : ''} ›</span></button>`
    : (act!=null ? '<button class="ms-fila" id="msMeta"><span>🎯 Meta de peso</span><span class="link chico">ponerme una ›</span></button>' : '');
  const salud = sal.nivel ? `<details class="ms-salud"><summary class="ms-fila"><span>🩺 Salud</span><span class="chip-niv" style="--nc:${COL_SAL[sal.nivel]}">${NOM_SAL[sal.nivel]}</span></summary>
      ${sal.L.map(x=>`<div class="ib-sal-fila"><div class="entre"><span>${esc(x.n)} <b class="num">${esc(x.v)}</b></span><span class="chip-niv" style="--nc:${COL_SAL[x.nivel]}">${NOM_SAL[x.nivel]}</span></div><div class="suave chico">${esc(x.txt)}</div></div>`).join('')}
      ${sal.nivel==='alto' ? '<p class="chico ib-consulta">👉 Conversa estos resultados con tu médico o con sanidad.</p>' : ''}<p class="nota">Referencias generales (OMS, NICE e InBody); no es un diagnóstico.</p></details>` : '';
  const lesiones = `<div class="ms-fila ms-les"><span>🩹 Lesiones</span><span class="ms-les-l">${lims.map(l=>`<button class="chip-les" data-lim="${l.id}">${esc(ZONAS[l.zona].n)}${l.nota ? ' · ' + esc(l.nota) : ''}</button>`).join('')}${lims.length ? '' : '<span class="suave chico">ninguna</span>'}<button class="link chico" id="pLimite">agregar ›</button></span></div>`;
  const parq = S.perfil.saludBien==='si' || pq.k==='si' || (S.perfil.parq && S.perfil.parq.fecha) ? `<div class="ms-fila"><span>⚕️ Cuestionario de salud</span><button class="link chico" id="pParq">${pq.k==='pend' ? 'responder ›' : esc(pq.txt) + ' ›'}</button></div>` : '';
  return `<div class="tarjeta ms" id="pfMedSal"><div class="entre"><span class="titulo">⚖️ Medidas y salud</span>${u.fecha ? `<span class="suave chico">${u.fecha===hoyISO() ? 'hoy' : 'hace ' + tiempoDesde(u.fecha)}</span>` : ''}</div>
    ${C.length ? `<div class="ms-cifras">${C.map(x=>`<div><b class="num">${fmtNum(x.v)}</b><span>${x.k==='peso' ? 'kg' : x.k==='cintura' ? 'cm cintura' : '% grasa'}</span>${flecha(x)}</div>`).join('')}</div>${svgPesoChico()}${frase}`
      : '<p class="suave chico">👉 <b>Ahora:</b> anota tu peso para ver cómo cambias. Lo demás es opcional.</p>'}
    ${salud}${lesiones}${parq}
    ${ib ? `<details class="ms-ib"><summary class="ms-fila"><span>📊 InBody ${verFecha(ib.fecha)}</span><span class="suave chico">${ib.inbody.punt!=null ? fmtNum(ib.inbody.punt) + ' pts · ' : ''}ver ›</span></summary>${esPlus() ? htmlInBody() + htmlRecomposicion() : htmlCandadoPlus('inbody')}</details>` : ''}
    ${htmlCicloPerfil()}
    <button class="btn prim ancho" id="pMedida" style="margin-top:12px">＋ Anotar mis medidas</button>
    ${(S.medidas || []).length > 1 ? '<button class="link chico ms-hist" id="pMedHist">Ver todas mis mediciones ›</button>' : ''}</div>`;
}
function enlazarMedidasSalud(){
  if($('#pMedida')) $('#pMedida').onclick = dialogoMedida;
  if($('#pMedHist')) $('#pMedHist').onclick = historialMedidas;
  if($('#pParq')) $('#pParq').onclick = dialogoParq;
  if($('#pLimite')) $('#pLimite').onclick = ()=>dialogoLimite();
  $$('#pfMedSal [data-lim]').forEach(b=>b.onclick = ()=>dialogoLimite((S.perfil.limites || []).find(x=>x.id===b.dataset.lim)));
  if($('#msMeta')) $('#msMeta').onclick = ()=>dialogoMetaPeso(()=>vPerfil());
  enlazarInBody();
}
/* Anotar: peso (y cintura) a la vista; % de grasa, pulso, estatura y fecha en «Más datos»; el InBody desde aquí mismo */
function dialogoMedida(){
  const u = ultimaMedida(), talla = medidaReciente('talla');
  dialogo(`<div class="cab"><h2>Anotar medidas</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <p class="suave chico">👉 <b>Ahora:</b> súbete a la balanza en la mañana, en ayunas, y anota tu peso. Lo demás es opcional.</p>
    <label>Peso (kg)</label><input id="mdPeso" inputmode="decimal" value="${esc(u.peso ? String(u.peso).replace('.', ',') : '')}" placeholder="Ej.: 78,5">
    <label>Cintura (cm, opcional)</label><input id="mdCin" inputmode="decimal" placeholder="De pie, a la altura del ombligo">
    ${talla ? '' : `<label>Estatura (cm, una sola vez)</label><input id="mdTalla" inputmode="numeric" placeholder="Ej.: 175">`}
    <details class="que"><summary>Más datos (opcional)</summary>
      <div class="fila"><div><label>% de grasa</label><input id="mdGr" inputmode="decimal" placeholder="balanza o evaluación"></div><div><label>Pulso en reposo</label><input id="mdFc" inputmode="numeric" placeholder="lat/min al despertar"></div></div>
      <div class="fila">${talla ? `<div><label>Estatura (cm)</label><input id="mdTalla" inputmode="numeric" value="${esc(talla)}"></div>` : ''}<div><label>Fecha</label><input id="mdF" type="date" value="${hoyISO()}"></div></div></details>
    <button class="ms-fila ms-ibbtn" id="mdIB"><span>📷 Tengo un informe InBody</span><span class="suave chico">foto › se llena solo</span></button>
    <div class="btns"><button class="btn" data-cerrar>Cancelar</button><button class="btn prim" id="mdOk">Guardar</button></div>`, d=>{
    $('#mdIB', d).onclick = ()=>{ d.close(); dialogoInBody(); };
    $('#mdOk', d).onclick = ()=>{
      const tl = num($('#mdTalla', d).value), m = {id:uid(), fecha:$('#mdF', d).value || hoyISO(), peso:num($('#mdPeso', d).value), talla:tl!=null && tl!==talla ? tl : null,
        cintura:num($('#mdCin', d).value), grasa:num($('#mdGr', d).value), fcr:ent($('#mdFc', d).value)};
      if([m.peso, m.talla, m.cintura, m.grasa, m.fcr].every(v=>v==null)){ aviso('Anota al menos tu peso'); return; }
      if(m.peso!=null && !(m.peso > 25 && m.peso < 300)){ aviso('Revisa el peso'); return; }
      S.medidas = (S.medidas || []).concat([m]); guardar(); d.close(); vPerfil(); aviso('Medidas guardadas'); };
  });
}
