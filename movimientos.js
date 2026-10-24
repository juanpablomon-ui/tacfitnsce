/* NEWEN — catálogo de movimientos, separados en grupos.
   Cada movimiento: id (no cambiar: lo usan los registros guardados), nombre, grupo y medida principal:
   peso (series reps × kg) · cuerpo (repeticiones) · dist (distancia y tiempo) · cal (calorías) · tiempo (cuánto aguantas). */
'use strict';
const GRUPOS = {
  mono:  {n:'Cardio (monoestructural)', corto:'Cardio', ic:'🏃'},
  gim:   {n:'Gimnasia (peso corporal)', corto:'Gimnasia', ic:'🤸'},
  core:  {n:'Abdomen y core', corto:'Core', ic:'🎯'},
  barra: {n:'Barra y máquinas', corto:'Barra', ic:'🏋️'},
  mc:    {n:'Mancuernas, kettlebell y balón', corto:'Mancuernas', ic:'💪'},
  mil:   {n:'Militar y funcional', corto:'Militar', ic:'🎖️'},
};
const MOVS = [
  // Cardio (monoestructural)
  ['carrera', 'Carrera', 'mono', 'dist'], ['sprint', 'Sprint', 'mono', 'dist'], ['trote_z2', 'Trote suave (zona 2)', 'mono', 'dist'],
  ['carrera_cinta', 'Carrera en cinta (trotadora)', 'mono', 'dist'], ['carrera_curva', 'Carrera en cinta curva (AirRunner)', 'mono', 'dist'],
  ['carrera_cerro', 'Carrera en subida (cerro)', 'mono', 'dist'], ['trail', 'Carrera de montaña (trail)', 'mono', 'dist'],
  ['shuttle', 'Carrera ida y vuelta (shuttle run)', 'mono', 'dist'], ['carrera_tenida', 'Carrera con tenida de combate', 'mono', 'dist'],
  ['marcha', 'Marcha con carga (ruck)', 'mono', 'dist'], ['caminata', 'Caminata', 'mono', 'dist'],
  ['nado', 'Nado', 'mono', 'dist'], ['nado_abierto', 'Nado en aguas abiertas', 'mono', 'dist'], ['nado_tenida', 'Nado con tenida', 'mono', 'dist'],
  ['remo', 'Remo (máquina)', 'mono', 'dist'], ['remo_cal', 'Remo en calorías', 'mono', 'cal'],
  ['bici', 'Bicicleta', 'mono', 'dist'], ['bici_estatica', 'Bicicleta estática', 'mono', 'dist'],
  ['bici_aire', 'Bicicleta de aire (assault bike)', 'mono', 'dist'], ['bici_aire_cal', 'Bicicleta de aire en calorías', 'mono', 'cal'],
  ['ski', 'Ski erg', 'mono', 'dist'], ['ski_cal', 'Ski erg en calorías', 'mono', 'cal'], ['eliptica', 'Elíptica', 'mono', 'dist'],
  ['escaladora', 'Escaladora (stair climber)', 'mono', 'dist'],
  ['cuerda', 'Saltos de cuerda (single under)', 'mono', 'cuerpo'], ['dobles', 'Dobles de cuerda (double under)', 'mono', 'cuerpo'],
  ['cruzados', 'Saltos de cuerda cruzados', 'mono', 'cuerpo'], ['triples', 'Triples de cuerda', 'mono', 'cuerpo'],
  // Gimnasia (peso corporal)
  ['barras', 'Barras (pull-up)', 'gim', 'cuerpo'], ['barras_estrictas', 'Barras estrictas', 'gim', 'cuerpo'],
  ['barras_kipping', 'Barras con kipping', 'gim', 'cuerpo'], ['barras_butterfly', 'Barras butterfly', 'gim', 'cuerpo'],
  ['barras_pecho', 'Barras pecho a la barra (chest-to-bar)', 'gim', 'cuerpo'], ['barras_supinas', 'Barras supinas (chin-up)', 'gim', 'cuerpo'],
  ['barras_lastre', 'Barras con lastre', 'gim', 'peso'], ['barras_l', 'Barras en L', 'gim', 'cuerpo'],
  ['muscle_up', 'Muscle-up en barra', 'gim', 'cuerpo'], ['muscle_up_anillas', 'Muscle-up en anillas', 'gim', 'cuerpo'],
  ['remo_anillas', 'Remo en anillas (ring row)', 'gim', 'cuerpo'],
  ['flexiones', 'Flexiones de brazos (push-up)', 'gim', 'cuerpo'], ['flexiones_rod', 'Flexiones de brazos con apoyo de rodillas', 'gim', 'cuerpo'],
  ['flexiones_mano', 'Flexiones con despegue de manos (hand-release)', 'gim', 'cuerpo'], ['flexiones_diamante', 'Flexiones diamante', 'gim', 'cuerpo'],
  ['flexiones_declinadas', 'Flexiones declinadas', 'gim', 'cuerpo'], ['flexiones_aplauso', 'Flexiones con aplauso', 'gim', 'cuerpo'],
  ['fondos', 'Fondos en paralelas (dip)', 'gim', 'cuerpo'], ['fondos_anillas', 'Fondos en anillas', 'gim', 'cuerpo'], ['fondos_banco', 'Fondos en banco', 'gim', 'cuerpo'],
  ['hspu', 'Flexiones invertidas (HSPU)', 'gim', 'cuerpo'], ['hspu_estrictas', 'Flexiones invertidas estrictas', 'gim', 'cuerpo'],
  ['pino', 'Parada de manos (handstand)', 'gim', 'tiempo'], ['caminata_manos', 'Caminata de manos (handstand walk)', 'gim', 'dist'],
  ['sentadilla_aire', 'Sentadillas sin peso (air squat)', 'gim', 'cuerpo'], ['pistol', 'Sentadilla a una pierna (pistol)', 'gim', 'cuerpo'],
  ['sentadilla_salto', 'Sentadillas con salto', 'gim', 'cuerpo'], ['zancadas', 'Zancadas sin peso (lunges)', 'gim', 'cuerpo'],
  ['zancadas_salto', 'Zancadas con salto', 'gim', 'cuerpo'],
  ['burpees', 'Burpees', 'gim', 'cuerpo'], ['burpee_barra', 'Burpee sobre la barra (bar-facing)', 'gim', 'cuerpo'],
  ['burpee_cajon', 'Burpee con salto al cajón', 'gim', 'cuerpo'], ['burpee_dominada', 'Burpee con barra (burpee pull-up)', 'gim', 'cuerpo'],
  ['cajon', 'Saltos al cajón (box jump)', 'gim', 'cuerpo'], ['cajon_sobre', 'Salto sobre el cajón (box jump over)', 'gim', 'cuerpo'],
  ['subida_cajon', 'Subida al cajón (step-up)', 'gim', 'cuerpo'],
  ['subida_cuerda', 'Subida de cuerda', 'gim', 'cuerpo'], ['subida_cuerda_sin', 'Subida de cuerda sin piernas', 'gim', 'cuerpo'],
  ['escaladores', 'Escaladores (mountain climbers)', 'gim', 'cuerpo'], ['tijeras', 'Saltos de tijera (jumping jacks)', 'gim', 'cuerpo'],
  ['colgado', 'Colgado en barra', 'gim', 'tiempo'], ['colgado_flex', 'Colgado con brazos flexionados', 'gim', 'tiempo'],
  // Abdomen y core
  ['abdominales', 'Abdominales (sit-up)', 'core', 'cuerpo'], ['abd_abmat', 'Abdominales con AbMat', 'core', 'cuerpo'],
  ['ghd', 'Abdominales en GHD', 'core', 'cuerpo'], ['hiperextension', 'Hiperextensiones lumbares', 'core', 'cuerpo'],
  ['toes', 'Pies a la barra (toes to bar)', 'core', 'cuerpo'], ['rodillas_codos', 'Rodillas a los codos', 'core', 'cuerpo'],
  ['elev_piernas', 'Elevación de piernas colgado', 'core', 'cuerpo'], ['v_ups', 'V-ups', 'core', 'cuerpo'],
  ['hollow_rock', 'Hollow rocks', 'core', 'cuerpo'], ['crunch', 'Crunch', 'core', 'cuerpo'], ['giros_rusos', 'Giros rusos', 'core', 'cuerpo'],
  ['rueda', 'Rueda abdominal', 'core', 'cuerpo'], ['plancha', 'Plancha abdominal', 'core', 'tiempo'], ['plancha_lateral', 'Plancha lateral', 'core', 'tiempo'],
  ['l_sit', 'L-sit', 'core', 'tiempo'], ['hollow_hold', 'Hollow hold', 'core', 'tiempo'], ['superman', 'Superman', 'core', 'tiempo'],
  ['sent_pared', 'Sentadilla isométrica en pared', 'core', 'tiempo'],
  // Barra y máquinas
  ['sentadilla', 'Sentadilla trasera (back squat)', 'barra', 'peso'], ['sent_frontal', 'Sentadilla frontal (front squat)', 'barra', 'peso'],
  ['sent_overhead', 'Sentadilla overhead (OHS)', 'barra', 'peso'], ['sent_cajon', 'Sentadilla al cajón (box squat)', 'barra', 'peso'],
  ['peso_muerto', 'Peso muerto (deadlift)', 'barra', 'peso'], ['pm_sumo', 'Peso muerto sumo', 'barra', 'peso'],
  ['pm_rumano', 'Peso muerto rumano', 'barra', 'peso'], ['sumo_hp', 'Peso muerto sumo con jalón alto (SDHP)', 'barra', 'peso'],
  ['banca', 'Press banca (bench press)', 'barra', 'peso'], ['banca_inclinada', 'Press banca inclinado', 'barra', 'peso'],
  ['press', 'Press militar (strict press)', 'barra', 'peso'], ['push_press', 'Push press', 'barra', 'peso'],
  ['push_jerk', 'Push jerk', 'barra', 'peso'], ['split_jerk', 'Split jerk', 'barra', 'peso'], ['jerk', 'Jerk', 'barra', 'peso'],
  ['envion', 'Envión (clean & jerk)', 'barra', 'peso'], ['arranque', 'Arranque (snatch)', 'barra', 'peso'],
  ['arranque_pot', 'Arranque de potencia (power snatch)', 'barra', 'peso'], ['arranque_colgado', 'Arranque colgado (hang snatch)', 'barra', 'peso'],
  ['cargada', 'Cargada de potencia (power clean)', 'barra', 'peso'], ['cargada_sent', 'Cargada en sentadilla (squat clean)', 'barra', 'peso'],
  ['cargada_colgado', 'Cargada colgada (hang clean)', 'barra', 'peso'], ['cluster', 'Cluster (cargada + thruster)', 'barra', 'peso'],
  ['thruster', 'Thruster', 'barra', 'peso'], ['remo_barra', 'Remo con barra', 'barra', 'peso'],
  ['zancadas_peso', 'Zancadas con barra', 'barra', 'peso'], ['hip_thrust', 'Hip thrust', 'barra', 'peso'],
  ['buenos_dias', 'Buenos días (good morning)', 'barra', 'peso'], ['curl', 'Curl de bíceps con barra', 'barra', 'peso'],
  ['encogimientos', 'Encogimientos de hombros', 'barra', 'peso'], ['jalon', 'Jalón al pecho (polea)', 'barra', 'peso'],
  ['prensa', 'Prensa de piernas', 'barra', 'peso'], ['extension_cuad', 'Extensión de cuádriceps (máquina)', 'barra', 'peso'],
  // Mancuernas, kettlebell y balón
  ['kb_swing', 'Swing con kettlebell (ruso)', 'mc', 'peso'], ['kb_swing_am', 'Swing americano con kettlebell', 'mc', 'peso'],
  ['kb_goblet', 'Sentadilla goblet', 'mc', 'peso'], ['kb_snatch', 'Arranque con kettlebell', 'mc', 'peso'],
  ['kb_clean', 'Cargada con kettlebell', 'mc', 'peso'], ['kb_press', 'Press con kettlebell', 'mc', 'peso'],
  ['turco', 'Levantamiento turco (turkish get-up)', 'mc', 'peso'],
  ['mc_snatch', 'Arranque con mancuerna (DB snatch)', 'mc', 'peso'], ['mc_clean', 'Cargada con mancuernas', 'mc', 'peso'],
  ['mc_envion', 'Envión con mancuernas', 'mc', 'peso'], ['mc_thruster', 'Thruster con mancuernas', 'mc', 'peso'],
  ['mc_press', 'Press con mancuernas', 'mc', 'peso'], ['mc_push_press', 'Push press con mancuernas', 'mc', 'peso'],
  ['mc_banca', 'Press banca con mancuernas', 'mc', 'peso'], ['mc_remo', 'Remo con mancuerna', 'mc', 'peso'],
  ['mc_pm', 'Peso muerto con mancuernas', 'mc', 'peso'], ['mc_zancadas', 'Zancadas con mancuernas', 'mc', 'peso'],
  ['mc_step', 'Subida al cajón con mancuernas', 'mc', 'peso'], ['mc_devil', 'Devil press', 'mc', 'peso'],
  ['mc_man_maker', 'Man maker', 'mc', 'peso'], ['mc_curl', 'Curl con mancuernas', 'mc', 'peso'],
  ['mc_lateral', 'Elevaciones laterales', 'mc', 'peso'], ['wall_ball', 'Wall ball', 'mc', 'peso'],
  ['slam_ball', 'Lanzamiento de balón al suelo (slam ball)', 'mc', 'peso'], ['balon_pecho', 'Lanzamiento de balón medicinal de pecho', 'mc', 'peso'],
  // Militar y funcional
  ['farmer', 'Caminata del granjero (bidones)', 'mil', 'dist'], ['traslado', 'Traslado de herido (bombero)', 'mil', 'dist'],
  ['arrastre_herido', 'Arrastre de herido', 'mil', 'dist'], ['arrastre', 'Arrastre bajo', 'mil', 'dist'], ['arrastre_alto', 'Arrastre alto', 'mil', 'dist'],
  ['gateo', 'Gateo (bear crawl)', 'mil', 'dist'], ['sdc', 'Sprint, arrastre y carga (SDC)', 'mil', 'dist'],
  ['cajas_municion', 'Transporte de cajas de munición', 'mil', 'dist'], ['pista_obstaculos', 'Pista de obstáculos', 'mil', 'dist'],
  ['trineo', 'Empuje de trineo', 'mil', 'dist'], ['trineo_tiro', 'Tiro de trineo', 'mil', 'dist'], ['yugo', 'Caminata con yugo', 'mil', 'dist'],
  ['sandbag', 'Levantamiento de saco de arena (sandbag)', 'mil', 'peso'], ['sandbag_hombro', 'Saco de arena al hombro', 'mil', 'peso'],
  ['atlas', 'Piedras atlas', 'mil', 'peso'], ['neumatico', 'Volteo de neumático', 'mil', 'cuerpo'],
  ['cuerdas_batalla', 'Cuerdas de batalla (battle ropes)', 'mil', 'tiempo'], ['muro', 'Paso de muro', 'mil', 'cuerpo'],
  ['granada', 'Lanzamiento de granada (aciertos)', 'mil', 'cuerpo'],
  ['tendidas', 'Tendidas y levantadas', 'mil', 'cuerpo'],
  // --- Ampliación: ejercicios frecuentes en circuitos, preparación física militar y gimnasio ---
  ['zancadas_caminando', 'Zancadas caminando (walking lunges)', 'gim', 'cuerpo'], ['zancadas_laterales', 'Zancadas laterales', 'gim', 'cuerpo'],
  ['zancadas_overhead', 'Zancadas con peso sobre la cabeza (overhead lunges)', 'mc', 'peso'], ['sent_bulgara', 'Sentadilla búlgara (bulgarian split squat)', 'mc', 'peso'],
  ['puente_gluteo', 'Puente de glúteos (glute bridge)', 'core', 'cuerpo'], ['elev_talones', 'Elevación de talones (calf raises)', 'gim', 'cuerpo'],
  ['rodillas_arriba', 'Rodillas arriba (skipping / high knees)', 'mono', 'cuerpo'], ['talones_gluteo', 'Talones al glúteo (butt kicks)', 'mono', 'cuerpo'],
  ['desplaz_lateral', 'Desplazamiento lateral (lateral shuffle)', 'mono', 'dist'], ['carioca', 'Carioca', 'mono', 'dist'], ['progresivos', 'Progresivos (strides)', 'mono', 'dist'],
  ['salto_largo', 'Salto largo (broad jump)', 'gim', 'cuerpo'], ['burpee_salto_largo', 'Burpee con salto largo (burpee broad jump)', 'gim', 'cuerpo'],
  ['saltos_rana', 'Saltos de rana (frog jumps)', 'gim', 'cuerpo'], ['saltos_estrella', 'Saltos en estrella (star jumps)', 'gim', 'cuerpo'], ['tuck_jumps', 'Saltos con rodillas al pecho (tuck jumps)', 'gim', 'cuerpo'],
  ['flexiones_pike', 'Flexiones en pica (pike push-ups)', 'gim', 'cuerpo'], ['flexiones_arquero', 'Flexiones arquero (archer push-ups)', 'gim', 'cuerpo'],
  ['barras_comando', 'Barras comando (commando pull-ups)', 'gim', 'cuerpo'], ['skin_cat', 'Skin the cat', 'gim', 'cuerpo'], ['pies_anillas', 'Pies a las anillas (toes to rings)', 'core', 'cuerpo'],
  ['inchworm', 'Caminata de oruga (inchworm)', 'gim', 'cuerpo'], ['pegboard', 'Tablero de clavijas (pegboard)', 'gim', 'cuerpo'],
  ['patadas_tijera', 'Patadas de tijera (flutter kicks)', 'core', 'cuerpo'], ['dead_bug', 'Bicho muerto (dead bug)', 'core', 'cuerpo'], ['bird_dog', 'Bird dog', 'core', 'cuerpo'],
  ['abd_bicicleta', 'Abdominales bicicleta (bicycle crunch)', 'core', 'cuerpo'], ['dragon_flag', 'Dragon flag', 'core', 'cuerpo'], ['abd_peso', 'Abdominales con peso', 'core', 'peso'],
  ['kb_thruster', 'Thruster con kettlebell', 'mc', 'peso'], ['kb_lunges', 'Zancadas con kettlebell', 'mc', 'peso'], ['kb_rack_carry', 'Caminata con kettlebell en rack', 'mc', 'dist'],
  ['maleta_carry', 'Caminata con peso a un lado (suitcase carry)', 'mil', 'dist'], ['overhead_carry', 'Caminata con peso sobre la cabeza (overhead carry)', 'mil', 'dist'],
  ['sandbag_carry', 'Traslado de saco de arena (sandbag carry)', 'mil', 'dist'], ['mazo', 'Golpes con mazo (sledgehammer)', 'mil', 'cuerpo'],
  ['camilla', 'Traslado en camilla', 'mil', 'dist'], ['reptar', 'Reptar', 'mil', 'dist'], ['sprint_fusil', 'Sprint con fusil', 'mil', 'dist'], ['salto_zanja', 'Salto de zanja', 'mil', 'cuerpo'],
  ['clean_press', 'Cargada y press (clean & press)', 'barra', 'peso'], ['muscle_snatch', 'Muscle snatch', 'barra', 'peso'], ['snatch_balance', 'Snatch balance', 'barra', 'peso'],
  ['pm_hexagonal', 'Peso muerto con barra hexagonal (trap bar)', 'barra', 'peso'], ['pm_una_pierna', 'Peso muerto a una pierna', 'mc', 'peso'], ['sent_zercher', 'Sentadilla Zercher', 'barra', 'peso'],
  ['press_frances', 'Press francés (tríceps)', 'barra', 'peso'], ['triceps_polea', 'Extensión de tríceps en polea', 'barra', 'peso'], ['remo_polea', 'Remo en polea', 'barra', 'peso'],
  ['aperturas', 'Aperturas con mancuernas (flyes)', 'mc', 'peso'], ['pullover', 'Pull-over', 'mc', 'peso'], ['face_pull', 'Face pull', 'barra', 'peso'], ['curl_femoral', 'Curl femoral (máquina)', 'barra', 'peso'],
  ['nordic', 'Curl nórdico (nordic curl)', 'gim', 'cuerpo'], ['elev_frontales', 'Elevaciones frontales', 'mc', 'peso'], ['press_hombro_maq', 'Press de hombros (máquina)', 'barra', 'peso'],
  ['bike_erg', 'Bike erg', 'mono', 'dist'], ['nado_crol', 'Nado crol', 'mono', 'dist'], ['nado_pecho', 'Nado pecho (braza)', 'mono', 'dist'],
].map(([id, n, g, c])=>({id, n, g, c}));
/* Nombres alternativos (inglés y cómo se dicen en el gimnasio) para encontrar cada movimiento */
const ALIAS = {
  carrera:'run running trote correr', sprint:'piques velocidad', marcha:'ruck rucking marcha con mochila', remo:'row rowing erg', remo_cal:'row calories',
  bici_aire:'airbike assault echo', ski:'skierg', cuerda:'single unders soga comba', dobles:'double unders du', escaladores:'mountain climbers montain climbing escalador',
  zancadas:'lunges lunge estocadas', zancadas_caminando:'walking lunge walking lunges zancada caminando estocadas', zancadas_peso:'barbell lunges', mc_zancadas:'dumbbell lunges',
  sentadilla_aire:'air squat squats sentadillas', sentadilla:'back squat', sent_frontal:'front squat', sent_overhead:'overhead squat ohs', kb_goblet:'goblet squat',
  peso_muerto:'deadlift dl', pm_rumano:'rdl romanian deadlift', sumo_hp:'sdhp sumo deadlift high pull', banca:'bench press', press:'strict press shoulder press militar',
  push_press:'push press', envion:'clean and jerk c&j', arranque:'snatch', cargada:'power clean', cargada_sent:'squat clean', cargada_colgado:'hang clean', thruster:'thrusters',
  kb_swing:'kettlebell swing kb swings', kb_swing_am:'american swing', wall_ball:'wallball wall balls', mc_snatch:'db snatch dumbbell snatch', mc_devil:'devil press',
  barras:'pull ups pull-ups pullups dominadas chin', barras_pecho:'c2b chest to bar', barras_supinas:'chin ups chin-ups', muscle_up:'bar muscle up bmu', muscle_up_anillas:'ring muscle up rmu',
  flexiones:'push ups push-ups pushups lagartijas', flexiones_mano:'hand release push ups hrpu', fondos:'dips', fondos_anillas:'ring dips', hspu:'handstand push ups hspu',
  pino:'handstand hold', caminata_manos:'handstand walk hsw', toes:'toes to bar t2b ttb', rodillas_codos:'knees to elbows k2e', ghd:'ghd sit ups', hiperextension:'back extensions hip extension',
  abdominales:'sit ups situps abdominales', abd_abmat:'abmat sit ups', v_ups:'v ups', plancha:'plank', plancha_lateral:'side plank', l_sit:'l sit', hollow_rock:'hollow rocks',
  burpees:'burpee', burpee_barra:'bar facing burpee bfb', burpee_salto_largo:'bbj burpee broad jump', cajon:'box jumps box jump', cajon_sobre:'box jump over bjo',
  subida_cajon:'step ups step-ups', mc_step:'db step ups', gateo:'bear crawl oso', farmer:'farmers carry farmer walk granjero bidones', trineo:'sled push', trineo_tiro:'sled pull sled drag',
  traslado:'fireman carry bombero', arrastre_herido:'casualty drag', sdc:'sprint drag carry', cuerdas_batalla:'battle ropes', neumatico:'tire flip', mazo:'sledgehammer',
  tijeras:'jumping jacks', saltos_estrella:'star jumps', tuck_jumps:'tuck jump', rodillas_arriba:'high knees skipping', talones_gluteo:'butt kicks', desplaz_lateral:'lateral shuffle',
  progresivos:'strides', salto_largo:'broad jump', puente_gluteo:'glute bridge hip bridge', elev_talones:'calf raises pantorrillas', nordic:'nordic hamstring', pullover:'pull over',
  curl:'bicep curl biceps', mc_curl:'dumbbell curl db curl biceps', press_frances:'skull crusher triceps', aperturas:'flyes flys', face_pull:'face pulls', sent_bulgara:'bulgarian split squat',
  patadas_tijera:'flutter kicks', abd_bicicleta:'bicycle crunches', inchworm:'inch worm', pegboard:'peg board', remo_anillas:'ring rows inverted row', tendidas:'up downs sprawls tendidas',
};
MOVS.forEach(m=>{ m.al = ALIAS[m.id] || ''; });
/* Búsqueda tolerante: sin tildes, por nombre o alias, y acepta errores de escritura (montain → mountain) */
const _norm = s=>String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function _dist(a, b){ if(Math.abs(a.length - b.length) > 2) return 9; const d = Array.from({length:b.length + 1}, (_, i)=>i);
  for(let i=1;i<=a.length;i++){ let prev = d[0]; d[0] = i; for(let j=1;j<=b.length;j++){ const t = d[j]; d[j] = Math.min(d[j] + 1, d[j-1] + 1, prev + (a[i-1]===b[j-1] ? 0 : 1)); prev = t; } } return d[b.length]; }
