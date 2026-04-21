import { supabase } from '../lib/supabase.js';
import { getState } from '../lib/state.js';
import { icon } from '../icons.js';
import { callAI } from '../lib/intelligence.js';
import { showLoader, hideLoader } from '../lib/loader.js';

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

  showLoader(container, { title: 'Cargando identidad de marca...', subtitle: 'Obteniendo tu Brand Kit y referencias de estilo', detail: 'CONSULTANDO BD' });

  try {
    // Fetch data in parallel
    const [brandRes, facesRes, styleRefsRes] = await Promise.all([
      supabase.from('brand_kits').select('*').eq('channel_id', activeChannelId).maybeSingle(),
      supabase.from('face_vault').select('*').eq('channel_id', activeChannelId).order('created_at', { ascending: true }),
      supabase.from('style_references').select('*').eq('channel_id', activeChannelId).order('created_at', { ascending: false })
    ]);

    // Safety check: is this route still active?
    if (window.location.hash.slice(1) !== route) return;

    if (brandRes.error || facesRes.error) {
      throw new Error("No pudimos conectar con la base de datos de identidad.");
    }

    const brandKit = brandRes.data;
    const faceList = facesRes.data || [];
    const styleRefList = styleRefsRes.data || [];
    const colors = brandKit?.colors || ['#DC2626', '#10B981', '#F5F5F5', '#6B7280', '#3B82F6', '#F59E0B'];
    const adn = brandKit?.detailed_adn || brandKit?.channel_adn || null;
    const styleSummary = brandKit?.style_summary || null;

    container.innerHTML = `<div class="animate-in">
      <div class="section-header">
        <div>
          <h2 class="section-title">${icon('palette', 22)} Identidad de Marca</h2>
          <p class="section-subtitle">El ADN completo que alimenta cada generación de miniaturas</p>
        </div>
      </div>

      <!-- ROW 1: ADN Estratégico full-width -->
      <div class="card mb-md">
        <div class="card-header">
          <div class="card-title">${icon('dna', 16)} ADN Estratégico</div>
          <div class="flex gap-xs items-center">
            <span class="badge ${adn ? 'badge-accent' : 'badge-neutral'}">${adn ? 'Activo' : 'Pendiente'}</span>
            <button class="btn btn-primary btn-sm" id="btn-start-adn-interview" style="font-size:11px;">
              ${icon('zap', 12)} ${adn ? 'Reiniciar' : 'Iniciar Análisis'}
            </button>
          </div>
        </div>

        ${adn?.interview ? `
          <div style="display:grid; grid-template-columns: repeat(3,1fr); gap:var(--space-md); padding:var(--space-md);">
            ${adn.interview.map((item, idx) => {
              const pillars = ['🎯 Nicho', '👥 Público', '✨ Tono de Marca'];
              const colors = ['var(--accent)', '#3B82F6', '#10B981'];
              return `
              <div class="adn-answer-item" data-index="${idx}" style="
                background:var(--bg-tertiary); border-radius:var(--radius-md);
                border:1px solid var(--border); overflow:hidden;
              ">
                <div style="
                  padding:6px 12px; font-size:9px; font-weight:800; letter-spacing:2px;
                  text-transform:uppercase; color:${colors[idx] || 'var(--accent)'};
                  border-bottom:1px solid var(--border); background:rgba(255,255,255,0.03);
                ">${pillars[idx] || `Pilar ${idx+1}`}</div>
                <div class="adn-answer-text" contenteditable="true" style="
                  padding:var(--space-sm) var(--space-md);
                  font-size:12px; line-height:1.5; color:var(--text-secondary);
                  outline:none; min-height:60px;
                ">${item.a}</div>
              </div>`}).join('')}
          </div>
          <div style="padding:0 var(--space-md) var(--space-md); display:flex; justify-content:flex-end;">
            <button class="btn btn-secondary btn-xs hidden" id="btn-save-adn-answers">
              ${icon('save', 12)} Guardar y Re-Sintetizar
            </button>
          </div>
        ` : `
          <div style="padding:var(--space-xl); text-align:center; opacity:0.5;">
            <div style="font-size:32px; margin-bottom:var(--space-sm);">${icon('brain', 32)}</div>
            <p class="text-sm text-muted">Iniciá el análisis para definir los 3 pilares estratégicos de tu canal</p>
          </div>
        `}
      </div>

      <!-- ROW 2: Face Vault + Galería de Éxitos side by side -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-md); margin-bottom:var(--space-md);">

        <!-- FACE VAULT -->
          <div class="card mb-md">
            <div class="card-header">
              <div class="card-title">${icon('camera', 16)} Face Vault</div>
              <span class="badge badge-neutral">${faceList.length} foto${faceList.length !== 1 ? 's' : ''}</span>
            </div>

            ${(() => {
              const EMOTION_CONFIG = {
                SORPRESA:  { color: '#F59E0B', icon: '⚡', desc: 'Shock y novedades' },
                AUTORIDAD: { color: '#3B82F6', icon: '👁️', desc: 'Tutoriales y experto' },
                DUDA:      { color: '#8B5CF6', icon: '🤔', desc: 'Comparativas y preguntas' },
                MIEDO:     { color: '#EF4444', icon: '🚨', desc: 'Advertencias y noticias' },
                SEÑALANDO: { color: '#10B981', icon: '👇', desc: 'Dirigir atención' },
              };
              const validLabels = Object.keys(EMOTION_CONFIG);

              const faceCards = faceList.map(face => {
                const label = face.expression_type;
                const isTagged = validLabels.includes(label);
                const em = isTagged ? EMOTION_CONFIG[label] : null;
                const isPending = !isTagged;

                return `
                  <div style="position:relative; border-radius:var(--radius-md); overflow:hidden;">
                    <img src="${face.image_url}" alt="Face" style="
                      width:100%; aspect-ratio:1/1; object-fit:cover; display:block;
                      border:2px solid ${isTagged ? em.color : 'rgba(255,255,255,0.15)'};
                      border-radius:var(--radius-md);
                    "/>
                    <!-- Clickable badge for label editing -->
                    <button class="btn-change-label" data-face-id="${face.id}" data-current-label="${label || ''}" style="
                      position:absolute; bottom:0; left:0; right:0;
                      display:flex; align-items:center; justify-content:center; gap:4px;
                      padding: 5px 6px;
                      background: ${isTagged ? em.color + 'DD' : 'rgba(0,0,0,0.75)'};
                      border: none; cursor:pointer; width:100%;
                      border-top: 1px solid ${isTagged ? em.color + '88' : 'rgba(255,255,255,0.1)'};
                    ">
                      <span style="font-size:11px;">${isTagged ? em.icon : '◌'}</span>
                      <span style="font-size:9px; font-weight:800; letter-spacing:1px; color:white; text-transform:uppercase;">
                        ${isTagged ? label : 'PENDIENTE'}
                      </span>
                      <span style="font-size:9px; color:rgba(255,255,255,0.5); margin-left:2px;">✎</span>
                    </button>
                    <!-- Delete button -->
                    <button class="btn-delete-face" data-face-id="${face.id}" style="
                      position:absolute; top:5px; right:5px;
                      background:rgba(0,0,0,0.7); border:none; border-radius:50%;
                      width:22px; height:22px; display:flex; align-items:center;
                      justify-content:center; cursor:pointer; color:white;
                    " title="Eliminar foto">${icon('trash', 11)}</button>
                    ${isPending ? `<div style="
                      position:absolute; top:5px; left:5px;
                      background:#EF444488; border-radius:3px;
                      padding:2px 5px; font-size:8px; font-weight:800;
                      color:white; letter-spacing:1px;
                    ">SIN ETIQUETA</div>` : ''}
                  </div>`;
              });

              const addSlot = `
                <div id="face-empty-slot" style="
                  aspect-ratio:1/1; border:2px dashed rgba(255,255,255,0.15);
                  border-radius:var(--radius-md); display:flex; flex-direction:column;
                  align-items:center; justify-content:center; cursor:pointer;
                  gap:6px; background: rgba(255,255,255,0.02);
                  transition: all 0.15s ease;
                " onmouseover="this.style.borderColor='rgba(255,255,255,0.35)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.15)'">
                  <span style="font-size:20px; opacity:0.4;">${icon('plus', 22)}</span>
                  <span style="font-size:9px; color:rgba(255,255,255,0.3); letter-spacing:1px; text-transform:uppercase;">Agregar foto</span>
                </div>`;

              return `<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:var(--space-sm); padding:var(--space-md);">
                ${faceCards.join('')}
                ${addSlot}
              </div>`;
            })()}

            <div style="padding: 0 var(--space-md) var(--space-md);">
              <button class="btn btn-secondary btn-sm w-full" id="btn-upload-face">${icon('upload', 14)} Subir Nueva Foto</button>
            </div>
          </div>

        <!-- GALERÍA DE ÉXITOS -->
        <div class="card" style="display:flex; flex-direction:column;">
          <div class="card-header">
            <div class="card-title">${icon('star', 16)} Galería de Éxitos</div>
            <div class="flex gap-xs items-center">
              <button class="btn btn-secondary btn-xs" id="btn-analyze-style"
                ${styleRefList.length === 0 ? 'disabled' : ''}
                title="Analizar estilo visual con IA">
                ${icon('brain', 12)} Analizar Estilo
              </button>
              <span class="badge badge-neutral">${styleRefList.length} / 5</span>
            </div>
          </div>

          <!-- Style summary chip -->
          ${styleSummary ? `
          <div style="
            margin: 0 var(--space-md) var(--space-sm);
            padding: 10px 12px; border-radius:8px;
            background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.08));
            border: 1px solid rgba(16,185,129,0.2);
          ">
            <div style="font-size:9px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:#10B981; margin-bottom:6px;">
              ✦ Firma Visual Detectada
            </div>
            <div style="font-size:11px; color:rgba(255,255,255,0.8); line-height:1.5; margin-bottom:6px;">
              ${styleSummary.visual_style || '—'}
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:4px;">
              ${(styleSummary.palette || []).map(hex => `
                <div style="display:flex;align-items:center;gap:3px;">
                  <div style="width:10px;height:10px;border-radius:2px;background:${hex};border:1px solid rgba(255,255,255,0.2);"></div>
                  <span style="font-size:9px;color:rgba(255,255,255,0.4);">${hex}</span>
                </div>`).join('')}
            </div>
            <div style="font-size:10px; color:rgba(255,255,255,0.4); font-style:italic;">
              ${styleSummary.winning_pattern || ''}
            </div>
          </div>
          ` : ''}

          <!-- Grid of style refs -->
          <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:var(--space-sm); padding:var(--space-sm) var(--space-md); flex:1;">
            ${styleRefList.map(ref => `
              <div style="position:relative; aspect-ratio:16/9; border-radius:var(--radius-sm); overflow:hidden;">
                <img src="${ref.image_url}" style="width:100%;height:100%;object-fit:cover;display:block;"/>
                <button class="btn-delete-styleref" data-ref-id="${ref.id}" style="
                  position:absolute;top:3px;right:3px;
                  background:rgba(0,0,0,0.7);border:none;border-radius:50%;
                  width:20px;height:20px;display:flex;align-items:center;
                  justify-content:center;cursor:pointer;color:white;
                ">${icon('x', 10)}</button>
              </div>`).join('')}
            ${styleRefList.length < 5 ? `
              <div id="btn-upload-styleref" style="
                aspect-ratio:16/9; border:2px dashed rgba(255,255,255,0.15);
                border-radius:var(--radius-sm); display:flex; flex-direction:column;
                align-items:center; justify-content:center; cursor:pointer; gap:4px;
                background:rgba(255,255,255,0.02);
              " onmouseover="this.style.borderColor='rgba(255,255,255,0.35)'"
                 onmouseout="this.style.borderColor='rgba(255,255,255,0.15)'">
                <span style="opacity:0.4;">${icon('plus', 16)}</span>
                <span style="font-size:8px;color:rgba(255,255,255,0.25);letter-spacing:1px;text-transform:uppercase;">Agregar</span>
              </div>` : ''}
          </div>

          <div style="padding:0 var(--space-md) var(--space-md);">
            <button class="btn btn-secondary btn-sm w-full" id="btn-upload-styleref-main">${icon('upload', 14)} Subir Miniatura Exitosa</button>
          </div>
        </div>

      </div><!-- end ROW 2 grid -->
    </div>`;

    // --- Handlers ---
    const setupHandlers = () => {
      // ADN Interview
      document.getElementById('btn-start-adn-interview')?.addEventListener('click', () => {
        showADNInterview(activeChannelId, () => renderBrand(container));
      });

      // ADN inline editing — show save button on change
      container.querySelectorAll('.adn-answer-text').forEach(el => {
        el.addEventListener('input', () => {
          document.getElementById('btn-save-adn-answers')?.classList.remove('hidden');
        });
      });

      document.getElementById('btn-save-adn-answers')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-save-adn-answers');
        const originalHtml = btn.innerHTML;
        try {
          btn.disabled = true;
          showLoader(container, {
            title: 'Re-Sintetizando ADN',
            subtitle: 'La IA está procesando tus respuestas actualizadas para reconstruir los pilares estratégicos del canal.',
            detail: 'ADN SYNTHESIS',
          });

          const updatedAnswers = Array.from(container.querySelectorAll('.adn-answer-item')).map(div => ({
            q: adn.interview[div.dataset.index]?.q || '',
            a: div.querySelector('.adn-answer-text').innerText.trim()
          }));

          const { data: channel } = await supabase.from('channels').select('*').eq('id', activeChannelId).single();
          const synthesis = await callAI('ADN_SYNTHESIS', JSON.stringify({
            channel_info: { name: channel.name, description: channel.description, niche: channel.niche },
            interview: updatedAnswers
          }));

          await supabase.from('brand_kits').upsert({
            channel_id: activeChannelId,
            detailed_adn: { synthesis, interview: updatedAnswers }
          }, { onConflict: 'channel_id' });

          hideLoader();
          renderBrand(container);
        } catch (err) {
          hideLoader();
          alert('Error: ' + err.message);
          btn.innerHTML = originalHtml;
          btn.disabled = false;
        }
      });

      // ── Style References (Galería de Éxitos) ──────────────────────────
      const uploadStyleRef = async () => {
        triggerFileInput('image/*', async (file) => {
          try {
            const compressed = await compressImage(file, 1280, 720, 0.85);
            const url = await uploadToStorage('references', compressed, activeChannelId);
            const { error } = await supabase.from('style_references').insert({
              channel_id: activeChannelId,
              image_url: url
            });
            if (error) throw error;
            renderBrand(container);
          } catch (err) {
            alert('No se pudo guardar la miniatura: ' + err.message);
          }
        });
      };

      document.getElementById('btn-upload-styleref')?.addEventListener('click', uploadStyleRef);
      document.getElementById('btn-upload-styleref-main')?.addEventListener('click', uploadStyleRef);

      // Analyze style with AI
      document.getElementById('btn-analyze-style')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-analyze-style');
        if (styleRefList.length === 0) return;
        const originalHtml = btn.innerHTML;
        try {
          btn.disabled = true;
          showLoader(container, {
            title: 'Analizando Firma Visual',
            subtitle: `Extrayendo paleta, composición, iluminación y patrón ganador de ${styleRefList.length} miniatura${styleRefList.length !== 1 ? 's' : ''} exitosa${styleRefList.length !== 1 ? 's' : ''}.`,
            detail: 'STYLE ANALYSIS',
          });

          const urls = styleRefList.map(r => r.image_url).join('\n');
          const summary = await callAI(
            'STYLE_ANALYSIS',
            `Analiza estas ${styleRefList.length} miniaturas exitosas del creador y extrae su firma visual:\n${urls}`,
            { style_refs: styleRefList }
          );

          // Save style_summary + merge into brand_kit for Fábrica to consume
          await supabase.from('brand_kits').upsert({
            channel_id: activeChannelId,
            style_summary: summary
          }, { onConflict: 'channel_id' });

          renderBrand(container);
        } catch (err) {
          hideLoader();
          alert('Error al analizar estilo: ' + err.message);
        } finally {
          hideLoader();
          if (btn) { btn.innerHTML = originalHtml; btn.disabled = styleRefList.length === 0; }
        }
      });

      // Delete style ref
      container.querySelectorAll('.btn-delete-styleref').forEach(btn => {
        btn.addEventListener('click', async () => {
          const refId = btn.dataset.refId;
          const ref = styleRefList.find(r => r.id === refId);
          if (ref?.image_url) {
            const parts = ref.image_url.split('/public/references/');
            if (parts.length > 1) await supabase.storage.from('references').remove([parts[1]]).catch(() => {});
          }
          await supabase.from('style_references').delete().eq('id', refId);
          renderBrand(container);
        });
      });

      const EMOTION_CONFIG = {
        SORPRESA:  { color: '#F59E0B', icon: '⚡', desc: 'Shock y novedades' },
        AUTORIDAD: { color: '#3B82F6', icon: '👁️', desc: 'Tutoriales y experto' },
        DUDA:      { color: '#8B5CF6', icon: '🤔', desc: 'Comparativas y preguntas' },
        MIEDO:     { color: '#EF4444', icon: '🚨', desc: 'Advertencias y noticias' },
        SEÑALANDO: { color: '#10B981', icon: '👇', desc: 'Dirigir atención' },
      };

      // Show label picker modal — used both at upload time and for re-labeling
      const showLabelPicker = (title = 'Elegí la expresión de esta foto') => {
        return new Promise((resolve) => {
          const overlay = document.createElement('div');
          overlay.style.cssText = `
            position:fixed; inset:0; z-index:9999;
            background:rgba(0,0,0,0.85); backdrop-filter:blur(4px);
            display:flex; align-items:center; justify-content:center;
          `;
          overlay.innerHTML = `
            <div style="
              background:var(--bg-secondary); border:1px solid rgba(255,255,255,0.1);
              border-radius:12px; padding:24px; max-width:340px; width:90%;
              box-shadow: 0 20px 60px rgba(0,0,0,0.6);
            ">
              <div style="font-size:11px; font-weight:900; letter-spacing:2px; text-transform:uppercase;
                color:rgba(255,255,255,0.5); margin-bottom:4px;">Face Vault</div>
              <div style="font-size:15px; font-weight:700; color:white; margin-bottom:18px;">${title}</div>
              <div style="display:flex; flex-direction:column; gap:8px;">
                ${Object.entries(EMOTION_CONFIG).map(([label, em]) => `
                  <button class="label-option-btn" data-label="${label}" style="
                    display:flex; align-items:center; gap:12px;
                    padding:10px 14px; border-radius:8px; cursor:pointer;
                    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
                    text-align:left; width:100%; transition: all 0.12s ease;
                  " onmouseover="this.style.background='${em.color}22'; this.style.borderColor='${em.color}66';"
                     onmouseout="this.style.background='rgba(255,255,255,0.04)'; this.style.borderColor='rgba(255,255,255,0.08)';">
                    <span style="font-size:20px; min-width:28px; text-align:center;">${em.icon}</span>
                    <div>
                      <div style="font-size:12px; font-weight:800; letter-spacing:1px; color:${em.color}; text-transform:uppercase;">${label}</div>
                      <div style="font-size:10px; color:rgba(255,255,255,0.4); margin-top:1px;">${em.desc}</div>
                    </div>
                  </button>
                `).join('')}
              </div>
              <button id="label-cancel" style="
                margin-top:14px; width:100%; padding:8px; border-radius:6px;
                background:transparent; border:1px solid rgba(255,255,255,0.1);
                color:rgba(255,255,255,0.4); font-size:11px; cursor:pointer;
              ">Cancelar</button>
            </div>`;
          document.body.appendChild(overlay);

          overlay.querySelectorAll('.label-option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              overlay.remove();
              resolve(btn.dataset.label);
            });
          });
          document.getElementById('label-cancel').addEventListener('click', () => {
            overlay.remove();
            resolve(null);
          });
        });
      };

      const uploadFace = () => {
        triggerFileInput('image/*', async (file) => {
          // Step 1: ask for label BEFORE uploading
          const chosenLabel = await showLabelPicker('¿Qué expresión muestra esta foto?');
          if (!chosenLabel) return; // user cancelled

          const btn = document.getElementById('btn-upload-face');
          const emptySlot = document.getElementById('face-empty-slot');
          const originalBtnHtml = btn ? btn.innerHTML : '';

          if (emptySlot) {
            emptySlot.innerHTML = `
              <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
                <div style="width:28px;height:28px;border-radius:50%;border:3px solid ${EMOTION_CONFIG[chosenLabel].color};border-top-color:transparent;animation:spin 0.8s linear infinite;"></div>
                <span style="font-size:9px;color:rgba(255,255,255,0.4);">Subiendo...</span>
              </div>`;
            emptySlot.style.pointerEvents = 'none';
          }
          if (btn) { btn.innerHTML = `<span class="animate-pulse">${icon('clock', 14)}</span> Subiendo...`; btn.disabled = true; }

          try {
            const compressedFile = await compressImage(file);
            const url = await uploadToStorage('faces', compressedFile, activeChannelId);

            const { error: dbError } = await supabase.from('face_vault').insert({
              channel_id: activeChannelId,
              expression_type: chosenLabel,
              image_url: url
            });
            if (dbError) throw dbError;
            renderBrand(container);
          } catch (err) {
            console.error('Face Upload Error:', err);
            alert('No se pudo guardar la foto: ' + err.message);
            if (btn) { btn.innerHTML = originalBtnHtml; btn.disabled = false; }
          }
        });
      };

      document.getElementById('btn-upload-face')?.addEventListener('click', () => uploadFace());
      document.getElementById('face-empty-slot')?.addEventListener('click', () => uploadFace());

      // Re-label handler — click on badge to change expression
      container.querySelectorAll('.btn-change-label').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const faceId = btn.dataset.faceId;
          const newLabel = await showLabelPicker('Cambiar expresión de esta foto');
          if (!newLabel) return;

          const { error } = await supabase.from('face_vault')
            .update({ expression_type: newLabel })
            .eq('id', faceId);

          if (error) { alert('Error al actualizar etiqueta: ' + error.message); return; }
          renderBrand(container);
        });
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
    const interviewData = await callAI('ADN_INTERVIEW', `Canal: ${channel.name}`);
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
