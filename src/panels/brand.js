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

async function uploadToStorage(bucket, file, channelId) {
  const ext = file.name.split('.').pop();
  const fileName = `${channelId}/${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return urlData.publicUrl;
}

export async function renderBrand(container) {
  const { activeChannelId } = getState();
  if (!activeChannelId) { container.innerHTML = '<div class="loading-spinner">Selecciona un canal</div>'; return; }

  container.innerHTML = `<div class="loading-spinner"><span class="animate-pulse">${icon('clock', 24)}</span></div>`;

  // Fetch brand kit
  let { data: brandKit } = await supabase
    .from('brand_kits')
    .select('*')
    .eq('channel_id', activeChannelId)
    .maybeSingle();

  // Fetch face vault
  const { data: faces } = await supabase
    .from('face_vault')
    .select('*')
    .eq('channel_id', activeChannelId)
    .order('created_at', { ascending: true });

  // Fetch creator thumbnails
  const { data: creatorThumbs } = await supabase
    .from('creator_thumbnails')
    .select('*')
    .eq('channel_id', activeChannelId)
    .order('created_at', { ascending: false });

  const faceList = faces || [];
  const thumbList = creatorThumbs || [];
  const colors = brandKit?.colors || ['#DC2626', '#10B981', '#F5F5F5', '#6B7280', '#3B82F6', '#F59E0B'];
  const adn = brandKit?.detailed_adn || brandKit?.channel_adn || null;

  container.innerHTML = `<div class="animate-in">
    <div class="section-header">
      <div>
        <h2 class="section-title">${icon('palette', 22)} Identidad de Marca</h2>
        <p class="section-subtitle">Define el ADN de tu canal y tus mejores miniaturas</p>
      </div>
      <div class="flex gap-sm">
        <button class="btn btn-secondary btn-sm" id="btn-analyze-adn">${icon('brain', 14)} Analizar ADN Detallado</button>
        <button class="btn btn-primary btn-sm" id="btn-save-brand">${icon('save', 14)} Guardar Configuración</button>
      </div>
    </div>

    <div class="grid-2" style="grid-template-columns: 1fr 1fr;">
      <div>
        <!-- ADN DEL CANAL -->
        <div class="card mb-md">
          <div class="card-header">
            <div class="card-title">${icon('dna', 16)} ADN del Canal</div>
            <span class="badge ${adn ? 'badge-accent' : 'badge-neutral'}">${adn ? 'Analizado' : 'Pendiente'}</span>
          </div>
          ${adn ? `
            <div class="adn-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-sm); margin-top:var(--space-sm);">
               <div class="card p-sm bg-tertiary">
                 <div class="text-xs font-bold text-accent">Branding</div>
                 <div class="text-xs text-muted">${adn.branding || 'N/A'}</div>
               </div>
               <div class="card p-sm bg-tertiary">
                 <div class="text-xs font-bold text-accent">Tono</div>
                 <div class="text-xs text-muted">${adn.tone || adn.tone_of_voice || 'N/A'}</div>
               </div>
               <div class="card p-sm bg-tertiary" style="grid-column: span 2;">
                 <div class="text-xs font-bold text-accent">Temas/Nichos</div>
                 <div class="text-xs text-muted">${adn.themes || adn.niche || 'N/A'}</div>
               </div>
            </div>
          ` : `
            <p class="text-sm text-muted p-md text-center">Analiza tu canal para definir su tono y estilo visual</p>
          `}
        </div>

        <!-- FACE VAULT -->
        <div class="card mb-md">
          <div class="card-header">
            <div class="card-title">${icon('camera', 16)} Face Vault</div>
            <span class="badge badge-accent">${faceList.length} Fotos</span>
          </div>
          <div class="grid-4 mb-md" style="grid-template-columns: repeat(4, 1fr);">
            ${faceList.map(f => `
              <div class="card face-slot" data-face-id="${f.id}" style="text-align:center; padding: var(--space-md); cursor:pointer; position:relative;">
                <div style="width:48px;height:48px;border-radius:50%;margin:0 auto var(--space-sm);overflow:hidden;border:2px solid var(--accent);">
                  <img src="${f.image_url}" alt="${f.expression_type}" style="width:100%;height:100%;object-fit:cover;" />
                </div>
                <button class="btn-delete-face" data-face-id="${f.id}" style="position:absolute;top:4px;right:4px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-secondary);font-size:10px;" title="Eliminar">${icon('trash', 10)}</button>
                <div class="text-xs font-bold">${f.expression_type}</div>
              </div>
            `).join('')}
            ${faceList.length < 4 ? ['Sorpresa', 'Señalando'].map(label => `
              <div class="card empty-face-slot" data-suggested="${label}" style="text-align:center; padding: var(--space-md); opacity:0.6; cursor:pointer; border: 1px dashed var(--border);">
                <div style="width:48px;height:48px;border-radius:50%;background:var(--bg-tertiary);margin:0 auto var(--space-sm);display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);">${icon('plus', 18)}</div>
                <div class="text-xs font-bold">${label}</div>
              </div>
            `).join('') : ''}
          </div>
          <button class="btn btn-secondary btn-sm w-full" id="btn-upload-face">${icon('upload', 14)} Subir Rostro</button>
        </div>
      </div>

      <div>
        <!-- CREATOR THUMBNAILS (NUEVO SECTOR) -->
        <div class="card mb-md">
          <div class="card-header">
            <div class="card-title">${icon('image', 16)} Mis Mejores Miniaturas</div>
            <span class="badge badge-success">${thumbList.length} Éxitos</span>
          </div>
          <p class="text-xs text-muted mb-sm">Sube tus miniaturas con mejor CTR para que la IA aprenda tu estilo.</p>
          <div class="grid-3 mb-md" style="grid-template-columns: repeat(3, 1fr);">
            ${thumbList.map(t => `
               <div class="card p-0 overflow-hidden relative group" style="aspect-ratio:16/9;">
                 <img src="${t.image_url}" style="width:100%;height:100%;object-fit:cover;" />
                 <button class="btn-delete-thumb" data-thumb-id="${t.id}" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);border:none;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:white;">${icon('x', 12)}</button>
               </div>
            `).join('')}
            ${thumbList.length < 6 ? `
              <div class="card empty-thumb-slot flex items-center justify-center border-dashed" id="btn-upload-creator-thumb" style="aspect-ratio:16/9; cursor:pointer; opacity:0.6;">
                ${icon('plus', 24)}
              </div>
            ` : ''}
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">${icon('palette', 16)} Colores y Fuentes</div></div>
          <div class="flex gap-sm mb-md">
            ${colors.map(c => `
              <div class="color-swatch" style="background: ${c}; width:32px; height:32px; border-radius:4px;"></div>
            `).join('')}
          </div>
          <div class="form-group mb-sm">
            <label class="text-xs font-bold">Fuente Miniaturas</label>
            <div class="p-sm bg-tertiary rounded mt-xs" style="font-family: var(--font-impact); font-size:18px;">${brandKit?.font_thumbnails || 'BANGERS'}</div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  // --- Handlers ---

  // ADN Analysis
  document.getElementById('btn-analyze-adn')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-analyze-adn');
    const originalHtml = btn.innerHTML;
    try {
      btn.innerHTML = `<span class="animate-pulse">${icon('clock', 14)}</span> Analizando...`;
      btn.disabled = true;

      const { data: channel } = await supabase.from('channels').select('*').eq('id', activeChannelId).single();
      const content = `Canal: ${channel.name}\nDescripción: ${channel.description}\nNicho: ${channel.niche}`;

      const analysis = await callAI('CHANNEL_ADN', content);

      await supabase.from('brand_kits').upsert({
        channel_id: activeChannelId,
        detailed_adn: analysis
      }, { onConflict: 'channel_id' });

      renderBrand(container);
    } catch (err) {
      alert('Error en el análisis de ADN: ' + err.message);
    } finally {
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }
  });

  // Creator Thumbnail Upload
  document.getElementById('btn-upload-creator-thumb')?.addEventListener('click', () => {
    triggerFileInput('image/*', async (file) => {
      try {
        const url = await uploadToStorage('references', file, activeChannelId);
        await supabase.from('creator_thumbnails').insert({
          channel_id: activeChannelId,
          image_url: url
        });
        renderBrand(container);
      } catch (err) { alert('Error: ' + err.message); }
    });
  });

  // Face Upload
  const uploadFace = (file, suggested) => {
    triggerFileInput('image/*', async (file) => {
      try {
        const expression = prompt('Tipo de expresión:', suggested || 'Normal');
        if (expression === null) return;
        const url = await uploadToStorage('faces', file, activeChannelId);
        await supabase.from('face_vault').insert({
          channel_id: activeChannelId,
          expression_type: expression,
          image_url: url
        });
        renderBrand(container);
      } catch (err) { alert('Error: ' + err.message); }
    });
  }

  document.getElementById('btn-upload-face')?.addEventListener('click', uploadFace);
  container.querySelectorAll('.empty-face-slot').forEach(slot => {
    slot.addEventListener('click', () => uploadFace(null, slot.dataset.suggested));
  });

  // Deletions
  container.querySelectorAll('.btn-delete-face').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Eliminar?')) return;
      await supabase.from('face_vault').delete().eq('id', btn.dataset.faceId);
      renderBrand(container);
    });
  });

  container.querySelectorAll('.btn-delete-thumb').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Eliminar miniatura?')) return;
      await supabase.from('creator_thumbnails').delete().eq('id', btn.dataset.thumbId);
      renderBrand(container);
    });
  });

  // Save (minimal for now)
  document.getElementById('btn-save-brand')?.addEventListener('click', async () => {
    alert('Configuración base guardada.');
  });
}
