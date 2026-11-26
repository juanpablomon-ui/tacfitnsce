/* #NSCE — «🌱 Empezar a entrenar» (19-nov-2026, propuesta aprobada por el usuario: GRATIS y de 8 semanas). Para quien recién empieza o vuelve.
   Objetivo de Mi plan `empezar` (grupo «Para empezar», el primero), con enfoque (sub) «Caminar y trotar» o «Solo caminar»; 2 a 4 días por semana.
   Tres sesiones que se turnan: Fuerza con tu peso (de sentarse en una silla y flexiones en una mesa a sentadilla y flexiones con rodillas),
   Caminar y trotar (de 6 × 1 min de trote a 20 min seguidos, como los planes «del sillón a 5 km») o caminata rápida, y «Mi primer WOD» (circuito
   suave con el reloj); con 4 días se suma una caminata larga. Semana 4 más suave. Semana 1 y 8: prueba simple (Pruebas → Salud general: flexiones,
   plancha y caminata de 1,6 km) para ver cuánto mejoró; al terminar sugiere el plan siguiente (esos sí son de Plus). Lo usan plan.js
   (infoSemana, planCrudo, dialogoPlan, vPlan), app.js (planEnFoco, foco de hoy), programa.js y bienvenida.js. Prueba t72. */
OBJ_PLAN.unshift({id:'empezar', g:'Para empezar', ic:'🌱', n:'Empezar a entrenar', subs:['Caminar y trotar', 'Solo caminar'], gratis:true,
  d:'8 semanas para crear el hábito: fuerza con tu peso, caminar o trotar y tu primer WOD. Gratis.'});
FASES.apr = ['Aprender', '#7fd36a']; FASES.ava = ['Avanzar', '#35b6e8'];
const SEM_EMP = 8;
/* Mi plan es Plus, salvo este (plus.js): el resto de la app pregunta con planLibre() */
const planLibre = ()=>esPlus() || !!(S.plan && S.plan.obj==='empezar');
const finEmpezar = P=>masDias(P.inicio, SEM_EMP * 7 - 1);
function infoEmpezar(i){ return {fase:i < 4 ? 'apr' : 'ava', desc:i===3, p:Math.min(1, Math.max(0, i / (SEM_EMP - 1))), N:SEM_EMP}; }

