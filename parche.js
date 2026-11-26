/* #NSCE — Parche del rango (25-nov-2026, opción D3 aprobada): hexágono con galones (1-4) y, desde Élite, estrellas; color por rango; el anillo se llena con el avance al siguiente. */
'use strict';
const COLOR_RANGO = ['#9a948a', '#7fa650', '#3f93b8', '#c07f4a', '#dcae4c', '#d0483a', '#9268d8'];
function parcheRango(idx, pct, t){
  const c = COLOR_RANGO[idx], H = 'M20 1.5 36 10.7v18.6L20 38.5 4 29.3V10.7z', n = idx < 4 ? idx + 1 : 3, paso = n===4 ? 4.3 : 4.7, base = (idx < 4 ? 20 + (n - 1) * paso / 2 : 27.5) + .5;
  const gal = Array.from({length:n}, (_, i)=>{ const y = base - i * paso; return `<path d="M13.5 ${y + 2}l6.5-4 6.5 4" fill="none" stroke="${c}" stroke-width="2.3"/>`; }).join('');
  const est = (x, y)=>`<path transform="translate(${x} ${y}) scale(.23)" fill="${c}" d="M0-14 4-4.5 14-4 6 2.5 9 13 0 7-9 13-6 2.5-14-4-4-4.5z"/>`;
  const E = idx===4 ? est(20, 11.5) : idx===5 ? est(16, 11.8) + est(24, 11.8) : idx===6 ? est(13.2, 13) + est(20, 10.2) + est(26.8, 13) : '';
  return `<svg class="parche" width="${t}" height="${t}" viewBox="-1 -1 42 42" aria-hidden="true"><path d="${H}" fill="#14130f"/><path d="${H}" fill="none" stroke="var(--borde)" stroke-width="3.4"/>${pct > 0 ? `<path d="${H}" fill="none" stroke="${c}" stroke-width="3.4" pathLength="100" stroke-dasharray="${Math.min(100, pct)} 100"/>` : ''}${gal}${E}</svg>`;
}
function htmlParche(){
  const p = puntos(), v = pref('rangoVisto'), sube = v!=null && v!=='' && p.idx > +v; pref('rangoVisto', String(p.idx));
  return `<button class="sal-parche${sube ? ' sube' : ''}" id="bRango" aria-label="Rango ${p.rango}: ${p.sig ? p.pct + ' % hacia ' + p.sig : 'rango máximo'}">${parcheRango(p.idx, p.sig ? p.pct : 100, 54)}<b>${p.rango}</b></button>`;
}
