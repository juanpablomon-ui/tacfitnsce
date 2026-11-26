/* #NSCE — Fuentes de los cálculos de salud (15-nov-2026; Apple rechazó la 1.0 por la guía 1.4.1: «la app da cálculos de salud en Energía y
   calorías sin citar las fuentes»). Cada fuente fue revisada en PubMed (título, autor y año) o abre su página oficial.
   htmlLinkFuentes(grupo) = enlace «📖 Fuentes de estos cálculos ›» que abre dialogoFuentes(grupo); dialogoFuentes() sin grupo = todas.
   Carga antes de app.js. */
const FUENTES = {
  mifflin:['Gasto en reposo (fórmula de Mifflin-St Jeor)', 'Mifflin MD y cols. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr, 1990.', 'https://pubmed.ncbi.nlm.nih.gov/2305711/'],
  katch:['Gasto en reposo con % de grasa (fórmula de Katch-McArdle)', 'McArdle WD, Katch FI, Katch VL. Exercise Physiology: Nutrition, Energy, and Human Performance. Wolters Kluwer (libro).', ''],
  keytel:['Calorías con la frecuencia cardíaca', 'Keytel LR y cols. Prediction of energy expenditure from heart rate monitoring during submaximal exercise. J Sports Sci, 2005.', 'https://pubmed.ncbi.nlm.nih.gov/15966347/'],
  compendio:['Calorías por tipo de actividad (MET)', 'Herrmann SD y cols. 2024 Adult Compendium of Physical Activities. J Sport Health Sci, 2024.', 'https://pubmed.ncbi.nlm.nih.gov/38242596/'],
  pandolf:['Calorías de la marcha con carga', 'Pandolf KB y cols. Predicting energy expenditure with loads while standing or walking very slowly. J Appl Physiol, 1977.', 'https://pubmed.ncbi.nlm.nih.gov/908672/'],
  acsm_eq:['Calorías de carrera y caminata (ecuaciones del ACSM)', 'American College of Sports Medicine. ACSM\'s Guidelines for Exercise Testing and Prescription (libro).', ''],
  hall:['Cambio de peso según las calorías', 'Hall KD y cols. Quantification of the effect of energy imbalance on bodyweight. Lancet, 2011.', 'https://pubmed.ncbi.nlm.nih.gov/21872751/'],
  proteina:['Proteína para quien entrena', 'Jäger R y cols. International Society of Sports Nutrition Position Stand: protein and exercise. J Int Soc Sports Nutr, 2017.', 'https://pubmed.ncbi.nlm.nih.gov/28642676/'],
  agua:['Agua y entrenamiento', 'American College of Sports Medicine. Position stand: Exercise and fluid replacement. Med Sci Sports Exerc, 2007.', 'https://pubmed.ncbi.nlm.nih.gov/17277604/'],
  carga:['Carga del entrenamiento (minutos × esfuerzo)', 'Foster C y cols. A new approach to monitoring exercise training. J Strength Cond Res, 2001.', 'https://pubmed.ncbi.nlm.nih.gov/11708692/'],
  imc:['Índice de masa corporal (IMC)', 'Organización Mundial de la Salud. Obesidad y sobrepeso (nota descriptiva).', 'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight'],
  cintura:['Cintura / estatura', 'Ashwell M y cols. Waist-to-height ratio is a better screening tool than waist circumference and BMI. Obes Rev, 2012.', 'https://pubmed.ncbi.nlm.nih.gov/22106927/'],
  kelly:['Índice de masa grasa y masa magra', 'Kelly TL y cols. Dual energy X-ray absorptiometry body composition reference values from NHANES. PLoS One, 2009.', 'https://pubmed.ncbi.nlm.nih.gov/19753111/'],
  cooper:['VO₂máx con la prueba de Cooper', 'Cooper KH. A means of assessing maximal oxygen intake. JAMA, 1968.', 'https://pubmed.ncbi.nlm.nih.gov/5694044/'],
  rockport:['VO₂máx con la caminata de 1,6 km (Rockport)', 'Kline GM y cols. Estimation of VO2max from a one-mile track walk, gender, age, and body weight. Med Sci Sports Exerc, 1987.', 'https://pubmed.ncbi.nlm.nih.gov/3600239/'],
  loe:['Edad física (VO₂máx de referencia por edad)', 'Loe H y cols. Aerobic capacity reference data in 3816 healthy men and women 20-90 years. PLoS One, 2013.', 'https://pubmed.ncbi.nlm.nih.gov/23691196/'],
  parq:['Cuestionario de salud antes de entrenar (PAR-Q+)', 'PAR-Q+ Collaboration. The Physical Activity Readiness Questionnaire for Everyone.', 'https://eparmedx.com/'],
};
const GRUPOS_FUENTES = {
  energia:['mifflin', 'katch', 'keytel', 'compendio', 'acsm_eq', 'pandolf', 'carga'],
  peso:['hall', 'mifflin', 'proteina', 'imc'],
  agua:['agua'],
  salud:['imc', 'cintura', 'kelly', 'parq'],
  pruebas:['cooper', 'rockport', 'loe'],
};
const AVISO_FUENTES = 'Son estimaciones para orientar tu entrenamiento, no un diagnóstico. No reemplazan a un médico ni a un nutricionista: ante cualquier duda de salud, consúltalos.';
const htmlLinkFuentes = (g, txt)=>`<button class="link chico fuentes-btn" data-fuentes="${g || ''}">📖 ${esc(txt || 'Fuentes de estos cálculos')} ›</button>`;
function dialogoFuentes(g){
  const ids = g && GRUPOS_FUENTES[g] ? GRUPOS_FUENTES[g] : Object.keys(FUENTES);
  dialogo(`<div class="cab"><h2>📖 Fuentes</h2><button class="btn chico-btn" data-cerrar aria-label="Cerrar">✕</button></div>
    <p class="suave chico">Los cálculos de la app salen de estos estudios y guías. Toca uno para abrirlo.</p>
    <ul class="fuentes-lista">${ids.map(k=>{ const [t, c, u] = FUENTES[k];
      return `<li><b>${esc(t)}</b><span>${esc(c)}</span>${u ? `<a href="${u}" target="_blank" rel="noopener" class="link">Abrir la fuente ›</a>` : ''}</li>`; }).join('')}</ul>
    <p class="nota">⚠️ ${esc(AVISO_FUENTES)}</p>
    ${g ? '<button class="btn ancho" id="fuTodas">Ver todas las fuentes</button>' : ''}`, d=>{ if($('#fuTodas', d)) $('#fuTodas', d).onclick = ()=>dialogoFuentes(); });
}
document.addEventListener('click', e=>{ const b = e.target.closest && e.target.closest('[data-fuentes]'); if(!b) return; e.preventDefault(); e.stopPropagation(); dialogoFuentes(b.dataset.fuentes); }, true);
/* En la app de iPhone los enlaces a otra página se abren en Safari (igual que privacidad.html en nativa.js) */
document.addEventListener('click', e=>{ const a = e.target.closest && e.target.closest('.fuentes-lista a'); if(!a || !(typeof esNativa==='function' && esNativa())) return; e.preventDefault(); window.open(a.href, '_blank'); }, true);
