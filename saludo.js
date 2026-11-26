/* #NSCE — Saludo, fecha, cómo quiere cada uno que lo llame y frase del día (25-nov-2026, maqueta A + C aprobada). S.perfil.apodo: undefined = no se ha preguntado, '' = sin nombre;
   solo lo ve la persona (los amigos ven perfil.nombre). La frase es la misma para todos según la fecha del teléfono; pantalla completa una vez al día (pref frasePant '0' = apagada). */
'use strict';
const colorFrase = ()=>colorApp().toLowerCase()==='#ffffff' ? '#e8c477' : colorApp();   // con acento blanco, dorado: si no, el remate no se distingue
const primerNombre = ()=>((S.perfil && S.perfil.nombre) || '').trim().split(/\s+/)[0] || '';
const nomSaludo = ()=>S.perfil && S.perfil.apodo!=null ? S.perfil.apodo : primerNombre();
const saludoHora = h=>{ h = h==null ? new Date().getHours() : h; return h >= 5 && h < 12 ? 'Buenos días' : h >= 12 && h < 20 ? 'Buenas tardes' : 'Buenas noches'; };
const fechaLarga = d=>DIAS_L[(d.getDay() + 6) % 7] + ' ' + d.getDate() + ' de ' + MESES_L[d.getMonth()];
const fraseDe = f=>{ const [, m, d] = f.split('-').map(Number); return FRASES_DIA[Math.round((Date.UTC(2028, m - 1, d) - Date.UTC(2028, 0, 1)) / 864e5)]; };   // calendario de 366 días: cada fecha tiene siempre la suya
function htmlSaludo(){
  const hoy = iso(diaSel)===hoyISO(), n = nomSaludo();
  return `<div class="sal-cab"><button class="sal-av" data-apodo aria-label="Cómo quieres que te llame">${avatarMini()}</button><div class="sal-txt">
      <button class="fecha-chica" id="bFecha" aria-expanded="${calAbierto}">${hoy ? fechaLarga(diaSel) : 'Estás viendo'} <span class="chev">${calAbierto ? '⌄' : '›'}</span></button>
      ${hoy ? `<button class="sal-nom saludo" data-apodo>${saludoHora()}${n ? ', ' + esc(n) : ''}</button>` : `<div class="sal-nom">${fechaLarga(diaSel)}</div>`}</div>
    ${htmlParche()}</div>${hoy ? '' : '<button class="btn sal-hoy" id="salHoy">‹ Volver a hoy</button>'}`;
}
function htmlFraseDia(){
  const f = iso(diaSel); if(f > hoyISO()) return ''; const x = fraseDe(f); if(!x) return '';
  return `<div class="frase-est" style="--fc:${colorFrase()}"><small>Frase del día</small><button class="frase-sh" id="fraseSh" aria-label="Compartir la frase">↗</button><div class="frase-t">${esc(x[0])}<b>${esc(x[1])}</b></div>${x[2] ? `<small class="frase-aut">${esc(x[2])}</small>` : ''}${(S.diario[f] || {}).descanso ? '<small class="frase-desc">Hoy, la fuerza se guarda.</small>' : ''}</div>`;
}
function enlazarSaludo(redibujar){
  $$('#vista [data-apodo]').forEach(b=>b.onclick = ()=>dialogoApodo(redibujar)); cargarFotos($('.sal-cab'));
  if($('#salHoy')) $('#salHoy').onclick = ()=>{ diaSel = new Date(); mesPortada = null; calAbierto = false; vHoy(); };
  if($('#fraseSh')) $('#fraseSh').onclick = ()=>compartirFrase(iso(diaSel));
}
function opcionesApodo(){ const p = (S.perfil.nombre || '').trim().split(/\s+/).filter(Boolean), o = [p[0], p.length >= 3 ? p[0] + ' ' + p[1] : '', p.length > 1 ? p[p.length >= 4 ? p.length - 2 : p.length - 1] : '']; return [...new Set(o.filter(Boolean))]; }
function dialogoApodo(alListo){
  let v = nomSaludo();
  dialogo(`<div class="cab"><h2>¿Cómo quieres que te llame?</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <input id="apTxt" maxlength="24" placeholder="Nombre, apodo o grado" value="${esc(v)}" aria-label="Cómo quieres que te llame">
    <div class="chips ap-chips">${opcionesApodo().map(o=>`<button data-ap="${esc(o)}">${esc(o)}</button>`).join('')}<button data-ap="">Sin nombre</button></div>
    <p class="nota">Nombre, apodo o grado. Solo lo ves tú: tus amigos ven «${esc(S.perfil.nombre || 'Atleta')}» (se cambia en Ajustes → Datos personales).</p>
    <div class="ap-ej">${avatarMini()}<b id="apEj"></b></div><button class="btn prim ancho" id="apOk" style="margin-top:14px">Así está bien</button>`, d=>{
    const ej = ()=>{ $('#apEj', d).textContent = saludoHora() + (v ? ', ' + v : ''); $$('[data-ap]', d).forEach(b=>b.classList.toggle('activa', b.dataset.ap===v)); }; ej(); cargarFotos(d);
    $('#apTxt', d).oninput = e=>{ v = e.target.value.trim(); ej(); }; $$('[data-ap]', d).forEach(b=>b.onclick = ()=>{ v = b.dataset.ap; $('#apTxt', d).value = v; ej(); });
    $('#apOk', d).onclick = ()=>{ S.perfil.apodo = v; guardar(); d.close(); if(alListo) alListo(); else VISTAS[vistaActual](); };
  });
  const d = $('#dialogo'); d.addEventListener('close', ()=>{ if(S.perfil.apodo==null){ S.perfil.apodo = primerNombre(); guardar(); } }, {once:true});   // se pregunta una sola vez
}
/* Imagen para compartir: 1080 × 1350 o 1080 × 1920 */
async function lienzoFrase(f, fmt){
  const H = fmt==='historia' ? 1920 : 1350, c = document.createElement('canvas'); c.width = 1080; c.height = H; const x = c.getContext('2d'), F = fraseDe(f), L = "'Saira Stencil One', Arial, sans-serif", dt = new Date(f + 'T12:00');
  try{ await document.fonts.load("80px 'Saira Stencil One'"); }catch(e){}
  x.fillStyle = '#0e0d0a'; x.fillRect(0, 0, 1080, H); const g = x.createRadialGradient(540, H * .55, 50, 540, H * .55, 800); g.addColorStop(0, hexA(colorFrase(), .12)); g.addColorStop(1, hexA(colorFrase(), 0)); x.fillStyle = g; x.fillRect(0, 0, 1080, H);
  const partir = (t, px)=>{ x.font = px + 'px ' + L; const out = []; let l = ''; t.split(' ').forEach(w=>{ const n = l ? l + ' ' + w : w; if(x.measureText(n).width > 900 && l){ out.push(l); l = w; } else l = n; }); return out.concat(l); };
  let px = 104, A, B; do{ A = partir(F[0], px); B = partir(F[1], px); px -= 4; }while((A.length + B.length) * (px + 4) * 1.12 > H * .5 && px > 44); px += 4;
  const alto = px * 1.12; let y = H / 2 - (A.length + B.length) * alto / 2 + px * .6; x.textAlign = 'left';
  x.font = '700 32px Arial'; x.fillStyle = '#b3a88f'; x.fillText(fechaLarga(dt), 90, y - px - 30); x.font = px + 'px ' + L;
  x.fillStyle = '#f4ecd9'; A.forEach(l=>{ x.fillText(l, 90, y); y += alto; }); x.fillStyle = colorFrase(); B.forEach(l=>{ x.fillText(l, 90, y); y += alto; });
  if(F[2]){ x.font = '500 30px Arial'; x.fillStyle = '#b3a88f'; x.fillText(F[2], 90, y + 4); }
  x.fillStyle = colorFrase(); x.fillRect(90, H - (fmt==='historia' ? 360 : 180), 110, 9); x.font = '60px ' + L; x.fillStyle = '#f4ecd9'; x.fillText('NSCE', 90, H - (fmt==='historia' ? 270 : 95)); x.font = '700 24px Arial'; x.fillText('No ser como ellos', 270, H - (fmt==='historia' ? 275 : 100));
  return new Promise(ok=>c.toBlob(ok, 'image/jpeg', .94));
}
function compartirFrase(f){ const F = fraseDe(f); return mostrarCompartir({titulo:'Compartir la frase', nombre:'nsce_frase_' + f, generar:fmt=>lienzoFrase(f, fmt), formatos:['historia', 'post'], texto:F[0] + ' ' + F[1] + (F[2] ? ' — ' + F[2] : '') + ' #NSCE'}); }
/* Pantalla completa, la primera vez de cada día */
function mostrarFraseDia(forzar){
  if(!forzar && ((navigator.webdriver && !window.__frase) || pref('frasePant')==='0' || pref('fraseVista')===hoyISO() || !S.perfil.bienvenida && !S.sesiones.length || $('#dialogo').open || $('#dlgPlus') && $('#dlgPlus').open || typeof R!=='undefined' && R && R.corriendo || $('.frase-pant'))) return false;
  const x = fraseDe(hoyISO()); if(!x) return false; pref('fraseVista', hoyISO()); const n = nomSaludo(), b = document.createElement('button'); b.type = 'button'; b.className = 'frase-pant'; b.style.setProperty('--fc', colorFrase());
  b.innerHTML = `<small>${fechaLarga(new Date())}</small><div class="frase-t">${esc(x[0])}<b>${esc(x[1])}</b></div>${x[2] ? `<small style="margin-top:12px">${esc(x[2])}</small>` : ''}<i></i><span class="fp-n">${n ? esc(n) + ', es tu día.' : 'Es tu día.'}</span><span class="fp-t">Toca para empezar</span>`;
  b.onclick = ()=>{ b.remove(); if(S.perfil.apodo==null && !$('#dialogo').open) dialogoApodo(); }; document.body.appendChild(b); b.focus({preventScroll:true}); return true;
}
if(typeof document!=='undefined'){ window.addEventListener('load', ()=>setTimeout(mostrarFraseDia, 900)); document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') setTimeout(mostrarFraseDia, 600); }); }
