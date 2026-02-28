import { CLICK_ANGLES, ANGLE_CATEGORIES } from '../data/angles.js';
import { icon } from '../icons.js';

export function renderAngulos(container) {
  let activeFilter = 'ALL';

  function render() {
    const filtered = activeFilter === 'ALL'
      ? CLICK_ANGLES
      : CLICK_ANGLES.filter(a => a.category === activeFilter);

    let html = `<div class="animate-in">
      <div class="section-header">
        <div>
          <h2 class="section-title">${icon('crosshair', 22)} Biblioteca de Ángulos de Click</h2>
          <p class="section-subtitle">${CLICK_ANGLES.length} ángulos psicológicos para maximizar tu CTR</p>
        </div>
        <span class="text-sm text-muted">Mostrando ${filtered.length} de ${CLICK_ANGLES.length}</span>
      </div>

      <div class="flex gap-sm mb-lg" style="flex-wrap: wrap;">
        <button class="btn btn-sm category-filter ${activeFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}" data-cat="ALL">
          Todos (${CLICK_ANGLES.length})
        </button>
        ${Object.entries(ANGLE_CATEGORIES).map(([key, cat]) => {
      const count = CLICK_ANGLES.filter(a => a.category === key).length;
      return `<button class="btn btn-sm category-filter ${activeFilter === key ? 'btn-primary' : 'btn-secondary'}" data-cat="${key}">
              ${cat.label} (${count})
            </button>`;
    }).join('')}
      </div>

      <div class="grid-3">
        ${filtered.map((angle, i) => {
      const cat = ANGLE_CATEGORIES[angle.category];
      return `<div class="angle-card" style="animation-delay: ${i * 0.05}s;">
              <div class="flex items-center justify-between mb-sm">
                <span class="angle-icon" style="color:var(--text-secondary);">${icon('crosshair', 24)}</span>
                <span class="badge badge-neutral">${cat.label}</span>
              </div>
              <div class="angle-name">${angle.name}</div>
              <div class="text-xs text-muted mb-sm" style="font-style:italic;">"${angle.title}"</div>
              <div class="angle-desc mb-md">${angle.description}</div>
              <div class="card" style="padding: var(--space-sm) var(--space-md); background: var(--bg-tertiary); margin-bottom: var(--space-sm);">
                <div class="text-xs font-bold text-muted mb-sm">${icon('brain', 12)} PSICOLOGÍA</div>
                <div style="font-size:11px; color: var(--text-secondary); line-height:1.5;">${angle.psychology}</div>
              </div>
              <div class="card" style="padding: var(--space-sm) var(--space-md); background: var(--accent-subtle); border-color: rgba(220, 38, 38, 0.1);">
                <div class="text-xs font-bold text-accent mb-sm">${icon('bolt', 12)} EJEMPLO</div>
                <div style="font-size:11px; color: var(--accent-light); font-weight:500;">${angle.example}</div>
              </div>
              <div class="flex gap-xs mt-md">
                <button class="btn btn-primary btn-sm" style="flex:1;">${icon('bolt', 14)} Usar Ángulo</button>
                <button class="btn btn-ghost btn-sm">${icon('copy', 14)}</button>
              </div>
            </div>`;
    }).join('')}
      </div>
    </div>`;

    container.innerHTML = html;
    container.querySelectorAll('.category-filter').forEach(btn => {
      btn.addEventListener('click', () => { activeFilter = btn.dataset.cat; render(); });
    });
  }

  render();
}
