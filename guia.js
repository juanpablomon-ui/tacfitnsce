/* #NSCE — «Guía visual» (20-nov-2026, pedido del usuario: las infografías de Instagram también dentro de la app). Imágenes en app/guia/*.jpg
   (las copia tienda/instagram/guia_app.sh; sin la que lleva el QR de la App Store ni la de precios). Se abre desde la ayuda «?» (la de esa pantalla
   y la guía completa) y al pie de Ajustes. No van en el caché inicial del sw.js: se guardan al verlas por primera vez (en la app de la tienda vienen dentro). */
const GUIA = [
  ['Empieza aquí', [['semana', 'Tu semana con NSCE'], ['para_quien', '¿Para quién es?'], ['e3', 'Plan gratis: de cero a 20 minutos'], ['e1', 'Un WOD en tres versiones']]],
  ['Tu progreso', [['analiza', 'Analiza por ti'], ['mide', 'Lo que mide por ti'], ['e2', 'Cuánto mejoraste'], ['diario', 'Tu diario']]],
  ['Funciones', [['f1', 'Mi plan'], ['f2', 'Amigos y desafíos'], ['f3', 'Recompensas'], ['f4', 'Militar: PSF y combate'], ['f5', 'Cuerpo y salud'], ['f6', 'Te cuida'], ['f7', 'Corredores'], ['f8', 'Mujer fuerte'], ['f9', 'Biblioteca']]],
  ['Compartir', [['e4', 'Tu logro, listo para tus redes'], ['e5', 'Tu mes en un afiche']]],
];
const GUIA_LISTA = GUIA.flatMap(([, L])=>L);
/* La infografía de cada pantalla (para la ayuda «?») */
const GUIA_PANT = {hoy:'semana', diario:'diario', psf:'f4', progreso:'analiza', perfil:'f3', plan:'f1', reloj:'e1'};
const srcGuia = k=>'guia/' + k + '.jpg';
function dialogoGuia(){
  dialogo(`<div class="cab"><h2>🖼 Guía visual</h2><button class="btn chico-btn" data-cerrar aria-label="Cerrar">✕</button></div>
    <p class="suave chico">Todo lo que hace NSCE, en imágenes. Toca una para verla grande y desliza para pasar a la siguiente.</p>
    ${GUIA.map(([sec, L])=>`<div class="etiqueta" style="margin:12px 0 6px">${esc(sec)}</div><div class="guia-grid">${L.map(([k, t])=>`<button class="guia-mini" data-guia="${k}"><img src="${srcGuia(k)}" alt="" loading="lazy"><span>${esc(t)}</span></button>`).join('')}</div>`).join('')}
    <div class="btns"><button class="btn prim ancho" data-cerrar>Listo</button></div>`, d=>{
    $$('[data-guia]', d).forEach(b=>b.onclick = ()=>verGuia(b.dataset.guia, true)); });
}
/* Visor: todas las imágenes en una fila que se desliza (una por toque), con ‹ › y el título */
function verGuia(k, desdeGaleria){
  let i = Math.max(0, GUIA_LISTA.findIndex(x=>x[0]===k));
  dialogo(`<div class="cab"><h2 id="gvTit">${esc(GUIA_LISTA[i][1])}</h2><button class="btn chico-btn" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="guia-vista" id="gvFila">${GUIA_LISTA.map(([kk, t])=>`<div class="guia-pag"><img src="${srcGuia(kk)}" alt="${esc(t)}" loading="lazy"></div>`).join('')}</div>
    <div class="entre" style="margin-top:8px"><button class="btn chico-btn" id="gvAnt" aria-label="Anterior">‹</button><span class="suave chico num" id="gvN"></span><button class="btn chico-btn" id="gvSig" aria-label="Siguiente">›</button></div>
    <div class="btns">${desdeGaleria ? '<button class="btn" id="gvTodas">Ver todas</button>' : '<button class="btn" id="gvTodas">🖼 Guía completa</button>'}<button class="btn prim" data-cerrar>Listo</button></div>`, d=>{
    const F = $('#gvFila', d), pintar = ()=>{ $('#gvTit', d).textContent = GUIA_LISTA[i][1]; $('#gvN', d).textContent = (i + 1) + ' de ' + GUIA_LISTA.length; };
    const ir_ = (n, suave)=>{ i = Math.max(0, Math.min(GUIA_LISTA.length - 1, n)); F.scrollTo({left:i * F.clientWidth, behavior:suave ? 'smooth' : 'auto'}); pintar(); };
    requestAnimationFrame(()=>ir_(i, false));
    F.addEventListener('scroll', ()=>{ const n = Math.round(F.scrollLeft / Math.max(1, F.clientWidth)); if(n!==i){ i = n; pintar(); } }, {passive:true});
    $('#gvAnt', d).onclick = ()=>ir_(i - 1, true); $('#gvSig', d).onclick = ()=>ir_(i + 1, true);
    $('#gvTodas', d).onclick = dialogoGuia;
  });
}
document.addEventListener('click', e=>{ const b = e.target.closest && e.target.closest('[data-guia-todas]'); if(!b) return; e.preventDefault(); dialogoGuia(); }, true);
