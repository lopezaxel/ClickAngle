import { supabase } from '../lib/supabase.js';
import { getState, subscribe } from '../lib/state.js';
import { icon } from '../icons.js';
import { callAI, generateImage } from '../lib/intelligence.js';
import { toast, confirmDialog, inputDialog } from '../lib/toast.js';
import { showLoader, updateLoader, hideLoader, ensureLoaderStyles } from '../lib/loader.js';

// ─── Creative Config ────────────────────────────────────────────────────────

const FORMATS = [
  {
    id: 'versus',
    label: 'Duelo de Titanes',
    subtitle: 'Versus / Split Screen',
    emoji: '⚔️',
    desc: 'Contraste visual extremo. Composición simétrica con una línea de luz divisoria vibrante.',
    composition: 'PHYSICAL LAYOUT: Hard vertical split-screen composition — left half vs right half divided by a glowing neon electric line. Both halves must occupy exactly 50% of the frame. Elements face each other in direct confrontation. Wide angle, symmetrical tension.',
  },
  {
    id: 'authority',
    label: 'Autoridad Tech',
    subtitle: 'Hero Object / Objeto de Deseo',
    emoji: '🖥️',
    desc: 'Foco en el objeto con profundidad de campo extrema. El creador proyecta liderazgo.',
    composition: 'PHYSICAL LAYOUT: Hero object fills 60% of foreground in extreme close-up, sharp and detailed. Creator or secondary element placed in soft-focus background at 1/3 rule position. Anamorphic bokeh behind. Portrait-dominant framing with object centered.',
  },
  {
    id: 'shock',
    label: 'Shock / Caja Negra',
    subtitle: 'Misterio / Curiosity Gap',
    emoji: '🖤',
    desc: 'Psicología de la curiosidad. Elementos censurados y atmósfera de suspense cinematográfica.',
    composition: 'PHYSICAL LAYOUT: Key element intentionally hidden or obscured by solid black bars or heavy shadow. Face (if present) in extreme close-up showing maximum shock or disbelief — mouth open, eyes wide. Dark vignette edges. Mysterious fog filling empty space. Cinematic 2.35:1 crop feel.',
  },
  {
    id: 'breaking',
    label: 'Alerta / Breaking News',
    subtitle: 'Urgencia Total',
    emoji: '🚨',
    desc: 'Estética de noticia de última hora. Colores de alerta y saturación máxima.',
    composition: 'PHYSICAL LAYOUT: Broadcast news aesthetic — solid bold color horizontal band at bottom third (NO TEXT inside — pure colored bar only, graphic shape). Strong red/yellow color accents frame the edges like a news ticker border. Subject centered with high-energy forward lean pose. Graphic alert/warning icon badge in corner (icon only, absolutely zero text or letters). Flat even broadcast lighting on face.',
  },
];

const STYLES = [
  {
    id: 'hyperrealist',
    label: 'Master Studio (UHD)',
    subtitle: '8K Realismo',
    emoji: '📸',
    keywords: 'Ultra-photorealistic, 8k resolution, raw photography style, intricate skin textures, volumetric studio lighting, professional color grading, extreme sharpness, masterwork.',
    lighting: 'LIGHTING & TEXTURE: Three-point professional studio lighting — sharp key light from 45°, soft fill, tight rim light. 8K ultra-sharp textures with visible pores and material grain. Neutral color-science grading. Zero noise. Zero artifacting.',
  },
  {
    id: 'mrbeast',
    label: 'Estilo Explosivo',
    subtitle: 'High CTR',
    emoji: '🔥',
    keywords: 'MrBeast aesthetic, extremely saturated vibrant colors, high micro-contrast, glowing rim lights, intense facial highlights, sharp cartoonish realism, super-punchy visual impact.',
    lighting: 'LIGHTING & TEXTURE: Hyper-saturated color grading with crushed blacks and blown highlights. Neon rim lights wrapping subjects in vivid magenta or electric blue. Skin retouched to look almost cartoonish but still real. Micro-contrast cranked to maximum. Flat sharp textures on objects.',
  },
  {
    id: 'cyberpunk',
    label: 'Neon Future',
    subtitle: 'Sci-Fi',
    emoji: '🌆',
    keywords: 'Cyberpunk cinematic lighting, neon cyan and magenta accents, deep blue shadows, futuristic tech textures, holographic glow, synthwave color palette, moody atmosphere.',
    lighting: 'LIGHTING & TEXTURE: Dual neon lighting — cyan from left, magenta from right — creating colored shadow splits. Deep midnight blue ambient fill. Holographic lens reflections and volumetric fog wisps. Metallic and wet surfaces that reflect neon. Rain-slicked or chrome material textures.',
  },
  {
    id: 'minimal',
    label: 'Meta Ads Bold',
    subtitle: 'Impacto Limpio',
    emoji: '◼️',
    keywords: 'Clean commercial photography, bold minimalist design, solid vibrant background, sharp drop shadows, focused subjects, Swiss design influence, negative space authority.',
    lighting: 'LIGHTING & TEXTURE: Flat even product-photography lighting with no dramatic shadows. Solid bold single-color background (bright red, electric blue or vivid yellow). Hard geometric drop shadows. Zero texture noise. Swiss graphic design flat aesthetic. High negative space.',
  },
  {
    id: 'cinematic',
    label: 'Epic Movie',
    subtitle: 'Hollywood',
    emoji: '🎬',
    keywords: 'Cinematic film quality, Hollywood movie poster composition, anamorphic lens flares, dramatic shadows, highly saturated epic colors, 35mm film grain, golden ratio.',
    lighting: 'LIGHTING & TEXTURE: Golden hour or dramatic overcast Hollywood movie lighting. Anamorphic horizontal lens flares in warm gold/orange. Teal-and-orange cinematic color grade. 35mm film grain overlay at 15% opacity. Rich deep shadows with lift to dark teal. Epic sky backdrop.',
  },
];

// ─── Main Panel ─────────────────────────────────────────────────────────────

function thumbLoaderHTML(title = 'Generando miniatura...', detail = 'IA PROCESANDO') {
  ensureLoaderStyles();
  return `
  <div style="position:absolute;inset:0;z-index:10;background:rgba(6,6,10,0.88);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;">
    <div style="position:absolute;inset:0;pointer-events:none;overflow:hidden;">
      <div style="position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(220,38,38,.5),transparent);animation:ca-scanline 2.4s cubic-bezier(.4,0,.6,1) infinite;"></div>
    </div>
    <div style="position:absolute;top:8px;left:8px;width:12px;height:12px;border-top:2px solid rgba(220,38,38,.5);border-left:2px solid rgba(220,38,38,.5);"></div>
    <div style="position:absolute;top:8px;right:8px;width:12px;height:12px;border-top:2px solid rgba(220,38,38,.5);border-right:2px solid rgba(220,38,38,.5);"></div>
    <div style="position:absolute;bottom:8px;left:8px;width:12px;height:12px;border-bottom:2px solid rgba(220,38,38,.5);border-left:2px solid rgba(220,38,38,.5);"></div>
    <div style="position:absolute;bottom:8px;right:8px;width:12px;height:12px;border-bottom:2px solid rgba(220,38,38,.5);border-right:2px solid rgba(220,38,38,.5);"></div>
    <div style="position:relative;width:60px;height:60px;margin-bottom:12px;flex-shrink:0;">
      <div style="position:absolute;inset:0;border-radius:50%;border:1px solid rgba(220,38,38,.1);"></div>
      <div style="position:absolute;inset:0;border-radius:50%;border:2px solid transparent;border-top-color:#DC2626;border-right-color:rgba(220,38,38,.25);animation:ca-spin-cw 1.6s linear infinite;"></div>
      <div style="position:absolute;inset:8px;border-radius:50%;border:2px solid transparent;border-bottom-color:#ef4444;border-left-color:rgba(239,68,68,.2);animation:ca-spin-ccw 1s linear infinite;"></div>
      <div style="position:absolute;inset:16px;border-radius:50%;border:1px solid transparent;border-top-color:rgba(248,113,113,.6);animation:ca-spin-cw 0.7s linear infinite;"></div>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
        <div style="width:10px;height:10px;border-radius:50%;background:radial-gradient(circle,#ef4444,#DC2626);animation:ca-pulse-core 1.8s ease-in-out infinite;"></div>
      </div>
    </div>
    <div style="font-size:9px;font-weight:900;color:#fff;letter-spacing:1.5px;text-transform:uppercase;text-align:center;margin-bottom:6px;padding:0 12px;line-height:1.3;">${title}</div>
    <div style="display:flex;align-items:center;gap:4px;">
      <span style="width:3px;height:3px;border-radius:50%;background:#DC2626;display:inline-block;animation:ca-blink 1.1s ease-in-out infinite;"></span>
      <span style="width:3px;height:3px;border-radius:50%;background:#DC2626;display:inline-block;animation:ca-blink 1.1s ease-in-out .3s infinite;"></span>
      <span style="width:3px;height:3px;border-radius:50%;background:#DC2626;display:inline-block;animation:ca-blink 1.1s ease-in-out .6s infinite;"></span>
      <div style="font-size:7px;color:#DC2626;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-left:4px;">${detail}</div>
    </div>
  </div>`;
}

