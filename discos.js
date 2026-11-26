/* #NSCE — Calculadora de discos: dado el peso total, qué discos poner a cada lado de la barra (kg o lb), con el dibujo de la
   barra y los colores olímpicos (25 rojo, 20 azul, 15 amarillo, 10 verde, 5 blanco). Se abre desde Perfil, Analizar → Pesos y el registro. */
const DISCOS = {
  kg:{barras:[[20, 'Hombre 20'], [15, 'Mujer 15'], [10, 'Técnica 10']], discos:[25, 20, 15, 10, 5, 2.5, 1.25], paso:2.5},
  lb:{barras:[[45, 'Hombre 45'], [35, 'Mujer 35'], [15, 'Técnica 15']], discos:[45, 35, 25, 10, 5, 2.5], paso:5},
};
const COLOR_DISCO = {25:'#d93a35', 20:'#2f6fd6', 15:'#e8c22f', 10:'#3fa45b', 5:'#f2f2f2', 2.5:'#d93a35', 1.25:'#b9bec8'};
const COLOR_DISCO_LB = {45:'#2f6fd6', 35:'#e8c22f', 25:'#3fa45b', 10:'#f2f2f2', 5:'#b9bec8', 2.5:'#b9bec8'};
/* Discos por lado (de mayor a menor) para llegar al total; si no se puede exacto, lo más cercano por debajo */
function discosPorLado(total, barra, lista){
  let resto = Math.round((total - barra) / 2 * 100) / 100; const out = [];
  if(resto <= 0) return {lado:[], real:barra, falta:Math.max(0, total - barra)};
  lista.forEach(d=>{ while(resto + 1e-9 >= d){ out.push(d); resto = Math.round((resto - d) * 100) / 100; } });
  const real = barra + out.reduce((a, b)=>a + b, 0) * 2;
  return {lado:out, real:Math.round(real * 100) / 100, falta:Math.round((total - real) * 100) / 100};
}
function dibujoBarra(lado, u){
  const C = u==='lb' ? COLOR_DISCO_LB : COLOR_DISCO, maxD = u==='lb' ? 45 : 25, W = 340, H = 130, cx = W / 2;
  const alto = d=>Math.max(30, Math.round(110 * (d >= maxD * 0.4 ? 1 : 0.35 + d / maxD))), ancho = d=>d >= (u==='lb' ? 25 : 10) ? 14 : 9;
  let x = 0; const discos = lado.map(d=>{ const w = ancho(d), h = alto(d), r = {d, x, w, h}; x += w + 2; return r; });
  const manga = 70, ini = cx + manga, lados = [1, -1].map(sg=>discos.map(p=>{ const px = sg > 0 ? ini + p.x : cx - manga - p.x - p.w;
    return `<rect x="${px}" y="${H/2 - p.h/2}" width="${p.w}" height="${p.h}" rx="3" fill="${C[p.d] || '#888'}" stroke="#0006"/>`; }).join('')).join('');
  return `<svg class="barra-svg" viewBox="0 0 ${W} ${H}" aria-label="Barra con discos">
    <rect x="6" y="${H/2 - 3}" width="${W - 12}" height="6" rx="3" fill="#9aa0aa"/>
    <rect x="${cx - manga - 6}" y="${H/2 - 9}" width="6" height="18" rx="2" fill="#c9ccd2"/><rect x="${cx + manga}" y="${H/2 - 9}" width="6" height="18" rx="2" fill="#c9ccd2"/>
    ${lados}</svg>`;
}
function calculadoraDiscos(pesoIni, uIni){
  const st = {u:uIni==='lb' || uIni==='kg' ? uIni : pesoPref(), total:num(pesoIni) || null, barra:null};
  st.barra = DISCOS[st.u].barras[0][0]; if(!st.total) st.total = st.u==='lb' ? 135 : 60;
  dialogo(`<div class="cab"><h2>Calculadora de discos</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <div class="segmentos" id="dcU"><button data-u="kg">Kilos</button><button data-u="lb">Libras</button></div>
    <label>Peso total en la barra</label>
    <div class="dc-total"><button class="btn" id="dcMenos">−</button><input id="dcPeso" inputmode="decimal" value=""><button class="btn" id="dcMas">＋</button></div>
    <label>Barra</label><div class="segmentos" id="dcBarra"></div>
    <div id="dcRes"></div>`, d=>{
    const pintar = ()=>{ const D = DISCOS[st.u];
      $$('#dcU button', d).forEach(b=>b.classList.toggle('activa', b.dataset.u===st.u));
      $('#dcBarra', d).innerHTML = D.barras.map(([v, t])=>`<button data-b="${v}" class="${st.barra===v ? 'activa' : ''}">${t}</button>`).join('');
      $$('#dcBarra button', d).forEach(b=>b.onclick = ()=>{ st.barra = +b.dataset.b; pintar(); });
      if(document.activeElement!==$('#dcPeso', d)) $('#dcPeso', d).value = coma(st.total);
      const R = discosPorLado(st.total, st.barra, D.discos), cuenta = {};
      R.lado.forEach(x=>cuenta[x] = (cuenta[x] || 0) + 1);
      const otro = st.u==='kg' ? lbDeKg(R.real) + ' lb' : coma(kgDeLb(R.real)) + ' kg';
      $('#dcRes', d).innerHTML = st.total < st.barra ? `<p class="nota">El peso es menor que la barra (${st.barra} ${st.u}).</p>`
        : `<div class="tarjeta dc-res">${dibujoBarra(R.lado, st.u)}
          <div class="etiqueta">En cada lado</div>
          <div class="dc-lista">${Object.keys(cuenta).map(Number).sort((a, b)=>b - a).map(k=>`<span><i style="background:${(st.u==='lb' ? COLOR_DISCO_LB : COLOR_DISCO)[k]}"></i><b class="num">${cuenta[k]} ×</b> ${coma(k)} ${st.u}</span>`).join('') || '<span>Solo la barra</span>'}</div>
          <p class="suave chico">Total: <b class="num">${coma(R.real)} ${st.u}</b> (≈ ${otro})${R.falta > 0 ? ` · faltan ${coma(R.falta)} ${st.u}: no se arma exacto con los discos comunes` : ''}</p></div>`; };
    $$('#dcU button', d).forEach(b=>b.onclick = ()=>{ if(b.dataset.u===st.u) return;
      st.total = b.dataset.u==='lb' ? lbDeKg(st.total) : kgDeLb(st.total); st.u = b.dataset.u; st.barra = DISCOS[st.u].barras[0][0]; pintar(); });
    $('#dcPeso', d).oninput = e=>{ const v = num(e.target.value); if(v!=null){ st.total = v; pintar(); } };
    $('#dcMenos', d).onclick = ()=>{ st.total = Math.max(0, st.total - DISCOS[st.u].paso); pintar(); };
    $('#dcMas', d).onclick = ()=>{ st.total += DISCOS[st.u].paso; pintar(); };
    pintar();
  });
}
