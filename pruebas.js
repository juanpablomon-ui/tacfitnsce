/* #TACFITNSCE — Pestaña «Pruebas» (23-oct-2026, pedido del usuario: «la PSF es muy enfocada; para alguien que no es militar no sirve»).
   Baterías: Militar Chile (la PSF de siempre, `vPSFMilitar` en app.js), Salud general y Rendimiento; el orden se adapta al objetivo de la
   bienvenida (combate → militar primero). «Edad física»: la edad de una persona promedio con tu capacidad aeróbica (VO₂máx de tu último test
   aeróbico) según los valores de referencia noruegos de Loe y cols. 2013 (PLOS ONE, 3.816 adultos sanos: 20-29 años 54,4 ml/kg/min hombres y
   43,0 mujeres; ≈ −3,5 por década). Normas: flexiones y sentarse y alcanzar del CSEP (Canadá); Cooper (tabla clásica de Cooper);
   salto largo, plancha y fuerza relativa son referencias aproximadas (se dice en pantalla). Resultados en S.tests [{id, t, fecha, v, fc, min}]. */
const NIV_NOM = ['Excelente', 'Muy bueno', 'Bueno', 'Regular', 'Bajo'], NIV_COL = ['var(--mb)', '#7bc96f', 'var(--acento)', '#e0b63c', 'var(--na)'];
const NIV_FUERZA = ['Élite', 'Avanzado', 'Intermedio', 'Novato', 'Principiante'];
/* [hasta edad, [umbrales mínimos de Excelente, Muy bueno, Bueno, Regular]] por sexo */
const NORMAS_T = {
  flex:{H:[[19, [39, 29, 23, 18]], [29, [36, 29, 22, 17]], [39, [30, 22, 17, 12]], [49, [25, 17, 13, 10]], [59, [21, 13, 10, 7]], [200, [18, 11, 8, 5]]],
        M:[[19, [33, 25, 18, 12]], [29, [30, 21, 15, 10]], [39, [27, 20, 13, 8]], [49, [24, 15, 11, 5]], [59, [21, 11, 7, 2]], [200, [17, 12, 5, 2]]]},
  sar:{H:[[19, [39, 34, 29, 24]], [29, [40, 34, 30, 25]], [39, [38, 33, 28, 23]], [49, [35, 29, 24, 18]], [59, [35, 28, 24, 16]], [200, [33, 25, 20, 15]]],
       M:[[19, [43, 38, 34, 29]], [29, [41, 37, 33, 28]], [39, [41, 36, 32, 27]], [49, [38, 34, 30, 25]], [59, [39, 33, 30, 25]], [200, [35, 31, 27, 23]]]},
  cooper:{H:[[29, [2800, 2400, 2200, 1600]], [39, [2700, 2300, 1900, 1500]], [49, [2500, 2100, 1700, 1400]], [200, [2400, 2000, 1600, 1300]]],
          M:[[29, [2700, 2200, 1800, 1500]], [39, [2500, 2000, 1700, 1400]], [49, [2300, 1900, 1500, 1200]], [200, [2200, 1700, 1400, 1100]]]},
  salto:{H:[[200, [250, 241, 231, 221]]], M:[[200, [200, 191, 181, 171]]]},
  plancha:{H:[[200, [180, 120, 90, 60]]], M:[[200, [180, 120, 90, 60]]]},
  hyrox:{menor:true, H:[[200, [3900, 4800, 5700, 6600]]], M:[[200, [4200, 5100, 6000, 6900]]]},
};
/* Adulto mayor (Senior Fitness Test, Rikli y Jones 1999): rango normal (percentil 25 a 75) por edad; en «levantarse y caminar» menos es mejor */
const SFT = {
  silla30:{M:[[64, [12, 17]], [69, [11, 16]], [74, [10, 15]], [79, [10, 15]], [84, [9, 14]], [89, [8, 13]], [200, [4, 11]]], H:[[64, [14, 19]], [69, [12, 18]], [74, [12, 17]], [79, [11, 17]], [84, [10, 15]], [89, [8, 14]], [200, [7, 12]]]},
  curl30:{M:[[64, [13, 19]], [69, [12, 18]], [74, [12, 17]], [79, [11, 17]], [84, [10, 16]], [89, [10, 15]], [200, [8, 13]]], H:[[64, [16, 22]], [69, [15, 21]], [74, [14, 21]], [79, [13, 19]], [84, [13, 19]], [89, [11, 17]], [200, [10, 14]]]},
  cam6:{M:[[64, [498, 604]], [69, [457, 581]], [74, [439, 562]], [79, [398, 535]], [84, [352, 494]], [89, [311, 466]], [200, [251, 402]]], H:[[64, [558, 672]], [69, [512, 640]], [74, [498, 622]], [79, [430, 585]], [84, [407, 553]], [89, [347, 521]], [200, [279, 457]]]},
  levanta:{menor:true, M:[[64, [4.4, 6.0]], [69, [4.8, 6.4]], [74, [4.9, 7.1]], [79, [5.2, 7.4]], [84, [5.7, 8.7]], [89, [6.2, 9.6]], [200, [7.3, 11.5]]], H:[[64, [3.8, 5.6]], [69, [4.3, 5.7]], [74, [4.2, 6.0]], [79, [4.6, 7.2]], [84, [5.2, 7.6]], [89, [5.5, 8.9]], [200, [6.2, 10.0]]]},
};
const NIV_SFT = [['Sobre lo normal', 'var(--mb)'], ['Normal', 'var(--acento)'], ['Bajo lo normal', 'var(--na)']];
function nivelSFT(t, v){ const N = SFT[t]; if(!N || v==null) return null; const f = (N[sexoPF()].find(([h])=>edadPF() <= h) || N[sexoPF()].slice(-1)[0])[1];
  return N.menor ? (v < f[0] ? 0 : v <= f[1] ? 1 : 2) : (v > f[1] ? 0 : v >= f[0] ? 1 : 2); }
