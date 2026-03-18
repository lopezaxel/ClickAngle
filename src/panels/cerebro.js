import { supabase } from '../lib/supabase.js';
import { getState, setState } from '../lib/state.js';
import { icon } from '../icons.js';
import { callAI } from '../lib/intelligence.js';
import { toast } from '../lib/toast.js';

export async function renderCerebro(container) {
  const { activeChannelId } = getState();
  if (!activeChannelId) { container.innerHTML = '<div class="loading-spinner">Selecciona un canal</div>'; return; }

  let scriptText = '';
  let inputType = 'script'; // 'script' or 'context'
  let contextText = '';
  let analysisResult = null;     // Step 1 result: hook, tension, promise, visual_briefing
  let generatedAngles = [];      // 5 AI-generated angles for this specific video
  let selectedAngleIndices = []; // indices (0-4) of selected angles
  let isGeneratingAngles = false;
  let step = 1;                  // 1 = script input, 2 = angles A/B/C test

  container.innerHTML = `<div class="loading-spinner"><span class="animate-pulse">${icon('clock', 24)}</span></div>`;

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
          <span class="text-xs ${step === 2 ? 'text-accent font-bold' : 'text-muted'}">Ángulos A/B/C Test</span>
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
        <!-- Tabs for input type -->
        <div class="flex gap-sm mb-md" style="padding-bottom:10px; border-bottom:1px solid var(--border);">
          <button class="btn btn-sm ${inputType === 'script' ? 'btn-primary' : 'btn-secondary'}" id="tab-script">
            ${icon('file', 14)} Subir Guión
          </button>
          <button class="btn btn-sm ${inputType === 'context' ? 'btn-primary' : 'btn-secondary'}" id="tab-context">
            ${icon('bulb', 14)} Idea / Contexto
          </button>
        </div>

        ${inputType === 'script' ? `
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
            <button class="btn btn-primary" id="btn-process-script">${icon('dna', 16)} Procesar Guión</button>
          </div>
        </div>
        ` : `
        <div class="card">
          <div class="card-header">
            <div class="card-title">${icon('bulb', 16)} ¿De qué trata tu video?</div>
          </div>
          <p class="text-xs text-muted mb-sm">Describe el concepto central, el valor que aporta y lo que quieres transmitir. La IA lo usará para inferir los mejores ángulos de click.</p>
          <textarea class="form-textarea" id="context-input" placeholder="Ej: Es un video sobre cómo invertir en la bolsa siendo principiante, mostrando los errores comunes que hacen perder dinero y mi estrategia paso a paso..." style="min-height:350px; font-size:13px; line-height:1.5;">${contextText}</textarea>
          <div class="flex justify-between items-center mt-md">
            <span class="text-xs text-muted" id="char-count-context">${contextText.length} caracteres</span>
            <button class="btn btn-primary" id="btn-process-script">${icon('dna', 16)} Generar ADN de Contexto</button>
          </div>
        </div>
        `}
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
          <div class="card mb-sm" style="border-left: 3px solid var(--success); padding: var(--space-md); background: var(--bg-tertiary);">
            <div style="font-size:11px; font-weight:800; color: var(--success); letter-spacing:1px; text-transform:uppercase;">PROMESA (Valor)</div>
            <div style="font-size:13px; color: var(--text-secondary); line-height:1.6; margin-top:var(--space-xs);">${analysisResult.promise}</div>
          </div>

          ${analysisResult.visual_briefing ? renderVisualBriefingCard(analysisResult.visual_briefing) : ''}

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

  function renderVisualBriefingCard(vb) {
    const emotionConfig = {
      SORPRESA: { color: '#F59E0B', label: 'SORPRESA', icon: '⚡' },
      AUTORIDAD: { color: '#3B82F6', label: 'AUTORIDAD', icon: '👁' },
      MIEDO:     { color: '#EF4444', label: 'MIEDO',     icon: '⚠' },
      DUDA:      { color: '#8B5CF6', label: 'DUDA',      icon: '?' },
    };
    const em = emotionConfig[vb.emotion_label] || { color: 'var(--accent)', label: vb.emotion_label, icon: '◉' };

    return `
    <div class="card mb-sm" style="
      background: linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(15,15,20,0.9) 100%);
      border: 1px solid rgba(255,255,255,0.12);
      border-top: 2px solid ${em.color};
      padding: 0;
      overflow: hidden;
    ">
      <!-- Header -->
      <div style="
        padding: var(--space-sm) var(--space-md);
        background: rgba(255,255,255,0.04);
        border-bottom: 1px solid rgba(255,255,255,0.07);
        display: flex;
        align-items: center;
        justify-content: space-between;
      ">
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="font-size:14px;">🎬</span>
          <span style="font-size:10px; font-weight:900; letter-spacing:2px; text-transform:uppercase; color: rgba(255,255,255,0.9);">Briefing Visual de Producción</span>
        </div>
        <span style="
          font-size:9px; font-weight:700; letter-spacing:1px;
          padding: 2px 8px; border-radius: 3px;
          background: ${em.color}22;
          color: ${em.color};
          border: 1px solid ${em.color}44;
          text-transform: uppercase;
        ">ORDEN DE IA</span>
      </div>

      <!-- Body -->
      <div style="padding: var(--space-md);">

        <!-- Hero Object -->
        <div style="margin-bottom: var(--space-sm);">
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
            <span style="
              display:inline-flex; align-items:center; justify-content:center;
              width:20px; height:20px; border-radius:4px;
              background: rgba(255,255,255,0.07);
              font-size:11px;
            ">🎯</span>
            <span style="font-size:9px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color: rgba(255,255,255,0.4);">Objeto Héroe</span>
          </div>
          <div style="
            font-size:13px; font-weight:600; color: rgba(255,255,255,0.92); line-height:1.5;
            padding-left: 26px;
          ">${vb.hero_object}</div>
        </div>

        <!-- Separator -->
        <div style="height:1px; background: rgba(255,255,255,0.06); margin-bottom: var(--space-sm);"></div>

        <!-- Central Conflict -->
        <div style="margin-bottom: var(--space-sm);">
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
            <span style="
              display:inline-flex; align-items:center; justify-content:center;
              width:20px; height:20px; border-radius:4px;
              background: rgba(239,68,68,0.1);
              font-size:11px;
            ">⚔</span>
            <span style="font-size:9px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color: rgba(255,255,255,0.4);">Conflicto Central</span>
          </div>
          <div style="
            font-size:12px; color: rgba(255,255,255,0.7); line-height:1.5; font-style:italic;
            padding-left: 26px;
          ">${vb.central_conflict}</div>
        </div>

        <!-- Separator -->
        <div style="height:1px; background: rgba(255,255,255,0.06); margin-bottom: var(--space-sm);"></div>

        <!-- Emotion Match -->
        <div>
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:6px;">
            <span style="
              display:inline-flex; align-items:center; justify-content:center;
              width:20px; height:20px; border-radius:4px;
              background: ${em.color}18;
              font-size:11px;
            ">${em.icon}</span>
            <span style="font-size:9px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color: rgba(255,255,255,0.4);">Emoción Requerida</span>
          </div>
          <div style="padding-left: 26px;">
            <div style="font-size:12px; color: rgba(255,255,255,0.7); line-height:1.5; margin-bottom:8px;">${vb.required_emotion}</div>
            <!-- Face Vault matcher -->
            <div style="
              display:inline-flex; align-items:center; gap:8px;
              padding: 6px 12px; border-radius:6px;
              background: ${em.color}15;
              border: 1px solid ${em.color}35;
            ">
              <span style="font-size:10px; color: rgba(255,255,255,0.4);">Buscando en Face Vault:</span>
              <span style="
                font-size:11px; font-weight:800; letter-spacing:1.5px;
                color: ${em.color};
                text-transform: uppercase;
              ">${em.icon} ${em.label}</span>
            </div>
          </div>
        </div>

      </div>
    </div>`;
  }

  function renderStep2() {
    const count = selectedAngleIndices.length;
    const LABEL_LETTERS = ['A', 'B', 'C', 'D', 'E'];
    const PSYCH_COLORS = {
      0: { bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.35)', badge: '#ef4444', label: 'MIEDO' },
      1: { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.35)', badge: '#a855f7', label: 'CURIOSIDAD' },
      2: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.35)', badge: '#3b82f6', label: 'AUTORIDAD' },
      3: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.35)', badge: '#f59e0b', label: 'CONTRASTE' },
      4: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.35)', badge: '#10b981', label: 'URGENCIA' },
    };

    return `
    <!-- Top bar -->
    <div class="mb-md flex items-center justify-between" style="flex-wrap:wrap; gap:var(--space-sm);">
      <button class="btn btn-secondary btn-sm" id="btn-back-step1">${icon('arrowLeft', 14)} Volver al Guión</button>
      <div class="flex items-center gap-sm" style="flex-wrap:wrap;">
        <!-- A/B/C counter -->
        <div style="background:var(--bg-tertiary); border-radius:var(--radius-md); padding:6px 12px; border:1px solid var(--border);">
          <span class="text-xs text-muted">Seleccionados para producir: </span>
          <span class="font-bold" style="color:${count === 0 ? 'var(--text-muted)' : count <= 3 ? 'var(--success)' : 'var(--warning)'}; font-size:14px;">${count}</span>
          <span class="text-xs text-muted"> / 5</span>
          ${count > 0 ? `<span class="text-xs font-bold" style="margin-left:6px; color:var(--text-secondary);">[${selectedAngleIndices.map(i => LABEL_LETTERS[i]).join('/')}]</span>` : ''}
        </div>
        <button class="btn btn-primary btn-sm" id="btn-save-angles" ${count === 0 ? 'disabled' : ''}>
          ${icon('rocket', 14)} Pasar a la Fábrica${count > 0 ? ` (${count})` : ''}
        </button>
      </div>
    </div>

    <!-- YouTube A/B test hint -->
    <div class="card mb-md" style="background:rgba(245,158,11,0.06); border-color:rgba(245,158,11,0.3); padding:var(--space-sm) var(--space-md);">
      <div class="flex items-center gap-sm">
        <span style="font-size:18px;">🧪</span>
        <div>
          <div class="text-xs font-bold" style="color:var(--warning);">Estrategia de A/B Test para YouTube</div>
          <div class="text-xs text-muted">YouTube permite testear hasta 3 miniaturas simultáneamente. <strong style="color:var(--text-primary);">Te recomendamos elegir tus 3 ángulos favoritos</strong> para maximizar los datos de CTR sin dispersar el tráfico.</div>
        </div>
      </div>
    </div>

    <!-- ADN summary bar -->
    <div class="card mb-lg" style="background:var(--bg-tertiary); border:none;">
      <div class="flex gap-md" style="flex-wrap:wrap;">
        <div style="flex:1; min-width:180px;">
          <div style="font-size:10px; font-weight:800; color:var(--accent-light); letter-spacing:1px; text-transform:uppercase; margin-bottom:2px;">HOOK</div>
          <div class="text-xs text-muted" style="line-height:1.4;">${analysisResult?.hook || '—'}</div>
        </div>
        <div style="flex:1; min-width:180px;">
          <div style="font-size:10px; font-weight:800; color:var(--warning); letter-spacing:1px; text-transform:uppercase; margin-bottom:2px;">CONFLICTO</div>
          <div class="text-xs text-muted" style="line-height:1.4;">${analysisResult?.tension || '—'}</div>
        </div>
        <div style="flex:1; min-width:180px;">
          <div style="font-size:10px; font-weight:800; color:var(--success); letter-spacing:1px; text-transform:uppercase; margin-bottom:2px;">PROMESA</div>
          <div class="text-xs text-muted" style="line-height:1.4;">${analysisResult?.promise || '—'}</div>
        </div>
      </div>
    </div>

    <!-- Angles heading -->
    <div class="flex items-center justify-between mb-sm">
      <div class="text-xs font-bold text-muted" style="letter-spacing:1px; text-transform:uppercase;">${icon('crosshair', 12)} 5 Ángulos Generados por IA — Seleccioná los que vas a producir</div>
      ${isGeneratingAngles ? `<span class="text-xs text-accent animate-pulse">${icon('clock', 12)} Generando ángulos...</span>` : `
        <button class="btn btn-secondary btn-xs" id="btn-regenerate-angles" style="font-size:10px; padding:4px 10px;">
          ${icon('refreshCw', 10)} Regenerar
        </button>`}
    </div>

    ${isGeneratingAngles ? `
      <div class="card" style="text-align:center; padding:var(--space-2xl);">
        <div class="animate-pulse" style="font-size:40px; margin-bottom:var(--space-md);">${icon('brain', 40)}</div>
        <p class="text-sm text-muted">La IA está generando 5 ángulos psicológicamente opuestos...</p>
      </div>
    ` : generatedAngles.length === 0 ? `
      <div class="card" style="text-align:center; padding:var(--space-xl); opacity:0.6;">
        <p class="text-sm text-muted">No se pudieron generar ángulos. Intentá regenerar.</p>
        <button class="btn btn-primary btn-sm mt-md" id="btn-regenerate-angles">Generar Ángulos</button>
      </div>
    ` : `
    <div class="grid-3" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
      ${generatedAngles.map((angle, i) => {
      const isSelected = selectedAngleIndices.includes(i);
      const colors = PSYCH_COLORS[i] || PSYCH_COLORS[0];
      const letter = LABEL_LETTERS[i];
      const selectionOrder = selectedAngleIndices.indexOf(i);
      return `
        <div class="angle-card angle-selectable ${isSelected ? 'angle-selected' : ''}" data-angle-index="${i}"
          style="cursor:pointer; position:relative; transition: all 0.15s ease; padding: var(--space-md);
            ${isSelected ? `border-color: ${colors.badge}; background: ${colors.bg};` : ''}">

          <!-- Letter badge + psych type -->
          <div class="flex items-center justify-between mb-sm">
            <div class="flex items-center gap-xs">
              <div style="width:28px;height:28px;border-radius:50%;background:${colors.badge};display:flex;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:900;">${letter}</div>
              <span class="badge" style="font-size:9px; background:${colors.bg}; color:${colors.badge}; border-color:${colors.border};">${colors.label}</span>
            </div>
            <!-- Checkbox -->
            <div style="width:22px;height:22px;border-radius:50%;border:2px solid ${isSelected ? colors.badge : 'var(--border)'};
              background:${isSelected ? colors.badge : 'transparent'};
              display:flex;align-items:center;justify-content:center;color:white;font-size:11px;flex-shrink:0;">
              ${isSelected ? (selectionOrder < 3 ? `<span style="font-size:9px;font-weight:900;">${selectionOrder + 1}</span>` : icon('check', 10)) : ''}
            </div>
          </div>

          <!-- Name -->
          <div class="angle-name" style="font-size:14px; margin-bottom:var(--space-xs);">${angle.name}</div>

          <!-- Psychology -->
          <div class="card" style="padding: var(--space-xs) var(--space-sm); background: var(--bg-tertiary); margin-bottom: var(--space-xs);">
            <div class="text-xs font-bold text-muted mb-xs">${icon('brain', 10)} PSICOLOGÍA</div>
            <div style="font-size:11px; color: var(--text-secondary); line-height:1.5;">${angle.psychology}</div>
          </div>

          <!-- Visual Twist -->
          <div class="card" style="padding: var(--space-xs) var(--space-sm); background: ${colors.bg}; border-color: ${colors.border};">
            <div class="text-xs font-bold mb-xs" style="color:${colors.badge};">${icon('palette', 10)} TWIST VISUAL</div>
            <div style="font-size:11px; line-height:1.5; color: var(--text-secondary); font-style:italic;">"${angle.visual_twist}"</div>
          </div>
        </div>`;
    }).join('')}
    </div>`}`;
  }

  function bindEvents() {
    // --- STEP 1 events ---
    const dz = document.getElementById('script-drop-zone');
    const si = document.getElementById('script-input');
    const ci = document.getElementById('context-input');
    const cc = document.getElementById('char-count');
    const ccc = document.getElementById('char-count-context');

    document.getElementById('tab-script')?.addEventListener('click', () => { inputType = 'script'; render(); });
    document.getElementById('tab-context')?.addEventListener('click', () => { inputType = 'context'; render(); });

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
    if (ci) ci.addEventListener('input', () => { contextText = ci.value; if (ccc) ccc.textContent = ci.value.length + ' caracteres'; });

    document.getElementById('btn-process-script')?.addEventListener('click', async () => {
      const textToProcess = inputType === 'script' ? scriptText : contextText;
      if (!textToProcess.trim()) { toast('Ingresá el guión o contexto primero', 'warning'); return; }
      const btn = document.getElementById('btn-process-script');
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `<span class="animate-pulse">${icon('clock', 16)}</span> Analizando...`;
      btn.disabled = true;
      try {
        const { data: brandKit } = await supabase.from('brand_kits').select('detailed_adn').eq('channel_id', activeChannelId).maybeSingle();
        const adn = brandKit?.detailed_adn || {};
        const promptModel = inputType === 'script' ? 'SCRIPT_ANALYSIS' : 'CONTEXT_ANALYSIS';
        analysisResult = await callAI(promptModel, textToProcess, adn);
        render();
      } catch (err) {
        console.error('Data Processing Error:', err);
        toast('Error al analizar: ' + err.message, 'error');
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    });

    document.getElementById('btn-go-step2')?.addEventListener('click', async () => {
      step = 2;
      generatedAngles = [];
      selectedAngleIndices = [];
      isGeneratingAngles = true;
      render();
      await generateAnglesForVideo();
    });

    // --- STEP 2 events ---
    document.getElementById('btn-back-step1')?.addEventListener('click', () => {
      step = 1;
      render();
    });

    // Angle card multi-select (by index, not DB id)
    container.querySelectorAll('.angle-selectable').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.angleIndex);
        if (selectedAngleIndices.includes(idx)) {
          selectedAngleIndices = selectedAngleIndices.filter(x => x !== idx);
        } else {
          selectedAngleIndices.push(idx);
        }
        render();
      });
    });

    // Regenerate angles
    document.getElementById('btn-regenerate-angles')?.addEventListener('click', async () => {
      await generateAnglesForVideo();
    });

    // Save / pass to Fábrica
    document.getElementById('btn-save-angles')?.addEventListener('click', async () => {
      if (selectedAngleIndices.length === 0) return;
      const btn = document.getElementById('btn-save-angles');
      btn.innerHTML = `<span class="animate-pulse">${icon('clock', 14)}</span> Guardando...`;
      btn.disabled = true;
      try {
        const selectedAngles = selectedAngleIndices.map((idx) => {
          const a = generatedAngles[idx];
          return {
            id: `ai-${idx}-${Date.now()}`,
            name: a.name,
            title: a.name,
            psychology_text: a.psychology,
            visual_twist: a.visual_twist,
          };
        });

        const logic_dna = {
          hook: analysisResult.hook,
          tension: analysisResult.tension,
          promise: analysisResult.promise,
          text_suggestions: analysisResult.text_suggestions || [],
          visual_briefing: analysisResult.visual_briefing || null,
          selected_angles: selectedAngles,
        };

        const { data: savedProject, error } = await supabase.from('projects').insert({
          channel_id: activeChannelId,
          title: (scriptText || contextText).split('\n')[0].slice(0, 50) || 'Nuevo Video',
          script_text: scriptText || contextText,
          logic_dna,
          status: 'draft'
        }).select('id').single();

        if (error) throw error;

        setState({
          activeProjectId: savedProject?.id || null,
          activeVisualBriefing: logic_dna.visual_briefing,
          activeEmotionLabel: logic_dna.visual_briefing?.emotion_label || null,
        });

        toast(`${selectedAngles.length} ángulo${selectedAngles.length !== 1 ? 's' : ''} pasado${selectedAngles.length !== 1 ? 's' : ''} a la Fábrica — listo para el batch`, 'success');
      } catch (err) {
        console.error('Save angles error:', err);
        toast('Error al guardar: ' + err.message, 'error');
      } finally {
        const b = document.getElementById('btn-save-angles');
        if (b) { b.innerHTML = `${icon('rocket', 14)} Pasar a la Fábrica`; b.disabled = selectedAngleIndices.length === 0; }
      }
    });
  }

  async function generateAnglesForVideo() {
    isGeneratingAngles = true;
    render();
    try {
      const textContent = scriptText || contextText;
      const context = {
        hook: analysisResult?.hook || '',
        tension: analysisResult?.tension || '',
        promise: analysisResult?.promise || '',
        visual_briefing: analysisResult?.visual_briefing || null,
      };
      const result = await callAI('ANGLES_GENERATION', textContent, context);
      generatedAngles = result?.angles || [];
    } catch (err) {
      console.error('Angles generation error:', err);
      generatedAngles = [];
    } finally {
      isGeneratingAngles = false;
      render();
    }
  }

  render();
}
