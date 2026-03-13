import { navigateTo, getCurrentRoute } from '../router.js';
import { icon } from '../icons.js';
import { getState, setState } from '../lib/state.js';
import { signOut } from '../lib/auth.js';

const NAV_ITEMS = [
  { route: 'dashboard', icon: 'barChart', label: 'Dashboard', section: 'Principal' },
  { route: 'brand', icon: 'palette', label: 'Brand Kit', section: 'Workflow' },
  { route: 'cerebro', icon: 'brain', label: 'El Cerebro', section: 'Workflow' },
  { route: 'espionaje', icon: 'eye', label: 'Espionaje', section: 'Workflow' },
  { route: 'engine', icon: 'cog', label: 'Fábrica Creativa', section: 'Workflow' },
  { route: 'editor', icon: 'scissors', label: 'Editor & Simulador', section: 'Workflow' },
];

export function renderSidebar(container) {
  const current = getCurrentRoute();
  const { currentUser, channels, activeChannelId } = getState();
  const activeChannel = channels.find(c => c.id === activeChannelId);

  const sections = {};
  NAV_ITEMS.forEach(item => {
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  });

  let html = `
    <div class="sidebar-logo">
      <div class="logo-icon" style="color:white;">${icon('crosshair', 18)}</div>
      <div>
        <h1>ClickAngles</h1>
        <span class="version-badge">v2.0</span>
      </div>
    </div>

    <!-- Active Channel Display (read-only) -->
    <div class="sidebar-section" style="padding: 0 var(--space-md);">
      <div class="sidebar-channel-display" id="sidebar-go-hub">
        <div class="channel-avatar">
          ${activeChannel?.image_url 
            ? `<img src="${activeChannel.image_url}" alt="${activeChannel.name}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" />`
            : (activeChannel ? (activeChannel.name || 'C').charAt(0).toUpperCase() : '?')
          }
        </div>
        <div class="channel-info">
          <div class="channel-name">${activeChannel ? activeChannel.name : 'Sin canal'}</div>
          <div class="channel-niche">${activeChannel ? activeChannel.niche : 'Ir al Hub'}</div>
        </div>
        <span class="sidebar-hub-icon" title="Cambiar proyecto">${icon('grid', 14)}</span>
      </div>
    </div>
  `;

  Object.entries(sections).forEach(([sectionName, items]) => {
    html += `<div class="sidebar-section">
        <div class="sidebar-section-label">${sectionName}</div>
        ${items.map(item => `
          <a class="nav-item ${current === item.route ? 'active' : ''}" data-route="${item.route}" href="#${item.route}">
            <span class="nav-icon">${icon(item.icon, 18)}</span>
            <span>${item.label}</span>
            ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
          </a>
        `).join('')}
      </div>`;
  });

  html += `
    <div class="sidebar-section" style="margin-top:auto; border-top:1px solid var(--border); padding-top:var(--space-md);">
      <a class="nav-item" href="#settings" data-route="settings">
        <span class="nav-icon">${icon('sliders', 18)}</span>
        <span>Configuración</span>
      </a>
      <div style="padding: var(--space-md); display:flex; align-items:center; gap:var(--space-sm);">
        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg, var(--accent), var(--accent-dark));display:flex;align-items:center;justify-content:center;color:white;">${icon('user', 16)}</div>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:600;">${currentUser?.full_name || currentUser?.email || 'Usuario'}</div>
          <div style="font-size:11px;color:var(--text-tertiary);">${currentUser?.subscription_tier || 'Free'}</div>
        </div>
        <button class="btn btn-ghost btn-sm" id="btn-logout" title="Cerrar sesión" style="padding:4px;">${icon('logOut', 16)}</button>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Bind nav clicks
  container.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(item.dataset.route);
    });
  });

  // Go to Hub (channel selector)
  document.getElementById('sidebar-go-hub')?.addEventListener('click', () => {
    localStorage.removeItem('clickangles_active_channel');
    navigateTo('channel-selector');
  });

  // Logout — use delegation on container to avoid document.getElementById issues
  container.addEventListener('click', async (e) => {
    if (!e.target.closest('#btn-logout')) return;
    
    const btn = e.target.closest('#btn-logout');
    btn.disabled = true;
    btn.innerHTML = `<span class="animate-pulse">${icon('clock', 14)}</span>`;

    // signOut() handles everything: clears local state, sb-* tokens, and fires server signout
    signOut();
  });
}
