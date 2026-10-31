/* #NSCE — Etapa 1 de la revisión «didáctica, simple, intuitiva y entretenida» (22-oct-2026): bienvenida en 3 pasos para quien abre
   la app por primera vez (nombre, objetivo → líneas del WOD del día, nivel → meta de entrenamientos por semana) y botón «?» de ayuda en la
   barra de arriba con una explicación corta y un ejemplo de cada pantalla (AYUDA). La bienvenida sale una vez (perfil.bienvenida); quien ya
   tiene entrenamientos no la ve. En las pruebas (navigator.webdriver) no sale sola, salvo window.__bienvenida. */
/* 24-oct-2026 (pedido del usuario): la bienvenida suma «Soy hombre / mujer» (tablas por sexo, «Mujer fuerte» y Mi ciclo), los objetivos
   «Aprobar la PSF» y «Mujer fuerte» (este solo para mujeres; a las mujeres se les agrega la línea «Mujer fuerte» con cualquier objetivo),
   un paso para elegir el color principal (se ve al tocar) y, al final, «📅 Armar mi plan» según el objetivo (PSF, mujer o combate). */
const OBJ_BIEN = [
  {id:'combate', n:'Combate y servicio', d:'Carrera, marcha, fuerza y funcional para el combate', lineas:['tac', 'fun', 'run', 'hero'], plan:{obj:'combate'}},
  {id:'psf', n:'Aprobar la PSF', d:'2.400 m, abdominales y barras o flexiones, con un plan hasta tu prueba', lineas:['tac', 'run', 'fun', 'hero'], plan:{obj:'psf', sub:'Apto muy bueno'}},
  {id:'mujer', n:'Mujer fuerte', d:'Fuerza, rodilla sana, huesos fuertes y barras', lineas:['mujer', 'fun', 'run', 'hero'], soloM:true, plan:{obj:'mujer', sub:'Fuerza y salud'}},
  {id:'general', n:'Estar en forma', d:'WOD funcionales variados, Girls y Héroes', lineas:['fun', 'cla', 'hero', 'mono']},
  {id:'fuerza', n:'Ganar fuerza', d:'Levantamientos y musculación', lineas:['mus', 'cla', 'fun']},
  {id:'correr', n:'Correr mejor', d:'Ritmo, distancia y velocidad', lineas:['run', 'xrun', 'mono']},
  {id:'todo', n:'Un poco de todo', d:'Ver todas las líneas del WOD del día', lineas:null},
];
const NIVEL_BIEN = [['inicio', 'Empezando', 'Entreno poco o vuelvo después de un tiempo', 3], ['medio', 'Intermedio', 'Entreno seguido hace meses', 4], ['alto', 'Avanzado', 'Entreno fuerte hace años', 5]];
const SEXO_BIEN = [['H', 'Hombre'], ['M', 'Mujer'], ['', 'Prefiero no decir']];
const PASOS_BIEN = 4;
const debeBienvenida = ()=>!S.perfil.bienvenida && !S.sesiones.length && (!navigator.webdriver || window.__bienvenida);
let BV = null;
function bienvenida(){ BV = {paso:1, nombre:S.perfil.nombre || '', sexo:S.perfil.sexo || null, obj:S.perfil.objBien || '', nivel:S.perfil.nivelBien || '', meta:S.perfil.meta || '', color:S.perfil.color || 'lima'}; pasoBienvenida(); }
function terminarBienvenida(){ S.perfil.bienvenida = hoyISO(); guardar(); const d = $('#dialogo'); if(d.open) d.close(); ir('hoy'); }
const objsBien = ()=>OBJ_BIEN.filter(o=>!o.soloM || BV.sexo==='M');
function pasoBienvenida(){
  const puntos = `<div class="bv-puntos">${Array.from({length:PASOS_BIEN}, (_, i)=>`<i class="${i + 1<=BV.paso ? 'on' : ''}"></i>`).join('')}</div>`;
  const pie = (sig, txt)=>`<div class="btns"><button class="btn" id="bvSaltar">${BV.paso===1 ? 'Saltar' : '‹ Atrás'}</button><button class="btn prim" id="bvSig" ${sig ? '' : 'disabled'}>${txt || 'Siguiente ›'}</button></div>`;
  let html = '';
  if(BV.paso===1) html = `<div class="bv-hola">💪</div><h2>Te damos la bienvenida a ${APP}</h2>
    <p class="suave">Tu app para entrenar, anotar tus resultados y ver cómo mejoras. Son 4 preguntas cortas.</p>
    <label for="bvNombre">¿Cómo te llamas?</label><input id="bvNombre" autocomplete="given-name" placeholder="Tu nombre" value="${esc(BV.nombre)}">
    <label>Soy</label><div class="segmentos" id="bvSexo">${SEXO_BIEN.map(([k, n])=>`<button data-sexo="${k}" class="${BV.sexo===k ? 'activa' : ''}">${n}</button>`).join('')}</div>
    <p class="nota" style="margin-top:4px">Las tablas de las pruebas cambian según el sexo. Si eres mujer, te ofrecemos la línea «Mujer fuerte».</p>
    <p class="nota bv-legal">Tus datos quedan en tu teléfono. Al continuar aceptas los <a href="terminos.html" target="_blank" rel="noopener">Términos de uso</a> y la <a href="privacidad.html" target="_blank" rel="noopener">Política de privacidad</a>.</p>${pie(true)}`;
  if(BV.paso===2) html = `<h2>¿Qué quieres lograr?</h2><p class="suave chico">Con esto elegimos el WOD del día que te proponemos.</p>
    <div class="opciones bv-ops">${objsBien().map(o=>`<button class="opcion ${BV.obj===o.id ? 'activa' : ''}" data-obj="${o.id}"><b>${o.n}</b><span>${o.d}</span></button>`).join('')}</div>${pie(!!BV.obj)}`;
  if(BV.paso===3) html = `<h2>¿Cuál es tu nivel?</h2>
    <div class="opciones bv-ops">${NIVEL_BIEN.map(([k, n, d])=>`<button class="opcion ${BV.nivel===k ? 'activa' : ''}" data-niv="${k}"><b>${n}</b><span>${d}</span></button>`).join('')}</div>
    <label>Días por semana que quieres entrenar</label><div class="chips bv-dias">${[2, 3, 4, 5, 6].map(n=>`<button data-dias="${n}" class="${String(BV.meta)===String(n) ? 'activa' : ''}">${n}</button>`).join('')}</div>${pie(!!BV.nivel)}`;
  if(BV.paso===4) html = `<h2>Elige tu color</h2><p class="suave chico">Es el color de los botones y lo destacado. Lo puedes cambiar cuando quieras en Perfil → Ajustes.</p>
    <div class="colores-app bv-colores">${COLORES_APP.map(([k, n, c])=>`<button data-bcol="${k}" class="${BV.color===k ? 'activa' : ''}" aria-label="${n}"><i style="background:${c}"></i><span>${n}</span></button>`).join('')}</div>
    <div class="bv-muestra"><button class="btn prim ancho" tabindex="-1">▶ Así se ve un botón</button></div>${pie(true, 'Listo ›')}`;
  if(BV.paso===5){ const w = wodDeHoy(), o = OBJ_BIEN.find(x=>x.id===BV.obj) || {};
    html = `<div class="bv-hola">🎯</div><h2>¡Listo${BV.nombre ? ', ' + esc(BV.nombre.split(' ')[0]) : ''}!</h2>
    <ol class="bv-lista"><li><b>Arriba en Inicio</b> está tu entrenamiento de hoy${w ? ' (hoy: <b>' + esc(w.t.titulo) + '</b>)' : ''}. <b>▶ Empezar</b> abre el reloj.</li>
      <li>Al terminar toca <b>＋ Ya lo hice</b> y anota tu resultado. El botón <b>＋</b> de abajo registra cualquier otro entrenamiento.</li>
      <li>Cumple el <b>desafío de la semana</b> para sumar puntos y subir de rango.</li>
      ${BV.sexo==='M' ? '<li>Si quieres, en Perfil → Salud puedes activar <b>Mi ciclo</b> (privado: solo queda en tu teléfono).</li>' : ''}</ol>
    ${o.plan ? `<div class="tarjeta bv-plan"><b>📅 ${o.id==='psf' ? '¿Tienes fecha para tu PSF?' : '¿Quieres un plan semana a semana?'}</b><p class="suave chico">${o.id==='psf' ? 'Arma tu plan hasta la prueba: entrena primero tu prueba más débil.' : o.id==='mujer' ? 'Fuerza, rodilla sana, barras y huesos fuertes, según tus días.' : 'Las 7 capacidades del combate, según tus días.'}</p><button class="btn ancho" id="bvPlan">Armar mi plan</button></div>` : ''}
    <p class="suave chico">¿Dudas? El botón <b>?</b> de arriba explica cada pantalla.</p>
    <div class="btns"><button class="btn prim ancho" id="bvFin">Empezar a entrenar</button></div>`; }
  dialogo(`<div class="bv">${BV.paso<=PASOS_BIEN ? puntos : ''}${html}</div>`, d=>{
    d.classList.add('dlg-bienvenida');
    if($('#bvNombre', d)) $('#bvNombre', d).oninput = e=>BV.nombre = e.target.value;
    $$('[data-sexo]', d).forEach(b=>b.onclick = ()=>{ BV.sexo = b.dataset.sexo; $$('[data-sexo]', d).forEach(x=>x.classList.toggle('activa', x===b)); if(BV.sexo!=='M' && BV.obj==='mujer') BV.obj = ''; });
    $$('[data-obj]', d).forEach(b=>b.onclick = ()=>{ BV.obj = b.dataset.obj; pasoBienvenida(); });
    $$('[data-niv]', d).forEach(b=>b.onclick = ()=>{ BV.nivel = b.dataset.niv; if(!BV.meta) BV.meta = String(NIVEL_BIEN.find(x=>x[0]===BV.nivel)[3]); pasoBienvenida(); });
    $$('[data-dias]', d).forEach(b=>b.onclick = ()=>{ BV.meta = b.dataset.dias; pasoBienvenida(); });
    $$('[data-bcol]', d).forEach(b=>b.onclick = ()=>{ BV.color = b.dataset.bcol; S.perfil.color = BV.color; aplicarTema(); pasoBienvenida(); });
    if($('#bvSaltar', d)) $('#bvSaltar', d).onclick = ()=>{ if(BV.paso===1) return terminarBienvenida(); BV.paso--; pasoBienvenida(); };
    if($('#bvSig', d)) $('#bvSig', d).onclick = ()=>{
      if(BV.paso===1){ S.perfil.nombre = BV.nombre.trim(); if(BV.sexo!=null) S.perfil.sexo = BV.sexo; }
      if(BV.paso===2){ const o = OBJ_BIEN.find(x=>x.id===BV.obj); S.perfil.objBien = o.id; S.perfil.lineas = o.lineas ? o.lineas.slice() : null; S.perfil.lineaHero = true; S.perfil.lineaMujer = true;
        if(S.perfil.lineas && BV.sexo==='M' && !S.perfil.lineas.includes('mujer')) S.perfil.lineas.push('mujer');
        { const k = o.lineas ? lineasVisibles().findIndex(l=>l.id===o.lineas[0]) : 0; pref('pista', String(Math.max(0, k))); } }   // Inicio parte por la línea del objetivo (visto en el simulador 26-oct-2026)
      if(BV.paso===3){ S.perfil.nivelBien = BV.nivel; S.perfil.meta = String(BV.meta || NIVEL_BIEN.find(x=>x[0]===BV.nivel)[3]); }
      if(BV.paso===4){ S.perfil.color = BV.color; aplicarTema(); }
      guardar(); BV.paso++; pasoBienvenida(); };
    if($('#bvPlan', d)) $('#bvPlan', d).onclick = ()=>{ const o = OBJ_BIEN.find(x=>x.id===BV.obj); S.perfil.bienvenida = hoyISO(); guardar();
      dialogoPlan(Object.assign({}, o.plan, o.id==='psf' && typeof fechaPSFSugerida==='function' ? {fecha:fechaPSFSugerida()} : {})); };
    if($('#bvFin', d)) $('#bvFin', d).onclick = terminarBienvenida;
  });
}

