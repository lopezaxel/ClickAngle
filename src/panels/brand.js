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

const CURATED_PALETTES = [
  { id: 'crimson', name: 'Crimson Rush', colors: ['#DC2626', '#FFFFFF', '#1A1A1A'], description: 'Estilo MrBeast: Alto contraste y urgencia.' },
  { id: 'midnight', name: 'Neon Midnight', colors: ['#06B6D4', '#8B5CF6', '#0F172A'], description: 'Gaming & Tech: Vibras futuristas y profundas.' },
  { id: 'golden', name: 'Golden Authority', colors: ['#F59E0B', '#F5F5F5', '#171717'], description: 'Negocios & Lujo: Elegancia y autoridad.' },
  { id: 'vibrant', name: 'Vibrant Nature', colors: ['#84CC16', '#ECFCCB', '#14532D'], description: 'Vlogs & Salud: Energía y frescura.' },
  { id: 'classic', name: 'Classic Impact', colors: ['#FFFFFF', '#000000', '#DC2626'], description: 'Contraste Absoluto: Legibilidad máxima.' }
];

const PRO_FONTS = [
  { id: 'Bangers', name: 'Bangers', style: 'font-family: Bangers, cursive;' },
  { id: 'Luckiest Guy', name: 'Luckiest Guy', style: 'font-family: "Luckiest Guy", cursive;' },
  { id: 'Anton', name: 'Anton', style: 'font-family: Anton, sans-serif;' },
  { id: 'Russo One', name: 'Russo One', style: 'font-family: "Russo One", sans-serif;' },
  { id: 'Inter', name: 'Inter', style: 'font-family: Inter, sans-serif;' }
];

