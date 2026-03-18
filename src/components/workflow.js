import { navigateTo, getCurrentRoute } from '../router.js';
import { icon } from '../icons.js';

const WORKFLOW_STEPS = [
    { route: 'brand', label: 'Brand Kit', desc: 'Identidad Visual', icon: 'palette', step: 1 },
    { route: 'cerebro', label: 'El Cerebro', desc: 'ADN del Video', icon: 'brain', step: 2 },
    { route: 'espionaje', label: 'Espionaje', desc: 'Análisis de Competencia', icon: 'eye', step: 3 },
    { route: 'engine', label: 'Fábrica Creativa', desc: 'Generación', icon: 'cog', step: 4 },
    { route: 'editor', label: 'Editor & Simulador', desc: 'Edición Final', icon: 'scissors', step: 5 },
];

export function renderWorkflow(container) {
    const currentRoute = getCurrentRoute();
    const activeIndex = WORKFLOW_STEPS.findIndex(s => s.route === currentRoute);

    let html = `<div class="workflow-bar">
    <div class="workflow-steps">`;

    WORKFLOW_STEPS.forEach((step, i) => {
        const isActive = step.route === currentRoute;
        const isPast = activeIndex >= 0 && i < activeIndex;
        const stateClass = isActive ? 'workflow-step--active' : isPast ? 'workflow-step--done' : '';

        html += `<a class="workflow-step ${stateClass}" href="#${step.route}" data-route="${step.route}">
        <div class="workflow-step-number">${isPast ? icon('check', 12) : step.step}</div>
        <div class="workflow-step-info">
          <div class="workflow-step-label">${step.label}</div>
          <div class="workflow-step-desc">${step.desc}</div>
        </div>
      </a>`;

        if (i < WORKFLOW_STEPS.length - 1) {
            html += `<div class="workflow-connector ${isPast ? 'workflow-connector--done' : ''}"></div>`;
        }
    });

    html += `</div></div>`;
    container.innerHTML = html;

    // Click handlers
    container.querySelectorAll('.workflow-step').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(el.dataset.route);
        });
    });
}

export function updateWorkflow(container) {
    renderWorkflow(container);
}
