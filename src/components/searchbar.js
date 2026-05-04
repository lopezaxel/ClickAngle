import { icon } from '../icons.js';
import { getState } from '../lib/state.js';

let searchListenerAdded = false;

export function renderSearchbar(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="topbar-actions" id="topbar-actions"></div>
  `;
  updateApiStatusBadge();
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
