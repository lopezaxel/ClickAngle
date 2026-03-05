import { supabase } from '../lib/supabase.js';
import { getState } from '../lib/state.js';
import { icon } from '../icons.js';

export async function renderCerebro(container) {
  const { activeChannelId } = getState();
  if (!activeChannelId) { container.innerHTML = '<div class="loading-spinner">Selecciona un canal</div>'; return; }

  let scriptText = '';
  let analysisResult = null;

  function render() {
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
          <textarea class="form-textarea" id="script-input" placeholder="Pega tu guión aquí..." style="min-height:180px;">${scriptText}</textarea>
          <div class="flex justify-between items-center mt-md">
            <span class="text-xs text-muted" id="char-count">${scriptText.length} caracteres</span>
            <div class="flex gap-sm">
              <button class="btn btn-secondary btn-sm" id="btn-save-draft">${icon('save', 14)} Guardar Borrador</button>
              <button class="btn btn-primary" id="btn-process-script">${icon('dna', 16)} Procesar ADN</button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="card mb-md" style="border-color: var(--accent); border-width: 1px;">
          <div class="card-header">
            <div class="card-title">${icon('dna', 16)} ADN del Video</div>
            <span class="badge badge-accent">IA Procesado</span>
          </div>
          ${analysisResult ? `
          <div class="card mb-md" style="border-left: 3px solid var(--accent); padding: var(--space-md);">
            <div style="font-size:13px; font-weight:700; color: var(--accent-light);">HOOK</div>
            <div style="font-size:13px; color: var(--text-secondary); line-height:1.6; padding: var(--space-sm); background: var(--bg-tertiary); border-radius: var(--radius-md); margin-top:var(--space-sm);">${analysisResult.hook}</div>
          </div>
          <div class="card mb-md" style="border-left: 3px solid var(--warning); padding: var(--space-md);">
            <div style="font-size:13px; font-weight:700; color: var(--warning);">TENSIÓN</div>
            <div style="font-size:13px; color: var(--text-secondary); line-height:1.6; padding: var(--space-sm); background: var(--bg-tertiary); border-radius: var(--radius-md); margin-top:var(--space-sm);">${analysisResult.tension}</div>
          </div>
          <div class="card" style="border-left: 3px solid var(--success); padding: var(--space-md);">
            <div style="font-size:13px; font-weight:700; color: var(--success-light);">PROMESA</div>
            <div style="font-size:13px; color: var(--text-secondary); line-height:1.6; padding: var(--space-sm); background: var(--bg-tertiary); border-radius: var(--radius-md); margin-top:var(--space-sm);">${analysisResult.promise}</div>
          </div>
          
          <div class="mt-lg">
            <div class="card-title mb-md" style="font-size:14px;">${icon('crosshair', 16)} Ángulos Recomendados</div>
            ${analysisResult.recommended_angles.map(ang => `
              <div class="card mb-sm" style="padding:var(--space-md); border: 1px dashed var(--border);">
                <div class="flex items-center justify-between mb-xs">
                  <div class="text-sm font-bold text-accent">${ang.name}</div>
                  <button class="btn btn-ghost btn-xs">Ver Ángulo</button>
                </div>
                <div class="text-xs text-muted">${ang.reason}</div>
              </div>
            `).join('')}
          </div>
          ` : `
          <div style="text-align:center;padding:var(--space-xl);color:var(--text-tertiary);">
            ${icon('dna', 32)}
            <p class="text-sm text-muted mt-md">Pega tu guión y haz clic en "Procesar ADN" para analizar</p>
          </div>
          `}
        </div>
      </div>
    </div>
  </div>`;

    // Bind events
    const dz = document.getElementById('script-drop-zone');
    const si = document.getElementById('script-input');
    const cc = document.getElementById('char-count');

    if (dz) {
      ['dragenter', 'dragover'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.add('drag-over'); }));
      ['dragleave', 'drop'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.remove('drag-over'); }));
      dz.addEventListener('drop', e => {
        const f = e.dataTransfer.files[0];
        if (f) { const r = new FileReader(); r.onload = ev => { si.value = ev.target.result; scriptText = ev.target.result; cc.textContent = ev.target.result.length + ' caracteres'; }; r.readAsText(f); }
      });
    }

    if (si) si.addEventListener('input', () => { scriptText = si.value; cc.textContent = si.value.length + ' caracteres'; });

    // Save as draft project
    document.getElementById('btn-save-draft')?.addEventListener('click', async () => {
      if (!scriptText) { alert('Ingresa un guión primero'); return; }
      try {
        const title = scriptText.split('\n')[0].slice(0, 60) || 'Sin título';
        await supabase.from('projects').insert({
          channel_id: activeChannelId,
          title,
          script_text: scriptText,
          status: 'draft'
        });
        alert('¡Borrador guardado!');
      } catch (err) { alert('Error: ' + err.message); }
    });

    // Process ADN (logic connecting Phase 1 and 2)
    document.getElementById('btn-process-script')?.addEventListener('click', async () => {
      if (!scriptText) { alert('Ingresa un guión primero'); return; }

      const btn = document.getElementById('btn-process-script');
      btn.innerHTML = `<span class="animate-pulse">${icon('clock', 16)}</span> Analizando...`;
      btn.disabled = true;

      try {
        const sentences = scriptText.split(/[.!?]+/).filter(s => s.trim());
        const hook = sentences[0]?.trim() || 'No se pudo extraer el hook';

        // Fetch Brand ADN to personalize recommendation
        const { data: brandKit } = await supabase.from('brand_kits').select('channel_adn').eq('channel_id', activeChannelId).maybeSingle();
        const adn = brandKit?.channel_adn || {};

        analysisResult = {
          hook,
          tension: sentences[Math.floor(sentences.length / 2)]?.trim() || 'Crea tensión mediante una pregunta o misterio.',
          promise: sentences[sentences.length - 1]?.trim() || 'Resuelve el misterio al final.',
          // System Prompt 2 Logic: Recommended Angles
          recommended_angles: [
            { id: 'ANG-001', name: 'Contraste Extremo', reason: `Ideal para tu nicho de ${adn.niche || 'contenido'} y el hook detectado.` },
            { id: 'ANG-005', name: 'El Gran Error', reason: 'Detectamos un punto de tensión que encaja con el miedo al fracaso.' },
            { id: 'ANG-012', name: 'Curiosidad Pura', reason: 'Tu audiencia responde bien a misterios visuales.' }
          ]
        };
        render();
      } catch (err) { alert('Error: ' + err.message); }
      finally {
        btn.innerHTML = `${icon('dna', 16)} Procesar ADN`;
        btn.disabled = false;
      }
    });
  }

  render();
}
