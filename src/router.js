// Simple hash-based SPA router
import { icon } from './icons.js';
const routes = {};
let currentWorkspace = null;
let currentHashChangeHandler = null;
let lastRenderId = 0;

export function registerRoute(hash, renderFn) {
    routes[hash] = renderFn;
}

export function navigateTo(hash) {
    window.location.hash = hash;
}

export function getCurrentRoute() {
    return window.location.hash.slice(1) || 'dashboard';
}

function updateNavHighlights(route) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.route === route);
    });
}

function showLoader(workspace) {
    workspace.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100px;margin-top:100px;flex-direction:column;gap:16px;color:rgba(255,255,255,0.3);">
            <div class="animate-pulse" style="width:30px;height:30px;border-radius:50%;border:2px solid currentColor;border-top-color:transparent;animation: spin 1s linear infinite;"></div>
            <div style="font-size:11px;letter-spacing:2px;font-weight:700;opacity:0.5;">DECODIFICANDO ADN...</div>
        </div>
        <style>
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        </style>
    `;
}

/**
 * Main render function used by both init and hashchange
 */
async function performRender(workspace, showRouteLoader = true) {
    const renderId = ++lastRenderId;
    const route = getCurrentRoute();
    const renderFn = routes[route];

    if (!renderFn || !workspace) return;

    updateNavHighlights(route);
    if (showRouteLoader) showLoader(workspace);

    try {
        // Safety timeout: 20s
        const renderPromise = renderFn(workspace);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Panel Render Timeout (20s)')), 20000)
        );

        await Promise.race([renderPromise, timeoutPromise]);
        
        // If this isn't the latest render anymore, don't do anything else
        if (renderId !== lastRenderId) return;

    } catch (err) {
        // Only show error if this is still the current render
        if (renderId === lastRenderId) {
            console.error(`Error rendering ${route}:`, err);
            workspace.innerHTML = `
                <div style="padding:40px;text-align:center;background:rgba(220,38,38,0.05);border-radius:12px;margin:20px;border:1px solid var(--danger);">
                    <div style="font-size:32px;margin-bottom:12px;">${icon('alertTriangle', 32)}</div>
                    <h3 style="color:var(--danger);">Error en la Sección</h3>
                    <p style="font-size:13px;opacity:0.7;">Hubo un problema al cargar "${route}".</p>
                    <p style="font-size:10px;margin-top:10px;font-family:monospace;opacity:0.5;">${err.message}</p>
                    <button onclick="window.location.reload()" class="btn btn-primary btn-sm" style="margin-top:20px;">Refrescar App</button>
                </div>`;
        }
    }
}

/**
 * Re-renders the current route (e.g. when state changes like active channel)
 */
export async function reRenderCurrentRoute(workspace) {
    if (workspace) currentWorkspace = workspace;
    // We don't show the full route loader here to avoid "blinking" if possible,
    // but the panel might show its own.
    await performRender(currentWorkspace, false);
}

/**
 * Initializes the router and handles hash changes.
 */
export function initRouter(workspace) {
    currentWorkspace = workspace;

    if (currentHashChangeHandler) {
        window.removeEventListener('hashchange', currentHashChangeHandler);
    }

    currentHashChangeHandler = () => performRender(workspace, true);
    window.addEventListener('hashchange', currentHashChangeHandler);
    
    // Initial render
    performRender(workspace, true);
}
