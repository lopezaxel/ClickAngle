import { icon } from '../icons.js';
import { getState, setState } from '../lib/state.js';
import { createProject, setActiveProject } from '../lib/projects.js';
import { inputDialog, toast } from '../lib/toast.js';

const STEP_META = [
  { key: 'cerebro',  label: 'Cerebro',  doneCheck: (dna) => !!(dna?.hook) },
  { key: 'espionaje', label: 'Espionaje', doneCheck: (dna) => !!(dna?.espionaje_done) },
  { key: 'engine',   label: 'Fábrica',  doneCheck: (dna) => !!(dna?.engine_done) },
  { key: 'editor',   label: 'Editor',   doneCheck: (dna) => !!(dna?.editor_done) },
];

export function openVideoSwitcher() {
  document.getElementById('video-switcher-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'video-switcher-overlay';
  overlay.className = 'video-switcher-overlay';

  function buildProjectsHTML() {
    const { projects, activeProjectId } = getState();

    if (projects.length === 0) {
      return `<div class="vs-empty">
        <div style="margin-bottom:12px; color:var(--text-muted);">${icon('folder', 32)}</div>
        <p style="color:var(--text-tertiary); font-size:13px; font-weight:600;">Sin videos en este canal</p>
        <p style="color:var(--text-muted); font-size:11px; margin-top:4px;">Creá el primero para comenzar el flujo</p>
      </div>`;
    }

    return `<div class="vs-grid">
      ${projects.map(p => {
        const isActive = p.id === activeProjectId;
        const dna = p.logic_dna;
        const date = new Date(p.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' });

        const stepsHTML = STEP_META.map(s => {
          const done = s.doneCheck(dna);
          return `<div class="vs-step ${done ? 'vs-step--done' : ''}">
            ${done ? icon('check', 9) : ''}
            <span>${s.label}</span>
          </div>`;
        }).join('');

        return `<div class="vs-card ${isActive ? 'vs-card--active' : ''}" data-project-id="${p.id}">
          <div class="vs-card-header">
            <div class="vs-card-icon">${icon('film', 13)}</div>
            <div class="vs-card-title" title="${p.title}">${p.title}</div>
            ${isActive ? `<span class="vs-badge-active">Activo</span>` : ''}
          </div>
          <div class="vs-steps">${stepsHTML}</div>
          <div class="vs-card-date">${date}</div>
          ${!isActive
            ? `<button class="vs-btn-select" data-project-id="${p.id}">Trabajar en este →</button>`
            : `<div class="vs-btn-current">${icon('check', 11)} En uso</div>`}
        </div>`;
      }).join('')}
    </div>`;
  }

  overlay.innerHTML = `
    <div class="video-switcher-modal">
      <div class="vs-header">
        <div>
          <h3 class="vs-title">${icon('film', 18)} Mis Videos</h3>
          <p class="vs-subtitle">Cada video guarda su propio flujo de trabajo</p>
        </div>
        <button class="btn btn-ghost btn-sm" id="vs-close">${icon('x', 16)}</button>
      </div>

      <div class="vs-actions">
        <button class="btn btn-primary btn-sm" id="vs-new-video">
          ${icon('plus', 14)} Nuevo Video
        </button>
      </div>

      <div id="vs-projects-container">
        ${buildProjectsHTML()}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  function bindProjectClicks() {
    overlay.querySelectorAll('.vs-btn-select').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.projectId;
        setActiveProject(id);
        overlay.remove();
        // Re-render the current panel with the new project loaded
        const workspace = document.getElementById('workspace');
        if (workspace) {
          const { reRenderCurrentRoute } = await import('../router.js');
          reRenderCurrentRoute(workspace);
        }
      });
    });
  }

  bindProjectClicks();

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  overlay.querySelector('#vs-close').addEventListener('click', () => overlay.remove());

  overlay.querySelector('#vs-new-video').addEventListener('click', async () => {
    const title = await inputDialog('¿Sobre qué trata este video?', {
      title: 'Nuevo Video',
      placeholder: 'Ej: Cómo invertir siendo principiante',
      confirmLabel: 'Crear',
    });
    if (!title?.trim()) return;

    const { activeChannelId } = getState();
    if (!activeChannelId) { toast('Seleccioná un canal primero', 'warning'); return; }

    try {
      await createProject(activeChannelId, title.trim());
      overlay.querySelector('#vs-projects-container').innerHTML = buildProjectsHTML();
      bindProjectClicks();
      toast('Video creado — ahora podés empezar el flujo', 'success');
    } catch (err) {
      toast('Error al crear el video: ' + err.message, 'error');
    }
  });
}
