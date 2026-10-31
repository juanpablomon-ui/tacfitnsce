/* #NSCE Plus — la versión completa por suscripción (27-oct-2026; maqueta aprobada en propuestas/plus_propuesta.html).
   Gratis (más restrictivo desde el 27-oct-2026, pedido del usuario): registrar, reloj por tiempo y AMRAP, ver y anotar los últimos 7 días,
   biblioteca de WOD (versión Rx), anotar la batería principal, el resumen del mes, logros y récords, la plantilla Clásico y unirse a una unidad.
   Plus: Mi plan, WOD a tu medida, InBody completo, Analizar completo (estado del día, forma, gráficos, informe, predicción), todo el historial,
   EMOM / intervalos / tramos, niveles de las pruebas (nivel, normas, VO₂, radar, edad física), todas las baterías y plantillas.
   Plan Instructor (aparte, aún no se vende): crear y manejar unidades (vUnidad); la prueba de Plus no lo incluye.
   EL COBRO AÚN NO ESTÁ ACTIVO (NSCE_COBRO = false): la web publicada sigue con todo incluido. Se enciende en la versión de las tiendas cuando
   exista la compra de Apple / Google (Capacitor); la app nunca ve la tarjeta. «Ver cómo será Plus» (Ajustes → Tu plan) enciende una vista previa
   solo en ese teléfono (pref plusVista). Plus sin pagar: 7 días de prueba (una vez, S.plus.prueba) y los alumnos unidos a una unidad (S.unidad).
   Pantalla Plus en un <dialog> propio (#dlgPlus) para no cerrar lo que estaba abierto (p. ej. el registro). */
window.NSCE_COBRO = window.NSCE_COBRO === true;
const PLUS_PLANES = {anual:{n:'Anual', precio:29990, por:'año', mes:2499, nota:'ahorras 37 %'}, mensual:{n:'Mensual', precio:3990, por:'mes', nota:'Cancela cuando quieras'}};
const PLUS_PRUEBA = 7, PLUS_INSTRUCTOR = 9990;
const pesos = n=>'$' + n.toLocaleString('es-CL');
const cobroActivo = ()=>window.NSCE_COBRO || pref('plusVista')==='1';
function estadoPlus(){
  if(!cobroActivo()) return {plus:true, tipo:'incluido'};
  const P = S.plus || {}, hoy = hoyISO();
  if(P.vence && P.vence >= hoy) return {plus:true, tipo:'pago', plan:P.plan, vence:P.vence};
  if(S.unidad && S.unidad.codigo) return {plus:true, tipo:'unidad', unidad:S.unidad.unidad || S.unidad.codigo};
  if(P.prueba){ const q = PLUS_PRUEBA - diasEntre(P.prueba, hoy); if(q > 0) return {plus:true, tipo:'prueba', quedan:q, fin:masDias(P.prueba, PLUS_PRUEBA)}; }
  return {plus:false, pruebaUsada:!!P.prueba};
}
const esPlus = ()=>estadoPlus().plus;
/* Al lanzar (30-oct-2026, decisión del usuario): crear y manejar unidades es GRATIS, para que los cursos la usen y se corra la voz.
   El Plan Instructor queda listo (pantallaInstructor) por si después se vende: basta poner INSTRUCTOR_GRATIS = false. */
