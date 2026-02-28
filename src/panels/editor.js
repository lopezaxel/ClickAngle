import { icon } from '../icons.js';

export function renderEditor(container) {
  let activeTab = 'editor';

  function render() {
    if (activeTab === 'editor') renderEditorView(container);
    else if (activeTab === 'simulator') renderSimulator(container);
    else if (activeTab === 'stickers') renderStickers(container);
  }

  function renderEditorView(c) {
    c.innerHTML = `<div class="animate-in">
      <div class="section-header">
        <div>
          <h2 class="section-title">${icon('scissors', 22)} Editor Quirúrgico & Simulador</h2>
          <p class="section-subtitle">Post-procesado, testing visual y exportación</p>
        </div>
        <div class="flex gap-sm">
          <button class="btn btn-secondary btn-sm">${icon('download', 14)} Exportar PNG</button>
          <button class="btn btn-primary btn-sm">${icon('download', 14)} Exportar Todo</button>
        </div>
      </div>

      <div class="tabs">
        <button class="tab ${activeTab === 'editor' ? 'active' : ''}" id="tab-editor">${icon('palette', 14)} Editor</button>
        <button class="tab ${activeTab === 'simulator' ? 'active' : ''}" id="tab-simulator">${icon('monitor', 14)} Simulador</button>
        <button class="tab ${activeTab === 'stickers' ? 'active' : ''}" id="tab-stickers">${icon('star', 14)} Stickers</button>
      </div>

      <div class="grid-2" style="grid-template-columns: 2fr 1fr;">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Canvas de Edición</div>
            <div class="flex gap-xs">
              <button class="btn btn-secondary btn-sm" id="btn-blur">${icon('eye', 14)} Blur Test 500ms</button>
              <button class="btn btn-ghost btn-sm" id="btn-undo">${icon('undo', 14)} Deshacer</button>
            </div>
          </div>
          <div style="background: linear-gradient(135deg, #0d0d2b, #1a1a3e); border-radius: var(--radius-md); min-height: 360px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;" id="editor-canvas">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; z-index: 1;">
              <div style="color: var(--accent); margin-bottom: var(--space-md);">${icon('bolt', 64)}</div>
              <div style="font-family: var(--font-impact); font-size: 48px; color: white; letter-spacing: 3px; text-shadow: 2px 2px 20px rgba(220,38,38,0.5);" id="canvas-text">GPT-5 VS GEMINI</div>
              <div style="font-family: var(--font-impact); font-size: 24px; color: var(--accent-light); letter-spacing: 2px; margin-top: 8px;" id="canvas-subtext">¿CUÁL ES MEJOR?</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title mb-md">${icon('sliders', 16)} Controles</div>
          <div class="form-group"><label class="form-label">Texto Principal</label>
          <input type="text" class="form-input" id="text-input" value="GPT-5 vs GEMINI" /></div>
          <div class="form-group"><label class="form-label">Subtexto</label>
          <input type="text" class="form-input" id="subtext-input" value="¿CUÁL ES MEJOR?" /></div>
          <div class="form-group"><label class="form-label">Tamaño Texto</label>
          <input type="range" min="24" max="72" value="48" style="width:100%;accent-color:var(--accent);" id="text-size" /></div>
          <div class="form-group"><label class="form-label">Color Texto</label>
          <div class="flex gap-sm" style="flex-wrap:wrap;">
            ${['var(--accent)', '#EC4899', '#10B981', '#F59E0B', '#EF4444'].map(c => `
              <div class="color-swatch" style="width:32px;height:32px;background:${c};cursor:pointer;" data-color="${c}"></div>
            `).join('')}
          </div></div>
          <div class="form-group"><label class="form-label">Opacidad Fondo</label>
          <input type="range" min="0" max="100" value="80" style="width:100%;accent-color:var(--accent);" /></div>
          <div class="form-group"><label class="form-label">Brillo</label>
          <input type="range" min="0" max="200" value="100" style="width:100%;accent-color:var(--accent);" /></div>
          <div class="form-group"><label class="form-label">Contraste</label>
          <input type="range" min="0" max="200" value="100" style="width:100%;accent-color:var(--accent);" /></div>
        </div>
      </div>
    </div>`;
    bindTabs(c); bindEditor(c);
  }

  function renderSimulator(c) {
    c.innerHTML = `<div class="animate-in">
      <div class="section-header">
        <div>
          <h2 class="section-title">${icon('scissors', 22)} Editor Quirúrgico & Simulador</h2>
          <p class="section-subtitle">Post-procesado, testing visual y exportación</p>
        </div>
        <div class="flex gap-sm">
          <button class="btn btn-secondary btn-sm">${icon('download', 14)} Exportar PNG</button>
          <button class="btn btn-primary btn-sm">${icon('download', 14)} Exportar Todo</button>
        </div>
      </div>
      <div class="tabs">
        <button class="tab ${activeTab === 'editor' ? 'active' : ''}" id="tab-editor">${icon('palette', 14)} Editor</button>
        <button class="tab ${activeTab === 'simulator' ? 'active' : ''}" id="tab-simulator">${icon('monitor', 14)} Simulador</button>
        <button class="tab ${activeTab === 'stickers' ? 'active' : ''}" id="tab-stickers">${icon('star', 14)} Stickers</button>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header"><div class="card-title">${icon('smartphone', 16)} Vista Mobile</div><span class="badge badge-neutral">375px</span></div>
          <div style="max-width:375px; margin:0 auto; background: var(--bg-primary); border-radius: var(--radius-md); overflow:hidden;">
            ${[1, 2, 3].map(i => `
              <div style="padding: var(--space-sm); display:flex; gap: var(--space-sm); margin-bottom: 2px;">
                <div style="width:168px;min-width:168px;aspect-ratio:16/9;background: ${i === 2 ? 'linear-gradient(135deg, #0d0d2b, #1a1a3e)' : 'var(--bg-tertiary)'};border-radius:8px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
                  ${i === 2 ? `<span style="font-family:var(--font-impact);font-size:11px;color:white;letter-spacing:1px;text-shadow:1px 1px 4px rgba(220,38,38,0.5);">GPT-5 vs GEMINI</span>` : `<span style="color:var(--text-tertiary);">${icon('image', 16)}</span>`}
                </div>
                <div style="flex:1;min-width:0;padding-top:2px;">
                  <div style="font-size:12px;font-weight:600;line-height:1.3;margin-bottom:4px;">${i === 2 ? 'GPT-5 vs Gemini' : 'Video ejemplo ' + i}</div>
                  <div style="font-size:10px;color:var(--text-tertiary);">Canal${i === 2 ? ' · 45K vistas' : ''}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">${icon('monitor', 16)} Vista Desktop</div><span class="badge badge-neutral">1280px</span></div>
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:var(--space-sm);">
            ${[1, 2, 3, 4, 5, 6].map(i => `
              <div>
                <div style="aspect-ratio:16/9;background:${i === 2 ? 'linear-gradient(135deg,#0d0d2b,#1a1a3e)' : 'var(--bg-tertiary)'};border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:6px;position:relative;overflow:hidden;">
                  ${i === 2 ? `<span style="font-family:var(--font-impact);font-size:11px;color:white;letter-spacing:1px;text-shadow:1px 1px 4px rgba(220,38,38,0.5);">GPT-5 vs GEMINI</span>` : `<span style="color:var(--text-tertiary);">${icon('image', 14)}</span>`}
                </div>
                <div style="font-size:11px;font-weight:500;">${i === 2 ? 'GPT-5 vs Gemini' : 'Video ' + i}</div>
                <div style="font-size:10px;color:var(--text-tertiary);">Canal</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>`;
    bindTabs(c);
  }

  function renderStickers(c) {
    const stckrs = [
      { name: 'Flecha', icon: 'arrowUp' },
      { name: 'Target', icon: 'crosshair' },
      { name: 'Estrella', icon: 'star' },
      { name: 'Rayo', icon: 'bolt' },
      { name: 'Shield', icon: 'shield' },
      { name: 'Award', icon: 'award' },
      { name: 'Flag', icon: 'flag' },
      { name: 'Check', icon: 'check' },
      { name: 'X', icon: 'x' },
      { name: 'Lock', icon: 'lock' },
      { name: 'Alert', icon: 'alertTriangle' },
      { name: 'Compass', icon: 'compass' },
    ];
    c.innerHTML = `<div class="animate-in">
      <div class="section-header">
        <div>
          <h2 class="section-title">${icon('scissors', 22)} Editor Quirúrgico & Simulador</h2>
          <p class="section-subtitle">Post-procesado, testing visual y exportación</p>
        </div>
        <div class="flex gap-sm">
          <button class="btn btn-secondary btn-sm">${icon('download', 14)} Exportar PNG</button>
          <button class="btn btn-primary btn-sm">${icon('download', 14)} Exportar Todo</button>
        </div>
      </div>
      <div class="tabs">
        <button class="tab ${activeTab === 'editor' ? 'active' : ''}" id="tab-editor">${icon('palette', 14)} Editor</button>
        <button class="tab ${activeTab === 'simulator' ? 'active' : ''}" id="tab-simulator">${icon('monitor', 14)} Simulador</button>
        <button class="tab ${activeTab === 'stickers' ? 'active' : ''}" id="tab-stickers">${icon('star', 14)} Stickers</button>
      </div>
      <div class="card">
        <div class="card-title mb-md">${icon('star', 16)} Power Stickers</div>
        <p class="text-sm text-muted mb-md">Arrastra stickers profesionales al canvas para potenciar tus miniaturas.</p>
        <div class="grid-4" style="grid-template-columns: repeat(4, 1fr);">
          ${stckrs.map(s => `
            <div class="card" style="padding:var(--space-md);text-align:center;cursor:grab;transition:all var(--transition-fast);" draggable="true">
              <div style="margin-bottom:var(--space-sm);color:var(--text-secondary);">${icon(s.icon, 28)}</div>
              <div class="text-xs text-muted">${s.name}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
    bindTabs(c);
  }

  function bindTabs(c) {
    c.querySelector('#tab-editor')?.addEventListener('click', () => { activeTab = 'editor'; render(); });
    c.querySelector('#tab-simulator')?.addEventListener('click', () => { activeTab = 'simulator'; render(); });
    c.querySelector('#tab-stickers')?.addEventListener('click', () => { activeTab = 'stickers'; render(); });
  }

  function bindEditor(c) {
    const ti = c.querySelector('#text-input');
    const si = c.querySelector('#subtext-input');
    const ct = c.querySelector('#canvas-text');
    const cs = c.querySelector('#canvas-subtext');
    const ts = c.querySelector('#text-size');
    if (ti) ti.addEventListener('input', () => { if (ct) ct.textContent = ti.value.toUpperCase(); });
    if (si) si.addEventListener('input', () => { if (cs) cs.textContent = si.value.toUpperCase(); });
    if (ts) ts.addEventListener('input', () => { if (ct) ct.style.fontSize = ts.value + 'px'; });

    const blurBtn = c.querySelector('#btn-blur');
    const canvas = c.querySelector('#editor-canvas');
    if (blurBtn && canvas) {
      blurBtn.addEventListener('click', () => {
        canvas.style.filter = 'blur(8px)';
        setTimeout(() => { canvas.style.filter = 'none'; }, 500);
      });
    }
  }

  render();
}
