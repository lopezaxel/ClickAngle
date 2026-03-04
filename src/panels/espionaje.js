import { COMPETITOR_REFS } from '../data/mockData.js';
import { icon } from '../icons.js';

// In-memory storage for uploaded images
const uploadedThumbnails = [];
const savedReferences = [...COMPETITOR_REFS];
let lastAnalyzedImage = null;

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

async function handleImageUpload(file, container) {
  if (!file || !file.type.startsWith('image/')) return;
  const dataURL = await readFileAsDataURL(file);
  lastAnalyzedImage = { dataURL, fileName: file.name };
  uploadedThumbnails.push({ dataURL, fileName: file.name, date: new Date().toISOString() });
  renderEspionaje(container);
}

export function renderEspionaje(container) {
  container.innerHTML = `<div class="animate-in">
    <div class="section-header">
      <div>
        <h2 class="section-title">${icon('eye', 22)} Análisis Visual — Espionaje</h2>
        <p class="section-subtitle">Decodifica las miniaturas de tu competencia con IA</p>
      </div>
      <button class="btn btn-primary btn-sm" id="btn-upload-thumb">${icon('upload', 14)} Subir Miniatura</button>
    </div>

    <div class="card mb-lg">
      <div class="upload-zone" id="competitor-drop-zone" style="cursor:pointer;">
        ${lastAnalyzedImage
      ? `<div style="position:relative;width:100%;max-width:400px;margin:0 auto;">
              <img src="${lastAnalyzedImage.dataURL}" alt="Uploaded" style="width:100%;border-radius:var(--radius-md);border:1px solid var(--border);" />
              <div class="flex gap-sm mt-md" style="justify-content:center;">
                <button class="btn btn-secondary btn-sm" id="btn-download-uploaded">${icon('download', 14)} Descargar</button>
                <button class="btn btn-ghost btn-sm" id="btn-clear-uploaded">${icon('trash', 14)} Limpiar</button>
              </div>
            </div>`
      : `<div style="opacity:0.4;margin-bottom:var(--space-sm);">${icon('image', 40)}</div>
            <div class="upload-zone-text">Arrastra miniaturas de la competencia para análisis</div>
            <div class="upload-zone-hint">PNG, JPG, WEBP — Click o arrastra un archivo. La IA analizará composición, colores y texto</div>`
    }
      </div>
    </div>

    <div class="section-header">
      <div class="card-title">${icon('grid', 16)} Referencias de Estilos Guardadas</div>
      <span class="badge badge-neutral">${savedReferences.length} canales</span>
    </div>

    <div class="grid-3 mb-lg">
      ${savedReferences.map((ref, idx) => `
        <div class="card" style="cursor: pointer;">
          <div style="background: linear-gradient(135deg, #0f0f23, #1a1a3e); border-radius: var(--radius-md); margin-bottom: var(--space-md); aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; color: var(--text-tertiary); overflow:hidden;">
            ${ref.imageURL
        ? `<img src="${ref.imageURL}" alt="${ref.channel}" style="width:100%;height:100%;object-fit:cover;" />`
        : icon('image', 36)
      }
          </div>
          <div class="flex items-center justify-between mb-sm">
            <span style="font-size:14px; font-weight:700;">${ref.channel}</span>
            <span class="badge badge-success">${ref.ctr} CTR</span>
          </div>
          <p class="text-sm text-muted mb-md">${ref.style}</p>
          <div class="flex gap-xs">
            <button class="btn btn-secondary btn-sm" style="flex:1;">${icon('dna', 14)} Analizar</button>
            <button class="btn btn-ghost btn-sm btn-delete-ref" data-ref-idx="${idx}">${icon('trash', 14)}</button>
          </div>
        </div>
      `).join('')}
      <div class="card" id="btn-add-reference" style="display:flex; flex-direction:column; align-items:center; justify-content:center; border-style: dashed; cursor: pointer; min-height: 280px; color:var(--text-tertiary);">
        ${icon('plus', 32)}
        <span class="text-sm text-muted mt-md">Añadir Canal de Referencia</span>
      </div>
    </div>

    <div class="card" style="border-color: var(--accent); border-width: 1px;">
      <div class="card-header">
        <div class="card-title">${icon('eye', 16)} Análisis IA — Última Miniatura Analizada</div>
        <span class="badge badge-accent">Gemini Vision</span>
      </div>
      <div class="grid-2" style="grid-template-columns: 1fr 2fr;">
        <div style="background: linear-gradient(135deg, #0d0d1a, #1a0a2e); border-radius: var(--radius-md); aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); color: var(--text-tertiary); overflow:hidden;">
          ${lastAnalyzedImage
      ? `<img src="${lastAnalyzedImage.dataURL}" alt="Analyzed" style="width:100%;height:100%;object-fit:cover;" />`
      : icon('image', 48)
    }
        </div>
        <div>
          <div class="grid-3 mb-md" style="grid-template-columns: repeat(3, 1fr);">
            <div class="card" style="padding:var(--space-md); text-align:center;">
              <div class="text-xs text-muted mb-sm">Composición</div>
              <div class="font-bold text-accent">Regla de Tercios</div>
            </div>
            <div class="card" style="padding:var(--space-md); text-align:center;">
              <div class="text-xs text-muted mb-sm">Color Dominante</div>
              <div class="flex gap-xs items-center" style="justify-content:center;">
                <span class="color-swatch" style="width:20px;height:20px;background:#FF6B35;"></span>
                <span class="font-bold" style="color:#FF6B35;">Naranja</span>
              </div>
            </div>
            <div class="card" style="padding:var(--space-md); text-align:center;">
              <div class="text-xs text-muted mb-sm">Texto</div>
              <div class="font-bold text-success">3 palabras</div>
            </div>
          </div>
          <div class="card" style="padding: var(--space-md); background: var(--bg-tertiary);">
            <div class="text-xs font-bold mb-sm text-muted">DECODIFICACIÓN COMPLETA</div>
            <ul style="font-size:12px; color: var(--text-secondary); line-height:2; list-style: none;">
              <li>— <strong>Layout:</strong> Sujeto centrado, ligeramente a la izquierda. Texto a la derecha.</li>
              <li>— <strong>Paleta:</strong> Fondo oscuro (#0D0D1A) con acento naranja y blanco para texto.</li>
              <li>— <strong>Tipografía:</strong> Sans-serif bold condensada, 3 palabras máximo.</li>
              <li>— <strong>Expresión:</strong> Sorpresa/Urgencia. Mirada directa a cámara.</li>
              <li>— <strong>Efectos:</strong> Glow sutil en texto, viñeta en bordes, sin stickers.</li>
            </ul>
          </div>
          <div class="flex gap-sm mt-md">
            <button class="btn btn-primary btn-sm" id="btn-save-reference">${icon('save', 14)} Guardar como Referencia</button>
            <button class="btn btn-secondary btn-sm">${icon('repeat', 14)} Usar Este Estilo</button>
            ${lastAnalyzedImage ? `<button class="btn btn-ghost btn-sm" id="btn-download-analyzed">${icon('download', 14)} Descargar</button>` : ''}
          </div>
        </div>
      </div>
    </div>
  </div>`;

  // ---- Upload zone: click to upload ----
  const dz = document.getElementById('competitor-drop-zone');
  if (dz) {
    if (!lastAnalyzedImage) {
      dz.addEventListener('click', () => {
        triggerFileInput('image/*', (file) => handleImageUpload(file, container));
      });
    }

    // Drag & drop
    ['dragenter', 'dragover'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.add('drag-over'); }));
    ['dragleave', 'drop'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.remove('drag-over'); }));
    dz.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files[0];
      if (file) handleImageUpload(file, container);
    });
  }

  // Header upload button
  const btnUpload = document.getElementById('btn-upload-thumb');
  if (btnUpload) {
    btnUpload.addEventListener('click', () => {
      triggerFileInput('image/*', (file) => handleImageUpload(file, container));
    });
  }

  // Download uploaded image
  const btnDownloadUploaded = document.getElementById('btn-download-uploaded');
  if (btnDownloadUploaded && lastAnalyzedImage) {
    btnDownloadUploaded.addEventListener('click', (e) => {
      e.stopPropagation();
      downloadDataURL(lastAnalyzedImage.dataURL, lastAnalyzedImage.fileName);
    });
  }

  // Clear uploaded image
  const btnClear = document.getElementById('btn-clear-uploaded');
  if (btnClear) {
    btnClear.addEventListener('click', (e) => {
      e.stopPropagation();
      lastAnalyzedImage = null;
      renderEspionaje(container);
    });
  }

  // Download analyzed image
  const btnDownloadAnalyzed = document.getElementById('btn-download-analyzed');
  if (btnDownloadAnalyzed && lastAnalyzedImage) {
    btnDownloadAnalyzed.addEventListener('click', () => {
      downloadDataURL(lastAnalyzedImage.dataURL, lastAnalyzedImage.fileName);
    });
  }

  // Save as reference
  const btnSaveRef = document.getElementById('btn-save-reference');
  if (btnSaveRef) {
    btnSaveRef.addEventListener('click', () => {
      if (lastAnalyzedImage) {
        savedReferences.push({
          id: Date.now(),
          channel: lastAnalyzedImage.fileName.replace(/\.[^.]+$/, ''),
          style: 'Miniatura analizada — guardada como referencia',
          ctr: '—',
          imageURL: lastAnalyzedImage.dataURL
        });
        renderEspionaje(container);
      }
    });
  }

  // Delete reference
  container.querySelectorAll('.btn-delete-ref').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.refIdx);
      savedReferences.splice(idx, 1);
      renderEspionaje(container);
    });
  });

  // Add reference (opens upload)
  const btnAddRef = document.getElementById('btn-add-reference');
  if (btnAddRef) {
    btnAddRef.addEventListener('click', () => {
      triggerFileInput('image/*', async (file) => {
        const dataURL = await readFileAsDataURL(file);
        savedReferences.push({
          id: Date.now(),
          channel: file.name.replace(/\.[^.]+$/, ''),
          style: 'Referencia agregada manualmente',
          ctr: '—',
          imageURL: dataURL
        });
        renderEspionaje(container);
      });
    });
  }
}
