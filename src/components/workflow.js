import { navigateTo, getCurrentRoute } from '../router.js';
import { icon } from '../icons.js';
import { getState } from '../lib/state.js';
import { openVideoSwitcher } from './video-switcher.js';

const WORKFLOW_STEPS = [
    { route: 'cerebro',  label: 'El Cerebro',        desc: 'ADN del Video',           icon: 'brain',    step: 1 },
    { route: 'espionaje', label: 'Espionaje',         desc: 'Análisis de Competencia', icon: 'eye',      step: 2 },
    { route: 'engine',   label: 'Fábrica Creativa',   desc: 'Generación',              icon: 'cog',      step: 3 },
    { route: 'editor',   label: 'Editor & Simulador', desc: 'Edición Final',           icon: 'scissors', step: 4 },
];

function buildWorkflowHTML() {
    const currentRoute = getCurrentRoute();
    const activeIndex = WORKFLOW_STEPS.findIndex(s => s.route === currentRoute);
    const { projects, activeProjectId } = getState();
    const activeProject = projects.find(p => p.id === activeProjectId) || null;

    let stepsHTML = WORKFLOW_STEPS.map((step, i) => {
        const isActive = step.route === currentRoute;
        const isPast = activeIndex >= 0 && i < activeIndex;
        const stateClass = isActive ? 'workflow-step--active' : isPast ? 'workflow-step--done' : '';

        return `<a class="workflow-step ${stateClass}" href="#${step.route}" data-route="${step.route}">
        <div class="workflow-step-number">${isPast ? icon('check', 12) : step.step}</div>
        <div class="workflow-step-info">
          <div class="workflow-step-label">${step.label}</div>
          <div class="workflow-step-desc">${step.desc}</div>
        </div>
      </a>${i < WORKFLOW_STEPS.length - 1 ? `<div class="workflow-connector ${isPast ? 'workflow-connector--done' : ''}"></div>` : ''}`;
    }).join('');

    const hasVideo = !!activeProject;
    const videoName = activeProject?.title || 'Elegir video';

    const videoCtxHTML = `
      <div class="workflow-video-ctx">
        <div class="workflow-video-wrap ${hasVideo ? 'workflow-video-wrap--glowing' : ''}">
          <button class="workflow-video-btn ${hasVideo ? 'workflow-video-btn--active' : 'workflow-video-btn--empty'}" id="btn-video-switcher" title="Cambiar video de trabajo">
            ${icon('film', 16)}
            <div class="workflow-video-text">
              <span class="workflow-video-label">VIDEO ACTIVO</span>
              <span class="workflow-video-name">${videoName}</span>
            </div>
            ${icon('chevronDown', 13)}
          </button>
        </div>
      </div>`;

    return `<div class="workflow-bar">
      <div class="workflow-steps">${stepsHTML}</div>
      ${videoCtxHTML}
    </div>`;
}

export function renderWorkflow(container) {
    container.innerHTML = buildWorkflowHTML();
    bindWorkflowEvents(container);
}

export function updateWorkflow(container) {
    container.innerHTML = buildWorkflowHTML();
    bindWorkflowEvents(container);
}

function bindWorkflowEvents(container) {
    container.querySelectorAll('.workflow-step').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(el.dataset.route);
        });
    });

    container.querySelector('#btn-video-switcher')?.addEventListener('click', () => {
        openVideoSwitcher();
    });
}
