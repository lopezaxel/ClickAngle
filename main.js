import './style.css';
import { registerRoute, initRouter } from './src/router.js';
import { renderSidebar } from './src/components/sidebar.js';
import { renderSearchbar } from './src/components/searchbar.js';
import { renderDashboard } from './src/panels/dashboard.js';
import { renderCerebro } from './src/panels/cerebro.js';
import { renderBrand } from './src/panels/brand.js';
import { renderEspionaje } from './src/panels/espionaje.js';
import { renderAngulos } from './src/panels/angulos.js';
import { renderEngine } from './src/panels/engine.js';
import { renderEditor } from './src/panels/editor.js';
import { icon } from './src/icons.js';

// Register all panel routes
registerRoute('dashboard', renderDashboard);
registerRoute('cerebro', renderCerebro);
registerRoute('brand', renderBrand);
registerRoute('espionaje', renderEspionaje);
registerRoute('angulos', renderAngulos);
registerRoute('engine', renderEngine);
registerRoute('editor', renderEditor);

// Settings (placeholder)
registerRoute('settings', (ws) => {
  ws.innerHTML = `<div class="animate-in">
    <div class="section-header">
      <div><h2 class="section-title">${icon('cog', 22)} Configuración</h2>
      <p class="section-subtitle">API keys y preferencias del sistema</p></div></div>
    <div class="grid-2">
      <div class="card">
        <div class="card-title mb-md">${icon('key', 16)} API Keys</div>
        <div class="form-group"><label class="form-label">Google AI Studio Key</label>
        <input type="password" class="form-input" placeholder="AIza..." value="••••••••••••••••" /></div>
        <div class="form-group"><label class="form-label">Fal.AI Key (opcional)</label>
        <input type="password" class="form-input" placeholder="fal-..." /></div>
        <button class="btn btn-primary btn-sm mt-md">${icon('save', 14)} Guardar Keys</button>
      </div>
      <div class="card">
        <div class="card-title mb-md">${icon('sliders', 16)} Preferencias</div>
        <div class="form-group"><label class="form-label">Tema</label>
        <select class="form-select"><option selected>Dark Mode</option><option>Ultra Dark</option></select></div>
        <div class="form-group"><label class="form-label">Idioma</label>
        <select class="form-select"><option selected>Español</option><option>English</option></select></div>
      </div>
    </div>
  </div>`;
});

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const topbar = document.getElementById('topbar');
  const workspace = document.getElementById('workspace');

  renderSidebar(sidebar);
  renderSearchbar(topbar);
  initRouter(workspace);

  // Re-render sidebar on route change to update active state
  window.addEventListener('hashchange', () => renderSidebar(sidebar));

  // Set default route
  if (!window.location.hash) window.location.hash = '#dashboard';
});