/* AFT (Ejército de EE.UU., desde junio 2025): mínimo para 60 puntos y máximo de 100 puntos, referencia 17-21 años, estándar de combate (hombres) */
const AFT_REF = {aft_pm:{min:68, max:154, u:'kg'}, aft_flex:{min:15, max:58}, aft_sdc:{min:148, max:89, menor:true}, aft_plancha:{min:90, max:220}, aft_2m:{min:1197, max:802, menor:true}};
const TESTS = {
  silla30:{n:'Pararse de la silla en 30 segundos', u:'repeticiones', mide:'Fuerza de piernas (levantarse, subir escaleras)', ref:'Rikli y Jones 1999', sft:true,
    como:['Silla de 43 cm de alto contra la pared; brazos cruzados sobre el pecho.', 'Párate del todo y vuelve a sentarte, lo más rápido que puedas, durante 30 segundos.', 'Con alguien al lado por seguridad.']},
  curl30:{n:'Flexión de brazo en 30 segundos', u:'repeticiones', mide:'Fuerza de brazos (cargar bolsas, levantar)', ref:'Rikli y Jones 1999', sft:true,
    como:['Sentado, mancuerna de 2,3 kg (mujeres) o 3,6 kg (hombres) en la mano dominante.', 'Flexiona el codo completo y baja, durante 30 segundos.']},
  cam6:{n:'Caminata de 6 minutos', u:'metros', mide:'Resistencia aeróbica', ref:'Rikli y Jones 1999', sft:true,
    como:['Circuito plano y medido (por ejemplo, un rectángulo de 45 m).', 'Camina lo más rápido que puedas sin correr durante 6 minutos; puedes detenerte si lo necesitas.']},
  levanta:{n:'Levantarse, caminar 2,4 m y volver', u:'segundos', mide:'Agilidad y equilibrio (prevenir caídas)', ref:'Rikli y Jones 1999', sft:true, dec:true,
    como:['Sentado en una silla; un cono a 2,4 m.', 'A la señal, levántate, camina rápido alrededor del cono y vuelve a sentarte. Mejor de 2 intentos (menos es mejor).']},
  aft_pm:{n:'Peso muerto 3 repeticiones máximas', u:'kg', mide:'Fuerza de piernas y espalda', ref:'AFT 2025', aft:true,
    como:['Con barra hexagonal (de 27 kg).', 'El mayor peso que levantes 3 veces seguidas con buena técnica.']},
  aft_flex:{n:'Flexiones con despegue de manos (2 min)', u:'repeticiones', mide:'Resistencia de brazos y pecho', ref:'AFT 2025', aft:true,
    como:['Abajo, pecho al suelo: despega las manos del suelo y vuelve a apoyarlas.', 'Sube con el cuerpo recto. Las que hagas bien en 2 minutos.']},
  aft_sdc:{n:'Sprint-arrastre-acarreo (5 × 50 m)', u:'min:seg', mide:'Capacidad anaeróbica y fuerza en movimiento', ref:'AFT 2025', aft:true, tiempo:true,
    como:['Ida y vuelta de 25 m, cinco veces: sprint, arrastre de trineo de 41 kg, desplazamiento lateral, acarreo de 2 pesas rusas de 18 kg y sprint.', 'Lo más rápido posible.']},
  aft_plancha:{n:'Plancha (AFT)', u:'min:seg', mide:'Resistencia del tronco', ref:'AFT 2025', aft:true, tiempo:true,
    como:['Apoyo en antebrazos, cuerpo recto de hombros a tobillos.', 'Tanto como puedas sin perder la postura.']},
  aft_2m:{n:'Carrera de 3,2 km (2 millas)', u:'min:seg', mide:'Resistencia aeróbica', ref:'AFT 2025', aft:true, tiempo:true,
    como:['En pista o terreno plano medido, lo más rápido posible.']},
  hyrox:{n:'Simulación HYROX completa', u:'h:mm:ss', mide:'Resistencia híbrida: carrera + fuerza', ref:'referencia aproximada (tiempos habituales de 60 a 90+ minutos)', tiempo:true,
    como:['8 veces: 1 km de carrera y luego una estación, en este orden:', '1) SkiErg 1.000 m · 2) Empujar trineo 50 m (Open: 152 kg hombres / 102 kg mujeres, con el trineo) · 3) Tirar trineo 50 m (103 / 78 kg)',
      '4) Burpees con salto largo 80 m · 5) Remo 1.000 m · 6) Caminata del granjero 200 m (2 × 24 / 2 × 16 kg)', '7) Zancadas con saco 100 m (20 / 10 kg) · 8) 100 wall balls (6 / 4 kg).', 'Anota el tiempo total.']},
  flex:{n:'Flexiones en 1 minuto', u:'repeticiones', mide:'Fuerza y resistencia del tren superior', ref:'CSEP (Canadá)',
    como:['Manos al ancho de hombros, cuerpo recto.', 'Baja hasta que el pecho quede a un puño del suelo y sube estirando los brazos.', 'Mujeres: con apoyo de rodillas (así está hecha la tabla).', 'Cuenta las que haces bien en 1 minuto; puedes descansar arriba.']},
  plancha:{n:'Plancha (tiempo máximo)', u:'segundos', mide:'Resistencia del tronco', ref:'referencia aproximada', tiempo:true,
    como:['Apoyo en antebrazos y puntas de pies, cuerpo en línea recta.', 'Mantén sin dejar caer la cadera. Se termina cuando pierdes la postura.']},
  sar:{n:'Sentarse y alcanzar', u:'cm', mide:'Flexibilidad de la parte posterior de piernas y espalda baja', ref:'CSEP (Canadá)',
    como:['Sentado, piernas estiradas y plantas contra un cajón; el cero de la regla queda 26 cm antes de los pies (como el cajón del CSEP).', 'Estira los brazos hacia adelante, despacio, sin rebotes. Anota la mejor de 2 intentos.']},
  rockport:{n:'Caminata de 1,6 km (Rockport)', u:'min:seg', mide:'Capacidad aeróbica (para quien no corre)', ref:'Kline y cols. 1987', tiempo:true, fc:true,
    como:['Camina 1,6 km (1 milla) lo más rápido que puedas, sin correr, en terreno plano.', 'Al llegar, mide tu pulso: cuenta 15 segundos y multiplica por 4.']},
  cooper:{n:'Test de Cooper (12 minutos)', u:'metros', mide:'Capacidad aeróbica', ref:'Cooper',
    como:['Corre (o trota y camina) la mayor distancia posible en 12 minutos, en pista o terreno plano medido.', 'Calienta 10 minutos antes.']},
  navette:{n:'Course Navette (20 m)', u:'palier', mide:'Capacidad aeróbica con cambios de dirección', ref:'Léger y cols. 1988',
    como:['Ida y vuelta entre dos líneas a 20 m siguiendo los pitidos; cada minuto se acelera (palier).', 'Anota el último palier que completaste.']},
  salto:{n:'Salto largo sin impulso', u:'cm', mide:'Potencia de piernas', ref:'referencia aproximada',
    como:['Pies juntos detrás de la línea; impulso con brazos y salta lo más lejos posible.', 'Se mide hasta el talón más cercano. Mejor de 3 intentos.']},
};
const BATERIAS = [
  {id:'psf', n:'Militar Chile (PSF)', d:'Pruebas de Suficiencia Física del Ejército'},
  {id:'salud', n:'Salud general', d:'Para cualquier persona', tests:['flex', 'plancha', 'sar', 'rockport']},
  {id:'rend', n:'Rendimiento', d:'Deportistas y corredores', tests:['cooper', 'navette', 'salto', 'fuerza']},
  {id:'mayor', n:'Adulto mayor (60+)', d:'Pruebas funcionales para la vida diaria (Senior Fitness Test). Hazlas con alguien al lado y sin forzar', tests:['silla30', 'curl30', 'cam6', 'levanta']},
  {id:'aft', n:'Ejército EE.UU. (AFT)', d:'La prueba física del Ejército de Estados Unidos (desde junio de 2025): se aprueba con 60 puntos en cada una', tests:['aft_pm', 'aft_flex', 'aft_sdc', 'aft_plancha', 'aft_2m']},
  {id:'hibrido', n:'Híbrido', d:'Carrera más fuerza, como las competencias HYROX, y tus WOD de referencia', tests:['hyrox', 'bench']},
];
const edadPF = ()=>{ const e = typeof perfilPSF==='function' ? perfilPSF().edad : null; return e==null ? 30 : e; };
const sexoPF = ()=>S.perfil.sexo==='M' ? 'M' : 'H';
function nivelTest(t, v){
  const N = NORMAS_T[t]; if(!N || v==null) return null;
  const fila = N[sexoPF()].find(([h])=>edadPF() <= h) || N[sexoPF()].slice(-1)[0], u = fila[1], i = u.findIndex(x=>N.menor ? v <= x : v >= x);
  return i < 0 ? 4 : i;
}
/* VO₂máx estimado de un test aeróbico */
function vo2Test(r){
  if(!r) return null;
  if(r.t==='cooper') return (r.v - 504.9) / 44.73;
  if(r.t==='navette'){ const vel = 8 + 0.5 * r.v; return 6 * vel - 24.4; }
  if(r.t==='rockport' && r.fc){ const kg = medidaReciente('peso') || 75;
    return 132.853 - 0.0769 * kg * 2.20462 - 0.3877 * edadPF() + 6.315 * (sexoPF()==='H' ? 1 : 0) - 3.2649 * r.v / 60 - 0.1565 * r.fc; }
  return null;
}
/* VO₂ más reciente: tests aeróbicos de esta pestaña o la carrera de 2.400 m (483 ÷ minutos + 3,5) */
function vo2Reciente(){
  const c = (S.tests || []).filter(r=>vo2Test(r)!=null).map(r=>({f:r.fecha, v:vo2Test(r), de:TESTS[r.t].n}));
  const m = (S.marcas || []).filter(x=>x.ej==='psf2400').map(x=>({f:x.fecha, v:483 / (x.valor / 60) + 3.5, de:'Carrera 2.400 m'}));
  return c.concat(m).sort((a, b)=>a.f < b.f ? 1 : -1)[0] || null;
}
function edadFisica(){
  const r = vo2Reciente(); if(!r) return null;
  const ref = sexoPF()==='M' ? 43.0 : 54.4, ef = Math.round(Math.min(90, Math.max(18, 25 + (ref - r.v) / 3.5 * 10)));
  return {ef, vo2:Math.round(r.v * 10) / 10, de:r.de, fecha:r.f, edad:edadPF()};
}
function htmlEdadFisica(){
  const E = edadFisica(), real = typeof perfilPSF==='function' ? perfilPSF().edad : null;
  if(!E) return `<div class="tarjeta edad-fis"><div class="etiqueta">Tu edad física</div><p>Haz el <b>test de Cooper</b> (Rendimiento) o la <b>caminata de 1,6 km</b> (Salud) y te digo cuántos años «tiene» tu corazón.</p></div>`;
  const dif = real!=null ? real - E.ef : null;
  return `<div class="tarjeta edad-fis"><div class="entre"><span class="etiqueta">Tu edad física</span><span class="suave chico">${esc(E.de)} · ${verFecha(E.fecha)}</span></div>
    <div class="ef-num"><b class="num">${E.ef}${E.ef===18 ? '<small>o menos</small>' : ''}</b><span>años${real!=null ? ` · tienes ${real}` : ''}</span></div>
    <p class="chico">${dif==null ? '' : dif >= 3 ? `Tu capacidad aeróbica es la de alguien ${dif} años menor. ¡Bien!` : dif <= -3 ? `Tu capacidad aeróbica es la de alguien ${-dif} años mayor: el trabajo aeróbico (zona 2, intervalos) la baja rápido.` : 'Estás en el promedio de tu edad.'}
      VO₂máx estimado ${fmtNum(E.vo2)} ml/kg/min.</p>
    <p class="nota">Comparado con adultos sanos de Noruega (Loe y cols. 2013), una de las poblaciones más en forma del mundo: es una comparación exigente, por eso puede salir mayor aunque tus tests salgan bien. Es una estimación, no un examen médico.</p></div>`;
}
/* Fuerza relativa (1RM ÷ peso), desde los máximos que ya registraste */
const FUERZA_REL = {H:{sentadilla:[2.5, 2, 1.5, 1.25], peso_muerto:[3, 2.5, 2, 1.5], banca:[2, 1.5, 1.25, 1]}, M:{sentadilla:[2, 1.5, 1.25, 1], peso_muerto:[2.5, 2, 1.5, 1.25], banca:[1.25, 1, 0.75, 0.5]}};
function htmlFuerzaRel(){
  const kg = medidaReciente('peso'), U = FUERZA_REL[sexoPF()];
  const filas = Object.keys(U).map(id=>{ const rm = typeof rm1De==='function' ? rm1De(id) : null, mv = movDe(id);
    if(!rm || !kg) return `<li class="item"><div class="entre"><span>${esc(nomMov(mv))}</span><span class="suave chico">${kg ? 'registra tu máximo' : ''}</span></div></li>`;
    const r = rm / kg, i = U[id].findIndex(x=>r >= x), n = i < 0 ? 4 : i;
    return `<li class="item"><div class="entre"><span>${esc(nomMov(mv))}</span><span class="num"><b>${fmtNum(Math.round(r * 100) / 100)}×</b> tu peso <span class="chip-niv" style="--nc:${NIV_COL[n]}">${NIV_FUERZA[n]}</span></span></div><div class="suave chico num">1RM ${fmtNum(Math.round(rm))} kg</div></li>`; }).join('');
  return `<div class="tarjeta test-card"><div class="entre"><span class="titulo">Fuerza relativa</span><span class="suave chico">tu máximo ÷ tu peso</span></div>
    <p class="suave chico">Sale sola de tus registros (máximo real o estimado). ${kg ? '' : 'Anota tu peso en Perfil → Medidas.'}</p><ul class="lista">${filas}</ul>
    <p class="nota">Referencia aproximada (bases de datos de levantadores: Strength Level, StrengthLog).</p></div>`;
}
function verValorTest(t, r){ const T = TESTS[t]; return T.tiempo ? PSF.verTiempo(r.v) : fmtNum(r.v) + ' ' + (t==='navette' ? '(palier)' : T.u); }
const verRefAFT = (v, T)=>T.tiempo ? PSF.verTiempo(v) : fmtNum(v) + (T.u==='kg' ? ' kg' : '');
function chipAFT(v, A){ const ok = A.menor ? v <= A.min : v >= A.min, top = A.menor ? v <= A.max : v >= A.max;
  return `<span class="chip-niv" style="--nc:${top ? 'var(--mb)' : ok ? 'var(--acento)' : 'var(--na)'}">${top ? '100 pts' : ok ? 'Aprueba (60+)' : 'Bajo el mínimo'}</span>`; }
