/* #NSCE — Estado del día (como el «Destacado» de los relojes deportivos, sin reloj obligatorio):
   disposición 0-100, estado de entreno (carga aguda 7 días vs crónica 28 días, método sRPE de Foster),
   VO₂máx estimado desde el 2.400 m (fórmula de Cooper para 1,5 millas) y resumen de la semana.          */
'use strict';

/* Carga de un entrenamiento = minutos × esfuerzo (1-10). Si falta un dato se estima y se marca. */
function cargaSesion(s){
  const m = metricas(s); let min = m.min, rpe = ent(s.rpe), est = false;
  if(!min){ min = 45; est = true; }
  if(!rpe){ rpe = 6; est = true; }
  return {v:min * rpe, est};
}
function cargasPorDia(){
  const d = {};
  S.sesiones.forEach(s=>{ const c = cargaSesion(s); d[s.fecha] = (d[s.fecha] || 0) + c.v; });
  return d;
}
const sumaDias = (porDia, hasta, n)=>{ let t = 0; const d = new Date(hasta + 'T12:00:00'); for(let i=0;i<n;i++){ t += porDia[iso(d)] || 0; d.setDate(d.getDate()-1); } return t; };
function acwrEn(fecha, porDia){
  const aguda = sumaDias(porDia, fecha, 7), cronica = sumaDias(porDia, fecha, 28) / 4;
  return {aguda, cronica, ratio:cronica ? aguda / cronica : null};
}
const ESTADOS = {
  recopilando:{n:'Recopilando datos', c:'var(--suave)', txt:'Con 2 semanas de registros (duración y esfuerzo) se calcula tu estado de entreno.'},
  descarga:{n:'Recuperación', c:'var(--a)', txt:'Tu carga bajó respecto de tu promedio. Si no es una semana de descarga, vuelve a subir de a poco.'},
  mantenimiento:{n:'Mantenimiento', c:'#e0b63c', txt:'Carga estable y en rango seguro. Para mejorar, súbela de forma progresiva (no más de 10 % por semana).'},
  productivo:{n:'Productivo', c:'var(--mb)', txt:'Estás aumentando la carga dentro del rango óptimo: así se mejora la condición física.'},
  exigente:{n:'Exigente', c:'#f08a3a', txt:'Subiste rápido la carga. Cuida el sueño y la recuperación estos días.'},
  sobrecarga:{n:'Sobrecarga', c:'var(--na)', txt:'Carga muy por sobre tu promedio: el riesgo de lesión sube mucho. Baja la intensidad unos días.'},
};
function estadoEntreno(fecha){
  fecha = fecha || hoyISO();
  const porDia = cargasPorDia(), fechas = Object.keys(porDia).sort();
  if(!fechas.length) return {k:'recopilando', dias:0};
  const dias = Math.round((new Date(fecha) - new Date(fechas[0])) / 86400000) + 1;
  const a = acwrEn(fecha, porDia);
  if(dias < 14 || !a.cronica) return Object.assign({k:'recopilando', dias}, a);
  const d7 = new Date(fecha + 'T12:00:00'); d7.setDate(d7.getDate()-7);
  const previa = acwrEn(iso(d7), porDia).aguda;
  const k = a.ratio > 1.5 ? 'sobrecarga' : a.ratio > 1.3 ? 'exigente' : a.ratio < 0.8 ? 'descarga' : a.aguda > previa * 1.05 ? 'productivo' : 'mantenimiento';
  return Object.assign({k, dias}, a);
}
/* Carga de las últimas 4 semanas (lunes a domingo) con el estado al cierre de cada una */
function semanasCarga(){
  const porDia = cargasPorDia(), out = [], lun = inicioSemana();
  for(let i=3;i>=0;i--){ const ini = new Date(lun); ini.setDate(ini.getDate() - 7*i); const fin = new Date(ini); fin.setDate(fin.getDate()+6);
    const hasta = i===0 ? hoyISO() : iso(fin); out.push({ini:iso(ini), carga:sumaDias(porDia, hasta, i===0 ? (diaSemana() + 1) : 7), estado:estadoEntreno(hasta).k}); }
  return out;
}

