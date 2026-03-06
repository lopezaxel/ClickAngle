import { supabase } from '../lib/supabase.js';
import { getState } from '../lib/state.js';
import { icon } from '../icons.js';
import { callAI } from '../lib/intelligence.js';

function triggerFileInput(accept, callback) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.style.display = 'none';
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) callback(file);
    input.remove();
  });
  document.body.appendChild(input);
  input.click();
}

async function uploadToStorage(file, channelId) {
  const ext = file.name.split('.').pop();
  const fileName = `${channelId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('references').upload(fileName, file);
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('references').getPublicUrl(fileName);
  return urlData.publicUrl;
}

export async function renderEspionaje(container) {
  const { activeChannelId } = getState();
  if (!activeChannelId) { container.innerHTML = '<div class="loading-spinner">Selecciona un canal</div>'; return; }

  container.innerHTML = `<div class="loading-spinner"><span class="animate-pulse">${icon('clock', 24)}</span></div>`;

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
      <button class="btn btn-primary btn-sm" id="btn-upload-ref">${icon('upload', 14)} Subir Referencia</button>
    </div>

    <div class="card mb-lg" id="ref-drop-zone" style="cursor:pointer; border-style: dashed; padding: var(--space-xl); text-align:center;">
      <div style="opacity:0.4;margin-bottom:var(--space-sm);">${icon('image', 48)}</div>
      <div class="upload-zone-text">Arrastra miniaturas de la competencia para análisis</div>
      <div class="upload-zone-hint">La IA analizará composición, colores y psicología visual</div>
    </div>

    <div class="section-header">
      <div class="card-title">${icon('grid', 16)} Referencias de Estilos</div>
      <span class="badge badge-neutral">${savedReferences.length} guardadas</span>
    </div>

    <div class="grid-3 mb-lg">
      ${savedReferences.map(ref => `
        <div class="card flex flex-col h-full overflow-hidden p-0" style="border-radius: var(--radius-lg);">
          <div style="position:relative; aspect-ratio: 16/9; overflow:hidden; background: var(--bg-tertiary);">
            ${ref.image_url ? `<img src="${ref.image_url}" alt="${ref.title}" style="width:100%;height:100%;object-fit:cover;" />` : icon('image', 36)}
          </div>
          <div style="padding: var(--space-md); flex:1;">
            <div class="flex items-center justify-between mb-sm">
              <span style="font-size:14px; font-weight:700;">${ref.title}</span>
              ${ref.ctr_estimate ? `<span class="badge badge-success">${ref.ctr_estimate} CTR</span>` : ''}
            </div>
            <p class="text-xs text-muted mb-md italic" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${ref.style_notes || 'Sin análisis aún'}</p>
            <div class="flex gap-xs mt-auto">
              <button class="btn btn-secondary btn-sm btn-analyze-ref" data-ref-id="${ref.id}" style="flex:1;">${icon('dna', 14)} Decodificar</button>
              <button class="btn btn-ghost btn-sm btn-delete-ref" data-ref-id="${ref.id}">${icon('trash', 14)}</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>`;

  // --- Handlers ---

  async function handleUpload(file) {
    const title = prompt('Nombre/Canal de la referencia:', file.name.replace(/\.[^.]+$/, ''));
    if (!title) return;
    try {
      const url = await uploadToStorage(file, activeChannelId);
      await supabase.from('visual_references').insert({
        channel_id: activeChannelId,
        title,
        image_url: url,
        style_notes: 'Cargada...',
      });
      renderEspionaje(container);
    } catch (err) { alert('Error: ' + err.message); }
  }

  const dz = document.getElementById('ref-drop-zone');
  if (dz) {
    dz.addEventListener('click', () => triggerFileInput('image/*', handleUpload));
    ['dragenter', 'dragover'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.add('drag-over'); }));
    ['dragleave', 'drop'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.remove('drag-over'); }));
    dz.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) handleUpload(file);
    });
  }

  document.getElementById('btn-upload-ref')?.addEventListener('click', () => triggerFileInput('image/*', handleUpload));

  // AI Decoding Logic
  container.querySelectorAll('.btn-analyze-ref').forEach(btn => {
    btn.addEventListener('click', async () => {
      const originalHtml = btn.innerHTML;
      try {
        btn.innerHTML = `<span class="animate-pulse">${icon('clock', 14)}</span>`;
        btn.disabled = true;

        const ref = savedReferences.find(r => r.id === btn.dataset.refId);
        const analysis = await callAI('ESPIONAGE_ANALYSIS', `Referencia: ${ref.title}`, { url: ref.image_url });

        const notes = typeof analysis === 'object' ? JSON.stringify(analysis, null, 2) : analysis;

        await supabase.from('visual_references').update({
          style_notes: (analysis.composition || '') + ' ' + (analysis.triggers || '') || 'Analizado'
        }).eq('id', ref.id);

        renderEspionaje(container);
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    });
  });

  // Delete reference
  container.querySelectorAll('.btn-delete-ref').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar esta referencia?')) return;
      await supabase.from('visual_references').delete().eq('id', btn.dataset.refId);
      renderEspionaje(container);
    });
  });
}
