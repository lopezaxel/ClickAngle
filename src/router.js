// Simple hash-based SPA router
const routes = {};
let currentWorkspace = null;
let renderCounter = 0;

export function registerRoute(hash, renderFn) {
    routes[hash] = renderFn;
}

export function navigateTo(hash) {
    window.location.hash = hash;
}

export function getCurrentRoute() {
    return window.location.hash.slice(1) || 'dashboard';
}

export async function reRenderCurrentRoute(workspace) {
    if (workspace) currentWorkspace = workspace;
    const route = getCurrentRoute();
    const renderFn = routes[route];

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.route === route);
    });

    if (renderFn && currentWorkspace) {
        const myRender = ++renderCounter;
        currentWorkspace.innerHTML = '';
        try {
            await renderFn(currentWorkspace);
        } catch (err) {
            console.error(`Error rendering ${route}:`, err);
            if (renderCounter === myRender) {
                currentWorkspace.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted);">Error cargando ${route}</div>`;
            }
        }
    }
}

export function initRouter(workspace) {
    currentWorkspace = workspace;

    async function render() {
        const route = getCurrentRoute();
        const renderFn = routes[route];

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.route === route);
        });

        if (renderFn) {
            const myRender = ++renderCounter;
            workspace.style.opacity = '0';
            workspace.style.transform = 'translateY(8px)';
            await new Promise(r => setTimeout(r, 150));
            if (renderCounter !== myRender) return; // another render started
            workspace.innerHTML = '';
            try {
                await renderFn(workspace);
            } catch (err) {
                console.error(`Error rendering ${route}:`, err);
                if (renderCounter === myRender) {
                    workspace.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted);">Error cargando ${route}</div>`;
                }
            }
            if (renderCounter === myRender) {
                workspace.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                workspace.style.opacity = '1';
                workspace.style.transform = 'translateY(0)';
            }
        }
    }

    window.addEventListener('hashchange', render);
    render();
}
