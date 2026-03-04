import { navigateTo, getCurrentRoute } from '../router.js';
import { icon } from '../icons.js';
import { getState, setActiveChannel, subscribe } from '../lib/state.js';
import { signOut, createChannel, loadUserChannels } from '../lib/auth.js';
import { setState } from '../lib/state.js';

const NAV_ITEMS = [
  { route: 'dashboard', icon: 'barChart', label: 'Dashboard', section: 'Análisis' },
  { route: 'cerebro', icon: 'brain', label: 'El Cerebro', section: 'Análisis' },
  { route: 'brand', icon: 'palette', label: 'Brand Kit', section: 'Recursos' },
  { route: 'espionaje', icon: 'eye', label: 'Espionaje', section: 'Recursos' },
  { route: 'angulos', icon: 'crosshair', label: 'Ángulos de Click', badge: '22', section: 'Creación' },
  { route: 'engine', icon: 'cog', label: 'Fábrica Creativa', section: 'Creación' },
  { route: 'editor', icon: 'scissors', label: 'Editor & Simulador', section: 'Creación' },
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

    <!-- Channel Selector -->
    <div class="sidebar-section" style="padding: 0 var(--space-md);">
      <div class="channel-selector" id="channel-selector">
        <div class="channel-selector-current" id="channel-selector-toggle">
          <div class="channel-avatar">
            ${activeChannel ? activeChannel.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div class="channel-info">
            <div class="channel-name">${activeChannel ? activeChannel.name : 'Sin canal'}</div>
            <div class="channel-niche">${activeChannel ? activeChannel.niche : 'Seleccionar canal'}</div>
          </div>
          <span class="channel-chevron">${icon('chevronDown', 14)}</span>
        </div>
        <div class="channel-dropdown hidden" id="channel-dropdown">
          ${channels.map(ch => `
            <div class="channel-dropdown-item ${ch.id === activeChannelId ? 'active' : ''}" data-channel-id="${ch.id}">
              <div class="channel-avatar-sm">${ch.name.charAt(0).toUpperCase()}</div>
              <div>
                <div style="font-size:13px;font-weight:600;">${ch.name}</div>
                <div style="font-size:10px;color:var(--text-tertiary);">${ch.niche}</div>
              </div>
              ${ch.id === activeChannelId ? `<span style="margin-left:auto;color:var(--accent);">${icon('check', 14)}</span>` : ''}
            </div>
          `).join('')}
          <div class="channel-dropdown-item channel-add-btn" id="btn-add-channel-dropdown">
            <span style="color:var(--accent);">${icon('plus', 16)}</span>
            <span style="font-size:13px;font-weight:600;color:var(--accent-light);">Agregar Canal</span>
          </div>
        </div>
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

  // Channel selector toggle
  const toggle = document.getElementById('channel-selector-toggle');
  const dropdown = document.getElementById('channel-dropdown');
  if (toggle && dropdown) {
    toggle.addEventListener('click', () => {
      dropdown.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#channel-selector')) {
        dropdown.classList.add('hidden');
      }
    });
  }

  // Channel selection
  container.querySelectorAll('.channel-dropdown-item[data-channel-id]').forEach(item => {
    item.addEventListener('click', () => {
      setActiveChannel(item.dataset.channelId);
      dropdown?.classList.add('hidden');
    });
  });

  // Add channel button
  document.getElementById('btn-add-channel-dropdown')?.addEventListener('click', () => {
    dropdown?.classList.add('hidden');
    showCreateChannelModal();
  });

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await signOut();
  });
}

function showCreateChannelModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  overlay.classList.remove('hidden');
  overlay.innerHTML = `
    <div class="modal animate-in" style="max-width:420px;">
      <div class="card-header">
        <div class="card-title">${icon('plus', 16)} Nuevo Canal</div>
        <button class="btn btn-ghost btn-sm" id="modal-close">${icon('x', 16)}</button>
      </div>
      <form id="modal-create-channel">
        <div class="form-group">
          <label class="form-label">Nombre del Canal</label>
          <input type="text" class="form-input" id="modal-channel-name" placeholder="Ej: Mi Canal Tech" required />
        </div>
        <div class="form-group">
          <label class="form-label">Handle de YouTube (opcional)</label>
          <input type="text" class="form-input" id="modal-channel-handle" placeholder="@micanal" />
        </div>
        <div class="form-group">
          <label class="form-label">Nicho</label>
          <select class="form-select" id="modal-channel-niche">
            <option value="Tech/IA" selected>Tech/IA</option>
            <option value="Gaming">Gaming</option>
            <option value="Educación">Educación</option>
            <option value="Entretenimiento">Entretenimiento</option>
            <option value="Lifestyle">Lifestyle</option>
            <option value="Negocios">Negocios</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;" id="modal-btn-create">
          ${icon('rocket', 16)} Crear Canal
        </button>
      </form>
    </div>
  `;

  document.getElementById('modal-close')?.addEventListener('click', () => {
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.add('hidden');
      overlay.innerHTML = '';
    }
  });

  document.getElementById('modal-create-channel')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('modal-channel-name').value;
    const handle = document.getElementById('modal-channel-handle').value;
    const niche = document.getElementById('modal-channel-niche').value;
    const btn = document.getElementById('modal-btn-create');

    btn.disabled = true;
    btn.innerHTML = `<span class="animate-pulse">${icon('clock', 16)}</span> Creando...`;

    try {
      await createChannel(name, handle, niche);
      overlay.classList.add('hidden');
      overlay.innerHTML = '';
    } catch (err) {
      alert('Error: ' + err.message);
      btn.disabled = false;
      btn.innerHTML = `${icon('rocket', 16)} Crear Canal`;
    }
  });
}
