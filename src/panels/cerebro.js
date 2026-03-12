import { supabase } from '../lib/supabase.js';
import { getState } from '../lib/state.js';
import { icon } from '../icons.js';
import { callAI } from '../lib/intelligence.js';

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
            <span class="badge badge-neutral">Soporta .txt, .md, .pdf</span>
          </div>
          <div class="upload-zone" id="script-drop-zone">
            <div class="upload-zone-icon" style="font-size:20px;opacity:0.4;">${icon('file', 40)}</div>
            <div class="upload-zone-text">Arrastra tu guión o haz clic</div>
            <div class="upload-zone-hint">Soporta Guiones en PDF, TXT o MD.</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Cajón de Texto Estratégico</div></div>
          <div id="pdf-loading" style="display:none; padding:var(--space-sm); background:var(--bg-tertiary); border-radius:var(--radius-sm); border:1px solid var(--accent); margin-bottom:var(--space-sm);">
            <div class="flex items-center gap-sm text-xs animate-pulse">
                ${icon('clock', 12)} Extrayendo texto del PDF...
            </div>
          </div>
          <textarea class="form-textarea" id="script-input" placeholder="Pega aquí el guión completo del video..." style="min-height:250px; font-size:13px; line-height:1.5;">${scriptText}</textarea>
          <div class="flex justify-between items-center mt-md">
            <span class="text-xs text-muted" id="char-count">${scriptText.length} caracteres</span>
            <div class="flex gap-sm">
              <button class="btn btn-primary" id="btn-process-script">${icon('dna', 16)} Procesar ADN del Video</button>
            </div>
          </div>

        </div>
      </div>

      <div>
        <div class="card mb-md" style="border-color: var(--accent); border-width: 1px; min-height: 480px;">
          <div class="card-header">
            <div class="card-title">${icon('dna', 16)} Resultados del Análisis</div>
            <span class="badge ${analysisResult ? 'badge-accent' : 'badge-neutral'}">${analysisResult ? 'IA Lista' : 'Esperando'}</span>
          </div>
          ${analysisResult ? `
          <div class="card mb-md" style="border-left: 3px solid var(--accent); padding: var(--space-md); background: var(--bg-tertiary);">
            <div style="font-size:11px; font-weight:800; color: var(--accent-light); letter-spacing:1px; text-transform:uppercase;">HOOK (Gancho)</div>
            <div style="font-size:13px; color: var(--text-secondary); line-height:1.6; margin-top:var(--space-sm);">${analysisResult.hook}</div>
          </div>
          <div class="card mb-md" style="border-left: 3px solid var(--warning); padding: var(--space-md); background: var(--bg-tertiary);">
            <div style="font-size:11px; font-weight:800; color: var(--warning); letter-spacing:1px; text-transform:uppercase;">TENSIÓN (Conflicto)</div>
            <div style="font-size:13px; color: var(--text-secondary); line-height:1.6; margin-top:var(--space-sm);">${analysisResult.tension}</div>
          </div>
          <div class="card mb-md" style="border-left: 3px solid var(--success); padding: var(--space-md); background: var(--bg-tertiary);">
            <div style="font-size:11px; font-weight:800; color: var(--success); letter-spacing:1px; text-transform:uppercase;">PROMESA (Valor)</div>
            <div style="font-size:13px; color: var(--text-secondary); line-height:1.6; margin-top:var(--space-sm);">${analysisResult.promise}</div>
          </div>
          
          <div class="mt-lg">
            <div class="card-title mb-md" style="font-size:14px; color:var(--text-primary);">${icon('crosshair', 16)} Ángulos Recomendados</div>
            <div class="grid-1 gap-sm">
              ${(analysisResult.recommended_angles || []).map(ang => `
                <div class="card bg-tertiary" style="padding:var(--space-md); border: 1px solid var(--border);">
                  <div class="text-xs font-bold text-accent mb-xs">${ang.name || 'Ángulo'}</div>
                  <div class="text-xs text-muted">${ang.reason || ''}</div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : `
          <div style="text-align:center;padding:var(--space-xl);color:var(--text-tertiary); opacity:0.5;">
            ${icon('brain', 48)}
            <p class="text-sm mt-md">Analiza el guión para ver la estructura de tu futura miniatura</p>
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

    async function extractTextFromFile(file) {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        document.getElementById('pdf-loading').style.display = 'block';
        try {
          // Ensure PDF.js is loaded
          if (!window.pdfjsLib) {
            await new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
              script.onload = resolve;
              script.onerror = reject;
              document.head.appendChild(script);
            });
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
          }

          const reader = new FileReader();
          const buffer = await new Promise((resolve) => {
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsArrayBuffer(file);
          });

          const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(' ') + '\n';
          }
          return text;
        } catch (err) {
          console.error('PDF Error:', err);
          return `<div class="text-danger" style="font-size:12px; padding:var(--space-sm); background:rgba(220,38,38,0.05); border-radius:var(--radius-sm); border:1px solid rgba(220,38,38,0.1);">
            ${icon('alertTriangle', 14)} <strong>Error al leer PDF:</strong> ${err.message}. <br/>
            Por favor intenta copiar el texto manualmente.
          </div>`;
        } finally {
          document.getElementById('pdf-loading').style.display = 'none';
        }
      } else {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsText(file);
        });
      }
    }

    if (dz) {
      dz.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.md,.pdf';
        input.onchange = async (e) => {
          const f = e.target.files[0];
          if (f) {
            scriptText = await extractTextFromFile(f);
            render();
          }
        };
        input.click();
      });
      ['dragenter', 'dragover'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.add('drag-over'); }));
      ['dragleave', 'drop'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.remove('drag-over'); }));
      dz.addEventListener('drop', async e => {
        const f = e.dataTransfer.files[0];
        if (f) {
          scriptText = await extractTextFromFile(f);
          render();
        }
      });
    }


    if (si) si.addEventListener('input', () => { scriptText = si.value; cc.textContent = si.value.length + ' caracteres'; });

    // Process ADN using specialized utility
    document.getElementById('btn-process-script')?.addEventListener('click', async () => {
      if (!scriptText) { alert('Ingresa un guión primero'); return; }

      const btn = document.getElementById('btn-process-script');
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `<span class="animate-pulse">${icon('clock', 16)}</span> Analizando...`;
      btn.disabled = true;

      try {
        const { data: brandKit } = await supabase.from('brand_kits').select('detailed_adn').eq('channel_id', activeChannelId).maybeSingle();
        const adn = brandKit?.detailed_adn || {};

        analysisResult = await callAI('SCRIPT_ANALYSIS', scriptText, adn);

        // Save analysis to projects (Logic DNA)
        await supabase.from('projects').insert({
          channel_id: activeChannelId,
          title: scriptText.split('\n')[0].slice(0, 50) || 'Nuevo Video',
          script_text: scriptText,
          logic_dna: analysisResult,
          status: 'analyzed'
        });

        render();
      } catch (err) {
        console.error('Script Processing Error:', err);
        const feedbackDiv = document.createElement('div');
        feedbackDiv.style.marginTop = 'var(--space-md)';
        feedbackDiv.innerHTML = `<div class="card" style="border-left: 3px solid var(--danger); background: rgba(220, 38, 38, 0.05); padding: var(--space-md);">
          <div class="text-xs" style="color:var(--danger); font-weight:700;">${icon('alertTriangle', 14)} Error en el análisis</div>
          <div class="text-xs text-muted">${err.message}</div>
        </div>`;
        btn.parentNode.insertBefore(feedbackDiv, btn.nextSibling);
        
        // Remove after 5 seconds
        setTimeout(() => feedbackDiv.remove(), 5000);
      }
      finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    });
  }

  render();
}