/* ---------- Cómo se hace cada ejercicio, con su versión más fácil («❔ ¿Qué es?») ---------- */
const COMO_EMP = {
  sentadilla_silla:['Siéntate en una silla y párate sin ayudarte con las manos. Pies al ancho de la cadera, pecho arriba, rodillas en la línea de la punta del pie.', 'Más fácil: una silla más alta, o apóyate con las manos en los muslos.'],
  sentadilla_aire:['Baja como si te sentaras atrás hasta que la cadera quede a la altura de la rodilla (o lo que puedas) y sube empujando el suelo.', 'Más fácil: vuelve a la sentadilla a la silla.'],
  flexiones_incl:['Manos en el borde de una mesa firme o en la pared, cuerpo recto de cabeza a talones. Baja el pecho hasta el borde y empuja.', 'Más fácil: más cerca de la pared, más vertical.'],
  flexiones_rod:['En el suelo con las rodillas apoyadas, manos bajo los hombros y la espalda recta. Baja el pecho casi al suelo y empuja.', 'Más fácil: vuelve a la mesa.'],
  puente_gluteo:['Acostado de espalda, rodillas dobladas y pies apoyados. Sube la cadera apretando los glúteos, aguanta 1 s arriba y baja lento.', 'Más fácil: sube menos.'],
  remo_toalla:['Pasa una toalla o banda por un pilar o la manilla de una puerta bien cerrada, tómala con las dos manos, inclínate atrás con el cuerpo recto y tira el pecho hacia las manos.', 'Más fácil: el cuerpo más vertical (los pies más atrás).'],
  plancha:['Antebrazos en el suelo bajo los hombros y cuerpo recto: aprieta el abdomen y los glúteos; respira normal.', 'Más fácil: con las rodillas apoyadas.'],
  tijeras:['Salta abriendo piernas y brazos y vuelve a cerrar, suave sobre la punta de los pies.', 'Más fácil (sin saltar): abre un pie al lado cada vez mientras subes los brazos.'],
  subida_cajon:['Sube a un escalón o cajón bajo con un pie, termina de pie arriba y baja con el mismo pie; luego el otro.', 'Más fácil: un escalón más bajo y apoyándote en la pared.'],
  escaladores:['En posición de flexión, lleva una rodilla al pecho y luego la otra, a ritmo cómodo.', 'Más fácil: las manos en una silla o mesa.'],
};
/* ---------- Las 8 semanas (índice 0 a 7) ---------- */
const EMP = {
  series:[2, 2, 3, 2, 3, 3, 3, 3], reps:[8, 10, 10, 8, 10, 12, 12, 12], plancha:['0:20', '0:20', '0:25', '0:20', '0:30', '0:30', '0:40', '0:45'], minF:[20, 25, 25, 20, 30, 30, 35, 35],
  // caminar y trotar: [rondas, trote (s), caminata (s)]; la semana 8 = 20 min seguidos
  ct:[[6, 60, 120], [6, 90, 120], [5, 120, 90], [5, 120, 120], [4, 240, 90], [3, 360, 120], [2, 600, 120], [1, 1200, 0]],
  cam:[20, 25, 25, 20, 30, 35, 40, 45], wod:[8, 10, 10, 8, 12, 12, 15, 15], largo:[30, 30, 35, 30, 40, 40, 45, 50],
};
const mmss = s=>Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
const soloCaminar = ()=>S.plan && S.plan.sub==='Solo caminar';
function fuerzaEmp(i){
  const avanza = i >= 4, rep = String(EMP.reps[i]);
  return {titulo:'Fuerza con tu peso · semana ' + (i + 1), estilo:'calidad', params:{rondas:String(EMP.series[i])},
    main:[Mv(avanza ? 'sentadilla_aire' : 'sentadilla_silla', {reps:rep}), Mv(avanza ? 'flexiones_rod' : 'flexiones_incl', {reps:String(Math.max(5, EMP.reps[i] - 2))}),
      Mv('puente_gluteo', {reps:rep}), Mv('remo_toalla', {reps:rep}), Mv('plancha', {tiempo:EMP.plancha[i]})],
    estrategia:`${EMP.series[i]} vueltas a los 5 ejercicios, 1 min de pausa entre vueltas. Lento y bien hecho vale más que rápido. ${avanza ? 'Esta semana pasas a la sentadilla completa y a las flexiones con rodillas: si cuesta mucho, vuelve a la versión de la silla y la mesa.' : 'Antes: 5 min de caminata o movilidad para entrar en calor.'}`};
}
function trotarEmp(i){
  if(soloCaminar()) return {titulo:'Caminata rápida ' + EMP.cam[i] + ' min', uno:{mov:'caminata', tiempo:EMP.cam[i] + ':00'},
    estrategia:`Paso rápido: puedes hablar, pero no cantar. ${i >= 4 ? 'Incluye 3 o 4 subidas (cuestas o escaleras) a paso firme.' : 'Si te cansas, baja el paso, pero no te detengas.'}`};
  const [r, t, c] = EMP.ct[i];
  if(!c) return {titulo:'Trote 20 min seguidos', uno:{mov:'trote_z2', tiempo:'20:00'}, estrategia:'¡La meta del plan! 5 min caminando, 20 min de trote suave sin parar y 5 min caminando. Tan lento como necesites: lo que importa es no parar.'};
  return {titulo:`Caminar y trotar ${r} × ${mmss(t)}`, estilo:'intervalos', params:{rondas:String(r), trabajo:String(t), descanso:String(c)}, main:[Mv('trote_z2')],
    estrategia:`5 min caminando para entrar en calor. Luego ${r} veces: ${mmss(t)} de trote suave y ${mmss(c)} caminando (la pausa es caminando, no detenido). Termina con 5 min caminando. Trota tan lento que puedas conversar.`};
}
function wodEmp(i){
  const avanza = i >= 4, bajo = soloCaminar();
  return {titulo:'Mi primer WOD · ' + EMP.wod[i] + ' min', estilo:'amrap', params:{minutos:String(EMP.wod[i])},
    main:[Mv(avanza ? 'sentadilla_aire' : 'sentadilla_silla', {reps:'10'}), Mv(avanza ? 'flexiones_rod' : 'flexiones_incl', {reps:'6'}), Mv(bajo ? 'subida_cajon' : 'tijeras', {reps:bajo ? '10' : '20'}), Mv('escaladores', {reps:'10'})],
    estrategia:`Tu primer WOD con el reloj: en ${EMP.wod[i]} minutos haz todas las vueltas que puedas, a un ritmo que puedas mantener (esfuerzo 6 de 10). Toca «＋1» en el reloj al terminar cada vuelta y anota las vueltas al final.`};
}
const largoEmp = i=>({titulo:'Caminata larga ' + EMP.largo[i] + ' min', uno:{mov:'caminata', tiempo:EMP.largo[i] + ':00'}, estrategia:'Paso cómodo, al aire libre si puedes. Suma minutos sin cansarte: es la base de todo lo demás.'});
const PRUEBA_EMP = (fin)=>({n:fin ? '🏁 Prueba final' : '📋 Prueba de inicio', min:30, rpe:6, prueba:true,
  d:(fin ? 'Repite tus 3 pruebas del comienzo para ver cuánto mejoraste' : 'Anota cómo partes, para comparar en la semana 8') + ': flexiones en 1 minuto, plancha y caminata de 1,6 km (Pruebas → Salud general).'});
