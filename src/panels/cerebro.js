import { supabase } from '../lib/supabase.js';
import { getState } from '../lib/state.js';
import { icon } from '../icons.js';
import { callAI } from '../lib/intelligence.js';

export async function renderCerebro(container) {
  const { activeChannelId } = getState();
  if (!activeChannelId) { container.innerHTML = '<div class="loading-spinner">Selecciona un canal</div>'; return; }

  let scriptText = '';
  let analysisResult = null;   // Step 1 result: hook, tension, promise
  let allAngles = [];          // All angles from DB
  let selectedAngleIds = [];   // Angles selected by user
  let step = 1;                // 1 = script input, 2 = angles selection

  // Load angles from DB once
  container.innerHTML = `<div class="loading-spinner"><span class="animate-pulse">${icon('clock', 24)}</span></div>`;
  const { data: anglesData } = await supabase
    .from('click_angles')
    .select('id, name, title, description, psychology_text, example_text, category')
    .order('category', { ascending: true });
  allAngles = anglesData || [];

  function render() {
    container.innerHTML = `<div class="animate-in">
    <div class="section-header">
      <div>
        <h2 class="section-title">${icon('brain', 22)} El Cerebro</h2>
        <p class="section-subtitle">Extrae el ADN de tu guión y elige los ángulos psicológicos para tu miniatura</p>
      </div>
      <!-- Step indicator -->
      <div class="flex gap-sm items-center">
        <div class="flex items-center gap-xs">
          <div style="width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;
            background:${step >= 1 ? 'var(--accent)' : 'var(--bg-tertiary)'};
            color:${step >= 1 ? 'white' : 'var(--text-tertiary)'};">1</div>
          <span class="text-xs ${step === 1 ? 'text-accent font-bold' : 'text-muted'}">Subir Guión</span>
        </div>
        <div style="width:24px;height:1px;background:var(--border);"></div>
        <div class="flex items-center gap-xs">
          <div style="width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;
            background:${step >= 2 ? 'var(--accent)' : 'var(--bg-tertiary)'};
            color:${step >= 2 ? 'white' : 'var(--text-tertiary)'};">2</div>
          <span class="text-xs ${step === 2 ? 'text-accent font-bold' : 'text-muted'}">Ángulos de Click</span>
        </div>
      </div>
    </div>

    ${step === 1 ? renderStep1() : renderStep2()}
    </div>`;

    bindEvents();
  }

  function renderStep1() {
    return `
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
            <button class="btn btn-primary" id="btn-process-script">${icon('dna', 16)} Procesar ADN del Video</button>
          </div>
        </div>
      </div>

      <div>
        <div class="card" style="border-color: var(--accent); border-width: 1px; min-height: 480px;">
          <div class="card-header">
            <div class="card-title">${icon('dna', 16)} ADN Extraído</div>
            <span class="badge ${analysisResult ? 'badge-accent' : 'badge-neutral'}">${analysisResult ? 'IA Lista' : 'Esperando'}</span>
          </div>
          ${analysisResult ? `
          <div class="card mb-sm" style="border-left: 3px solid var(--accent); padding: var(--space-md); background: var(--bg-tertiary);">
            <div style="font-size:11px; font-weight:800; color: var(--accent-light); letter-spacing:1px; text-transform:uppercase;">HOOK (Gancho)</div>
            <div style="font-size:13px; color: var(--text-secondary); line-height:1.6; margin-top:var(--space-xs);">${analysisResult.hook}</div>
          </div>
          <div class="card mb-sm" style="border-left: 3px solid var(--warning); padding: var(--space-md); background: var(--bg-tertiary);">
            <div style="font-size:11px; font-weight:800; color: var(--warning); letter-spacing:1px; text-transform:uppercase;">CONFLICTO (Tensión)</div>
            <div style="font-size:13px; color: var(--text-secondary); line-height:1.6; margin-top:var(--space-xs);">${analysisResult.tension}</div>
          </div>
          <div class="card mb-md" style="border-left: 3px solid var(--success); padding: var(--space-md); background: var(--bg-tertiary);">
            <div style="font-size:11px; font-weight:800; color: var(--success); letter-spacing:1px; text-transform:uppercase;">PROMESA (Valor)</div>
            <div style="font-size:13px; color: var(--text-secondary); line-height:1.6; margin-top:var(--space-xs);">${analysisResult.promise}</div>
          </div>

          <div class="card mb-md" style="background: var(--bg-tertiary); border: 1px dashed var(--accent);">
            <div class="card-header"><div class="card-title" style="font-size:11px;">${icon('bolt', 12)} SUGERENCIAS DE TEXTO (CTR)</div></div>
            <div class="flex gap-xs mt-xs" style="flex-wrap:wrap; padding: 0 var(--space-md) var(--space-md);">
              ${(analysisResult.text_suggestions || []).map(txt => `
                <span class="badge badge-accent" style="font-size:10px; padding:4px 8px;">${txt}</span>
              `).join('')}
            </div>
          </div>

          <button class="btn btn-primary w-full" id="btn-go-step2">
            ${icon('crosshair', 16)} Generar Ángulos de Click
          </button>
          ` : `
          <div style="text-align:center;padding:var(--space-xl);color:var(--text-tertiary); opacity:0.5;">
            ${icon('brain', 48)}
            <p class="text-sm mt-md">Analiza el guión para extraer el Hook, Conflicto y Promesa</p>
          </div>
          `}
        </div>
      </div>
    </div>`;
  }

  function renderStep2() {
    const recommended = analysisResult?.recommended_angles || [];
    const recommendedNames = recommended.map(r => (r.name || '').toLowerCase());

    // Sort: recommended angles first, then rest
    const sorted = [...allAngles].sort((a, b) => {
      const aRec = recommendedNames.some(n => a.name.toLowerCase().includes(n) || n.includes(a.name.toLowerCase()));
      const bRec = recommendedNames.some(n => b.name.toLowerCase().includes(n) || n.includes(b.name.toLowerCase()));
      return (bRec ? 1 : 0) - (aRec ? 1 : 0);
    });

    return `
    <div class="mb-md flex items-center justify-between">
      <button class="btn btn-secondary btn-sm" id="btn-back-step1">${icon('arrowLeft', 14)} Volver al Guión</button>
      <div class="flex items-center gap-sm">
        <span class="text-xs text-muted">${selectedAngleIds.length} ángulo${selectedAngleIds.length !== 1 ? 's' : ''} seleccionado${selectedAngleIds.length !== 1 ? 's' : ''}</span>
        <button class="btn btn-primary btn-sm" id="btn-save-angles" ${selectedAngleIds.length === 0 ? 'disabled' : ''}>
          ${icon('check', 14)} Confirmar Selección
        </button>
      </div>
    </div>

    <!-- ADN summary bar -->
    <div class="card mb-lg" style="background:var(--bg-tertiary); border:none;">
      <div class="flex gap-md" style="flex-wrap:wrap;">
        <div style="flex:1; min-width:200px;">
          <div style="font-size:10px; font-weight:800; color:var(--accent-light); letter-spacing:1px; text-transform:uppercase; margin-bottom:2px;">HOOK</div>
          <div class="text-xs text-muted" style="line-height:1.4;">${analysisResult?.hook || '—'}</div>
        </div>
        <div style="flex:1; min-width:200px;">
          <div style="font-size:10px; font-weight:800; color:var(--warning); letter-spacing:1px; text-transform:uppercase; margin-bottom:2px;">CONFLICTO</div>
          <div class="text-xs text-muted" style="line-height:1.4;">${analysisResult?.tension || '—'}</div>
        </div>
        <div style="flex:1; min-width:200px;">
          <div style="font-size:10px; font-weight:800; color:var(--success); letter-spacing:1px; text-transform:uppercase; margin-bottom:2px;">PROMESA</div>
          <div class="text-xs text-muted" style="line-height:1.4;">${analysisResult?.promise || '—'}</div>
        </div>
      </div>
    </div>

    ${recommended.length > 0 ? `
    <div class="mb-md">
      <div class="text-xs font-bold text-accent mb-sm" style="letter-spacing:1px; text-transform:uppercase;">${icon('brain', 12)} Recomendados por IA para este guión</div>
      <div class="flex gap-sm" style="flex-wrap:wrap;">
        ${recommended.map(r => `
          <div class="card" style="padding:var(--space-sm) var(--space-md); background:rgba(220,38,38,0.07); border-color:rgba(220,38,38,0.25); display:inline-flex; align-items:center; gap:var(--space-xs);">
            <span style="color:var(--accent); font-size:10px;">${icon('crosshair', 10)}</span>
            <span class="text-xs font-bold text-accent">${r.name}</span>
            <span class="text-xs text-muted">— ${r.reason}</span>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div class="text-xs font-bold text-muted mb-sm" style="letter-spacing:1px; text-transform:uppercase;">${icon('crosshair', 12)} Todos los Ángulos — Seleccioná los que vas a usar</div>
    <div class="grid-3">
      ${sorted.map(angle => {
        const isSelected = selectedAngleIds.includes(angle.id);
        const isRec = recommendedNames.some(n => angle.name.toLowerCase().includes(n) || n.includes(angle.name.toLowerCase()));
        return `
        <div class="angle-card angle-selectable ${isSelected ? 'angle-selected' : ''}" data-angle-id="${angle.id}"
          style="cursor:pointer; position:relative; transition: all 0.15s ease;
            ${isSelected ? 'border-color: var(--accent); background: rgba(220,38,38,0.07);' : ''}
            ${isRec && !isSelected ? 'border-color: rgba(220,38,38,0.3);' : ''}">
          ${isRec ? `<div style="position:absolute;top:8px;left:8px;"><span class="badge badge-accent" style="font-size:9px;padding:2px 6px;">IA</span></div>` : ''}
          <div style="position:absolute;top:8px;right:8px;">
            <div style="width:20px;height:20px;border-radius:50%;border:2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'};
              background:${isSelected ? 'var(--accent)' : 'transparent'};
              display:flex;align-items:center;justify-content:center;color:white;font-size:11px;">
              ${isSelected ? icon('check', 11) : ''}
            </div>
          </div>
          <div style="margin-top: var(--space-sm);">
            <div class="angle-name" style="padding-right:28px;">${angle.name}</div>
            <div class="text-xs text-muted mb-sm" style="font-style:italic;">"${angle.title}"</div>
            <div class="angle-desc mb-sm">${angle.description}</div>
            <div class="card" style="padding: var(--space-xs) var(--space-sm); background: var(--bg-tertiary); margin-bottom: var(--space-xs);">
              <div class="text-xs font-bold text-muted mb-xs">${icon('brain', 10)} PSICOLOGÍA</div>
              <div style="font-size:11px; color: var(--text-secondary); line-height:1.4;">${angle.psychology_text || ''}</div>
            </div>
            <div class="card" style="padding: var(--space-xs) var(--space-sm); background: var(--accent-subtle); border-color: rgba(220,38,38,0.1);">
              <div class="text-xs font-bold text-accent mb-xs">${icon('bolt', 10)} EJEMPLO</div>
              <div style="font-size:11px; color: var(--accent-light); font-weight:500;">${angle.example_text || ''}</div>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }

  function bindEvents() {
    // --- STEP 1 events ---
    const dz = document.getElementById('script-drop-zone');
    const si = document.getElementById('script-input');
    const cc = document.getElementById('char-count');

    async function extractTextFromFile(file) {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        document.getElementById('pdf-loading').style.display = 'block';
        try {
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
          return '';
        } finally {
          const pdfl = document.getElementById('pdf-loading');
          if (pdfl) pdfl.style.display = 'none';
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
          if (f) { scriptText = await extractTextFromFile(f); render(); }
        };
        input.click();
      });
      ['dragenter', 'dragover'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.add('drag-over'); }));
      ['dragleave', 'drop'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.remove('drag-over'); }));
      dz.addEventListener('drop', async e => {
        const f = e.dataTransfer.files[0];
        if (f) { scriptText = await extractTextFromFile(f); render(); }
      });
    }

    if (si) si.addEventListener('input', () => { scriptText = si.value; if (cc) cc.textContent = si.value.length + ' caracteres'; });

    document.getElementById('btn-process-script')?.addEventListener('click', async () => {
      if (!scriptText.trim()) { alert('Ingresa un guión primero'); return; }
      const btn = document.getElementById('btn-process-script');
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `<span class="animate-pulse">${icon('clock', 16)}</span> Analizando...`;
      btn.disabled = true;
      try {
        const { data: brandKit } = await supabase.from('brand_kits').select('detailed_adn').eq('channel_id', activeChannelId).maybeSingle();
        const adn = brandKit?.detailed_adn || {};
        analysisResult = await callAI('SCRIPT_ANALYSIS', scriptText, adn);
        render();
      } catch (err) {
        console.error('Script Processing Error:', err);
        alert('Error al analizar: ' + err.message);
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    });

    document.getElementById('btn-go-step2')?.addEventListener('click', () => {
      step = 2;
      render();
    });

    // --- STEP 2 events ---
    document.getElementById('btn-back-step1')?.addEventListener('click', () => {
      step = 1;
      render();
    });

    container.querySelectorAll('.angle-selectable').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.angleId;
        if (selectedAngleIds.includes(id)) {
          selectedAngleIds = selectedAngleIds.filter(x => x !== id);
        } else {
          selectedAngleIds.push(id);
        }
        render();
      });
    });

    document.getElementById('btn-save-angles')?.addEventListener('click', async () => {
      if (selectedAngleIds.length === 0) return;
      const btn = document.getElementById('btn-save-angles');
      btn.innerHTML = `<span class="animate-pulse">${icon('clock', 14)}</span> Guardando...`;
      btn.disabled = true;
      try {
        const selectedAngles = allAngles.filter(a => selectedAngleIds.includes(a.id));
        // Save project with logic_dna + selected angles
        const { error } = await supabase.from('projects').insert({
          channel_id: activeChannelId,
          title: scriptText.split('\n')[0].slice(0, 50) || 'Nuevo Video',
          script_text: scriptText,
          logic_dna: {
            ...analysisResult,
            selected_angles: selectedAngles.map(a => ({ id: a.id, name: a.name, title: a.title }))
          },
          status: 'draft'
        });
        if (error) throw error;
        alert(`✓ ${selectedAngleIds.length} ángulo${selectedAngleIds.length !== 1 ? 's' : ''} guardado${selectedAngleIds.length !== 1 ? 's' : ''}. ¡Listo para generar miniaturas!`);
      } catch (err) {
        console.error('Save angles error:', err);
        alert('Error al guardar: ' + err.message);
      } finally {
        const b = document.getElementById('btn-save-angles');
        if (b) { b.innerHTML = `${icon('check', 14)} Confirmar Selección`; b.disabled = selectedAngleIds.length === 0; }
      }
    });
  }

  render();
}