/* ---------- Ayuda «?» de cada pantalla ---------- */
const AYUDA = {
  hoy:{t:'Inicio', p:['Aquí está lo de hoy. Arriba, tu entrenamiento propuesto: «▶ Empezar» abre el reloj ya listo y «＋ Ya lo hice» abre el registro con ese WOD para anotar tu resultado.',
    'Más abajo marcas cómo llegas (sueño, alimentación y energía), el agua del día y el desafío de la semana, que suma puntos para subir de rango.'],
    ej:'Ejemplo: hoy toca «Cindy». Tocas ▶ Empezar, haces los 20 minutos, tocas «Ya lo hice» y anotas 15 rondas + 5.'},
  diario:{t:'Diario', p:['Tu historial como una red social: cada entrenamiento con su foto o su afiche, tus récords y logros.',
    'Las pestañas de arriba cambian a Agenda (planificar días), Calendario (todo el año) y Acumulados (kilómetros, horas, toneladas).'],
    ej:'Ejemplo: toca 📷 en un entrenamiento para agregarle la foto y ↗ para compartirlo en Instagram.'},
  psf:{t:'Pruebas', p:['Tests para medir tu condición, elegidos según tu objetivo: Salud general (flexiones, plancha, flexibilidad, caminata), Rendimiento (Cooper, Course Navette, salto largo, fuerza relativa) y Militar Chile (la PSF del Ejército, con su cartilla).',
    'Arriba está tu «edad física»: la edad de una persona promedio con tu capacidad aeróbica. Repite las pruebas cada 8 a 12 semanas para ver tu avance.'],
    ej:'Ejemplo: corres 2.500 m en el test de Cooper a los 48 años → nivel «Muy bueno» y edad física de unos 36 años.'},
  progreso:{t:'Analizar', p:['Tu avance en números y gráficos. Arriba, cómo llegas hoy y tu progreso del mes comparado con el anterior.',
    'Cada cuadro de abajo abre un análisis: récords, pesos y % del máximo, días entrenados, calorías, lesiones y más.'],
    ej:'Ejemplo: abre «Pesos y % 1RM» para saber cuánto cargar al 80 % de tu máximo en sentadilla.'},
  perfil:{t:'Perfil', p:['Tus datos, tus insignias y tu nivel en cada capacidad física. También los ajustes: unidades (kg o lb, km o millas), estilo de la app, música y respaldo.',
    'Haz un respaldo de vez en cuando: tus datos viven solo en este teléfono.'],
    ej:'Ejemplo: en «Experiencia y objetivo» eliges qué líneas del WOD del día quieres ver.'},
  reloj:{t:'Reloj', p:['Cronómetro para entrenar: por tiempo, AMRAP (cuenta regresiva), EMOM (cada minuto) e intervalos (trabajo y descanso).',
    'Avisa con pitidos que suenan sobre tu música. «＋1» marca cada ronda y al terminar te muestra el tiempo de cada una.'],
    ej:'Ejemplo: EMOM 10 minutos → suena al empezar cada minuto, a los 30 segundos y en 3-2-1.'},
  plan:{t:'Mi plan', p:['Arma tu plan de varias semanas según tu objetivo (combate, marcha, carrera, fuerza…) y los días que puedes entrenar.',
    'Cada día te dice qué toca; puedes mover o cambiar un día.'],
    ej:'Ejemplo: plan de marcha para dentro de 8 semanas, 4 días por semana.'},
  unidad:{t:'Mi unidad', p:['Para el instructor o comandante: crea la unidad, invita a tus alumnos y recibe sus partes de entrenamiento.',
    'Ves quién entrenó, alertas de sobrecarga y el ranking de cada prueba.'],
    ej:'Ejemplo: publica la tarea del día y revisa quién la cumplió y con qué resultado.'},
};
function abrirAyuda(){
  const a = AYUDA[vistaActual] || AYUDA.hoy;
  dialogo(`<div class="cab"><h2>? ${esc(a.t)}</h2><button class="btn chico-btn" data-cerrar aria-label="Cerrar">✕</button></div>
    ${a.p.map(x=>`<p>${esc(x)}</p>`).join('')}<div class="ayuda-ej">${esc(a.ej)}</div>
    <div class="btns"><button class="btn" id="ayBien">Ver la bienvenida otra vez</button><button class="btn prim" data-cerrar>Entendido</button></div>`, d=>{
    $('#ayBien', d).onclick = ()=>bienvenida(); });
}
