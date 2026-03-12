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

// Helper to compress image before uploading
async function compressImage(file, maxWidth = 1024, maxHeight = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height *= maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width *= maxHeight / height));
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          // Keep original file name but force jpg for consistency and size
          const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(newFile);
        }, 'image/jpeg', quality);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

async function uploadToStorage(bucket, file, channelId) {
  try {
    const { session } = getState();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    const ext = file.name.split('.').pop();
    // Path must start with userId to satisfy RLS update/delete policies
    const fileName = `${userId}/channels/${channelId}/${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file, {
      cacheControl: '3600',
      upsert: false // Use false to avoid update permission issues on initial upload
    });
    
    if (uploadError) throw uploadError;
    
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return urlData.publicUrl;
  } catch (err) {
    console.error(`Storage Upload Error (${bucket}):`, err);
    throw new Error(`Error al subir a ${bucket}: ` + (err.message || 'Error desconocido'));
  }
}


export async function renderBrand(container) {
  const { activeChannelId } = getState();
  const route = 'brand';
  if (!activeChannelId) { 
    container.innerHTML = '<div class="loading-spinner">Selecciona un canal para continuar</div>'; 
    return; 
  }

  container.innerHTML = `<div class="loading-spinner"><span class="animate-pulse">${icon('clock', 24)}</span></div>`;

  try {
    // Fetch data in parallel
    const [brandRes, facesRes, thumbsRes] = await Promise.all([
      supabase.from('brand_kits').select('*').eq('channel_id', activeChannelId).maybeSingle(),
      supabase.from('face_vault').select('*').eq('channel_id', activeChannelId).order('created_at', { ascending: true }),
      supabase.from('creator_thumbnails').select('*').eq('channel_id', activeChannelId).order('created_at', { ascending: false })
    ]);

    // Safety check: is this route still active?
    if (window.location.hash.slice(1) !== route) return;

    if (brandRes.error || facesRes.error || thumbsRes.error) {
        throw new Error("No pudimos conectar con la base de datos de identidad.");
    }

    const brandKit = brandRes.data;
    const faceList = facesRes.data || [];
    const thumbList = thumbsRes.data || [];
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
              <div class="flex gap-xs items-center">
                <button class="btn btn-secondary btn-xs" id="btn-analyze-faces" title="Analizar rasgos faciales con IA" ${faceList.length === 0 ? 'disabled' : ''}>
                  ${icon('brain', 12)} Analizar
                </button>
                <span class="badge ${brandKit?.face_analysis ? 'badge-accent' : 'badge-neutral'}">${brandKit?.face_analysis ? 'Analizado' : 'Pendiente'}</span>
              </div>
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

    // --- Handlers --- (keeping existing logic but ensuring container is still valid)
    const setupHandlers = () => {
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
            await supabase.from('brand_kits').upsert({ channel_id: activeChannelId, detailed_adn: analysis }, { onConflict: 'channel_id' });
            renderBrand(container);
          } catch (err) { alert('Error: ' + err.message); }
          finally { if (btn) { btn.innerHTML = originalHtml; btn.disabled = false; } }
        });

        // Other handlers... (truncated for brevity in explanation, but including them in output)
        document.getElementById('btn-upload-creator-thumb')?.addEventListener('click', () => {
          triggerFileInput('image/*', async (file) => {
            const btn = document.getElementById('btn-upload-creator-thumb');
            const originalHtml = btn.innerHTML;
            try {
              btn.innerHTML = `<span class="animate-pulse">${icon('clock', 16)}</span><span class="text-xs ml-xs">Procesando...</span>`;
              btn.style.opacity = '1';
              btn.style.transform = 'none'; // prevent hover scale during upload
              
              const compressedFile = await compressImage(file);
              btn.innerHTML = `<span class="animate-pulse">${icon('upload', 16)}</span><span class="text-xs ml-xs">Subiendo...</span>`;
              
              const url = await uploadToStorage('references', compressedFile, activeChannelId);
              const { error: dbError } = await supabase.from('creator_thumbnails').insert({ 
                channel_id: activeChannelId, 
                image_url: url 
              });
              
              if (dbError) throw dbError;
              renderBrand(container);
            } catch (err) { 
              console.error('Upload Error:', err);
              alert('No se pudo guardar la miniatura: ' + err.message); 
              if (btn) btn.innerHTML = originalHtml; // Revert only on error, otherwise renderBrand replaces it
            }
          });
        });

        document.getElementById('btn-upload-face')?.addEventListener('click', () => uploadFace());
        container.querySelectorAll('.empty-face-slot').forEach(slot => {
            slot.addEventListener('click', () => {
              if (slot.classList.contains('uploading')) return; // Prevent double clicks
              uploadFace(slot.dataset.suggested, slot);
            });
        });

        const uploadFace = (suggested, slotElement = null) => {
            triggerFileInput('image/*', async (file) => {
                const btn = document.getElementById('btn-upload-face');
                const originalBtnHtml = btn ? btn.innerHTML : '';
                const originalSlotHtml = slotElement ? slotElement.innerHTML : '';

                try {
                    const expression = prompt('Tipo de expresión:', suggested || 'Normal');
                    if (!expression) return;
                    
                    // UI Feedback
                    if (btn && !slotElement) {
                        btn.innerHTML = `<span class="animate-pulse">${icon('clock', 14)}</span> Procesando imagen...`;
                        btn.disabled = true;
                    }
                    if (slotElement) {
                        slotElement.classList.add('uploading');
                        slotElement.innerHTML = `<div style="width:48px;height:48px;border-radius:50%;background:var(--bg-tertiary);margin:0 auto var(--space-sm);display:flex;align-items:center;justify-content:center;color:var(--accent);" class="animate-pulse">${icon('clock', 18)}</div>
                                                 <div class="text-xs font-bold text-muted">Subiendo...</div>`;
                    }
                    
                    const compressedFile = await compressImage(file);

                    if (btn && !slotElement) {
                         btn.innerHTML = `<span class="animate-pulse">${icon('upload', 14)}</span> Subiendo a la nube...`;
                    }

                    const url = await uploadToStorage('faces', compressedFile, activeChannelId);
                    const { error: dbError } = await supabase.from('face_vault').insert({ 
                        channel_id: activeChannelId, 
                        expression_type: expression, 
                        image_url: url 
                    });
                    
                    if (dbError) throw dbError;
                    
                    // Success! Re-render to show new face
                    renderBrand(container);
                } catch (err) { 
                    console.error('Face Upload Error:', err);
                    alert('No se pudo guardar el rostro: ' + err.message); 
                    // Revert UI on error
                    if (btn && !slotElement) {
                        btn.innerHTML = originalBtnHtml;
                        btn.disabled = false;
                    }
                    if (slotElement) {
                        slotElement.classList.remove('uploading');
                        slotElement.innerHTML = originalSlotHtml;
                    }
                }
            });
        };

        // Face Analysis Logic
        document.getElementById('btn-analyze-faces')?.addEventListener('click', async () => {
          const btn = document.getElementById('btn-analyze-faces');
          if (faceList.length === 0) return;
          const originalHtml = btn.innerHTML;
          try {
            btn.innerHTML = `<span class="animate-pulse">${icon('clock', 12)}</span>...`;
            btn.disabled = true;
            
            const faceUrls = faceList.map(f => f.image_url);
            const analysis = await callAI('FACE_ANALYSIS', `Analiza los rasgos físicos y estilo de estas fotos del creador: ${faceUrls.join(', ')}`, { faces: faceList });
            
            const { error } = await supabase.from('brand_kits').upsert({ 
              channel_id: activeChannelId, 
              face_analysis: analysis 
            }, { onConflict: 'channel_id' });
            
            if (error) throw error;
            renderBrand(container);
          } catch (err) { 
            console.error('Face Analysis error:', err);
            alert('Error al analizar rostros: ' + err.message); 
          }
          finally { if (btn) { btn.innerHTML = originalHtml; btn.disabled = false; } }
        });

        container.querySelectorAll('.btn-delete-face').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (!confirm('¿Eliminar rostro permanentemente?')) return;
            try {
              const faceId = btn.dataset.faceId;
              const face = faceList.find(f => f.id === faceId);
              
              // 1. Delete from Storage if we have a URL
              if (face && face.image_url) {
                try {
                  // Extract path from public URL
                  // URL format: .../storage/v1/object/public/faces/USER_ID/channels/CHANNEL_ID/FILE.ext
                  const urlParts = face.image_url.split('/public/faces/');
                  if (urlParts.length > 1) {
                    const storagePath = urlParts[1];
                    await supabase.storage.from('faces').remove([storagePath]);
                  }
                } catch (storageErr) {
                  console.warn('Could not delete file from storage:', storageErr);
                }
              }

              // 2. Delete from DB
              const { error } = await supabase.from('face_vault').delete().eq('id', faceId);
              if (error) throw error;
              
              renderBrand(container);
            } catch (err) {
              alert('Error al eliminar: ' + err.message);
            }
          });
        });

        container.querySelectorAll('.btn-delete-thumb').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (!confirm('¿Eliminar miniatura?')) return;
            const thumbId = btn.dataset.thumbId;
            const thumb = thumbList.find(t => t.id === thumbId);
            
            if (thumb && thumb.image_url) {
                const urlParts = thumb.image_url.split('/public/references/');
                if (urlParts.length > 1) {
                    await supabase.storage.from('references').remove([urlParts[1]]).catch(e => console.warn(e));
                }
            }

            await supabase.from('creator_thumbnails').delete().eq('id', thumbId);
            renderBrand(container);
          });
        });

        document.getElementById('btn-save-brand')?.addEventListener('click', () => alert('Configuración guardada localmente.'));
    };

    setupHandlers();

  } catch (err) {
    console.error('Brand Kit error:', err);
    container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-secondary);"><div style="font-size:32px;margin-bottom:12px;color:var(--danger);">${icon('alertTriangle', 32)}</div><h3>Error de Identidad</h3><p class="text-sm">${err.message}</p></div>`;
  }
}
