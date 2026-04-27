import { supabase } from '../lib/supabase.js';
import { getState, subscribe } from '../lib/state.js';
import { setActiveProject } from '../lib/projects.js';
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

  // UI State — prefer the globally active project if it exists in our loaded list
  const globalActiveId = getState().activeProjectId;
  let selectedProjectId = (globalActiveId && projects.find(p => p.id === globalActiveId))
    ? globalActiveId
    : (projects[0]?.id || null);
  let workflowStep = selectedProjectId ? 2 : 1;
  let selectedFormats = [];
  let selectedStyleId = null;
  let isGenerating = false;
  let expandingVariantId = null;
  let batchAngleSelection = null; // null = all selected; array of indices = specific selection
  let faceEnabled = null;         // null = follow DNA match default; true/false = explicit user choice
  let selectedExpressionId = null; // persists face select across renders
  let overlayText = '';            // persists overlay text across renders
  let anglesPage = 0;              // pagination for step 5 angle cards
  let variantsPage = 0;            // pagination for history section
  let generatingAngleIndex = null; // which angle card is currently generating

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
    const canGoStep4 = canGoStep3 && !!selectedStyleId;
    const canGoStep5 = canGoStep4;
    const activeAngleIndices = batchAngleSelection ?? selectedAngles.map((_, i) => i);
    const canGenerate = canGoStep5 && activeAngleIndices.length > 0 && !isGenerating;
    const stepDone = [canGoStep2, canGoStep3, canGoStep4, canGoStep5, false];
    const canAccess = [true, canGoStep2, canGoStep3, canGoStep4, canGoStep5];
    const stepDefs = [
      { label: 'Proyecto', desc: 'Guión analizado' },
      { label: 'Formato', desc: 'Composición visual' },
      { label: 'Estilo', desc: 'Look visual' },
      { label: 'Rostro', desc: 'Face Vault' },
      { label: 'Ángulos', desc: 'Generar' },
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
            <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;transition:all 0.2s;
              ${isDone
                ? 'background:var(--success);color:white;'
                : isActive
                  ? 'background:var(--accent);color:white;box-shadow:0 0 14px rgba(220,38,38,0.45);'
                  : 'background:var(--bg-elevated);color:var(--text-tertiary);border:1px solid var(--border);'}">
              ${isDone ? icon('check', 10) : n}
            </div>
            <div style="margin-top:5px;text-align:center;">
              <div style="font-size:10px;font-weight:${isActive ? '800' : '600'};white-space:nowrap;
                color:${isActive ? 'var(--text-primary)' : isDone ? 'var(--text-secondary)' : 'var(--text-tertiary)'};">${s.label}</div>
              <div style="font-size:8px;color:var(--text-tertiary);white-space:nowrap;margin-top:1px;">${s.desc}</div>
            </div>
          </div>
          ${i < stepDefs.length - 1 ? `<div style="flex:1;height:1px;margin:0 8px;margin-bottom:20px;
            background:${isDone ? 'var(--success)' : 'var(--border)'};opacity:${isDone ? '0.5' : '0.2'};"></div>` : ''}`;
        }).join('')}
      </div>

      <!-- Project title pill -->
      ${project ? `
      <div style="text-align:center;margin-bottom:var(--space-lg);">
        <div style="display:inline-flex;align-items:center;gap:8px;padding:5px 16px 5px 10px;background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.22);border-radius:20px;max-width:90%;">
          <span style="display:flex;align-items:center;opacity:0.7;">${icon('folder', 12)}</span>
          <span style="font-size:12px;font-weight:700;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${project.title}</span>
        </div>
      </div>` : ''}

      <!-- Step content -->
      <div id="step-content" style="min-height:300px;">
        ${workflowStep === 1 ? renderProjectStep()
          : workflowStep === 2 ? renderFormatStep()
          : workflowStep === 3 ? renderStyleStep()
          : workflowStep === 4 ? renderFaceStep()
          : renderAnglesStep(project, selectedAngles)}
      </div>

      <!-- Bottom nav -->
      <div class="flex justify-between items-center" style="margin-top:var(--space-lg);padding-top:var(--space-md);border-top:1px solid var(--border);">
        <button class="btn btn-secondary btn-sm" id="btn-prev-step" ${workflowStep === 1 ? 'disabled' : ''}>
          ${icon('arrowLeft', 14)} Anterior
        </button>
        ${workflowStep < 5 ? `
          <div style="display:flex;align-items:center;gap:10px;">
            ${workflowStep === 1 && !canGoStep2 ? `<span class="text-xs text-muted">Seleccioná un proyecto</span>` : ''}
            ${workflowStep === 2 && !canGoStep3 ? `<span class="text-xs text-muted">Elegí al menos un formato</span>` : ''}
            ${workflowStep === 3 && !canGoStep4 ? `<span class="text-xs text-muted">Elegí un estilo visual</span>` : ''}
            <button class="btn btn-primary" id="btn-next-step" style="padding:8px 20px;"
              ${(workflowStep === 1 && !canGoStep2) || (workflowStep === 2 && !canGoStep3) || (workflowStep === 3 && !canGoStep4) ? 'disabled' : ''}>
              Siguiente ${icon('arrowRight', 14)}
            </button>
          </div>
        ` : `
          <button class="btn btn-primary" id="btn-generate-master" ${!canGenerate ? 'disabled' : ''}
            style="background:linear-gradient(135deg,var(--accent),#9333ea);font-size:14px;padding:12px 28px;font-weight:800;letter-spacing:0.5px;border-radius:var(--radius-md);">
            ${isGenerating
              ? `<span class="animate-pulse">${icon('clock', 16)}</span> Generando...`
              : `${icon('rocket', 16)} GENERAR ${activeAngleIndices.length} MINIATURA${activeAngleIndices.length !== 1 ? 'S' : ''}`}
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
      : workflowStep === 3 ? renderStyleStep()
      : workflowStep === 4 ? renderFaceStep()
      : renderAnglesStep(project, selectedAngles);
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
      const projectChanged = selectedProjectId !== modalSelectedId;
      if (projectChanged) {
        selectedProjectId = modalSelectedId;
        // Sync with global state so workflow bar and other panels stay in sync
        setActiveProject(modalSelectedId);
        selectedFormats = [];
        selectedStyleId = null;
        batchAngleSelection = null;
        faceEnabled = null;
        selectedExpressionId = null;
        overlayText = '';
        anglesPage = 0;
        variantsPage = 0;
        workflowStep = 2;
      }
      overlay.remove();
      if (projectChanged) {
        render();
      } else {
        rerenderStep();
      }
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

  // ─── STEP 3: Estilo visual ────────────────────────────────────────────────

  function renderStyleStep() {
    return `
    <div>
      <div style="font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:var(--space-md);">
        Elegí el estilo visual de tu miniatura
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
        ${STYLES.map(s => {
          const isSelected = selectedStyleId === s.id;
          return `
          <div class="card style-card" data-style-id="${s.id}" style="cursor:pointer;padding:14px;transition:all 0.15s;position:relative;
            ${isSelected ? 'border-color:var(--accent);background:rgba(220,38,38,0.07);box-shadow:0 0 0 1px var(--accent);' : ''}">
            <div style="position:absolute;top:10px;right:10px;width:18px;height:18px;border-radius:50%;
              border:2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'};
              background:${isSelected ? 'var(--accent)' : 'transparent'};
              display:flex;align-items:center;justify-content:center;color:white;">
              ${isSelected ? icon('check', 9) : ''}
            </div>
            <div style="font-size:28px;margin-bottom:8px;">${s.emoji}</div>
            <div class="font-bold" style="font-size:12px;">${s.label}</div>
            <div class="text-xs" style="color:var(--accent);margin-top:2px;">${s.subtitle}</div>
            <div class="text-xs text-muted" style="margin-top:6px;font-size:10px;line-height:1.4;">${s.desc}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  // ─── STEP 4: Rostro del creador ───────────────────────────────────────────

  function renderFaceStep() {
    const matchedFace = faceList.find(f => f.id === autoMatchedFaceId);
    const effectiveUseFace = faceEnabled !== null ? faceEnabled : !!matchedFace;
    const effectiveExpressionId = selectedExpressionId || autoMatchedFaceId;
    const hasFaces = faceList.length > 0;

    return `
    <div>
      <div style="font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:var(--space-md);">
        ¿Incluir el rostro del creador?
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:var(--space-lg);">

        <!-- CON ROSTRO -->
        <div id="face-opt-yes" style="cursor:pointer;padding:24px 20px;border-radius:var(--radius-lg);border:2px solid ${effectiveUseFace ? 'var(--accent)' : 'var(--border)'};
          background:${effectiveUseFace ? 'rgba(220,38,38,0.07)' : 'var(--bg-tertiary)'};transition:all 0.15s;text-align:center;">
          <div style="font-size:36px;margin-bottom:10px;">🤳</div>
          <div class="font-bold" style="font-size:14px;margin-bottom:4px;">Con rostro</div>
          <div class="text-xs text-muted">Incluye la foto del creador cargada en Face Vault</div>
          ${effectiveUseFace ? `<div style="margin-top:8px;font-size:10px;padding:3px 10px;border-radius:20px;background:var(--accent);color:white;display:inline-block;font-weight:700;">SELECCIONADO</div>` : ''}
        </div>

        <!-- SIN ROSTRO -->
        <div id="face-opt-no" style="cursor:pointer;padding:24px 20px;border-radius:var(--radius-lg);border:2px solid ${!effectiveUseFace ? 'rgba(99,102,241,0.6)' : 'var(--border)'};
          background:${!effectiveUseFace ? 'rgba(99,102,241,0.06)' : 'var(--bg-tertiary)'};transition:all 0.15s;text-align:center;">
          <div style="font-size:36px;margin-bottom:10px;">🎬</div>
          <div class="font-bold" style="font-size:14px;margin-bottom:4px;">Sin rostro</div>
          <div class="text-xs text-muted">Miniatura centrada en el objeto o escena, sin cara</div>
          ${!effectiveUseFace ? `<div style="margin-top:8px;font-size:10px;padding:3px 10px;border-radius:20px;background:rgba(99,102,241,0.7);color:white;display:inline-block;font-weight:700;">SELECCIONADO</div>` : ''}
        </div>
      </div>

      ${effectiveUseFace ? `
      <div style="border-top:1px solid var(--border);padding-top:var(--space-md);">
        ${!hasFaces ? `
        <div style="padding:16px;background:rgba(220,38,38,0.06);border:1px solid rgba(220,38,38,0.2);border-radius:var(--radius-md);display:flex;align-items:center;gap:12px;">
          ${icon('alertTriangle', 18)}
          <div>
            <div class="font-bold text-sm" style="color:var(--accent);">No hay fotos en Face Vault</div>
            <div class="text-xs text-muted">Subí fotos del creador en Brand Kit → Face Vault para usar esta opción.</div>
          </div>
        </div>
        ` : `
        <div style="font-size:10px;font-weight:700;color:var(--text-tertiary);letter-spacing:0.5px;margin-bottom:8px;">Elegí la expresión a usar</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          ${faceList.map(f => {
            const isActive = (f.id === effectiveExpressionId);
            return `
            <div class="face-opt-card" data-face-id="${f.id}" style="cursor:pointer;display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:var(--radius-md);
              border:2px solid ${isActive ? 'var(--accent)' : 'var(--border)'};
              background:${isActive ? 'rgba(220,38,38,0.07)' : 'var(--bg-tertiary)'};transition:all 0.15s;">
              ${f.image_url ? `<img src="${f.image_url}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" />` : `<div style="width:32px;height:32px;border-radius:50%;background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;">${icon('user', 14)}</div>`}
              <div>
                <div class="font-bold" style="font-size:11px;">${f.expression_type || 'Sin etiqueta'}</div>
              </div>
              ${isActive ? `<span style="margin-left:4px;color:var(--accent);">${icon('check', 12)}</span>` : ''}
            </div>`;
          }).join('')}
        </div>
        `}
      </div>` : ''}
    </div>`;
  }

  // ─── Generation helpers ───────────────────────────────────────────────────

  function getGenContext() {
    const project = getProject();
    if (!project) return null;
    const style = STYLES.find(s => s.id === selectedStyleId);
    const formats = selectedFormats.map(fid => FORMATS.find(f => f.id === fid)).filter(Boolean);
    if (!style || formats.length === 0) return null;
    const matchedFace = faceList.find(f => f.id === autoMatchedFaceId);
    const useFace = faceEnabled !== null ? faceEnabled : !!matchedFace;
    const expressionId = selectedExpressionId || autoMatchedFaceId;
    const selectedFace = faceList.find(f => f.id === expressionId);
    overlayText = document.getElementById('custom-overlay-text')?.value ?? overlayText;
    const customText = overlayText || project.title;
    return { project, style, formats, useFace, selectedFace, customText };
  }

  async function generateSingleAngle(angleIndex) {
    const ctx = getGenContext();
    if (!ctx) return;
    const { project, style, formats, useFace, selectedFace, customText } = ctx;
    const angle = (project.logic_dna?.selected_angles || [])[angleIndex];
    if (!angle) return;
    const imagePrompt = buildMasterPrompt({ project, angle, style, formats, selectedFace, useFace, brandKit });
    await generateAndSaveVariant({ project, angle, style, formats, imagePrompt, overlayText: customText.toUpperCase(), faceImageUrl: useFace ? (selectedFace?.image_url || null) : null });
  }

  // ─── STEP 5: Ángulos + Generar ────────────────────────────────────────────

  function renderAnglesStep(project, selectedAngles) {
    if (!project) return `<div class="card" style="text-align:center;padding:var(--space-2xl);opacity:0.5;">${icon('folder', 40)}<p class="text-sm text-muted mt-md">Seleccioná un proyecto primero</p></div>`;
    if (selectedAngles.length === 0) return `<div class="card" style="text-align:center;padding:var(--space-xl);opacity:0.6;">${icon('crosshair', 32)}<p class="text-sm text-muted mt-sm">Este proyecto no tiene ángulos.<br/>Volvé a El Cerebro y elegí ángulos.</p></div>`;

    const CARDS_PER_PAGE = 4;
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const totalPages = Math.ceil(selectedAngles.length / CARDS_PER_PAGE);
    const safePage = Math.min(anglesPage, Math.max(0, totalPages - 1));
    const pageAngles = selectedAngles.slice(safePage * CARDS_PER_PAGE, (safePage + 1) * CARDS_PER_PAGE);
    const variants = project.thumbnail_variants || [];
    const masters = variants.filter(v => !v.ai_metadata?.parent_id);
    const children = variants.filter(v => !!v.ai_metadata?.parent_id);
    const allGenerated = selectedAngles.every(a => masters.some(v => v.ai_metadata?.angle_name === a.name));

    const renderAngleCard = (angle, globalIdx) => {
      const angleMasters = masters
        .filter(v => v.ai_metadata?.angle_name === angle.name)
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      const latest = angleMasters[0] || null;
      const angleChildren = latest ? children.filter(c => c.ai_metadata?.parent_id === latest.id) : [];
      const isGen = latest?.ai_metadata?.generating || generatingAngleIndex === globalIdx;
      const hasImg = !!latest?.image_url;
      const hasError = !!latest?.ai_metadata?.error;
      const safeTitle = project.title.slice(0, 20).replace(/\s+/g, '-');
      const isExpanding = expandingVariantId === latest?.id;

      return `
      <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:12px;animation:fadeIn 0.3s ease both;">
        <div style="display:flex;min-height:140px;">
          <!-- Left: info + actions -->
          <div style="flex:1;padding:18px 20px;border-right:1px solid var(--border);display:flex;flex-direction:column;gap:8px;min-width:0;">
            <div style="display:flex;align-items:flex-start;gap:10px;">
              <div style="flex-shrink:0;width:30px;height:30px;border-radius:50%;background:var(--accent);color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;">
                ${letters[globalIdx] || globalIdx + 1}
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:14px;font-weight:800;line-height:1.3;">${angle.name}</div>
                ${angle.psychology || angle.psychology_text
                  ? `<div style="font-size:11px;color:var(--text-secondary);line-height:1.5;margin-top:4px;">${(angle.psychology || angle.psychology_text).slice(0, 160)}</div>`
                  : ''}
              </div>
              <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                ${latest?.style_preset ? `<span class="badge badge-accent" style="font-size:9px;">${latest.style_preset}</span>` : ''}
                ${hasImg ? `<span style="font-size:13px;font-weight:800;color:${(latest.impact_score||0)>=90?'var(--success)':'var(--accent)'};">${latest.impact_score||0}</span>` : ''}
              </div>
            </div>
            <!-- Actions -->
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:auto;padding-top:8px;border-top:1px solid rgba(255,255,255,0.05);">
              ${isGen
                ? `<span class="text-xs text-accent animate-pulse">${icon('clock', 12)} Generando...</span>`
                : hasImg
                  ? `<button class="btn btn-secondary btn-xs btn-download" data-src="${latest.image_url}" data-name="miniatura-${safeTitle}-${letters[globalIdx]}.png">${icon('download', 11)} Descargar</button>
                     <button class="btn btn-secondary btn-xs btn-generate-angle" data-angle-index="${globalIdx}" ${isGenerating ? 'disabled' : ''} style="font-size:10px;">${icon('rocket', 10)} Regenerar</button>
                     ${!isExpanding ? `
                     <div style="display:flex;align-items:center;gap:4px;margin-left:auto;">
                       <select class="form-select" id="expand-count-${latest.id}" style="font-size:10px;padding:2px 4px;height:26px;width:60px;">
                         ${[1,2,3,4,5,6,7,8].map(n=>`<option value="${n}"${n===1?' selected':''}>${n}x</option>`).join('')}
                       </select>
                       <button class="btn btn-primary btn-xs btn-expand-variant" data-variant-id="${latest.id}" ${isGenerating||expandingVariantId?'disabled':''} style="white-space:nowrap;">${icon('plus',10)} Variación</button>
                     </div>` : `<span class="text-xs text-accent animate-pulse" style="margin-left:auto;">${icon('clock',10)} Variando...</span>`}`
                  : hasError
                    ? `<span class="text-xs" style="color:var(--danger);">${icon('alertTriangle', 11)} Error</span>
                       <button class="btn btn-primary btn-xs btn-generate-angle" data-angle-index="${globalIdx}" ${isGenerating ? 'disabled' : ''}>Reintentar</button>`
                    : `<button class="btn btn-primary btn-sm btn-generate-angle" data-angle-index="${globalIdx}" ${isGenerating ? 'disabled' : ''} style="font-weight:700;">${icon('rocket', 13)} Generar miniatura</button>`
              }
            </div>
            ${angleChildren.length > 0 ? `<div style="font-size:10px;color:var(--text-tertiary);margin-top:4px;">${icon('image',10)} ${angleChildren.length} variación${angleChildren.length!==1?'es':''}</div>` : ''}
          </div>
          <!-- Right: thumbnail -->
          <div style="width:260px;flex-shrink:0;position:relative;background:var(--bg-tertiary);">
            ${isGen
              ? thumbLoaderHTML()
              : hasImg
                ? `<img src="${latest.image_url}" class="thumb-preview-trigger" data-preview="${latest.image_url}"
                     style="width:100%;height:100%;object-fit:cover;cursor:zoom-in;display:block;" />
                   ${latest.overlay_text ? `<div style="position:absolute;bottom:0;left:0;right:0;padding:6px 8px;background:linear-gradient(transparent,rgba(0,0,0,0.85));">
                     <div style="font-family:var(--font-impact);font-size:13px;color:white;letter-spacing:2px;">${latest.overlay_text}</div>
                   </div>` : ''}`
                : hasError
                  ? `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:6px;padding:16px;text-align:center;">
                       <span style="color:var(--danger);opacity:0.7;">${icon('alertTriangle', 28)}</span>
                       <div style="font-size:10px;color:var(--text-tertiary);line-height:1.4;">${latest.ai_metadata.error.slice(0,80)}</div>
                     </div>`
                  : `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:8px;opacity:0.3;">
                       ${icon('image', 36)}
                       <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;">Sin generar</div>
                     </div>`
            }
          </div>
        </div>
        ${angleChildren.length > 0 ? `
        <div style="border-top:1px solid var(--border);padding:12px 20px;background:rgba(0,0,0,0.15);">
          <div style="font-size:10px;font-weight:700;color:var(--text-tertiary);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Variaciones (${angleChildren.length})</div>
          <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;">
            ${angleChildren.map((c, ci) => `
            <div style="flex-shrink:0;width:140px;border-radius:var(--radius-md);overflow:hidden;position:relative;aspect-ratio:16/9;background:var(--bg-tertiary);">
              ${c.image_url ? `<img src="${c.image_url}" class="thumb-preview-trigger" data-preview="${c.image_url}" style="width:100%;height:100%;object-fit:cover;cursor:zoom-in;" />` : thumbLoaderHTML('', '')}
              <button class="btn-delete-variant" data-variant-id="${c.id}" title="Eliminar" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);border:none;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:white;font-size:10px;">${icon('trash',9)}</button>
              ${c.image_url ? `<button class="btn-download" data-src="${c.image_url}" data-name="var-${letters[globalIdx]}-${ci+1}.png" style="position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,0.6);border:none;border-radius:var(--radius-sm);padding:2px 6px;cursor:pointer;color:white;font-size:9px;display:flex;align-items:center;gap:3px;">${icon('download',9)}</button>` : ''}
            </div>`).join('')}
          </div>
        </div>` : ''}
      </div>`;
    };

    return `
    <div>
      <!-- Header: overlay text + Generar Todas -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:var(--space-lg);padding:14px 16px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius-md);">
        <div style="flex:1;">
          <div style="font-size:10px;font-weight:700;color:var(--text-tertiary);letter-spacing:0.5px;margin-bottom:5px;">Texto de overlay (opcional)</div>
          <input type="text" class="form-input" id="custom-overlay-text" value="${overlayText}" placeholder="1-3 palabras en mayúsculas..." style="font-size:12px;font-weight:800;letter-spacing:1px;" />
        </div>
        <button id="btn-generate-all" class="btn btn-primary" ${isGenerating ? 'disabled' : ''}
          style="background:linear-gradient(135deg,var(--accent),#9333ea);font-weight:800;white-space:nowrap;flex-shrink:0;">
          ${isGenerating
            ? `<span class="animate-pulse">${icon('clock',14)}</span> Generando...`
            : `${icon('rocket',14)} Generar Todas`}
        </button>
      </div>

      <!-- Angle cards (paginated) -->
      <div>
        ${pageAngles.map((a, pi) => renderAngleCard(a, safePage * CARDS_PER_PAGE + pi)).join('')}
      </div>

      ${totalPages > 1 ? `
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:var(--space-md);">
        <button class="btn btn-secondary btn-sm angles-page-btn" data-page="${safePage - 1}" ${safePage === 0 ? 'disabled' : ''}>${icon('arrowLeft',12)}</button>
        ${Array.from({length:totalPages},(_,i)=>`
          <button class="btn btn-sm angles-page-btn ${i===safePage?'btn-primary':'btn-secondary'}" data-page="${i}"
            style="min-width:32px;font-size:12px;">${i+1}</button>`).join('')}
        <button class="btn btn-secondary btn-sm angles-page-btn" data-page="${safePage + 1}" ${safePage >= totalPages-1 ? 'disabled' : ''}>${icon('arrowRight',12)}</button>
      </div>` : ''}
    </div>`;
  }

  // ─── Shared thumbnail drawer card (for history section) ──────────────────

  function renderVariantDrawerCard(latest, olderVersions, variantChildren, project, cardIdx) {
    const isGen = !!latest.ai_metadata?.generating;
    const hasImg = !!latest.image_url;
    const hasError = !!latest.ai_metadata?.error;
    const isExpanding = expandingVariantId === latest.id;
    const safeTitle = project.title.slice(0, 20).replace(/\s+/g, '-');
    const angleName = latest.ai_metadata?.angle_name || '—';
    const allSubItems = [...variantChildren, ...olderVersions]; // shown in bottom strip

    return `
    <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:12px;animation:fadeIn 0.3s ease both;animation-delay:${cardIdx*0.04}s;">
      <div style="display:flex;min-height:140px;">
        <!-- Left: info + actions -->
        <div style="flex:1;padding:18px 20px;border-right:1px solid var(--border);display:flex;flex-direction:column;gap:6px;min-width:0;">
          <!-- Title row -->
          <div style="display:flex;align-items:flex-start;gap:8px;">
            <div style="flex:1;min-width:0;">
              <div style="font-size:15px;font-weight:800;line-height:1.3;color:var(--text-primary);">${angleName}</div>
              ${latest.overlay_text ? `<div style="font-size:11px;font-weight:700;letter-spacing:1px;color:var(--text-tertiary);margin-top:2px;text-transform:uppercase;">${latest.overlay_text}</div>` : ''}
            </div>
            <span style="flex-shrink:0;font-size:13px;font-weight:800;color:${(latest.impact_score||0)>=90?'var(--success)':'var(--accent)'};">${latest.impact_score||0}</span>
          </div>
          <!-- Badges -->
          <div style="display:flex;gap:5px;flex-wrap:wrap;">
            ${latest.style_preset ? `<span class="badge badge-accent" style="font-size:9px;">${latest.style_preset}</span>` : ''}
            ${latest.ai_metadata?.format ? `<span class="badge" style="font-size:9px;background:rgba(99,102,241,0.15);color:#818cf8;">${latest.ai_metadata.format}</span>` : ''}
            ${olderVersions.length > 0 ? `<span class="badge badge-neutral" style="font-size:9px;">${olderVersions.length} versión${olderVersions.length!==1?'es':''} anterior${olderVersions.length!==1?'es':''}</span>` : ''}
          </div>
          <!-- Actions -->
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:auto;padding-top:8px;border-top:1px solid rgba(255,255,255,0.05);">
            ${isGen
              ? `<span class="text-xs text-accent animate-pulse">${icon('clock',12)} Generando...</span>`
              : hasImg
                ? `<button class="btn btn-secondary btn-xs btn-download" data-src="${latest.image_url}" data-name="miniatura-${safeTitle}-${cardIdx+1}.png">${icon('download',11)} Descargar</button>
                   ${!isExpanding ? `
                   <div style="display:flex;align-items:center;gap:4px;">
                     <select class="form-select" id="expand-count-${latest.id}" style="font-size:10px;padding:2px 4px;height:26px;width:60px;">
                       ${[1,2,3,4,5,6,7,8].map(n=>`<option value="${n}"${n===1?' selected':''}>${n}x</option>`).join('')}
                     </select>
                     <button class="btn btn-primary btn-xs btn-expand-variant" data-variant-id="${latest.id}" ${isGenerating||expandingVariantId?'disabled':''} style="white-space:nowrap;">${icon('plus',10)} Variación</button>
                   </div>` : `<span class="text-xs text-accent animate-pulse">${icon('clock',10)} Variando...</span>`}
                   <button class="btn-delete-variant btn btn-secondary btn-xs" data-variant-id="${latest.id}" style="margin-left:auto;color:var(--danger);">${icon('trash',11)}</button>`
                : hasError
                  ? `<span class="text-xs" style="color:var(--danger);">${icon('alertTriangle',11)} Error</span>
                     <button class="btn-delete-variant btn btn-secondary btn-xs" data-variant-id="${latest.id}" style="margin-left:auto;color:var(--danger);">${icon('trash',11)}</button>`
                  : `<span class="text-xs text-muted">Sin imagen</span>`
            }
          </div>
        </div>
        <!-- Right: thumbnail -->
        <div style="width:260px;flex-shrink:0;position:relative;background:var(--bg-tertiary);">
          ${isGen
            ? thumbLoaderHTML()
            : hasImg
              ? `<img src="${latest.image_url}" class="thumb-preview-trigger" data-preview="${latest.image_url}"
                   style="width:100%;height:100%;object-fit:cover;cursor:zoom-in;display:block;" />
                 ${latest.overlay_text ? `<div style="position:absolute;bottom:0;left:0;right:0;padding:6px 8px;background:linear-gradient(transparent,rgba(0,0,0,0.85));">
                   <div style="font-family:var(--font-impact);font-size:13px;color:white;letter-spacing:2px;">${latest.overlay_text}</div>
                 </div>` : ''}`
              : hasError
                ? `<div style="display:flex;align-items:center;justify-content:center;height:100%;padding:16px;opacity:0.5;">${icon('alertTriangle',28)}</div>`
                : `<div style="display:flex;align-items:center;justify-content:center;height:100%;opacity:0.2;">${icon('image',36)}</div>`
          }
        </div>
      </div>
      ${allSubItems.length > 0 ? `
      <div style="border-top:1px solid var(--border);padding:12px 20px;background:rgba(0,0,0,0.15);">
        <div style="font-size:10px;font-weight:700;color:var(--text-tertiary);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">
          ${variantChildren.length > 0 && olderVersions.length > 0
            ? `Variaciones (${variantChildren.length}) · Versiones previas (${olderVersions.length})`
            : variantChildren.length > 0
              ? `Variaciones (${variantChildren.length})`
              : `Versiones previas (${olderVersions.length})`}
        </div>
        <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;">
          ${allSubItems.map((c, ci) => {
            const isOld = olderVersions.includes(c);
            return `
            <div style="flex-shrink:0;width:140px;border-radius:var(--radius-md);overflow:hidden;position:relative;aspect-ratio:16/9;background:var(--bg-tertiary);${isOld?'opacity:0.7;':''}">
              ${c.image_url ? `<img src="${c.image_url}" class="thumb-preview-trigger" data-preview="${c.image_url}" style="width:100%;height:100%;object-fit:cover;cursor:zoom-in;" />` : thumbLoaderHTML('','')}
              ${isOld ? `<div style="position:absolute;top:4px;left:4px;background:rgba(0,0,0,0.7);border-radius:3px;padding:1px 5px;font-size:9px;color:rgba(255,255,255,0.7);">anterior</div>` : ''}
              <button class="btn-delete-variant" data-variant-id="${c.id}" title="Eliminar" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);border:none;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:white;">${icon('trash',9)}</button>
              ${c.image_url ? `<button class="btn-download" data-src="${c.image_url}" data-name="var-${cardIdx+1}-${ci+1}.png" style="position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,0.6);border:none;border-radius:var(--radius-sm);padding:2px 5px;cursor:pointer;color:white;font-size:9px;display:flex;align-items:center;gap:3px;">${icon('download',9)}</button>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>` : ''}
    </div>`;
  }

  // ─── Variants history ─────────────────────────────────────────────────────

  function renderVariantsHistory(project, variants) {
    if (variants.length === 0) return '';
    const CARDS_PER_PAGE = 4;
    const allMasters = variants.filter(v => !v.ai_metadata?.parent_id)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    const children = variants.filter(v => !!v.ai_metadata?.parent_id);
    if (allMasters.length === 0) return '';

    // Group masters by angle_name so duplicates collapse into one card
    const groupMap = new Map();
    for (const m of allMasters) {
      const key = m.ai_metadata?.angle_name || m.id;
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key).push(m);
    }
    const groups = [...groupMap.values()]; // each group: [latest, ...older]
    const generating = variants.filter(v => v.ai_metadata?.generating).length;

    const totalPages = Math.ceil(groups.length / CARDS_PER_PAGE);
    const safePage = Math.min(variantsPage, Math.max(0, totalPages - 1));
    const pageGroups = groups.slice(safePage * CARDS_PER_PAGE, (safePage + 1) * CARDS_PER_PAGE);

    return `
    <div class="mt-lg" id="variants-history-section">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-md);">
        <div class="text-xs font-bold text-muted" style="letter-spacing:1px;text-transform:uppercase;">${icon('image',12)} Miniaturas generadas (${groups.length} ángulo${groups.length!==1?'s':''}${allMasters.length > groups.length ? ` · ${allMasters.length} total` : ''})</div>
        ${generating > 0 ? `<span class="text-xs text-accent animate-pulse">${icon('clock',12)} Generando ${generating}...</span>` : ''}
      </div>

      ${pageGroups.map((group, pi) => {
        const [latest, ...olderVersions] = group;
        const mChildren = children.filter(c => c.ai_metadata?.parent_id === latest.id);
        return renderVariantDrawerCard(latest, olderVersions, mChildren, project, safePage * CARDS_PER_PAGE + pi);
      }).join('')}

      ${totalPages > 1 ? `
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:var(--space-md);">
        <button class="btn btn-secondary btn-sm variants-page-btn" data-page="${safePage-1}" ${safePage===0?'disabled':''}>${icon('arrowLeft',12)}</button>
        ${Array.from({length:totalPages},(_,i)=>`
          <button class="btn btn-sm variants-page-btn ${i===safePage?'btn-primary':'btn-secondary'}" data-page="${i}"
            style="min-width:32px;font-size:12px;">${i+1}</button>`).join('')}
        <button class="btn btn-secondary btn-sm variants-page-btn" data-page="${safePage+1}" ${safePage>=totalPages-1?'disabled':''}>${icon('arrowRight',12)}</button>
      </div>` : ''}
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
      if (workflowStep < 5) { workflowStep++; render(); }
    });

    // ── nav GENERAR TODAS (step 5 bottom nav) — delegates to in-step btn ──
    document.getElementById('btn-generate-master')?.addEventListener('click', () => {
      document.getElementById('btn-generate-all')?.click();
    });

    // ── History section: pagination ──
    container.querySelectorAll('.variants-page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        variantsPage = parseInt(btn.dataset.page);
        render();
      });
    });

    // ── History section: delete-variant ──
    document.querySelectorAll('#variants-history-section .btn-delete-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const variantId = btn.dataset.variantId;
        const project = getProject();
        if (!project) return;
        const variant = (project.thumbnail_variants || []).find(v => v.id === variantId);
        if (variant?.image_url) {
          const parts = variant.image_url.split('/public/thumbnails/');
          if (parts.length > 1) await supabase.storage.from('thumbnails').remove([parts[1]]).catch(()=>{});
        }
        const { error } = await supabase.from('thumbnail_variants').delete().eq('id', variantId);
        if (error) { toast('Error al eliminar: ' + error.message, 'error'); return; }
        await reloadProjects();
        render();
      });
    });

    // ── History section: lightbox + download ──
    document.querySelectorAll('#variants-history-section .thumb-preview-trigger').forEach(img => {
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        const lb = document.getElementById('thumb-lightbox');
        const lbImg = document.getElementById('thumb-lightbox-img');
        if (lb && lbImg) { lbImg.src = img.dataset.preview; lb.classList.add('active'); }
      });
    });
    document.querySelectorAll('#variants-history-section .btn-download').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const src = btn.dataset.src, name = btn.dataset.name;
        try {
          const resp = await fetch(src);
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
          setTimeout(()=>URL.revokeObjectURL(url),1000);
        } catch { const a=document.createElement('a'); a.href=src; a.download=name; document.body.appendChild(a); a.click(); document.body.removeChild(a); }
      });
    });

    // ── History section: expand-variant ──
    document.querySelectorAll('#variants-history-section .btn-expand-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (expandingVariantId) return;
        const variantId = btn.dataset.variantId;
        const countSelect = document.getElementById(`expand-count-${variantId}`);
        const count = Math.min(parseInt(countSelect?.value || '1'), 8);
        const project = getProject();
        if (!project) return;
        const baseVariant = (project.thumbnail_variants || []).find(v => v.id === variantId);
        if (!baseVariant) return;
        expandingVariantId = variantId;
        isGenerating = true;
        render();
        showLoader(container, { title: 'Generando Variaciones', subtitle: `${count} variación${count!==1?'es':''}`, detail: `VARIACIÓN 1 DE ${count}` });
        try {
          for (let i = 0; i < count; i++) {
            updateLoader({ detail: `VARIACIÓN ${i+1} DE ${count} — IMAGE GENERATION` });
            const variationPrompt = buildVariationPrompt(baseVariant, project, i, count);
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
                  prompt: variationPrompt,
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
      if (workflowStep < 5) { workflowStep++; render(); }
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
      const expressionId = selectedExpressionId || autoMatchedFaceId;
      const selectedFace = faceList.find(f => f.id === expressionId);
      overlayText = document.getElementById('custom-overlay-text')?.value ?? overlayText;
      const customText = overlayText || project.title;

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
          for (let i = 0; i < count; i++) {
            updateLoader({
              detail: `VARIACIÓN ${i + 1} DE ${count} — IMAGE GENERATION`,
            });
            const variationPrompt = buildVariationPrompt(baseVariant, project, i, count);

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
                  prompt: variationPrompt,
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

    // ── Format card selection (step 2) ──
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

    // ── Style card selection (step 3) ──
    container.querySelectorAll('.style-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedStyleId = selectedStyleId === card.dataset.styleId ? null : card.dataset.styleId;
        rerenderStep();
        const nextBtn = document.getElementById('btn-next-step');
        if (nextBtn) nextBtn.disabled = !selectedStyleId;
      });
    });

    // ── Face YES/NO (step 4) ──
    document.getElementById('face-opt-yes')?.addEventListener('click', () => {
      faceEnabled = true;
      rerenderStep();
    });
    document.getElementById('face-opt-no')?.addEventListener('click', () => {
      faceEnabled = false;
      rerenderStep();
    });

    // ── Face expression card selection (step 4) ──
    container.querySelectorAll('.face-opt-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedExpressionId = card.dataset.faceId;
        rerenderStep();
      });
    });

    // ── Overlay text persist (step 5) ──
    document.getElementById('custom-overlay-text')?.addEventListener('input', (e) => {
      overlayText = e.target.value;
    });

    // ── Angle pagination (step 5) ──
    container.querySelectorAll('.angles-page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        anglesPage = parseInt(btn.dataset.page);
        rerenderStep();
      });
    });

    // ── Per-card generate (step 5) ──
    container.querySelectorAll('.btn-generate-angle').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (isGenerating) return;
        const angleIdx = parseInt(btn.dataset.angleIndex);
        generatingAngleIndex = angleIdx;
        isGenerating = true;
        rerenderStep();
        try {
          await generateSingleAngle(angleIdx);
        } catch (err) {
          toast('Error al generar: ' + err.message, 'error');
        } finally {
          generatingAngleIndex = null;
          isGenerating = false;
          await reloadProjects();
          render();
        }
      });
    });

    // ── Generate All (step 5) ──
    document.getElementById('btn-generate-all')?.addEventListener('click', async () => {
      if (isGenerating) return;
      const project = getProject();
      if (!project) return;
      const angles = project.logic_dna?.selected_angles || [];
      const variants = project.thumbnail_variants || [];
      const masters = variants.filter(v => !v.ai_metadata?.parent_id);
      const pending = angles.reduce((acc, a, i) => {
        if (!masters.some(v => v.ai_metadata?.angle_name === a.name)) acc.push(i);
        return acc;
      }, []);
      if (pending.length === 0) {
        toast('Todas las miniaturas ya fueron generadas.', 'info', 2500);
        return;
      }
      isGenerating = true;
      render();
      showLoader(container, {
        title: 'Generando Todas las Miniaturas',
        subtitle: `${pending.length} ángulo${pending.length!==1?'s':''} en cola`,
        detail: `INICIANDO`,
      });
      try {
        for (let qi = 0; qi < pending.length; qi++) {
          const angleIdx = pending[qi];
          const angle = angles[angleIdx];
          const letters = ['A','B','C','D','E','F','G','H'];
          updateLoader({
            title: `Generando Ángulo ${letters[angleIdx] || angleIdx+1}`,
            subtitle: `"${angle.name}"`,
            detail: `MINIATURA ${qi+1} DE ${pending.length}`,
          });
          generatingAngleIndex = angleIdx;
          await generateSingleAngle(angleIdx);
          await reloadProjects();
          generatingAngleIndex = null;
        }
        hideLoader();
        toast(`✅ ${pending.length} miniatura${pending.length!==1?'s':''} generada${pending.length!==1?'s':''}`, 'success', 4000);
      } catch (err) {
        hideLoader();
        toast('Error al generar: ' + err.message, 'error');
      } finally {
        generatingAngleIndex = null;
        isGenerating = false;
        await reloadProjects();
        render();
      }
    });

    // ── Step-content expand-variant (step 5 cards) ──
    container.querySelectorAll('#step-content .btn-expand-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (expandingVariantId) return;
        const variantId = btn.dataset.variantId;
        const countSelect = document.getElementById(`expand-count-${variantId}`);
        const count = Math.min(parseInt(countSelect?.value || '1'), 8);
        const project = getProject();
        if (!project) return;
        const baseVariant = (project.thumbnail_variants || []).find(v => v.id === variantId);
        if (!baseVariant) return;
        expandingVariantId = variantId;
        isGenerating = true;
        rerenderStep();
        showLoader(container, { title: 'Generando Variaciones', subtitle: `${count} variación${count!==1?'es':''}`, detail: `VARIACIÓN 1 DE ${count}` });
        try {
          for (let i = 0; i < count; i++) {
            updateLoader({ detail: `VARIACIÓN ${i+1} DE ${count} — IMAGE GENERATION` });
            const variationPrompt = buildVariationPrompt(baseVariant, project, i, count);
            const isRealAngleId = baseVariant.angle_id && !String(baseVariant.angle_id).startsWith('ai-');
            const { data: inserted, error: insertErr } = await supabase.from('thumbnail_variants').insert({
              project_id: project.id,
              angle_id: isRealAngleId ? baseVariant.angle_id : null,
              overlay_text: baseVariant.overlay_text,
              style_preset: baseVariant.style_preset,
              impact_score: Math.floor(Math.random() * 20) + 80,
              ai_metadata: { prompt: variationPrompt, angle_name: baseVariant.ai_metadata?.angle_name||'', format: baseVariant.ai_metadata?.format||'', style: baseVariant.style_preset, generating: true, parent_id: variantId, face_image_url: baseVariant.ai_metadata?.face_image_url||null }
            }).select().single();
            if (insertErr) throw insertErr;
            if (!project.thumbnail_variants) project.thumbnail_variants = [];
            project.thumbnail_variants.push(inserted);
            try {
              const dataUrl = await generateImage(variationPrompt, baseVariant.ai_metadata?.face_image_url || null);
              const { data: sessionData } = await supabase.auth.getSession();
              const userId = sessionData?.session?.user?.id;
              const blob = await fetch(dataUrl).then(r => r.blob());
              const mimeType = blob.type || 'image/jpeg';
              const ext = mimeType.includes('png') ? 'png' : 'jpg';
              const fileName = `${userId}/thumbnails/${project.id}/${inserted.id}.${ext}`;
              await supabase.storage.from('thumbnails').upload(fileName, blob, { contentType: mimeType });
              const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(fileName);
              await supabase.from('thumbnail_variants').update({ image_url: urlData.publicUrl, ai_metadata: { ...inserted.ai_metadata, generating: false } }).eq('id', inserted.id);
              const lv = project.thumbnail_variants.find(v => v.id === inserted.id);
              if (lv) { lv.image_url = urlData.publicUrl; lv.ai_metadata = { ...inserted.ai_metadata, generating: false }; }
            } catch (imgErr) {
              await supabase.from('thumbnail_variants').update({ ai_metadata: { ...inserted.ai_metadata, generating: false, error: imgErr.message } }).eq('id', inserted.id);
            }
          }
          hideLoader();
          toast(`✅ ${count} variación${count!==1?'es':''} generada${count!==1?'s':''}`, 'success', 3000);
        } catch (err) {
          hideLoader();
          toast('Error al variar: ' + err.message, 'error');
        } finally {
          expandingVariantId = null;
          isGenerating = false;
          await reloadProjects();
          render();
        }
      });
    });

    // ── Step-content delete-variant + download + lightbox (step 5 cards) ──
    container.querySelectorAll('#step-content .btn-delete-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const variantId = btn.dataset.variantId;
        const project = getProject();
        if (!project) return;
        const variant = (project.thumbnail_variants || []).find(v => v.id === variantId);
        if (variant?.image_url) {
          const parts = variant.image_url.split('/public/thumbnails/');
          if (parts.length > 1) await supabase.storage.from('thumbnails').remove([parts[1]]).catch(()=>{});
        }
        await supabase.from('thumbnail_variants').delete().eq('id', variantId);
        await reloadProjects();
        render();
      });
    });
    container.querySelectorAll('#step-content .btn-download, #step-content .thumb-preview-trigger').forEach(el => {
      el.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (el.classList.contains('thumb-preview-trigger')) {
          const lb = document.getElementById('thumb-lightbox');
          const lbImg = document.getElementById('thumb-lightbox-img');
          if (lb && lbImg) { lbImg.src = el.dataset.preview; lb.classList.add('active'); }
        } else {
          const src = el.dataset.src, name = el.dataset.name;
          try {
            const resp = await fetch(src);
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
            setTimeout(()=>URL.revokeObjectURL(url),1000);
          } catch { const a=document.createElement('a'); a.href=el.dataset.src; a.download=el.dataset.name; document.body.appendChild(a); a.click(); document.body.removeChild(a); }
        }
      });
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

  // ── Helper: build a full variation prompt from project data ──────────────
  function buildVariationPrompt(baseVariant, project, variationIndex, totalCount) {
    const angleName = baseVariant.ai_metadata?.angle_name || '';
    const angle = (project.logic_dna?.selected_angles || []).find(a => a.name === angleName)
      || { name: angleName, visual_twist: '', psychology_text: '' };

    const styleLabel = baseVariant.style_preset || '';
    const style = STYLES.find(s => s.label === styleLabel) || STYLES[0];

    const formatStr = baseVariant.ai_metadata?.format || '';
    const formatLabels = formatStr.split(' + ').map(s => s.trim()).filter(Boolean);
    const resolvedFormats = formatLabels.map(lbl => FORMATS.find(f => f.label === lbl)).filter(Boolean);
    const safeFormats = resolvedFormats.length > 0 ? resolvedFormats : [FORMATS[0]];

    const faceImageUrl = baseVariant.ai_metadata?.face_image_url || null;
    const useFace = !!faceImageUrl;
    const selectedFace = faceList.find(f => f.image_url === faceImageUrl) || null;

    const masterPrompt = buildMasterPrompt({ project, angle, style, formats: safeFormats, selectedFace, useFace, brandKit });

    const dimensionOptions = [
      'Shift the dominant color temperature significantly (if warm palette → go cool; if cool → go warm). Keep all other elements intact.',
      'Reframe the composition (if tight close-up → go wider with environmental context; if wide → go tighter on the hero element). Keep angle and subject identical.',
      'Change the lighting drama (if subtle atmospheric → push to extreme high-contrast; if harsh → go moody and cinematic). Same subject, same angle, different emotional intensity.',
    ];
    const dimension = dimensionOptions[variationIndex % dimensionOptions.length];

    return `${masterPrompt}

━━━ VARIATION DIRECTIVE — VARIANT ${variationIndex + 1} OF ${totalCount} ━━━
This is a creative variation of an existing thumbnail for the same video, psychological angle, and brand identity.
PRESERVE ABSOLUTELY: the psychological angle "${angleName}", the brand ADN, the subject matter and video context${useFace ? ', and the creator face identity (same real person)' : ''}.
CHANGE — exactly one creative dimension:
→ ${dimension}
The viewer must instantly recognize this as the same concept and video, but with a distinctly different visual energy.
Do NOT replicate the same composition, color palette, or lighting mood as the base version.`;
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
          prompt: imagePrompt,
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
