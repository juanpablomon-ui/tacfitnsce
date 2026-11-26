/* #NSCE como app de la tienda (2-nov-2026; Capacitor, carpeta ios_nsce/): lo que cambia respecto de la web.
   (1) Compartir y guardar archivos (respaldo, Excel, imágenes): el navegador de una app nativa no comparte archivos ni descarga, así que
   navigator.share usa los complementos Share y Filesystem de Capacitor (escribe el archivo en el caché y abre el menú de compartir del
   teléfono: Guardar en Archivos, Guardar imagen, WhatsApp…). (2) Los enlaces a privacidad.html y terminos.html abren la página publicada en
   Safari (dentro de la app no habría cómo volver). La app nativa se da por instalada (esInstalada en proteger.js) y los avisos web quedan
   ocultos (avisos.js): los avisos nativos llegan con la cuenta de Apple. (3) Sin unidad ni gimnasio (conGrupos). En la web nada de esto corre. */
'use strict';
const esNativa = ()=>!!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const WEB_PUBLICA = 'https://juanpablomon-ui.github.io/tacfitnsce/';
/* Unidad y gimnasio (grupos): la primera versión de la tienda sale SIN ellos (decisión del usuario 3-nov-2026: «aún la encuentro muy complicada»;
   llegan en una actualización). La web los mantiene. Para activarlos en la tienda: que conGrupos devuelva true. */
const conGrupos = ()=>!esNativa();
if(esNativa()){
  const P = window.Capacitor.Plugins || {};
  /* 8-nov-2026: en el iPhone la barra de abajo apareció en medio de la pantalla y la de arriba sin su contenido. El desenfoque del fondo
     (backdrop-filter) en barras fijas falla en el navegador de las apps de iPhone al desplazarse: en la app nativa van con fondo sólido
     (clase «nativa» en estilos.css) y se rearman al volver a la app o cambiar el tamaño. */
  document.documentElement.classList.add('nativa');
  const vp = document.querySelector('meta[name=viewport]'); if(vp) vp.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';   // app: sin zoom
  const reacomodar = ()=>requestAnimationFrame(()=>{ const B = document.querySelectorAll('.pestanas, .barra-sup'); B.forEach(b=>b.style.transform = 'translateZ(0)');
    requestAnimationFrame(()=>B.forEach(b=>b.style.transform = '')); });
  ['resize', 'focus', 'pageshow'].forEach(ev=>window.addEventListener(ev, reacomodar));
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') reacomodar(); });
  if(P.Share && P.Filesystem){
    const base64 = blob=>new Promise((ok, mal)=>{ const r = new FileReader(); r.onload = ()=>ok(String(r.result).split(',')[1]); r.onerror = mal; r.readAsDataURL(blob); });
    navigator.canShare = ()=>true;
    navigator.share = async (d = {})=>{
      const files = [];
      for(const f of d.files || []){ const w = await P.Filesystem.writeFile({path:'compartir/' + (f.name || 'archivo'), data:await base64(f), directory:'CACHE', recursive:true}); files.push(w.uri); }
      try{ await P.Share.share({title:d.title, text:d.text, url:d.url, files:files.length ? files : undefined, dialogTitle:d.title}); }
      catch(e){ if(/cancel/i.test(String(e && e.message || e))){ const x = new Error('Cancelado'); x.name = 'AbortError'; throw x; } throw e; }
    };
  }
  document.addEventListener('click', e=>{ const a = e.target.closest && e.target.closest('a[href]'); if(!a) return;
    const h = a.getAttribute('href'); if(/^(privacidad|terminos)\.html/.test(h)){ e.preventDefault(); window.open(WEB_PUBLICA + h, '_blank'); } }, true);
}
