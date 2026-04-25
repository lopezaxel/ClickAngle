import { navigateTo, getCurrentRoute } from '../router.js';
import { icon } from '../icons.js';
import { getState } from '../lib/state.js';
import { signOut } from '../lib/auth.js';

const NAV_ITEMS = [
  { route: 'dashboard', icon: 'barChart',  label: 'Dashboard', section: 'Principal' },
  { route: 'cerebro',   icon: 'brain',     label: 'Cerebro',    section: 'Workflow'  },
  { route: 'espionaje', icon: 'eye',       label: 'Espionaje',  section: 'Workflow'  },
  { route: 'engine',    icon: 'cog',       label: 'Fábrica',    section: 'Workflow'  },
  { route: 'editor',    icon: 'scissors',  label: 'Editor',     section: 'Workflow'  },
];

function getSidebarState() {
  return localStorage.getItem('sidebar_state') || 'narrow';
}

function setSidebarState(state) {
  localStorage.setItem('sidebar_state', state);
}

function applySidebarState(sidebarEl, state) {
  sidebarEl.classList.remove('sidebar-expanded', 'sidebar-hidden');
  if (state === 'expanded') sidebarEl.classList.add('sidebar-expanded');
  if (state === 'hidden')   sidebarEl.classList.add('sidebar-hidden');

  const reveal = document.getElementById('sidebar-reveal');
  if (reveal) reveal.style.display = state === 'hidden' ? 'flex' : 'none';
}

function ensureRevealButton(container) {
  let reveal = document.getElementById('sidebar-reveal');
  if (reveal) return reveal;

  reveal = document.createElement('button');
  reveal.id = 'sidebar-reveal';
  reveal.className = 'sidebar-reveal';
  reveal.title = 'Mostrar sidebar';
  reveal.innerHTML = icon('menu', 16);
  reveal.style.display = 'none';
  document.getElementById('app')?.appendChild(reveal);

  reveal.addEventListener('click', () => {
    setSidebarState('narrow');
    applySidebarState(container, 'narrow');
  });

  return reveal;
}

export function renderSidebar(container) {
  const current = getCurrentRoute();
  const { currentUser, channels, activeChannelId } = getState();
  const isAdmin = currentUser?.role === 'admin';
  const activeChannel = channels.find(c => c.id === activeChannelId);

  const makeNavItem = (item) => `
    <a class="nav-item ${current === item.route ? 'active' : ''}" data-route="${item.route}" href="#${item.route}">
      <span class="nav-icon">${icon(item.icon, 20)}</span>
      <span class="nav-label">${item.label}</span>
    </a>`;

  const principalItems = NAV_ITEMS.filter(i => i.section === 'Principal').map(makeNavItem).join('');
  const workflowItems  = NAV_ITEMS.filter(i => i.section === 'Workflow').map(makeNavItem).join('');

  container.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-logo-icon">${icon('crosshair', 18)}</div>
      <div class="sidebar-logo-text">
        <span class="sidebar-logo-name">ClickAngles</span>
        <span class="version-badge">v1.0</span>
      </div>
      <button class="sidebar-toggle-btn" id="sidebar-toggle" title="Contraer / expandir sidebar">
        ${icon('menu', 18)}
      </button>
    </div>

    <div class="sidebar-channel-display" id="sidebar-go-hub" title="${activeChannel?.name || 'Hub'}">
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
      <span class="sidebar-hub-icon">${icon('grid', 14)}</span>
    </div>

    <nav class="sidebar-nav">
      <div class="sidebar-section-label">Principal</div>
      ${principalItems}
      <div class="sidebar-divider"></div>
      <div class="sidebar-section-label">Workflow</div>
      ${workflowItems}
    </nav>

    <div class="sidebar-bottom">
      ${isAdmin ? `
        <a class="nav-item ${current === 'admin' ? 'active' : ''}" href="#admin" data-route="admin" style="color:#f59e0b;">
          <span class="nav-icon">${icon('barChart', 20)}</span>
          <span class="nav-label">Admin</span>
        </a>` : ''}
      <a class="nav-item ${current === 'settings' ? 'active' : ''}" href="#settings" data-route="settings">
        <span class="nav-icon">${icon('sliders', 20)}</span>
        <span class="nav-label">Config.</span>
      </a>
      <div class="sidebar-user">
        <div class="user-avatar">${(currentUser?.full_name || currentUser?.email || 'U').charAt(0).toUpperCase()}</div>
        <div class="user-info">
          <div class="user-name">${currentUser?.full_name || currentUser?.email || 'Usuario'}</div>
          <div class="user-tier">${currentUser?.subscription_tier || 'Free'}</div>
        </div>
        <button class="btn btn-ghost btn-sm" id="btn-logout" title="Cerrar sesión">${icon('logOut', 15)}</button>
      </div>
    </div>
  `;

  // Apply saved state
  const state = getSidebarState();
  applySidebarState(container, state);
  const reveal = ensureRevealButton(container);
  reveal.style.display = state === 'hidden' ? 'flex' : 'none';

  // Toggle button — cycles: narrow → expanded → hidden → narrow
  container.querySelector('#sidebar-toggle')?.addEventListener('click', () => {
    const cur = getSidebarState();
    const next = cur === 'narrow' ? 'expanded' : cur === 'expanded' ? 'hidden' : 'narrow';
    setSidebarState(next);
    applySidebarState(container, next);
  });

  // Nav item clicks
  container.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(item.dataset.route);
    });
  });

  // Go to Hub
  container.querySelector('#sidebar-go-hub')?.addEventListener('click', () => {
    localStorage.removeItem('clickangles_active_channel');
    navigateTo('channel-selector');
  });

  // Logout
  container.addEventListener('click', (e) => {
    if (!e.target.closest('#btn-logout')) return;
    const btn = e.target.closest('#btn-logout');
    btn.disabled = true;
    btn.innerHTML = `<span class="animate-pulse">${icon('clock', 14)}</span>`;
    signOut();
  });
}