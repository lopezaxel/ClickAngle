import './style.css';
import { registerRoute, initRouter, reRenderCurrentRoute } from './src/router.js';
import { renderSidebar } from './src/components/sidebar.js';
import { renderSearchbar } from './src/components/searchbar.js';
import { renderWorkflow, updateWorkflow } from './src/components/workflow.js';
import { renderDashboard } from './src/panels/dashboard.js';
import { renderCerebro } from './src/panels/cerebro.js';
import { renderBrand } from './src/panels/brand.js';
import { renderEspionaje } from './src/panels/espionaje.js';
import { renderAngulos } from './src/panels/angulos.js';
import { renderEngine } from './src/panels/engine.js';
import { renderEditor } from './src/panels/editor.js';
import { renderLogin } from './src/panels/login.js';
import { renderSettings } from './src/panels/settings.js';
import { renderEmptyState } from './src/panels/emptyState.js';
import { initAuth } from './src/lib/auth.js';
import { getState, subscribe } from './src/lib/state.js';
import { icon } from './src/icons.js';

// Register all panel routes
registerRoute('dashboard', renderDashboard);
registerRoute('cerebro', renderCerebro);
registerRoute('brand', renderBrand);
registerRoute('espionaje', renderEspionaje);
registerRoute('angulos', renderAngulos);
registerRoute('engine', renderEngine);
registerRoute('editor', renderEditor);

// Settings
registerRoute('settings', renderSettings);

// Initialize app
function initApp() {
  const app = document.getElementById('app');
  const sidebar = document.getElementById('sidebar');
  const topbar = document.getElementById('topbar');
  const workflowBar = document.getElementById('workflow-bar');
  const workspace = document.getElementById('workspace');

  let initialized = false;
  let hadChannels = false;

  function renderApp() {
    const { session, channels, activeChannelId } = getState();

    if (!session) {
      // Show login
      app.classList.add('login-mode');
      sidebar.style.display = 'none';
      topbar.style.display = 'none';
      workflowBar.style.display = 'none';
      renderLogin(workspace);
      initialized = false;
      hadChannels = false;
      return;
    }

    // Authenticated
    app.classList.remove('login-mode');
    sidebar.style.display = '';
    topbar.style.display = '';
    workflowBar.style.display = '';

    renderSidebar(sidebar);
    renderSearchbar(topbar);
    renderWorkflow(workflowBar);

    if (!channels || channels.length === 0 || !activeChannelId) {
      // No channels — show empty state
      renderEmptyState(workspace);
      hadChannels = false;
    } else {
      // Normal app — render current route
      if (!initialized || !hadChannels) {
        // First time or just got channels after empty state
        initRouter(workspace);
        initialized = true;
        hadChannels = true;
      } else {
        reRenderCurrentRoute(workspace);
      }
    }
  }

  // Subscribe to state changes
  subscribe(() => {
    renderApp();
  });

  // Listen for hash changes to update sidebar/workflow
  window.addEventListener('hashchange', () => {
    const { session, activeChannelId } = getState();
    if (session && activeChannelId) {
      renderSidebar(sidebar);
      updateWorkflow(workflowBar);
    }
  });

  // Initialize auth — this will trigger first renderApp via state change
  initAuth(() => {
    // First auth check done
  });

  // Set default route
  if (!window.location.hash) window.location.hash = '#dashboard';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM is already loaded (common in Vite HMR environments)
  initApp();
}
