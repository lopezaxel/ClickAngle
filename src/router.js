// Simple hash-based SPA router
const routes = {};
let currentWorkspace = null;

export function registerRoute(hash, renderFn) {
    routes[hash] = renderFn;
}

export function navigateTo(hash) {
    window.location.hash = hash;
}

export function getCurrentRoute() {
    return window.location.hash.slice(1) || 'dashboard';
}

export function reRenderCurrentRoute(workspace) {
    if (workspace) currentWorkspace = workspace;
    const route = getCurrentRoute();
    const renderFn = routes[route];

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.route === route);
    });

    if (renderFn && currentWorkspace) {
        currentWorkspace.innerHTML = '';
        renderFn(currentWorkspace);
    }
}

export function initRouter(workspace) {
    currentWorkspace = workspace;

    function render() {
        const route = getCurrentRoute();
        const renderFn = routes[route];

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.route === route);
        });

        if (renderFn) {
            workspace.style.opacity = '0';
            workspace.style.transform = 'translateY(8px)';
            setTimeout(() => {
                workspace.innerHTML = '';
                renderFn(workspace);
                workspace.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                workspace.style.opacity = '1';
                workspace.style.transform = 'translateY(0)';
            }, 150);
        }
    }

    window.addEventListener('hashchange', render);
    render();
}
