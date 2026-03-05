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

  const faceList = faces || [];
  const colors = brandKit?.colors || ['#DC2626', '#10B981', '#F5F5F5', '#6B7280', '#3B82F6', '#F59E0B'];

  container.innerHTML = `<div class="animate-in">
    <div class="section-header">
      <div>
        <h2 class="section-title">${icon('palette', 22)} Identidad Visual</h2>
        <p class="section-subtitle">Define tu marca para consistencia en todas las miniaturas</p>
      </div>
      <div class="flex gap-sm">
        <button class="btn btn-secondary btn-sm" id="btn-analyze-adn">${icon('brain', 14)} Analizar ADN</button>
        <button class="btn btn-primary btn-sm" id="btn-save-brand">${icon('save', 14)} Guardar Cambios</button>
      </div>
    </div>

    <div class="grid-2" style="grid-template-columns: 1fr 1fr;">
      <div>
        <div class="card mb-md">
          <div class="card-header">
            <div class="card-title">${icon('camera', 16)} Face Vault</div>
            <span class="badge badge-accent">${faceList.length} Expresiones</span>
          </div>
          <p class="text-sm text-muted mb-md">Sube fotos con diferentes expresiones. La IA seleccionará la mejor según el ángulo elegido.</p>
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
            ${faceList.length === 0 ? ['Sorpresa', 'Confianza', 'Señalando', 'Pensando'].map(label => `
              <div class="card" style="text-align:center; padding: var(--space-md); opacity:0.5;">
                <div style="width:48px;height:48px;border-radius:50%;background:var(--bg-tertiary);border:1px solid var(--border);margin:0 auto var(--space-sm);display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);">${icon('user', 20)}</div>
                <div class="text-xs font-bold">${label}</div>
              </div>
            `).join('') : ''}
          </div>
          <div class="upload-zone" id="face-upload-zone" style="padding: var(--space-lg); cursor:pointer;">
            <div style="opacity:0.4;margin-bottom:var(--space-sm);">${icon('upload', 32)}</div>
            <div class="upload-zone-text">Subir nueva expresión</div>
            <div class="upload-zone-hint">PNG, JPG — Fondo transparente recomendado</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">${icon('image', 16)} Logo del Canal</div></div>
          <div class="flex items-center gap-lg">
            <div id="logo-preview" style="width:80px; height:80px; border-radius: var(--radius-lg); ${brandKit?.logo_url ? '' : 'background: linear-gradient(135deg, var(--accent), var(--accent-dark));'} display:flex; align-items:center; justify-content:center; color:white; box-shadow: 0 0 30px var(--accent-glow); overflow:hidden;">
              ${brandKit?.logo_url
      ? `<img src="${brandKit.logo_url}" alt="Logo" style="width:100%;height:100%;object-fit:cover;" />`
      : icon('crosshair', 32)}
            </div>
            <div>
              <div style="font-size:14px; font-weight:600; margin-bottom:4px;">${brandKit?.logo_url ? 'Logo personalizado' : 'Sin logo'}</div>
              <div class="text-xs text-muted mb-sm">512x512px recomendado</div>
              <button class="btn btn-secondary btn-sm" id="btn-change-logo">${icon('upload', 14)} ${brandKit?.logo_url ? 'Cambiar' : 'Subir'} Logo</button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="card mb-md">
          <div class="card-header">
            <div class="card-title">${icon('palette', 16)} Paleta de Colores</div>
            <span class="badge badge-success">Máx. Contraste</span>
          </div>
          <p class="text-sm text-muted mb-md">Colores optimizados para máximo contraste en miniaturas.</p>
          <div class="flex gap-md mb-lg" style="flex-wrap:wrap;">
            ${colors.map(c => `
              <div style="text-align:center;">
                <div class="color-swatch" style="background: ${c}; width:56px; height:56px;"></div>
                <div class="text-xs text-muted mt-sm font-mono">${c}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">${icon('type', 16)} Tipografía</div></div>
          <div class="form-group">
            <label class="form-label">Fuente de Interfaz</label>
            <div class="card" style="padding: var(--space-md); background: var(--bg-tertiary);">
              <div style="font-family: var(--font-sans); font-size: 24px; font-weight: 700; margin-bottom: var(--space-xs);">${brandKit?.font_interface || 'Inter'} — Font Principal</div>
              <div style="font-family: var(--font-sans); font-size: 14px; color: var(--text-secondary);">ABCDEFGHIJKLMabcdefghijklm 0123456789</div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Fuente de Miniaturas</label>
            <div class="card" style="padding: var(--space-md); background: var(--bg-tertiary);">
              <div style="font-family: var(--font-impact); font-size: 28px; letter-spacing: 2px; margin-bottom: var(--space-xs); color: var(--accent-light);">${brandKit?.font_thumbnails || 'BANGERS'} — THUMBNAILS</div>
              <div style="font-family: var(--font-impact); font-size: 16px; color: var(--text-secondary); letter-spacing: 1px;">ABCDEFGHIJKLM 0123456789</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  // Face Upload
  const faceUploadZone = document.getElementById('face-upload-zone');
  if (faceUploadZone) {
    faceUploadZone.addEventListener('click', () => {
      const expression = prompt('Nombre de la expresión (ej: Sorpresa, Confianza, Pensando):');
      if (!expression) return;
      triggerFileInput('image/*', async (file) => {
        try {
          const url = await uploadToStorage('faces', file, activeChannelId);
          await supabase.from('face_vault').insert({
            channel_id: activeChannelId,
            expression_type: expression,
            image_url: url
          });
          renderBrand(container);
        } catch (err) { alert('Error: ' + err.message); }
      });
    });
  }

  // Delete faces
  container.querySelectorAll('.btn-delete-face').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('¿Eliminar esta expresión?')) return;
      await supabase.from('face_vault').delete().eq('id', btn.dataset.faceId);
      renderBrand(container);
    });
  });

  // Logo Upload
  document.getElementById('btn-change-logo')?.addEventListener('click', () => {
    triggerFileInput('image/*', async (file) => {
      try {
        const url = await uploadToStorage('logos', file, activeChannelId);
        await supabase.from('brand_kits').upsert({
          channel_id: activeChannelId,
          logo_url: url,
          primary_color: brandKit?.primary_color || '#DC2626',
          secondary_color: brandKit?.secondary_color || '#10B981',
        }, { onConflict: 'channel_id' });
        renderBrand(container);
      } catch (err) { alert('Error: ' + err.message); }
    });
  });

  // Analyze ADN
  document.getElementById('btn-analyze-adn')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-analyze-adn');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = `<span class="animate-pulse">${icon('clock', 14)}</span> Analizando...`;
    btn.disabled = true;

    try {
      // Fetch channel info
      const { data: channel } = await supabase.from('channels').select('*').eq('id', activeChannelId).single();

      // MOCK IA ANALYSIS (This would be a call to an Edge Function or AI API)
      // System Prompt 1 logic
      const mockAdn = {
        niche: channel.niche || 'Tech/IA',
        tone: 'Agresivo, Directo, High-Energy',
        visual_style: 'Dark Mode, Neones, Tipografía Impact',
        target_audience: 'Aspirantes a creadores y entusiastas de IA',
        psychology: 'Curiosidad extrema y miedo a quedarse atrás (FOMO)'
      };

      await supabase.from('brand_kits').upsert({
        channel_id: activeChannelId,
        channel_adn: mockAdn
      }, { onConflict: 'channel_id' });

      alert('¡ADN del canal analizado y guardado!');
      renderBrand(container);
    } catch (err) {
      alert('Error en el análisis: ' + err.message);
    } finally {
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }
  });

  // Save brand
  document.getElementById('btn-save-brand')?.addEventListener('click', async () => {
    try {
      await supabase.from('brand_kits').upsert({
        channel_id: activeChannelId,
        primary_color: brandKit?.primary_color || '#DC2626',
        secondary_color: brandKit?.secondary_color || '#10B981',
        colors: colors,
        font_interface: brandKit?.font_interface || 'Inter',
        font_thumbnails: brandKit?.font_thumbnails || 'Bangers',
        logo_url: brandKit?.logo_url || null,
      }, { onConflict: 'channel_id' });
      alert('¡Brand Kit guardado!');
    } catch (err) { alert('Error: ' + err.message); }
  });
}
