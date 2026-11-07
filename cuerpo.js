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
/* Salud resumida: el peor de cintura/estatura, IMC (solo si no hay cintura) e InBody; con el detalle en palabras */
function saludResumen(){
  const talla = medidaReciente('talla'), cin = medidaReciente('cintura'), peso = medidaReciente('peso'), out = [];
  if(cin && talla){ const ict = Math.round(cin / talla * 100) / 100, c = clasifICT(ict), nivel = c[0]==='MB' ? 'ok' : c[0]==='A' ? 'atento' : 'alto';
    out.push({nivel, n:'Cintura / estatura', v:fmtNum(ict), txt:c[1] + '. Lo sano es que tu cintura mida menos de la mitad de tu estatura (' + fmtNum(Math.round(talla / 2)) + ' cm).'}); }
  const imc = PSF.imc(peso, talla);
  if(imc) out.push({nivel:cin ? 'ok' : imc.valor >= 30 ? 'alto' : imc.valor >= 25 || imc.valor < 18.5 ? 'atento' : 'ok', n:'IMC', v:fmtNum(imc.valor), txt:imc.categoria + (cin ? '. Con la cintura medida, la cintura manda: el IMC no distingue músculo de grasa.' : '. Mide tu cintura para un resultado más justo (el IMC no distingue músculo de grasa).')});
  if(typeof saludInBody==='function' && conInBody()[0] && ibReciente(conInBody()[0])) saludInBody().forEach(x=>out.push(x));
  const orden = {ok:0, atento:1, alto:2}, peor = out.reduce((a, x)=>orden[x.nivel] > orden[a] ? x.nivel : a, 'ok');
  return {nivel:out.length ? peor : null, L:out};
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
    ${meta}${salud}${lesiones}${parq}
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
