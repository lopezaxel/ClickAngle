import { icon } from '../icons.js';
import { getState, setState } from '../lib/state.js';
import { createProject, setActiveProject } from '../lib/projects.js';
import { inputDialog, toast } from '../lib/toast.js';

export function openVideoSwitcher() {
  document.getElementById('video-switcher-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'video-switcher-overlay';
  overlay.className = 'video-switcher-overlay';

  let selectedProjectId = null;
  let viewMode = 'grid';

  function buildProjectsHTML() {
    const { projects, activeProjectId } = getState();

    if (projects.length === 0) {
      return `<div class="vs-empty">
        <div style="margin-bottom:12px; color:var(--text-muted);">${icon('folder', 32)}</div>
        <p style="color:var(--text-tertiary); font-size:13px; font-weight:600;">Sin videos en este canal</p>
        <p style="color:var(--text-muted); font-size:11px; margin-top:4px;">Creá el primero para comenzar el flujo</p>
      </div>`;
    }

    const containerClass = viewMode === 'list' ? 'vs-list' : 'vs-grid';

    return `<div class="${containerClass}">
      ${projects.map(p => {
        const isActive = p.id === activeProjectId;
        const isSelected = p.id === selectedProjectId && !isActive;
        const date = new Date(p.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' });

        let cardClass = 'vs-card';
        if (isActive) cardClass += ' vs-card--active';
        if (isSelected) cardClass += ' vs-card--selected';

        return `<div class="${cardClass}" data-project-id="${p.id}">
          <div class="vs-card-header">
            <div class="vs-card-icon">${icon('film', 13)}</div>
            <div class="vs-card-title" title="${p.title}">${p.title}</div>
            ${isActive ? `<span class="vs-badge-active">En uso</span>` : ''}
          </div>
          <div class="vs-card-date">${date}</div>
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
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="vs-view-toggle">
            <button class="vs-view-btn vs-view-btn--active" id="vs-view-grid" title="Vista cuadrícula">${icon('grid', 15)}</button>
            <button class="vs-view-btn" id="vs-view-list" title="Vista lista">${icon('list', 15)}</button>
          </div>
          <button class="btn btn-ghost btn-sm" id="vs-close">${icon('x', 16)}</button>
        </div>
      </div>

      <div class="vs-actions">
        <button class="btn btn-primary btn-sm" id="vs-new-video">
          ${icon('plus', 14)} Nuevo Video
        </button>
      </div>

      <div id="vs-projects-container" class="vs-projects-scroll">
        ${buildProjectsHTML()}
      </div>

      <div class="vs-footer">
        <p class="vs-footer-hint">Clic para seleccionar · Doble clic para abrir directamente</p>
        <button class="vs-btn-work" id="vs-btn-work" disabled>
          Trabajar en este
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  function updateWorkButton() {
    const btn = overlay.querySelector('#vs-btn-work');
    if (!btn) return;
    if (selectedProjectId) {
      btn.disabled = false;
      btn.classList.add('vs-btn-work--ready');
    } else {
      btn.disabled = true;
      btn.classList.remove('vs-btn-work--ready');
    }
  }

  async function workOnProject(id) {
    setActiveProject(id);
    overlay.remove();
    const workspace = document.getElementById('workspace');
    if (workspace) {
      const { reRenderCurrentRoute } = await import('../router.js');
      reRenderCurrentRoute(workspace);
    }
  }

  function refreshProjects() {
    overlay.querySelector('#vs-projects-container').innerHTML = buildProjectsHTML();
    bindContainerEvents();
  }

  function bindContainerEvents() {
    const container = overlay.querySelector('#vs-projects-container');

    container.addEventListener('click', (e) => {
      const card = e.target.closest('.vs-card');
      if (!card) return;
      const id = card.dataset.projectId;
      const { activeProjectId } = getState();
      if (id === activeProjectId) return;

      container.querySelectorAll('.vs-card--selected').forEach(c => c.classList.remove('vs-card--selected'));
      card.classList.add('vs-card--selected');
      selectedProjectId = id;
      updateWorkButton();
    });

    container.addEventListener('dblclick', async (e) => {
      const card = e.target.closest('.vs-card');
      if (!card) return;
      const id = card.dataset.projectId;
      const { activeProjectId } = getState();
      if (id === activeProjectId) return;
      await workOnProject(id);
    });
  }

  bindContainerEvents();

  overlay.querySelector('#vs-btn-work').addEventListener('click', async () => {
    if (!selectedProjectId) return;
    await workOnProject(selectedProjectId);
  });

  overlay.querySelector('#vs-view-grid').addEventListener('click', () => {
    if (viewMode === 'grid') return;
    viewMode = 'grid';
    selectedProjectId = null;
    overlay.querySelector('#vs-view-grid').classList.add('vs-view-btn--active');
    overlay.querySelector('#vs-view-list').classList.remove('vs-view-btn--active');
    updateWorkButton();
    refreshProjects();
  });

  overlay.querySelector('#vs-view-list').addEventListener('click', () => {
    if (viewMode === 'list') return;
    viewMode = 'list';
    selectedProjectId = null;
    overlay.querySelector('#vs-view-list').classList.add('vs-view-btn--active');
    overlay.querySelector('#vs-view-grid').classList.remove('vs-view-btn--active');
    updateWorkButton();
    refreshProjects();
  });

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
      refreshProjects();
      toast('Video creado — ahora podés empezar el flujo', 'success');
    } catch (err) {
      toast('Error al crear el video: ' + err.message, 'error');
    }
  });
}
