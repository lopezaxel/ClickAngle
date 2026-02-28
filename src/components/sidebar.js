import { navigateTo, getCurrentRoute } from '../router.js';
import { icon } from '../icons.js';

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
        <div>
          <div style="font-size:13px;font-weight:600;">Creator Pro</div>
          <div style="font-size:11px;color:var(--text-tertiary);">Plan Premium</div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  container.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(item.dataset.route);
    });
  });
}
