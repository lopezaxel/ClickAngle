import { icon } from '../icons.js';
import { getState } from '../lib/state.js';

let searchListenerAdded = false;

export function renderSearchbar(container) {
  if (!container) return;
  
  // Basic structure
  container.innerHTML = `
    <div class="search-container">
      <span class="search-icon">${icon('search', 14)}</span>
      <input type="text" class="search-input" id="global-search" placeholder="Buscar ángulos, proyectos, scripts..." />
      <span class="search-shortcut">⌘K</span>
    </div>
    <div class="topbar-actions" id="topbar-actions">
        <!-- Actions and status rendered here -->
    </div>
  `;

  // Initial update of actions
  updateApiStatusBadge();

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

export function updateApiStatusBadge() {
  const actionsContainer = document.getElementById('topbar-actions');
  if (!actionsContainer) return;

  const { apiKeyStatus } = getState();

  const statusConfig = {
    connected: { color: 'var(--success)', text: 'API Conectada', icon: 'check' },
    disconnected: { color: 'var(--warning)', text: 'API Desconectada', icon: 'alert-triangle' },
    not_connected: { color: 'var(--danger)', text: 'API No Vinculada', icon: 'x' }
  };

  const status = statusConfig[apiKeyStatus] || statusConfig.not_connected;

  actionsContainer.innerHTML = `
      <div class="api-status-badge animate-in" style="display:flex; align-items:center; gap:var(--space-xs); padding: 4px var(--space-sm); border-radius: 20px; background: rgba(0,0,0,0.2); border: 1px solid ${status.color};">
        <span style="width:8px; height:8px; border-radius:50%; background:${status.color}; box-shadow: 0 0 8px ${status.color};"></span>
        <span style="font-size:10px; font-weight:700; color:${status.color}; text-transform:uppercase;">${status.text}</span>
      </div>
      <button class="btn-icon tooltip" data-tooltip="Notificaciones" id="btn-notifications">${icon('bell', 16)}</button>
  `;
}