async function uploadToStorage(bucket, file, channelId) {
  try {
    // Always get a fresh session before uploading
    const { data: { session: freshSession } } = await supabase.auth.getSession();
    const userId = freshSession?.user?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    const ext = file.name.split('.').pop();
    // Path must start with userId to satisfy RLS update/delete policies
    const fileName = `${userId}/channels/${channelId}/${Date.now()}.${ext}`;

    console.log(`[Storage] Uploading to ${bucket}/${fileName}, size: ${file.size} bytes, type: ${file.type}`);

    const { data: uploadData, error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

    if (uploadError) {
      console.error(`[Storage] Upload error:`, uploadError);
      throw uploadError;
    }

    console.log(`[Storage] Upload OK:`, uploadData);
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return urlData.publicUrl;
  } catch (err) {
    console.error(`Storage Upload Error (${bucket}):`, err);
    // Give a more descriptive error for network failures
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error('Error de red al subir imagen. Verifica tu conexión e inténtalo de nuevo.');
    }
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
          <button class="btn btn-primary btn-sm" id="btn-save-brand">${icon('save', 14)} Guardar Configuración</button>
        </div>
      </div>

      <div class="grid-2" style="grid-template-columns: 1fr 1fr;">
        <div>
          <!-- ADN DEL CANAL (SIDE-BY-SIDE) -->
          <div class="card mb-md">
            <div class="card-header">
              <div class="card-title">${icon('dna', 16)} ADN Estratégico</div>
              <span class="badge ${adn ? 'badge-accent' : 'badge-neutral'}">${adn ? 'Definido' : 'Pendiente'}</span>
            </div>
            
            <div class="grid-2 p-md" style="grid-template-columns: 240px 1fr; gap:var(--space-lg); align-items: start;">
              <!-- Left: Hero/Status -->
              <div class="adn-hero-container" style="padding:var(--space-md); min-height:auto;">
                <div style="font-size:24px; color:var(--accent); margin-bottom:var(--space-xs);">${icon('brain', 24)}</div>
                <h3 style="font-size:14px; margin-bottom:4px;">${adn ? 'Estrategia Activa' : 'Sin Analizar'}</h3>
                <p class="text-xs text-muted" style="margin-bottom:var(--space-md);">
                  ${adn ? 'Tu ADN está alimentando a la IA.' : 'Inicia la entrevista para definir tu canal.'}
                </p>
                <button class="btn btn-primary btn-sm w-full" id="btn-start-adn-interview" style="font-size:11px;">
                  ${icon('zap', 12)} ${adn ? 'Reiniciar Análisis' : 'Iniciar Análisis'}
                </button>
              </div>

              <!-- Right: Answers (Editable) -->
              <div id="adn-answers-panel">
                ${adn?.interview ? `
                  <div class="text-xs font-bold text-accent mb-sm" style="letter-spacing:1px;">RESPUESTAS ACTUALES</div>
                  <div class="flex flex-col gap-sm">
                    ${adn.interview.map((item, idx) => `
                      <div class="adn-answer-item group" data-index="${idx}">
                        <div class="text-xs text-muted mb-xs" style="opacity:0.7;">Q: ${item.q}</div>
                        <div class="adn-answer-text" contenteditable="true" style="
                          background: var(--bg-tertiary);
                          padding: var(--space-sm);
                          border-radius: var(--radius-sm);
                          border: 1px solid var(--border);
                          font-size: 13px;
                          line-height: 1.4;
                          transition: all var(--transition-fast);
                        ">${item.a}</div>
                      </div>
                    `).join('')}
                    <button class="btn btn-secondary btn-xs mt-xs hidden" id="btn-save-adn-answers">
                      ${icon('save', 12)} Guardar Cambios y Re-Sintetizar
                    </button>
                  </div>
                ` : `
                  <div class="flex flex-col items-center justify-center h-full text-muted py-md border-dashed" style="border:1px dashed var(--border); border-radius:var(--radius-md);">
                    <div style="font-size:24px; opacity:0.3; margin-bottom:var(--space-xs);">${icon('messageSquare', 24)}</div>
                    <div class="text-xs">Aquí aparecerá tu entrevista</div>
                  </div>
                `}
              </div>
            </div>
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
              ${(() => {
                const allLabels = ['Normal', 'Sorpresa', 'Señalando', 'Emocionado'];
                const usedLabels = faceList.map(f => f.expression_type);
                const emptySlots = allLabels.filter(l => !usedLabels.includes(l)).slice(0, 4 - faceList.length);
                return emptySlots.map(label => `
                  <div class="card empty-face-slot" data-suggested="${label}" style="text-align:center; padding: var(--space-md); opacity:0.6; cursor:pointer; border: 1px dashed var(--border);">
                    <div style="width:48px;height:48px;border-radius:50%;background:var(--bg-tertiary);margin:0 auto var(--space-sm);display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);">${icon('plus', 18)}</div>
                    <div class="text-xs font-bold">${label}</div>
                  </div>
                `).join('');
              })()}
            </div>
            <button class="btn btn-secondary btn-sm w-full" id="btn-upload-face">${icon('upload', 14)} Subir Rostro</button>
          </div>
               <div>
          <!-- MINIATURE STUDIO (PREVIEW) -->
          <div class="card mb-md" style="background: var(--bg-tertiary); border: 1px solid var(--border-accent);">
            <div class="card-header">
              <div class="card-title">${icon('monitor', 16)} Miniature Studio</div>
              <span class="badge badge-accent">Live Preview</span>
            </div>
            
            <div id="miniature-studio-preview" class="studio-preview-box" style="
              width: 100%; aspect-ratio: 16/9; 
              background: ${brandKit?.visual_config?.palette?.colors?.[2] || '#1A1A1A'}; 
              border-radius: var(--radius-md); position: relative; overflow: hidden;
              box-shadow: inset 0 0 50px rgba(0,0,0,0.5);
              border: 1px solid var(--border);
            ">
                <!-- Background Glow -->
                <div id="studio-glow" style="
                  position: absolute; top: 0; right: 0; 
                  width: 50%; height: 100%; 
                  background: radial-gradient(circle at center, ${brandKit?.visual_config?.palette?.colors?.[0] || '#DC2626'}44, transparent);
                  filter: blur(40px);
                "></div>
                
                <!-- Mockup Face -->
                <div style="position: absolute; bottom: -10px; right: 20px; width: 45%; height: 90%; 
                     background: url('${faceList[0]?.image_url || 'https://placehold.co/400x600/222/555?text=CREADOR'}');
                     background-size: contain; background-repeat: no-repeat; background-position: bottom;
                     filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));
                "></div>

                <!-- Mockup Text -->
                <div id="studio-text-preview" style="
                  position: absolute; top: 20%; left: 10%; width: 50%;
                  font-family: ${brandKit?.visual_config?.font?.id || 'Bangers'}, sans-serif;
                  font-size: 32px; font-weight: 800; line-height: 1.1;
                  color: ${brandKit?.visual_config?.palette?.colors?.[1] || '#FFFFFF'};
                  text-shadow: 4px 4px 0px ${brandKit?.visual_config?.palette?.colors?.[2] || '#000000'};
                  text-transform: uppercase;
                ">
                  Tus Miniaturas<br/>
                  <span style="color: ${brandKit?.visual_config?.palette?.colors?.[0] || '#DC2626'};">Explosivas</span>
                </div>

                <div style="position:absolute; bottom:10px; left:10px; font-size:9px; font-weight:700; color:white; background:rgba(0,0,0,0.5); padding:2px 6px; border-radius:4px;">
                  10:45
                </div>
            </div>

            <div class="mt-md">
                <label class="form-label">Estilo Tipográfico Pro</label>
                <div class="flex gap-xs" style="flex-wrap:wrap;">
                  ${PRO_FONTS.map(f => `
                    <button class="btn-font-select ${brandKit?.visual_config?.font?.id === f.id ? 'active' : ''}" 
                            data-font-id="${f.id}" 
                            style="${f.style} font-size:12px; padding:6px 12px; cursor:pointer;">
                      ${f.name}
                    </button>
                  `).join('')}
                </div>
            </div>

            <div class="mt-md">
                <label class="form-label">Estudio de Color (Paletas Trend)</label>
                <div class="grid-2" style="grid-template-columns: 1fr 1fr; gap:var(--space-sm);">
                  ${CURATED_PALETTES.map(p => `
                    <div class="card p-sm palette-select ${brandKit?.visual_config?.palette?.id === p.id ? 'active' : ''}" 
                         data-palette-id="${p.id}" 
                         style="cursor:pointer; border: 1px solid var(--border);">
                      <div class="flex gap-xs mb-xs">
                        ${p.colors.map(c => `<div style="width:12px; height:12px; background:${c}; border-radius:3px; border:1px solid rgba(255,255,255,0.1);"></div>`).join('')}
                      </div>
                      <div style="font-size:10px; font-weight:700;">${p.name}</div>
                      <div style="font-size:9px; color:var(--text-tertiary); line-height:1.2;">${p.description}</div>
                    </div>
                  `).join('')}
                </div>
            </div>
          </div>

          <!-- Mis Mejores Miniaturas -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">${icon('image', 16)} Ranking de Inspiración</div>
              <span class="badge badge-success">${thumbList.length} / 6</span>
            </div>
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
        </div>
    </div>
      </div>
    </div>`;

    // --- Handlers --- (keeping existing logic but ensuring container is still valid)
    const setupHandlers = () => {
        // ADN Analysis & Editing
        document.getElementById('btn-start-adn-interview')?.addEventListener('click', () => {
          showADNInterview(activeChannelId, () => renderBrand(container));
        });

        const adnAnswersPanel = document.getElementById('adn-answers-panel');
        const saveAdnBtn = document.getElementById('btn-save-adn-answers');

        if (adnAnswersPanel) {
          adnAnswersPanel.addEventListener('input', (e) => {
            if (e.target.classList.contains('adn-answer-text')) {
              saveAdnBtn?.classList.remove('hidden');
            }
          });
        }

        saveAdnBtn?.addEventListener('click', async () => {
          const originalHtml = saveAdnBtn.innerHTML;
          try {
            saveAdnBtn.innerHTML = `<span class="animate-pulse">${icon('clock', 12)}</span> Re-Sintetizando...`;
            saveAdnBtn.disabled = true;

            const updatedAnswers = Array.from(adnAnswersPanel.querySelectorAll('.adn-answer-item')).map(div => ({
              q: div.querySelector('.text-muted').innerText.replace('Q: ', ''),
              a: div.querySelector('.adn-answer-text').innerText.trim()
            }));

            const { data: channel } = await supabase.from('channels').select('*').eq('id', activeChannelId).single();
            
            // Re-Synthesize
            const synthesis = await callAI('ADN_SYNTHESIS', JSON.stringify({
              channel_info: { name: channel.name, description: channel.description, niche: channel.niche },
              interview: updatedAnswers
            }));

            await supabase.from('brand_kits').upsert({ 
              channel_id: activeChannelId, 
              detailed_adn: { synthesis, interview: updatedAnswers } 
            }, { onConflict: 'channel_id' });

            renderBrand(container);
          } catch (err) {
            alert('Error: ' + err.message);
          } finally {
            saveAdnBtn.innerHTML = originalHtml;
            saveAdnBtn.disabled = false;
          }
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

                    const { session } = getState();
                    console.log('[Face Upload] userId:', session?.user?.id, 'channelId:', activeChannelId, 'file:', compressedFile.name, compressedFile.size + 'bytes');

                    const url = await uploadToStorage('faces', compressedFile, activeChannelId);
                    console.log('[Face Upload] Storage OK, url:', url);

                    const { error: dbError } = await supabase.from('face_vault').insert({
                        channel_id: activeChannelId,
                        expression_type: expression,
                        image_url: url
                    });

                    if (dbError) {
                        console.error('[Face Upload] DB Error:', dbError);
                        throw dbError;
                    }
                    console.log('[Face Upload] DB insert OK');
                    
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

        document.getElementById('btn-upload-face')?.addEventListener('click', () => uploadFace());
        container.querySelectorAll('.empty-face-slot').forEach(slot => {
            slot.addEventListener('click', () => {
              if (slot.classList.contains('uploading')) return;
              uploadFace(slot.dataset.suggested, slot);
            });
        });

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

        // Local state for visual config
        let visualConfig = brandKit?.visual_config || {
            font: PRO_FONTS[0],
            palette: CURATED_PALETTES[0]
        };

        const updateStudioPreview = () => {
            const preview = document.getElementById('miniature-studio-preview');
            const textPreview = document.getElementById('studio-text-preview');
            const glow = document.getElementById('studio-glow');
            if (!preview || !textPreview || !glow) return;

            const p = visualConfig.palette;
            const f = visualConfig.font;

            preview.style.background = p.colors[2];
            glow.style.background = `radial-gradient(circle at center, ${p.colors[0]}44, transparent)`;
            textPreview.style.fontFamily = `'${f.id}', sans-serif`;
            textPreview.style.color = p.colors[1];
            textPreview.style.textShadow = `4px 4px 0px ${p.colors[2]}CC`;
            
            // Internal accent color
            const accentSpan = textPreview.querySelector('span');
            if (accentSpan) accentSpan.style.color = p.colors[0];
        };

        container.querySelectorAll('.btn-font-select').forEach(btn => {
            btn.addEventListener('click', () => {
                const font = PRO_FONTS.find(f => f.id === btn.dataset.fontId);
                visualConfig.font = font;
                container.querySelectorAll('.btn-font-select').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateStudioPreview();
            });
        });

        container.querySelectorAll('.palette-select').forEach(card => {
            card.addEventListener('click', () => {
                const palette = CURATED_PALETTES.find(p => p.id === card.dataset.paletteId);
                visualConfig.palette = palette;
                container.querySelectorAll('.palette-select').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                updateStudioPreview();
            });
        });

        document.getElementById('btn-save-brand')?.addEventListener('click', async () => {
            const btn = document.getElementById('btn-save-brand');
            const originalHtml = btn.innerHTML;
            try {
                btn.innerHTML = `<span class="animate-pulse">${icon('clock', 14)}</span> Guardando...`;
                btn.disabled = true;
                
                const { error } = await supabase.from('brand_kits').upsert({
                    channel_id: activeChannelId,
                    visual_config: visualConfig,
                    colors: visualConfig.palette.colors, // fallback for compatibility
                    font_thumbnails: visualConfig.font.id // fallback for compatibility
                }, { onConflict: 'channel_id' });

                if (error) throw error;
                alert('✓ Identidad de marca guardada con éxito.');
                renderBrand(container);
            } catch (err) {
                alert('Error al guardar: ' + err.message);
            } finally {
                btn.innerHTML = originalHtml;
                btn.disabled = false;
            }
        });
    };

    setupHandlers();

  } catch (err) {
    console.error('Brand Kit error:', err);
    container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-secondary);"><div style="font-size:32px;margin-bottom:12px;color:var(--danger);">${icon('alertTriangle', 32)}</div><h3>Error de Identidad</h3><p class="text-sm">${err.message}</p></div>`;
  }
}

