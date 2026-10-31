/* #NSCE — WOD del día por líneas personales (Monoestructural, Musculación, Funcional, Táctico, Clásicos,
   Runners, Crossrunner). Cada línea tiene una semana tipo (lunes a domingo) y sus medidas de rendimiento.
   Táctico sigue el Anexo de la doctrina del usuario (semana tipo Fase 2 y progresión de 12 semanas).
   La Preparación PSF es aparte: se muestra en la pestaña PSF (PSF_WODS, adaptada a la prueba más débil).
   Usa POPULARES y Mv de registro.js.                                                                          */
'use strict';
const popular = t=>Object.assign({}, POPULARES.find(p=>p.titulo===t));
const diaNum = f=>Math.floor(new Date((f || hoyISO()) + 'T12:00:00').getTime() / 86400000);
const semanaNum = ()=>Math.floor((diaNum() + 3) / 7);            // cambia cada lunes
const diaSemana = ()=>(new Date().getDay() + 6) % 7;             // 0 = lunes … 6 = domingo
const DIAS_L = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/* ---------- Datos personales para calcular ritmos y cargas ---------- */
function ritmos(){
  const c = typeof mejorDe==='function' && mejorDe('psf2400');
  if(!c) return null;
  const pk = c.valor / 2.4;                                       // segundos por km en tu mejor 2.400
  return {pk, suave:pk*1.35, tempo:pk*1.12, r400:c.valor/6, r1000:pk*1.04, r800:pk*0.8*1.03, vo2:483/(c.valor/60) + 3.5};
}
const kgDe = (ej, pct)=>{ const b = mejorDe(ej); return b ? Math.round(b.valor * pct / 2.5) * 2.5 : null; };
const cargaTxt = (ej, pct, nombre)=>{ const k = kgDe(ej, pct); return nombre + ' al ' + Math.round(pct*100) + ' % de tu 1RM' + (k ? ' (≈ ' + String(k).replace('.', ',') + ' kg)' : ' (registra tu 1RM para calcular el peso)'); };
const ritmoTxt = (k, et)=>{ const r = ritmos(); return r ? et + ' ' + PSF.verTiempo(r[k]) + (k==='r400' ? ' cada 400 m' : k==='r800' ? ' cada 800 m' : k==='r1000' ? ' cada 1.000 m' : '/km') : et + ' (registra tu 2.400 m para calcular tu ritmo)'; };

/* ---------- Táctico: progresión de 12 semanas del Anexo A.4 ---------- */
function cicloTactico(){
  if(!S.perfil.tacInicio){ S.perfil.tacInicio = semanaNum(); guardar(); }
  const sem = ((semanaNum() - S.perfil.tacInicio) % 12 + 12) % 12 + 1, b = Math.ceil(sem/3) - 1;
  return {sem, marchaKg:[35, 40, 45, 50][b], marchaKm:['15–18', '20–22', '24–27', '28–32'][b], marchaD:[16, 21, 25, 30][b],
    troteKg:[25, 30, 35, 40][b], troteKm:['5–6', '6–7', '7', '8'][b], troteD:[5, 6, 7, 8][b], rondas:[2, 3, 4, 4][b], eval:sem >= 10};
}

