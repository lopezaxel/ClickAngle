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
import { renderChannelSelector } from './src/panels/channel-selector.js';
import { renderAdmin } from './src/panels/admin.js';
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
registerRoute('channel-selector', renderChannelSelector);
registerRoute('admin', renderAdmin);

// Initialize app
function initApp() {
  const app = document.getElementById('app');
  
  // These will be reassigned in renderApp if the DOM is rebuilt
  let sidebar, topbar, workflowBar, workspace;

  let routerInitialized = false;
  let lastChannelId = null;
  let lastUserId = null;
  let lastSessionId = null;
  let lastLoadingChannels = true;
  let lastChannelCount = -1;

  function renderApp() {
    const { session, currentUser, activeChannelId, isAuthInitializing, isLoadingChannels, channels, subscription } = getState();

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

    // 3. Subscription guard (skip for admins)
    if (currentUser?.role !== 'admin' && currentUser?.id) {
      if (subscription === undefined) {
        // Still loading subscription — show a non-blocking spinner instead of blank screen
        if (workspace && !workspace.querySelector('.subscription-loading')) {
          workspace.innerHTML = `<div class="subscription-loading" style="display:flex;align-items:center;justify-content:center;height:200px;color:rgba(255,255,255,0.3);font-size:13px;gap:10px;"><div class="loader" style="width:20px;height:20px;border-width:2px"></div>Verificando acceso...</div>`;
        }
        return;
      }
      // subscription.status === 'load_error' means the query failed — allow access (fail open)
      if (subscription && subscription.status !== 'load_error' && subscription.status === 'blocked') {
        app.classList.remove('login-mode');
        sidebar.innerHTML = ''; sidebar.style.display = 'none';
        topbar.innerHTML = ''; topbar.style.display = 'none';
        workflowBar.innerHTML = ''; workflowBar.style.display = 'none';
        workspace.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:24px;text-align:center;padding:40px;">
            <div style="font-size:48px;">${icon('lock', 48)}</div>
            <h2 style="font-size:24px;font-weight:800;">Acceso suspendido</h2>
            <p style="color:var(--text-tertiary);max-width:400px;">Tu período de acceso ha vencido o fue suspendido. Contactá al administrador para renovar tu suscripción.</p>
            <a href="mailto:lopezaxelalejandro@gmail.com" class="btn btn-primary">Contactar al administrador</a>
            <button class="btn btn-ghost btn-sm" onclick="document.dispatchEvent(new Event('signout-requested'))">Cerrar sesión</button>
          </div>`;
        document.addEventListener('signout-requested', () => { import('./src/lib/auth.js').then(m => m.signOut()); }, { once: true });
        return;
      }
    }

    // 4. Setup Authenticated Layout
    app.classList.remove('login-mode');
    sidebar.style.display = '';
    topbar.style.display = '';
    workflowBar.style.display = '';

    // 4. Check if we need the Hub (no active channel)
    const currentHash = window.location.hash.slice(1);
    const isOnHub = currentHash === 'channel-selector';

    // Guard: if channels are still being loaded by auth.js, show a spinner
    // and wait for the next state update. This prevents a race condition where
    // the router triggers renderChannelSelector while auth is still fetching.
    if (isLoadingChannels && !isOnHub) {
      if (workspace && !workspace.querySelector('.channels-loading')) {
        workspace.innerHTML = `<div class="channels-loading" style="display:flex;align-items:center;justify-content:center;height:200px;color:rgba(255,255,255,0.3);font-size:13px;gap:10px;"><div class="loader" style="width:20px;height:20px;border-width:2px"></div>Cargando canales...</div>`;
      }
      return;
    }

    if (!activeChannelId && !isOnHub) {
      // No channel selected → redirect to Hub
      window.location.hash = '#channel-selector';
      return; // The hashchange will trigger renderApp again
    }

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

    // 5. Selective Re-rendering
    // Trigger a full re-render on: user change, channel change, session change, or channels loading state change
    const userId = currentUser?.id;
    const sessionId = session?.access_token;
    const channelCount = channels?.length ?? 0;

    const significantChange = (userId !== lastUserId)
      || (activeChannelId !== lastChannelId)
      || (sessionId !== lastSessionId)
      || (isLoadingChannels !== lastLoadingChannels)
      || (channelCount !== lastChannelCount);

    if (!routerInitialized) {
      initRouter(workspace);
      routerInitialized = true;
    } else if (significantChange) {
      renderSidebar(sidebar);
      updateWorkflow(workflowBar);
      reRenderCurrentRoute(workspace);
    } else {
      updateWorkflow(workflowBar);
    }

    // Update last seen state
    lastUserId = userId;
    lastChannelId = activeChannelId;
    lastSessionId = sessionId;
    lastLoadingChannels = isLoadingChannels;
    lastChannelCount = channelCount;
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
    const { session, activeChannelId } = getState();
    if (session) {
      if (!window.location.hash || window.location.hash === '#login') {
        // After login: go to Hub if no channel, else dashboard
        window.location.hash = activeChannelId ? '#dashboard' : '#channel-selector';
      }
    } else {
      // Clear hash if at root and not logged in (to avoid showing #dashboard)
      if (window.location.hash === '#dashboard') {
        window.location.hash = '';
      }
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM is already loaded (common in Vite HMR environments)
  initApp();
}