/* Plan de un día (lo llama planCrudo en plan.js) */
/* El último día de entrenamiento de la semana 8 (la prueba final) */
function ultimoDiaEmp(P, dias){   // nunca el día del trote (la meta del plan: 20 min seguidos)
  const tipos = dias.length >= 4 ? ['f', 'c', 'w', 'l'] : dias.length===3 ? ['f', 'c', 'w'] : ['f', 'c'];
  for(let n = SEM_EMP * 7 - 1; n >= (SEM_EMP - 1) * 7; n--){ const f = masDias(P.inicio, n), k = dias.indexOf((new Date(f + 'T12:00:00').getDay() + 6) % 7); if(k >= 0 && tipos[k]!=='c') return f; }
  return null; }
function planEmpezar(f, i, W, dow, base){
  const P = S.plan;
  if(i < 0 || i >= SEM_EMP) return {tipo:'fuera'};
  const dias = (P.diasSem || DIAS_DEF[P.dias] || DIAS_DEF[3]).slice().sort((a, b)=>a - b), k = dias.indexOf(dow);
  if(f===P.inicio) return Object.assign(base, {tipo:'sesion', ses:PRUEBA_EMP(false)});   // el primer día: la prueba, aunque no sea día de entrenamiento
  if(k < 0) return Object.assign(base, {tipo:'descanso'});
  if(f===ultimoDiaEmp(P, dias)) return Object.assign(base, {tipo:'sesion', ses:PRUEBA_EMP(true)});
  const tipos = dias.length >= 4 ? ['f', 'c', 'w', 'l'] : dias.length===3 ? ['f', 'c', 'w'] : ['f', 'c'], t = tipos[k] || 'c';
  const pl = t==='f' ? fuerzaEmp(i) : t==='c' ? trotarEmp(i) : t==='w' ? wodEmp(i) : largoEmp(i);
  const min = t==='f' ? EMP.minF[i] : t==='c' ? (soloCaminar() ? EMP.cam[i] : Math.round(EMP.ct[i][0] * (EMP.ct[i][1] + EMP.ct[i][2]) / 60) + 10) : t==='w' ? EMP.wod[i] + 10 : EMP.largo[i];
  const rpe = t==='l' ? 3 : t==='w' ? 6 : W.desc ? 4 : 5;
  const d = {f:'Sentadilla, flexiones, puente de glúteo, remo con toalla y plancha.', c:soloCaminar() ? 'Caminata a paso rápido.' : 'Trote suave con pausas caminando.', w:'Un circuito suave con el reloj: tu primer WOD.', l:'Paso cómodo; suma minutos.'}[t];
  return Object.assign(base, {tipo:'sesion', ses:{n:pl.titulo, min:r5(min), rpe, d, plantilla:pl, cap:{f:'Fuerza', c:'Aeróbica', w:'Funcional', l:'Aeróbica'}[t]}});
}
/* Crear el plan (desde Mi plan, la bienvenida o el Inicio). Parte el lunes de esta semana si hoy es lunes a miércoles; si no, el próximo lunes. */
function nuevoPlanEmpezar(sub, diasSem){
  const hoy = hoyISO(), ini = hoy;   // 20-nov-2026 (prueba de usuaria nueva): parte HOY, con la prueba de inicio; antes esperaba al lunes
  const ds = (diasSem && diasSem.length ? diasSem : DIAS_DEF[3]).slice().sort((a, b)=>a - b);
  return {obj:'empezar', sub:sub || 'Caminar y trotar', fecha:null, inicio:ini, desde:hoy, dias:ds.length, diasSem:ds, swaps:[]};
}
/* ---------- Tarjeta en Mi plan: avance, pruebas antes y después, cómo se hace cada ejercicio y el plan siguiente ---------- */
const TESTS_EMP = [['flex', 'Flexiones en 1 min', ''], ['plancha', 'Plancha', 's'], ['rockport', 'Caminata 1,6 km', 's']];
function pruebasEmp(){
  const P = S.plan, fin = finEmpezar(P), L = S.tests || [];
  return TESTS_EMP.map(([id, n, u])=>{ const vs = L.filter(t=>t.id===id && t.fecha >= masDias(P.desde, -14)).sort((a, b)=>a.fecha < b.fecha ? -1 : 1);
    const a = vs[0], b = vs.length > 1 ? vs[vs.length - 1] : null, menor = id==='rockport';
    const ver = v=>v==null ? '—' : u==='s' ? (typeof PSF!=='undefined' ? PSF.verTiempo(+v) : v + ' s') : String(v);
    const dif = a && b ? (menor ? a.v - b.v : b.v - a.v) : null;
    return {id, n, a, b, ver, dif, txt:dif==null ? '' : dif > 0 ? '▲ ' + (u==='s' ? PSF.verTiempo(Math.abs(dif)) : dif) + (menor ? ' más rápido' : ' más') : dif < 0 ? '▼ ' + (u==='s' ? PSF.verTiempo(Math.abs(dif)) : -dif) + ' menos' : '= igual', fin}; });
}
function htmlEmpezarPlan(){
  const P = S.plan, hoy = hoyISO(), i = Math.floor(diasEntre(P.inicio, hoy) / 7), fin = finEmpezar(P), termino = hoy > fin, T = pruebasEmp();
  const ahora = i < 0 ? `Tu plan parte el ${verFecha(P.inicio)}. Mientras, sal a caminar 20 minutos.` : termino ? '¡Terminaste las 8 semanas! Mira cuánto mejoraste y elige cómo seguir.'
    : i===0 ? 'Primero la prueba de inicio (3 pruebas simples) para saber cómo partes.' : i===SEM_EMP - 1 ? 'Última semana: el último día repite tus pruebas y compara.' : i===3 ? 'Semana más suave: el cuerpo se adapta mientras descansa. No la saltes.' : `Semana ${i + 1} de 8: cumple tus ${P.dias} días. Lento y bien hecho vale más que rápido.`;
  const movs = ['sentadilla_silla', 'sentadilla_aire', 'flexiones_incl', 'flexiones_rod', 'puente_gluteo', 'remo_toalla', 'plancha', soloCaminar() ? 'subida_cajon' : 'tijeras', 'escaladores'];
  return `<div class="tarjeta mi-rend" id="empPlan"><div class="entre"><span class="etiqueta">🌱 Tu avance</span><span class="suave chico">${termino ? 'terminado' : i < 0 ? 'parte el ' + verFecha(P.inicio) : 'semana ' + (i + 1) + ' de 8'}</span></div>
    <div class="barra-logro"><span style="width:${termino ? 100 : Math.max(0, Math.round(Math.min(8, i + 0.5) / 8 * 100))}%"></span></div>
    <div class="ahora-txt chico">👉 <b>Ahora:</b> ${esc(ahora)}</div>
    <div class="etiqueta" style="margin-top:10px">Tus pruebas · inicio → ahora</div>
    <div class="emp-pr">${T.map(t=>`<div class="emp-pf"><span>${esc(t.n)}</span><b class="num">${t.ver(t.a && t.a.v)} → ${t.ver(t.b && t.b.v)}</b><small class="${t.dif > 0 ? 'sube' : t.dif < 0 ? 'baja' : 'suave'}">${t.a ? t.txt || 'repite en la semana 8' : 'aún sin anotar'}</small></div>`).join('')}</div>
    <button class="btn ancho" id="empPrueba" style="margin-top:8px">📋 ${T.some(t=>t.a) ? 'Anotar mis pruebas' : 'Hacer la prueba de inicio'}</button>
    ${termino ? `<div class="etiqueta" style="margin-top:12px">¿Cómo sigues? <span class="plus-mini">PLUS</span></div><div class="chips" style="padding:0">
      <button data-empsig="mantener">⚖️ Estar en forma</button><button data-empsig="fuerza">🏋️ Ganar fuerza</button><button data-empsig="carrera">🏃 Carrera 5 km</button><button data-empsig="otra">🌱 Repetir las 8 semanas</button></div>` : ''}
    <details class="tc-como"><summary>❔ ¿Cómo se hace cada ejercicio?</summary>${movs.map(id=>`<p class="chico"><b>${esc(nomMov(movDe(id)))}.</b> ${esc(COMO_EMP[id][0])} <span class="suave">${esc(COMO_EMP[id][1])}</span></p>`).join('')}</details>
    <details class="tc-como"><summary>❔ ¿Cómo funciona el plan?</summary><p class="chico">Son 8 semanas de ${P.dias} días. Se turnan la <b>fuerza con tu peso</b>, ${soloCaminar() ? 'la <b>caminata rápida</b>' : '<b>caminar y trotar</b> (de 1 minuto de trote a 20 minutos seguidos)'} y <b>Mi primer WOD</b>${P.dias >= 4 ? ', más una caminata larga' : ''}. Nunca hay dos días fuertes seguidos y la semana 4 es más suave. Regla de oro: si no puedes conversar, baja el ritmo. Ejemplo: si un día te duele algo distinto al cansancio normal, haz la versión más fácil o descansa.</p></details>
  </div>`;
}
function enlazarEmpezarPlan(){
  if($('#empPrueba')) $('#empPrueba').onclick = ()=>irPruebaEmp();
  $$('[data-empsig]').forEach(b=>b.onclick = ()=>{ const k = b.dataset.empsig;
    if(k==='otra') return confirmar('¿Repetir las 8 semanas desde la próxima?', ()=>{ S.plan = nuevoPlanEmpezar(S.plan.sub, S.plan.diasSem); guardar(); semPlan = 0; vPlan(); }, 'Repetir');
    dialogoPlan(k==='carrera' ? {obj:'carrera', sub:'5 km'} : {obj:k}); });
}
function irPruebaEmp(){ bateriaSel = 'salud'; pref('bateria', 'salud'); if(typeof irAPrueba==='function') irAPrueba('flex'); else ir('psf'); }
