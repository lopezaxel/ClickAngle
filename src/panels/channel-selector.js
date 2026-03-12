import { getState, setActiveChannel } from '../lib/state.js';
import { deleteChannel, reloadChannels } from '../lib/auth.js';
import { navigateTo } from '../router.js';
import { icon } from '../icons.js';

/**
 * The Hub — Project/Channel Selector (SaaS-style)
 * FULLY SYNCHRONOUS — reads channels from state, never fetches from Supabase.
 * Auth.js is the single source of truth for loading channels.
 */
export function renderChannelSelector(container) {
  const { currentUser, channels, isLoadingChannels } = getState();
  const channelList = channels || [];

  container.innerHTML = buildHubHTML(channelList, currentUser, isLoadingChannels);
  bindHubEvents(container);
}

function buildHubHTML(channels, user, isLoading) {
  const greeting = user?.full_name || user?.email || 'Creador';

  const channelCards = channels.map(ch => `
    <div class="hub-channel-card" data-channel-id="${ch.id}" tabindex="0">
      <div class="hub-card-img">
        ${ch.image_url 
          ? `<img src="${ch.image_url}" alt="${ch.name}" loading="lazy" />`
          : `<div class="hub-card-avatar">${(ch.name || 'C').charAt(0).toUpperCase()}</div>`
        }
      </div>
      <div class="hub-card-body">
        <div class="hub-card-name">${ch.name}</div>
        <div class="hub-card-niche">
          <span class="badge badge-neutral">${ch.niche || 'General'}</span>
          ${ch.role === 'owner' ? `<span class="badge badge-accent">Owner</span>` : `<span class="badge badge-neutral">${ch.role || 'member'}</span>`}
        </div>
      </div>
      <div class="hub-card-actions">
        <button class="hub-btn-delete" data-id="${ch.id}" data-name="${ch.name}" title="Eliminar canal">
          ${icon('trash', 16)}
        </button>
      </div>
      <div class="hub-card-select-hint">
        ${icon('bolt', 14)} <span>Seleccionar</span>
      </div>
    </div>
  `).join('');

  let mainContent;
  if (isLoading) {
    mainContent = `
      <div class="hub-empty">
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;color:var(--text-tertiary);">
          <div class="loader" style="width:20px;height:20px;border-width:2px;"></div>
          <span>Cargando tus proyectos...</span>
        </div>
      </div>`;
  } else if (channels.length > 0) {
    mainContent = `<div class="hub-grid">${channelCards}</div>`;
  } else {
    mainContent = `
      <div class="hub-empty">
        <div class="hub-empty-icon">${icon('crosshair', 48)}</div>
        <h2>¡Empezá tu primer proyecto!</h2>
        <p>Creá un canal para diseñar miniaturas de alto impacto con ángulos psicológicos.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:8px;">
          <button class="btn btn-primary btn-lg" id="hub-btn-create-empty">
            ${icon('rocket', 18)} Crear mi primer canal
          </button>
          <button class="btn btn-ghost btn-lg" id="hub-btn-retry" title="Volver a cargar canales desde Supabase">
            ${icon('refresh', 18)} Reintentar
          </button>
        </div>
      </div>`;
  }

  return `
  <div class="hub-container animate-in">
    <div class="hub-header">
      <div class="hub-header-text">
        <div class="hub-greeting">Hola, ${greeting} 👋</div>
        <h1 class="hub-title">Tus Proyectos</h1>
        <p class="hub-subtitle">Seleccioná un canal para empezar a trabajar o creá uno nuevo.</p>
      </div>
      <button class="btn btn-primary btn-lg" id="hub-btn-create">
        ${icon('plus', 18)} Nuevo Canal
      </button>
    </div>
    ${mainContent}
  </div>

  <!-- Delete Channel Confirmation Modal (hidden) -->
  <div class="hub-modal-overlay hidden" id="hub-delete-overlay">
    <div class="hub-modal animate-in" style="max-width:420px;">
      <div class="card-header">
        <div class="card-title" style="color:var(--error, #ef4444);">${icon('trash', 16)} Eliminar Canal</div>
        <button class="btn btn-ghost btn-sm" id="hub-delete-close">${icon('x', 16)}</button>
      </div>
      <div style="padding:0 0 20px;">
        <p style="color:var(--text-secondary);margin:0 0 8px;">¿Estás seguro de que querés eliminar <strong id="hub-delete-channel-name" style="color:var(--text-primary);"></strong>?</p>
        <p style="color:var(--text-tertiary);font-size:13px;margin:0 0 24px;">Esto borrará <strong>TODOS</strong> los datos asociados: proyectos, miniaturas, brand kit, etc. <br/><span style="color:var(--error,#ef4444);">Esta acción no se puede deshacer.</span></p>
        <div style="display:flex;gap:12px;">
          <button class="btn btn-ghost" id="hub-delete-cancel" style="flex:1;">Cancelar</button>
          <button class="btn" id="hub-delete-confirm" style="flex:1;background:var(--error,#ef4444);color:#fff;border-color:var(--error,#ef4444);">
            ${icon('trash', 16)} Eliminar
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Create Channel Modal (hidden) -->
  <div class="hub-modal-overlay hidden" id="hub-modal-overlay">
    <div class="hub-modal animate-in">
      <div class="card-header">
        <div class="card-title">${icon('plus', 16)} Nuevo Canal</div>
        <button class="btn btn-ghost btn-sm" id="hub-modal-close">${icon('x', 16)}</button>
      </div>
      <form id="hub-create-form">
        <div class="form-group">
          <label class="form-label">Nombre del Canal</label>
          <input type="text" class="form-input" id="hub-input-name" placeholder="Ej: Mi Canal Tech" required />
        </div>
        <div class="form-group">
          <label class="form-label">Nicho</label>
          <select class="form-select" id="hub-input-niche">
            <option value="Tech/IA" selected>Tech/IA</option>
            <option value="Gaming">Gaming</option>
            <option value="Educación">Educación</option>
            <option value="Entretenimiento">Entretenimiento</option>
            <option value="Lifestyle">Lifestyle</option>
            <option value="Negocios">Negocios</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Imagen del Canal (URL, opcional)</label>
          <input type="url" class="form-input" id="hub-input-image" placeholder="https://ejemplo.com/mi-logo.png" />
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;" id="hub-btn-submit">
          ${icon('rocket', 16)} Crear Canal
        </button>
      </form>
    </div>
  </div>
  `;
}

