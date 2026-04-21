import { supabase } from '../lib/supabase.js';
import { getState } from '../lib/state.js';
import { icon } from '../icons.js';
import { callAI } from '../lib/intelligence.js';
import { showLoader, hideLoader } from '../lib/loader.js';
import { toast } from '../lib/toast.js';

// --- Storage upload (one file) ---
async function uploadToStorage(file, channelId, userId) {
  const ext = file.name.split('.').pop();
  const fileName = `${userId}/${channelId}/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
  const { error } = await supabase.storage.from('references').upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('references').getPublicUrl(fileName);
  return urlData.publicUrl;
}

// --- Resolve userId safely (cold start fallback) ---
async function resolveUserId(session) {
  let userId = session?.user?.id;
  if (!userId) {
    const { data: { session: fresh } } = await supabase.auth.getSession();
    userId = fresh?.user?.id;
  }
  if (!userId) throw new Error('Usuario no autenticado. Recarga la página.');
  return userId;
}

// --- Upload Modal ---
function openUploadModal(onConfirm, initialFiles = []) {
  // Pending files list (in-memory)
  let pendingFiles = [];

  // Build modal DOM
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:640px;">
      <div class="flex items-center justify-between mb-md">
        <h3 style="font-size:16px;font-weight:700;">${icon('upload', 18)} Subir Miniaturas de Competencia</h3>
        <button class="btn btn-ghost btn-sm" id="upload-modal-close">${icon('x', 16)}</button>
      </div>

      <div id="upload-modal-dropzone" style="border:2px dashed var(--border);border-radius:var(--radius-lg);padding:var(--space-xl);text-align:center;cursor:pointer;transition:border-color 0.2s,background 0.2s;">
        <div style="opacity:0.35;margin-bottom:var(--space-sm);">${icon('image', 40)}</div>
        <p style="font-size:14px;font-weight:600;margin-bottom:4px;">Arrastra imágenes aquí o hace click para seleccionar</p>
        <p class="text-xs text-muted">PNG, JPG — varias imágenes a la vez</p>
        <input type="file" id="upload-modal-input" accept="image/png,image/jpeg,image/jpg,image/webp" multiple hidden />
      </div>

      <div id="upload-modal-previews" class="grid-3" style="margin-top:var(--space-md);gap:var(--space-sm);"></div>

      <div id="upload-modal-empty" class="text-xs text-muted" style="text-align:center;margin-top:var(--space-md);display:none;">
        Sin imágenes seleccionadas
      </div>

      <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-lg);justify-content:flex-end;">
        <button class="btn btn-ghost btn-sm" id="upload-modal-cancel">Cancelar</button>
        <button class="btn btn-primary btn-sm" id="upload-modal-confirm" disabled>
          ${icon('upload', 14)} Subir <span id="upload-modal-count">0</span> imágenes
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const dropzone = overlay.querySelector('#upload-modal-dropzone');
  const fileInput = overlay.querySelector('#upload-modal-input');
  const previewsGrid = overlay.querySelector('#upload-modal-previews');
  const emptyMsg = overlay.querySelector('#upload-modal-empty');
  const confirmBtn = overlay.querySelector('#upload-modal-confirm');
  const countSpan = overlay.querySelector('#upload-modal-count');

  function closeModal() {
    overlay.remove();
  }

  function updateUI() {
    countSpan.textContent = pendingFiles.length;
    confirmBtn.disabled = pendingFiles.length === 0;
    emptyMsg.style.display = pendingFiles.length === 0 ? 'block' : 'none';

    previewsGrid.innerHTML = pendingFiles.map((entry, i) => `
      <div class="card p-0 overflow-hidden" style="border-radius:var(--radius-md);position:relative;">
        <div style="aspect-ratio:16/9;overflow:hidden;background:var(--bg-tertiary);">
          <img src="${entry.preview}" alt="${entry.name}" style="width:100%;height:100%;object-fit:cover;" />
        </div>
        <div style="padding:8px 10px;">
          <input type="text" class="upload-modal-title" data-idx="${i}" value="${entry.name}" placeholder="Nombre / Canal"
            style="width:100%;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);padding:4px 8px;font-size:12px;color:var(--text-primary);outline:none;" />
        </div>
        <button class="btn btn-ghost upload-modal-remove" data-idx="${i}"
          style="position:absolute;top:4px;right:4px;width:24px;height:24px;padding:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);border-radius:50%;">
          ${icon('x', 12)}
        </button>
      </div>
    `).join('');

    // Bind remove buttons
    previewsGrid.querySelectorAll('.upload-modal-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        URL.revokeObjectURL(pendingFiles[idx].preview);
        pendingFiles.splice(idx, 1);
        updateUI();
      });
    });

    // Bind title inputs
    previewsGrid.querySelectorAll('.upload-modal-title').forEach(input => {
      input.addEventListener('input', () => {
        pendingFiles[parseInt(input.dataset.idx)].name = input.value;
      });
    });
  }

  function addFiles(fileList) {
    for (const file of fileList) {
      if (!file.type.match(/^image\/(png|jpe?g|webp)$/)) continue;
      pendingFiles.push({
        file,
        name: file.name.replace(/\.[^.]+$/, ''),
        preview: URL.createObjectURL(file),
      });
    }
    updateUI();
  }

  // Click to select files
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) addFiles(fileInput.files);
    fileInput.value = '';
  });

  // Drag & drop
  ['dragenter', 'dragover'].forEach(ev =>
    dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.style.borderColor = 'var(--accent)'; dropzone.style.background = 'rgba(var(--accent-rgb),0.05)'; })
  );
  ['dragleave', 'drop'].forEach(ev =>
    dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.style.borderColor = 'var(--border)'; dropzone.style.background = ''; })
  );
  dropzone.addEventListener('drop', e => {
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  });

  // Close handlers
  overlay.querySelector('#upload-modal-close').addEventListener('click', closeModal);
  overlay.querySelector('#upload-modal-cancel').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  // Confirm
  confirmBtn.addEventListener('click', () => {
    const entries = pendingFiles.map(p => ({ file: p.file, name: p.name }));
    closeModal();
    onConfirm(entries);
  });

  // Pre-populate with initial files (from drag-drop on main zone)
  if (initialFiles.length) addFiles(initialFiles);
  else updateUI();
}


// ===================== MAIN RENDER =====================

export async function renderEspionaje(container) {
  const { activeChannelId, session } = getState();
  if (!activeChannelId) { container.innerHTML = '<div class="loading-spinner">Selecciona un canal</div>'; return; }

  showLoader(container, { title: 'Cargando referencias visuales...', subtitle: 'Recuperando miniaturas de la competencia', detail: 'CONSULTANDO BD' });

  const { data: refs } = await supabase
    .from('visual_references')
    .select('*')
    .eq('channel_id', activeChannelId)
    .order('created_at', { ascending: false });

  const savedReferences = refs || [];

  container.innerHTML = `<div class="animate-in">
    <div class="section-header">
      <div>
        <h2 class="section-title">${icon('eye', 22)} Análisis Visual — Espionaje</h2>
        <p class="section-subtitle">Decodifica las miniaturas de tu competencia con IA especializada</p>
      </div>
      <button class="btn btn-primary btn-sm" id="btn-upload-ref">${icon('upload', 14)} Subir Referencias</button>
    </div>

    <div class="card mb-lg" id="ref-drop-zone" style="cursor:pointer; border-style: dashed; padding: var(--space-xl); text-align:center;">
      <div style="opacity:0.4;margin-bottom:var(--space-sm);">${icon('image', 48)}</div>
      <div class="upload-zone-text">Arrastra miniaturas de la competencia o hace click para subir</div>
      <div class="upload-zone-hint">PNG, JPG — la IA analizará composición, colores y psicología visual</div>
    </div>

    <div id="upload-progress" style="display:none;" class="card mb-lg">
      <div class="flex items-center gap-sm mb-sm">
        <span class="animate-pulse">${icon('clock', 16)}</span>
        <span id="upload-progress-text" style="font-size:13px;font-weight:600;">Subiendo...</span>
      </div>
      <div style="background:var(--bg-tertiary);border-radius:var(--radius-sm);height:6px;overflow:hidden;">
        <div id="upload-progress-bar" style="height:100%;background:var(--accent);border-radius:var(--radius-sm);width:0%;transition:width 0.3s ease;"></div>
      </div>
    </div>

    <div class="section-header">
      <div class="card-title">${icon('grid', 16)} Referencias de Estilos</div>
      <span class="badge badge-neutral">${savedReferences.length} guardadas</span>
    </div>

    <div class="grid-3 mb-lg">
      ${savedReferences.map(ref => {
        const isAnalyzed = ref.style_notes && ref.style_notes !== 'Pendiente de análisis...' && ref.style_notes !== 'Cargada...';
        return `
        <div class="card flex flex-col h-full overflow-hidden p-0" style="border-radius: var(--radius-lg);${isAnalyzed ? 'border:1.5px solid var(--success);' : ''}">
          <div style="position:relative; aspect-ratio: 16/9; overflow:hidden; background: var(--bg-tertiary);">
            ${ref.image_url ? `<img src="${ref.image_url}" alt="${ref.title}" style="width:100%;height:100%;object-fit:cover;${isAnalyzed ? '' : 'filter:grayscale(0.6) opacity(0.7);'}" />` : icon('image', 36)}
            ${isAnalyzed
              ? `<span style="position:absolute;top:6px;left:6px;background:var(--success);color:#000;font-size:10px;font-weight:700;padding:2px 8px;border-radius:var(--radius-sm);display:flex;align-items:center;gap:4px;">${icon('check', 10)} Analizada</span>`
              : `<span style="position:absolute;top:6px;left:6px;background:rgba(0,0,0,0.6);color:var(--text-muted);font-size:10px;font-weight:600;padding:2px 8px;border-radius:var(--radius-sm);">Pendiente</span>`
            }
          </div>
          <div style="padding: var(--space-md); flex:1;">
            <div class="flex items-center justify-between mb-sm">
              <span style="font-size:14px; font-weight:700;">${ref.title}</span>
              ${ref.ctr_estimate ? `<span class="badge badge-success">${ref.ctr_estimate} CTR</span>` : ''}
            </div>
            <p class="text-xs text-muted mb-md italic" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${ref.style_notes || 'Sin análisis aún'}</p>
            <div class="flex gap-xs mt-auto">
              ${isAnalyzed
                ? `<button class="btn btn-secondary btn-sm btn-analyze-ref" data-ref-id="${ref.id}" style="flex:1;">${icon('dna', 14)} Re-analizar</button>`
                : `<button class="btn btn-primary btn-sm btn-analyze-ref" data-ref-id="${ref.id}" style="flex:1;">${icon('dna', 14)} Decodificar</button>`
              }
              <button class="btn btn-ghost btn-sm btn-delete-ref" data-ref-id="${ref.id}">${icon('trash', 14)}</button>
            </div>
          </div>
        </div>
      `;}).join('')}
    </div>
  </div>`;

  // --- Batch upload handler ---

  async function handleBatchUpload(entries) {
    if (!entries.length) return;

    const progressEl = document.getElementById('upload-progress');
    const progressText = document.getElementById('upload-progress-text');
    const progressBar = document.getElementById('upload-progress-bar');

    progressEl.style.display = 'block';
    progressText.textContent = `Subiendo 0/${entries.length}...`;
    progressBar.style.width = '0%';

    try {
      const userId = await resolveUserId(session);
      let uploaded = 0;

      for (const entry of entries) {
        progressText.textContent = `Subiendo ${uploaded + 1}/${entries.length}: ${entry.name}`;

        const url = await uploadToStorage(entry.file, activeChannelId, userId);
        await supabase.from('visual_references').insert({
          channel_id: activeChannelId,
          title: entry.name || 'Sin título',
          image_url: url,
          style_notes: 'Pendiente de análisis...',
        });

        uploaded++;
        progressBar.style.width = `${Math.round((uploaded / entries.length) * 100)}%`;
      }

      progressText.textContent = `${uploaded} imagen${uploaded > 1 ? 'es' : ''} subida${uploaded > 1 ? 's' : ''} correctamente`;
      setTimeout(() => renderEspionaje(container), 1200);

    } catch (err) {
      progressText.textContent = `Error: ${err.message}`;
      progressBar.style.background = 'var(--error)';
      setTimeout(() => renderEspionaje(container), 3000);
    }
  }

  function openUploadFlow() {
    openUploadModal((entries) => handleBatchUpload(entries));
  }

  // --- Bind triggers ---

  const dz = document.getElementById('ref-drop-zone');
  if (dz) {
    dz.addEventListener('click', openUploadFlow);
    ['dragenter', 'dragover'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.add('drag-over'); }));
    ['dragleave', 'drop'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.remove('drag-over'); }));
    dz.addEventListener('drop', (e) => {
      const files = [...e.dataTransfer.files].filter(f => f.type.match(/^image\/(png|jpe?g|webp)$/));
      if (files.length) {
        openUploadModal((entries) => handleBatchUpload(entries), files);
      }
    });
  }

  document.getElementById('btn-upload-ref')?.addEventListener('click', openUploadFlow);

  // --- AI Decoding ---
  container.querySelectorAll('.btn-analyze-ref').forEach(btn => {
    btn.addEventListener('click', async () => {
      const originalHtml = btn.innerHTML;
      try {
        btn.disabled = true;
        const ref = savedReferences.find(r => r.id === btn.dataset.refId);
        showLoader(container, {
          title: 'Decodificando Competencia',
          subtitle: `Analizando "${ref?.title || 'referencia'}" — extrayendo paleta, patrones a evitar y CTR estimado.`,
          detail: 'ESPIONAGE ANALYSIS',
        });
        const analysis = await callAI('ESPIONAGE_ANALYSIS', `Referencia: ${ref.title}`, { url: ref.image_url });

        await supabase.from('visual_references').update({
          style_notes: (analysis.composition || '') + ' ' + (analysis.triggers || '') || 'Analizado'
        }).eq('id', ref.id);

        renderEspionaje(container);
      } catch (err) {
        hideLoader();
        toast(err.message, 'error');
      } finally {
        hideLoader();
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    });
  });

  // --- Delete ---
  container.querySelectorAll('.btn-delete-ref').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar esta referencia?')) return;
      await supabase.from('visual_references').delete().eq('id', btn.dataset.refId);
      renderEspionaje(container);
    });
  });
}
