/* #NSCE — Plan PSF y «Mi rendimiento» (24-oct-2026, pedido del usuario). La PSF es un objetivo más de Mi plan (grupo Militar,
   `obj:'psf'`, meta `sub` = «Apto» o «Apto muy bueno», fecha = la de tu prueba; por omisión el comienzo del próximo período de evaluación).
   Las sesiones (`catalogoPSF`, por eso CATALOGO.psf es un «getter») ponen primero la prueba más débil frente a la meta y llevan los ritmos y
   repeticiones calculados para esa meta; fases, descargas y afinamiento son los de siempre (plan.js). «Mi rendimiento» (`htmlMiRendimiento`):
   cada prueba con tu marca, la meta según tu edad y sexo (tablas de psf.js), cuánto falta, cuánto mejorar por semana y la proyección
   (`proyeccionPSF`); el resultado de hoy con las tres (`PSF.evaluacion`). Se ve en Mi plan y en Pruebas → Militar Chile (PSF). */
const META_PSF = ['Apto muy bueno', 'Apto'];
OBJ_PLAN.splice(1, 0, {id:'psf', g:'Militar', ic:'🎯', n:'Pruebas de Suficiencia Física (PSF)', subs:META_PSF, d:'2.400 m, abdominales y barras o flexiones: tu prueba más débil primero.'});
/* Fecha sugerida: el comienzo del próximo período (si ya está en curso, en 3 semanas) */
function fechaPSFSugerida(){ const p = PSF.proximoPeriodo(), h = hoyISO(); return p.enCurso ? masDias(h, Math.max(7, Math.min(21, p.dias))) : masDias(h, Math.max(7, p.dias)); }
/* Tu marca actual de cada prueba (lo mejor de los últimos 90 días; si no hay, lo último) y la meta */
function marcasPSF(){
  const pp = perfilPSF(); if(!pp.sexo || pp.edad==null) return null;
  const nivel = S.plan && S.plan.obj==='psf' && S.plan.sub==='Apto' ? 'a' : 'mb', barra = PSF.pruebaBrazos(pp)==='barra';
  const P = [['carrera', 'Carrera 2.400 m', 'psf2400', v=>PSF.carrera(pp, v), true], ['abd', 'Abdominales (1 min)', 'abd1', v=>PSF.abdominales(pp, v), false],
    ['brazos', barra ? 'Barras' : 'Flexiones (1 min)', barra ? 'barras' : 'flex1', v=>PSF.brazos(pp, v), false]];
  return P.map(([k, n, ej, cl, tiempo])=>{
    const vs = valoresDe(ej).sort((a, b)=>a.fecha < b.fecha ? -1 : 1), rec = vs.filter(v=>v.fecha >= hace(90)), L = rec.length ? rec : vs.slice(-1);
    const act = L.length ? (tiempo ? Math.min(...L.map(v=>v.valor)) : Math.max(...L.map(v=>v.valor))) : null, ref = cl(act || (tiempo ? 9999 : 0)), meta = ref[nivel];
    const falta = act==null ? null : tiempo ? Math.max(0, act - meta) : Math.max(0, meta - act);
    const ini = S.plan && S.plan.obj==='psf' ? (vs.filter(v=>v.fecha <= S.plan.desde).pop() || vs[0]) : vs[0];
    const desde = ini ? ini.valor : act, tot = desde==null ? 0 : Math.abs(desde - meta), pct = act==null ? 0 : falta===0 ? 100 : tot ? Math.max(0, Math.min(99, Math.round((1 - falta / tot) * 100))) : 0;
    return {k, n, ej, tiempo, act, meta, falta, nivel:act==null ? null : ref.nivel, pct, nivelMeta:nivel, tramo:ref.tramo};
  });
}
const verMarcaPSF = (m, v)=>v==null ? '—' : m.tiempo ? PSF.verTiempo(Math.round(v)) : Math.round(v) + (m.k==='abd' || m.k==='brazos' ? ' rep.' : '');
/* La prueba más débil: la que tiene más por recorrer frente a la meta (en proporción); sin marca, la carrera */
function debilPSF(M){
  M = M || marcasPSF(); if(!M) return null;
  const sin = M.find(m=>m.act==null); if(sin) return sin.k;
  const r = M.map(m=>[m.k, m.falta / (m.meta || 1)]).sort((a, b)=>b[1] - a[1]);
  return r[0][1] > 0 ? r[0][0] : null;
}
/* Sesiones del plan PSF, en orden de prioridad (con menos días se toman las primeras) */
function catalogoPSF(){
  const M = marcasPSF(), d = debilPSF(M), c = M && M[0], br = M && M[2], ab = M && M[1];
  const ritmo = c && c.meta ? PSF.verTiempo(Math.round(c.meta / 6)) : null, rk = c && c.meta ? PSF.verTiempo(Math.round(c.meta / 2.4 * 1.3)) : null;
  const sub = (m, f)=>m && m.act ? Math.max(1, Math.round(m.act * f)) : null, W = t=>PSF_WODS.find(w=>w.titulo===t);
  const S1 = S_('Intervalos para el 2.400', 45, 8, ritmo ? `6 a 8 × 400 m a ${ritmo} cada uno (el ritmo de tu meta) con 90 s de trote suave.` : '6 a 8 × 400 m al ritmo de tu meta (tiempo meta ÷ 6) con 90 s de trote.', {plantilla:W('Intervalos 2.400'), cap:'Umbral'});
  const S2 = S_('Ritmo 800 × 3', 40, 7, ritmo ? `3 × 800 m un poco más rápido que ${ritmo} cada 400 m, con 2 min de pausa.` : '3 × 800 m un poco más rápido que tu ritmo meta.', {plantilla:W('Ritmo 800 × 3')});
  const S3 = S_('Trote base (zona 2)', 40, 4, rk ? `Continuo cómodo, cerca de ${rk}/km: puedes conversar.` : 'Continuo cómodo: puedes conversar.', {largo:true, plantilla:W('Carrera continua 5 km'), cap:'Aeróbica'});
  const S4 = S_(br && br.k==='brazos' && /Barras/.test(br.n) ? 'Barras y abdominales' : 'Flexiones y abdominales', 35, 7,
    `5 series sin llegar al fallo: ${sub(br, 0.6) ? '≈ ' + sub(br, 0.6) + ' ' + (/Barras/.test(br.n) ? 'barras' : 'flexiones') : 'la mitad de tu máximo de brazos'} y ${sub(ab, 0.6) ? '≈ ' + sub(ab, 0.6) + ' abdominales' : 'la mitad de tus abdominales'}, con 1 min de pausa.`, {plantilla:W('Pirámide de barras y flexiones'), cap:'R. muscular'});
  const S5 = S_('Abdominales 1 minuto × 5', 25, 8, ab && ab.meta ? `5 series de 1 minuto buscando ${ab.meta} o más, con la técnica de la cartilla.` : '5 series de 1 minuto al máximo.', {plantilla:W('Abdominales 1 minuto × 5')});
  const S6 = S_('Barras submáximas (EMOM)', 20, 6, sub(br, 0.5) ? `10 minutos: ${sub(br, 0.5)} repeticiones al comenzar cada minuto.` : 'La mitad de tu máximo cada minuto, 10 minutos.', {plantilla:W('Barras submáximas')});
  const S7 = S_('Circuito resistencia PSF', 35, 8, '4 rondas: 400 m, 25 abdominales, 5 barras y 15 flexiones, sin parar.', {plantilla:W('Circuito resistencia PSF'), cap:'Anaeróbica'});
  const orden = d==='carrera' ? [S1, S4, S3, S2, S5, S7, S6] : d==='abd' ? [S5, S1, S3, S4, S2, S7, S6] : d==='brazos' ? [S4, S1, S3, S6, S5, S2, S7] : [S1, S4, S3, S2, S5, S7, S6];
  return orden;
}
Object.defineProperty(CATALOGO, 'psf', {get:catalogoPSF, enumerable:true});
/* ---------- Mi rendimiento ---------- */
function htmlMiRendimiento(conBoton){
  const M = marcasPSF();
  if(!M) return `<div class="tarjeta mi-rend"><div class="etiqueta">🎯 Mi rendimiento PSF</div><p class="suave chico">Completa tu sexo y fecha de nacimiento en Pruebas → Militar Chile para calcular tus metas.</p></div>`;
  const esPlan = S.plan && S.plan.obj==='psf', fecha = esPlan && S.plan.fecha, sem = fecha ? Math.max(1, diasEntre(hoyISO(), fecha) / 7) : null;
  const d = debilPSF(M), ev = M.every(m=>m.nivel) ? PSF.evaluacion(M.map(m=>m.nivel)) : null, Pj = (typeof proyeccionPSF==='function' && proyeccionPSF()) || [];
  const nomMeta = M[0].nivelMeta==='a' ? 'Apto' : 'Apto muy bueno';
  const fila = m=>{ const pj = Pj.find(x=>x.ej===m.ej), porSem = sem && m.falta ? m.falta / sem : null;
    const pjTxt = pj ? (pj.mejora ? (pj.fechaMeta && m.nivelMeta==='mb' ? 'A este ritmo llegas al ' + pj.fechaMeta.getDate() + ' ' + MESES_C[pj.fechaMeta.getMonth()] : 'Vas mejorando') : 'Estancado: cambia algo') : '';
    return `<div class="mr-fila ${m.k===d ? 'debil' : ''}"><div class="entre"><b>${esc(m.n)}</b>${m.nivel ? `<span class="chip-niv" style="--nc:${m.nivel==='MB' ? 'var(--mb)' : m.nivel==='A' ? 'var(--acento)' : 'var(--na)'}">${PSF.NOMBRES[m.nivel]}</span>` : '<span class="suave chico">sin marca</span>'}</div>
      <div class="mr-num num"><span>Hoy <b>${verMarcaPSF(m, m.act)}</b></span><span>Meta <b>${verMarcaPSF(m, m.meta)}</b></span><span>${m.act==null ? 'Haz un control' : m.falta ? 'Faltan <b>' + verMarcaPSF(m, m.falta) + '</b>' : '<b class="sube">✓ Lograda</b>'}</span></div>
      <div class="barra-logro"><span style="width:${m.pct}%"></span></div>
      ${porSem || pjTxt ? `<div class="suave chico">${porSem ? (m.tiempo ? 'Baja ' + PSF.verTiempo(Math.max(1, Math.round(porSem))) : 'Sube ' + (Math.round(porSem * 10) / 10).toString().replace('.', ',') + ' rep.') + ' por semana para llegar' : ''}${porSem && pjTxt ? ' · ' : ''}${esc(pjTxt)}</div>` : ''}</div>`; };
  const D = M.find(m=>m.k===d);
  return `<div class="tarjeta mi-rend" id="miRend"><div class="entre"><span class="etiqueta">🎯 Mi rendimiento PSF</span><span class="suave chico">meta: ${nomMeta}</span></div>
    ${ev ? `<div class="mr-hoy">Con tus marcas de hoy: <b style="color:${ev==='MB' ? 'var(--mb)' : ev==='A' ? 'var(--acento)' : 'var(--na)'}">${PSF.NOMBRES[ev]}</b>${fecha ? ` · prueba el ${verFecha(fecha)}` : ''}</div>` : ''}
    ${conBoton && D ? fila(D) + `<details class="mr-mas"><summary>Ver las 3 pruebas ›</summary>${M.filter(m=>m!==D).map(fila).join('')}</details>` : M.map(fila).join('')}
    <div class="ahora-txt chico">👉 <b>Ahora:</b> ${D ? (D.act==null ? `haz un control de ${D.n.toLowerCase()} para saber dónde partes.` : `tu prueba más débil es <b>${esc(D.n.toLowerCase())}</b>: ${esPlan ? 'el plan la entrena primero.' : 'arma tu plan PSF para entrenarla primero.'}`) : '¡Tienes las tres metas! Mantén con 2 o 3 sesiones por semana.'}</div>
    <details class="tc-como"><summary>❔ ¿Qué es Mi rendimiento?</summary><p class="chico">Compara tu mejor marca de los últimos 90 días con la meta de la cartilla para tu edad y sexo (tramo ${esc(M[0].tramo)}). Ejemplo: si corres el 2.400 en 11:00 y tu meta es 10:30, te faltan 30 s; con 10 semanas por delante, son 3 s menos por semana.</p></details>
    ${conBoton && !esPlan ? '<button class="btn prim ancho" id="mrPlan">📅 Armar mi plan PSF</button>' : ''}</div>`;
}
function enlazarMiRendimiento(){ if($('#mrPlan')) $('#mrPlan').onclick = ()=>dialogoPlan({obj:'psf', sub:'Apto muy bueno', fecha:fechaPSFSugerida()}); }
/* ---------- Mi rendimiento de combate (24-oct-2026, pedido del usuario: «haz el radar») ----------
   Las 7 capacidades de la doctrina (`nivelesCapacidad` de perfil.js) en un radar con «hace 3 meses» punteado (`radarDoble`, `nivelesEn`),
   el nivel general (promedio de las evaluadas, 1-5), la más baja con qué sesión la entrena y las que faltan medir. El plan «Preparación
   para el combate» pone primero la sesión de la capacidad más baja (CATALOGO.combate pasa a ser un getter). */
