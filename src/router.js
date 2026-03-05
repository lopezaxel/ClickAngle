// Simple hash-based SPA router
const routes = {};
let currentWorkspace = null;
let currentHashChangeHandler = null;

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

/**
 * Re-renders the current route without transitions.
 * Useful for state updates (e.g. channel switch, login).
 */
export async function reRenderCurrentRoute(workspace) {
    if (workspace) currentWorkspace = workspace;
    const route = getCurrentRoute();
    const renderFn = routes[route];

    updateNavHighlights(route);

    if (renderFn && currentWorkspace) {
        // Ensure workspace is visible
        currentWorkspace.style.opacity = '1';
        currentWorkspace.style.transform = 'none';

        try {
            // We don't clear innerHTML here to avoid flicker on state updates
            // unless the renderFn explicitly does it.
            await renderFn(currentWorkspace);
        } catch (err) {
            console.error(`Error re-rendering ${route}:`, err);
        }
    }
}

/**
 * Initializes the router and handles hash changes with animations.
 */
export function initRouter(workspace) {
    currentWorkspace = workspace;

    if (currentHashChangeHandler) {
        window.removeEventListener('hashchange', currentHashChangeHandler);
    }

    async function render() {
        const route = getCurrentRoute();
        const renderFn = routes[route];

        updateNavHighlights(route);

        if (renderFn) {
            // 1. Clear current content immediately
            workspace.innerHTML = '';

            // 2. Ensure visible
            workspace.style.opacity = '1';
            workspace.style.transform = 'none';

            try {
                // 3. Render new content
                // Panels should use the .animate-in class for their entrance animation
                await renderFn(workspace);
            } catch (err) {
                console.error(`Error rendering ${route}:`, err);
                workspace.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted);">Error cargando ${route}</div>`;
            }
        }
    }

    currentHashChangeHandler = render;
    window.addEventListener('hashchange', render);
    render();
}
