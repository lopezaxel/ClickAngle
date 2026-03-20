import { supabase } from '../lib/supabase.js';
import { getState, subscribe } from '../lib/state.js';
import { icon } from '../icons.js';
import { callAI, generateImage } from '../lib/intelligence.js';
import { toast, confirmDialog, inputDialog } from '../lib/toast.js';
import { showLoader, updateLoader, hideLoader } from '../lib/loader.js';

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

export async function renderEngine(container) {
  const { activeChannelId } = getState();
  if (!activeChannelId) { container.innerHTML = '<div class="loading-spinner">Selecciona un canal</div>'; return; }

  container.innerHTML = `<div class="loading-spinner"><span class="animate-pulse">${icon('clock', 24)}</span></div>`;

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
  let workflowStep = 1;
  let selectedFormats = [];
  let selectedStyleId = null;
  let isGenerating = false;
  let expandingVariantId = null;
  let batchAngleSelection = null; // null = all selected; array of indices = specific selection

  // Auto-matched face from DNA (set during render based on emotion_label)
  let autoMatchedFaceId = null;

  function getProject() { return projects.find(p => p.id === selectedProjectId); }

  // Cleanup any previous subscription stored on the container
  if (container._cleanup) { container._cleanup(); container._cleanup = null; }

  // ─── RENDER ROOT ──────────────────────────────────────────────────────────

  function render() {
    const project = getProject();
    const selectedAngles = project?.logic_dna?.selected_angles || [];
    const variants = project?.thumbnail_variants || [];

    // Ensure lightbox exists in the page (only once)
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

    // Auto-match face from emotion_label in visual_briefing
    if (project?.logic_dna?.visual_briefing?.emotion_label && faceList.length > 0) {
      const emotionLabel = project.logic_dna.visual_briefing.emotion_label;
      const match = faceList.find(f => f.expression_type === emotionLabel);
      autoMatchedFaceId = match?.id || faceList[0]?.id || null;
    } else {
      autoMatchedFaceId = faceList[0]?.id || null;
    }

    // Build project dropdown items
    const projectDropdownItems = projects.map(p => {
      const pAngles = p.logic_dna?.selected_angles || [];
      const pVariants = p.thumbnail_variants || [];
      const isActive = p.id === selectedProjectId;
      const hasVB = !!p.logic_dna?.visual_briefing;
      return `
        <div class="project-folder" data-project-id="${p.id}"
          style="display:flex; align-items:center; gap:var(--space-sm); padding:var(--space-sm) var(--space-md); cursor:pointer; border-radius:var(--radius-md); transition:background 0.12s;
            ${isActive ? 'background:rgba(220,38,38,0.1);' : 'background:transparent;'}"
          onmouseover="if(!this.classList.contains('active-proj')) this.style.background='var(--bg-elevated)';"
          onmouseout="this.style.background='${isActive ? 'rgba(220,38,38,0.1)' : 'transparent'}';">
          <span style="color:${isActive ? 'var(--accent)' : 'var(--text-tertiary)'}; flex-shrink:0;">${icon('folder', 14)}</span>
          <div style="flex:1; min-width:0;">
            <div class="text-sm font-bold" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:${isActive ? 'var(--text-primary)' : 'var(--text-secondary)'};">${p.title}</div>
            <div class="flex gap-xs mt-xs" style="flex-wrap:wrap;">
              <span class="badge badge-neutral" style="font-size:9px;">${pAngles.length} ángulos</span>
              <span class="badge ${pVariants.length > 0 ? 'badge-accent' : 'badge-neutral'}" style="font-size:9px;">${pVariants.length} miniaturas</span>
              ${hasVB ? `<span class="badge" style="font-size:9px; background:rgba(99,102,241,0.2); color:#818cf8;">🧬 DNA</span>` : ''}
            </div>
          </div>
          <div class="flex gap-xs" style="flex-shrink:0;">
            <button class="btn-rename-project" data-project-id="${p.id}" data-project-title="${p.title.replace(/"/g, '&quot;')}"
              style="background:rgba(129,140,248,0.12); border:1px solid rgba(129,140,248,0.3); cursor:pointer; color:#818cf8; padding:5px 8px; border-radius:6px; display:flex; align-items:center; gap:4px; transition:all 0.15s; font-size:10px; font-weight:700; letter-spacing:0.5px;"
              onmouseover="this.style.background='rgba(129,140,248,0.25)';this.style.borderColor='#818cf8';"
              onmouseout="this.style.background='rgba(129,140,248,0.12)';this.style.borderColor='rgba(129,140,248,0.3)';"
              title="Renombrar proyecto">
              ${icon('edit', 12)} <span>Editar</span>
            </button>
            <button class="btn-delete-project" data-project-id="${p.id}"
              style="background:rgba(220,38,38,0.12); border:1px solid rgba(220,38,38,0.35); cursor:pointer; color:#ef4444; padding:5px 8px; border-radius:6px; display:flex; align-items:center; gap:4px; transition:all 0.15s; font-size:10px; font-weight:700; letter-spacing:0.5px;"
              onmouseover="this.style.background='rgba(220,38,38,0.25)';this.style.borderColor='#ef4444';"
              onmouseout="this.style.background='rgba(220,38,38,0.12)';this.style.borderColor='rgba(220,38,38,0.35)';"
              title="Eliminar proyecto">
              ${icon('trash', 12)} <span>Borrar</span>
            </button>
          </div>
        </div>`;
    }).join('');

    container.innerHTML = `<div class="animate-in">
      <!-- ── Header ── -->
      <div class="section-header" style="margin-bottom:var(--space-md);">
        <div>
          <h2 class="section-title">${icon('cog', 22)} Fábrica Creativa</h2>
          <p class="section-subtitle">Orquestador Maestro — DNA Chain → Miniatura</p>
        </div>
      </div>

      <!-- ── Project Selector (dropdown, full width) ── -->
      <div style="position:relative; margin-bottom:var(--space-md);" id="project-selector-wrap">
        ${projects.length === 0 ? `
          <div class="card" style="text-align:center; padding:var(--space-lg); opacity:0.6;">
            ${icon('brain', 24)}
            <p class="text-sm text-muted mt-sm">Sin proyectos. Procesá un guión en El Cerebro.</p>
          </div>
        ` : `
          <!-- Trigger button -->
          <div style="font-size:9px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:var(--text-tertiary); margin-bottom:5px; padding-left:2px; opacity:0.6;">
            Proyecto activo — hacé click para cambiar
          </div>
          <button id="btn-project-dropdown" style="
            width:100%; display:flex; align-items:center; gap:var(--space-md);
            background:var(--bg-card); border:1px solid ${project ? 'var(--accent)' : 'var(--border)'};
            border-radius:var(--radius-lg); padding:var(--space-sm) var(--space-md);
            cursor:pointer; transition:all 0.15s; text-align:left;"
            onmouseover="this.style.borderColor='var(--accent)';this.style.background='var(--bg-elevated)';"
            onmouseout="this.style.borderColor='${project ? 'var(--accent)' : 'var(--border)'}';this.style.background='var(--bg-card)';">
            <span style="color:var(--accent); flex-shrink:0;">${icon('folder', 16)}</span>
            <div style="flex:1; min-width:0;">
              ${project ? `
                <div class="font-bold text-sm" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${project.title}</div>
                <div class="flex gap-xs mt-xs" style="flex-wrap:wrap;">
                  <span class="badge badge-neutral" style="font-size:9px;">${selectedAngles.length} ángulos</span>
                  <span class="badge ${variants.length > 0 ? 'badge-accent' : 'badge-neutral'}" style="font-size:9px;">${variants.length} miniaturas</span>
                  ${project.logic_dna?.visual_briefing ? `<span class="badge" style="font-size:9px; background:rgba(99,102,241,0.2); color:#818cf8;">🧬 DNA</span>` : ''}
                </div>
              ` : `
                <div class="text-sm" style="color:var(--accent); font-weight:600;">Seleccioná un proyecto para comenzar →</div>
              `}
            </div>
            <div style="flex-shrink:0; display:flex; flex-direction:column; align-items:center; gap:2px;">
              <span style="color:var(--text-tertiary); transition:transform 0.2s;" id="dropdown-chevron">${icon('arrowDown', 14)}</span>
              <span style="font-size:8px; color:var(--accent); font-weight:700; letter-spacing:0.5px; text-transform:uppercase;">cambiar</span>
            </div>
          </button>

          <!-- Dropdown panel -->
          <div id="project-dropdown-panel" style="
            display:none; position:absolute; top:calc(100% + 6px); left:0; right:0; z-index:200;
            background:var(--bg-elevated); border:1px solid var(--border-light);
            border-radius:var(--radius-lg); padding:var(--space-sm);
            box-shadow:0 16px 48px rgba(0,0,0,0.6); max-height:320px; overflow-y:auto;">
            ${projectDropdownItems}
          </div>
        `}
      </div>

      <!-- ── Main workflow (full width) ── -->
      <div>
        ${!project ? `
          <div class="card" style="text-align:center; padding:var(--space-2xl); opacity:0.5;">
            ${icon('folder', 48)}
            <p class="text-sm text-muted mt-md">Seleccioná un proyecto arriba para comenzar</p>
          </div>
        ` : renderWorkflow(project, selectedAngles, variants)}
      </div>

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

  // ─── WORKFLOW ─────────────────────────────────────────────────────────────

  function renderWorkflow(project, selectedAngles, variants) {
    const canGoStep2 = selectedFormats.length > 0;
    const canGoStep3 = canGoStep2 && selectedStyleId;
    const activeBatchIndices = batchAngleSelection ?? selectedAngles.map((_, i) => i);
    const batchCount = activeBatchIndices.length;
    const canGenerate = canGoStep3 && batchCount > 0;

    return `
    <!-- Project header -->
    <div class="card mb-md" style="background:var(--bg-tertiary); border:none; padding:var(--space-md);">
      <div class="flex items-center justify-between">
        <div>
          <div class="font-bold">${project.title}</div>
          ${project.logic_dna?.hook ? `<div class="text-xs text-muted mt-xs">${icon('bolt', 10)} ${project.logic_dna.hook}</div>` : ''}
        </div>
        <div class="flex gap-xs">
          <span class="badge badge-neutral">${selectedAngles.length} ángulos</span>
          <span class="badge badge-neutral">${new Date(project.created_at).toLocaleDateString('es')}</span>
        </div>
      </div>
    </div>

    <!-- DNA Checklist -->
    ${renderDNAChecklist(project)}

    ${selectedAngles.length === 0 ? `
      <div class="card" style="text-align:center; padding:var(--space-xl); opacity:0.6;">
        ${icon('crosshair', 32)}
        <p class="text-sm text-muted mt-sm">Este proyecto no tiene ángulos seleccionados.<br/>Volvé a El Cerebro y elegí ángulos.</p>
      </div>
    ` : `

    <!-- Step tabs -->
    <div class="flex gap-xs mb-lg" style="border-bottom:1px solid var(--border); padding-bottom:var(--space-md);">
      ${[
        { n: 1, label: 'Formato Creativo', ok: canGoStep2 },
        { n: 2, label: 'Estilo Visual', ok: canGoStep3 },
        { n: 3, label: 'Sintetizar', ok: canGenerate },
      ].map(s => `
        <button class="btn btn-sm step-tab ${workflowStep === s.n ? 'btn-primary' : (s.ok || workflowStep > s.n ? 'btn-secondary' : 'btn-secondary')}"
          data-step="${s.n}" style="opacity:${workflowStep < s.n && !(s.n === 2 && canGoStep2) && !(s.n === 3 && canGoStep3) ? '0.45' : '1'};"
          ${s.n === 2 && !canGoStep2 ? 'disabled' : ''}
          ${s.n === 3 && !canGoStep2 ? 'disabled' : ''}>
          <span style="background:${workflowStep === s.n ? 'rgba(255,255,255,0.25)' : (workflowStep > s.n ? 'var(--success)' : 'var(--bg-tertiary)')};
            color:white; border-radius:50%; width:18px; height:18px; display:inline-flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; margin-right:6px;">
            ${workflowStep > s.n ? icon('check', 10) : s.n}
          </span>
          ${s.label}
        </button>
      `).join('')}
    </div>

    <!-- Step content -->
    ${workflowStep === 1 ? renderStep1() : workflowStep === 2 ? renderStep2() : renderStep3(project, selectedAngles, variants)}

    <!-- Bottom nav -->
    <div class="flex justify-between items-center mt-lg">
      <button class="btn btn-secondary btn-sm" id="btn-prev-step" ${workflowStep === 1 ? 'disabled' : ''}>
        ${icon('arrowLeft', 14)} Anterior
      </button>
      ${workflowStep < 3 ? `
        <button class="btn btn-primary btn-sm" id="btn-next-step"
          ${workflowStep === 1 && !canGoStep2 ? 'disabled' : ''}
          ${workflowStep === 2 && !canGoStep3 ? 'disabled' : ''}>
          Siguiente ${icon('arrowRight', 14)}
        </button>
      ` : `
        <button class="btn btn-primary" id="btn-generate-master" ${!canGenerate || isGenerating ? 'disabled' : ''}
          style="background:linear-gradient(135deg, var(--accent), #9333ea); font-size:14px; padding:10px 24px; font-weight:800; letter-spacing:0.5px;">
          ${isGenerating
        ? `<span class="animate-pulse">${icon('clock', 16)}</span> Preparando síntesis...`
        : `${icon('rocket', 16)} SINTETIZAR ${batchCount} ÁNGULO${batchCount !== 1 ? 'S' : ''}${batchCount < selectedAngles.length ? ` (de ${selectedAngles.length})` : ''}`}
        </button>
      `}
    </div>
    `}

    <!-- Generated variants (shown below workflow if any) -->
    ${renderVariantsHistory(project, variants)}
    `;
  }

  // ─── STEP 1: Formato ──────────────────────────────────────────────────────

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

  function renderStep1() {
    const project = getProject();
    const recs = project ? recommendFormats(project) : [];
    const recMap = Object.fromEntries(recs.map(r => [r.id, r]));
    const topRec = recs.find(r => r.confidence === 'alta') || recs[0] || null;

    return `
    <div>

      ${recs.length > 0 ? `
      <!-- IA Recommendation banner -->
      <div style="
        background: linear-gradient(135deg, rgba(220,38,38,0.08), rgba(168,85,247,0.06));
        border: 1px solid rgba(220,38,38,0.25);
        border-radius: var(--radius-md);
        padding: var(--space-md);
        margin-bottom: var(--space-md);
      ">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
          <div style="
            background: rgba(220,38,38,0.15); border:1px solid rgba(220,38,38,0.4);
            border-radius:4px; padding:3px 7px;
            font-size:9px; font-weight:900; letter-spacing:1.5px; color:#ef4444; text-transform:uppercase;
          ">✦ IA</div>
          <div style="font-size:12px; font-weight:700; color:var(--text-primary);">
            Formatos recomendados basados en tu guión y ángulos psicológicos
          </div>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:var(--space-sm);">
          ${recs.map(r => {
            const f = FORMATS.find(x => x.id === r.id);
            return `
            <div style="
              display:flex; align-items:flex-start; gap:8px;
              background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);
              border-radius:var(--radius-sm); padding:8px 10px; flex:1; min-width:180px;
            ">
              <span style="font-size:18px; flex-shrink:0; margin-top:1px;">${f?.emoji}</span>
              <div>
                <div style="display:flex; align-items:center; gap:5px; margin-bottom:2px;">
                  <span style="font-size:11px; font-weight:800; color:var(--text-primary);">${f?.label}</span>
                  <span style="
                    font-size:8px; font-weight:900; letter-spacing:1px; text-transform:uppercase; padding:1px 5px;
                    border-radius:3px; flex-shrink:0;
                    ${r.confidence === 'alta'
                      ? 'background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.3);'
                      : 'background:rgba(245,158,11,0.15); color:#f59e0b; border:1px solid rgba(245,158,11,0.3);'}
                  ">${r.confidence === 'alta' ? 'Alta' : 'Media'}</span>
                </div>
                <div style="font-size:10px; color:rgba(255,255,255,0.45); line-height:1.5;">${r.reason}</div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
      ` : ''}

      <div class="text-xs font-bold text-muted mb-md" style="letter-spacing:1px; text-transform:uppercase;">${icon('layout', 12)} Elegí el formato de composición (podés seleccionar varios)</div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-md);">
        ${FORMATS.map(f => {
          const isSelected = selectedFormats.includes(f.id);
          const rec = recMap[f.id];
          const isHighRec = rec?.confidence === 'alta';
          const isMedRec  = rec?.confidence === 'media';
          return `
          <div class="card format-card" data-format-id="${f.id}" style="cursor:pointer; padding:var(--space-md); transition:all 0.15s; position:relative;
            ${isSelected
              ? 'border-color:var(--accent); background:rgba(220,38,38,0.07);'
              : isHighRec
                ? 'border-color:rgba(16,185,129,0.45); background:rgba(16,185,129,0.04);'
                : isMedRec
                  ? 'border-color:rgba(245,158,11,0.35); background:rgba(245,158,11,0.03);'
                  : ''}">

            <!-- Check circle -->
            <div style="position:absolute; top:10px; right:10px; width:20px; height:20px; border-radius:50%;
              border:2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'};
              background:${isSelected ? 'var(--accent)' : 'transparent'};
              display:flex; align-items:center; justify-content:center; color:white; font-size:11px;">
              ${isSelected ? icon('check', 10) : ''}
            </div>

            <!-- IA badge -->
            ${rec ? `
            <div style="
              position:absolute; top:10px; left:10px;
              font-size:8px; font-weight:900; letter-spacing:1px; text-transform:uppercase;
              padding:2px 6px; border-radius:3px;
              ${isHighRec
                ? 'background:rgba(16,185,129,0.18); color:#10b981; border:1px solid rgba(16,185,129,0.4);'
                : 'background:rgba(245,158,11,0.18); color:#f59e0b; border:1px solid rgba(245,158,11,0.35);'}
            ">✦ IA ${isHighRec ? '★★★' : '★★'}</div>
            ` : ''}

            <div style="font-size:28px; margin-bottom:var(--space-sm); margin-top:${rec ? '20px' : '0'};">${f.emoji}</div>
            <div class="font-bold" style="font-size:14px;">${f.label}</div>
            <div class="text-xs mb-xs" style="color:${isHighRec ? '#10b981' : isMedRec ? '#f59e0b' : 'var(--accent)'};">${f.subtitle}</div>
            <div class="text-xs text-muted" style="line-height:1.5;">${f.desc}</div>
          </div>`;
        }).join('')}
      </div>

      ${selectedFormats.length === 0 ? `
        <p class="text-xs text-muted mt-md" style="text-align:center; opacity:0.6;">Seleccioná al menos un formato para continuar${topRec ? ` — IA recomienda empezar con <strong>${FORMATS.find(x=>x.id===topRec.id)?.label}</strong>` : ''}</p>
      ` : `
        <p class="text-xs text-accent mt-md" style="text-align:center;">${icon('check', 12)} ${selectedFormats.length} formato${selectedFormats.length > 1 ? 's' : ''} seleccionado${selectedFormats.length > 1 ? 's' : ''}</p>
      `}
    </div>`;
  }

  // ─── STEP 2: Estilo ───────────────────────────────────────────────────────

  function renderStep2() {
    const styleSummary = brandKit?.style_summary;
    return `
    <div>
      <div class="text-xs font-bold text-muted mb-md" style="letter-spacing:1px; text-transform:uppercase;">${icon('palette', 12)} Elegí el estilo visual base</div>

      ${styleSummary ? `
      <div class="card mb-md" style="background:rgba(99,102,241,0.08); border-color:rgba(99,102,241,0.3); padding:var(--space-md);">
        <div class="text-xs font-bold mb-sm" style="color:#818cf8; letter-spacing:1px;">✨ Firma Visual de tu Galería de Éxitos</div>
        <div class="text-xs text-muted mb-xs"><strong>Estilo:</strong> ${styleSummary.visual_style || '—'}</div>
        <div class="text-xs text-muted mb-xs"><strong>Patrón Ganador:</strong> ${styleSummary.winning_pattern || '—'}</div>
        ${styleSummary.palette?.length ? `
        <div class="flex gap-xs mt-sm" style="align-items:center;">
          <span class="text-xs text-muted">Paleta:</span>
          ${styleSummary.palette.map(c => `<div title="${c}" style="width:18px;height:18px;border-radius:50%;background:${c};border:2px solid rgba(255,255,255,0.15);"></div>`).join('')}
        </div>` : ''}
      </div>
      ` : ''}

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-md);">
        ${STYLES.map(s => {
      const isSelected = selectedStyleId === s.id;
      return `
          <div class="card style-card" data-style-id="${s.id}" style="cursor:pointer; padding:var(--space-md); transition:all 0.15s; position:relative;
            ${isSelected ? 'border-color:var(--accent); background:rgba(220,38,38,0.07);' : ''}">
            <div style="position:absolute; top:10px; right:10px; width:20px; height:20px; border-radius:50%;
              border:2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'};
              background:${isSelected ? 'var(--accent)' : 'transparent'};
              display:flex; align-items:center; justify-content:center; color:white; font-size:11px;">
              ${isSelected ? icon('check', 10) : ''}
            </div>
            <div style="font-size:28px; margin-bottom:var(--space-sm);">${s.emoji}</div>
            <div class="font-bold" style="font-size:14px;">${s.label}</div>
            <div class="text-xs text-accent mb-xs">${s.subtitle}</div>
            <div class="text-xs text-muted" style="line-height:1.5; font-style:italic; font-size:10px;">${s.lighting.replace('LIGHTING & TEXTURE: ', '').split('.')[0]}.</div>
          </div>`;
    }).join('')}
      </div>
      ${!selectedStyleId ? `<p class="text-xs text-muted mt-md" style="text-align:center; opacity:0.6;">Seleccioná un estilo visual para continuar</p>` : `
        <p class="text-xs text-accent mt-md" style="text-align:center;">${icon('check', 12)} Estilo: <strong>${STYLES.find(s => s.id === selectedStyleId)?.label}</strong></p>
      `}
    </div>`;
  }

  // ─── STEP 3: Ángulo + Sintetizar ─────────────────────────────────────────

  function renderStep3(project, selectedAngles, variants) {
    const vb = project?.logic_dna?.visual_briefing;
    const emotionLabel = vb?.emotion_label;
    const matchedFace = faceList.find(f => f.id === autoMatchedFaceId);
    const PSYCH_COLORS = [
      { badge: '#ef4444', bg: 'rgba(220,38,38,0.08)', label: 'MIEDO' },
      { badge: '#a855f7', bg: 'rgba(168,85,247,0.08)', label: 'CURIOSIDAD' },
      { badge: '#3b82f6', bg: 'rgba(59,130,246,0.08)', label: 'AUTORIDAD' },
      { badge: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'CONTRASTE' },
      { badge: '#10b981', bg: 'rgba(16,185,129,0.08)', label: 'URGENCIA' },
    ];

    return `
    <div>
      <!-- Fusión de Capas summary -->
      <div class="card mb-md" style="background:linear-gradient(135deg, rgba(220,38,38,0.08), rgba(147,51,234,0.06)); border-color:rgba(220,38,38,0.3); padding:var(--space-md);">
        <div class="text-xs font-bold mb-sm" style="letter-spacing:1px; text-transform:uppercase; color:var(--accent);">${icon('rocket', 12)} Fusión de Capas — ${selectedAngles.length} Ángulo${selectedAngles.length !== 1 ? 's' : ''} × Prompt Único</div>
        <div style="display:flex; flex-direction:column; gap:4px;">
          ${[
        { n: 1, label: 'Estilo Visual', value: (() => { const s = STYLES.find(x => x.id === selectedStyleId); return `${s?.emoji} ${s?.label} (${s?.subtitle})`; })(), color: '#818cf8' },
        { n: 2, label: 'Formato Físico', value: selectedFormats.map(fid => { const f = FORMATS.find(x => x.id === fid); return `${f?.emoji} ${f?.subtitle}`; }).join(' + '), color: '#f59e0b' },
        { n: 3, label: 'Objeto Héroe', value: project.logic_dna?.visual_briefing?.hero_object || project.logic_dna?.hook || 'desde script DNA', color: '#10b981' },
        { n: 4, label: 'Visual Twist', value: `único por ángulo A/B/C (${selectedAngles.length} variante${selectedAngles.length > 1 ? 's' : ''})`, color: '#ef4444' },
        { n: 5, label: 'ADN de Marca', value: brandKit ? '✅ Brand Kit conectado' : '⚠️ Sin Brand Kit', color: '#a855f7' },
      ].map(row => `
          <div class="flex items-center gap-sm" style="background:var(--bg-tertiary); border-radius:var(--radius-sm); padding:6px 10px;">
            <div style="width:18px;height:18px;border-radius:50%;background:${row.color}22;border:1.5px solid ${row.color};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;color:${row.color};flex-shrink:0;">${row.n}</div>
            <div class="text-xs text-muted" style="flex-shrink:0; min-width:80px;">${row.label}</div>
            <div class="text-xs font-bold" style="color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${row.value}</div>
          </div>`).join('')}
        </div>
      </div>

      <!-- Text Suggestion — condicional según text_decision del DNA -->
      ${(() => {
        const td = project.logic_dna?.text_decision;
        const suggestions = project.logic_dna?.text_suggestions || [];
        const typeLabels = { pregunta: '¿...?', numero: '0-9', palabra_choque: '⚡', frase_corta: 'AB', ninguno: '—' };

        if (td && td.needs_text === false && td.confidence === 'alta') {
          // La imagen habla sola — texto no recomendado
          return `
          <div class="card mb-md" style="background:rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.35); padding:var(--space-md);">
            <div class="flex items-center gap-sm mb-sm">
              <span style="font-size:18px;">🎯</span>
              <div>
                <div class="text-xs font-bold" style="color:var(--success);">Esta miniatura habla por sí sola</div>
                <div class="text-xs text-muted">${td.reason || 'La imagen comunica el concepto sin necesidad de texto.'}</div>
              </div>
            </div>
            <details style="margin-top:var(--space-xs);">
              <summary class="text-xs text-muted" style="cursor:pointer; opacity:0.6;">Agregar texto de todos modos (no recomendado)</summary>
              <div class="mt-sm">
                <div class="flex gap-xs mb-sm" style="flex-wrap:wrap;">
                  ${suggestions.map(txt => `
                    <button class="badge badge-accent btn-suggestion-text" style="cursor:pointer; border:none; font-size:10px; padding:6px 10px;" data-text="${txt}">${txt}</button>
                  `).join('')}
                </div>
                <input type="text" class="form-input" id="custom-overlay-text" placeholder="Texto de override (1-3 palabras máx)..." value="" style="font-size:12px; font-weight:800; letter-spacing:1px;" />
              </div>
            </details>
          </div>`;
        } else if (td && td.needs_text === true) {
          // Texto recomendado — mostrar tipo sugerido y máx palabras
          const typeLabel = typeLabels[td.type] || '';
          const maxW = td.max_words || 3;
          return `
          <div class="card mb-md" style="background:var(--bg-tertiary); border: 1px solid var(--accent); padding:var(--space-md);">
            <div class="flex items-center justify-between mb-sm">
              <label class="form-label mb-0">${icon('bolt', 12)} Texto de Overlay</label>
              <div class="flex gap-xs">
                ${td.type && td.type !== 'ninguno' ? `<span class="badge" style="font-size:9px; background:rgba(168,85,247,0.15); color:#a855f7; border:1px solid rgba(168,85,247,0.3);">Tipo: ${typeLabel}</span>` : ''}
                <span class="badge" style="font-size:9px; background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.3);">Máx ${maxW} palabras</span>
              </div>
            </div>
            <div class="text-xs text-muted mb-sm" style="opacity:0.7;">${td.reason || ''}</div>
            <div class="flex gap-xs mb-sm" style="flex-wrap:wrap;">
              <button class="badge btn-suggestion-text" style="cursor:pointer; border:1px solid rgba(100,100,100,0.3); background:transparent; font-size:10px; padding:6px 10px; color:var(--text-muted);" data-text="">Sin texto</button>
              ${suggestions.map(txt => `
                <button class="badge badge-accent btn-suggestion-text" style="cursor:pointer; border:none; font-size:10px; padding:6px 10px;" data-text="${txt}">${txt}</button>
              `).join('')}
            </div>
            <input type="text" class="form-input" id="custom-overlay-text" placeholder="O escribe tu propio texto (${maxW} palabras máx)..." value="" style="font-size:12px; font-weight:800; letter-spacing:1px;" />
          </div>`;
        } else {
          // Sin text_decision (proyecto viejo o sin análisis) — comportamiento neutro
          return `
          <div class="card mb-md" style="background:var(--bg-tertiary); border: 1px solid var(--border); padding:var(--space-md);">
            <label class="form-label">${icon('bolt', 12)} Texto de Overlay <span class="text-xs text-muted" style="font-weight:400;">(opcional — déjalo vacío si la imagen habla sola)</span></label>
            <div class="flex gap-xs mb-sm" style="flex-wrap:wrap;">
              <button class="badge btn-suggestion-text" style="cursor:pointer; border:1px solid rgba(100,100,100,0.3); background:transparent; font-size:10px; padding:6px 10px; color:var(--text-muted);" data-text="">Sin texto</button>
              ${suggestions.map(txt => `
                <button class="badge badge-accent btn-suggestion-text" style="cursor:pointer; border:none; font-size:10px; padding:6px 10px;" data-text="${txt}">${txt}</button>
              `).join('')}
            </div>
            <input type="text" class="form-input" id="custom-overlay-text" placeholder="Escribe tu texto de impacto (1-3 palabras máx)..." value="" style="font-size:12px; font-weight:800; letter-spacing:1px;" />
          </div>`;
        }
      })()}

      <!-- Face auto-match -->
      <div class="card mb-md" style="background:var(--bg-tertiary); padding:var(--space-md);">
        <div class="flex items-center justify-between mb-sm">
          <label class="form-label mb-0">${icon('camera', 12)} Cara para la Miniatura</label>
          <div class="flex items-center gap-sm">
            <input type="checkbox" id="check-use-face" style="width:16px;height:16px;cursor:pointer;" ${matchedFace ? 'checked' : ''} />
            <label for="check-use-face" class="text-xs cursor-pointer">Incluir rostro</label>
          </div>
        </div>

        ${emotionLabel && matchedFace ? `
        <div class="flex items-center gap-sm p-sm mb-sm" style="background:rgba(16,185,129,0.1); border-radius:var(--radius-sm); border:1px solid rgba(16,185,129,0.3);">
          <span style="color:var(--success); font-size:16px;">✅</span>
          <div>
            <div class="text-xs font-bold" style="color:var(--success);">Match automático por DNA</div>
            <div class="text-xs text-muted">Emoción detectada: <strong>${emotionLabel}</strong> → Foto con label "${matchedFace.expression_type}"</div>
          </div>
        </div>
        ` : emotionLabel && !matchedFace ? `
        <div class="flex items-center gap-sm p-sm mb-sm" style="background:rgba(245,158,11,0.1); border-radius:var(--radius-sm); border:1px solid rgba(245,158,11,0.3);">
          <span style="font-size:16px;">⚠️</span>
          <div class="text-xs text-muted">No hay foto con label <strong>${emotionLabel}</strong> en Face Vault. Etiquetá fotos en Brand Kit.</div>
        </div>
        ` : ''}

        <select class="form-select" id="select-expression-step3" style="font-size:12px;">
          ${faceList.map(f => `<option value="${f.id}" ${f.id === autoMatchedFaceId ? 'selected' : ''}>${f.expression_type || 'Sin etiqueta'}</option>`).join('')}
          ${faceList.length === 0 ? '<option value="">Sin rostros en el Vault</option>' : ''}
        </select>
      </div>

      <!-- Ángulos del batch — seleccionables -->
      ${(() => {
        const activeSelection = batchAngleSelection ?? selectedAngles.map((_, i) => i);
        const allSelected = activeSelection.length === selectedAngles.length;
        const selectedCount = activeSelection.length;
        return `
      <div class="flex items-center gap-sm mb-sm" style="justify-content:space-between; flex-wrap:wrap; gap:8px;">
        <div class="text-xs font-bold text-muted" style="letter-spacing:1px; text-transform:uppercase;">${icon('crosshair', 12)} Seleccioná qué ángulos generar — <span style="color:var(--accent);">${selectedCount} de ${selectedAngles.length}</span> seleccionado${selectedCount !== 1 ? 's' : ''}</div>
        <div class="flex gap-xs">
          <button id="btn-batch-select-all" style="font-size:10px; padding:3px 10px; border-radius:4px; border:1px solid rgba(99,102,241,0.4); background:${allSelected ? 'rgba(99,102,241,0.2)' : 'transparent'}; color:#818cf8; cursor:pointer; font-weight:700; letter-spacing:0.5px;">Todos</button>
          <button id="btn-batch-deselect-all" style="font-size:10px; padding:3px 10px; border-radius:4px; border:1px solid rgba(255,255,255,0.15); background:transparent; color:rgba(255,255,255,0.4); cursor:pointer; font-weight:700; letter-spacing:0.5px;">Ninguno</button>
        </div>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:var(--space-sm); margin-bottom:var(--space-md);">
        ${selectedAngles.map((a, i) => {
          const colors = PSYCH_COLORS[i % PSYCH_COLORS.length];
          const letter = ['A', 'B', 'C', 'D', 'E'][i] || (i + 1);
          const angleVariants = variants.filter(v => v.ai_metadata?.angle_name === a.name);
          const isSelected = activeSelection.includes(i);
          return `
          <div class="batch-angle-card" data-angle-idx="${i}" style="
            padding:var(--space-md); border-radius:var(--radius-md); cursor:pointer;
            background:${isSelected ? colors.bg : 'rgba(255,255,255,0.03)'};
            border:1px solid ${isSelected ? colors.badge : 'rgba(255,255,255,0.08)'};
            opacity:${isSelected ? '1' : '0.45'};
            transition:all 0.15s ease;
            user-select:none; position:relative;
          ">
            ${isSelected ? `<div style="position:absolute;top:8px;right:8px;width:16px;height:16px;border-radius:50%;background:${colors.badge};display:flex;align-items:center;justify-content:center;">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>` : `<div style="position:absolute;top:8px;right:8px;width:16px;height:16px;border-radius:50%;border:1px solid rgba(255,255,255,0.2);"></div>`}
            <div class="flex items-center gap-sm mb-sm">
              <div style="width:24px;height:24px;border-radius:50%;background:${isSelected ? colors.badge : 'rgba(255,255,255,0.1)'};display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:900;flex-shrink:0;">${letter}</div>
              <div class="font-bold" style="font-size:13px;">${a.name}</div>
            </div>
            ${a.visual_twist ? `<div class="text-xs text-muted" style="font-style:italic; line-height:1.4; font-size:10px;">"${a.visual_twist}"</div>` : ''}
            ${angleVariants.length > 0 ? `<div class="text-xs mt-sm" style="color:${colors.badge};">${icon('image', 10)} ${angleVariants.length} ya generada${angleVariants.length > 1 ? 's' : ''}</div>` : ''}
          </div>`;
        }).join('')}
      </div>

      ${selectedAngles.length === 0 ? `
        <p class="text-xs text-muted" style="text-align:center; opacity:0.6;">No hay ángulos. Volvé al Cerebro y generá ángulos de click.</p>
      ` : selectedCount === 0 ? `
        <div class="card" style="padding:var(--space-sm) var(--space-md); background:rgba(220,38,38,0.08); border-color:rgba(220,38,38,0.3); text-align:center;">
          <span class="text-xs" style="color:#ef4444;">⚠️ Seleccioná al menos un ángulo para generar.</span>
        </div>
      ` : `
        <div class="card" style="padding:var(--space-sm) var(--space-md); background:rgba(99,102,241,0.08); border-color:rgba(99,102,241,0.3); text-align:center;">
          <span class="text-xs" style="color:#818cf8;">🧬 Fusión de Capas lista — ${selectedCount === selectedAngles.length ? `las ${selectedCount} imágenes` : `${selectedCount} imagen${selectedCount !== 1 ? 'es' : ''} (de ${selectedAngles.length} ángulos)`} recibirán su propio <strong>Visual Twist</strong> como capa 4 del prompt.</span>
        </div>
      `}`;
      })()}
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
            ? `<div class="flex flex-col items-center justify-center h-full gap-sm">
                   <div class="animate-pulse" style="color:var(--accent);">${icon('clock', 32)}</div>
                   <div class="text-xs text-muted">Generando imagen...</div>
                 </div>`
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

    // ── Project dropdown toggle ──
    const dropdownBtn = document.getElementById('btn-project-dropdown');
    const dropdownPanel = document.getElementById('project-dropdown-panel');
    const dropdownChevron = document.getElementById('dropdown-chevron');

    if (dropdownBtn && dropdownPanel) {
      dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdownPanel.style.display !== 'none';
        dropdownPanel.style.display = isOpen ? 'none' : 'block';
        if (dropdownChevron) dropdownChevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
      });

      // Close on outside click
      document.addEventListener('click', function closeDropdown(e) {
        const wrap = document.getElementById('project-selector-wrap');
        if (wrap && !wrap.contains(e.target)) {
          dropdownPanel.style.display = 'none';
          if (dropdownChevron) dropdownChevron.style.transform = 'rotate(0deg)';
          document.removeEventListener('click', closeDropdown);
        }
      });
    }

    // ── Project selection from dropdown ──
    container.querySelectorAll('.project-folder').forEach(el => {
      el.addEventListener('click', (e) => {
        // Don't select if clicking rename/delete buttons inside
        if (e.target.closest('.btn-rename-project') || e.target.closest('.btn-delete-project')) return;
        if (selectedProjectId !== el.dataset.projectId) {
          selectedProjectId = el.dataset.projectId;
          workflowStep = 1;
          selectedFormats = [];
          selectedStyleId = null;
          batchAngleSelection = null;
        }
        // Close dropdown
        if (dropdownPanel) dropdownPanel.style.display = 'none';
        if (dropdownChevron) dropdownChevron.style.transform = 'rotate(0deg)';
        render();
      });
    });

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

    container.querySelectorAll('.format-card').forEach(card => {
      card.addEventListener('click', () => {
        const fid = card.dataset.formatId;
        if (selectedFormats.includes(fid)) {
          selectedFormats = selectedFormats.filter(x => x !== fid);
        } else {
          selectedFormats.push(fid);
        }
        render();
      });
    });

    container.querySelectorAll('.style-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedStyleId = selectedStyleId === card.dataset.styleId ? null : card.dataset.styleId;
        render();
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

    // ── BATCH ANGLE SELECTION ──
    container.querySelectorAll('.batch-angle-card').forEach(card => {
      card.addEventListener('click', () => {
        const project = getProject();
        const allAngles = project?.logic_dna?.selected_angles || [];
        const idx = parseInt(card.dataset.angleIdx, 10);
        const current = batchAngleSelection ?? allAngles.map((_, i) => i);
        if (current.includes(idx)) {
          batchAngleSelection = current.filter(i => i !== idx);
        } else {
          batchAngleSelection = [...current, idx].sort((a, b) => a - b);
        }
        render();
      });
    });

    document.getElementById('btn-batch-select-all')?.addEventListener('click', () => {
      batchAngleSelection = null; // null = all
      render();
    });

    document.getElementById('btn-batch-deselect-all')?.addEventListener('click', () => {
      batchAngleSelection = [];
      render();
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
      const useFace = document.getElementById('check-use-face')?.checked;
      const expressionId = document.getElementById('select-expression-step3')?.value;
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
              const fileName = `${userId}/thumbnails/${project.id}/${inserted.id}.png`;
              await supabase.storage.from('thumbnails').upload(fileName, blob, { contentType: 'image/png', upsert: true });
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

FINAL REQUIREMENTS: No borders. Ultra-sharp. Maximum visual punch. Vibrant. High contrast against competition.

━━━ REGLA ABSOLUTA — CERO TEXTO EN LA IMAGEN ━━━
PROHIBIDO renderizar texto, palabras, letras, números o tipografía en cualquier parte de la imagen — ni en pantallas, señales, banners, barras, badges, carteles, ni en ningún otro lugar. Cualquier elemento de diseño que normalmente contendría texto (barras de chyron, tarjetas de título, etiquetas, marcas de agua, pantallas con código o mensajes) debe mostrar ÚNICAMENTE color sólido, formas geométricas, patrones visuales abstractos o íconos gráficos — NUNCA caracteres legibles. El texto se aplica exclusivamente en post-producción como overlay. VIOLAR ESTA REGLA ES EL ERROR #1 — EVITAR A TODA COSTA.`;
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
      const fileName = `${userId}/thumbnails/${project.id}/${inserted.id}.png`;
      await supabase.storage.from('thumbnails').upload(fileName, blob, { contentType: 'image/png', upsert: true });
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