/* Disposición 0-100: cómo llegas (chequeo) + equilibrio de carga + carga de ayer + FC en reposo de hoy */
function disposicionDia(){
  const hoy = hoyISO(), comp = [], porDia = cargasPorDia(), est = estadoEntreno();
  const ch = disposicion(S.diario[hoy]);
  if(ch) comp.push({w:0.5, v:ch.pct, n:'Cómo llegas', t:ch.pct >= 70 ? 'Bien' : ch.pct >= 40 ? 'Regular' : 'Mal'});
  if(est.k!=='recopilando'){ const r = est.ratio, v = r > 1.5 ? 30 : r > 1.3 ? 60 : r < 0.8 ? 85 : 100;
    comp.push({w:0.3, v, n:'Carga reciente', t:ESTADOS[est.k].n}); }
  const ay = new Date(); ay.setDate(ay.getDate()-1);
  const cAyer = porDia[iso(ay)] || 0, desde28 = iso(new Date(Date.now() - 28*86400000));
  const ult = S.sesiones.filter(x=>x.fecha >= desde28 && x.fecha < iso(ay)).map(x=>cargaSesion(x).v), media = ult.length ? ult.reduce((a, b)=>a + b, 0) / ult.length : 0;
  if(media && ult.length >= 4){ const q = cAyer / media, v = q > 1.5 ? 55 : q > 1.2 ? 75 : 100;
    comp.push({w:0.2, v, n:'Esfuerzo de ayer', t:!cAyer ? 'Descanso' : q > 1.5 ? 'Muy alto' : q > 1.2 ? 'Alto' : 'Normal'}); }
  const fcHoy = (S.medidas || []).find(m=>m.fecha===hoy && m.fcr), base = (S.medidas || []).filter(m=>m.fcr && m.fecha < hoy && m.fecha >= iso(new Date(Date.now() - 30*86400000)));
  if(fcHoy && base.length){ const prom = base.reduce((a, m)=>a + m.fcr, 0) / base.length, dl = fcHoy.fcr - prom;
    comp.push({w:0.2, v:dl <= 0 ? 100 : dl <= 3 ? 85 : dl <= 6 ? 65 : 45, n:'FC en reposo', t:fcHoy.fcr + ' lat/min (' + (dl > 0 ? '+' : '') + Math.round(dl) + ')'}); }
  if(!comp.length) return null;
  const w = comp.reduce((a, c)=>a + c.w, 0), v = Math.round(comp.reduce((a, c)=>a + c.v * c.w, 0) / w);
  const nivel = v >= 75 ? ['Alta', 'Listo para entrenar fuerte'] : v >= 50 ? ['Moderada', 'Entrena, sin buscar marcas'] : v >= 25 ? ['Baja', 'Intensidad suave o técnica'] : ['Muy baja', 'Prioriza recuperación'];
  return {v, nivel:nivel[0], txt:nivel[1], comp, soloChequeo:comp.length===1 && !!ch};
}

/* VO₂máx estimado con el 2.400 m (≈ 1,5 millas): VO₂ = 483 / minutos + 3,5. Clasificado con las tablas PSF de tu edad. */
const vo2De = seg=>483 / (seg/60) + 3.5;
function vo2Estado(){
  const c = recienteMejor('psf2400', 365), g = vo2Reloj();
  if(g && (!c || g.fecha >= c.fecha)) return {v:g.v, cls:null, fecha:g.fecha, reloj:true};   // el VO₂máx del reloj, si es más nuevo
  if(!c) return null;
  const v = vo2De(c.valor), pp = perfilPSF();
  let cls = null;
  if(pp.sexo && pp.edad!=null){ const r = PSF.carrera(pp, c.valor), mb = vo2De(r.mb), a = vo2De(r.a);
    cls = v >= mb + 3 ? 'Excelente' : v >= mb ? 'Muy bueno' : v >= a ? 'Bueno' : 'Por mejorar'; }
  return {v, cls, seg:c.valor, fecha:c.fecha};
}

