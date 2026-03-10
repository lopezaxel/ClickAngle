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
import { checkApiKey } from './src/lib/intelligence.js';

// Register all panel routes
registerRoute('dashboard', renderDashboard);
registerRoute('cerebro', renderCerebro);
registerRoute('brand', renderBrand);
registerRoute('espionaje', renderEspionaje);
registerRoute('angulos', renderAngulos);
registerRoute('engine', renderEngine);
registerRoute('editor', renderEditor);
registerRoute('settings', renderSettings);

// Initialize app
function initApp() {
  const app = document.getElementById('app');
  const sidebar = document.getElementById('sidebar');
  const topbar = document.getElementById('topbar');
  const workflowBar = document.getElementById('workflow-bar');
  const workspace = document.getElementById('workspace');

  let routerInitialized = false;

  function renderApp() {
    const { session, channels, activeChannelId } = getState();

    if (!session) {
      // Show login
      app.classList.add('login-mode');
      sidebar.innerHTML = ''; sidebar.style.display = 'none';
      topbar.innerHTML = ''; topbar.style.display = 'none';
      workflowBar.innerHTML = ''; workflowBar.style.display = 'none';
      renderLogin(workspace);
      routerInitialized = false;
      return;
    }

    // Authenticated
    app.classList.remove('login-mode');
    sidebar.style.display = '';
    topbar.style.display = '';
    workflowBar.style.display = '';

    // Only re-bind shared components if they are empty
    if (!sidebar.innerHTML) renderSidebar(sidebar);
    if (!topbar.innerHTML) {
      renderSearchbar(topbar);
      checkApiKey().catch(err => console.error('Initial API check failed:', err));
    }
    if (!workflowBar.innerHTML) renderWorkflow(workflowBar);


    if (!channels || channels.length === 0 || !activeChannelId) {
      // No channels — show empty state
      renderEmptyState(workspace);
      routerInitialized = false;
    } else {
      // Normal app — render current route
      if (!routerInitialized) {
        initRouter(workspace);
        routerInitialized = true;
      } else {
        // Just refresh components that might change with channel switch
        renderSidebar(sidebar);
        updateWorkflow(workflowBar);
        // And re-render the view
        reRenderCurrentRoute(workspace);
      }
    }
  }

  // Subscribe to state changes
  subscribe(() => {
    try {
      renderApp();
    } catch (err) {
      console.error('CRITICAL APP RENDER ERROR:', err);
      // Try to recover by showing at least a fallback message
      if (workspace) {
        workspace.innerHTML = `<div style="padding:40px;color:red;">Error de aplicación inesperado. Revisa la consola.</div>`;
      }
    }
  });

  // Initial render to unblock UI immediately
  renderApp();

  // Listen for hash changes to update highlights without full re-render
  window.addEventListener('hashchange', () => {
    const { session, activeChannelId } = getState();
    if (session && activeChannelId) {
      updateWorkflow(workflowBar);
    }
  });

  // Initialize auth
  initAuth(() => {
    // Auth initialized
    if (!window.location.hash) window.location.hash = '#dashboard';
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM is already loaded (common in Vite HMR environments)
  initApp();
}