/* ---------- Las líneas ---------- */
const LINEAS = [
  {id:'mono', n:'Monoestructural', obj:'Motor aeróbico: remo, bici, ski, cuerda y carrera', semana:[
    ()=>({titulo:'Remo 8 × 500 m', estilo:'cada_ronda', params:{rondas:'8'}, main:[Mv('remo', {dist:'500', distU:'m'}), {descanso:true, tiempo:'1:30'}], estrategia:'Fuerte y parejo: el último 500 m no más de 5 s más lento que el primero.'}),
    ()=>({titulo:'Zona 2 · 45 min de bicicleta', uno:{mov:'bici', dist:'', distU:'km'}, estrategia:'Ritmo conversacional: puedes hablar en frases completas. Anota distancia y tiempo.'}),
    ()=>semanaNum() % 2 ? popular('Noruego 4×4') : ({titulo:'Umbral 4 × 8 min', estilo:'tabata', params:{rondas:'4', trabajo:'480', descanso:'120'}, main:[Mv('bici_aire_cal')], estrategia:'Intensidad «cómodamente dura», sostenible los 8 minutos. Anota las calorías totales.'}),
    ()=>({titulo:'Cuerda y ski', estilo:'emom_alt', params:{cada:'60', intervalos:'12'}, main:[Mv('dobles', {reps:'40'}), Mv('ski_cal', {cal:'12'})], estrategia:'Técnica limpia. Sin dobles: 80 saltos simples.'}),
    ()=>({titulo:'Test 2.000 m de remo', uno:{mov:'remo', dist:'2000', distU:'m'}, estrategia:'Primeros 500 m controlados, los 1.000 del medio a ritmo objetivo y el último 500 m con todo.'}),
    ()=>({titulo:'Largo mixto 60 min', estilo:'calidad', params:{rondas:'1'}, main:[Mv('remo', {tiempo:'20:00'}), Mv('bici', {tiempo:'20:00'}), Mv('carrera', {tiempo:'20:00'})], estrategia:'Todo en zona 2, sin pausas entre máquinas.'}),
    null]},
  {id:'mus', n:'Musculación', obj:'Fuerza e hipertrofia: empuje, tracción y pierna', semana:[
    ()=>({titulo:'Empuje', estilo:'calidad', params:{rondas:'4'}, main:[Mv('banca', {reps:'8'}), Mv('press', {reps:'10'}), Mv('fondos', {reps:'12'}), Mv('mc_lateral', {reps:'15'})], estrategia:cargaTxt('banca', 0.7, 'Banca 4 × 8') + '. Descanso 90 s. Termina cada serie a 1-2 repeticiones del fallo.'}),
    ()=>({titulo:'Tracción', estilo:'calidad', params:{rondas:'4'}, main:[Mv('barras', {reps:'8'}), Mv('remo_barra', {reps:'10'}), Mv('mc_remo', {reps:'12'}), Mv('curl', {reps:'12'})], estrategia:'Barras: tu máximo menos 2 repeticiones por serie. Descanso 90 s.'}),
    ()=>({titulo:'Pierna', estilo:'calidad', params:{rondas:'5'}, main:[Mv('sentadilla', {reps:'5'}), Mv('pm_rumano', {reps:'8'}), Mv('zancadas_peso', {reps:'10'}), Mv('extension_cuad', {reps:'15'})], estrategia:cargaTxt('sentadilla', 0.77, 'Sentadilla 5 × 5') + '. Descanso 2-3 min en la sentadilla.'}),
    null,
    ()=>({titulo:'Torso', estilo:'calidad', params:{rondas:'4'}, main:[Mv('banca_inclinada', {reps:'10'}), Mv('barras_supinas', {reps:'8'}), Mv('mc_press', {reps:'10'}), Mv('mc_remo', {reps:'10'})], estrategia:'Superseries empuje + tracción, 60 s de descanso.'}),
    ()=>({titulo:'Pierna y core', estilo:'calidad', params:{rondas:'5'}, main:[Mv('peso_muerto', {reps:'3'}), Mv('sent_frontal', {reps:'6'}), Mv('hip_thrust', {reps:'10'}), Mv('plancha', {tiempo:'1:00'})], estrategia:cargaTxt('pesomuerto', 0.82, 'Peso muerto 5 × 3') + '. Espalda neutra siempre.'}),
    null]},
  {id:'fun', n:'Funcional', obj:'Funcional de alta intensidad: fuerza, gimnasia y metcon', semana:[
    ()=>({titulo:'AMRAP 12', estilo:'amrap', params:{minutos:'12'}, main:[Mv('thruster', {reps:'10', peso:'40', pesoU:'kg'}), Mv('barras', {reps:'10'}), Mv('cajon', {reps:'10', alt:'60'})], estrategia:'Antes, fuerza: ' + cargaTxt('sentadilla', 0.8, 'sentadilla 5 × 3') + '. En el AMRAP, ritmo constante desde el primer minuto.'}),
    ()=>({titulo:'EMOM 16 alternado', estilo:'emom_alt', params:{cada:'60', intervalos:'16'}, main:[Mv('cargada', {reps:'3', peso:'60', pesoU:'kg'}), Mv('remo_cal', {cal:'12'}), Mv('wall_ball', {reps:'15', peso:'9', pesoU:'kg'}), Mv('burpees', {reps:'10'})], estrategia:'Cada estación debe tomarte 40 s o menos. Escala la carga para lograrlo.'}),
    ()=>({titulo:'5 rondas', estilo:'rft', params:{rondas:'5'}, main:[Mv('carrera', {dist:'400', distU:'m'}), Mv('kb_swing', {reps:'15', peso:'24', pesoU:'kg'}), Mv('toes', {reps:'10'})], estrategia:'Corre a ritmo de 5 km. Sin pausas largas en la kettlebell.'}),
    ()=>({titulo:'Técnica gimnástica', estilo:'calidad', params:{rondas:'3'}, main:[Mv('muscle_up', {reps:'5'}), Mv('hspu', {reps:'10'}), Mv('l_sit', {tiempo:'0:30'}), Mv('pistol', {reps:'10'})], estrategia:'Calidad antes que cantidad. Usa progresiones (negativas, bandas, cajón) si hace falta.'}),
    ()=>({titulo:'21-15-9 pesado', estilo:'esquema', params:{esquema:'21-15-9'}, main:[Mv('peso_muerto', {peso:'100', pesoU:'kg'}), Mv('burpees')], estrategia:'Peso muerto en series rotas desde el principio. Burpees sin parar.'}),
    ()=>({titulo:'Chipper', estilo:'por_tiempo', main:[Mv('cajon', {reps:'50', alt:'60'}), Mv('kb_swing', {reps:'40', peso:'24', pesoU:'kg'}), Mv('wall_ball', {reps:'30', peso:'9', pesoU:'kg'}), Mv('burpees', {reps:'20'}), Mv('cargada', {reps:'10', peso:'60', pesoU:'kg'})], estrategia:'Divide cada bloque en series cortas desde el inicio. Tope 30 min.'}),
    null]},
  {id:'tac', n:'Táctico', obj:'Capacidad física de combate: fuerza, carga, umbral y marcha, en 12 semanas que suben de a poco', doctrina:true, semana:[
    c=>({titulo:'Fuerza funcional + potencia', estilo:'calidad', params:{rondas:'5'}, main:[Mv('sentadilla', {reps:'5'}), Mv('peso_muerto', {reps:'5'}), Mv('press', {reps:'5'}), Mv('barras_lastre', {reps:'5'}), Mv('trineo', {dist:'20', distU:'m'}), Mv('sprint', {dist:'40', distU:'m'})], sistema:'Fosfágeno · Fuerza máxima',
      estrategia:cargaTxt('sentadilla', 0.8, 'Sentadilla') + '. Termina con 6 × 40 m de sprint sin carga, recuperación completa (3-5 min: el sistema fosfágeno la necesita).'}),
    c=>({titulo:'Trote largo con carga', uno:{mov:'carrera_tenida', dist:String(Math.max(10, c.troteD + 4)), distU:'km', peso:String(c.troteKg)}, sistema:'Aeróbico · Zona 2',
      estrategia:'10 a 12 km con ' + c.troteKg + ' kg (chaleco y mochila), a un ritmo en que puedas conversar, por terreno variado con subidas suaves.'}),
    c=>({titulo:'Umbral con carga 5 × 1.000 m', estilo:'cada_ronda', params:{rondas:'5'}, main:[Mv('carrera_tenida', {dist:'1000', distU:'m', peso:String(Math.min(45, c.troteKg + 10)), pesoU:'kg'}), {descanso:true, tiempo:'3:00'}], sistema:'Glucolítico-aeróbico · Umbral',
      estrategia:'A ritmo de umbral (85 % de tu pulso máximo) con el equipo táctico (35–45 kg), en terreno con subidas.'}),
    c=>({titulo:'Recuperación activa y movilidad', uno:{mov:'caminata', dist:'3', distU:'km'}, sistema:'Recuperación',
      estrategia:'Camina suave 30–40 min sin carga; después, movilidad y elongación de la parte de atrás de las piernas y la espalda.'}),
    c=>({titulo:'Circuito de combate', estilo:'cada_ronda', params:{rondas:String(c.rondas)}, main:[Mv('sprint', {dist:'50', distU:'m'}), Mv('tendidas', {reps:'10'}), Mv('arrastre_herido', {dist:'20', distU:'m', peso:'80', pesoU:'kg'}), {descanso:true, tiempo:'5:00'}], sistema:'Fosfágeno · Glucolítico · Fuerza',
      estrategia:'50 m de sprint con el equipo táctico, 10 tendidas y levantadas con todo el equipo y 20 m arrastrando a un herido de 80 kg, agachado. Entre rondas, 5 min de pausa de pie.'}),
    c=>c.sem % 2 ? {titulo:'Marcha táctica', uno:{mov:'marcha', dist:String(c.marchaD), distU:'km', peso:String(c.marchaKg)}, sistema:'Aeróbico · Específico',
        estrategia:c.marchaKm + ' km con ' + c.marchaKg + ' kg a 4–5 km/h. A la mitad, para 10 min sin sacarte la carga. Al llegar, 5 tendidas y levantadas.'}
      : {titulo:'Desplazamiento rápido', uno:{mov:'carrera_tenida', dist:String(c.troteD), distU:'km', peso:String(c.troteKg)}, sistema:'Umbral · Específico',
        estrategia:c.troteKm + ' km con ' + c.troteKg + ' kg a ritmo de umbral. Al llegar, haz una tarea táctica sencilla (tiro o informar tu posición).'},
    null]},
  {id:'cla', n:'Clásicos', obj:'Girls y Heroes: mídete contra tu marca anterior', diario:true},
  {id:'hero', n:'Héroes', obj:'Hero WOD: en honor a militares, policías y bomberos caídos en servicio', diario:true, cats:['heroes']},
  {id:'run', n:'Runners', obj:'Correr mejor: series, tempo y fondo', semana:[
    ()=>({titulo:'Trote suave 40 min', uno:{mov:'trote_z2', dist:'', distU:'km'}, estrategia:ritmoTxt('suave', 'Ritmo suave') + '. Debes poder conversar.'}),
    c=>[{titulo:'Series 8 × 400 m', estilo:'cada_ronda', params:{rondas:'8'}, main:[Mv('carrera', {dist:'400', distU:'m'}), {descanso:true, tiempo:'1:30'}], estrategia:ritmoTxt('r400', 'Cada 400 m en') + '. Recupera caminando.'},
      {titulo:'Series 5 × 1.000 m', estilo:'cada_ronda', params:{rondas:'5'}, main:[Mv('carrera', {dist:'1000', distU:'m'}), {descanso:true, tiempo:'2:30'}], estrategia:ritmoTxt('r1000', 'Cada 1.000 m en') + '.'},
      {titulo:'Series 6 × 800 m', estilo:'cada_ronda', params:{rondas:'6'}, main:[Mv('carrera', {dist:'800', distU:'m'}), {descanso:true, tiempo:'2:00'}], estrategia:ritmoTxt('r800', 'Cada 800 m en') + '.'},
      popular('Noruego 4×4')][semanaNum() % 4],
    ()=>({titulo:'Fuerza para corredores', estilo:'calidad', params:{rondas:'3'}, main:[Mv('zancadas_peso', {reps:'10'}), Mv('pm_rumano', {reps:'10'}), Mv('hip_thrust', {reps:'12'}), Mv('plancha_lateral', {tiempo:'0:45'})], estrategia:'Piernas y core para prevenir lesiones. Carga moderada.'}),
    ()=>({titulo:'Tempo 20 min', uno:{mov:'carrera', dist:'', distU:'km'}, estrategia:'10 min suave + 20 min a ' + ritmoTxt('tempo', 'ritmo tempo').replace('ritmo tempo ', '') + ' + 5 min suave.'}),
    null,
    ()=>({titulo:'Fondo largo', uno:{mov:'carrera', dist:'', distU:'km'}, estrategia:'60–90 min continuos. ' + ritmoTxt('suave', 'Ritmo') + ' o más lento.'}),
    null]},
  {id:'xrun', n:'Crossrunner', obj:'Híbrido: carrera más estaciones funcionales', semana:[
    ()=>({titulo:'Carrera comprometida', estilo:'rft', params:{rondas:'4'}, main:[Mv('carrera', {dist:'1000', distU:'m'}), Mv('wall_ball', {reps:'20', peso:'9', pesoU:'kg'}), Mv('mc_zancadas', {reps:'20', peso:'15', pesoU:'kg'})], estrategia:'Mide cuánto se cae tu ritmo de carrera después de cada estación: es la medida clave del híbrido.'}),
    ()=>({titulo:'Zona 2 · 50 min', uno:{mov:'trote_z2', dist:'', distU:'km'}, estrategia:ritmoTxt('suave', 'Ritmo suave') + '.'}),
    ()=>({titulo:'Estaciones', estilo:'emom_alt', params:{cada:'60', intervalos:'20'}, main:[Mv('ski_cal', {cal:'15'}), Mv('trineo', {dist:'20', distU:'m'}), Mv('remo_cal', {cal:'15'}), Mv('burpees', {reps:'10'})], estrategia:'Cada estación a ritmo de competencia, sin vaciarte.'}),
    ()=>({titulo:'Intervalos 6 × 800 m', estilo:'cada_ronda', params:{rondas:'6'}, main:[Mv('carrera', {dist:'800', distU:'m'}), {descanso:true, tiempo:'1:30'}], estrategia:ritmoTxt('r800', 'Cada 800 m en') + '.'}),
    null,
    ()=>({titulo:'Simulación híbrida (media)', estilo:'por_tiempo', main:[Mv('carrera', {dist:'1000', distU:'m'}), Mv('ski', {dist:'1000', distU:'m'}), Mv('carrera', {dist:'1000', distU:'m'}), Mv('trineo', {dist:'50', distU:'m'}), Mv('carrera', {dist:'1000', distU:'m'}), Mv('trineo_tiro', {dist:'50', distU:'m'}), Mv('carrera', {dist:'1000', distU:'m'}), Mv('burpees', {reps:'40'})], estrategia:'Simula una competencia híbrida: transiciones rápidas y ritmo de carrera estable.'}),
    null]},
];
function lineasVisibles(){ const v = S.perfil.lineas;
  if(v && !S.perfil.lineaHero){ S.perfil.lineaHero = true; if(!v.includes('hero')) v.push('hero'); }
  if(v && S.perfil.sexo==='M' && !S.perfil.lineaMujer){ S.perfil.lineaMujer = true; if(!v.includes('mujer')) v.push('mujer'); }   // «Mujer fuerte» es nueva: se muestra a las mujeres que eligieron líneas antes   // la línea Héroes es nueva: se muestra también a quien eligió líneas antes
  return LINEAS.filter(l=>v ? v.includes(l.id) : l.id!=='mujer' || S.perfil.sexo==='M'); }   // sin elegir: todas, y «Mujer fuerte» solo para mujeres
