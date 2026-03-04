import { supabase } from '../lib/supabase.js';
import { getState } from '../lib/state.js';
import { icon } from '../icons.js';

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
        <p class="section-subtitle">Decodifica las miniaturas de tu competencia con IA</p>
      </div>
      <button class="btn btn-primary btn-sm" id="btn-upload-ref">${icon('upload', 14)} Subir Referencia</button>
    </div>

    <div class="card mb-lg">
      <div class="upload-zone" id="ref-drop-zone" style="cursor:pointer;">
        <div style="opacity:0.4;margin-bottom:var(--space-sm);">${icon('image', 40)}</div>
        <div class="upload-zone-text">Arrastra miniaturas de la competencia para análisis</div>
        <div class="upload-zone-hint">PNG, JPG, WEBP — Click o arrastra. La IA analizará composición, colores y texto</div>
      </div>
    </div>

    <div class="section-header">
      <div class="card-title">${icon('grid', 16)} Referencias de Estilos Guardadas</div>
      <span class="badge badge-neutral">${savedReferences.length} referencias</span>
    </div>

    <div class="grid-3 mb-lg">
      ${savedReferences.map(ref => `
        <div class="card" style="cursor: pointer;">
          <div style="background: linear-gradient(135deg, #0f0f23, #1a1a3e); border-radius: var(--radius-md); margin-bottom: var(--space-md); aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; color: var(--text-tertiary); overflow:hidden;">
            ${ref.image_url
      ? `<img src="${ref.image_url}" alt="${ref.title}" style="width:100%;height:100%;object-fit:cover;" />`
      : icon('image', 36)}
          </div>
          <div class="flex items-center justify-between mb-sm">
            <span style="font-size:14px; font-weight:700;">${ref.title}</span>
            ${ref.ctr_estimate ? `<span class="badge badge-success">${ref.ctr_estimate} CTR</span>` : ''}
          </div>
          <p class="text-sm text-muted mb-md">${ref.style_notes || 'Sin notas de estilo'}</p>
          <div class="flex gap-xs">
            <button class="btn btn-secondary btn-sm" style="flex:1;">${icon('dna', 14)} Analizar</button>
            <button class="btn btn-ghost btn-sm btn-delete-ref" data-ref-id="${ref.id}">${icon('trash', 14)}</button>
          </div>
        </div>
      `).join('')}
      <div class="card" id="btn-add-reference" style="display:flex; flex-direction:column; align-items:center; justify-content:center; border-style: dashed; cursor: pointer; min-height: 280px; color:var(--text-tertiary);">
        ${icon('plus', 32)}
        <span class="text-sm text-muted mt-md">Añadir Referencia</span>
      </div>
    </div>
  </div>`;

  // Upload functions
  async function handleUpload(file) {
    const title = prompt('Nombre/Canal de la referencia:', file.name.replace(/\.[^.]+$/, ''));
    if (!title) return;
    try {
      const url = await uploadToStorage(file, activeChannelId);
      await supabase.from('visual_references').insert({
        channel_id: activeChannelId,
        title,
        image_url: url,
        style_notes: 'Referencia agregada manualmente',
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
  document.getElementById('btn-add-reference')?.addEventListener('click', () => triggerFileInput('image/*', handleUpload));

  // Delete reference
  container.querySelectorAll('.btn-delete-ref').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar esta referencia?')) return;
      await supabase.from('visual_references').delete().eq('id', btn.dataset.refId);
      renderEspionaje(container);
    });
  });
}