const CAP_SESION = {aer:'Aeróbica', umbral:'Umbral', fuerza:'Fuerza', anaer:'Anaeróbica', potencia:'Potencia', rml:'R. muscular'};
function capMasBaja(caps){ const c = (caps || nivelesCapacidad()).filter(x=>x.nivel!=null && CAP_SESION[x.id]).sort((a, b)=>a.nivel - b.nivel)[0]; return c && c.nivel < 4.5 ? c : null; }
const COMBATE_BASE = CATALOGO.combate;
Object.defineProperty(CATALOGO, 'combate', {enumerable:true, get(){
  const c = capMasBaja(), L = COMBATE_BASE.slice(); if(!c) return L;
  const k = L.findIndex(s=>s.cap===CAP_SESION[c.id]); if(k > 0) L.unshift(L.splice(k, 1)[0]);
  return L; }});
function htmlRendCombate(conBoton){
  const caps = nivelesCapacidad(), con = caps.filter(c=>c.nivel!=null), sin = caps.filter(c=>c.nivel==null);
  const prom = con.length ? con.reduce((a, c)=>a + c.nivel, 0) / con.length : null, baja = capMasBaja(caps);
  const antes = typeof nivelesEn==='function' ? nivelesEn(hace(91)) : null, hayAntes = antes && antes.some(c=>c.nivel!=null);
  const sesion = baja && COMBATE_BASE.find(s=>s.cap===CAP_SESION[baja.id]), esPlan = S.plan && S.plan.obj==='combate';
  const colN = n=>n >= 4.5 ? 'var(--mb)' : n >= 3.5 ? '#7bc96f' : n >= 2.5 ? 'var(--acento)' : n >= 1.5 ? '#e0b63c' : 'var(--na)';
  return `<div class="tarjeta mi-rend" id="rendComb"><div class="entre"><span class="etiqueta">🎖️ Mi rendimiento de combate</span><span class="suave chico">${con.length} de 7 medidas</span></div>
    ${prom!=null ? `<div class="rc-nivel"><b class="num" style="color:${colN(prom)}">${fmtNum(Math.round(prom * 10) / 10)}</b><div><b>Nivel ${NIVELES[Math.round(prom)]}</b><div class="suave chico">promedio de tus capacidades (1 a 5; 3 = cumples el estándar)</div></div></div>` : '<p class="suave chico">Aún no hay pruebas para calcular tu nivel. Parte por el 2.400 m o una prueba de la batería.</p>'}
    ${conBoton ? '<details class="mr-mas" id="rcDet"><summary>Ver el radar y las 7 capacidades ›</summary>' : ''}
    <div class="radar-caja">${hayAntes ? radarDoble(antes, caps) : radarCapacidades(caps)}</div>
    ${hayAntes ? '<div class="plan-ley chico" style="justify-content:center"><span><i style="background:var(--acento)"></i>Ahora</span><span><i style="background:var(--suave)"></i>Hace 3 meses</span></div>' : ''}
    <ul class="lista rc-lista">${caps.map(c=>`<li class="rc-item entre" data-rcap="${c.id}"><span>${esc(c.n)}</span>${c.nivel!=null ? `<span class="chip-niv" style="--nc:${colN(c.nivel)}">${NIVELES[Math.round(c.nivel)]}</span>` : '<span class="suave chico">sin medir ›</span>'}</li>`).join('')}</ul>
    ${conBoton ? '</details>' : ''}
    <div class="ahora-txt chico">👉 <b>Ahora:</b> ${baja ? `tu capacidad más baja es <b>${esc(baja.corto.toLowerCase())}</b>${sesion ? `: entrénala con «${esc(sesion.n)}» (${esc(sesion.d.toLowerCase().replace(/\.$/, ''))})` : ''}${esPlan ? ' Tu plan ya la pone primero.' : ''}` : sin.length ? `mide ${esc(sin[0].corto.toLowerCase())} (${esc(sin[0].mide)}) para completar tu radar.` : '¡Todas tus capacidades están en Muy bueno o más! Mantén el plan.'}</div>
    ${sin.length && baja ? `<p class="suave chico" style="margin:4px 0 0">Te falta medir: ${sin.map(c=>esc(c.corto)).join(', ')}.</p>` : ''}
    <details class="tc-como"><summary>❔ ¿Qué es esto?</summary><p class="chico">Son las 7 capacidades físicas del combatiente del método NSCE. Cada una sale de tus pruebas (2.400 m, abdominales, barras, marcha, sprint, evacuación, 1RM, medidas). 3 = cumples el estándar; 4 = lo superas en 10 %; 5 = en 20 %. Ejemplo: si tu sentadilla es 1,3 veces tu peso, tu fuerza queda en «Muy bueno».</p></details>
    ${conBoton && !esPlan ? '<button class="btn ancho" id="rcPlan">📅 Plan de preparación para el combate</button>' : ''}</div>`;
}
function enlazarRendCombate(){
  $$('[data-rcap]').forEach(li=>li.onclick = ()=>{ const c = nivelesCapacidad().find(x=>x.id===li.dataset.rcap); if(c) verCapacidad(c); });
  if($('#rcPlan')) $('#rcPlan').onclick = ()=>dialogoPlan({obj:'combate'});
}