export async function renderEngine(container) {
  const { activeChannelId } = getState();
  if (!activeChannelId) { container.innerHTML = '<div class="loading-spinner">Selecciona un canal</div>'; return; }

  showLoader(container, { title: 'Cargando proyectos...', subtitle: 'Sincronizando miniaturas y configuración de marca', detail: 'CONSULTANDO BD' });

  let projects, brandKit, faceList;
  try {
    const [projectsRes, brandKitRes, facesRes] = await Promise.all([
      supabase.from('projects').select('*, thumbnail_variants(*)').eq('channel_id', activeChannelId).order('created_at', { ascending: false }),
      supabase.from('brand_kits').select('*').eq('channel_id', activeChannelId).maybeSingle(),
      supabase.from('face_vault').select('*').eq('channel_id', activeChannelId),
    ]);
    if (projectsRes.error) throw projectsRes.error;
    projects = projectsRes.data || [];
    brandKit = brandKitRes.data;
    faceList = facesRes.data || [];
  } catch (fetchErr) {
    console.error('Engine data fetch failed:', fetchErr);
    container.innerHTML = `
      <div style="padding:40px;text-align:center;">
        <div style="font-size:18px;font-weight:700;margin-bottom:8px;">Error cargando proyectos</div>
        <div class="text-muted" style="margin-bottom:16px;">${fetchErr.message || 'Supabase no respondió correctamente'}</div>
        <button class="btn btn-primary" onclick="location.hash='#engine';location.reload();">Reintentar</button>
      </div>`;
    return;
  }

  // UI State
  let selectedProjectId = projects[0]?.id || null;
  let workflowStep = selectedProjectId ? 2 : 1;
  let selectedFormats = [];
  let selectedStyleId = null;
  let isGenerating = false;
  let expandingVariantId = null;
  let batchAngleSelection = null; // null = all selected; array of indices = specific selection
  let faceEnabled = null;         // null = follow DNA match default; true/false = explicit user choice
  let selectedExpressionId = null; // persists face select across renders

  // Auto-matched face from DNA (set during render based on emotion_label)
  let autoMatchedFaceId = null;

  function getProject() { return projects.find(p => p.id === selectedProjectId); }

  // Cleanup any previous subscription stored on the container
  if (container._cleanup) { container._cleanup(); container._cleanup = null; }

  // ─── RENDER ROOT ──────────────────────────────────────────────────────────

  function render() {
    const project = getProject();
    const variants = project?.thumbnail_variants || [];
    const selectedAngles = project?.logic_dna?.selected_angles || [];

    if (!document.getElementById('thumb-lightbox')) {
      const lb = document.createElement('div');
      lb.id = 'thumb-lightbox';
      lb.innerHTML = '<img id="thumb-lightbox-img" src="" alt="Previsualización" />';
      document.body.appendChild(lb);
      lb.addEventListener('click', () => {
        lb.classList.remove('active');
        setTimeout(() => { lb.querySelector('img').src = ''; }, 260);
      });
    }

    if (project?.logic_dna?.visual_briefing?.emotion_label && faceList.length > 0) {
      const emotionLabel = project.logic_dna.visual_briefing.emotion_label;
      const match = faceList.find(f => f.expression_type === emotionLabel);
      autoMatchedFaceId = match?.id || faceList[0]?.id || null;
    } else {
      autoMatchedFaceId = faceList[0]?.id || null;
    }

    const canGoStep2 = !!selectedProjectId;
    const canGoStep3 = canGoStep2 && selectedFormats.length > 0;
    const canGenerate = canGoStep3 && !!selectedStyleId && selectedAngles.length > 0;
    const stepDone = [canGoStep2, canGoStep3, false];
    const canAccess = [true, canGoStep2, canGoStep3];
    const stepDefs = [
      { label: 'Proyecto', desc: 'Guión analizado' },
      { label: 'Formato', desc: 'Composición visual' },
      { label: 'Estilo & Generar', desc: 'Look + rostro + acción' },
    ];

    container.innerHTML = `<div class="animate-in">
      <div class="section-header" style="margin-bottom:var(--space-lg);">
        <div>
          <h2 class="section-title">${icon('cog', 22)} Fábrica Creativa</h2>
          <p class="section-subtitle">DNA Chain → Miniatura de alto CTR</p>
        </div>
      </div>

      <!-- Progress bar -->
      <div style="display:flex;align-items:center;margin-bottom:var(--space-xl);padding:0 2px;">
        ${stepDefs.map((s, i) => {
          const n = i + 1;
          const isActive = workflowStep === n;
          const isDone = stepDone[i];
          const accessible = canAccess[i];
          return `
          <div class="step-tab" data-step="${n}" ${!accessible ? 'disabled' : ''}
            style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;cursor:${accessible ? 'pointer' : 'default'};opacity:${!accessible ? 0.4 : 1};">
            <div style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;transition:all 0.2s;
              ${isDone
                ? 'background:var(--success);color:white;'
                : isActive
                  ? 'background:var(--accent);color:white;box-shadow:0 0 18px rgba(220,38,38,0.45);'
                  : 'background:var(--bg-elevated);color:var(--text-tertiary);border:1px solid var(--border);'}">
              ${isDone ? icon('check', 13) : n}
            </div>
            <div style="margin-top:7px;text-align:center;">
              <div style="font-size:11px;font-weight:${isActive ? '800' : '600'};white-space:nowrap;
                color:${isActive ? 'var(--text-primary)' : isDone ? 'var(--text-secondary)' : 'var(--text-tertiary)'};">${s.label}</div>
              <div style="font-size:9px;color:var(--text-tertiary);white-space:nowrap;margin-top:1px;">${s.desc}</div>
            </div>
          </div>
          ${i < stepDefs.length - 1 ? `<div style="flex:1;height:1px;margin:0 10px;margin-bottom:24px;
            background:${isDone ? 'var(--success)' : 'var(--border)'};opacity:${isDone ? '0.5' : '0.2'};"></div>` : ''}`;
        }).join('')}
      </div>

      <!-- Step content -->
      <div id="step-content" style="min-height:300px;">
        ${workflowStep === 1 ? renderProjectStep() : workflowStep === 2 ? renderFormatStep() : renderStyleGenStep(project, selectedAngles)}
      </div>

      <!-- Bottom nav -->
      <div class="flex justify-between items-center" style="margin-top:var(--space-lg);padding-top:var(--space-md);border-top:1px solid var(--border);">
        <button class="btn btn-secondary btn-sm" id="btn-prev-step" ${workflowStep === 1 ? 'disabled' : ''}>
          ${icon('arrowLeft', 14)} Anterior
        </button>
        ${workflowStep < 3 ? `
          <div style="display:flex;align-items:center;gap:10px;">
            ${workflowStep === 1 && !canGoStep2 ? `<span class="text-xs text-muted">Seleccioná un proyecto</span>` : ''}
            ${workflowStep === 2 && !canGoStep3 ? `<span class="text-xs text-muted">Elegí al menos un formato</span>` : ''}
            <button class="btn btn-primary" id="btn-next-step" style="padding:8px 20px;"
              ${(workflowStep === 1 && !canGoStep2) || (workflowStep === 2 && !canGoStep3) ? 'disabled' : ''}>
              Siguiente ${icon('arrowRight', 14)}
            </button>
          </div>
        ` : `
          <button class="btn btn-primary" id="btn-generate-master" ${!canGenerate || isGenerating ? 'disabled' : ''}
            style="background:linear-gradient(135deg,var(--accent),#9333ea);font-size:14px;padding:12px 28px;font-weight:800;letter-spacing:0.5px;border-radius:var(--radius-md);">
            ${isGenerating
              ? `<span class="animate-pulse">${icon('clock', 16)}</span> Generando...`
              : `${icon('rocket', 16)} GENERAR ${selectedAngles.length} MINIATURA${selectedAngles.length !== 1 ? 'S' : ''}`}
          </button>
        `}
      </div>

      ${project && variants.length > 0 ? renderVariantsHistory(project, variants) : ''}
    </div>`;

    bindEvents();
  }

  // ─── DNA CHECKLIST ────────────────────────────────────────────────────────

  function renderDNAChecklist(project) {
    const vb = project?.logic_dna?.visual_briefing;
    const adn = brandKit?.detailed_adn?.synthesis || brandKit?.detailed_adn || {};
    const styleSummary = brandKit?.style_summary;
    const marketContrast = project?.logic_dna?.market_contrast;

    const heroObject = vb?.hero_object;
    const emotionLabel = vb?.emotion_label;
    const matchedFace = faceList.find(f => f.id === autoMatchedFaceId);
    const visualStyle = styleSummary?.visual_style || styleSummary?.winning_pattern;
    const avoidColors = marketContrast?.avoid_colors || [];
    const brandTone = adn?.tone;

    const checkItem = (ok, label, value) => `
      <div class="flex items-start gap-sm" style="padding:6px 0; border-bottom:1px solid var(--border);">
        <span style="color:${ok ? 'var(--success)' : 'var(--text-tertiary)'}; font-size:14px; flex-shrink:0; margin-top:1px;">${ok ? '✅' : '⬜'}</span>
        <div>
          <div class="text-xs font-bold" style="color:${ok ? 'var(--text-primary)' : 'var(--text-muted)'};">${label}</div>
          ${ok && value ? `<div class="text-xs text-muted" style="margin-top:2px; line-height:1.4;">${value}</div>` : ''}
        </div>
      </div>`;

    const allReady = heroObject && emotionLabel && matchedFace && visualStyle && brandTone;

    return `
    <div class="card mb-md" style="background:linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05)); border-color:rgba(99,102,241,0.3);">
      <div class="flex items-center justify-between mb-sm">
        <div class="text-xs font-bold" style="letter-spacing:1px; text-transform:uppercase; color:#818cf8;">🧬 DNA Chain — Insumos para la Fábrica</div>
        ${allReady
        ? `<span class="badge" style="background:rgba(16,185,129,0.2); color:var(--success); font-size:9px;">✅ LISTO PARA SINTETIZAR</span>`
        : `<span class="badge badge-neutral" style="font-size:9px; opacity:0.7;">Completá los pilares</span>`}
      </div>
      ${checkItem(!!heroObject, 'Objeto Héroe Detectado', heroObject)}
      ${checkItem(!!(emotionLabel && matchedFace), 'Cara Seleccionada por Match', matchedFace ? `${matchedFace.expression_type} — match con emoción "${emotionLabel}"` : emotionLabel ? `"${emotionLabel}" detectada, sin foto con ese label en Face Vault` : null)}
      ${checkItem(!!visualStyle, 'Estilo Visual de Galería', visualStyle)}
      ${checkItem(!!brandTone, 'Tono de Marca (ADN)', brandTone)}
      ${checkItem(avoidColors.length > 0, 'Restricción de Mercado', avoidColors.length > 0 ? `Evitar: ${avoidColors.join(', ')}` : null)}
    </div>`;
  }

  // ─── Partial re-render (step content only — no header/progress/nav flash) ──

  function rerenderStep() {
    const el = document.getElementById('step-content');
    if (!el) { render(); return; }
    const project = getProject();
    const selectedAngles = project?.logic_dna?.selected_angles || [];
    el.innerHTML = workflowStep === 1 ? renderProjectStep()
      : workflowStep === 2 ? renderFormatStep()
      : renderStyleGenStep(project, selectedAngles);
    bindStepContentEvents();
  }

  // ─── STEP 1: Proyecto ─────────────────────────────────────────────────────

  function renderProjectStep() {
    const selectedProject = getProject();

    const projectListHTML = projects.length === 0 ? `
      <div style="text-align:center;padding:var(--space-xl);opacity:0.5;">
        ${icon('brain', 32)}
        <p class="text-sm text-muted mt-md">Sin proyectos. Procesá un guión en El Cerebro.</p>
      </div>
    ` : `
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:var(--space-md);">
        ${projects.map(p => {
          const pAngles = p.logic_dna?.selected_angles || [];
          const pVariants = p.thumbnail_variants || [];
          const hasVB = !!p.logic_dna?.visual_briefing;
          const isActive = p.id === selectedProjectId;
          return `
          <div class="project-row" data-project-id="${p.id}" style="
            display:flex;align-items:center;gap:12px;padding:12px 14px;
            background:${isActive ? 'rgba(220,38,38,0.08)' : 'var(--bg-card)'};
            border:1px solid ${isActive ? 'var(--accent)' : 'var(--border)'};
            border-radius:var(--radius-md);cursor:pointer;transition:all 0.15s;">
            <span style="color:${isActive ? 'var(--accent)' : 'var(--text-tertiary)'};flex-shrink:0;">${icon('folder', 16)}</span>
            <div style="flex:1;min-width:0;">
              <div class="font-bold" style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${isActive ? 'var(--text-primary)' : 'var(--text-secondary)'};">${p.title}</div>
              ${p.logic_dna?.hook ? `<div class="text-xs text-muted" style="margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:0.65;">${p.logic_dna.hook}</div>` : ''}
              <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;">
                ${pAngles.length > 0 ? `<span class="badge badge-neutral" style="font-size:9px;">${pAngles.length} ángulos</span>` : ''}
                ${pVariants.length > 0 ? `<span class="badge badge-accent" style="font-size:9px;">${pVariants.length} miniatura${pVariants.length !== 1 ? 's' : ''}</span>` : ''}
                ${hasVB ? `<span class="badge" style="font-size:9px;background:rgba(99,102,241,0.2);color:#818cf8;">🧬 DNA</span>` : ''}
              </div>
            </div>
            <div style="display:flex;gap:5px;flex-shrink:0;">
              <button class="btn-rename-project" data-project-id="${p.id}" data-project-title="${p.title.replace(/"/g, '&quot;')}"
                style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;background:rgba(129,140,248,0.1);border:1px solid rgba(129,140,248,0.25);border-radius:6px;cursor:pointer;color:#818cf8;"
                title="Renombrar">
                ${icon('edit', 11)}
              </button>
              <button class="btn-delete-project" data-project-id="${p.id}"
                style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.25);border-radius:6px;cursor:pointer;color:#ef4444;"
                title="Eliminar">
                ${icon('trash', 11)}
              </button>
            </div>
          </div>`;
        }).join('')}
      </div>`;

    return `
    <div>
      ${selectedProject ? `
      <!-- Selected project display -->
      <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(220,38,38,0.08);border:1px solid var(--accent);border-radius:var(--radius-md);margin-bottom:var(--space-md);">
        <span style="color:var(--accent);flex-shrink:0;">${icon('folder', 16)}</span>
        <div style="flex:1;min-width:0;">
          <div class="font-bold" style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${selectedProject.title}</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:3px;">
            ${(selectedProject.logic_dna?.selected_angles||[]).length > 0 ? `<span class="badge badge-neutral" style="font-size:9px;">${selectedProject.logic_dna.selected_angles.length} ángulos</span>` : ''}
            ${(selectedProject.thumbnail_variants||[]).length > 0 ? `<span class="badge badge-accent" style="font-size:9px;">${selectedProject.thumbnail_variants.length} miniatura${selectedProject.thumbnail_variants.length !== 1 ? 's' : ''}</span>` : ''}
            ${selectedProject.logic_dna?.visual_briefing ? `<span class="badge" style="font-size:9px;background:rgba(99,102,241,0.2);color:#818cf8;">🧬 DNA</span>` : ''}
          </div>
        </div>
        <span style="color:var(--success);font-size:18px;flex-shrink:0;">✓</span>
      </div>
      ` : ''}

      <!-- CTA button -->
      <button id="btn-open-project-modal"
        style="width:100%;padding:14px 20px;background:var(--accent);border:none;border-radius:var(--radius-md);cursor:pointer;color:white;font-size:13px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:8px;">
        ${icon('folder', 15)} ${selectedProject ? 'CAMBIAR PROYECTO O VIDEO' : 'ELEGÍ TU PROYECTO O VIDEO'}
      </button>
    </div>`;
  }

  // ─── Project modal overlay ────────────────────────────────────────────────

  function openProjectModal() {
    document.getElementById('project-modal-overlay')?.remove();

    let modalSelectedId = selectedProjectId;

    function buildProjectRows(filter) {
      const q = (filter || '').toLowerCase();
      const filtered = q
        ? projects.filter(p =>
            p.title.toLowerCase().includes(q) ||
            (p.logic_dna?.hook || '').toLowerCase().includes(q))
        : projects;

      if (filtered.length === 0) return `
        <div style="text-align:center;padding:40px;opacity:0.5;">
          ${icon('brain', 32)}
          <p class="text-sm text-muted" style="margin-top:12px;">Sin resultados.</p>
        </div>`;

      return filtered.map(p => {
        const pAngles = p.logic_dna?.selected_angles || [];
        const pVariants = p.thumbnail_variants || [];
        const hasVB = !!p.logic_dna?.visual_briefing;
        const isActive = p.id === modalSelectedId;
        return `
        <div class="modal-project-row" data-project-id="${p.id}" style="
          display:flex;align-items:center;gap:12px;padding:14px 16px;
          background:${isActive ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.03)'};
          border:1.5px solid ${isActive ? 'var(--accent)' : 'rgba(255,255,255,0.07)'};
          border-radius:10px;cursor:pointer;transition:all 0.15s;margin-bottom:8px;">
          <span style="color:${isActive ? 'var(--accent)' : 'var(--text-tertiary)'};flex-shrink:0;">${icon('folder', 18)}</span>
          <div style="flex:1;min-width:0;">
            <div class="font-bold" style="font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${isActive ? 'var(--text-primary)' : 'var(--text-secondary)'};">${p.title}</div>
            ${p.logic_dna?.hook ? `<div class="text-xs text-muted" style="margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:0.6;">${p.logic_dna.hook}</div>` : ''}
            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:5px;">
              ${pAngles.length > 0 ? `<span class="badge badge-neutral" style="font-size:9px;">${pAngles.length} ángulos</span>` : ''}
              ${pVariants.length > 0 ? `<span class="badge badge-accent" style="font-size:9px;">${pVariants.length} miniatura${pVariants.length !== 1 ? 's' : ''}</span>` : ''}
              ${hasVB ? `<span class="badge" style="font-size:9px;background:rgba(99,102,241,0.2);color:#818cf8;">🧬 DNA</span>` : ''}
            </div>
          </div>
          <div style="display:flex;gap:5px;flex-shrink:0;">
            <button class="modal-btn-rename" data-project-id="${p.id}" data-project-title="${p.title.replace(/"/g, '&quot;')}"
              style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:rgba(129,140,248,0.1);border:1px solid rgba(129,140,248,0.25);border-radius:7px;cursor:pointer;color:#818cf8;"
              title="Renombrar">
              ${icon('edit', 12)}
            </button>
            <button class="modal-btn-delete" data-project-id="${p.id}"
              style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.25);border-radius:7px;cursor:pointer;color:#ef4444;"
              title="Eliminar">
              ${icon('trash', 12)}
            </button>
          </div>
        </div>`;
      }).join('');
    }

    const overlay = document.createElement('div');
    overlay.id = 'project-modal-overlay';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:9999;
      background:rgba(0,0,0,0.75);
      backdrop-filter:blur(8px);
      -webkit-backdrop-filter:blur(8px);
      display:flex;align-items:center;justify-content:center;
      padding:20px;
    `;

    overlay.innerHTML = `
      <div style="
        background:var(--bg-secondary);
        border:1px solid var(--border);
        border-radius:16px;
        width:100%;
        max-width:680px;
        max-height:85vh;
        display:flex;
        flex-direction:column;
        overflow:hidden;
        box-shadow:0 24px 80px rgba(0,0,0,0.6);
      ">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;border-bottom:1px solid var(--border);flex-shrink:0;">
          <div>
            <div class="font-bold" style="font-size:16px;">Seleccioná tu proyecto o video</div>
            <div class="text-xs text-muted" style="margin-top:2px;">${projects.length} proyecto${projects.length !== 1 ? 's' : ''} disponible${projects.length !== 1 ? 's' : ''}</div>
          </div>
          <button id="modal-close-btn" style="width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:8px;cursor:pointer;color:var(--text-secondary);font-size:16px;">✕</button>
        </div>

        <div style="padding:14px 24px;border-bottom:1px solid var(--border);flex-shrink:0;">
          <div style="position:relative;">
            <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-tertiary);pointer-events:none;">${icon('search', 14)}</span>
            <input id="modal-search-input" type="text" placeholder="Buscá por título o tema del video..."
              style="width:100%;padding:10px 12px 10px 36px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-size:13px;box-sizing:border-box;outline:none;" />
          </div>
        </div>

        <div id="modal-project-list" style="flex:1;overflow-y:auto;padding:16px 24px;">
          ${buildProjectRows()}
        </div>

        <div style="padding:16px 24px;border-top:1px solid var(--border);flex-shrink:0;">
          <button id="modal-confirm-btn"
            ${!modalSelectedId ? 'disabled' : ''}
            style="width:100%;padding:14px 20px;background:${modalSelectedId ? 'var(--accent)' : 'rgba(255,255,255,0.08)'};border:none;border-radius:10px;cursor:${modalSelectedId ? 'pointer' : 'not-allowed'};color:${modalSelectedId ? 'white' : 'var(--text-tertiary)'};font-size:14px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;transition:all 0.2s;">
            ${modalSelectedId ? '🚀 VAMOS A CREAR' : 'Seleccioná un proyecto primero'}
          </button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('modal-search-input')?.focus(), 50);

    function updateConfirmBtn() {
      const btn = document.getElementById('modal-confirm-btn');
      if (!btn) return;
      if (modalSelectedId) {
        btn.disabled = false;
        btn.style.background = 'var(--accent)';
        btn.style.color = 'white';
        btn.style.cursor = 'pointer';
        btn.textContent = '🚀 VAMOS A CREAR';
      } else {
        btn.disabled = true;
        btn.style.background = 'rgba(255,255,255,0.08)';
        btn.style.color = 'var(--text-tertiary)';
        btn.style.cursor = 'not-allowed';
        btn.textContent = 'Seleccioná un proyecto primero';
      }
    }

    function refreshList() {
      const filter = document.getElementById('modal-search-input')?.value || '';
      const list = document.getElementById('modal-project-list');
      if (list) list.innerHTML = buildProjectRows(filter);
      bindModalRowEvents();
    }

    function bindModalRowEvents() {
      overlay.querySelectorAll('.modal-project-row').forEach(row => {
        row.addEventListener('click', (e) => {
          if (e.target.closest('.modal-btn-rename') || e.target.closest('.modal-btn-delete')) return;
          modalSelectedId = row.dataset.projectId;
          refreshList();
          updateConfirmBtn();
        });
      });

      overlay.querySelectorAll('.modal-btn-rename').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const projectId = btn.dataset.projectId;
          const currentTitle = btn.dataset.projectTitle;
          const newTitle = await inputDialog('Ingresá el nuevo nombre para este proyecto', {
            title: 'Renombrar Proyecto',
            defaultValue: currentTitle,
            placeholder: 'Nombre del proyecto...',
            confirmLabel: 'Renombrar',
          });
          if (!newTitle || newTitle === currentTitle) return;
          try {
            const { error } = await supabase.from('projects').update({ title: newTitle }).eq('id', projectId);
            if (error) throw error;
            await reloadProjects();
            refreshList();
            toast('Proyecto renombrado', 'success', 2500);
          } catch (err) {
            toast('Error al renombrar: ' + err.message, 'error');
          }
        });
      });

      overlay.querySelectorAll('.modal-btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const projectId = btn.dataset.projectId;
          const project = projects.find(p => p.id === projectId);
          if (!project) return;
          const variantCount = (project.thumbnail_variants || []).length;
          const ok = await confirmDialog(
            `¿Eliminar "${project.title}"?\nSe borrarán ${variantCount} miniatura${variantCount !== 1 ? 's' : ''} y todos los datos. Esta acción no se puede deshacer.`,
            { title: 'Eliminar Proyecto', confirmLabel: 'Eliminar', danger: true }
          );
          if (!ok) return;
          try {
            for (const v of (project.thumbnail_variants || [])) {
              if (v.image_url) {
                const parts = v.image_url.split('/public/thumbnails/');
                if (parts.length > 1) await supabase.storage.from('thumbnails').remove([parts[1]]).catch(() => {});
              }
            }
            await supabase.from('thumbnail_variants').delete().eq('project_id', projectId);
            const { error } = await supabase.from('projects').delete().eq('id', projectId);
            if (error) throw error;
            if (modalSelectedId === projectId) modalSelectedId = null;
            if (selectedProjectId === projectId) {
              selectedProjectId = null;
              workflowStep = 1;
              selectedFormats = [];
              selectedStyleId = null;
              batchAngleSelection = null;
            }
            await reloadProjects();
            refreshList();
            updateConfirmBtn();
            toast('Proyecto eliminado', 'success', 2500);
          } catch (err) {
            toast('Error al eliminar: ' + err.message, 'error');
          }
        });
      });
    }

    document.getElementById('modal-close-btn').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('modal-search-input').addEventListener('input', refreshList);
    document.getElementById('modal-confirm-btn').addEventListener('click', () => {
      if (!modalSelectedId) return;
      if (selectedProjectId !== modalSelectedId) {
        selectedProjectId = modalSelectedId;
        selectedFormats = [];
        selectedStyleId = null;
        batchAngleSelection = null;
      }
      overlay.remove();
      rerenderStep();
    });

    bindModalRowEvents();
  }

  // ─── STEP 2: Formato ──────────────────────────────────────────────────────

  // Analyzes project DNA and returns format recommendations with reasons.
  // Deterministic — no API call. Runs on the logic_dna already in the project.
  function recommendFormats(project) {
    const dna = project?.logic_dna || {};
    const hook       = (dna.hook || '').toLowerCase();
    const tension    = (dna.tension || '').toLowerCase();
    const promise    = (dna.promise || '').toLowerCase();
    const hero       = (dna.visual_briefing?.hero_object || '').toLowerCase();
    const conflict   = (dna.visual_briefing?.central_conflict || '').toLowerCase();
    const title      = (project.title || '').toLowerCase();
    const angles     = dna.selected_angles || [];
    const angleNames = angles.map(a => (a.name || '').toLowerCase()).join(' ');
    const anglePsych = angles.map(a => (a.psychology || a.psychology_text || '').toLowerCase()).join(' ');
    const all = [hook, tension, promise, hero, conflict, title, angleNames, anglePsych].join(' ');

    const recs = [];

    // ── VERSUS ──
    const versusHits = ['vs ', 'versus', ' contra ', 'comparar', 'comparativ', 'mejor que', 'peor que',
      'diferencia', 'contraste extremo', 'antes y después', 'ganador', 'perdedor', 'duelo', 'batalla']
      .filter(k => all.includes(k)).length;
    if (versusHits >= 1 || angleNames.includes('contraste')) {
      recs.push({
        id: 'versus',
        reason: versusHits >= 2
          ? 'El guión es una comparación directa — el split screen es el formato más reconocido y efectivo para este tema.'
          : 'El ángulo de Contraste Extremo genera el mayor impacto visual con la composición dividida.',
        confidence: versusHits >= 2 || angleNames.includes('contraste') ? 'alta' : 'media',
      });
    }

    // ── AUTHORITY ──
    const authHits = ['autoridad', 'experto', 'definitiv', 'solución', 'tutorial', 'cómo ', 'guía',
      'sistema', 'herramienta', 'dominar', 'master', 'mejor manera', 'paso a paso']
      .filter(k => all.includes(k)).length;
    if (authHits >= 1 || angleNames.includes('autoridad')) {
      recs.push({
        id: 'authority',
        reason: 'El objeto héroe del guión domina visualmente. La composición de autoridad lo pone al frente y comunica liderazgo técnico en 0.3 segundos.',
        confidence: angleNames.includes('autoridad') ? 'alta' : 'media',
      });
    }

    // ── SHOCK ──
    const shockHits = ['curiosidad', 'secreto', 'oculto', 'nadie te', 'no te dijeron', 'misterio',
      'revela', 'increíble', 'impactante', 'sorpresa', 'no puedo creer', 'descubr']
      .filter(k => all.includes(k)).length;
    if (shockHits >= 1 || angleNames.includes('curiosidad')) {
      recs.push({
        id: 'shock',
        reason: 'El gap de curiosidad del guión pide ocultamiento estratégico. La caja negra genera el itch mental que obliga el clic.',
        confidence: angleNames.includes('curiosidad') ? 'alta' : 'media',
      });
    }

    // ── BREAKING ──
    const breakingHits = ['urgencia', 'urgente', 'fomo', 'ahora', 'peligro', 'error', 'falló',
      'noticia', 'alerta', 'advertencia', 'cuidado', 'obsoleto', 'cancelad', 'breaking',
      'se acaba', 'último momento', 'ya no', 'murió', 'fin de']
      .filter(k => all.includes(k)).length;
    if (breakingHits >= 1 || angleNames.includes('urgencia') || angleNames.includes('miedo')) {
      recs.push({
        id: 'breaking',
        reason: 'El tono de urgencia y alerta del guión encaja perfectamente con la estética de noticia de última hora — máxima saturación emocional.',
        confidence: (angleNames.includes('urgencia') || angleNames.includes('miedo')) ? 'alta' : 'media',
      });
    }

    // Sort: alta confidence first
    recs.sort((a, b) => (a.confidence === 'alta' ? -1 : 1) - (b.confidence === 'alta' ? -1 : 1));
    return recs;
  }

  function renderFormatStep() {
    const project = getProject();
    const recs = project ? recommendFormats(project) : [];
    const recMap = Object.fromEntries(recs.map(r => [r.id, r]));

    return `
    <div>
      <div style="font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:var(--space-md);">
        Elegí el formato de composición — podés seleccionar varios
      </div>

      ${recs.length > 0 ? `
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:var(--space-md);">
        <span style="font-size:10px;font-weight:700;color:var(--text-tertiary);white-space:nowrap;">✦ IA recomienda:</span>
        ${recs.map(r => {
          const f = FORMATS.find(x => x.id === r.id);
          return `<span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;
            ${r.confidence === 'alta'
              ? 'background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.35);'
              : 'background:rgba(245,158,11,0.12);color:#f59e0b;border:1px solid rgba(245,158,11,0.3);'}
          ">${f?.emoji} ${f?.label}</span>`;
        }).join('')}
      </div>
      ` : ''}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
        ${FORMATS.map(f => {
          const isSelected = selectedFormats.includes(f.id);
          const rec = recMap[f.id];
          const isHighRec = rec?.confidence === 'alta';
          return `
          <div class="card format-card" data-format-id="${f.id}" style="cursor:pointer;padding:var(--space-md);transition:all 0.15s;position:relative;
            ${isSelected
              ? 'border-color:var(--accent);background:rgba(220,38,38,0.07);'
              : isHighRec
                ? 'border-color:rgba(16,185,129,0.35);'
                : ''}">
            <div style="position:absolute;top:10px;right:10px;width:20px;height:20px;border-radius:50%;
              border:2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'};
              background:${isSelected ? 'var(--accent)' : 'transparent'};
              display:flex;align-items:center;justify-content:center;color:white;">
              ${isSelected ? icon('check', 10) : ''}
            </div>
            ${isHighRec && !isSelected ? `<div style="position:absolute;top:10px;left:10px;font-size:8px;font-weight:900;letter-spacing:1px;text-transform:uppercase;padding:2px 6px;border-radius:3px;background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.35);">✦ IA</div>` : ''}
            <div style="font-size:32px;margin-bottom:8px;margin-top:${isHighRec ? '18px' : '0'};">${f.emoji}</div>
            <div class="font-bold" style="font-size:14px;">${f.label}</div>
            <div class="text-xs" style="color:${isHighRec ? '#10b981' : 'var(--accent)'};margin-top:2px;">${f.subtitle}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  // ─── STEP 3: Estilo + Rostro + Generar ────────────────────────────────────

  function renderStyleGenStep(project, selectedAngles) {
    if (!project) return `<div class="card" style="text-align:center;padding:var(--space-2xl);opacity:0.5;">${icon('folder', 40)}<p class="text-sm text-muted mt-md">Seleccioná un proyecto primero</p></div>`;
    if (selectedAngles.length === 0) return `<div class="card" style="text-align:center;padding:var(--space-xl);opacity:0.6;">${icon('crosshair', 32)}<p class="text-sm text-muted mt-sm">Este proyecto no tiene ángulos.<br/>Volvé a El Cerebro y elegí ángulos.</p></div>`;

    const vb = project?.logic_dna?.visual_briefing;
    const emotionLabel = vb?.emotion_label;
    const matchedFace = faceList.find(f => f.id === autoMatchedFaceId);
    const effectiveUseFace = faceEnabled !== null ? faceEnabled : !!matchedFace;
    const effectiveExpressionId = selectedExpressionId || autoMatchedFaceId;

    return `
    <div>
      <!-- Estilo visual -->
      <div style="font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:var(--space-md);">
        Elegí el estilo visual
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:var(--space-lg);">
        ${STYLES.map(s => {
          const isSelected = selectedStyleId === s.id;
          return `
          <div class="card style-card" data-style-id="${s.id}" style="cursor:pointer;padding:12px;transition:all 0.15s;position:relative;
            ${isSelected ? 'border-color:var(--accent);background:rgba(220,38,38,0.07);' : ''}">
            <div style="position:absolute;top:8px;right:8px;width:18px;height:18px;border-radius:50%;
              border:2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'};
              background:${isSelected ? 'var(--accent)' : 'transparent'};
              display:flex;align-items:center;justify-content:center;color:white;">
              ${isSelected ? icon('check', 9) : ''}
            </div>
            <div style="font-size:24px;margin-bottom:6px;">${s.emoji}</div>
            <div class="font-bold" style="font-size:12px;">${s.label}</div>
            <div class="text-xs" style="color:var(--accent);margin-top:2px;">${s.subtitle}</div>
          </div>`;
        }).join('')}
      </div>

      <!-- Rostro -->
      <div style="border-top:1px solid var(--border);padding-top:var(--space-md);margin-bottom:var(--space-md);">
        <div style="font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:10px;">
          Rostro del creador
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;
          background:var(--bg-tertiary);border:1px solid ${effectiveUseFace ? 'rgba(220,38,38,0.4)' : 'var(--border)'};
          border-radius:var(--radius-md);transition:border-color 0.2s;">
          <div>
            <div class="font-bold text-sm">${effectiveUseFace ? '🤳 Con rostro' : '🚫 Sin rostro'}</div>
            <div class="text-xs text-muted" style="margin-top:2px;">
              ${effectiveUseFace && matchedFace
                ? `${matchedFace.expression_type}${emotionLabel ? ` — match DNA "${emotionLabel}"` : ''}`
                : effectiveUseFace && faceList.length === 0
                  ? '⚠️ No hay fotos en Face Vault — subí fotos en Brand Kit'
                  : effectiveUseFace
                    ? 'Seleccioná la expresión abajo'
                    : 'La miniatura se genera sin cara'}
            </div>
          </div>
          <label style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer;flex-shrink:0;">
            <input type="checkbox" id="check-use-face" style="opacity:0;width:0;height:0;position:absolute;" ${effectiveUseFace ? 'checked' : ''} />
            <span style="position:absolute;inset:0;border-radius:12px;background:${effectiveUseFace ? 'var(--accent)' : 'var(--bg-elevated)'};border:1px solid ${effectiveUseFace ? 'var(--accent)' : 'var(--border)'};transition:background 0.2s;"></span>
            <span style="position:absolute;top:3px;left:${effectiveUseFace ? '23px' : '3px'};width:16px;height:16px;border-radius:50%;background:white;transition:left 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></span>
          </label>
        </div>
        ${effectiveUseFace && faceList.length > 0 ? `
        <select class="form-select" id="select-expression-step3" style="font-size:12px;margin-top:8px;">
          ${faceList.map(f => `<option value="${f.id}" ${f.id === effectiveExpressionId ? 'selected' : ''}>${f.expression_type || 'Sin etiqueta'}</option>`).join('')}
        </select>` : ''}
      </div>

      <!-- Ángulos — resumen (solo info, todos incluidos automáticamente) -->
      <div style="padding:10px 14px;background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.2);border-radius:var(--radius-md);margin-bottom:var(--space-md);">
        <div style="font-size:10px;font-weight:700;color:#818cf8;margin-bottom:5px;">
          ${icon('crosshair', 10)} ${selectedAngles.length} ángulo${selectedAngles.length !== 1 ? 's' : ''} — se generará 1 miniatura por ángulo
        </div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;">
          ${selectedAngles.map((a, i) => `
            <span style="font-size:10px;padding:2px 9px;border-radius:20px;background:rgba(99,102,241,0.15);color:#818cf8;font-weight:600;">
              ${['A','B','C','D','E'][i] || i+1} · ${a.name}
            </span>`).join('')}
        </div>
      </div>

      <!-- Texto overlay (opcional, simple) -->
      <div>
        <div style="font-size:10px;font-weight:700;color:var(--text-tertiary);letter-spacing:0.5px;margin-bottom:6px;">Texto de overlay (opcional)</div>
        <input type="text" class="form-input" id="custom-overlay-text" placeholder="1-3 palabras en mayúsculas..." style="font-size:12px;font-weight:800;letter-spacing:1px;" />
      </div>
    </div>`;
  }

  // ─── Variants history ─────────────────────────────────────────────────────

  function renderVariantsHistory(project, variants) {
    if (variants.length === 0) return '';
    const generating = variants.filter(v => v.ai_metadata?.generating).length;
    const masters = variants.filter(v => !v.ai_metadata?.parent_id);
    const children = variants.filter(v => !!v.ai_metadata?.parent_id);

    const renderCard = (v, i, isChild = false) => {
      const isGen = v.ai_metadata?.generating;
      const hasError = v.ai_metadata?.error;
      const isExpanding = expandingVariantId === v.id;
      const imgSrc = v.image_url || null;
      const childCount = children.filter(c => c.ai_metadata?.parent_id === v.id).length;
      const safeTitle = project.title.slice(0, 20).replace(/\s+/g, '-');

      return `
      <div class="thumbnail-card${isChild ? ' variant-child' : ''}" style="animation:fadeIn 0.35s ease both; animation-delay:${i * 0.05}s;${isChild ? 'margin-left:var(--space-sm); border-left:2px solid var(--accent);' : ''}">
        <div class="thumb-img" style="background:linear-gradient(${135 + i * 30}deg,#0a0a1a,#1a0a2e); position:relative; aspect-ratio:16/9;">
          <button class="btn-delete-variant" data-variant-id="${v.id}" title="Eliminar miniatura"
            style="position:absolute;top:6px;right:6px;z-index:10;background:rgba(0,0,0,0.65);border:1px solid rgba(255,255,255,0.15);border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,0.7);transition:all 0.15s;"
            onmouseover="this.style.background='rgba(220,38,38,0.85)';this.style.color='white';"
            onmouseout="this.style.background='rgba(0,0,0,0.65)';this.style.color='rgba(255,255,255,0.7)';">
            ${icon('trash', 12)}
          </button>
          ${imgSrc
          ? `<img src="${imgSrc}" alt="Miniatura" class="thumb-preview-trigger" data-preview="${imgSrc}" style="width:100%;height:100%;object-fit:cover;cursor:zoom-in;" />`
          : isGen
            ? thumbLoaderHTML()
            : hasError
              ? `<div class="flex flex-col items-center justify-center h-full p-md text-center gap-xs">
                     <span style="color:var(--danger);">${icon('alertTriangle', 24)}</span>
                     <div class="text-xs text-muted" style="font-size:10px;">${v.ai_metadata.error.slice(0, 60)}</div>
                   </div>`
              : `<div class="flex flex-col items-center justify-center h-full p-md text-center">
                     <div style="font-size:10px; text-transform:uppercase; letter-spacing:1px; opacity:0.4; margin-bottom:4px;">Concepto Visual</div>
                     <div style="font-size:11px; opacity:0.75; line-height:1.4;">${(v.ai_metadata?.prompt || '').slice(0, 80)}...</div>
                   </div>`}
          ${imgSrc ? `
          <div style="position:absolute;bottom:0;left:0;right:0;padding:8px;background:linear-gradient(transparent,rgba(0,0,0,0.85));">
            <div style="font-family:var(--font-impact);font-size:14px;color:white;letter-spacing:2px;">${v.overlay_text || ''}</div>
          </div>` : ''}
        </div>
        <div class="thumb-info">
          <div class="flex gap-xs mb-xs" style="flex-wrap:wrap;">
            <span class="badge badge-accent" style="font-size:9px;">${v.style_preset || 'default'}</span>
            ${v.ai_metadata?.angle_name ? `<span class="badge badge-neutral" style="font-size:9px;">${v.ai_metadata.angle_name}</span>` : ''}
            ${isChild ? `<span class="badge badge-neutral" style="font-size:9px;">Variación</span>` : ''}
            <span class="font-bold ${(v.impact_score || 0) >= 90 ? 'text-success' : 'text-accent'}" style="font-size:12px; margin-left:auto;">${v.impact_score || 0}</span>
          </div>
          ${imgSrc && !isGen ? `
          <div class="flex gap-xs">
            <button class="btn btn-secondary btn-xs btn-download" data-src="${imgSrc}" data-name="miniatura-${safeTitle}-${i + 1}.png"
              title="Descargar" style="flex:0;">
              ${icon('download', 12)} Descargar
            </button>
            ${!isChild ? `
            <div class="flex gap-xs" style="flex:1; align-items:center;">
              <select class="form-select" id="expand-count-${v.id}" style="font-size:10px; padding:3px 6px; flex:1; height:26px;">
                ${[1, 2, 3, 4, 5].map(n => `<option value="${n}"${n === 1 ? ' selected' : ''}>${n} variación${n > 1 ? 'es' : ''}</option>`).join('')}
              </select>
              <button class="btn btn-primary btn-xs btn-expand-variant" data-variant-id="${v.id}" data-count="3"
                ${isExpanding || expandingVariantId ? 'disabled' : ''} style="white-space:nowrap;">
                ${isExpanding ? `<span class="animate-pulse">${icon('clock', 10)}</span>` : icon('plus', 10)} Variar
              </button>
            </div>` : ''}
          </div>
          ${childCount > 0 && !isChild ? `<div class="text-xs text-muted mt-xs" style="font-size:10px;">${icon('image', 10)} ${childCount} variación${childCount > 1 ? 'es' : ''} generada${childCount > 1 ? 's' : ''}</div>` : ''}
          ` : ''}
        </div>
      </div>`;
    };

    let cards = '';
    masters.forEach((m, i) => {
      cards += renderCard(m, i, false);
      const mChildren = children.filter(c => c.ai_metadata?.parent_id === m.id);
      mChildren.forEach((c, j) => { cards += renderCard(c, j, true); });
    });

    return `
    <div class="mt-lg">
      <div class="flex items-center justify-between mb-sm">
        <div class="text-xs font-bold text-muted" style="letter-spacing:1px; text-transform:uppercase;">${icon('image', 12)} Miniaturas (${variants.length})</div>
        ${generating > 0 ? `<span class="text-xs text-accent animate-pulse">${icon('clock', 12)} Generando ${generating}...</span>` : ''}
      </div>
      <div class="grid-3">${cards}</div>
    </div>`;
  }

  // ─── EVENTS ───────────────────────────────────────────────────────────────

  function bindEvents() {
    bindStepContentEvents();

    container.querySelectorAll('.step-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const n = parseInt(btn.dataset.step);
        if (!btn.disabled) { workflowStep = n; render(); }
      });
    });

    document.getElementById('btn-prev-step')?.addEventListener('click', () => {
      if (workflowStep > 1) { workflowStep--; render(); }
    });
    document.getElementById('btn-next-step')?.addEventListener('click', () => {
      if (workflowStep < 3) { workflowStep++; render(); }
    });

    container.querySelectorAll('.btn-delete-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const variantId = btn.dataset.variantId;
        const project = getProject();
        if (!project) return;
        const variant = (project.thumbnail_variants || []).find(v => v.id === variantId);
        try {
          if (variant?.image_url) {
            const urlParts = variant.image_url.split('/public/thumbnails/');
            if (urlParts.length > 1) {
              await supabase.storage.from('thumbnails').remove([urlParts[1]]).catch(() => { });
            }
          }
          const { error } = await supabase.from('thumbnail_variants').delete().eq('id', variantId);
          if (error) throw error;
          await reloadProjects();
          render();
        } catch (err) {
          console.error('Delete variant error:', err);
          toast('Error al eliminar: ' + err.message, 'error');
        }
      });
    });

    container.querySelectorAll('.thumb-preview-trigger').forEach(img => {
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        const lb = document.getElementById('thumb-lightbox');
        const lbImg = document.getElementById('thumb-lightbox-img');
        if (!lb || !lbImg) return;
        lbImg.src = img.dataset.preview;
        lb.classList.add('active');
      });
    });

    container.querySelectorAll('.btn-download').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const src = btn.dataset.src;
        const name = btn.dataset.name;
        try {
          const resp = await fetch(src);
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch {
          const a = document.createElement('a');
          a.href = src;
          a.download = name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      });
    });

    // ── GENERATE MASTER BATCH ──
    document.getElementById('btn-generate-master')?.addEventListener('click', async () => {
      const project = getProject();
      const selectedAngles = project?.logic_dna?.selected_angles || [];
      const activeIndices = batchAngleSelection ?? selectedAngles.map((_, i) => i);
      const anglesToGenerate = selectedAngles.filter((_, i) => activeIndices.includes(i));
      if (!project || anglesToGenerate.length === 0 || !selectedStyleId || selectedFormats.length === 0) return;

      const style = STYLES.find(s => s.id === selectedStyleId);
      const formats = selectedFormats.map(fid => FORMATS.find(f => f.id === fid)).filter(Boolean);
      const matchedFaceAtGen = faceList.find(f => f.id === autoMatchedFaceId);
      const useFace = faceEnabled !== null ? faceEnabled : !!matchedFaceAtGen;
      const expressionId = selectedExpressionId || autoMatchedFaceId || document.getElementById('select-expression-step3')?.value;
      const selectedFace = faceList.find(f => f.id === expressionId);
      const customText = document.getElementById('custom-overlay-text')?.value || project.title;

      isGenerating = true;
      render();

      showLoader(container, {
        title: 'Sintetizando Miniaturas',
        subtitle: `Generando ${anglesToGenerate.length} variante${anglesToGenerate.length !== 1 ? 's' : ''} — DNA Chain completo activo`,
        detail: `ÁNGULO 1 / ${anglesToGenerate.length} — INICIANDO`,
      });

      try {
        for (let i = 0; i < anglesToGenerate.length; i++) {
          const angle = anglesToGenerate[i];
          const angleLetter = ['A', 'B', 'C', 'D', 'E'][activeIndices[i]] || (activeIndices[i] + 1);
          updateLoader({
            title: `Sintetizando Ángulo ${angleLetter}`,
            subtitle: `"${angle.name}" — aplicando Visual Twist único + ADN de Marca`,
            detail: `VARIANTE ${i + 1} DE ${anglesToGenerate.length} — IMAGE GENERATION`,
          });
          const imagePrompt = buildMasterPrompt({ project, angle, style, formats, selectedFace, useFace, brandKit });
          await generateAndSaveVariant({ project, angle, style, formats, imagePrompt, overlayText: customText.toUpperCase(), faceImageUrl: useFace ? (selectedFace?.image_url || null) : null });
        }
        hideLoader();
        toast(`✅ Batch completado — ${anglesToGenerate.length} miniatura${anglesToGenerate.length !== 1 ? 's' : ''} generada${anglesToGenerate.length !== 1 ? 's' : ''}`, 'success', 4000);
      } catch (err) {
        hideLoader();
        console.error('Batch generate error:', err);
        toast('Error al generar batch: ' + err.message, 'error');
      } finally {
        isGenerating = false;
        await reloadProjects();
        render();
      }
    });

    // ── EXPAND variants ──
    container.querySelectorAll('.btn-expand-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (expandingVariantId) return;

        const variantId = btn.dataset.variantId;
        const countSelect = document.getElementById(`expand-count-${variantId}`);
        const count = Math.min(parseInt(countSelect?.value || '1'), 5);
        const project = getProject();
        if (!project) return;

        const allVariants = project.thumbnail_variants || [];
        const baseVariant = allVariants.find(v => v.id === variantId);
        if (!baseVariant) return;

        expandingVariantId = variantId;
        render();

        showLoader(container, {
          title: 'Generando Variaciones',
          subtitle: `Creando ${count} interpretación${count !== 1 ? 'es' : ''} alternativa${count !== 1 ? 's' : ''} del mismo ángulo psicológico`,
          detail: `VARIACIÓN 1 DE ${count} — IMAGE GENERATION`,
        });

        try {
          const basePrompt = baseVariant.ai_metadata?.prompt || project.title;
          for (let i = 0; i < count; i++) {
            updateLoader({ detail: `VARIACIÓN ${i + 1} DE ${count} — IMAGE GENERATION` });
            const variationPrompt = `${basePrompt}\n\nVariation ${i + 1} of ${count}: create a distinctly different interpretation keeping the same psychological angle, branding ADN, and video context. Change composition or color treatment while keeping the face (if present) and core message.`;

            const isRealAngleId = baseVariant.angle_id && !String(baseVariant.angle_id).startsWith('ai-');
            const { data: inserted, error: insertErr } = await supabase
              .from('thumbnail_variants')
              .insert({
                project_id: project.id,
                angle_id: isRealAngleId ? baseVariant.angle_id : null,
                overlay_text: baseVariant.overlay_text,
                style_preset: baseVariant.style_preset,
                impact_score: Math.floor(Math.random() * 20) + 80,
                ai_metadata: {
                  prompt: variationPrompt.slice(0, 300),
                  angle_name: baseVariant.ai_metadata?.angle_name || '',
                  format: baseVariant.ai_metadata?.format || '',
                  style: baseVariant.style_preset,
                  generating: true,
                  parent_id: variantId,
                  face_image_url: baseVariant.ai_metadata?.face_image_url || null,
                }
              })
              .select()
              .single();
            if (insertErr) throw insertErr;

            try {
              const variationFaceUrl = baseVariant.ai_metadata?.face_image_url || null;
              const dataUrl = await generateImage(variationPrompt, variationFaceUrl);
              const { data: sessionData } = await supabase.auth.getSession();
              const userId = sessionData?.session?.user?.id;
              const blob = await fetch(dataUrl).then(r => r.blob());
              const mimeType = blob.type || 'image/jpeg';
              const ext = mimeType.includes('png') ? 'png' : 'jpg';
              const fileName = `${userId}/thumbnails/${project.id}/${inserted.id}.${ext}`;
              const { error: uploadError } = await supabase.storage.from('thumbnails').upload(fileName, blob, { contentType: mimeType });
              if (uploadError) throw new Error(`Upload falló: ${uploadError.message}`);
              const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(fileName);
              await supabase.from('thumbnail_variants').update({
                image_url: urlData.publicUrl,
                ai_metadata: { ...inserted.ai_metadata, generating: false }
              }).eq('id', inserted.id);
            } catch (imgErr) {
              console.error('Variation image gen failed:', imgErr);
              await supabase.from('thumbnail_variants').update({
                ai_metadata: { ...inserted.ai_metadata, generating: false, error: imgErr.message }
              }).eq('id', inserted.id);
            }
          }
        } catch (err) {
          hideLoader();
          console.error('Expand error:', err);
          toast('Error al generar variaciones: ' + err.message, 'error');
        } finally {
          hideLoader();
          expandingVariantId = null;
          await reloadProjects();
          render();
        }
      });
    });
  }

  // ── Step-content events: re-bound after rerenderStep() ───────────────────

  function bindStepContentEvents_REMOVE() {
    // ── Rename project ──
    container.querySelectorAll('.btn-rename-project').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const projectId = btn.dataset.projectId;
        const currentTitle = btn.dataset.projectTitle;
        const newTitle = await inputDialog('Ingresá el nuevo nombre para este proyecto', {
          title: 'Renombrar Proyecto',
          defaultValue: currentTitle,
          placeholder: 'Nombre del proyecto...',
          confirmLabel: 'Renombrar',
        });
        if (!newTitle || newTitle === currentTitle) return;
        try {
          const { error } = await supabase.from('projects').update({ title: newTitle }).eq('id', projectId);
          if (error) throw error;
          await reloadProjects();
          render();
          toast('Proyecto renombrado', 'success', 2500);
        } catch (err) {
          console.error('Rename project error:', err);
          toast('Error al renombrar: ' + err.message, 'error');
        }
      });
    });

    container.querySelectorAll('.btn-delete-project').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const projectId = btn.dataset.projectId;
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const variantCount = (project.thumbnail_variants || []).length;
        const confirmMsg = `¿Eliminar "${project.title}"?\nSe borrarán ${variantCount} miniatura${variantCount !== 1 ? 's' : ''} y todos los datos del proyecto. Esta acción no se puede deshacer.`;
        const ok = await confirmDialog(confirmMsg, { title: 'Eliminar Proyecto', confirmLabel: 'Eliminar', danger: true });
        if (!ok) return;

        try {
          // Delete variant images from storage
          const variants = project.thumbnail_variants || [];
          for (const v of variants) {
            if (v.image_url) {
              const urlParts = v.image_url.split('/public/thumbnails/');
              if (urlParts.length > 1) {
                await supabase.storage.from('thumbnails').remove([urlParts[1]]).catch(() => {});
              }
            }
          }

          // Delete thumbnail_variants (cascade may handle this, but explicit is safer)
          await supabase.from('thumbnail_variants').delete().eq('project_id', projectId);

          // Delete the project itself
          const { error } = await supabase.from('projects').delete().eq('id', projectId);
          if (error) throw error;

          // Reset selected project if it was the deleted one
          if (selectedProjectId === projectId) {
            selectedProjectId = null;
            workflowStep = 1;
            selectedFormats = [];
            selectedStyleId = null;
            batchAngleSelection = null;
          }

          await reloadProjects();
          if (!selectedProjectId && projects.length > 0) {
            selectedProjectId = projects[0].id;
          }
          render();
          toast('Proyecto eliminado', 'success', 2500);
        } catch (err) {
          console.error('Delete project error:', err);
          toast('Error al eliminar el proyecto: ' + err.message, 'error');
        }
      });
    });


    bindStepContentEvents();

    container.querySelectorAll('.step-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const n = parseInt(btn.dataset.step);
        if (!btn.disabled) { workflowStep = n; render(); }
      });
    });

    document.getElementById('btn-prev-step')?.addEventListener('click', () => {
      if (workflowStep > 1) { workflowStep--; render(); }
    });
    document.getElementById('btn-next-step')?.addEventListener('click', () => {
      if (workflowStep < 3) { workflowStep++; render(); }
    });
  }

  // ── Step-content events (re-bound after rerenderStep) ────────────────────

  function bindStepContentEvents_REMOVE2() {
    // ── Project list toggle button ──
    document.getElementById('btn-toggle-project-list')?.addEventListener('click', () => {
      const panel = document.getElementById('project-list-panel');
      if (!panel) return;
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });

    // ── Project row selection (Step 1) — no auto-advance ──
    container.querySelectorAll('.project-row').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.btn-rename-project') || e.target.closest('.btn-delete-project')) return;
        if (selectedProjectId !== el.dataset.projectId) {
          selectedProjectId = el.dataset.projectId;
          selectedFormats = [];
          selectedStyleId = null;
          batchAngleSelection = null;
        }
        // Close dropdown, update selected display — no step advance
        const panel = document.getElementById('project-list-panel');
        if (panel) panel.style.display = 'none';
        // Update next button state
        const nextBtn = document.getElementById('btn-next-step');
        if (nextBtn) nextBtn.disabled = false;
        rerenderStep();
      });
    });

    // ── Format card selection (no full re-render) ──
    container.querySelectorAll('.format-card').forEach(card => {
      card.addEventListener('click', () => {
        const fid = card.dataset.formatId;
        if (selectedFormats.includes(fid)) {
          selectedFormats = selectedFormats.filter(x => x !== fid);
        } else {
          selectedFormats.push(fid);
        }
        rerenderStep();
        // Update next button state
        const nextBtn = document.getElementById('btn-next-step');
        if (nextBtn) nextBtn.disabled = selectedFormats.length === 0;
      });
    });

    // ── Style card selection (no full re-render) ──
    container.querySelectorAll('.style-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedStyleId = selectedStyleId === card.dataset.styleId ? null : card.dataset.styleId;
        rerenderStep();
        // Update generate button state
        const project = getProject();
        const selectedAngles = project?.logic_dna?.selected_angles || [];
        const genBtn = document.getElementById('btn-generate-master');
        if (genBtn) genBtn.disabled = !selectedStyleId || selectedAngles.length === 0;
      });
    });


    container.querySelectorAll('.btn-delete-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const variantId = btn.dataset.variantId;
        const project = getProject();
        if (!project) return;
        const variant = (project.thumbnail_variants || []).find(v => v.id === variantId);
        try {
          if (variant?.image_url) {
            const urlParts = variant.image_url.split('/public/thumbnails/');
            if (urlParts.length > 1) {
              await supabase.storage.from('thumbnails').remove([urlParts[1]]).catch(() => { });
            }
          }
          const { error } = await supabase.from('thumbnail_variants').delete().eq('id', variantId);
          if (error) throw error;
          await reloadProjects();
          render();
        } catch (err) {
          console.error('Delete variant error:', err);
          toast('Error al eliminar: ' + err.message, 'error');
        }
      });
    });

    container.querySelectorAll('.thumb-preview-trigger').forEach(img => {
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        const lb = document.getElementById('thumb-lightbox');
        const lbImg = document.getElementById('thumb-lightbox-img');
        if (!lb || !lbImg) return;
        lbImg.src = img.dataset.preview;
        lb.classList.add('active');
      });
    });

    container.querySelectorAll('.btn-suggestion-text').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById('custom-overlay-text');
        if (input) input.value = btn.dataset.text.toUpperCase();
        container.querySelectorAll('.btn-suggestion-text').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    container.querySelectorAll('.btn-download').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const src = btn.dataset.src;
        const name = btn.dataset.name;
        try {
          const resp = await fetch(src);
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch {
          const a = document.createElement('a');
          a.href = src;
          a.download = name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      });
    });


    // Face toggle — re-render so the visual (slider position, colors) updates correctly
    container.querySelector('#check-use-face')?.addEventListener('change', (e) => {
      faceEnabled = e.target.checked;
      render();
    });

    // Face select — persist selection across renders
    container.querySelector('#select-expression-step3')?.addEventListener('change', (e) => {
      selectedExpressionId = e.target.value;
    });


    // ── GENERATE MASTER BATCH ──
    document.getElementById('btn-generate-master')?.addEventListener('click', async () => {
      const project = getProject();
      const selectedAngles = project?.logic_dna?.selected_angles || [];
      const activeIndices = batchAngleSelection ?? selectedAngles.map((_, i) => i);
      const anglesToGenerate = selectedAngles.filter((_, i) => activeIndices.includes(i));
      if (!project || anglesToGenerate.length === 0 || !selectedStyleId || selectedFormats.length === 0) return;

      const style = STYLES.find(s => s.id === selectedStyleId);
      const formats = selectedFormats.map(fid => FORMATS.find(f => f.id === fid)).filter(Boolean);
      const matchedFaceAtGen = faceList.find(f => f.id === autoMatchedFaceId);
      const useFace = faceEnabled !== null ? faceEnabled : !!matchedFaceAtGen;
      const expressionId = selectedExpressionId || autoMatchedFaceId || document.getElementById('select-expression-step3')?.value;
      const selectedFace = faceList.find(f => f.id === expressionId);
      const customText = document.getElementById('custom-overlay-text')?.value || project.title;

      isGenerating = true;
      render();

      showLoader(container, {
        title: 'Sintetizando Miniaturas',
        subtitle: `Generando ${anglesToGenerate.length} variante${anglesToGenerate.length !== 1 ? 's' : ''} — DNA Chain completo activo`,
        detail: `ÁNGULO 1 / ${anglesToGenerate.length} — INICIANDO`,
      });

      try {
        for (let i = 0; i < anglesToGenerate.length; i++) {
          const angle = anglesToGenerate[i];
          const angleLetter = ['A', 'B', 'C', 'D', 'E'][activeIndices[i]] || (activeIndices[i] + 1);
          updateLoader({
            title: `Sintetizando Ángulo ${angleLetter}`,
            subtitle: `"${angle.name}" — aplicando Visual Twist único + ADN de Marca`,
            detail: `VARIANTE ${i + 1} DE ${anglesToGenerate.length} — IMAGE GENERATION`,
          });
          const imagePrompt = buildMasterPrompt({ project, angle, style, formats, selectedFace, useFace, brandKit });
          await generateAndSaveVariant({ project, angle, style, formats, imagePrompt, overlayText: customText.toUpperCase(), faceImageUrl: useFace ? (selectedFace?.image_url || null) : null });
        }
        hideLoader();
        toast(`✅ Batch completado — ${anglesToGenerate.length} miniatura${anglesToGenerate.length !== 1 ? 's' : ''} generada${anglesToGenerate.length !== 1 ? 's' : ''}`, 'success', 4000);
      } catch (err) {
        hideLoader();
        console.error('Batch generate error:', err);
        toast('Error al generar batch: ' + err.message, 'error');
      } finally {
        isGenerating = false;
        await reloadProjects();
        render();
      }
    });

    // ── EXPAND variants ──
    container.querySelectorAll('.btn-expand-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (expandingVariantId) return;

        const variantId = btn.dataset.variantId;
        const countSelect = document.getElementById(`expand-count-${variantId}`);
        const count = Math.min(parseInt(countSelect?.value || '1'), 5);
        const project = getProject();
        if (!project) return;

        const allVariants = project.thumbnail_variants || [];
        const baseVariant = allVariants.find(v => v.id === variantId);
        if (!baseVariant) return;

        expandingVariantId = variantId;
        render();

        showLoader(container, {
          title: 'Generando Variaciones',
          subtitle: `Creando ${count} interpretación${count !== 1 ? 'es' : ''} alternativa${count !== 1 ? 's' : ''} del mismo ángulo psicológico`,
          detail: `VARIACIÓN 1 DE ${count} — IMAGE GENERATION`,
        });

        try {
          const basePrompt = baseVariant.ai_metadata?.prompt || project.title;
          for (let i = 0; i < count; i++) {
            updateLoader({
              detail: `VARIACIÓN ${i + 1} DE ${count} — IMAGE GENERATION`,
            });
            const variationPrompt = `${basePrompt}\n\nVariation ${i + 1} of ${count}: create a distinctly different interpretation keeping the same psychological angle, branding ADN, and video context. Change composition or color treatment while keeping the face (if present) and core message.`;

            const isRealAngleId = baseVariant.angle_id && !String(baseVariant.angle_id).startsWith('ai-');
            const { data: inserted, error: insertErr } = await supabase
              .from('thumbnail_variants')
              .insert({
                project_id: project.id,
                angle_id: isRealAngleId ? baseVariant.angle_id : null,
                overlay_text: baseVariant.overlay_text,
                style_preset: baseVariant.style_preset,
                impact_score: Math.floor(Math.random() * 20) + 80,
                ai_metadata: {
                  prompt: variationPrompt.slice(0, 300),
                  angle_name: baseVariant.ai_metadata?.angle_name || '',
                  format: baseVariant.ai_metadata?.format || '',
                  style: baseVariant.style_preset,
                  generating: true,
                  parent_id: variantId,
                  face_image_url: baseVariant.ai_metadata?.face_image_url || null,
                }
              })
              .select()
              .single();
            if (insertErr) throw insertErr;

            try {
              const variationFaceUrl = baseVariant.ai_metadata?.face_image_url || null;
              const dataUrl = await generateImage(variationPrompt, variationFaceUrl);
              const { data: sessionData } = await supabase.auth.getSession();
              const userId = sessionData?.session?.user?.id;
              const blob = await fetch(dataUrl).then(r => r.blob());
              const mimeType = blob.type || 'image/jpeg';
              const ext = mimeType.includes('png') ? 'png' : 'jpg';
              const fileName = `${userId}/thumbnails/${project.id}/${inserted.id}.${ext}`;
              const { error: uploadError } = await supabase.storage.from('thumbnails').upload(fileName, blob, { contentType: mimeType });
              if (uploadError) throw new Error(`Upload falló: ${uploadError.message}`);
              const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(fileName);

              await supabase.from('thumbnail_variants').update({
                image_url: urlData.publicUrl,
                ai_metadata: { ...inserted.ai_metadata, generating: false }
              }).eq('id', inserted.id);
            } catch (imgErr) {
              console.error('Variation image gen failed:', imgErr);
              await supabase.from('thumbnail_variants').update({
                ai_metadata: { ...inserted.ai_metadata, generating: false, error: imgErr.message }
              }).eq('id', inserted.id);
            }
          }
        } catch (err) {
          hideLoader();
          console.error('Expand error:', err);
          toast('Error al generar variaciones: ' + err.message, 'error');
        } finally {
          hideLoader();
          expandingVariantId = null;
          await reloadProjects();
          render();
        }
      });
    });
  }

  // ── Step-content events: re-bound after rerenderStep() ──────────────────

  function bindStepContentEvents() {
    // ── Project modal button ──
    document.getElementById('btn-open-project-modal')?.addEventListener('click', openProjectModal);

    // ── Format card selection ──
    container.querySelectorAll('.format-card').forEach(card => {
      card.addEventListener('click', () => {
        const fid = card.dataset.formatId;
        if (selectedFormats.includes(fid)) {
          selectedFormats = selectedFormats.filter(x => x !== fid);
        } else {
          selectedFormats.push(fid);
        }
        rerenderStep();
        const nextBtn = document.getElementById('btn-next-step');
        if (nextBtn) nextBtn.disabled = selectedFormats.length === 0;
      });
    });

    // ── Style card selection ──
    container.querySelectorAll('.style-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedStyleId = selectedStyleId === card.dataset.styleId ? null : card.dataset.styleId;
        rerenderStep();
        const project = getProject();
        const selectedAngles = project?.logic_dna?.selected_angles || [];
        const genBtn = document.getElementById('btn-generate-master');
        if (genBtn) genBtn.disabled = !selectedStyleId || selectedAngles.length === 0;
      });
    });

    // ── Face toggle ──
    container.querySelector('#check-use-face')?.addEventListener('change', (e) => {
      faceEnabled = e.target.checked;
      rerenderStep();
    });

    // ── Face select ──
    container.querySelector('#select-expression-step3')?.addEventListener('change', (e) => {
      selectedExpressionId = e.target.value;
    });
  }

  // ── Helper: build master prompt (DNA Chain — Fusión de Capas) ──────────────
  // Slot order: [ESTILO_VISUAL] + [FORMATO_CREATIVO] + [OBJETO_HEROE] + [VISUAL_TWIST] + [ADN_MARCA]
  function buildMasterPrompt({ project, angle, style, formats, selectedFace, useFace, brandKit }) {
    // === LAYER 1: VISUAL STYLE (lighting, textures, rendering quality) ===
    const styleLayer = [
      style.lighting,
      `Additional style keywords: ${style.keywords}`,
    ].filter(Boolean).join('\n');

    // === LAYER 2: CREATIVE FORMAT (physical composition layout) ===
    const formatLayer = formats.map(f => f.composition).join('\nCOMBINED WITH:\n');

    // === LAYER 3: HERO OBJECT (from Cerebro visual_briefing + script DNA) ===
    const vb = project?.logic_dna?.visual_briefing || {};
    const heroObject = vb.hero_object || project.logic_dna?.hook || '';
    const centralConflict = vb.central_conflict || project.logic_dna?.tension || '';
    const requiredEmotion = vb.required_emotion || '';
    const heroLayer = [
      heroObject ? `HERO ELEMENT (mandatory, must dominate the visual): ${heroObject}` : '',
      centralConflict ? `Visual drama to portray: ${centralConflict}` : '',
      project.logic_dna?.hook ? `Hook: ${project.logic_dna.hook}` : '',
      project.logic_dna?.tension ? `Tension: ${project.logic_dna.tension}` : '',
      project.logic_dna?.promise ? `Promise: ${project.logic_dna.promise}` : '',
    ].filter(Boolean).join('\n');

    // === LAYER 4: VISUAL TWIST (unique per angle — the A/B/C differentiator) ===
    const twistLayer = angle.visual_twist
      ? `VISUAL TWIST — THIS IS THE CORE DIFFERENTIATOR FOR THIS VARIANT:\n${angle.visual_twist}\nThis twist must be unmistakably visible in the final image. Make it the defining creative decision.`
      : `Psychological angle: "${angle.name}"${angle.psychology_text ? ` — ${angle.psychology_text}` : ''}`;

    // === LAYER 5: BRAND ADN (tone, identity, gallery style, market contrast) ===
    const adn = brandKit?.detailed_adn?.synthesis || brandKit?.detailed_adn || {};
    const brandTone = adn.tone || 'Professional and impactful';
    const brandBranding = adn.branding || 'Modern visual identity';
    const styleSummary = brandKit?.style_summary || {};
    const winningStyle = styleSummary.visual_style || styleSummary.winning_pattern || '';
    const palette = styleSummary.palette?.join(', ') || '';
    const composition = styleSummary.composition || '';
    const mc = project?.logic_dna?.market_contrast || {};
    const avoidColors = mc.avoid_colors?.join(', ') || '';
    const crowdPattern = mc.crowd_pattern || '';
    const adnLayer = [
      `Brand tone: ${brandTone}. Identity: ${brandBranding}.`,
      winningStyle ? `Creator's proven visual style: ${winningStyle}` : '',
      composition ? `Composition signature: ${composition}` : '',
      palette ? `Brand palette: ${palette}` : '',
      avoidColors ? `Market contrast — AVOID these competitor colors as dominant: ${avoidColors}` : '',
      crowdPattern ? `Do NOT replicate this crowd pattern: "${crowdPattern}"` : '',
    ].filter(Boolean).join('\n');

    // === SLOT 6: FACE INTEGRATION ===
    // When a face image is attached to the request, instruct the model to USE that real person.
    // Never describe facial traits as text — the model must anchor to the actual photo.
    const faceLayer = useFace && selectedFace
      ? `CREATOR FACE (mandatory): The reference photo of the real creator is attached to this request as an image. You MUST use that exact real person's face — do NOT generate a fictional or AI-invented face. Preserve 100% of their real identity: bone structure, eyes, nose, mouth, hair, skin tone, piercing or any distinctive features. Required expression: ${requiredEmotion || selectedFace.expression_type} — make it hyper-expressive and over-the-top cinematic, but the face must unmistakably be the same real person from the reference photo.`
      : 'NO people or faces. Focus entirely on objects, environments, and graphic elements.';

    return `High-impact YouTube thumbnail — 16:9 aspect ratio — maximum CTR optimized.

━━━ LAYER 1: VISUAL STYLE & RENDERING ━━━
${styleLayer}

━━━ LAYER 2: COMPOSITION FORMAT (physical layout) ━━━
${formatLayer}

━━━ LAYER 3: HERO OBJECT & SCRIPT DNA ━━━
${heroLayer}

━━━ LAYER 4: VISUAL TWIST — ANGLE "${angle.name.toUpperCase()}" ━━━
${twistLayer}

━━━ LAYER 5: BRAND ADN & MARKET CONTRAST ━━━
${adnLayer}

━━━ LAYER 6: CREATOR FACE ━━━
${faceLayer}

FINAL REQUIREMENTS: Ultra-sharp. Maximum visual punch. Vibrant. High contrast against competition.

━━━ REGLA ABSOLUTA — CERO TEXTO EN LA IMAGEN ━━━
PROHIBIDO renderizar texto, palabras, letras, números o tipografía en cualquier parte de la imagen — ni en pantallas, señales, banners, barras, badges, carteles, ni en ningún otro lugar. Cualquier elemento de diseño que normalmente contendría texto (barras de chyron, tarjetas de título, etiquetas, marcas de agua, pantallas con código o mensajes) debe mostrar ÚNICAMENTE color sólido, formas geométricas, patrones visuales abstractos o íconos gráficos — NUNCA caracteres legibles. El texto se aplica exclusivamente en post-producción como overlay. VIOLAR ESTA REGLA ES EL ERROR #1 — EVITAR A TODA COSTA.

━━━ UNIVERSO VISUAL CERRADO — ANTI-ALUCINACIÓN ━━━
Renderizá ÚNICAMENTE los elementos visuales explícitamente descritos en las capas anteriores. PROHIBIDO agregar elementos por asociación cultural o de género: no inventar logotipos, marcas, insignias, íconos no especificados, efectos de franquicia, pantallas con contenido, fondos de escenografía no mencionados, ni ningún elemento decorativo que no esté descripto literalmente arriba. Si el estilo evoca un género (noticiero, cine de acción, documental), renderizá SOLO la estética visual del género (iluminación, color, composición) — NO sus elementos de UI, marcos de programa, gráficos de producción ni branding inventado. Cada píxel debe justificarse en alguna de las 6 capas anteriores.`;
  }

  // ── Helper: generate one image and save to DB ─────────────────────────────
  // Inserts placeholder, immediately updates UI, then generates image in background
  async function generateAndSaveVariant({ project, angle, style, formats, imagePrompt, overlayText, faceImageUrl = null, parentId = null }) {
    const isRealAngleId = angle.id && !String(angle.id).startsWith('ai-');
    const { data: inserted, error: insertErr } = await supabase
      .from('thumbnail_variants')
      .insert({
        project_id: project.id,
        angle_id: isRealAngleId ? angle.id : null,
        overlay_text: overlayText,
        style_preset: style.label,
        impact_score: Math.floor(Math.random() * 20) + 80,
        ai_metadata: {
          prompt: imagePrompt.slice(0, 300),
          angle_name: angle.name,
          format: formats.map(f => f.label).join(' + '),
          style: style.label,
          generating: true,
          parent_id: parentId,
          face_image_url: faceImageUrl || null,
        }
      })
      .select()
      .single();
    if (insertErr) throw insertErr;

    // ── Immediately show placeholder in UI ──
    if (!project.thumbnail_variants) project.thumbnail_variants = [];
    project.thumbnail_variants.push(inserted);
    render();

    try {
      const dataUrl = await generateImage(imagePrompt, faceImageUrl);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      const blob = await fetch(dataUrl).then(r => r.blob());
      const mimeType = blob.type || 'image/jpeg';
      const ext = mimeType.includes('png') ? 'png' : 'jpg';
      const fileName = `${userId}/thumbnails/${project.id}/${inserted.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('thumbnails').upload(fileName, blob, { contentType: mimeType });
      if (uploadError) throw new Error(`Upload falló: ${uploadError.message}`);
      const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(fileName);

      await supabase.from('thumbnail_variants').update({
        image_url: urlData.publicUrl,
        ai_metadata: { ...inserted.ai_metadata, generating: false }
      }).eq('id', inserted.id);

      // ── Update local variant so UI reflects completed image ──
      const localVariant = project.thumbnail_variants.find(v => v.id === inserted.id);
      if (localVariant) {
        localVariant.image_url = urlData.publicUrl;
        localVariant.ai_metadata = { ...inserted.ai_metadata, generating: false };
      }
      render();

    } catch (imgErr) {
      console.error('Image gen failed:', imgErr);
      await supabase.from('thumbnail_variants').update({
        ai_metadata: { ...inserted.ai_metadata, generating: false, error: imgErr.message }
      }).eq('id', inserted.id);

      // ── Update local variant to show error state ──
      const localVariant = project.thumbnail_variants.find(v => v.id === inserted.id);
      if (localVariant) {
        localVariant.ai_metadata = { ...inserted.ai_metadata, generating: false, error: imgErr.message };
      }
      render();
    }
  }

  async function reloadProjects() {
    const { data: updated } = await supabase
      .from('projects').select('*, thumbnail_variants(*)')
      .eq('channel_id', activeChannelId).order('created_at', { ascending: false });
    projects.length = 0;
    (updated || []).forEach(p => projects.push(p));
  }

  render();
}
