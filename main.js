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
import { renderSetup } from './src/panels/setup.js';
import { initAuth } from './src/lib/auth.js';
import { getState, subscribe } from './src/lib/state.js';
import { loadChannelProjects } from './src/lib/projects.js';
import { icon } from './src/icons.js';
import { checkApiKey } from './src/lib/intelligence.js';
import { showLoader, hideLoader } from './src/lib/loader.js';

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
  let hasNavigatedToHub = false;

  function renderApp() {
    const { session, currentUser, activeChannelId, isAuthInitializing, isLoadingChannels, channels, subscription } = getState();

    // 1. Recover/Initialize DOM structure if needed
    if (!app.querySelector('#main-area')) {
      hideLoader(false);
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
      hasNavigatedToHub = false;
      return;
    }

    // 3. Subscription guard (skip for admins)
    if (currentUser?.role !== 'admin' && currentUser?.id) {
      if (subscription === undefined) {
        if (workspace && !document.getElementById('ca-global-loader')) {
          showLoader(workspace, { title: 'Verificando acceso...', subtitle: 'Comprobando estado de tu suscripción', detail: 'VERIFICANDO' });
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

    // 4. Onboarding: usuarios invitados que aún no completaron su perfil
    if (currentUser && !currentUser.full_name && currentUser.role !== 'admin') {
      app.classList.add('login-mode');
      sidebar.innerHTML = ''; sidebar.style.display = 'none';
      topbar.innerHTML = ''; topbar.style.display = 'none';
      workflowBar.innerHTML = ''; workflowBar.style.display = 'none';
      if (!workspace.querySelector('#setup-form')) renderSetup(workspace);
      return;
    }

    // 5. Setup Authenticated Layout
    app.classList.remove('login-mode');
    sidebar.style.display = '';
    topbar.style.display = '';
    workflowBar.style.display = '';

    // Render shared components immediately — sidebar must never be missing when session exists.
    // This runs before any early-return guards so the layout is always complete.
    if (!sidebar.innerHTML) renderSidebar(sidebar);
    if (!topbar.innerHTML) {
      renderSearchbar(topbar);
      checkApiKey().catch(err => console.error('Initial API check failed:', err));
    } else {
      import('./src/components/searchbar.js').then(m => m.updateApiStatusBadge());
    }
    if (!workflowBar.innerHTML) renderWorkflow(workflowBar);

    // Determine current route (let — may be updated below by replaceState)
    let currentHash = window.location.hash.slice(1);
    let isOnHub = currentHash === 'channel-selector';

    // While channels load, show a workspace spinner (sidebar is already visible above)
    if (isLoadingChannels && !isOnHub) {
      if (workspace && !document.getElementById('ca-global-loader')) {
        showLoader(workspace, { title: 'Cargando tus proyectos...', subtitle: 'Sincronizando canales con el servidor', detail: 'SINCRONIZANDO' });
      }
      return;
    }

    // Navigate to hub once per session after channels load.
    // Uses replaceState (no hashchange event) so we can continue rendering in the same pass.
    if (!hasNavigatedToHub && !isLoadingChannels) {
      hasNavigatedToHub = true;
      if (!isOnHub) {
        history.replaceState(null, '', '#channel-selector');
        currentHash = 'channel-selector';
        isOnHub = true;
      }
    }

    if (!activeChannelId && !isOnHub) {
      window.location.hash = '#channel-selector';
      return;
    }

    // 5. Selective Re-rendering
    const userId = currentUser?.id;
    const sessionId = session?.access_token;
    const channelCount = channels?.length ?? 0;

    const significantChange = (userId !== lastUserId)
      || (activeChannelId !== lastChannelId)
      || (sessionId !== lastSessionId)
      || (isLoadingChannels !== lastLoadingChannels)
      || (channelCount !== lastChannelCount);

    const channelChanged = activeChannelId && activeChannelId !== lastChannelId;

    if (!routerInitialized) {
      hideLoader(false);
      if (significantChange) renderSidebar(sidebar); // refresh sidebar with real data
      initRouter(workspace);
      routerInitialized = true;
    } else if (significantChange) {
      hideLoader(false);
      renderSidebar(sidebar);
      updateWorkflow(workflowBar);
      reRenderCurrentRoute(workspace);
    } else {
      updateWorkflow(workflowBar);
    }

    lastUserId = userId;
    lastChannelId = activeChannelId;
    lastSessionId = sessionId;
    lastLoadingChannels = isLoadingChannels;
    lastChannelCount = channelCount;

    if (channelChanged) {
      loadChannelProjects(activeChannelId);
    }
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
    const { session } = getState();
    if (!session) {
      // Sin sesión: limpiar cualquier hash de panel protegido
      const hash = window.location.hash;
      if (hash && hash !== '#login') {
        window.location.hash = '';
      }
    }
    // Authenticated redirect to hub is handled in renderApp after channels load
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM is already loaded (common in Vite HMR environments)
  initApp();
}
