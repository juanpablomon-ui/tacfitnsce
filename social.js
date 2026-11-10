/* #NSCE — Portada tipo Instagram en Inicio y acceso a redes sociales: menú «Compartir» (último entrenamiento,
   fotos, logros, informe del mes y perfil), formato publicación 4:5 o historia 9:16 y texto listo para pegar.
   Las redes se alcanzan con el menú de compartir del teléfono (Instagram, WhatsApp, Facebook…); en el computador se guarda la imagen. */

/* ---------- Portada tipo Instagram (arriba del Muro en el Diario; hasta el 22-oct-2026 estaba en Inicio) ---------- */
function sesionesConFoto(n){ return S.sesiones.filter(s=>(s.fotos || []).length).sort((a, b)=>a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : (b.creado || 0) - (a.creado || 0)).slice(0, n || 12); }
function htmlPortadaIG(){
  const p = S.perfil, st = estadisticas(), E = estadoInsignias(st), pt = puntos(st, E), hoy = hoyISO();
  const ini = (p.nombre || '').split(' ').filter(Boolean).slice(0, 2).map(x=>x[0].toUpperCase()).join('') || '◆';
  const km = Object.values(st.km).reduce((a, b)=>a + b, 0) / 1000, hecho = S.sesiones.some(s=>s.fecha===hoy), dest = sesionesConFoto(12);
  const m30 = acumular(S.sesiones.filter(s=>s.fecha >= hace(30)));
  const corto = s=>{ const t = (s.titulo || etiquetaTipo(s)).split(/[ ·(]/)[0]; return t.length > 9 ? t.slice(0, 8) + '…' : t; };
  return `<section class="ig-portada">
    <div class="ig-top">
      <button class="ig-avatar ${hecho ? 'activo' : ''}" id="igAvatar" aria-label="Foto de perfil"><span class="ig-av-in">${p.avatar ? `<img data-foto="${p.avatar}" alt="">` : `<b>${esc(ini)}</b>`}</span><span class="ig-mas">+</span></button>
      <div class="ig-der">
        <div class="ig-nombre">${p.nombre ? esc(p.nombre) : '<span class="suave">Tu nombre</span>'}</div>
        <div class="ig-cifras">
          <div><b class="num">${st.n.toLocaleString('es-CL')}</b><span>sesiones</span></div>
          <div><b class="num">${fmtNum(Math.round(nKm(km)))}</b><span>${uDist()}</span></div>
          <div><b class="num">${insigniasGanadas(E).length}</b><span>insignias</span></div>
        </div>
      </div>
    </div>
    <div class="ig-bio"><div class="ig-rango">🎖️ ${esc(pt.rango)} · ${pt.total.toLocaleString('es-CL')} pts</div>
      ${p.frase ? `<div class="ig-frase">${esc(p.frase)}</div>` : '<div class="ig-frase suave">Toca Editar para poner tu foto, nombre y tu lema.</div>'}</div>
    <button class="ig-panel" id="igPanel"><b>Tu panel</b><span><i>↗</i> ${m30.n} sesi${m30.n===1 ? 'ón' : 'ones'}${m30.km ? ', ' + verKm(m30.km) : ''} y ${fmtHoras(m30.min)} h en los últimos 30 días.</span></button>
    <div class="ig-btns"><button class="btn" id="igEditar">Editar</button><button class="btn" id="igCompartir">Compartir</button><button class="btn ig-reg" id="igRegistrar" aria-label="Registrar entrenamiento">＋</button></div>
    <div class="ig-destacados">
      <button class="ig-dest nuevo" id="igFoto"><span class="ig-dc">＋</span><small>Nueva</small></button>
      ${dest.map(s=>`<button class="ig-dest" data-dsid="${s.id}"><span class="ig-dc"><img data-foto="${s.fotos[0]}" alt=""></span><small>${esc(corto(s))}</small></button>`).join('')}
      ${dest.length ? '' : '<div class="ig-dest-vacio suave chico">Tus fotos de entrenamiento aparecerán aquí como destacadas.</div>'}
    </div>
  </section>`;
}
function enlazarPortadaIG(){
  const r = $('.ig-portada'); if(!r) return;
  cargarFotos(r);
  $('#igEditar').onclick = dialogoEditarPerfil; $('#igAvatar').onclick = dialogoEditarPerfil;
  $('#igCompartir').onclick = menuCompartir;
  $('#igPanel').onclick = ()=>ir('progreso'); $('#igRegistrar').onclick = ()=>abrirRegistro();
  $('#igFoto').onclick = ()=>{ const hoy = S.sesiones.filter(s=>s.fecha===hoyISO()).sort((a, b)=>(b.creado || 0) - (a.creado || 0))[0];
    if(!hoy){ aviso('Primero registra el entrenamiento; las fotos se agregan al final'); abrirRegistro(); return; }
    elegirFotos(async bs=>{ if(!bs.length) return; await agregarFotosA(hoy, bs); aviso('Foto agregada a «' + (hoy.titulo || etiquetaTipo(hoy)) + '»'); if(vistaActual==='diario') vMuro(); else vHoy(); }); };
  $$('[data-dsid]', r).forEach(b=>b.onclick = ()=>verSesion(S.sesiones.find(s=>s.id===b.dataset.dsid)));
}

/* ---------- Diálogo común para compartir ---------- */
const FORMATOS = {post:['Publicación', '4:5', 1350], historia:['Historia', '9:16', 1920]};
/* Guardar la imagen: en el teléfono abre el menú de compartir, que trae «Guardar imagen» (queda en Fotos). Bajarla como archivo en el
   iPhone abre una pantalla de descarga (JPG con «Abrir en Vista Previa») y no llega a Fotos. En el computador se descarga. */
function guardarImagen(file, url){
  if(navigator.canShare && navigator.canShare({files:[file]})){ aviso('Elige «Guardar imagen» para dejarla en tus fotos');
    navigator.share({files:[file]}).catch(()=>{}); return; }
  const a = document.createElement('a'); a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
}
async function mostrarCompartir(o){
  // o = {titulo, nombre (sin extensión), generar(formato) → Promise<Blob>, texto, formatos:[...]}
  const fmts = o.formatos || ['post', 'historia'];
  let fmt = fmts.includes(pref('fmtComp')) ? pref('fmtComp') : fmts[0];
  const pintar = async ()=>{
    const b = await o.generar(fmt), url = URL.createObjectURL(b), ext = b.type==='image/png' ? '.png' : '.jpg', nombre = o.nombre + (fmt==='historia' ? '_historia' : '') + ext;
    const file = new File([b], nombre, {type:b.type || 'image/jpeg'}), puede = !!(navigator.canShare && navigator.canShare({files:[file]}));
    const NOM = {foto:['Foto sola', 'original']};
    dialogo(`<div class="cab"><h2>${esc(o.titulo)}</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
      ${fmts.length > 1 ? `<div class="segmentos" id="cmpFmt" style="margin:6px 0 10px">${fmts.map(k=>{ const n = FORMATOS[k] || NOM[k]; return `<button data-f="${k}" class="${k===fmt ? 'activa' : ''}">${n[0]} <small>${n[1]}</small></button>`; }).join('')}</div>` : ''}
      <img class="cmp-vista ${fmt}" src="${url}" alt="Imagen para compartir">
      ${o.texto ? `<label style="margin-top:10px">Texto para tu publicación</label><textarea id="cmpTexto" rows="3" readonly>${esc(o.texto)}</textarea>` : ''}
      <div class="btns"><button class="btn" id="cmpBajar">⬇ Guardar</button>${o.texto ? '<button class="btn" id="cmpCopiar">⧉ Copiar texto</button>' : ''}${puede ? '<button class="btn prim" id="cmpEnviar">↗ Compartir…</button>' : ''}</div>
      <p class="nota">${puede ? '«Compartir…» abre el menú del teléfono: elige Instagram (publicación o historia), WhatsApp, Facebook u otra app. El texto se copia solo: pégalo en tu publicación.'
        : 'En este equipo no se puede enviar directo: guarda la imagen y súbela desde la red social (en el iPhone sí aparece «Compartir…»).'}</p>`, d=>{
      $$('#cmpFmt button', d).forEach(x=>x.onclick = ()=>{ fmt = x.dataset.f; if(FORMATOS[fmt]) pref('fmtComp', fmt); pintar(); });
      const copiar = ()=>{ try{ navigator.clipboard.writeText(o.texto).catch(()=>{}); }catch(e){} };
      if($('#cmpCopiar', d)) $('#cmpCopiar', d).onclick = ()=>{ copiar(); aviso('Texto copiado'); };
      if(puede) $('#cmpEnviar', d).onclick = ()=>{ if(o.texto) copiar(); navigator.share({files:[file], title:o.titulo}).catch(()=>{}); };
      $('#cmpBajar', d).onclick = ()=>guardarImagen(file, url);
    });
  };
  await pintar();
}
const ETIQ = '#NSCE #EntrenamientoFísico';
const textoSesion = s=>[(s.titulo || etiquetaTipo(s)) + (s.txt ? ': ' + s.txt + (s.rx ? ' Rx' : '') : ''), lineaMetricas(s), ETIQ].filter(Boolean).join('\n');

/* ---------- Tarjeta de un logro (récord, insignia, hito, ascenso, control PSF) ---------- */
const TIPO_LOGRO = {rec:'RÉCORD PERSONAL', ins:'NUEVA INSIGNIA', hito:'HITO ALCANZADO', rango:'ASCENSO DE RANGO', psf:'CONTROL PSF'};
function lineasTexto(x, t, max){ const out = []; let l = ''; String(t).split(' ').forEach(p=>{ const k = l ? l + ' ' + p : p; if(x.measureText(k).width > max && l){ out.push(l); l = p; } else l = k; }); if(l) out.push(l); return out; }
function compartirLogro(e){
  mostrarCompartir({titulo:'Compartir logro', nombre:'nsce_logro_' + (e.fecha || hoyISO()), generar:f=>tarjetaLogro(e, FORMATOS[f][2]),
    texto:`${e.ic} ${e.t}${e.d ? ' (' + e.d + ')' : ''}\n${ETIQ}`});
}
/* Toque en cualquier logro del muro (Analizar, Informe) o en «Compartir» del logro del día */
document.addEventListener('click', ev=>{
  const l = ev.target.closest('[data-logro]'); if(l){ try{ compartirLogro(JSON.parse(l.dataset.logro)); }catch(er){} return; }
  const s = ev.target.closest('[data-compartir-sid]'); if(s){ const x = S.sesiones.find(y=>y.id===s.dataset.compartirSid); if(x) compartirSesion(x); }
});
const attrLogro = e=>`data-logro="${esc(JSON.stringify({ic:e.ic, t:e.t, d:e.d, fecha:e.fecha, tipo:e.tipo}))}"`;

/* ---------- Menú «Compartir en redes» ---------- */
function menuCompartir(){
  const ult = ordenCrono().slice(-1)[0], fotos = sesionesConFoto(30), L = muroLogros(), I = informeMes(0);
  const op = (id, ic, t, d, ok)=>`<button class="cmp-op" data-op="${id}" ${ok ? '' : 'disabled'}><span class="cmp-ic">${ic}</span><span><b>${t}</b><small>${d}</small></span><span class="chev">›</span></button>`;
  dialogo(`<div class="cab"><h2>Compartir en redes</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <p class="suave chico" style="margin-top:0">Imágenes listas para Instagram, WhatsApp o Facebook, con el diseño de la app.</p>
    <div class="cmp-ops">
      ${op('ult', '📸', 'Último entrenamiento', ult ? esc((ult.titulo || etiquetaTipo(ult)) + ' · ' + verFecha(ult.fecha)) + ' (con tu foto y resultado)' : 'Aún no registras entrenamientos', !!ult)}
      ${op('fotos', '🖼️', 'Fotos de entrenamiento', fotos.length ? fotos.length + ' entrenamiento' + (fotos.length===1 ? '' : 's') + ' con fotos' : 'Agrega fotos al registrar o con ＋ Foto', fotos.length)}
      ${op('logros', '🏆', 'Logros y récords', L.length ? L.length + ' logros para elegir' : 'Tus récords e insignias aparecerán aquí', L.length)}
      ${op('informe', '📊', 'Informe del mes', esc(I.nombre) + ' · ' + I.t.n + ' sesiones', I.t.n)}
      ${op('mes', '📣', 'Tu mes', 'Afiche con tus días, récords y desafíos de ' + nombreMes(mesPorDefecto()), true)}
      ${op('perfil', '🎖️', 'Mi perfil', 'Sesiones, km, insignias y rango', true)}
    </div>`, d=>{
    $$('[data-op]', d).forEach(b=>b.onclick = ()=>{ const k = b.dataset.op;
      if(k==='ult') compartirSesion(ult); else if(k==='fotos') elegirFotoCompartir(); else if(k==='informe') compartirInforme(I); else if(k==='perfil') compartirPerfil(); else if(k==='mes') compartirTuMes();
      else if(k==='logros') dialogo(`<div class="cab"><h2>Elige un logro</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
        <ul class="muro-logros">${L.slice(0, 40).map(e=>`<li class="ml-${e.tipo}" ${attrLogro(e)}><span class="ml-ic">${e.ic}</span><div><b>${esc(e.t)}</b><span>${esc(e.d)} · ${verFecha(e.fecha)}</span></div></li>`).join('')}</ul>`); });
  });
}
function elegirFotoCompartir(){
  const ss = sesionesConFoto(30), items = [];
  ss.forEach(s=>s.fotos.forEach(f=>items.push([s, f])));
  dialogo(`<div class="cab"><h2>Elige una foto</h2><button class="btn chico-btn" data-cerrar>✕</button></div>
    <div class="cmp-fotos">${items.slice(0, 60).map(([s, f], i)=>`<button data-i="${i}"><img data-foto="${f}" alt=""><small>${verFecha(s.fecha)}</small></button>`).join('')}</div>`, d=>{
    cargarFotos(d);
    $$('[data-i]', d).forEach(b=>b.onclick = ()=>{ const [s, f] = items[+b.dataset.i]; compartirSesion(s, f); });
  });
}