/* Sesión de hoy de una línea: plantilla o descanso (con la próxima sesión) */
function sesionDe(l, dia){
  if(l.diario){ const cats = l.cats || ['girls', 'heroes'], cl = POPULARES.filter(p=>cats.includes(p.cat)); return Object.assign({}, cl[(diaNum() + dia) % cl.length], {estrategia:cl[(diaNum() + dia) % cl.length].nota || '', linea:l.id}); }
  const f = l.semana[dia]; if(!f) return null;
  const t0 = f(l.id==='tac' ? cicloTactico() : {}), t = Array.isArray(t0) ? t0[0] : t0;
  return t ? Object.assign({}, t, {linea:l.id}) : t;   // `linea`: el registro le da sus 3 versiones (escalar.js)
}
function sesionHoy(l){
  const d = diaSemana(), t = sesionDe(l, d);
  if(t) return t;
  for(let k=1;k<7;k++){ const n = sesionDe(l, (d + k) % 7); if(n) return {descanso:true, titulo:'Descanso', prox:n, cuando:k===1 ? 'mañana' : DIAS_L[(d + k) % 7].toLowerCase()}; }
  return {descanso:true, titulo:'Descanso'};
}

/* ---------- Medidas de rendimiento de cada línea ---------- */
function medidasLinea(l, t){
  const lunes = iso(inicioSemana()), sem = S.sesiones.filter(s=>s.fecha >= lunes), ac = acumular(sem), r = ritmos(), out = [];
  const grupoSem = g=>sem.filter(s=>grupoDe(s)===g);
  if(l.id==='mono'){ out.push([fmtNum(acumular(grupoSem('mono')).min), 'min de cardio esta semana']); const b = mejorDe('dist:remo:2000'); out.push([b ? PSF.verTiempo(b.valor) : '—', 'mejor 2 km remo']); }
  if(l.id==='mus'){ out.push([fmtNum(ac.kg/1000), 't levantadas esta semana']); const sq = mejorDe('sentadilla'), pe = medidaReciente('peso');
    out.push([sq ? fmtNum(sq.valor) + ' kg' : '—', 'sentadilla 1RM']); if(sq && pe) out.push([fmtNum(Math.round(sq.valor/pe*100)/100) + '×', 'tu peso corporal']); }
  if(l.id==='fun'){ const g = {}; sem.forEach(s=>{ const k = grupoDe(s); g[k] = (g[k] || 0) + 1; });
    out.push([sem.length, 'sesiones esta semana']); out.push([Object.keys(g).length, 'grupos de movimiento']); }
  if(l.id==='tac'){ const c = cicloTactico(); out.push(['S' + c.sem + '/12', c.eval ? 'semanas de evaluación' : 'del ciclo (Fase 2)']); out.push([fmtNum(ac.carga), 'km·kg de carga esta semana']);
    const apt = aptitudCombate(); out.push([apt.cumple + '/' + apt.total, 'estándares de combate']); }
  if(l.id==='cla' && t){ const b = mejorDe('wod:' + t.titulo); out.push([b ? (b.txt || fmt(ejDe('wod:' + t.titulo) || {u:'tiempo'}, b.valor)) : '—', 'tu marca a batir en ' + t.titulo]); }
  if(l.id==='run'){ out.push([fmtKm(ac.m.correr || 0), 'km corridos esta semana']); out.push([r ? fmtNum(Math.round(r.vo2)) : '—', 'VO₂máx estimado']); out.push([r ? PSF.verTiempo(r.tempo) : '—', 'ritmo de umbral /km']); }
  if(l.id==='xrun'){ out.push([fmtKm(ac.m.correr || 0), 'km corridos esta semana']); const b = mejorDe('wod:Simulación híbrida (media)'); out.push([b ? PSF.verTiempo(b.valor) : '—', 'mejor simulación']); }
  return out.slice(0, 3);
}