const INSTRUCTOR_GRATIS = true;
const esInstructor = ()=>INSTRUCTOR_GRATIS || !cobroActivo() || !!(S.plus && S.plus.instructor && S.plus.instructor >= hoyISO());
const RELOJ_PLUS = ['emom', 'tabata', 'tramos'];
const DIAS_GRATIS = 7, desdeGratis = ()=>masDias(hoyISO(), -DIAS_GRATIS);   // gratis: ve y anota los últimos 7 días (pedido del usuario 27-oct-2026)
/* Lo que se explica al tocar algo Plus: [ícono, título, para qué sirve, ejemplo] */
const MOTIVOS_PLUS = {
  plan:['🗓️', 'Mi plan es parte de Plus', 'La app arma tu semana según tu objetivo, tu nivel y cómo te sientes cada día.', 'si ayer dormiste mal, hoy te cambia los intervalos por un trote suave de 30 min.'],
  wod:['📶', 'WOD a tu medida es parte de Plus', 'Cada WOD en versión Intermedio o Principiante, con cargas más livianas, ejercicios más simples y meta de tiempo.', 'Fran: Rx con 43 kg; Principiante con 25 kg y barras asistidas.'],
  inbody:['🧬', 'El InBody es parte de Plus', 'Anota tu InBody (o sácale una foto y la app lo llena sola), mira tu recomposición y ajusta proteína y ejercicios.', 'la app lee peso, músculo, grasa y cada brazo y pierna, y ajusta tu proteína.'],
  analizar:['📊', 'Analizar completo es parte de Plus', 'Tu estado del día, cómo vas en 90 días, sistemas, pesos, movimientos, mapa del cuerpo, lesiones y desequilibrios.', 'empujas un 40 % más de lo que tiras: suma remo y dominadas.'],
  historial:['🗂️', 'Todo tu historial es parte de Plus', 'Gratis ves y anotas los últimos 7 días. Con Plus ves todo tu historial, anotas cualquier fecha y tienes tus acumulados e hitos. Nada se borra.', 'cuántos km llevas este año y tu mejor mes.'],
  reloj:['⏱️', 'EMOM, intervalos y tramos son parte de Plus', 'El reloj por tiempo y el AMRAP son gratis. Plus suma EMOM, intervalos y sesiones guiadas por tramos (con GPS).', 'Noruego 4×4: el reloj te avisa cada cambio de 4 min fuerte y 3 suave.'],
  niveles:['🎯', 'Tus niveles son parte de Plus', 'Anotar tus pruebas es gratis. Plus te dice tu nivel, tus normas por edad y sexo, tu VO₂máx, tu radar de capacidades y tu rendimiento PSF.', 'Cooper 2.800 m: «Bueno» para tu edad y VO₂máx 51.'],
  garmin:['⌚', 'El análisis de tu VO₂máx es parte de Plus', 'Anotar el VO₂máx de tu reloj es gratis. Plus lo usa en tu estado del día, tu edad física y su curva en el tiempo.', 'VO₂máx 51 a los 41 años: «Muy bueno» y edad física de 34.'],
  instructor:['👥', 'Crear una unidad es del Plan Instructor', 'Panel de la unidad, tarea del día, partes, afiches del mes y Plus incluido para tus alumnos.', 'publicas el Noruego 4×4 y ves quién lo cumplió y con qué resultado.'],
  informe:['📈', 'El informe del mes es parte de Plus', 'Tu mes en números, este año contra el anterior y tu radar de capacidades antes y ahora.', 'octubre: 18 sesiones, ▲ 12 % de km y 3 récords nuevos.'],
  prediccion:['🏃', 'La predicción de carrera es parte de Plus', 'Con tus carreras registradas, la app calcula en cuánto harías 2,4 km, 5 km, 10 km o la media maratón.', 'si corriste 5 km en 25 min, 10 km en unos 52 min.'],
  pruebas:['🎯', 'Todas las pruebas son parte de Plus', 'Tu batería principal es gratis. Plus suma las demás (Cooper, AFT, Híbrido, Adulto mayor…) y tu edad física.', 'tu edad física: 34 años con 41 de edad real.'],
  plantillas:['📸', 'Todas las plantillas son parte de Plus', 'Gratis tienes «Clásico». Plus suma Número grande, Entrenamiento, Pizarra, Emblema, Solo la foto y Sticker.', 'el sticker con tu tiempo, para pegar sobre tu historia de Instagram.'],
};
const VENTAJAS_PLUS = [['🗓️', 'Mi plan semanal', 'Se ajusta a tu nivel, tu cansancio y tus días libres'], ['📶', 'WOD a tu medida', 'Ej.: Fran en versión Principiante, Intermedio o Rx, con meta de tiempo'],
  ['📈', 'Analizar completo', 'Estado del día, forma, gráficos, informe del mes y predicción de carrera'], ['🎯', 'Tus niveles y todas las pruebas', 'Nivel, normas, VO₂máx, radar, edad física; PSF, Cooper, AFT, Híbrido…'],
  ['⏱️', 'Reloj completo', 'EMOM, intervalos y sesiones por tramos con GPS'], ['🧬', 'InBody inteligente', 'Lee la foto y ajusta proteína y ejercicios'],
  ['🗂️', 'Todo tu historial', 'Gratis ves 7 días; con Plus, todo y tus acumulados'], ['📸', 'Todas las plantillas', '7 plantillas para compartir tus entrenamientos']];
