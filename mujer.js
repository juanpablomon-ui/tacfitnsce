/* #NSCE — «Mujer fuerte» (24-oct-2026, maqueta aprobada por el usuario). Basado en: prevención de lesión de rodilla (ligamento cruzado
   anterior: 2 a 8 veces más frecuente en mujeres; los calentamientos neuromusculares tipo FIFA 11+ / PEP la bajan cerca de 50 %), huesos
   (fracturas por estrés en la instrucción: carga progresiva, fuerza y saltos dosificados), tren superior (progresión de barras) y suelo pélvico.
   El ciclo menstrual NO programa las sesiones por fases (McNulty y cols. 2020: el rendimiento cambia muy poco y varía en cada mujer): se ajusta
   por los síntomas que ella marca. (1) Línea del WOD del día `mujer` (LINEAS); (2) objetivo de Mi plan `mujer` con enfoque (sub) Fuerza y salud /
   Militar / combate / Carrera (CATALOGO.mujer es un getter); (3) «Mi ciclo» opcional y privado (S.ciclo: nunca va en el parte ni en la nube). */
/* Paso de la progresión de barras según tu mejor marca de 4 meses */
function pasoBarras(){
  const vs = ['barras', 'barras_estrictas'].flatMap(id=>valoresDe(id)).filter(v=>v.fecha >= hace(120)), mx = vs.length ? Math.max(...vs.map(v=>v.valor)) : 0;
  if(mx < 1) return {mx, meta:1, main:[Mv('barras_neg', {reps:'3'}), Mv('barras_banda', {reps:'5'})], txt:'4 × 3 barras negativas (sube con un salto o un cajón y baja en 5 s) y 5 con banda elástica'};
  if(mx < 3) return {mx, meta:3, main:[Mv('barras', {reps:String(mx)}), Mv('barras_neg', {reps:'3'})], txt:`4 × (${mx} barra${mx > 1 ? 's' : ''} + 3 negativas lentas)`};
  if(mx < 6) return {mx, meta:6, main:[Mv('barras', {reps:String(mx - 1)})], txt:`4 series de ${mx - 1} barras (tu máximo menos 1), 2 min de pausa`};
  return {mx, meta:Math.max(10, mx + 2), main:[Mv('barras', {reps:String(mx - 2)})], txt:`5 series de ${mx - 2} barras (tu máximo menos 2); prueba agregar un chaleco liviano`};
}
const CAL_RODILLA = ()=>[Mv('aterrizajes', {reps:'10'}), Mv('equilibrio_1p', {tiempo:'0:30'}), Mv('puente_gluteo', {reps:'15'}), Mv('zancadas_laterales', {reps:'10'})];
const FIN_PELVICO = ()=>[Mv('respiracion_360', {tiempo:'2:00'}), Mv('plancha_lateral', {tiempo:'0:30'})];
const PORQUE_MUJER = 'Las mujeres se lesionan la rodilla (ligamento cruzado) de 2 a 8 veces más; el calentamiento de rodilla sana baja el riesgo cerca de la mitad. La semana trae además tren superior con progresión de barras, intervalos con saltos suaves que fortalecen el hueso y suelo pélvico.';
const SEMANA_MUJER = [
  ()=>({titulo:'Piernas fuertes', estilo:'calidad', params:{rondas:'5'}, in:CAL_RODILLA(), main:[Mv('sentadilla', {reps:'5'}), Mv('pm_rumano', {reps:'8'}), Mv('mc_zancadas', {reps:'10'})], out:FIN_PELVICO(),
    estrategia:'Primero el calentamiento de rodilla sana completo (12 min): es lo que más protege tu rodilla. ' + cargaTxt('sentadilla', 0.75, 'Sentadilla 5 × 5') + '. Rodillas en línea con la punta del pie al bajar y al aterrizar.'}),
  ()=>({titulo:'Intervalos y saltos suaves', estilo:'cada_ronda', params:{rondas:'6'}, main:[Mv('carrera', {dist:'400', distU:'m'}), {descanso:true, tiempo:'1:30'}],
    estrategia:'Antes: 3 × 10 aterrizajes suaves en el lugar (saltos bajos que fortalecen el hueso, cayendo con las rodillas alineadas). ' + ritmoTxt('r400', 'Cada 400 m a') + '; recupera trotando suave.'}),
  ()=>{ const P = pasoBarras(); return {titulo:'Tren superior y barras', estilo:'calidad', params:{rondas:'4'}, main:P.main.concat([Mv('mc_press', {reps:'10'}), Mv('remo_anillas', {reps:'10'}), Mv('flexiones_rod', {reps:'10'})]),
    estrategia:'Barras: ' + P.txt + '. Tu meta: ' + P.meta + (P.meta===1 ? ' barra completa' : ' barras seguidas') + '. Flexiones con apoyo de rodillas o completas, con el cuerpo recto.'}; },
  ()=>({titulo:'Core, suelo pélvico y movilidad', estilo:'calidad', params:{rondas:'3'}, main:[Mv('respiracion_360', {tiempo:'1:00'}), Mv('dead_bug', {reps:'10'}), Mv('bird_dog', {reps:'10'}), Mv('plancha_lateral', {tiempo:'0:30'}), Mv('puente_gluteo', {reps:'15'})],
    estrategia:'Suave y controlado. En la respiración 360°: al inspirar se relaja el suelo pélvico, al exhalar se activa (como cortar el chorro de orina) antes de cada esfuerzo.'}),
  ()=>({titulo:'Funcional fuerte', estilo:'amrap', params:{minutos:'16'}, main:[Mv('kb_swing', {reps:'12', peso:'12', pesoU:'kg'}), Mv('wall_ball', {reps:'10', peso:'6', pesoU:'kg'}), Mv('subida_cajon', {reps:'10'}), Mv('remo_cal', {cal:'10'})],
    estrategia:'Pesos de mujer (Rx): kettlebell 12-16 kg, balón 6 kg. Ritmo sostenido: que la última ronda se parezca a la primera.'}),
  ()=>semanaNum() % 2 ? ({titulo:'Marcha con carga suave', uno:{mov:'marcha', dist:'6', distU:'km', peso:'8', pesoU:'kg'}, estrategia:'Mochila de 10-15 % de tu peso. Sube la carga o la distancia cada semana, nunca las dos a la vez (cuida los huesos del pie y la cadera).'})
    : ({titulo:'Trote largo', uno:{mov:'trote_z2', dist:'6', distU:'km'}, estrategia:'Continuo cómodo: puedes conversar. ' + ritmoTxt('suave', 'Cerca de')}),
  null];
