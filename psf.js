/* Pruebas de Suficiencia Física (PSF) — tablas de la cartilla CDIE-80001, Ejército de Chile, edición 2017
   (texto de calificación público). Cálculo referencial: la evaluación oficial la hace la unidad.        */
(function(g){
'use strict';
const T = s=>{ const [m, ss] = s.split(':').map(Number); return m*60 + (ss||0); };
const L = s=>s.trim().split(/\s+/).map(T);

// Carrera 2.400 m (tablas 4-3 y 4-4). Edad mínima de cada tramo y tiempo máximo (segundos).
const CARRERA = {
  tramos: [18, 25, 30, 35, 40, 45, 50, 55, 60],
  normal: {
    H: {mb: L('9:22 9:37 9:52 10:08 10:30 10:54 11:18 11:54 12:36'),  a: L('10:22 10:41 10:58 11:18 11:42 12:06 12:36 13:18 14:04')},
    M: {mb: L('10:22 10:41 10:58 11:18 11:42 12:06 12:36 13:18 14:04'), a: L('11:37 11:58 12:19 12:40 13:06 13:36 14:12 15:00 15:52')},
  },
  bonif: {   // guarniciones de Calama, IV y V DE: +10 %
    H: {mb: L('10:18 10:34 10:51 11:08 11:33 11:59 12:25 13:05 13:51'), a: L('11:24 11:45 12:03 12:25 12:52 13:18 13:51 14:37 15:28')},
    M: {mb: L('11:24 11:45 12:03 12:25 12:52 13:18 13:51 14:37 15:28'), a: L('12:46 13:09 13:32 13:56 14:24 14:57 15:37 16:30 17:27')},
  },
};
// Pruebas de repeticiones: edad mínima de cada tramo y mínimo de repeticiones.
const ABDOMINALES = {tramos: [18, 30, 40, 50, 60], mb: [51, 43, 35, 31, 26], a: [48, 39, 30, 24, 21]};       // tabla 4-6 (igual H y M)
const FLEX_DAMAS  = {tramos: [18, 30, 40, 50, 60], mb: [36, 32, 29, 25, 20], a: [30, 27, 24, 21, 17]};       // tabla 4-8
const FLEX_H45    = {tramos: [45, 50, 60],         mb: [30, 25, 22],         a: [25, 21, 18]};               // tabla 4-10
const FLEX_HSP    = {tramos: [20, 30, 40, 50, 60], mb: [40, 35, 30, 25, 22], a: [35, 30, 25, 21, 18]};       // tabla 4-11
const BARRA       = {tramos: [18, 30, 40, 50],     mb: [13, 11, 7, 4],       a: [9, 8, 5, 3]};               // tabla 4-13
// PSF alternativas (tabla 5-1): solo aprobado / reprobado, tiempo máximo.
const ALT_TRAMOS = [17, 22, 27, 32, 37, 42, 47, 52, 57];
const ALTERNATIVAS = {
  nado:   {nombre: '300 m nado libre',   H: L('8:30 8:42 8:54 9:06 9:18 9:30 9:42 9:54 10:06'), M: L('8:54 9:06 9:18 9:30 9:42 9:54 10:06 10:18 10:30')},
  bici:   {nombre: '10 km bicicleta',    H: L('24:00 24:30 25:00 25:30 26:00 27:00 28:00 30:00 31:00'), M: L('25:00 25:30 26:00 26:30 27:00 28:00 30:00 32:00 33:00')},
  marcha: {nombre: '4 km marcha deportiva', H: L('34:00 34:30 35:00 35:30 36:00 36:30 37:00 37:30 38:00'), M: L('37:00 37:30 38:00 38:30 39:00 39:30 40:00 40:30 41:00')},
};

const NOMBRES = {MB: 'Apto muy bueno', A: 'Apto', NA: 'No apto', LM: 'No rinde (licencia)', ACL: 'Apto con limitación'};

function tramo(tramos, edad){ let i = 0; while(i+1 < tramos.length && edad >= tramos[i+1]) i++; return i; }
function edadDe(nacimiento, hoy){
  if(!nacimiento) return null;
  const n = new Date(nacimiento + 'T12:00:00'), h = hoy || new Date();
  let e = h.getFullYear() - n.getFullYear();
  if(h.getMonth() < n.getMonth() || (h.getMonth()===n.getMonth() && h.getDate() < n.getDate())) e--;
  return e;
}
function etiquetaTramo(tramos, i){ return i===tramos.length-1 ? tramos[i] + '+' : tramos[i] + '-' + (tramos[i+1]-1); }

// Qué prueba de brazos corresponde: 'barra' | 'flex_damas' | 'flex_h45' | 'flex_hsp'
function pruebaBrazos(p){
  if(p.sexo==='M') return 'flex_damas';
  if(p.servicios) return 'flex_hsp';
  if(p.edad > 45 && p.brazos==='suelo') return 'flex_h45';
  return 'barra';
}
const BRAZOS = {
  barra:      {nombre: 'Barras (sin tiempo)', tabla: BARRA},
  flex_damas: {nombre: 'Flexiones de brazos en el suelo, apoyo de rodillas (1 min)', tabla: FLEX_DAMAS},
  flex_h45:   {nombre: 'Flexiones de brazos en el suelo (1 min)', tabla: FLEX_H45},
  flex_hsp:   {nombre: 'Flexiones de brazos en el suelo (1 min)', tabla: FLEX_HSP},
};

function porReps(tabla, edad, reps){
  const i = tramo(tabla.tramos, edad), mb = tabla.mb[i], a = tabla.a[i];
  const nivel = reps >= mb ? 'MB' : reps >= a ? 'A' : 'NA';
  return {nivel, mb, a, tramo: etiquetaTramo(tabla.tramos, i),
          faltaMB: Math.max(0, mb - reps), faltaA: Math.max(0, a - reps)};
}
function carrera(p, seg){
  const t = (p.bonif ? CARRERA.bonif : CARRERA.normal)[p.sexo==='M' ? 'M' : 'H'], i = tramo(CARRERA.tramos, p.edad);
  const mb = t.mb[i], a = t.a[i], nivel = seg <= mb ? 'MB' : seg <= a ? 'A' : 'NA';
  return {nivel, mb, a, tramo: etiquetaTramo(CARRERA.tramos, i),
          faltaMB: Math.max(0, seg - mb), faltaA: Math.max(0, seg - a)};
}
function abdominales(p, reps){ return porReps(ABDOMINALES, p.edad, reps); }
function brazos(p, reps){ return porReps(BRAZOS[pruebaBrazos(p)].tabla, p.edad, reps); }
function alternativa(p, clave, seg){
  const t = ALTERNATIVAS[clave], i = tramo(ALT_TRAMOS, p.edad), max = t[p.sexo==='M' ? 'M' : 'H'][i];
  return {aprobado: seg <= max, max, tramo: etiquetaTramo(ALT_TRAMOS, i), falta: Math.max(0, seg - max)};
}

// Resultado de la evaluación con las tres pruebas (tabla 2-1). niveles: 'MB' | 'A' | 'NA' | 'LM' (licencia)
function evaluacion(niveles){
  const lm = niveles.filter(n=>n==='LM').length, r = niveles.filter(n=>n!=='LM');
  if(niveles.length !== 3 || lm > 1) return null;          // con licencia en más de una prueba no hay evaluación
  if(r.includes('NA')) return 'NA';
  if(lm===1) return 'ACL';
  return r.every(n=>n==='MB') ? 'MB' : 'A';
}

// Períodos de evaluación: 1.ª oct-nov, 2.ª mar-abr (cartilla 2.1)
function proximoPeriodo(hoy){
  const h = hoy || new Date(), y = h.getFullYear(), d0 = new Date(h.getFullYear(), h.getMonth(), h.getDate());
  const per = [
    {nombre: '2.ª evaluación', ini: new Date(y, 2, 1), fin: new Date(y, 3, 30)},
    {nombre: '1.ª evaluación', ini: new Date(y, 9, 1), fin: new Date(y, 10, 30)},
    {nombre: '2.ª evaluación', ini: new Date(y+1, 2, 1), fin: new Date(y+1, 3, 30)},
  ];
  const dias = (a, b)=>Math.round((b - a) / 86400000);
  for(const p of per){
    if(d0 >= p.ini && d0 <= p.fin) return {nombre: p.nombre, enCurso: true, dias: dias(d0, p.fin)};
    if(d0 < p.ini) return {nombre: p.nombre, enCurso: false, dias: dias(d0, p.ini)};
  }
}

function imc(kg, cm){
  if(!(kg > 0 && cm > 0)) return null;
  const v = kg / Math.pow(cm/100, 2);
  const cat = v < 18.5 ? 'Bajo peso' : v < 25 ? 'Normal' : v < 30 ? 'Sobrepeso' : 'Obesidad';
  return {valor: Math.round(v*10)/10, categoria: cat};
}

// Tiempo: acepta 9:22, 9'22", 9.22, 9 22 y 922 → segundos
function leerTiempo(s){
  s = String(s||'').trim(); if(!s) return null;
  let m = s.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if(m) return +m[2] < 60 && +m[3] < 60 ? +m[1]*3600 + +m[2]*60 + +m[3] : null;
  m = s.match(/^(\d{1,3})\s*[:'´`.,\s]\s*(\d{1,2})\s*["”]?$/);
  if(m) return +m[2] < 60 ? +m[1]*60 + +m[2] : null;
  m = s.match(/^(\d{1,3})(\d{2})$/);
  if(m) return +m[2] < 60 ? +m[1]*60 + +m[2] : null;
  m = s.match(/^(\d{1,3})\s*['´]?$/);
  return m ? +m[1]*60 : null;
}
function verTiempo(seg){
  if(seg==null) return '';
  seg = Math.round(seg); const h = Math.floor(seg/3600), m = Math.floor(seg/60)%60, s = seg%60;
  return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0');
}

g.PSF = {CARRERA, ABDOMINALES, FLEX_DAMAS, FLEX_H45, FLEX_HSP, BARRA, ALTERNATIVAS, BRAZOS, NOMBRES,
         edadDe, pruebaBrazos, carrera, abdominales, brazos, alternativa, evaluacion, proximoPeriodo, imc, leerTiempo, verTiempo};
})(typeof window !== 'undefined' ? window : globalThis);