function dlgPlus(){ let d = $('#dlgPlus'); if(!d){ d = document.createElement('dialog'); d.id = 'dlgPlus'; d.className = 'hoja dlg-plus'; document.body.appendChild(d); } return d; }
/* Pantalla Plus. motivo = clave de MOTIVOS_PLUS (lo que tocó); alActivar = lo que se hace si empieza la prueba (p. ej. abrir lo que quería) */
function pantallaPlus(motivo, alActivar){
  if(motivo==='instructor') return pantallaInstructor();
  const d = dlgPlus(), E = estadoPlus(), M = MOTIVOS_PLUS[motivo]; let sel = 'anual';
  const pintar = ()=>{ const P = PLUS_PLANES[sel], prueba = !E.pruebaUsada && E.tipo!=='prueba';
    d.innerHTML = `<div class="entre"><span></span><button class="btn chico-btn" id="plCerrar" aria-label="Cerrar">✕</button></div>
      <div class="plus-hero"><span class="plus-sello">⚡ PLUS</span><h2>Entrena con plan,<br>no a la suerte</h2><p class="suave">Todo lo gratis sigue gratis. Plus agrega lo que te hace avanzar.</p></div>
      ${M ? `<div class="plus-motivo"><b>🔒 ${M[1]}</b><p>${M[2]}</p><p class="chico"><b>Ejemplo:</b> ${M[3]}</p></div>` : ''}
      ${E.plus ? `<div class="plus-ahora">✓ <b>Ya tienes Plus</b> ${E.tipo==='prueba' ? `(prueba gratis: te quedan ${E.quedan} días)` : E.tipo==='unidad' ? 'por tu unidad' : ''}.</div>`
        : `<div class="plus-ahora">👉 <b>Ahora:</b> ${prueba ? `prueba ${PLUS_PRUEBA} días gratis. Si no te sirve, no pagas nada.` : 'tu prueba gratis ya terminó. Elige un plan para seguir con Plus.'}</div>`}
      <ul class="plus-lista">${VENTAJAS_PLUS.map(([ic, t, s])=>`<li><span class="plus-ic">${ic}</span><div><b>${t}</b><span>${s}</span></div></li>`).join('')}</ul>
      ${E.plus ? '' : `<div class="plus-planes">${Object.entries(PLUS_PLANES).map(([k, p])=>`<button class="plus-plan ${k===sel ? 'sel' : ''}" data-plan="${k}">${k==='anual' ? '<span class="plus-cinta">MÁS CONVENIENTE</span>' : ''}
          <span class="plus-izq"><span class="plus-radio"></span><span><b>${p.n}</b><small>${p.mes ? pesos(p.mes) + ' al mes · ' : ''}${p.nota}</small></span></span><span class="plus-pr num">${pesos(p.precio)}<small>/${p.por}</small></span></button>`).join('')}</div>
        <button class="btn prim ancho plus-btn" id="plusSi">${prueba ? `Probar ${PLUS_PRUEBA} días gratis` : 'Suscribirme'}</button>
        <p class="chico suave plus-letra">${prueba ? `Después ${pesos(P.precio)} al ${P.por}. ` : ''}El pago lo hace Apple o Google: la app nunca ve tu tarjeta. Se cancela en Ajustes del teléfono → Suscripciones.</p>`}
      ${E.plus || (S.unidad && S.unidad.codigo) ? '' : '<button class="btn ancho" id="plusCod">🎟️ Tengo un código de mi unidad</button>'}
      <details class="que plus-que"><summary>❔ ¿Qué es Plus?</summary><p>Es la versión completa de la app. Registrar, el reloj por tiempo y AMRAP, tu diario de los últimos 7 días, la biblioteca de WOD, anotar tu batería principal y unirte a una unidad son gratis para siempre. Plus suma el plan, el análisis y las herramientas para progresar más rápido. Los alumnos unidos a una unidad tienen Plus incluido.</p></details>
      <p class="chico plus-pie"><button class="link" id="plusRest">Restaurar compra</button> · <a class="link" href="terminos.html" target="_blank">Términos</a> · <a class="link" href="privacidad.html" target="_blank">Privacidad</a></p>
      ${M && !E.plus ? '<button class="btn ancho" id="plusNo">Ahora no</button>' : ''}`;
    $('#plCerrar', d).onclick = ()=>d.close(); if($('#plusNo', d)) $('#plusNo', d).onclick = ()=>d.close();
    $$('[data-plan]', d).forEach(b=>b.onclick = ()=>{ sel = b.dataset.plan; pintar(); });
    if($('#plusSi', d)) $('#plusSi', d).onclick = ()=>{
      if(prueba){ S.plus = Object.assign({}, S.plus, {prueba:hoyISO(), elegido:sel}); guardar(); d.close(); aviso('⚡ Plus activo: ' + PLUS_PRUEBA + ' días gratis'); refrescarPlus(); if(alActivar) alActivar(); return; }
      comprarPlus(sel); };
    if($('#plusCod', d)) $('#plusCod', d).onclick = ()=>{ d.close(); dialogoUnirme(); };
    $('#plusRest', d).onclick = restaurarPlus;
  };
  pintar(); if(!d.open) d.showModal(); d.scrollTop = 0;
}
/* Plan Instructor: aún no se vende (llega con las tiendas) */
function pantallaInstructor(){
  const d = dlgPlus(), M = MOTIVOS_PLUS.instructor;
  d.innerHTML = `<div class="entre"><span></span><button class="btn chico-btn" id="plCerrar" aria-label="Cerrar">✕</button></div>
    <div class="plus-hero"><span class="plus-sello">👥 INSTRUCTOR</span><h2>Lleva a tu unidad<br>con datos</h2><p class="suave">${M[2]}</p></div>
    <div class="plus-motivo"><b>🔒 ${M[1]}</b><p class="chico"><b>Ejemplo:</b> ${M[3]}</p></div>
    <ul class="plus-lista">${[['📋', 'Panel de la unidad', 'Partes, filtros por compañía, sección y escuadra, alertas y Excel'], ['🎯', 'Tarea del día', 'Publicas el entrenamiento y ves quién cumplió y su resultado'], ['📣', 'Afiches del mes', 'Ranking, constancia y récords de tu unidad para compartir'], ['⚡', 'Plus para tus alumnos', 'Todos los que se unan con tu código tienen Plus incluido']].map(([ic, t, s])=>`<li><span class="plus-ic">${ic}</span><div><b>${t}</b><span>${s}</span></div></li>`).join('')}</ul>
    <div class="plus-plan sel"><span class="plus-izq"><span class="plus-radio"></span><span><b>Plan Instructor</b><small>Incluye tu Plus personal</small></span></span><span class="plus-pr num">${pesos(PLUS_INSTRUCTOR)}<small>/mes</small></span></div>
    <button class="btn prim ancho plus-btn" id="plusSi" style="margin-top:12px">Suscribirme</button>
    <p class="chico suave plus-letra">El Plan Instructor llega con la versión de App Store y Google Play. ¿Eres instructor de una institución? Escríbenos a claum.ventura@gmail.com.</p>
    <button class="btn ancho" id="plusNo">Ahora no</button>`;
  $('#plCerrar', d).onclick = $('#plusNo', d).onclick = ()=>d.close(); $('#plusSi', d).onclick = ()=>comprarPlus('instructor');
  if(!d.open) d.showModal(); d.scrollTop = 0;
}
/* La compra y restaurar llegan con la versión de las tiendas (StoreKit / Google Play Billing con Capacitor) */
function comprarPlus(plan){ aviso('La compra se activa cuando #NSCE esté en App Store y Google Play', 3500); }
function restaurarPlus(){ aviso('Restaurar compra funciona en la versión de las tiendas', 3000); }
/* Vuelve a dibujar lo que se ve (tras activar la prueba o cambiar la vista previa) */
function refrescarPlus(){ const v = typeof vistaActual!=='undefined' ? vistaActual : null; if(v && VISTAS[v]){ const y = window.scrollY; VISTAS[v](); window.scrollTo(0, y); } }
/* Tarjeta con candado en lugar de una parte Plus */
const htmlCandadoPlus = motivo=>{ const M = MOTIVOS_PLUS[motivo]; return `<button class="tarjeta plus-candado" data-plus="${motivo}"><span class="plus-ic">${M[0]}</span><div><b>${M[1].replace(' es parte de Plus', '')} <span class="plus-mini">PLUS</span></b><span class="suave chico">${M[2]}</span></div><span class="chev">›</span></button>`; };
/* Vista entera con candado: lo de abajo se ve borroso y arriba va la explicación (como la maqueta 2) */
function cubrirPlus(motivo){
  const v = $('#vista'), M = MOTIVOS_PLUS[motivo], E = estadoPlus(); if(!v) return;
  [...v.children].forEach((c, i)=>{ if(i > 0 || !c.classList.contains('cab-an')) c.classList.add('plus-borroso'); });
  const capa = document.createElement('div'); capa.className = 'tarjeta plus-capa';
  capa.innerHTML = `<div class="plus-candado-g">🔒</div><h3>${M[1]}</h3><p class="suave">${M[2]}</p><p class="chico"><b>Ejemplo:</b> ${M[3]}</p>
    <button class="btn prim ancho" data-plus="${motivo}">${motivo==='instructor' ? '👥 Ver Plan Instructor' : E.pruebaUsada ? '⚡ Ver Plus' : `Probar ${PLUS_PRUEBA} días gratis`}</button><button class="btn ancho" id="plusAhoraNo" style="margin-top:8px">Ahora no</button>`;
  const cab = v.querySelector('.cab-an'); if(cab) cab.after(capa); else v.prepend(capa);
  $('#plusAhoraNo', capa).onclick = ()=>{ const atras = v.querySelector('.cab-an button'); if(atras) atras.click(); else ir('hoy'); };
}
document.addEventListener('click', e=>{ const b = e.target.closest('[data-plus]'); if(b){ e.preventDefault(); e.stopPropagation(); pantallaPlus(b.dataset.plus, refrescarPlus); } }, true);