LINEAS.splice(LINEAS.findIndex(l=>l.id==='hero'), 0, {id:'mujer', n:'Mujer fuerte', obj:'Fuerza, rodilla sana, huesos fuertes y progresión de barras', semana:SEMANA_MUJER, porque:PORQUE_MUJER});
/* ---------- Mi plan: «Entrenamiento para mujeres» ---------- */
OBJ_PLAN.splice(OBJ_PLAN.findIndex(o=>o.id==='fuerza'), 0, {id:'mujer', g:'General', ic:'💪', n:'Entrenamiento para mujeres', subs:['Fuerza y salud', 'Militar / combate', 'Carrera'], d:'Fuerza, rodilla sana, huesos fuertes y barras.', sinFecha:true});
const plMujer = k=>{ const f = SEMANA_MUJER[k]; return f ? f() : null; };
function catalogoMujer(){
  const sub = S.plan && S.plan.obj==='mujer' ? S.plan.sub : 'Fuerza y salud';
  const piernas = S_('Piernas fuertes', 50, 7, 'Calentamiento de rodilla sana, sentadilla 5 × 5, peso muerto rumano y zancadas.', {plantilla:plMujer(0), cap:'Fuerza', tag:'rodilla sana'});
  const sup = S_('Tren superior y barras', 45, 7, 'Progresión de barras, press, remo en anillas y flexiones.', {plantilla:plMujer(2), cap:'R. muscular', tag:'progresión'});
  const inter = S_('Intervalos y saltos suaves', 35, 8, 'Aterrizajes suaves y 6 × 400 m.', {plantilla:plMujer(1), cap:'Umbral', tag:'huesos'});
  const core = S_('Core y suelo pélvico', 25, 3, 'Respiración 360°, dead bug, bird dog, plancha lateral y puente.', {plantilla:plMujer(3)});
  const func = S_('Funcional fuerte', 30, 8, 'AMRAP 16 min con pesos de mujer.', {plantilla:plMujer(4), cap:'Anaeróbica'});
  const movil = S_('Movilidad', 20, 2, 'Cadera, tobillo y columna.');
  if(sub==='Militar / combate') return [piernas, S_('Marcha con carga progresiva', 60, 6, 'Empieza con 10-15 % de tu peso; sube carga o distancia cada semana, nunca las dos.', {largo:true, plantilla:{titulo:'Marcha con carga progresiva', uno:{mov:'marcha', dist:'8', distU:'km', peso:'10', pesoU:'kg'}}}),
    sup, inter, S_('Circuito de combate', 40, 8, 'Arrastres, cargas, burpees y desplazamientos.', {pop:'Sesión B · Circuito de combate integrado'}), core, movil];
  if(sub==='Carrera') return [S_('Rodaje largo', 55, 5, 'Continuo suave: el más largo de la semana.', {largo:true, plantilla:plMujer(5)}), inter, piernas,
    S_('Tempo (umbral)', 40, 7, '20-25 min a ritmo «cómodamente duro».', {pop:'Tempo 20 min'}), sup, core, S_('Rodaje suave', 30, 3, 'Zona 2.')];
  return [piernas, sup, inter, S_('Trote largo o marcha', 50, 5, 'Continuo cómodo; semana por medio marcha con carga suave.', {largo:true, plantilla:plMujer(5)}), func, core, movil];
}
Object.defineProperty(CATALOGO, 'mujer', {get:catalogoMujer, enumerable:true});
function htmlMujerPlan(){
  const P = pasoBarras();
  return `<div class="tarjeta mi-rend" id="mujerPlan"><div class="entre"><span class="etiqueta">💪 Tu progresión de barras</span><span class="suave chico">${P.mx ? 'mejor: ' + P.mx : 'aún sin barras'}</span></div>
    <div class="mr-num num"><span>Hoy <b>${P.mx}</b></span><span>Meta <b>${P.meta}</b></span></div>
    <div class="barra-logro"><span style="width:${Math.min(100, Math.round(P.mx / P.meta * 100))}%"></span></div>
    <div class="ahora-txt chico">👉 <b>Ahora:</b> ${esc(P.txt)}.</div>
    <details class="tc-como"><summary>❔ ¿Qué cambia frente a otros planes?</summary><p class="chico">Siempre lleva el calentamiento de rodilla sana, dos días de fuerza, la progresión de barras (negativas y banda → 1 a 3 barras → series) y saltos suaves que fortalecen el hueso. Con «Militar / combate» suma marcha con carga progresiva, cuidando las fracturas por estrés. Anota tus barras en el registro y el paso se ajusta solo.</p></details></div>`;
}
/* ---------- Mi ciclo (opcional y privado) ---------- */
const SINTOMAS = [['colicos', 'Cólicos'], ['cansancio', 'Cansancio'], ['cabeza', 'Dolor de cabeza'], ['hinchazon', 'Hinchazón'], ['bien', 'Bien']];
const ciclo = ()=>S.ciclo || (S.ciclo = {on:false, dias:{}, sint:{}});
function inicioReglas(){ const D = ciclo().dias; return Object.keys(D).filter(f=>D[f] && !D[masDias(f, -1)]).sort(); }
function prediccionCiclo(){
  const I = inicioReglas(); if(!I.length) return null;
  const dif = I.slice(1).map((f, i)=>diasEntre(I[i], f)).filter(d=>d >= 20 && d <= 45).slice(-6), largo = dif.length ? Math.round(dif.reduce((a, b)=>a + b, 0) / dif.length) : 28;
  return {largo, prox:masDias(I[I.length - 1], largo), ultimo:I[I.length - 1], estimado:!dif.length};
}
function diaDeRegla(f){ const D = ciclo().dias; if(!D[f]) return 0; let n = 1; while(D[masDias(f, -n)]) n++; return n; }
let mesCiclo = 0;
function dialogoCiclo(){
  const C = ciclo(), hoy = hoyISO(), d0 = new Date(), base = new Date(d0.getFullYear(), d0.getMonth() + mesCiclo, 1), P = prediccionCiclo();
  const ini = (base.getDay() + 6) % 7, nd = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate(), celdas = [];
  for(let k = 0; k < ini; k++) celdas.push('<i class="vacio"></i>');
  for(let n = 1; n <= nd; n++){ const f = iso(new Date(base.getFullYear(), base.getMonth(), n)), pr = P && !C.dias[f] && diasEntre(P.prox, f) >= 0 && diasEntre(P.prox, f) < 5;
    celdas.push(`<button data-cd="${f}" class="${C.dias[f] ? 'r' : ''} ${pr ? 'p' : ''} ${f===hoy ? 'hoy' : ''}" ${f > hoy ? 'disabled' : ''}>${n}</button>`); }
  const sh = C.sint[hoy] || {s:[], f:false};
  dialogo(`<div class="cab"><h2>Mi ciclo</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <div class="entre"><button class="btn chico-btn" id="ciAnt">‹</button><b style="text-transform:capitalize">${MESES_L[base.getMonth()]} ${base.getFullYear()}</b><button class="btn chico-btn" id="ciSig" ${mesCiclo >= 0 ? 'disabled' : ''}>›</button></div>
    <div class="ciclo-cal"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>${celdas.join('')}</div>
    <p class="suave chico">Toca los días de tu regla. ${P ? `<span class="ci-r">●</span> regla · <span class="ci-p">◌</span> próxima estimada: <b>${verFecha(P.prox)}</b> (ciclo ${P.estimado ? 'supuesto' : 'promedio'} de ${P.largo} días)` : ''}</p>
    <label>¿Cómo te sientes hoy?</label><div class="chips ci-sint" style="padding:0">${SINTOMAS.map(([k, n])=>`<button data-cs="${k}" class="${sh.s.includes(k) ? 'activa' : ''}">${n}</button>`).join('')}</div>
    <label>Intensidad</label><div class="segmentos" id="ciInt"><button data-ci="0" class="${!sh.f ? 'activa' : ''}">Leve</button><button data-ci="1" class="${sh.f ? 'activa' : ''}">Fuerte</button></div>
    <details class="tc-como"><summary>❔ ¿Por qué no se programa por fases?</summary><p class="chico">Los estudios muestran que el rendimiento cambia muy poco entre las fases del ciclo y que cada mujer es distinta. Por eso la app ajusta según cómo te sientes, no por el calendario. Ejemplo: si marcas cólicos fuertes, ese día te sugiere un trote suave o movilidad en vez de intervalos.</p></details>
    <div class="ci-priv chico">🔒 <span><b>Privado:</b> queda solo en este teléfono. Nunca va en el parte de la unidad ni en la nube (sí en el respaldo que tú guardas).</span></div>
    <div class="btns"><button class="btn" id="ciOff">Desactivar y borrar</button><button class="btn prim" data-cerrar>Listo</button></div>`, d=>{
    const otra = ()=>{ guardar(); dialogoCiclo(); };
    $$('[data-cd]', d).forEach(b=>b.onclick = ()=>{ const f = b.dataset.cd; if(C.dias[f]) delete C.dias[f]; else C.dias[f] = 1; otra(); });
    $$('[data-cs]', d).forEach(b=>b.onclick = ()=>{ const k = b.dataset.cs, s = C.sint[hoy] = C.sint[hoy] || {s:[], f:false};
      s.s = k==='bien' ? (s.s.includes('bien') ? [] : ['bien']) : s.s.includes(k) ? s.s.filter(x=>x!==k) : s.s.filter(x=>x!=='bien').concat(k); if(k==='bien') s.f = false; delete s.ok; otra(); });
    $$('[data-ci]', d).forEach(b=>b.onclick = ()=>{ const s = C.sint[hoy] = C.sint[hoy] || {s:[], f:false}; s.f = b.dataset.ci==='1'; delete s.ok; otra(); });
    $('#ciAnt', d).onclick = ()=>{ mesCiclo--; dialogoCiclo(); }; $('#ciSig', d).onclick = ()=>{ mesCiclo++; dialogoCiclo(); };
    $('#ciOff', d).onclick = ()=>confirmar('¿Desactivar Mi ciclo y borrar lo anotado?', ()=>{ delete S.ciclo; guardar(); if(vistaActual==='perfil') vPerfil(); else vHoy(); }, 'Borrar');
    d.addEventListener('close', ()=>{ mesCiclo = 0; if(vistaActual==='hoy') vHoy(); }, {once:true});
  });
}
function htmlCicloPerfil(){
  if(S.perfil.sexo!=='M' && !(S.ciclo && S.ciclo.on)) return '';
  const C = S.ciclo, P = C && C.on ? prediccionCiclo() : null;
  return `<div class="titulo" style="margin-top:16px">Mi ciclo <span class="suave chico">(opcional)</span></div>
    <div class="suave chico" style="margin:6px 0">${C && C.on ? (P ? 'Próxima regla estimada: ' + verFecha(P.prox) + '.' : 'Marca los días de tu regla para estimar la próxima.') + ' Si marcas síntomas fuertes, te sugiere una sesión más suave. Privado: solo en este teléfono.' : 'Anota tu regla y cómo te sientes: si tienes síntomas fuertes, la app te sugiere una sesión más suave. Privado: nunca va en el parte ni en la nube.'}</div>
    <button class="btn ancho" id="pCiclo">${C && C.on ? '📅 Abrir Mi ciclo' : 'Activar Mi ciclo'}</button>`;
}
function enlazarCicloPerfil(){ if($('#pCiclo')) $('#pCiclo').onclick = ()=>{ ciclo().on = true; guardar(); dialogoCiclo(); }; }
/* Inicio: aviso si hoy hay regla o síntomas fuertes */
function htmlCicloHoy(){
  const C = S.ciclo; if(!C || !C.on) return '';
  const hoy = hoyISO(), s = C.sint[hoy], dr = diaDeRegla(hoy), P = prediccionCiclo(), x = S.plan ? planDia(hoy) : null, dura = x && x.ses && x.ses.rpe >= 6;
  if(s && s.f && !s.ok && !(s.s || []).includes('bien'))
    return `<div class="tarjeta ci-sug" id="ciSug"><div class="etiqueta">Sugerencia para hoy</div><p style="margin:6px 0">Marcaste síntomas fuertes: ${dura ? `cambia «${esc(x.ses.n)}» por` : 'hoy haz'} <b>trote suave de 30 min</b> o movilidad. Si te sientes bien, entrena normal.</p>
      <div class="btns">${dura ? '<button class="btn prim" id="ciCambiar">Cambiar la sesión</button>' : ''}<button class="btn" id="ciIgual">${dura ? 'Entreno igual' : 'Entendido'}</button></div></div>`;
  if(dr || (P && diasEntre(hoy, P.prox) >= 0 && diasEntre(hoy, P.prox) <= 2))
    return `<button class="aviso-parte" id="ciAbrir">📅 <span>${dr ? 'Día ' + dr + ' de tu regla' : 'Tu regla podría llegar el ' + verFecha(P.prox)} · ¿cómo te sientes?</span><span class="chev">›</span></button>`;
  return '';
}
function enlazarCicloHoy(){
  if($('#ciAbrir')) $('#ciAbrir').onclick = dialogoCiclo;
  if($('#ciIgual')) $('#ciIgual').onclick = ()=>{ S.ciclo.sint[hoyISO()].ok = true; guardar(); vHoy(); };
  if($('#ciCambiar')) $('#ciCambiar').onclick = ()=>{ const h = hoyISO(); S.plan.cambios = S.plan.cambios || {};
    S.plan.cambios[h] = {n:'Trote suave o movilidad', min:30, rpe:3, d:'Por cómo te sientes hoy: trote muy suave, caminata o movilidad.'}; S.ciclo.sint[h].ok = true; guardar(); aviso('Sesión de hoy cambiada'); vHoy(); };
}