/* ---------- Indicadores propios: galones de alistamiento y regla graduada ---------- */
/* Condición de alistamiento (como los colores de alerta): 4 galones; se encienden según la disposición 0-100 */
const CONDICION = v=>v >= 75 ? {n:'Verde', d:'Lista', c:'var(--mb)', g:3} : v >= 50 ? {n:'Amarilla', d:'Buena', c:'#e0b63c', g:2} : v >= 25 ? {n:'Naranja', d:'Regular', c:'#f08a3a', g:1} : {n:'Roja', d:'Baja', c:'var(--na)', g:0};
function galones(v){
  if(v!=null && !isFinite(v)) v = null;
  const k = v==null ? null : CONDICION(v);
  // 3 estrellas (como el ícono): verde 3, amarilla 2, naranja 1, roja 0 con el contorno en rojo
  const estrella = cx=>Array.from({length:10}, (_, i)=>{ const a = -Math.PI/2 + i*Math.PI/5, r = i % 2 ? 6 : 14.5; return (cx + r*Math.cos(a)).toFixed(1) + ' ' + (17 + r*Math.sin(a)).toFixed(1); }).join(' L');
  return `<div class="galones" aria-hidden="true"><svg viewBox="0 0 96 32">${[16, 48, 80].map((cx, i)=>{ const on = k && i < k.g, borde = k && !k.g ? k.c : on ? k.c : 'var(--borde)';
      return `<path d="M${estrella(cx)} Z" fill="${on ? k.c : 'none'}" stroke="${borde}" stroke-width="2" stroke-linejoin="round"/>`; }).join('')}</svg>
    <b class="num">${v==null ? '—' : v}</b><span>/100</span></div>`;
}
/* Regla graduada con marcador (como la escala de una carta): zonas de color, rayas cada unidad y el valor arriba */
function regla(valor, min, max, segs, unidad){
  const W = 300, x = v=>8 + (Math.max(min, Math.min(max, v)) - min) / (max - min) * (W - 16);
  let ant = min; const zonas = segs.map(([h, c])=>{ const r = `<rect x="${x(ant)}" y="30" width="${Math.max(0, x(h) - x(ant) - 1.5)}" height="6" fill="${c}"/>`; ant = h; return r; }).join('');
  const rayas = []; for(let v = Math.ceil(min); v <= max; v++){ const may = v % 5===0; rayas.push(`<line x1="${x(v)}" y1="38" x2="${x(v)}" y2="${may ? 48 : 43}" class="rg-raya"/>${may ? `<text x="${x(v)}" y="59" text-anchor="middle">${v}</text>` : ''}`); }
  return `<svg class="regla" viewBox="0 0 ${W} 62" aria-hidden="true">${zonas}${rayas.join('')}
    ${valor!=null ? `<path d="M${x(valor)} 28 l-6 -10 h12 z" fill="var(--texto)"/><text x="${x(valor)}" y="13" text-anchor="middle" class="rg-valor">${fmtNum(Math.round(valor))}${unidad ? ' ' + unidad : ''}</text>` : ''}</svg>`;
}
const SEG_VO2 = [[38, 'var(--na)'], [45, '#f08a3a'], [52, 'var(--mb)'], [65, 'var(--a)']];

