// Simple hash-based SPA router
import { icon } from './icons.js';
const routes = {};
let currentWorkspace = null;
let currentHashChangeHandler = null;
let isRendering = false;

export function registerRoute(hash, renderFn) {
    routes[hash] = renderFn;
}

export function navigateTo(hash) {
    window.location.hash = hash;
}

export function getCurrentRoute() {
    // Return from hash or default
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
 * Re-renders the current route without transitions.
 */
export async function reRenderCurrentRoute(workspace) {
    if (workspace) currentWorkspace = workspace;
    
    // If we are already rendering, don't pile up more renders.
    // The current render will use the latest state anyway.
    if (isRendering) return;

    const route = getCurrentRoute();
    const renderFn = routes[route];

    if (renderFn && currentWorkspace) {
        isRendering = true;
        updateNavHighlights(route);
        
        try {
            // Safety timeout for panels: 15s
            const renderPromise = renderFn(currentWorkspace);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Panel Render Timeout (15s)')), 15000)
            );

            await Promise.race([renderPromise, timeoutPromise]);
        } catch (err) {
            console.error(`Error re-rendering ${route}:`, err);
            if (currentWorkspace) {
                currentWorkspace.innerHTML = `
                    <div style="padding:40px;text-align:center;background:rgba(220,38,38,0.05);border-radius:12px;margin:20px;border:1px solid var(--danger);">
                        <div style="font-size:32px;margin-bottom:12px;">${icon('alertTriangle', 32)}</div>
                        <h3 style="color:var(--danger);">Error en el Panel</h3>
                        <p style="font-size:13px;opacity:0.7;">Hubo un problema al cargar esta sección. Refresca la página o intenta de nuevo.</p>
                        <p style="font-size:10px;margin-top:10px;font-family:monospace;opacity:0.5;">${err.message}</p>
                    </div>`;
            }
        } finally {
            isRendering = false;
        }
    }
}

/**
 * Initializes the router and handles hash changes.
 */
export function initRouter(workspace) {
    currentWorkspace = workspace;

    if (currentHashChangeHandler) {
        window.removeEventListener('hashchange', currentHashChangeHandler);
    }

    async function render() {
        if (isRendering) return;

        const route = getCurrentRoute();
        const renderFn = routes[route];

        if (renderFn) {
            isRendering = true;
            updateNavHighlights(route);
            showLoader(workspace);

            try {
                // Safety timeout for new route: 15s
                const renderPromise = renderFn(workspace);
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Router Render Timeout (15s)')), 15000)
                );

                await Promise.race([renderPromise, timeoutPromise]);
            } catch (err) {
                console.error(`Error rendering ${route}:`, err);
                workspace.innerHTML = `
                    <div style="padding:40px;text-align:center;background:rgba(220,38,38,0.05);border-radius:12px;margin:20px;border:1px solid var(--danger);">
                        <div style="font-size:32px;margin-bottom:12px;">${icon('alertTriangle', 32)}</div>
                        <h3 style="color:var(--danger);">Error Crítico de Navegación</h3>
                        <p style="font-size:13px;opacity:0.7;">No se pudo cargar la vista "${route}".</p>
                        <p style="font-size:10px;margin-top:10px;font-family:monospace;opacity:0.5;">${err.message}</p>
                        <button onclick="window.location.reload()" class="btn btn-primary btn-sm" style="margin-top:20px;">Refrescar App</button>
                    </div>`;
            } finally {
                isRendering = false;
            }
        }
    }

    currentHashChangeHandler = render;
    window.addEventListener('hashchange', render);
    render();
}