/* Tus WOD de referencia (de tus registros) */
const BENCH = ['Fran', 'Grace', 'Helen', 'Cindy', 'Murph', 'DT'];
function htmlBenchmarks(){
  const fila = n=>{ const ss = S.sesiones.filter(x=>x.titulo===n), b = mejorDe('wod:' + n), M = typeof metaWod==='function' ? metaWod(POPULARES.find(p=>p.titulo===n) || {}) : null;
    return `<li class="item"><div class="entre"><span><b>${esc(n)}</b> <span class="suave chico">${M ? textoMeta(M) : ''}</span></span><span class="num">${b ? `<b>${esc(b.txt)}</b> Rx` : ss.length ? esc(resCorto(ss.slice(-1)[0])) + (ss.slice(-1)[0].nivel ? ' · ' + NOM_NIVEL[ss.slice(-1)[0].nivel] : '') : '<span class="suave">sin registro</span>'}</span></div></li>`; };
  return `<div class="tarjeta test-card" id="tc_bench"><div class="entre"><span class="titulo">Tus WOD de referencia</span><span class="suave chico">de tus registros</span></div>
    <p class="suave chico">Repítelos cada cierto tiempo para ver tu avance. Se registran con el botón ＋ (Biblioteca → Clásicos).</p><ul class="lista">${BENCH.map(fila).join('')}</ul></div>`;
}
function htmlTest(t){
  if(t==='fuerza') return htmlFuerzaRel();
  if(t==='bench') return htmlBenchmarks();
  const T = TESTS[t], H = (S.tests || []).filter(r=>r.t===t).sort((a, b)=>a.fecha < b.fecha ? 1 : -1), u = H[0];
  const n = u ? nivelTest(t, u.v) : null, vo = u ? vo2Test(u) : null, ns = u && T.sft ? nivelSFT(t, u.v) : null, A = T.aft && AFT_REF[t];
  const chip = n!=null ? `<span class="chip-niv" style="--nc:${NIV_COL[n]}">${NIV_NOM[n]}</span>` : ns!=null ? `<span class="chip-niv" style="--nc:${NIV_SFT[ns][1]}">${NIV_SFT[ns][0]}</span>` : u && A ? chipAFT(u.v, A) : '';
  return `<div class="tarjeta test-card" id="tc_${t}"><div class="entre"><span class="titulo">${esc(T.n)}</span>${chip}</div>
    <div class="suave chico">${esc(T.mide)}</div>
    ${u ? `<div class="tc-ult num"><b>${esc(verValorTest(t, u))}</b> <span class="suave chico">${verFecha(u.fecha)}${vo!=null ? ' · VO₂máx ' + fmtNum(Math.round(vo * 10) / 10) : ''}</span>${H[1] ? `<span class="suave chico"> · antes ${esc(verValorTest(t, H[1]))}</span>` : ''}</div>${htmlProximaTest(t)}` : ''}
    ${A ? `<div class="suave chico num">Mínimo (60 pts): <b>${verRefAFT(A.min, T)}</b> · máximo (100 pts): <b>${verRefAFT(A.max, T)}</b></div>` : ''}
    <details class="tc-como"><summary>Cómo se hace</summary><ol>${T.como.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p class="nota">Tabla: ${esc(T.ref)}${NORMAS_T[t] || T.sft ? ' · según tu edad y sexo' : ''}${A ? ' · referencia para 17-21 años, estándar de combate; las tablas oficiales cambian según la edad y el sexo' : ''}${T.sft ? ' · rango normal = la mitad central de las personas de tu edad' : ''}.</p></details>
    <div class="fila tc-in"><div><label>${T.tiempo ? 'Tiempo (min:seg)' : esc(T.u[0].toUpperCase() + T.u.slice(1))}</label><input data-tv="${t}" ${T.tiempo ? 'data-tiempo inputmode="numeric" placeholder="ej.: 1530 → 15:30"' : 'inputmode="decimal"'}${T.dec ? ' placeholder="ej.: 5,8"' : ''}></div>
      ${T.fc ? `<div><label>Pulso al terminar</label><input data-tfc="${t}" inputmode="numeric" placeholder="lat/min"></div>` : ''}</div>
    <button class="btn ancho" data-tok="${t}">Guardar resultado</button></div>`;
}
let bateriaSel = null;
function ordenBaterias(){
  const B = id=>BATERIAS.find(b=>b.id===id), mil = !S.perfil.objBien || S.perfil.objBien==='combate' || S.perfil.servicios || (S.controles || []).length;
  const e = typeof perfilPSF==='function' ? perfilPSF().edad : null;
  if(e!=null && e >= 60 && !mil) return ['mayor', 'salud', 'rend', 'hibrido', 'psf', 'aft'].map(B);
  return (mil ? ['psf', 'aft', 'salud', 'rend', 'hibrido', 'mayor'] : ['salud', 'rend', 'hibrido', 'mayor', 'psf', 'aft']).map(B);
}
function htmlCabPruebas(){
  const B = ordenBaterias(), sel = bateriaSel || pref('bateria') || B[0].id;
  return `<div class="pr-cab"><h2>Pruebas</h2>${htmlEdadFisica()}
    ${htmlSelRepetir()}<div class="chips pr-bat" id="prBat">${B.map(b=>`<button data-bat="${b.id}" class="${b.id===sel ? 'activa' : ''}">${esc(b.n)}</button>`).join('')}</div></div>`;
}
/* Vista de la pestaña: la PSF usa su pantalla de siempre con la cabecera arriba */
function vPSF(){
  const B = ordenBaterias(); bateriaSel = bateriaSel || pref('bateria') || B[0].id; if(!BATERIAS.some(b=>b.id===bateriaSel)) bateriaSel = B[0].id;
  if(bateriaSel==='psf'){ vPSFMilitar(); $('#vista').insertAdjacentHTML('afterbegin', htmlCabPruebas()); }
  else { const b = BATERIAS.find(x=>x.id===bateriaSel);
    $('#vista').innerHTML = htmlCabPruebas() + `<p class="suave chico">${esc(b.d)}. Repite cada prueba en las mismas condiciones (hora, lugar, descanso) para ver tu progreso: te aviso en Inicio cuando toque.</p>${b.tests.map(htmlTest).join('')}`;
    $$('[data-tok]').forEach(x=>x.onclick = ()=>{ const t = x.dataset.tok, T = TESTS[t], inp = $(`[data-tv="${t}"]`), v = T.tiempo ? PSF.leerTiempo(inp.value) : num(inp.value);
      if(v==null || v <= 0){ aviso('Anota el resultado'); inp.focus(); return; }
      const fc = T.fc ? ent(($(`[data-tfc="${t}"]`) || {}).value) : null; if(T.fc && !fc){ aviso('Anota tu pulso al terminar'); return; }
      const ant = (S.tests || []).filter(r=>r.t===t).sort((a, b)=>a.fecha < b.fecha ? 1 : -1)[0], nuevo = {id:uid(), t, fecha:hoyISO(), v, fc:fc || undefined}, m = mejoraTest(t, nuevo, ant);
      S.tests = (S.tests || []).concat([nuevo]); if(S.posponerPrueba) delete S.posponerPrueba[t]; guardar();
      aviso(m ? (m.mejor ? '💪 ¡' + m.txt[0].toUpperCase() + m.txt.slice(1) + '!' : 'Resultado guardado · ' + m.txt) : 'Resultado guardado · próxima: ' + verFecha(proximaPrueba(nuevo.fecha).fecha)); vPSF(); }); }
  enlazarSelRepetir(vPSF);
  $$('[data-bat]').forEach(x=>x.onclick = ()=>{ bateriaSel = x.dataset.bat; pref('bateria', bateriaSel); vPSF(); window.scrollTo(0, 0); });
}