// ── ADN Interview Modal ──────────────────────────────────────────────────
async function showADNInterview(channelId, onComplete) {
    const overlay = document.createElement('div');
    overlay.className = 'interview-overlay';
    document.body.appendChild(overlay);

    const renderCard = (content) => {
        overlay.innerHTML = `<div class="interview-card animate-in">${content}</div>`;
    };

    try {
        renderCard(`
            <div style="text-align:center;">
                <div class="animate-pulse" style="font-size:40px; margin-bottom:var(--space-md);">${icon('brain', 40)}</div>
                <h3 class="interview-question">Generando preguntas estratégicas...</h3>
                <p class="text-sm text-muted">La IA está analizando tu canal para preparar la entrevista.</p>
            </div>
        `);

        const { data: channel } = await supabase.from('channels').select('*').eq('id', channelId).single();
        const interviewData = await callAI('ADN_INTERVIEW', `Canal: ${channel.name}\nDescripción: ${channel.description}\nNicho: ${channel.niche}`);
        const questions = interviewData.questions || [];
        const answers = [];

        for (let i = 0; i < questions.length; i++) {
            await new Promise((resolve, reject) => {
                renderCard(`
                    <div class="interview-step-indicator">Pregunta ${i + 1} de ${questions.length}</div>
                    <div class="interview-question">${questions[i]}</div>
                    <textarea class="interview-input" id="interview-answer" placeholder="Escribe tu respuesta aquí..."></textarea>
                    <div class="interview-actions">
                        <button class="btn btn-ghost" id="btn-cancel-interview">Cancelar</button>
                        <button class="btn btn-primary" id="btn-next-question">
                            ${i === questions.length - 1 ? 'Finalizar Análisis' : 'Siguiente Pregunta ' + icon('arrowRight', 14)}
                        </button>
                    </div>
                `);

                const input = document.getElementById('interview-answer');
                input.focus();

                document.getElementById('btn-cancel-interview').onclick = () => {
                    overlay.remove();
                    reject(new Error("Interview cancelled"));
                };

                document.getElementById('btn-next-question').onclick = () => {
                    const val = input.value.trim();
                    if (!val) {
                        input.style.borderColor = 'var(--danger)';
                        return;
                    }
                    answers.push({ q: questions[i], a: val });
                    resolve();
                };
            });
        }

        // Final Synthesis
        renderCard(`
            <div style="text-align:center;">
                <div class="animate-pulse" style="font-size:40px; color:var(--success); margin-bottom:var(--space-md);">${icon('zap', 40)}</div>
                <h3 class="interview-question">Sintetizando tu ADN de Marca...</h3>
                <p class="text-sm text-muted">Casi listo. Estamos extrayendo los pilares visuales de tu canal.</p>
            </div>
        `);

        const synthesis = await callAI('ADN_SYNTHESIS', JSON.stringify({
            channel_info: { name: channel.name, description: channel.description, niche: channel.niche },
            interview: answers
        }));

        await supabase.from('brand_kits').upsert({ 
            channel_id: channelId, 
            detailed_adn: { synthesis, interview: answers } 
        }, { onConflict: 'channel_id' });

        renderCard(`
            <div style="text-align:center;">
                <div style="font-size:40px; color:var(--success); margin-bottom:var(--space-md);">${icon('checkCircle', 40)}</div>
                <h3 class="interview-question">¡Análisis Completado!</h3>
                <p class="text-sm text-muted mb-lg">Tu ADN estratégico ha sido actualizado con éxito.</p>
                <button class="btn btn-primary w-full" id="btn-finish-interview">Volver al Panel</button>
            </div>
        `);

        document.getElementById('btn-finish-interview').onclick = () => {
            overlay.remove();
            onComplete();
        };

    } catch (err) {
        if (err.message !== "Interview cancelled") {
            console.error(err);
            alert("Error: " + err.message);
        }
        overlay.remove();
    }
}