/* ---------- Tarjetas del estado del día ---------- */
function htmlEstadoDia(){
  const dp = disposicionDia(), es = estadoEntreno(), vo = vo2Estado(), sems = semanasCarga();
  const lunes = iso(inicioSemana()), lunAnt = new Date(inicioSemana()); lunAnt.setDate(lunAnt.getDate()-7);
  const finAnt = new Date(lunAnt); finAnt.setDate(finAnt.getDate() + diaSemana());
  const sem = acumular(S.sesiones.filter(s=>s.fecha >= lunes)), ant = acumular(S.sesiones.filter(s=>s.fecha >= iso(lunAnt) && s.fecha <= iso(finAnt)));
  const flecha = (a, b)=>!b ? '' : a > b*1.05 ? `<span class="sube">▲ ${Math.round((a/b - 1)*100)} %</span>` : a < b*0.95 ? `<span class="baja">▼ ${Math.round((1 - a/b)*100)} %</span>` : '<span class="suave">＝</span>';
  const maxC = Math.max(1, ...sems.map(x=>x.carga));
  const tarjetas = [
    `<article class="estado-card"><div class="ec-tit"><span class="ec-cod">01</span>${tactico() ? 'Alistamiento' : 'Preparación'}</div>
      ${dp ? `<div class="ec-fila">${galones(dp.v)}<div><div class="ec-k">${tactico() ? 'Condición' : 'Hoy estás'}</div><div class="ec-grande" style="color:${CONDICION(dp.v).c}">${tactico() ? CONDICION(dp.v).n : CONDICION(dp.v).d}</div><div class="suave">${dp.txt}</div></div></div>
        <div class="ec-grid">${dp.comp.map(c=>`<div><b>${esc(c.t)}</b><span>${esc(c.n)}</span></div>`).join('')}</div>
        ${dp.soloChequeo ? '<p class="nota">Con duración y esfuerzo en tus registros, también considera tu carga reciente.</p>' : ''}`
        : `<div class="ec-fila">${galones(null)}<div><div class="ec-k">${tactico() ? 'Condición' : 'Hoy estás'}</div><div class="ec-grande">Sin reporte</div><div class="suave">Marca arriba cómo llegas hoy (sueño, alimentación y energía).</div></div></div>`}
    </article>`,
    `<article class="estado-card"><div class="ec-tit"><span class="ec-cod">02</span>Estado de entreno</div>
      <div class="ec-fila"><div class="ec-icono" style="--c:${ESTADOS[es.k].c}"><span>${es.k==='recopilando' ? '…' : '↗'}</span></div>
        <div><div class="ec-grande" style="color:${ESTADOS[es.k].c}">${ESTADOS[es.k].n}</div><div class="suave chico">${esc(ESTADOS[es.k].txt)}</div></div></div>
      <div class="ec-grid">
        <div><b class="num">${Math.round(es.aguda || 0)}</b><span>carga 7 días</span></div>
        <div><b class="num">${Math.round(es.cronica || 0)}</b><span>promedio semanal (28 días)</span></div>
        <div><b class="num">${es.ratio ? fmtNum(Math.round(es.ratio*100)/100) : '—'}</b><span>relación (óptimo 0,8–1,3)</span></div>
      </div>
      <div class="barras-sem">${sems.map((x, i)=>`<div><i style="height:${Math.max(4, x.carga/maxC*48)}px;background:${ESTADOS[x.estado].c}"></i><span>${i===3 ? 'esta' : 'S-' + (3-i)}</span></div>`).join('')}</div>
      <p class="nota">Carga = minutos × esfuerzo (método sRPE). ${es.k==='recopilando' ? 'Llevas ' + (es.dias || 0) + ' de 14 días.' : 'Últimas 4 semanas.'}</p>
    </article>`,
    `<article class="estado-card"><div class="ec-tit"><span class="ec-cod">03</span>VO₂máx estimado</div>
      ${vo ? `<div class="ec-vo"><div><span class="ec-k">ml/kg/min</span><div class="ec-grande num">${fmtNum(Math.round(vo.v))}</div></div><div><span class="ec-k">Nivel</span><div class="ec-grande">${vo.cls || '—'}</div></div></div>
        ${regla(vo.v, 30, 65, SEG_VO2, '')}
        ${vo.reloj ? `<div><div class="suave chico">⌚ Del reloj, anotado el ${verFecha(vo.fecha)}.</div></div>` : `<div><div class="suave chico">Con tu 2.400 m de ${PSF.verTiempo(vo.seg)} (${verFecha(vo.fecha)}). ${vo.cls ? 'Clasificado con las tablas PSF de tu edad.' : 'Indica sexo y edad para clasificarlo.'}</div></div>
        <p class="nota">Estimación con la fórmula del test de Cooper de 1,5 millas (2.414 m): 483 ÷ minutos + 3,5.</p>`}`
        : `${regla(null, 30, 65, SEG_VO2, '')}<div class="ec-grande">Sin 2.400 m</div><div class="suave chico">Registra un 2.400 m (control PSF, batería o carrera) para estimarlo.</div>`}
    </article>`,
    `<article class="estado-card"><div class="ec-tit"><span class="ec-cod">04</span>Esta semana</div>
      <div class="ec-grid cuatro">
        <div><b class="num">${sem.n}</b><span>entrenamientos ${flecha(sem.n, ant.n)}</span></div>
        <div><b class="num">${fmtHoras(sem.min)}</b><span>horas ${flecha(sem.min, ant.min)}</span></div>
        <div><b class="num">${fmtNum(nKm(sem.km))}</b><span>${uDist()} ${flecha(sem.km, ant.km)}</span></div>
        <div><b class="num">${fmtNum(sem.carga)}</b><span>km·kg de carga ${flecha(sem.carga, ant.carga)}</span></div>
      </div>
      ${(()=>{ const ka = S.sesiones.filter(s=>s.fecha >= lunes).reduce((a, s)=>a + kcalDe(s), 0), kb = S.sesiones.filter(s=>s.fecha >= iso(lunAnt) && s.fecha <= iso(finAnt)).reduce((a, s)=>a + kcalDe(s), 0);
        return ka || kb ? `<div class="ec-kcal">🔥 <b class="num">${ka.toLocaleString('es-CL')}</b> kcal entrenando ${flecha(ka, kb)}</div>` : ''; })()}
      <p class="nota">Comparado con la semana pasada hasta el mismo día.</p>
    </article>`,
  ];
  return `<div class="entre"><h3>Estado del día</h3><span class="suave chico num" id="estN">1/${tarjetas.length}</span></div>
    <div class="carrusel estado-dia" id="estCar">${tarjetas.join('')}</div>
    <div class="puntos" id="estPuntos">${tarjetas.map((_, i)=>`<i class="${i ? '' : 'on'}"></i>`).join('')}</div>`;
}
function enlazarEstadoDia(){
  const car = $('#estCar'); if(!car) return;
  car.onscroll = ()=>{ const i = idxCarrusel(car); $('#estN').textContent = (i+1) + '/' + car.children.length;
    $$('#estPuntos i').forEach((p, j)=>p.classList.toggle('on', j===i)); };
  finCarrusel(car, ()=>altoCarrusel(car));
  altoCarrusel(car);
}