/* ---------- Preparación PSF (en la pestaña PSF; se adapta a la prueba más débil) ---------- */
const PSF_WODS = [
  Object.assign(popular('Intervalos 2.400'), {foco:'carrera', estrategia:'Calienta 10 min trotando. Cada 400 m al ritmo de tu meta en el 2.400 (tiempo meta ÷ 6). Recupera caminando.'}),
  {titulo:'Carrera continua 5 km', foco:'carrera', uno:{mov:'carrera', dist:'5', distU:'km'}, estrategia:'Ritmo cómodo pero constante. Construye la base aeróbica del 2.400.'},
  {titulo:'Ritmo 800 × 3', foco:'carrera', estilo:'cada_ronda', params:{rondas:'3'}, main:[Mv('carrera', {dist:'800', distU:'m'}), {descanso:true, tiempo:'2:00'}], estrategia:'Cada 800 m un poco más rápido que tu ritmo meta del 2.400.'},
  Object.assign(popular('Escalera de barras'), {foco:'brazos', estrategia:'Minuto 1 = 1 barra, minuto 2 = 2… Técnica estricta, como en la PSF.'}),
  {titulo:'Pirámide de barras y flexiones', foco:'brazos', estilo:'esquema', params:{esquema:'1-2-3-4-5-4-3-2-1'}, main:[Mv('barras'), Mv('flexiones')], estrategia:'Sube y baja sin llegar al fallo.'},
  {titulo:'Barras submáximas', foco:'brazos', estilo:'emom', params:{cada:'60', intervalos:'10'}, main:[Mv('barras', {reps:'4'})], estrategia:'La mitad de tu máximo cada minuto: mucho volumen sin fatiga.'},
  Object.assign(popular('Preparación PSF brazos y abdomen'), {foco:'abd', estrategia:'Abdominales a la velocidad que necesitas para tu meta en 1 minuto.'}),
  {titulo:'Abdominales 1 minuto × 5', foco:'abd', estilo:'tabata', params:{rondas:'5', trabajo:'60', descanso:'60'}, main:[Mv('abdominales')], estrategia:'5 series de 1 minuto al máximo con la técnica de la cartilla.'},
  {titulo:'Circuito resistencia PSF', foco:'mixto', estilo:'rft', params:{rondas:'4'}, main:[Mv('carrera', {dist:'400', distU:'m'}), Mv('abdominales', {reps:'25'}), Mv('barras', {reps:'5'}), Mv('flexiones', {reps:'15'})], estrategia:'Las tres pruebas juntas, sin parar entre movimientos.'},
];
function focoPSF(){
  const c = S.controles.slice().sort((a, b)=>a.fecha < b.fecha ? 1 : -1)[0];
  if(!c || !c.niveles) return null;
  const val = {NA:0, A:1, MB:2}, op = [['carrera', c.niveles.c], ['abd', c.niveles.a], ['brazos', c.niveles.b]].filter(x=>x[1] in val);
  if(!op.length) return null;
  op.sort((a, b)=>val[a[1]] - val[b[1]]);
  return val[op[0][1]] < 2 ? op[0][0] : null;
}
const FOCO_N = {carrera:'carrera 2.400 m', abd:'abdominales', brazos:'barras / flexiones'};
function sesionPSFHoy(){ const f = focoPSF(); let l = PSF_WODS; if(f) l = l.concat(l.filter(w=>w.foco===f)); return l[diaNum() % l.length]; }

