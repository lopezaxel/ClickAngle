// Simple hash-based SPA router
const routes = {};
let currentPanel = null;

export function registerRoute(hash, renderFn) {
    routes[hash] = renderFn;
}

export function navigateTo(hash) {
    window.location.hash = hash;
}

export function getCurrentRoute() {
    return window.location.hash.slice(1) || 'dashboard';
}

export function initRouter(workspace) {
    function render() {
        const route = getCurrentRoute();
        const renderFn = routes[route];

        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.route === route);
        });

        if (renderFn) {
            // Animate panel transition
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