/* ---------- Ajustes → ⚡ Tu plan ---------- */
function resumenPlus(){ const E = estadoPlus();
  return E.tipo==='incluido' ? 'Todo incluido' : E.tipo==='pago' ? 'Plus ' + (PLUS_PLANES[E.plan] || {n:''}).n.toLowerCase() : E.tipo==='unidad' ? 'Plus por tu unidad' : E.tipo==='prueba' ? 'Plus · prueba (' + E.quedan + ' días)' : 'Gratis'; }
function htmlTuPlan(){
  const E = estadoPlus(), vista = !window.NSCE_COBRO && pref('plusVista')==='1';
  let cab;
  if(E.tipo==='incluido') cab = `<div class="plus-estado"><div class="suave chico">TU PLAN</div><div class="plus-v">✓ Todo incluido</div><p class="chico">En esta versión todo está abierto. Cuando #NSCE llegue a App Store y Google Play, lo avanzado será parte de <b>Plus</b> (${pesos(PLUS_PLANES.mensual.precio)} al mes o ${pesos(PLUS_PLANES.anual.precio)} al año, con ${PLUS_PRUEBA} días gratis). Los alumnos de una unidad lo tendrán incluido.</p></div>`;
  else if(E.tipo==='prueba') cab = `<div class="plus-estado"><div class="suave chico">TU PLAN</div><div class="plus-v">⚡ Plus · prueba gratis</div><p class="chico">Te quedan <b>${E.quedan} de ${PLUS_PRUEBA} días</b>. Termina el ${verFecha(E.fin)}.</p><div class="plus-barra"><i style="width:${Math.round((PLUS_PRUEBA - E.quedan) / PLUS_PRUEBA * 100)}%"></i></div></div>`;
  else if(E.tipo==='unidad') cab = `<div class="plus-estado"><div class="suave chico">TU PLAN</div><div class="plus-v">⚡ Plus</div><p class="chico">✓ Plus activo por tu unidad: <b>${esc(E.unidad)}</b>. Lo tienes mientras estés en ella.</p></div>`;
  else if(E.tipo==='pago') cab = `<div class="plus-estado"><div class="suave chico">TU PLAN</div><div class="plus-v">⚡ Plus ${(PLUS_PLANES[E.plan] || {n:''}).n.toLowerCase()}</div><p class="chico">Se renueva el ${verFecha(E.vence)}.</p></div>`;
  else cab = `<div class="plus-estado gratis"><div class="suave chico">TU PLAN</div><div class="plus-v">Gratis</div><p class="chico">Registrar, reloj básico, diario de 7 días, WOD en Rx y anotar tus pruebas. ${E.pruebaUsada ? 'Tu prueba gratis ya terminó.' : `Prueba Plus ${PLUS_PRUEBA} días gratis.`}</p><button class="btn prim ancho" data-plus="">⚡ Ver Plus</button></div>`;
  return `<div class="tarjeta">${vista ? '<p class="plus-previa chico">👁 <b>Vista previa de Plus</b> encendida en este teléfono: así lo verá alguien que no paga.</p>' : ''}${cab}
    ${E.tipo==='incluido' ? '' : `<div class="plus-filas">
      ${E.tipo==='pago' ? '<div class="plus-fila"><span>Cancelar suscripción</span><span class="suave">Ajustes del teléfono ›</span></div>' : ''}
      <button class="plus-fila" id="tpRest"><span>Restaurar compra</span><span class="chev">›</span></button>
      ${E.tipo==='unidad' ? '' : '<button class="plus-fila" id="tpCod"><span>🎟️ Código de unidad<small class="suave">Si tu instructor te dio un código, Plus queda gratis mientras estés en la unidad.</small></span><span class="link">Usar</span></button>'}
      ${INSTRUCTOR_GRATIS ? '<button class="plus-fila" id="tpInst"><span>👥 Instructor: crea tu unidad gratis<small class="suave">Panel de la unidad, tarea del día y Plus incluido para tus alumnos.</small></span><span class="link">Abrir</span></button>'
        : `<div class="plus-fila"><span>👥 Plan Instructor<small class="suave">Panel de la unidad, afiches del mes y Plus para tus alumnos · ${pesos(PLUS_INSTRUCTOR)}/mes</small></span><span class="suave chico">Pronto</span></div>`}</div>`}
    ${window.NSCE_COBRO ? '' : `<button class="btn ancho" id="tpVista" style="margin-top:10px">${vista ? 'Apagar la vista previa' : '👁 Ver cómo será Plus'}</button>`}</div>`;
}
function enlazarTuPlan(){
  if($('#tpRest')) $('#tpRest').onclick = restaurarPlus;
  if($('#tpCod')) $('#tpCod').onclick = dialogoUnirme; if($('#tpInst')) $('#tpInst').onclick = ()=>ir('unidad');
  if($('#tpVista')) $('#tpVista').onclick = ()=>{ const on = pref('plusVista')!=='1'; pref('plusVista', on ? '1' : ''); aviso(on ? '👁 Vista previa de Plus encendida' : 'Vista previa apagada: todo incluido'); vPerfil(); };
}
