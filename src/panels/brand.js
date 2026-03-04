import { BRAND_KIT } from '../data/mockData.js';
import { icon } from '../icons.js';

// In-memory storage for uploaded files
const uploadedFaces = [];
let currentLogo = null;

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

function readFileAsDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

function downloadDataURL(dataURL, filename) {
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function renderBrand(container) {
  const faceItems = BRAND_KIT.faces.map(f => {
    const uploaded = uploadedFaces.find(u => u.id === f.id);
    return { ...f, dataURL: uploaded ? uploaded.dataURL : null, fileName: uploaded ? uploaded.fileName : null };
  });

  container.innerHTML = `<div class="animate-in">
    <div class="section-header">
      <div>
        <h2 class="section-title">${icon('palette', 22)} Identidad Visual</h2>
        <p class="section-subtitle">Define tu marca para consistencia en todas las miniaturas</p>
      </div>
      <button class="btn btn-primary btn-sm">${icon('save', 14)} Guardar Cambios</button>
    </div>

    <div class="grid-2" style="grid-template-columns: 1fr 1fr;">
      <div>
        <div class="card mb-md">
          <div class="card-header">
            <div class="card-title">${icon('camera', 16)} Face Vault</div>
            <span class="badge badge-accent">${BRAND_KIT.faces.length} Expresiones</span>
          </div>
          <p class="text-sm text-muted mb-md">Sube fotos con diferentes expresiones. La IA seleccionará la mejor según el ángulo elegido.</p>
          <div class="grid-4 mb-md" style="grid-template-columns: repeat(4, 1fr);">
            ${faceItems.map(f => `
              <div class="card face-slot" data-face-id="${f.id}" style="text-align:center; padding: var(--space-md); cursor:pointer; position:relative;">
                ${f.dataURL
      ? `<div style="width:48px;height:48px;border-radius:50%;margin:0 auto var(--space-sm);overflow:hidden;border:2px solid var(--accent);">
                      <img src="${f.dataURL}" alt="${f.label}" style="width:100%;height:100%;object-fit:cover;" />
                    </div>
                    <button class="btn-download-face" data-face-id="${f.id}" style="position:absolute;top:4px;right:4px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-secondary);font-size:10px;" title="Descargar">${icon('download', 10)}</button>`
      : `<div style="width:48px;height:48px;border-radius:50%;background:var(--bg-tertiary);border:1px solid var(--border);margin:0 auto var(--space-sm);display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);">${icon('user', 20)}</div>`
    }
                <div class="text-xs font-bold">${f.label}</div>
              </div>
            `).join('')}
          </div>
          <div class="upload-zone" id="face-upload-zone" style="padding: var(--space-lg); cursor:pointer;">
            <div style="opacity:0.4;margin-bottom:var(--space-sm);">${icon('upload', 32)}</div>
            <div class="upload-zone-text">Subir nueva expresión</div>
            <div class="upload-zone-hint">PNG, JPG — Fondo transparente recomendado. Click o arrastra un archivo.</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">${icon('image', 16)} Logo del Canal</div></div>
          <div class="flex items-center gap-lg">
            <div id="logo-preview" style="width:80px; height:80px; border-radius: var(--radius-lg); ${currentLogo ? '' : 'background: linear-gradient(135deg, var(--accent), var(--accent-dark));'} display:flex; align-items:center; justify-content:center; color:white; box-shadow: 0 0 30px var(--accent-glow); overflow:hidden;">
              ${currentLogo
      ? `<img src="${currentLogo.dataURL}" alt="Logo" style="width:100%;height:100%;object-fit:cover;" />`
      : icon('crosshair', 32)
    }
            </div>
            <div>
              <div style="font-size:14px; font-weight:600; margin-bottom:4px;">${currentLogo ? currentLogo.fileName : 'ClickAngles Studio'}</div>
              <div class="text-xs text-muted mb-sm">${currentLogo ? 'Logo personalizado' : 'Logo actual — 512x512px'}</div>
              <div class="flex gap-sm">
                <button class="btn btn-secondary btn-sm" id="btn-change-logo">${icon('upload', 14)} Cambiar Logo</button>
                ${currentLogo ? `<button class="btn btn-ghost btn-sm" id="btn-download-logo">${icon('download', 14)} Descargar</button>` : ''}
              </div>
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
          <p class="text-sm text-muted mb-md">Colores optimizados para máximo contraste en miniaturas (Mobile-first).</p>
          <div class="flex gap-md mb-lg" style="flex-wrap:wrap;">
            ${BRAND_KIT.colors.map(c => `
              <div style="text-align:center;">
                <div class="color-swatch" style="background: ${c}; width:56px; height:56px;"></div>
                <div class="text-xs text-muted mt-sm font-mono">${c}</div>
              </div>
            `).join('')}
            <div style="text-align:center;">
              <div class="color-swatch" style="width:56px; height:56px; display:flex; align-items:center; justify-content:center; background: var(--bg-tertiary); border-style: dashed; color:var(--text-tertiary);">${icon('plus', 16)}</div>
              <div class="text-xs text-muted mt-sm">Añadir</div>
            </div>
          </div>
          <div class="card" style="padding: var(--space-md); background: var(--bg-tertiary);">
            <div class="text-xs font-bold mb-sm text-muted">VISTA PREVIA DE CONTRASTE</div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-sm);">
              <div style="background: #DC2626; color: white; padding: var(--space-md); border-radius: var(--radius-md); text-align:center; font-family: var(--font-impact); font-size: 18px; letter-spacing: 1px;">TEXTO CLARO</div>
              <div style="background: #0A0A0A; color: #10B981; padding: var(--space-md); border-radius: var(--radius-md); text-align:center; font-family: var(--font-impact); font-size: 18px; letter-spacing: 1px;">TEXTO NEÓN</div>
              <div style="background: #F5F5F5; color: #0A0A0A; padding: var(--space-md); border-radius: var(--radius-md); text-align:center; font-family: var(--font-impact); font-size: 18px; letter-spacing: 1px;">ALTO IMPACTO</div>
              <div style="background: linear-gradient(135deg, #DC2626, #B91C1C); color: white; padding: var(--space-md); border-radius: var(--radius-md); text-align:center; font-family: var(--font-impact); font-size: 18px; letter-spacing: 1px;">GRADIENTE</div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">${icon('type', 16)} Tipografía</div></div>
          <div class="form-group">
            <label class="form-label">Fuente de Interfaz</label>
            <div class="card" style="padding: var(--space-md); background: var(--bg-tertiary);">
              <div style="font-family: var(--font-sans); font-size: 24px; font-weight: 700; margin-bottom: var(--space-xs);">Inter — Font Principal</div>
              <div style="font-family: var(--font-sans); font-size: 14px; color: var(--text-secondary);">ABCDEFGHIJKLM abcdefghijklm 0123456789</div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Fuente de Miniaturas</label>
            <div class="card" style="padding: var(--space-md); background: var(--bg-tertiary);">
              <div style="font-family: var(--font-impact); font-size: 28px; letter-spacing: 2px; margin-bottom: var(--space-xs); color: var(--accent-light);">BANGERS — THUMBNAILS</div>
              <div style="font-family: var(--font-impact); font-size: 16px; color: var(--text-secondary); letter-spacing: 1px;">ABCDEFGHIJKLM 0123456789</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  // ---- Face Vault Upload ----
  const faceUploadZone = document.getElementById('face-upload-zone');
  if (faceUploadZone) {
    // Click to upload
    faceUploadZone.addEventListener('click', () => {
      triggerFileInput('image/*', async (file) => {
        const dataURL = await readFileAsDataURL(file);
        // Find the first face slot without an image, or use a new slot
        const emptySlot = BRAND_KIT.faces.find(f => !uploadedFaces.find(u => u.id === f.id));
        if (emptySlot) {
          uploadedFaces.push({ id: emptySlot.id, dataURL, fileName: file.name });
        } else {
          // Replace the first one
          uploadedFaces[0] = { id: BRAND_KIT.faces[0].id, dataURL, fileName: file.name };
        }
        renderBrand(container);
      });
    });

    // Drag & drop
    ['dragenter', 'dragover'].forEach(e => faceUploadZone.addEventListener(e, ev => { ev.preventDefault(); faceUploadZone.classList.add('drag-over'); }));
    ['dragleave', 'drop'].forEach(e => faceUploadZone.addEventListener(e, ev => { ev.preventDefault(); faceUploadZone.classList.remove('drag-over'); }));
    faceUploadZone.addEventListener('drop', async (e) => {
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        const dataURL = await readFileAsDataURL(file);
        const emptySlot = BRAND_KIT.faces.find(f => !uploadedFaces.find(u => u.id === f.id));
        if (emptySlot) {
          uploadedFaces.push({ id: emptySlot.id, dataURL, fileName: file.name });
        } else {
          uploadedFaces[0] = { id: BRAND_KIT.faces[0].id, dataURL, fileName: file.name };
        }
        renderBrand(container);
      }
    });
  }

  // Click on face slots to upload/replace
  container.querySelectorAll('.face-slot').forEach(slot => {
    slot.addEventListener('click', (e) => {
      if (e.target.closest('.btn-download-face')) return;
      const faceId = parseInt(slot.dataset.faceId);
      triggerFileInput('image/*', async (file) => {
        const dataURL = await readFileAsDataURL(file);
        const existing = uploadedFaces.findIndex(u => u.id === faceId);
        if (existing >= 0) {
          uploadedFaces[existing] = { id: faceId, dataURL, fileName: file.name };
        } else {
          uploadedFaces.push({ id: faceId, dataURL, fileName: file.name });
        }
        renderBrand(container);
      });
    });
  });

  // Download face buttons
  container.querySelectorAll('.btn-download-face').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const faceId = parseInt(btn.dataset.faceId);
      const face = uploadedFaces.find(u => u.id === faceId);
      if (face) downloadDataURL(face.dataURL, face.fileName || `expression-${faceId}.png`);
    });
  });

  // ---- Logo Upload ----
  const btnChangeLogo = document.getElementById('btn-change-logo');
  if (btnChangeLogo) {
    btnChangeLogo.addEventListener('click', () => {
      triggerFileInput('image/*', async (file) => {
        const dataURL = await readFileAsDataURL(file);
        currentLogo = { dataURL, fileName: file.name };
        renderBrand(container);
      });
    });
  }

  // Download logo
  const btnDownloadLogo = document.getElementById('btn-download-logo');
  if (btnDownloadLogo && currentLogo) {
    btnDownloadLogo.addEventListener('click', () => {
      downloadDataURL(currentLogo.dataURL, currentLogo.fileName || 'logo.png');
    });
  }
}
