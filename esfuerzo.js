/* #NSCE — Esfuerzo percibido 1-10 con lo que significa cada número (prueba del habla, como Borg CR-10) y «¿Cómo te sentiste?»
   con la batería con que terminaste (identidad propia, en vez de caritas). Se usa en «Fecha y notas» del registro y en el detalle. */
const ESFUERZO = [null,
  ['Muy suave', 'Podrías seguir por horas; respiras por la nariz.'],
  ['Suave', 'Conversas sin ningún problema.'],
  ['Cómodo', 'Conversas tranquilo; ritmo de trote suave.'],
  ['Moderado', 'Todavía conversas, pero ya cuesta un poco.'],
  ['Algo duro', 'Hablas en frases cortas.'],
  ['Duro', 'Solo unas pocas palabras seguidas.'],
  ['Muy duro', 'Una o dos palabras; exige concentración.'],
  ['Intenso', 'No puedes hablar; lo aguantas pocos minutos.'],
  ['Casi al límite', 'Unos segundos más y tienes que parar.'],
  ['Máximo', 'Todo lo que tienes: no queda nada.']];
const COLOR_ESF = [null, '#36b6ea', '#36b6ea', '#2fbf9b', '#4fd17a', '#b6e04a', '#e6c84a', '#f2a33a', '#f07a3a', '#ef5b4c', '#d93a35'];
const SENSACION = [null, ['battery-empty', 'Sin batería'], ['battery-low', 'Baja'], ['battery-medium', 'Normal'], ['battery-high', 'Cargado'], ['lightning', 'Imparable']];
const textoEsfuerzo = n=>{ n = ent(n); return n && ESFUERZO[n] ? n + ' · ' + ESFUERZO[n][0] : ''; };
/* Selector de esfuerzo (escala de colores) y sensación (baterías). Actualiza solo lo necesario, sin redibujar el registro. */
function htmlEsfuerzo(rpe, sens){
  const n = ent(rpe);
  return `<div class="esf">
    <label>¿Cómo te sentiste?</label>
    <div class="sens">${SENSACION.slice(1).map(([ic, t], i)=>`<button type="button" data-sens="${i + 1}" class="${ent(sens)===i + 1 ? 'activa' : ''}">${IC(ic)}<span>${t}</span></button>`).join('')}</div>
    <label>Esfuerzo percibido</label>
    <div class="esf-escala">${ESFUERZO.slice(1).map((_, i)=>`<button type="button" data-esf="${i + 1}" style="--c:${COLOR_ESF[i + 1]}" class="${n===i + 1 ? 'activa' : ''}">${i + 1}</button>`).join('')}</div>
    <div class="esf-txt" id="esfTxt">${n ? `<b style="color:${COLOR_ESF[n]}">${esc(textoEsfuerzo(n))}</b> — ${esc(ESFUERZO[n][1])}` : '<span class="suave">Toca un número: 1 muy suave · 10 máximo.</span>'}</div>
    <details class="esf-tabla"><summary>¿Qué significa cada número?</summary>
      ${ESFUERZO.slice(1).map(([t, d], i)=>`<div><i style="background:${COLOR_ESF[i + 1]}"></i><b>${i + 1} · ${t}</b><span>${d}</span></div>`).join('')}
      <p class="nota">Anótalo al terminar, pensando en toda la sesión. Si el mismo entrenamiento te cuesta menos que antes, estás mejorando.</p></details>
  </div>`;
}
function enlazarEsfuerzo(d, alCambiar){
  $$('[data-esf]', d).forEach(b=>b.onclick = ()=>{ const n = +b.dataset.esf; $$('[data-esf]', d).forEach(x=>x.classList.toggle('activa', x===b));
    $('#esfTxt', d).innerHTML = `<b style="color:${COLOR_ESF[n]}">${esc(textoEsfuerzo(n))}</b> — ${esc(ESFUERZO[n][1])}`; alCambiar('rpe', String(n)); });
  $$('[data-sens]', d).forEach(b=>b.onclick = ()=>{ const v = +b.dataset.sens, ya = b.classList.contains('activa');
    $$('[data-sens]', d).forEach(x=>x.classList.toggle('activa', x===b && !ya)); alCambiar('sens', ya ? null : v); });
}
/* Para el detalle y el muro: «7 · Muy duro» con su color y la batería */
function htmlEsfuerzoVista(s){
  const n = ent(s.rpe), v = ent(s.sens); if(!n && !v) return '';
  return `<div class="esf-vista">${v && SENSACION[v] ? `<span class="esf-sens">${IC(SENSACION[v][0])} ${SENSACION[v][1]}</span>` : ''}${n && ESFUERZO[n] ? `<span class="esf-chip" style="--c:${COLOR_ESF[n]}">Esfuerzo ${esc(textoEsfuerzo(n))}</span>` : ''}</div>`;
}
const opcionesEsfuerzo = (sel, vacio)=>(vacio ? '<option value="">—</option>' : '') + ESFUERZO.slice(1).map((_, i)=>`<option value="${i + 1}" ${String(sel)===String(i + 1) ? 'selected' : ''}>${esc(textoEsfuerzo(i + 1))}</option>`).join('');