function textoPlantilla(t){ return t.uno ? fmtUnoPlantilla(t.uno) : textoWod(t); }
function estiloPlantilla(t){ return t.uno ? 'Un movimiento' : estiloDe(t.estilo).n; }

/* ---------- Acciones de la tarjeta ---------- */
/* El WOD que se propone hoy (Inicio y Registrar): la línea que se miraba en el carrusel si hoy no descansa; si no, la primera que tenga sesión */
function wodDeHoy(){
  // 1.º la sesión de hoy de Mi plan (si trae su WOD); 2.º la línea que se miraba en el carrusel; 3.º la primera línea que no descansa hoy
  if(S.plan && typeof planDia==='function' && esPlus()){ const x = planDia(hoyISO()), ses = x && x.ses; const t = ses && (ses.plantilla || (ses.pop && POPULARES.find(p=>p.titulo===ses.pop)));
    if(x.tipo==='sesion' && t) return {t, l:{n:'Mi plan'}, i:-1, plan:true}; }
  const LS = lineasVisibles(); if(!LS.length) return null;
  const orden = [Math.min(ent(pref('pista')) || 0, LS.length - 1)].concat(LS.map((_, i)=>i));
  for(const i of orden){ const t = sesionHoy(LS[i]); if(t && !t.descanso) return {t, l:LS[i], i}; }
  return null;
}
function registrarWod(t){ abrirRegistro({}); cargarPlantilla(t); }
const MODO_ESTILO = {amrap:'amrap', emom:'emom', emom_alt:'emom', tabata:'tabata', intervalos:'tabata', fgb:'emom'};
const modoRelojDe = t=>t.uno && t.uno.tramos && t.uno.tramos.length ? 'tramos' : t.reloj ? t.reloj.modo : MODO_ESTILO[t.estilo] || 'cron';
function iniciarWod(t){
  if(!esPlus() && RELOJ_PLUS.includes(modoRelojDe(t))) return pantallaPlus('reloj', ()=>iniciarWod(t));   // EMOM, intervalos y tramos: Plus (plus.js)
  const p = Object.assign({}, PDEF, t.params || {}), c = cfgReloj;
  if(t.uno && t.uno.tramos && t.uno.tramos.length){ c.modo = 'tramos'; pref('reloj', JSON.stringify(c)); relojWod = t; R = null; ir('reloj'); return; }   // reloj guiado por tramos
  if(t.reloj){ const r = t.reloj; c.modo = r.modo;   // el protocolo trae su propio reloj (ej. Noruego 4×4)
    if(r.modo==='tabata'){ c.trab = r.trab; c.desc = r.desc; c.rondas = r.rondas; } if(r.modo==='cron') c.tope = r.tope || '';
    pref('reloj', JSON.stringify(c)); relojWod = t; R = null; ir('reloj'); return; }
  c.modo = MODO_ESTILO[t.estilo] || 'cron';
  if(c.modo==='amrap') c.amrap = p.minutos;
  if(c.modo==='emom'){ c.emomCada = t.estilo==='fgb' ? '60' : p.cada; c.emomN = t.estilo==='fgb' ? String((ent(p.rondas) || 3) * ((t.main || []).length || 5)) : p.intervalos; }
  if(c.modo==='tabata'){ c.trab = p.trabajo; c.desc = p.descanso; c.rondas = p.rondas; }
  pref('reloj', JSON.stringify(c)); relojWod = t; R = null; ir('reloj');
}
function resultadosWod(t){
  const ss = S.sesiones.filter(s=>s.titulo && s.titulo.toLowerCase()===String(t.titulo).toLowerCase()).sort((a, b)=>a.fecha < b.fecha ? 1 : -1);
  const b = mejorDe('wod:' + t.titulo);
  dialogo(`<div class="cab"><h2>${esc(t.titulo)}</h2><button class="btn chico-btn" data-cerrar>✕</button></div><div class="etiqueta">Tus resultados</div>
    ${ss.length ? `<ul class="lista">${ss.map(s=>`<li class="item entre" data-id="${s.id}"><span class="num">${verFecha(s.fecha)}</span><span class="num ${b && b.ref===s.id ? 'pr' : ''}">${b && b.ref===s.id ? '🏆 ' : ''}${esc(s.txt || '—')}${s.rx ? ' · Rx' : ''}</span></li>`).join('')}</ul>`
      : '<div class="vacio">Aún no registras este entrenamiento. Cuando lo hagas, aquí verás tu progreso.</div>'}
    <div class="btns"><button class="btn prim" id="rwReg">＋ Registrar</button></div>`, d=>{
    $$('li[data-id]', d).forEach(li=>li.onclick = ()=>verSesion(S.sesiones.find(s=>s.id===li.dataset.id)));
    $('#rwReg', d).onclick = ()=>registrarWod(t);
  });
}
function detallesWod(t){
  const movs = t.uno ? [t.uno] : (t.in || []).concat(t.main || [], t.out || []);
  dialogo(`<div class="cab"><h2>${esc(t.titulo)}</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <div class="etiqueta">${esc(estiloPlantilla(t))}${t.sistema ? ' · ' + esc(t.sistema) : ''}</div>
    ${!t.uno ? `<p class="suave chico">${esc(estiloDe(t.estilo).d)}</p>` : ''}
    <div class="pizarra">${esc(textoPlantilla(t))}</div>
    ${t.estrategia ? `<h3>Estimulación y estrategia</h3><p>${esc(t.estrategia)}</p>` : ''}
    ${t.nota && t.nota!==t.estrategia ? `<p class="suave chico">${esc(t.nota)}</p>` : ''}
    ${movs.filter(m=>m.mov && movDe(m.mov)).length ? `<h3>Movimientos</h3><ul class="lista">${movs.filter(m=>m.mov && movDe(m.mov)).map(m=>{ const x = movDe(m.mov);
      return `<li class="mov-item"><span class="marca-g g-${x.g}"></span><span class="mov-n">${esc(x.n)}</span><span class="suave chico">${esc(GRUPOS[x.g].corto)}</span></li>`; }).join('')}</ul>` : ''}
    <div class="btns"><button class="btn" id="dwIni">▶ Iniciar reloj</button><button class="btn prim" id="dwReg">＋ Registrar</button></div>`, d=>{
    $('#dwIni', d).onclick = ()=>{ d.close(); iniciarWod(t); };
    $('#dwReg', d).onclick = ()=>registrarWod(t);
  });
}

/* ---------- ¿Cómo llegas hoy? — disposición para entrenar ---------- */
const CHEQUEO = [['sueno', 'Sueño'], ['alim', 'Alimentación'], ['energia', 'Energía']];
const NIVELES_CH = [['0', 'Mal'], ['1', 'Regular'], ['2', 'Bien']];
function disposicion(dia){
  if(!dia) return null;
  const v = CHEQUEO.map(([k])=>dia[k]).filter(x=>x!=null && x!=='');
  if(v.length < CHEQUEO.length) return null;
  const pct = Math.round(v.reduce((a, b)=>a + +b, 0) / (v.length*2) * 100);
  const txt = pct >= 70 ? 'Listo para entrenar fuerte' : pct >= 40 ? 'Entrena a intensidad moderada' : 'Prioriza recuperación, técnica o movilidad';
  return {pct, txt, nivel:pct >= 70 ? 'MB' : pct >= 40 ? 'A' : 'NA'};
}