function coincideMov(m, q){
  q = _norm(q).trim(); if(!q) return true;
  const txt = _norm(m.n + ' ' + m.al); if(txt.includes(q)) return true;
  const pal = txt.split(/[^a-z0-9]+/).filter(Boolean);
  return q.split(/\s+/).every(t=>t.length < 3 ? pal.some(p=>p.startsWith(t)) : pal.some(p=>p.startsWith(t) || (t.length >= 4 && _dist(t, p.slice(0, t.length + 1)) <= (t.length >= 7 ? 2 : 1)) || _dist(t, p) <= (t.length >= 7 ? 2 : 1)));
}
/* Para movimientos escritos a mano: el del catálogo que mejor calza (o null) */
function movParecido(nombre){ const q = _norm(nombre).trim(); if(q.length < 4) return null; const c = MOVS.filter(m=>coincideMov(m, q)); return c.length===1 ? c[0] : c.find(m=>_norm(m.al).split(/\s+/).join(' ').includes(q)) || null; }
const movDe = id=>MOVS.find(m=>m.id===id);
/* Nombre en inglés de cada movimiento (como se dice en los box y gimnasios). Se muestran según Perfil → Nombres de ejercicios. */
const EN_MOV = {carrera:'Run', sprint:'Sprint', trote_z2:'Easy run (zone 2)', carrera_cinta:'Treadmill run', carrera_curva:'Curved treadmill run', carrera_cerro:'Hill run', trail:'Trail run',
  shuttle:'Shuttle run', carrera_tenida:'Run in combat gear', marcha:'Ruck march', caminata:'Walk', nado:'Swim', nado_abierto:'Open water swim', nado_tenida:'Swim in uniform', remo:'Row',
  remo_cal:'Row (calories)', bici:'Bike', bici_estatica:'Stationary bike', bici_aire:'Assault bike', bici_aire_cal:'Assault bike (calories)', ski:'Ski erg', ski_cal:'Ski erg (calories)',
  eliptica:'Elliptical', escaladora:'Stair climber', cuerda:'Single-unders', dobles:'Double-unders', cruzados:'Crossover jump rope', triples:'Triple-unders', barras:'Pull-ups',
  barras_estrictas:'Strict pull-ups', barras_kipping:'Kipping pull-ups', barras_butterfly:'Butterfly pull-ups', barras_pecho:'Chest-to-bar pull-ups', barras_supinas:'Chin-ups',
  barras_lastre:'Weighted pull-ups', barras_l:'L-sit pull-ups', muscle_up:'Bar muscle-ups', muscle_up_anillas:'Ring muscle-ups', remo_anillas:'Ring rows', flexiones:'Push-ups',
  flexiones_rod:'Knee push-ups', flexiones_mano:'Hand-release push-ups', flexiones_diamante:'Diamond push-ups', flexiones_declinadas:'Decline push-ups', flexiones_aplauso:'Clap push-ups',
  fondos:'Dips', fondos_anillas:'Ring dips', fondos_banco:'Bench dips', hspu:'Handstand push-ups', hspu_estrictas:'Strict handstand push-ups', pino:'Handstand hold', caminata_manos:'Handstand walk',
  sentadilla_aire:'Air squats', pistol:'Pistols', sentadilla_salto:'Jump squats', zancadas:'Lunges', zancadas_salto:'Jumping lunges', burpees:'Burpees', burpee_barra:'Bar-facing burpees',
  burpee_cajon:'Burpee box jumps', burpee_dominada:'Burpee pull-ups', cajon:'Box jumps', cajon_sobre:'Box jump-overs', subida_cajon:'Step-ups', subida_cuerda:'Rope climbs',
  subida_cuerda_sin:'Legless rope climbs', escaladores:'Mountain climbers', tijeras:'Jumping jacks', colgado:'Dead hang', colgado_flex:'Flexed-arm hang', abdominales:'Sit-ups',
  abd_abmat:'AbMat sit-ups', ghd:'GHD sit-ups', hiperextension:'Back extensions', toes:'Toes-to-bar', rodillas_codos:'Knees-to-elbows', elev_piernas:'Hanging leg raises', v_ups:'V-ups',
  hollow_rock:'Hollow rocks', crunch:'Crunches', giros_rusos:'Russian twists', rueda:'Ab wheel rollouts', plancha:'Plank', plancha_lateral:'Side plank', l_sit:'L-sit', hollow_hold:'Hollow hold',
  superman:'Superman', sent_pared:'Wall sit', sentadilla:'Back squat', sent_frontal:'Front squat', sent_overhead:'Overhead squat', sent_cajon:'Box squat', peso_muerto:'Deadlift',
  pm_sumo:'Sumo deadlift', pm_rumano:'Romanian deadlift', sumo_hp:'Sumo deadlift high pull', banca:'Bench press', banca_inclinada:'Incline bench press', press:'Strict press',
  push_press:'Push press', push_jerk:'Push jerk', split_jerk:'Split jerk', jerk:'Jerk', envion:'Clean & jerk', arranque:'Snatch', arranque_pot:'Power snatch', arranque_colgado:'Hang snatch',
  cargada:'Power clean', cargada_sent:'Squat clean', cargada_colgado:'Hang clean', cluster:'Cluster', thruster:'Thrusters', remo_barra:'Barbell row', zancadas_peso:'Barbell lunges',
  hip_thrust:'Hip thrust', buenos_dias:'Good mornings', curl:'Barbell curl', encogimientos:'Shrugs', jalon:'Lat pulldown', prensa:'Leg press', extension_cuad:'Leg extension',
  kb_swing:'Russian kettlebell swings', kb_swing_am:'American kettlebell swings', kb_goblet:'Goblet squat', kb_snatch:'Kettlebell snatch', kb_clean:'Kettlebell clean',
  kb_press:'Kettlebell press', turco:'Turkish get-up', mc_snatch:'Dumbbell snatch', mc_clean:'Dumbbell clean', mc_envion:'Dumbbell clean & jerk', mc_thruster:'Dumbbell thrusters',
  mc_press:'Dumbbell press', mc_push_press:'Dumbbell push press', mc_banca:'Dumbbell bench press', mc_remo:'Dumbbell row', mc_pm:'Dumbbell deadlift', mc_zancadas:'Dumbbell lunges',
  mc_step:'Dumbbell step-ups', mc_devil:'Devil press', mc_man_maker:'Man makers', mc_curl:'Dumbbell curl', mc_lateral:'Lateral raises', wall_ball:'Wall balls', slam_ball:'Slam balls',
  balon_pecho:'Medicine ball chest pass', farmer:'Farmer carry', traslado:'Fireman carry', arrastre_herido:'Casualty drag', arrastre:'Low crawl', arrastre_alto:'High crawl', gateo:'Bear crawl',
  sdc:'Sprint-drag-carry', cajas_municion:'Ammo can carry', pista_obstaculos:'Obstacle course', trineo:'Sled push', trineo_tiro:'Sled pull', yugo:'Yoke carry', sandbag:'Sandbag lifts',
  sandbag_hombro:'Sandbag to shoulder', atlas:'Atlas stones', neumatico:'Tire flips', cuerdas_batalla:'Battle ropes', muro:'Wall climb', granada:'Grenade throw', tendidas:'Up-downs',
  zancadas_caminando:'Walking lunges', zancadas_laterales:'Lateral lunges', zancadas_overhead:'Overhead lunges', sent_bulgara:'Bulgarian split squat', puente_gluteo:'Glute bridge',
  elev_talones:'Calf raises', rodillas_arriba:'High knees', talones_gluteo:'Butt kicks', desplaz_lateral:'Lateral shuffle', carioca:'Carioca', progresivos:'Strides', salto_largo:'Broad jumps',
  burpee_salto_largo:'Burpee broad jumps', saltos_rana:'Frog jumps', saltos_estrella:'Star jumps', tuck_jumps:'Tuck jumps', flexiones_pike:'Pike push-ups', flexiones_arquero:'Archer push-ups',
  barras_comando:'Commando pull-ups', skin_cat:'Skin the cat', pies_anillas:'Toes-to-rings', inchworm:'Inchworms', pegboard:'Pegboard', patadas_tijera:'Flutter kicks', dead_bug:'Dead bugs',
  bird_dog:'Bird dogs', abd_bicicleta:'Bicycle crunches', dragon_flag:'Dragon flags', abd_peso:'Weighted sit-ups', kb_thruster:'Kettlebell thrusters', kb_lunges:'Kettlebell lunges',
  kb_rack_carry:'Kettlebell front-rack carry', maleta_carry:'Suitcase carry', overhead_carry:'Overhead carry', sandbag_carry:'Sandbag carry', mazo:'Sledgehammer strikes',
  camilla:'Stretcher carry', reptar:'Belly crawl', sprint_fusil:'Sprint with rifle', salto_zanja:'Ditch jump', clean_press:'Clean & press', muscle_snatch:'Muscle snatch',
  snatch_balance:'Snatch balance', pm_hexagonal:'Trap bar deadlift', pm_una_pierna:'Single-leg deadlift', sent_zercher:'Zercher squat', press_frances:'Skull crushers',
  triceps_polea:'Triceps pushdown', remo_polea:'Cable row', aperturas:'Dumbbell flyes', pullover:'Pullover', face_pull:'Face pulls', curl_femoral:'Leg curl', nordic:'Nordic curls',
  elev_frontales:'Front raises', press_hombro_maq:'Machine shoulder press', bike_erg:'Bike erg', nado_crol:'Freestyle swim', nado_pecho:'Breaststroke swim'};
MOVS.forEach(m=>{ m.en = EN_MOV[m.id] || ''; m.al += ' ' + m.en; });
/* Nombre para mostrar según Perfil → Nombres de ejercicios ('ambos' por defecto: inglés · español). Respeta nombres escritos a mano. */
const nombreEs = n=>String(n || '').split(' (')[0];
function nomMov(m){
  if(!m) return '';
  const mv = m.c && m.al!==undefined ? m : movDe(m.mov || m.id);
  if(!mv) return nombreEs(m.n);
  if(m!==mv && m.n && m.n!==mv.n && nombreEs(m.n)!==nombreEs(mv.n)) return m.n;   // nombre propio (ej. «Carrera hacia atrás»)
  const es = nombreEs(mv.n), en = mv.en || es, modo = (typeof S!=='undefined' && S.perfil && S.perfil.idiomaMov) || 'ambos';
  return modo==='es' ? es : modo==='en' ? en : (en.toLowerCase()===es.toLowerCase() ? en : en + ' · ' + es);
}