function bindHubEvents(container) {
  // Event delegation for all click handling — avoids SVG pointer-event issues
  container.addEventListener('click', async (e) => {

    // --- DELETE CHANNEL ---
    const deleteBtn = e.target.closest('.hub-btn-delete');
    if (deleteBtn) {
      e.stopPropagation();
      e.preventDefault();

      const channelId = deleteBtn.dataset.id;
      const channelName = deleteBtn.dataset.name || 'este canal';

      // Show custom confirmation modal
      const deleteOverlay = document.getElementById('hub-delete-overlay');
      const nameEl = document.getElementById('hub-delete-channel-name');
      if (nameEl) nameEl.textContent = `"${channelName}"`;
      if (deleteOverlay) deleteOverlay.classList.remove('hidden');

      // Store pending delete info on the overlay for confirm handler
      deleteOverlay._pendingId = channelId;
      deleteOverlay._pendingBtn = deleteBtn;
      return;
    }

    // --- CONFIRM DELETE ---
    if (e.target.closest('#hub-delete-confirm')) {
      const deleteOverlay = document.getElementById('hub-delete-overlay');
      const channelId = deleteOverlay?._pendingId;
      const deleteBtn = deleteOverlay?._pendingBtn;
      if (!channelId) return;

      deleteOverlay.classList.add('hidden');
      if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = `<span class="animate-pulse">${icon('clock', 16)}</span>`;
      }

      try {
        await deleteChannel(channelId);
        renderChannelSelector(container);
      } catch (err) {
        alert('Error al eliminar: ' + err.message);
        if (deleteBtn) {
          deleteBtn.disabled = false;
          deleteBtn.innerHTML = icon('trash', 16);
        }
      }
      return;
    }

    // --- CANCEL DELETE ---
    if (e.target.closest('#hub-delete-cancel') || e.target.closest('#hub-delete-close') || e.target.id === 'hub-delete-overlay') {
      const deleteOverlay = document.getElementById('hub-delete-overlay');
      if (deleteOverlay) deleteOverlay.classList.add('hidden');
      return;
    }

    // --- SELECT CHANNEL ---
    const card = e.target.closest('.hub-channel-card');
    if (card) {
      const channelId = card.dataset.channelId;
      setActiveChannel(channelId);
      navigateTo('dashboard');
      return;
    }

    // --- RETRY LOADING CHANNELS ---
    if (e.target.closest('#hub-btn-retry')) {
      const btn = e.target.closest('#hub-btn-retry');
      btn.disabled = true;
      btn.innerHTML = `<span class="animate-pulse">${icon('clock', 18)}</span> Cargando...`;
      reloadChannels(); // state update will trigger re-render automatically
      return;
    }

    // --- OPEN CREATE MODAL ---
    if (e.target.closest('#hub-btn-create') || e.target.closest('#hub-btn-create-empty')) {
      const overlay = document.getElementById('hub-modal-overlay');
      if (overlay) overlay.classList.remove('hidden');
      return;
    }

    // --- CLOSE MODAL (X button or backdrop click) ---
    if (e.target.closest('#hub-modal-close') || e.target.id === 'hub-modal-overlay') {
      const overlay = document.getElementById('hub-modal-overlay');
      if (overlay) overlay.classList.add('hidden');
      return;
    }
  });

  // Keyboard accessibility for cards
  container.querySelectorAll('.hub-channel-card').forEach(card => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const channelId = card.dataset.channelId;
        setActiveChannel(channelId);
        navigateTo('dashboard');
      }
    });
  });

  // Create channel form submit
  document.getElementById('hub-create-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('hub-input-name')?.value.trim();
    const niche = document.getElementById('hub-input-niche')?.value;
    const imageUrl = document.getElementById('hub-input-image')?.value.trim() || null;
    const submitBtn = document.getElementById('hub-btn-submit');

    if (!name) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="animate-pulse">${icon('clock', 16)}</span> Creando...`;

    try {
      // Dynamic import to avoid circular deps
      const { createChannel } = await import('../lib/auth.js');
      await createChannel(name, niche, imageUrl);

      const overlay = document.getElementById('hub-modal-overlay');
      if (overlay) overlay.classList.add('hidden');

      // Re-render hub with updated state
      renderChannelSelector(container);
    } catch (err) {
      alert('Error al crear canal: ' + err.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = `${icon('rocket', 16)} Crear Canal`;
    }
  });
}
