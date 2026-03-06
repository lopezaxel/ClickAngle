// Simple hash-based SPA router
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
 * Useful for state updates (e.g. channel switch, login).
 */
export async function reRenderCurrentRoute(workspace) {
    if (workspace) currentWorkspace = workspace;
    if (isRendering) return;

    const route = getCurrentRoute();
    const renderFn = routes[route];

    updateNavHighlights(route);

    if (renderFn && currentWorkspace) {
        isRendering = true;
        try {
            await renderFn(currentWorkspace);
        } catch (err) {
            console.error(`Error re-rendering ${route}:`, err);
            currentWorkspace.innerHTML = `<div style="padding:40px;text-align:center;color:red;font-size:16px;">Error de renderizado: ${err.message}</div>`;
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

        updateNavHighlights(route);

        if (renderFn) {
            isRendering = true;
            // Provide visual feedback instead of black screen
            showLoader(workspace);

            try {
                await renderFn(workspace);
            } catch (err) {
                console.error(`Error rendering ${route}:`, err);
                workspace.innerHTML = `<div style="padding:40px;text-align:center;color:red;font-size:16px;font-weight:bold;">Error crítico: ${err.message}</div>`;
            } finally {
                isRendering = false;
            }
        }
    }

    currentHashChangeHandler = render;
    window.addEventListener('hashchange', render);
    render();
}
