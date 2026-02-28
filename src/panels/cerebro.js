import { icon } from '../icons.js';

export function renderCerebro(container) {
  container.innerHTML = `<div class="animate-in">
    <div class="section-header">
      <div>
        <h2 class="section-title">${icon('brain', 22)} El Cerebro</h2>
        <p class="section-subtitle">Sube tu guión y extrae el ADN del video — Hook, Tensión y Promesa</p>
      </div>
    </div>

    <div class="grid-2" style="grid-template-columns: 1fr 1fr;">
      <div>
        <div class="card mb-md">
          <div class="card-header">
            <div class="card-title">${icon('upload', 16)} Subir Guión</div>
            <span class="badge badge-neutral">Drag & Drop</span>
          </div>
          <div class="upload-zone" id="script-drop-zone">
            <div class="upload-zone-icon" style="font-size:20px;opacity:0.4;">${icon('file', 40)}</div>
            <div class="upload-zone-text">Arrastra tu guión aquí o haz clic para subir</div>
            <div class="upload-zone-hint">.txt, .md, .doc — Máx. 50KB</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">O pega tu texto directamente</div></div>
          <textarea class="form-textarea" id="script-input" placeholder="Pega tu guión aquí... El sistema analizará el contenido para extraer los elementos clave que maximizan el CTR." style="min-height:180px;"></textarea>
          <div class="flex justify-between items-center mt-md">
            <span class="text-xs text-muted" id="char-count">0 caracteres</span>
            <button class="btn btn-primary" id="btn-process-script">${icon('dna', 16)} Procesar ADN</button>
          </div>
        </div>
      </div>

      <div>
        <div class="card mb-md" style="border-color: var(--accent); border-width: 1px;">
          <div class="card-header">
            <div class="card-title">${icon('dna', 16)} ADN del Video</div>
            <span class="badge badge-accent">IA Procesado</span>
          </div>
          <div class="card mb-md" style="border-left: 3px solid var(--accent); padding: var(--space-md);">
            <div class="flex items-center gap-sm mb-sm">
              ${icon('link', 20)}
              <div>
                <div style="font-size:13px; font-weight:700; color: var(--accent-light);">HOOK</div>
                <div class="text-xs text-muted">Los primeros 3 segundos que atrapan</div>
              </div>
            </div>
            <div style="font-size:13px; color: var(--text-secondary); line-height:1.6; padding: var(--space-sm); background: var(--bg-tertiary); border-radius: var(--radius-md);">
              "¿Sabías que el 90% de los programadores están usando IA de forma incorrecta? Hoy te voy a mostrar el método que nadie te enseña..."
            </div>
          </div>
          <div class="card mb-md" style="border-left: 3px solid var(--warning); padding: var(--space-md);">
            <div class="flex items-center gap-sm mb-sm">
              ${icon('bolt', 20)}
              <div>
                <div style="font-size:13px; font-weight:700; color: var(--warning);">TENSIÓN</div>
                <div class="text-xs text-muted">El conflicto central que mantiene la atención</div>
              </div>
            </div>
            <div style="font-size:13px; color: var(--text-secondary); line-height:1.6; padding: var(--space-sm); background: var(--bg-tertiary); border-radius: var(--radius-md);">
              "La mayoría de herramientas de IA prometen productividad pero crean dependencia. El verdadero problema es que estás automatizando las tareas equivocadas..."
            </div>
          </div>
          <div class="card" style="border-left: 3px solid var(--success); padding: var(--space-md);">
            <div class="flex items-center gap-sm mb-sm">
              ${icon('crosshair', 20)}
              <div>
                <div style="font-size:13px; font-weight:700; color: var(--success-light);">PROMESA</div>
                <div class="text-xs text-muted">Lo que el espectador obtendrá al final</div>
              </div>
            </div>
            <div style="font-size:13px; color: var(--text-secondary); line-height:1.6; padding: var(--space-sm); background: var(--bg-tertiary); border-radius: var(--radius-md);">
              "Al terminar este video tendrás un framework de 3 pasos para usar IA que triplica tu productividad real, no la percibida."
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">${icon('hash', 16)} Palabras Clave Extraídas</div></div>
          <div class="flex gap-sm" style="flex-wrap:wrap;">
            <span class="badge badge-accent">Productividad IA</span>
            <span class="badge badge-accent">Framework</span>
            <span class="badge badge-accent">Automatización</span>
            <span class="badge badge-success">Programación</span>
            <span class="badge badge-success">Workflow</span>
            <span class="badge badge-warning">Dependencia Tecnológica</span>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  const dz = document.getElementById('script-drop-zone');
  const si = document.getElementById('script-input');
  const cc = document.getElementById('char-count');
  if (dz) {
    ['dragenter', 'dragover'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.add('drag-over'); }));
    ['dragleave', 'drop'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.remove('drag-over'); }));
    dz.addEventListener('drop', e => {
      const f = e.dataTransfer.files[0];
      if (f) { const r = new FileReader(); r.onload = ev => { si.value = ev.target.result; cc.textContent = ev.target.result.length + ' caracteres'; }; r.readAsText(f); }
    });
  }
  if (si) si.addEventListener('input', () => { cc.textContent = si.value.length + ' caracteres'; });
}
