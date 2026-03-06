import { icon } from '../icons.js';

let searchListenerAdded = false;

export function renderSearchbar(container) {
  container.innerHTML = `
    <div class="search-container">
      <span class="search-icon">${icon('search', 14)}</span>
      <input type="text" class="search-input" id="global-search" placeholder="Buscar ángulos, proyectos, scripts..." />
      <span class="search-shortcut">⌘K</span>
    </div>
    <div class="topbar-actions">
      <button class="btn-icon tooltip" data-tooltip="Notificaciones" id="btn-notifications">${icon('bell', 16)}</button>
      <button class="btn-icon tooltip" data-tooltip="Generación rápida" id="btn-quick-gen">${icon('bolt', 16)}</button>
      <button class="btn btn-primary btn-sm" id="btn-new-project">
        ${icon('plus', 14)} Nuevo Proyecto
      </button>
    </div>
  `;

  if (!searchListenerAdded) {
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    });
    searchListenerAdded = true;
  }
}
