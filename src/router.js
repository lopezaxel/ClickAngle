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
        <div style="display:flex;align-items:center;justify-content:center;min-height:220px;margin-top:80px;flex-direction:column;gap:16px;color:rgba(255,255,255,0.3);">
            <div style="width:30px;height:30px;border-radius:50%;border:2px solid rgba(255,255,255,0.25);border-top-color:rgba(255,255,255,0.7);animation:spin 1s linear infinite;"></div>
            <div style="font-size:11px;letter-spacing:2px;font-weight:700;opacity:0.5;">DECODIFICANDO ADN...</div>

            <div style="
                display:flex;flex-direction:column;align-items:center;gap:8px;
                margin-top:18px;padding:18px 28px;border-radius:14px;
                background:rgba(99,179,237,0.07);border:1px solid rgba(99,179,237,0.18);
                opacity:0;animation:syncFadeIn 0.6s ease 4s forwards;
            ">
                <div style="display:flex;align-items:center;gap:8px;color:rgba(147,210,255,0.85);font-size:13px;font-weight:600;letter-spacing:0.3px;">
                    <span style="display:inline-block;animation:pulse 1.6s ease-in-out infinite;">⟳</span>
                    Sincronizando tus datos...
                </div>
                <div style="font-size:11.5px;color:rgba(255,255,255,0.4);text-align:center;line-height:1.6;max-width:260px;">
                    Por favor esperá unos segundos.<br>
                    <span style="color:rgba(147,210,255,0.55);">No actualices la página.</span>
                </div>
            </div>
        </div>
        <style>
            @keyframes spin      { from { transform:rotate(0deg); }  to { transform:rotate(360deg); } }
            @keyframes syncFadeIn{ from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
            @keyframes pulse     { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
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
        // Safety timeout: 45s — covers the Supabase client lock period (~30-35s
        // on cold load). The sync message in showLoader informs the user to wait.
        const renderPromise = renderFn(workspace);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Panel Render Timeout (45s)')), 45000)
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
