import { ENGINE_VARIANTS } from '../data/mockData.js';
import { CLICK_ANGLES } from '../data/angles.js';
import { icon } from '../icons.js';

export function renderEngine(container) {
  const variants = ENGINE_VARIANTS;
  const angles = CLICK_ANGLES;

  let html = `<div class="animate-in">
    <div class="section-header">
      <div>
        <h2 class="section-title">${icon('cog', 22)} Fábrica Creativa</h2>
        <p class="section-subtitle">Generación por lotes de miniaturas de alto impacto</p>
      </div>
      <div class="flex gap-sm">
        <button class="btn btn-secondary btn-sm">${icon('grid', 14)} Historial</button>
        <button class="btn btn-primary" id="btn-generate">${icon('rocket', 16)} Generar</button>
      </div>
    </div>

    <div class="grid-3 mb-lg">
      <div class="card">
        <div class="card-title mb-md">${icon('file', 16)} Script</div>
        <div class="form-group"><label class="form-label">Título</label>
        <input type="text" class="form-input" value="GPT-5 vs Gemini Ultra" /></div>
        <div class="form-group"><label class="form-label">Resumen</label>
        <textarea class="form-textarea" style="min-height:80px;">Comparación entre GPT-5 y Gemini Ultra con benchmarks reales.</textarea></div>
        <div class="form-group"><label class="form-label">Keywords</label>
        <div class="flex gap-xs" style="flex-wrap:wrap;">
          <span class="badge badge-accent">GPT-5</span><span class="badge badge-accent">Gemini</span><span class="badge badge-success">Benchmark</span>
        </div></div>
      </div>

      <div class="card">
        <div class="card-title mb-md">${icon('crosshair', 16)} Ángulo</div>
        <div class="form-group"><label class="form-label">Ángulo</label>
        <select class="form-select">${angles.map(a => `<option value="${a.id}" ${a.id === 'vs' ? 'selected' : ''}>${a.name}</option>`).join('')}</select></div>
        <div class="card" style="padding:var(--space-md);background:var(--bg-tertiary);margin-top:var(--space-md);">
          <div class="text-xs font-bold text-accent mb-sm">ACTIVO: El Versus</div>
          <div class="text-xs text-muted">Confrontación directa. Sesgo de confirmación.</div></div>
        <div class="form-group mt-md"><label class="form-label">Estilo</label>
        <div class="tabs"><button class="tab active">Tech</button><button class="tab">Minimal</button><button class="tab">Dramático</button></div></div>
      </div>

      <div class="card">
        <div class="card-title mb-md">${icon('sliders', 16)} Parámetros</div>
        <div class="form-group"><label class="form-label">Variantes</label>
        <div class="tabs" style="margin-bottom:0;"><button class="tab">3</button><button class="tab active">6</button><button class="tab">10</button></div></div>
        <div class="form-group"><label class="form-label">Expresión</label>
        <select class="form-select"><option>Sorpresa</option><option selected>Confianza</option><option>Pensando</option></select></div>
        <div class="form-group"><label class="form-label">Resolución</label>
        <select class="form-select"><option selected>1280×720</option><option>1920×1080</option></select></div>
      </div>
    </div>

    <div class="card mb-lg" style="border-color:var(--accent);background:rgba(220,38,38,0.03);">
      <div class="flex items-center justify-between mb-sm">
        <div class="flex items-center gap-sm"><span class="status-dot online"></span><span class="text-sm font-bold">6 variantes generadas</span></div>
        <span class="text-xs text-muted">hace 3 min</span></div>
      <div class="progress-bar"><div class="progress-bar-fill" style="width:100%;"></div></div>
    </div>

    <div class="section-header"><div class="card-title">${icon('image', 16)} Variantes</div>
    <button class="btn btn-secondary btn-sm">${icon('download', 14)} Descargar</button></div>
    <div class="grid-3">`;

  variants.forEach((v, i) => {
    html += `<div class="thumbnail-card" style="animation:fadeIn 0.4s ease both;animation-delay:${i * 0.1}s;">
        <div class="thumb-img" style="background:linear-gradient(${135 + i * 30}deg,#0a0a1a,#1a0a2e);position:relative;">
          <span style="color:var(--text-tertiary);">${icon('image', 36)}</span>
          <div style="position:absolute;bottom:0;left:0;right:0;padding:8px;background:linear-gradient(transparent,rgba(0,0,0,0.8));">
            <div style="font-family:var(--font-impact);font-size:18px;color:white;letter-spacing:2px;">${v.text}</div></div></div>
        <div class="thumb-info">
          <div class="flex items-center justify-between mb-sm">
            <span class="badge badge-accent">${v.angle}</span>
            <span class="font-bold ${v.score >= 90 ? 'text-success' : 'text-accent'}">${v.score}</span></div>
          <div class="text-xs text-muted">${v.style}</div></div>
        <div class="thumb-actions">
          <button class="btn btn-secondary btn-sm" style="flex:1;">${icon('user', 12)} Rostro</button>
          <button class="btn btn-secondary btn-sm" style="flex:1;">${icon('repeat', 12)} Ángulo</button>
          <button class="btn btn-secondary btn-sm" style="flex:1;">${icon('type', 12)} Texto</button></div></div>`;
  });

  html += `</div>
  </div>`;
  container.innerHTML = html;

  const btn = document.getElementById('btn-generate');
  if (btn) btn.addEventListener('click', () => {
    btn.innerHTML = '<span class="animate-pulse">' + icon('clock', 16) + '</span> Generando...';
    btn.disabled = true;
    setTimeout(() => { btn.innerHTML = icon('rocket', 16) + ' Generar'; btn.disabled = false; }, 2000);
  });
}
