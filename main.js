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
  
  // These will be reassigned in renderApp if the DOM is rebuilt
  let sidebar, topbar, workflowBar, workspace;

  let routerInitialized = false;
  let lastChannelId = null;
  let lastUserId = null;
  let lastSessionId = null;

  function renderApp() {
    const { session, currentUser, activeChannelId, isAuthInitializing } = getState();

    // 0. Handle Initialization (Prevent flicker to login)
    if (isAuthInitializing) {
      if (!app.querySelector('.loading-screen')) {
        app.innerHTML = `
          <div class="loading-screen">
            <div class="loader"></div>
            <p>Cargando ClickAngle...</p>
          </div>
        `;
      }
      return;
    }

    // 1. Recover/Initialize DOM structure if loading screen is present or empty
    if (app.querySelector('.loading-screen') || !app.querySelector('#main-area')) {
      app.innerHTML = `
        <aside id="sidebar"></aside>
        <div id="main-area">
          <header id="topbar"></header>
          <div id="workflow-bar"></div>
          <main id="workspace"></main>
        </div>
      `;
      // Reset router as the workspace container is new
      routerInitialized = false;
    }

    // Re-grab references (important after innerHTML changes)
    sidebar = document.getElementById('sidebar');
    topbar = document.getElementById('topbar');
    workflowBar = document.getElementById('workflow-bar');
    workspace = document.getElementById('workspace');

    // 2. Handle Authentication Screen
    if (!session) {
      app.classList.add('login-mode');
      sidebar.innerHTML = ''; sidebar.style.display = 'none';
      topbar.innerHTML = ''; topbar.style.display = 'none';
      workflowBar.innerHTML = ''; workflowBar.style.display = 'none';
      renderLogin(workspace);
      routerInitialized = false;
      lastUserId = null;
      lastChannelId = null;
      lastSessionId = null;
      return;
    }

    // 2. Setup Authenticated Layout
    app.classList.remove('login-mode');
    sidebar.style.display = '';
    topbar.style.display = '';
    workflowBar.style.display = '';

    // Render Shared Components (once)
    if (!sidebar.innerHTML) renderSidebar(sidebar);
    if (!topbar.innerHTML) {
      renderSearchbar(topbar);
      // Run initial key check once on startup
      checkApiKey().catch(err => console.error('Initial API check failed:', err));
    } else {
        // ALWAYS update the API status badge in the topbar on any state change
        import('./src/components/searchbar.js').then(m => m.updateApiStatusBadge());
    }
    
    if (!workflowBar.innerHTML) renderWorkflow(workflowBar);

    // 3. Selective Re-rendering
    // We only trigger a full Workspace re-render if the user or channel changed
    const userId = currentUser?.id;
    const sessionId = session?.access_token; // Use token as proxy for fresh session

    const significantChange = (userId !== lastUserId) || (activeChannelId !== lastChannelId) || (sessionId !== lastSessionId);

    if (!activeChannelId) {
      renderEmptyState(workspace);
      routerInitialized = false;
    } else {
      if (!routerInitialized) {
        initRouter(workspace);
        routerInitialized = true;
      } else if (significantChange) {
        // Refresh components that change with channel
        renderSidebar(sidebar);
        updateWorkflow(workflowBar);
        // Full re-render of current view
        reRenderCurrentRoute(workspace);
      } else {
        // Minor state change (like API status update)
        // Just update peripheral UI without nuking the workspace
        updateWorkflow(workflowBar);
      }
    }

    // Update last seen state
    lastUserId = userId;
    lastChannelId = activeChannelId;
    lastSessionId = sessionId;
  }

  // Subscribe to state changes
  subscribe(() => {
    try {
      renderApp();
    } catch (err) {
      console.error('CRITICAL APP RENDER ERROR:', err);
      if (workspace) {
        workspace.innerHTML = `<div style="padding:40px;color:red;">Error de aplicación inesperado. Revisa la consola.</div>`;
      }
    }
  });

  // Initial render
  renderApp();

  window.addEventListener('hashchange', () => {
    const { session, activeChannelId } = getState();
    if (session && activeChannelId) {
      updateWorkflow(workflowBar);
    }
  });

  // Initialize auth
  initAuth(() => {
    if (!window.location.hash) window.location.hash = '#dashboard';
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM is already loaded (common in Vite HMR environments)
  initApp();
}
