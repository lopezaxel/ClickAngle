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
    desc: 'Contraste visual extremo. Composición de confrontación inventada por un diseñador gráfico experto.',
    composition: `FORMAT: DUELO DE TITANES (Confrontation / Versus / Before-After). You are a world-class YouTube thumbnail graphic designer. DO NOT use a generic line down the middle — that is amateur and boring. Instead, choose the single most visually explosive execution for this specific content from the creative approaches below, and push it to its maximum potential:

OPTION A — TORN WORLD SPLIT: The canvas is dramatically split diagonally with a jagged torn edge, as if reality divided in two. Each world (left vs right) is a completely different environment, atmosphere, and color temperature. Objects or debris scatter along the tear edge in 3D perspective.

OPTION B — COLLISION EPICENTER: Both elements meet at dead center, generating a shockwave burst, energy impact, or shatter point that organically divides the composition. No line — pure kinetic energy. Particles fly outward from the collision point.

OPTION C — BEFORE / AFTER TEMPORAL CONTRAST: Left side = the "before" world — muted, desaturated, dim, beaten-down. Right side = the dramatic "after" — saturated, lit, transformed, powerful. A sharp but organic edge (light spill, smoke wall, broken frame) separates the two states. The subject may appear on both sides showing transformation.

OPTION D — WORLD VS WORLD ENVIRONMENTAL CLASH: Each half contains a completely different environment that embodies the contrast — wealth vs poverty, fire vs ice, chaos vs order, city vs nature, past vs future. The subject inhabits their respective world. The contrast between environments IS the composition — no explicit divider needed beyond the natural environmental boundary.

OPTION E — DIAGONAL POWER SPLIT: A bold diagonal slash divides the frame from upper-left to lower-right at 45°. Each triangle-half has its own lighting, color world, and subject positioning. The dividing angle creates aggressive dynamic tension. Elements lean INTO the diagonal.

OPTION F — FACE DUALITY EXTREME CLOSE-UP: Two dramatically different expressions or states of the same subject fill each half of the frame in extreme close-up — joy vs rage, before vs after, weak vs powerful, trapped vs free. The split happens at the nose bridge or center of the face. Maximum facial expression contrast.

CHOSEN EXECUTION: Select ONE option above that best matches the Layer 3 content themes. Execute it at 100% creative intensity — no holding back. Both compositional halves must create irresistible visual tension. CRITICAL: All colors MUST derive from the content thematic palette in Layer 2.5 — never use neon/tech tones unless the content is explicitly tech-related.`,
  },
  {
    id: 'authority',
    label: 'Autoridad Tech',
    subtitle: 'Hero Object / Objeto de Deseo',
    emoji: '🖥️',
    desc: 'Foco en el objeto con profundidad de campo extrema. El creador proyecta liderazgo total.',
    composition: `FORMAT: AUTORIDAD — HERO OBJECT DOMINANCE. You are a world-class YouTube thumbnail graphic designer. Design the composition so the hero object commands absolute visual authority. Choose the most impactful execution for this specific content:

OPTION A — FLOATING OBJECT IN DRAMATIC VOID: The hero object floats in an impossibly dramatic environment — suspended in space, emerging from a dark abyss, levitating above chaos. The background is rich with atmospheric depth (volumetric light rays, fog, particles) that makes the object feel mythic and unreachable.

OPTION B — OVERSIZED OBJECT / HUMAN DWARFED: The object is rendered at absurd scale — a phone the size of a building, a stack of money towering over a city, a product that fills the entire frame. The human subject (if present) stands at its base, dwarfed, pointing upward in awe or greed. Scale contrast creates instant visual shock.

OPTION C — HAND REVEAL DRAMATIC LIGHTING: A hand emerges from darkness in extreme close-up, holding or presenting the hero object under a single dramatic spotlight. Everything outside the spotlight is consumed by deep shadow. The object glows as if radioactive with internal light. Hyper-sharp product photography meets cinematic noir.

OPTION D — CREATOR COMMAND POSE: Subject positioned in extreme authority pose (leaning forward, arms spread, or standing over the frame) with the hero object integrated into their posture as a weapon, shield, or prize. Environmental context reinforces the power dynamic — throne room, wreckage, command center, vault. Background color temperature from Layer 2.5.

CHOSEN EXECUTION: Select ONE option above that creates the maximum sense of desire, authority, and "I need to know more." Hero object must be unmistakably sharp and dominant. Bokeh, atmosphere, and accent colors all derive from Layer 2.5.`,
  },
  {
    id: 'shock',
    label: 'Shock / Caja Negra',
    subtitle: 'Misterio / Curiosity Gap',
    emoji: '🖤',
    desc: 'Psicología de la curiosidad. Diseñado para crear una brecha de intriga irresistible.',
    composition: `FORMAT: SHOCK — CURIOSITY GAP / PSYCHOLOGICAL MYSTERY. You are a world-class YouTube thumbnail graphic designer who understands the psychology of the curiosity gap. The viewer must feel physically compelled to click to resolve the tension. Choose the most psychologically effective execution:

OPTION A — THE CENSORED SECRET: A key element — a face, an object, an amount, a location — is deliberately hidden behind a solid bold geometric bar, heavy pixelation, or strategic shadow that feels intentional and provocative. The surrounding context makes the hidden element's identity obvious enough to be tantalizing but impossible to confirm without clicking.

OPTION B — THE HALF-REVEALED MYSTERY: Something enormous or surprising is cut off by the frame edge — only a portion visible (oversized hand, huge number, dramatic structure edge, shadow of something unseen). The composition forces the viewer's brain to imagine what's outside the frame. Maximum negative space tension.

OPTION C — THE EXTREME REACTION CLOSE-UP: Face in absolute extreme close-up — only eyes and forehead visible, or mouth agape in pure shock. The viewer reads the emotion viscerally before processing the context. The subject's gaze direction points to something off-camera that we cannot see. Dark vignette crushes the edges. A single harsh light source carves the face with deep shadows.

OPTION D — THE BROKEN FOURTH WALL: Subject stares DIRECTLY into camera with an expression of "you won't believe what I found" — intimate conspiratorial eye contact. One hand points or gestures toward a dark, fogged area of the frame where the secret object/scene is barely visible. Feels like forbidden knowledge being shared.

CHOSEN EXECUTION: Select ONE option that creates maximum psychological tension for this content. The image must feel incomplete without clicking. Ambient light and accent glow color from Layer 2.5. Cinematic crop feel, heavy vignette edges.`,
  },
  {
    id: 'breaking',
    label: 'Alerta / Breaking News',
    subtitle: 'Urgencia Total',
    emoji: '🚨',
    desc: 'Urgencia visual máxima. Diseñado para detener el scroll con sensación de evento inmediato.',
    composition: `FORMAT: ALERTA — MAXIMUM URGENCY / BREAKING EVENT. You are a world-class YouTube thumbnail graphic designer who specializes in high-urgency visual communication. Design for one purpose: make the viewer feel something important is happening RIGHT NOW and they must watch. Choose the most effective urgency execution:

OPTION A — THE BROADCAST CRISIS FRAME: Broadcast news visual language — bold solid color band graphic at bottom third (pure color/shape, ZERO text or letters). Subject in urgent forward-lean pose centered in frame as if delivering an emergency announcement. Hard rim lighting separates subject from dramatic background. Graphic icon badge (symbol only, no letters) in upper corner signals alert category. Color palette from Layer 2.5.

OPTION B — DRAMATIC EVENT BACKDROP: Subject positioned in confident foreground stance while a massive high-energy event unfolds behind them — transformation, energy surge, crowd movement, dramatic shift. The juxtaposition of composed subject against intense background creates extreme visual tension. Subject appears aware of what is unfolding behind them.

OPTION C — THE COUNTDOWN / URGENCY GRAPHIC OVERLAY: Abstract countdown or urgency graphic element — a cracked frame around the image, warning stripe borders (graphic pattern only, no text), concentric circle shock waves, or a flashing alert icon rendered as a pure geometric shape. The entire image feels like a system alert. Colors scream danger from Layer 2.5 thematic palette.

OPTION D — THE EVIDENCE REVEAL: Document, photograph, screenshot, or physical evidence presented dramatically — held up toward camera, scattered on a surface with dramatic overhead lighting, or partially torn to reveal something underneath. The subject's hand or face frames the reveal. Feels like proof of something shocking being shown to the viewer.

CHOSEN EXECUTION: Select ONE option that creates the most urgent "this just happened" feeling for this specific content. ALL text/letters/numbers in the image = ZERO. Pure visual language only. Alert colors from Layer 2.5.`,
  },
];

const STYLES = [
  {
    id: 'hyperrealist',
    label: 'Master Studio (UHD)',
    subtitle: '8K Realismo',
    emoji: '📸',
    keywords: 'Ultra-photorealistic, 8k resolution, raw photography masterwork, intricate skin textures with visible pores, volumetric studio lighting, professional color grading, extreme sharpness, zero artifacting, zero AI-look.',
    lighting: 'VISUAL STYLE — MASTER STUDIO HYPERREALISM: Execute this as a professional commercial photographer with a $50,000 studio setup. Three-point lighting: sharp key light from 45° carving dramatic facial geometry, soft fill eliminating dead shadows, tight separation rim light that pops the subject off the background. 8K ultra-sharp rendering — skin pores, fabric threads, material grain all visible. Color science: neutral-to-warm grade with precise skin tone accuracy. Every surface must look physically real and tangible — this image could be mistaken for a photograph. Zero cartoon artifacts, zero plastic skin, zero AI glow. Maximum photographic credibility.',
  },
  {
    id: 'mrbeast',
    label: 'Estilo Explosivo',
    subtitle: 'High CTR',
    emoji: '🔥',
    keywords: 'Hyper-punchy MrBeast-level CTR aesthetic, extreme color saturation, crushed blacks, micro-contrast maximum, cartoonish-realism skin, vivid glowing rim lights, super-charged visual impact that stops the scroll instantly.',
    lighting: 'VISUAL STYLE — EXPLOSIVE HIGH-CTR: Execute this like a viral thumbnail designer who has studied 10,000 top-performing YouTube videos. Hyper-saturated color grading — blacks crushed to pure black, highlights almost blown out, every color pushed 40% beyond natural saturation. Intense rim lights wrapping subjects from behind — color derived from content thematic palette (Layer 2.5): action/drama/intensity → blazing orange-red rims; tech/digital → electric blue-white; money/power → blinding golden-white; mystery/tension → deep crimson-purple. Skin treatment: retouched to cartoonish sharpness while remaining humanly recognizable — zero pores visible, every feature slightly exaggerated. Background elements: flat with punchy graphic quality. The image must feel like it has an internal light source radiating energy outward. Micro-contrast cranked to absolute maximum on every edge.',
  },
  {
    id: 'cyberpunk',
    label: 'Neon Future',
    subtitle: 'Sci-Fi',
    emoji: '🌆',
    keywords: 'Cyberpunk cinematic masterwork, dual neon color splits, deep midnight blue shadows, futuristic chrome and glass textures, holographic volumetric glow, synthwave atmosphere, rain-slicked surfaces, moody neon-noir.',
    lighting: 'VISUAL STYLE — NEON FUTURE SCI-FI: Execute this as a concept artist for a AAA sci-fi film production. Dual neon color split lighting: cyan from camera-left, magenta from camera-right, creating dramatic colored shadow geometry on every surface. Deep midnight blue fills all ambient areas. Holographic glow emanates from surfaces as if screens or energy sources are nearby — volumetric light beams cut through atmospheric haze. All surfaces: metallic, wet, rain-slicked, or chrome that catches and reflects the neon sources. Raindrops or fog particles caught in the light beams. APPLY THIS STYLE ONLY when the content involves technology, AI, digital products, sci-fi, or futuristic themes — it must be coherent with Layer 2.5 content palette.',
  },
  {
    id: 'minimal',
    label: 'Meta Ads Bold',
    subtitle: 'Impacto Limpio',
    emoji: '◼️',
    keywords: 'Swiss graphic design mastery, bold commercial photography, single-color bold background, geometric negative space, precision drop shadows, clinical sharpness, zero decorative noise, advertising campaign quality.',
    lighting: 'VISUAL STYLE — META ADS BOLD MINIMALISM: Execute this as a senior art director at a top-tier advertising agency. The power is in radical simplicity and negative space. Flat even product-photography lighting — no dramatic shadows, no atmospheric effects, no distractions. Single bold solid-color background: derive the most impactful and content-appropriate color from Layer 2.5 (NOT a generic default — choose based on the video theme). Subjects are ultra-sharp with clean hard-edged drop shadows creating graphic separation. Zero noise, zero texture, zero decorative elements. The composition breathes — generous negative space around the subject makes it feel confident and premium. Every element must have a reason to exist. If in doubt: remove it. The result should feel like a $100,000 advertising campaign.',
  },
  {
    id: 'cinematic',
    label: 'Epic Movie',
    subtitle: 'Hollywood',
    emoji: '🎬',
    keywords: 'Hollywood A-list movie poster craft, anamorphic lens flares, dramatic cinematic shadows, rich film color grade matched to emotional content, 35mm film grain texture, golden ratio composition, epic atmospheric depth.',
    lighting: 'VISUAL STYLE — EPIC HOLLYWOOD CINEMATIC: Execute this as a cinematographer and poster designer for a $200M Hollywood production. Every lighting and color decision must serve the emotional content from Layer 2.5 and Layer 3. Lighting matched to content emotional temperature: action/drama/intensity → extreme high-contrast side or under-lighting with deep actor shadows; historical/power → warm golden-hour side light casting long dramatic shadows; mystery/revelation → single harsh overhead or side spotlight, everything else swallowed by near-black. Anamorphic horizontal lens flares in the thematic accent color — subtle, elegant, not cartoonish. Color grade: derive from content mood — tension/triumph → teal shadows with warm-orange highlights; mystery/revelation → desaturated cold teal; wealth/power → rich warm golden tones with lifted shadows. 35mm film grain overlay at 15% — it feels shot on film, not rendered by AI. Epic atmospheric backdrop with atmospheric perspective depth. The result should look like a real movie poster.',
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
  let isGenerating = false;           // true only during batch "Generate All" / "Sintetizar"
  let generatingAnglesSet = new Set(); // per-angle index: allows concurrent individual generation
  let expandingVariantsSet = new Set(); // per-variant id: allows concurrent expansion
  let batchAngleSelection = null; // null = all selected; array of indices = specific selection
  let faceEnabled = null;         // null = follow DNA match default; true/false = explicit user choice
  let selectedExpressionId = null; // persists face select across renders
  let textMode = 'none';           // 'none' | 'ai' — persists text mode across renders
  let anglesPage = 0;              // pagination for step 5 angle cards
  let variantsPage = 0;            // pagination for history section

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
        textMode = 'none';
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
    return { project, style, formats, useFace, selectedFace, textMode };
  }

  async function generateSingleAngle(angleIndex, overrideTextMode = null) {
    const effectiveTextMode = overrideTextMode !== null ? overrideTextMode : textMode;
    let ctx = getGenContext();

    // Fallback for Regenerar: if no UI context (user hasn't gone through the workflow
    // this session), reconstruct style/format from the existing variant's saved metadata.
    // textMode always comes from the current UI toggle — that's the whole point of Regenerar.
    if (!ctx) {
      const project = getProject();
      if (!project) return;
      const angle = (project.logic_dna?.selected_angles || [])[angleIndex];
      if (!angle) return;

      const existing = (project.thumbnail_variants || [])
        .filter(v => v.ai_metadata?.angle_name === angle.name && !v.ai_metadata?.parent_id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      if (!existing?.ai_metadata) {
        toast('Seleccioná estilo y formato antes de generar.', 'error');
        return;
      }

      const savedStyle = STYLES.find(s => s.label === existing.ai_metadata.style);
      const formatLabels = (existing.ai_metadata.format || '').split(' + ').map(s => s.trim()).filter(Boolean);
      const savedFormats = formatLabels.map(lbl => FORMATS.find(f => f.label === lbl)).filter(Boolean);

      if (!savedStyle || savedFormats.length === 0) {
        toast('Seleccioná estilo y formato antes de generar.', 'error');
        return;
      }

      const faceImageUrl = existing.ai_metadata.face_image_url || null;
      const useFace = !!faceImageUrl;
      const selectedFace = faceList.find(f => f.image_url === faceImageUrl) || null;

      ctx = { project, style: savedStyle, formats: savedFormats, useFace, selectedFace, textMode: effectiveTextMode };
    }

    const { project, style, formats, useFace, selectedFace } = ctx;
    const tMode = effectiveTextMode; // always use the explicitly captured mode
    const angle = (project.logic_dna?.selected_angles || [])[angleIndex];
    if (!angle) return;
    const imagePrompt = buildMasterPrompt({ project, angle, style, formats, selectedFace, useFace, brandKit, textMode: tMode });
    await generateAndSaveVariant({ project, angle, style, formats, imagePrompt, textMode: tMode, faceImageUrl: useFace ? (selectedFace?.image_url || null) : null });
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
      const isGen = latest?.ai_metadata?.generating || generatingAnglesSet.has(globalIdx);
      const hasImg = !!latest?.image_url;
      const hasError = !!latest?.ai_metadata?.error;
      const safeTitle = project.title.slice(0, 20).replace(/\s+/g, '-');
      const isExpanding = expandingVariantsSet.has(latest?.id);

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
                     <button class="btn btn-secondary btn-xs btn-generate-angle" data-angle-index="${globalIdx}" ${generatingAnglesSet.has(globalIdx) ? 'disabled' : ''} style="font-size:10px;">${icon('rocket', 10)} Regenerar</button>
                     ${!isExpanding ? `
                     <div style="display:flex;align-items:center;gap:4px;margin-left:auto;">
                       <select class="form-select" id="expand-count-${latest.id}" style="font-size:10px;padding:2px 4px;height:26px;width:60px;">
                         ${[1,2,3,4,5,6,7,8].map(n=>`<option value="${n}"${n===1?' selected':''}>${n}x</option>`).join('')}
                       </select>
                       <button class="btn btn-primary btn-xs btn-expand-variant" data-variant-id="${latest.id}" ${expandingVariantsSet.has(latest.id)?'disabled':''} style="white-space:nowrap;">${icon('plus',10)} Variación</button>
                     </div>` : `<span class="text-xs text-accent animate-pulse" style="margin-left:auto;">${icon('clock',10)} Variando...</span>`}`
                  : hasError
                    ? `<span class="text-xs" style="color:var(--danger);">${icon('alertTriangle', 11)} Error</span>
                       <button class="btn btn-primary btn-xs btn-generate-angle" data-angle-index="${globalIdx}" ${generatingAnglesSet.has(globalIdx) ? 'disabled' : ''}>Reintentar</button>`
                    : `<button class="btn btn-primary btn-sm btn-generate-angle" data-angle-index="${globalIdx}" ${isGenerating || generatingAnglesSet.has(globalIdx) ? 'disabled' : ''} style="font-weight:700;">${icon('rocket', 13)} Generar miniatura</button>`
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
              ${c.image_url
                ? `<img src="${c.image_url}" class="thumb-preview-trigger" data-preview="${c.image_url}" style="width:100%;height:100%;object-fit:cover;cursor:zoom-in;" />`
                : c.ai_metadata?.generating
                  ? `${thumbLoaderHTML('', '')}
                     <button class="btn-cancel-variant" data-variant-id="${c.id}" title="Cancelar" style="position:absolute;bottom:6px;left:50%;transform:translateX(-50%);background:rgba(220,38,38,0.9);border:none;border-radius:3px;padding:2px 8px;cursor:pointer;color:white;font-size:9px;font-weight:700;z-index:20;white-space:nowrap;display:flex;align-items:center;gap:3px;">${icon('x',8)} Cancelar</button>`
                  : `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:4px;padding:8px;text-align:center;">
                       <div style="color:var(--danger);font-size:9px;opacity:0.7;">${icon('alertTriangle',12)}</div>
                       <div style="color:var(--text-tertiary);font-size:8px;">Error</div>
                     </div>`
              }
              ${!c.ai_metadata?.generating ? `<button class="btn-delete-variant" data-variant-id="${c.id}" title="Eliminar" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);border:none;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:white;font-size:10px;">${icon('trash',9)}</button>` : ''}
              ${c.image_url ? `<button class="btn-download" data-src="${c.image_url}" data-name="var-${letters[globalIdx]}-${ci+1}.png" style="position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,0.6);border:none;border-radius:var(--radius-sm);padding:2px 6px;cursor:pointer;color:white;font-size:9px;display:flex;align-items:center;gap:3px;">${icon('download',9)}</button>` : ''}
            </div>`).join('')}
          </div>
        </div>` : ''}
      </div>`;
    };

    return `
    <div>
      <!-- Header: text mode toggle + Generar Todas -->
      <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 18px;margin-bottom:var(--space-lg);">
        <div style="font-size:10px;font-weight:700;color:var(--text-tertiary);letter-spacing:0.8px;text-transform:uppercase;margin-bottom:12px;">✍️ ¿Tu miniatura lleva texto?</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
          <div id="text-opt-none" style="cursor:pointer;padding:14px 12px;border-radius:var(--radius-md);border:2px solid ${textMode === 'none' ? 'var(--accent)' : 'var(--border)'};background:${textMode === 'none' ? 'rgba(220,38,38,0.06)' : 'var(--bg-tertiary)'};transition:all 0.15s;text-align:center;">
            <div style="font-size:22px;margin-bottom:6px;">🚫</div>
            <div class="font-bold" style="font-size:12px;margin-bottom:3px;color:${textMode === 'none' ? 'var(--text-primary)' : 'var(--text-secondary)'};">SIN TEXTO</div>
            <div style="font-size:10px;color:var(--text-muted);line-height:1.4;">Solo imagen, sin palabras</div>
            ${textMode === 'none' ? `<div style="margin-top:8px;font-size:9px;padding:2px 10px;border-radius:20px;background:var(--accent);color:white;display:inline-block;font-weight:700;">SELECCIONADO</div>` : ''}
          </div>
          <div id="text-opt-ai" style="cursor:pointer;padding:14px 12px;border-radius:var(--radius-md);border:2px solid ${textMode === 'ai' ? 'rgba(99,102,241,0.6)' : 'var(--border)'};background:${textMode === 'ai' ? 'rgba(99,102,241,0.06)' : 'var(--bg-tertiary)'};transition:all 0.15s;text-align:center;">
            <div style="font-size:22px;margin-bottom:6px;">✍️</div>
            <div class="font-bold" style="font-size:12px;margin-bottom:3px;color:${textMode === 'ai' ? '#818cf8' : 'var(--text-secondary)'};">CON TEXTO</div>
            <div style="font-size:10px;color:var(--text-muted);line-height:1.4;">La IA elige la fuente,<br/>la ubicación, el estilo y el color</div>
            ${textMode === 'ai' ? `<div style="margin-top:8px;font-size:9px;padding:2px 10px;border-radius:20px;background:rgba(99,102,241,0.7);color:white;display:inline-block;font-weight:700;">SELECCIONADO</div>` : ''}
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;">
          <button id="btn-generate-all" class="btn btn-primary" ${isGenerating ? 'disabled' : ''}
            style="background:linear-gradient(135deg,var(--accent),#9333ea);font-weight:800;white-space:nowrap;">
            ${isGenerating
              ? `<span class="animate-pulse">${icon('clock',14)}</span> Generando...`
              : `${icon('rocket',14)} Generar Todas`}
          </button>
        </div>
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
    const isExpanding = expandingVariantsSet.has(latest.id);
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
                     <button class="btn btn-primary btn-xs btn-expand-variant" data-variant-id="${latest.id}" ${expandingVariantsSet.has(latest.id)?'disabled':''} style="white-space:nowrap;">${icon('plus',10)} Variación</button>
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
            const isStuck = c.ai_metadata?.generating && !c.image_url;
            return `
            <div style="flex-shrink:0;width:140px;border-radius:var(--radius-md);overflow:hidden;position:relative;aspect-ratio:16/9;background:var(--bg-tertiary);${isOld?'opacity:0.7;':''}">
              ${c.image_url
                ? `<img src="${c.image_url}" class="thumb-preview-trigger" data-preview="${c.image_url}" style="width:100%;height:100%;object-fit:cover;cursor:zoom-in;" />`
                : isStuck
                  ? `${thumbLoaderHTML('', '')}
                     <button class="btn-cancel-variant" data-variant-id="${c.id}" title="Cancelar generación" style="position:absolute;bottom:6px;left:50%;transform:translateX(-50%);background:rgba(220,38,38,0.9);border:none;border-radius:3px;padding:2px 8px;cursor:pointer;color:white;font-size:9px;font-weight:700;z-index:20;white-space:nowrap;display:flex;align-items:center;gap:3px;">${icon('x',8)} Cancelar</button>`
                  : `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:4px;padding:8px;text-align:center;">
                       <div style="color:var(--danger);opacity:0.7;">${icon('alertTriangle',12)}</div>
                       <div style="color:var(--text-tertiary);font-size:8px;">Error</div>
                     </div>`
              }
              ${isOld ? `<div style="position:absolute;top:4px;left:4px;background:rgba(0,0,0,0.7);border-radius:3px;padding:1px 5px;font-size:9px;color:rgba(255,255,255,0.7);">anterior</div>` : ''}
              ${!isStuck ? `<button class="btn-delete-variant" data-variant-id="${c.id}" title="Eliminar" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);border:none;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:white;">${icon('trash',9)}</button>` : ''}
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

    // ── History section: cancel stuck variant ──
    document.querySelectorAll('#variants-history-section .btn-cancel-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await cancelStuckVariant(btn.dataset.variantId);
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
        const variantId = btn.dataset.variantId;
        if (expandingVariantsSet.has(variantId)) return;
        const countSelect = document.getElementById(`expand-count-${variantId}`);
        const count = Math.min(parseInt(countSelect?.value || '1'), 8);
        const project = getProject();
        if (!project) return;
        const baseVariant = (project.thumbnail_variants || []).find(v => v.id === variantId);
        if (!baseVariant) return;
        expandingVariantsSet.add(variantId);
        render();
        try {
          for (let i = 0; i < count; i++) {
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
            await reloadProjects();
            render(); // muestra spinner inline en la card recién insertada

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
          console.error('Expand error:', err);
          toast('Error al generar variaciones: ' + err.message, 'error');
        } finally {
          expandingVariantsSet.delete(variantId);
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

    // ── Cancel stuck variant (spinner cards) ──
    container.querySelectorAll('.btn-cancel-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await cancelStuckVariant(btn.dataset.variantId);
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
          const imagePrompt = buildMasterPrompt({ project, angle, style, formats, selectedFace, useFace, brandKit, textMode });
          await generateAndSaveVariant({ project, angle, style, formats, imagePrompt, textMode, faceImageUrl: useFace ? (selectedFace?.image_url || null) : null });
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
        const variantId = btn.dataset.variantId;
        if (expandingVariantsSet.has(variantId)) return;

        const countSelect = document.getElementById(`expand-count-${variantId}`);
        const count = Math.min(parseInt(countSelect?.value || '1'), 5);
        const project = getProject();
        if (!project) return;

        const allVariants = project.thumbnail_variants || [];
        const baseVariant = allVariants.find(v => v.id === variantId);
        if (!baseVariant) return;

        expandingVariantsSet.add(variantId);
        rerenderStep();

        try {
          for (let i = 0; i < count; i++) {
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
            await reloadProjects();
            rerenderStep(); // muestra spinner inline en la card recién insertada

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
          console.error('Expand error:', err);
          toast('Error al generar variaciones: ' + err.message, 'error');
        } finally {
          expandingVariantsSet.delete(variantId);
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

    // ── Text mode toggle (step 5) ──
    document.getElementById('text-opt-none')?.addEventListener('click', () => {
      textMode = 'none';
      rerenderStep();
    });
    document.getElementById('text-opt-ai')?.addEventListener('click', () => {
      textMode = 'ai';
      rerenderStep();
    });

    // ── Face expression card selection (step 4) ──
    container.querySelectorAll('.face-opt-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedExpressionId = card.dataset.faceId;
        rerenderStep();
      });
    });


    // ── Angle pagination (step 5) ──
    container.querySelectorAll('.angles-page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        anglesPage = parseInt(btn.dataset.page);
        rerenderStep();
      });
    });

    // ── Per-card generate (step 5) — concurrent per angle ──
    container.querySelectorAll('.btn-generate-angle').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (isGenerating) return; // batch en progreso: esperar
        const angleIdx = parseInt(btn.dataset.angleIndex);
        if (generatingAnglesSet.has(angleIdx)) return; // este ángulo ya genera
        // Capture textMode NOW — before rerenderStep() touches the DOM
        const capturedTextMode = textMode;
        generatingAnglesSet.add(angleIdx);
        rerenderStep(); // muestra spinner inline en la card
        try {
          await generateSingleAngle(angleIdx, capturedTextMode);
        } catch (err) {
          toast('Error al generar: ' + err.message, 'error');
        } finally {
          generatingAnglesSet.delete(angleIdx);
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
          generatingAnglesSet.add(angleIdx);
          await generateSingleAngle(angleIdx);
          await reloadProjects();
          generatingAnglesSet.delete(angleIdx);
        }
        hideLoader();
        toast(`✅ ${pending.length} miniatura${pending.length!==1?'s':''} generada${pending.length!==1?'s':''}`, 'success', 4000);
      } catch (err) {
        hideLoader();
        toast('Error al generar: ' + err.message, 'error');
      } finally {
        generatingAnglesSet.clear();
        isGenerating = false;
        await reloadProjects();
        render();
      }
    });

    // ── Step-content expand-variant (step 5 cards) ──
    container.querySelectorAll('#step-content .btn-expand-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const variantId = btn.dataset.variantId;
        if (expandingVariantsSet.has(variantId)) return;
        const countSelect = document.getElementById(`expand-count-${variantId}`);
        const count = Math.min(parseInt(countSelect?.value || '1'), 8);
        const project = getProject();
        if (!project) return;
        const baseVariant = (project.thumbnail_variants || []).find(v => v.id === variantId);
        if (!baseVariant) return;
        expandingVariantsSet.add(variantId);
        rerenderStep();
        try {
          for (let i = 0; i < count; i++) {
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
            await reloadProjects();
            rerenderStep(); // muestra spinner inline en la card recién insertada
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
            } catch (imgErr) {
              await supabase.from('thumbnail_variants').update({ ai_metadata: { ...inserted.ai_metadata, generating: false, error: imgErr.message } }).eq('id', inserted.id);
            }
          }
          toast(`✅ ${count} variación${count!==1?'es':''} generada${count!==1?'s':''}`, 'success', 3000);
        } catch (err) {
          toast('Error al variar: ' + err.message, 'error');
        } finally {
          expandingVariantsSet.delete(variantId);
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
    container.querySelectorAll('#step-content .btn-cancel-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await cancelStuckVariant(btn.dataset.variantId);
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

  // ── Helper: build a clean IMAGE_SAFETY fallback prompt ────────────────────
  // Preserves thematic relevance (hero, hook, angle) without the heavy FORMAT
  // language that triggers the safety filter. Called before generateImage so
  // the retried generation is still coherent with the video.
  function buildSafetyFallbackPrompt(angle, project, style) {
    const vb = project?.logic_dna?.visual_briefing || {};
    const heroObject = vb.hero_object || '';
    const centralConflict = vb.central_conflict || '';
    const hook = project.logic_dna?.hook || '';
    const tension = project.logic_dna?.tension || '';
    const promise = project.logic_dna?.promise || '';
    const psychAngle = angle.psychology || angle.psychology_text || '';

    const lines = [
      `Create a visually striking YouTube thumbnail in 16:9 format.`,
      style?.lighting ? `Visual rendering style: ${style.lighting}` : '',
      heroObject ? `Central element (must dominate the composition): ${heroObject}` : '',
      centralConflict ? `Visual drama to portray: ${centralConflict}` : '',
      hook ? `Hook concept: ${hook}` : '',
      tension ? `Core tension: ${tension}` : '',
      promise ? `Promise: ${promise}` : '',
      `Psychological angle: "${angle.name}"${psychAngle ? ` — ${psychAngle.slice(0, 120)}` : ''}.`,
      `Requirements: High-impact composition. Professional cinematic lighting. Vibrant colors. Ultra-sharp. No text, letters, or words anywhere in the image.`,
    ];
    return lines.filter(Boolean).join('\n');
  }

  // ── Helper: build master prompt (DNA Chain — Fusión de Capas) ──────────────
  // Slot order: [ESTILO_VISUAL] + [FORMATO_CREATIVO] + [OBJETO_HEROE] + [VISUAL_TWIST] + [ADN_MARCA]
  function buildMasterPrompt({ project, angle, style, formats, selectedFace, useFace, brandKit, textMode = 'none' }) {
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

    // === LAYER 2.5: THEMATIC COLOR PALETTE (content-adaptive, competition-aware) ===
    const colorPaletteLayer = [
      'Derive the dominant color palette EXCLUSIVELY from the video\'s content themes described in Layer 3 — NOT from format or style aesthetic defaults. Apply the matching color family:',
      '• ACTION / VIOLENCE / EXPLOSIONS / WAR / CRIME / NARCO / DRUGS → burning reds, deep charcoal-black, molten oranges, hellfire yellows — raw danger palette',
      '• TECHNOLOGY / AI / DIGITAL / SOFTWARE / APPS / CHATGPT / ROBOTS / INTERNET → electric blue, cyan, cool white-grey, vibrant purple — precision tech palette',
      '• MYSTERY / SECRETS / CONSPIRACY / HIDDEN TRUTH / INVESTIGATION → deep purples, near-black, blood red accents, harsh single spotlight white',
      '• MONEY / POWER / LUXURY / WEALTH / BUSINESS / FINANCE → golds, deep navy, champagne tones, emerald green — prestige palette',
      '• SPORT / COMPETITION / PHYSICAL ENERGY / TRAINING → electric yellow, vivid green, intense royal blue — kinetic saturated palette',
      '• SURVIVAL / NATURE / ADVENTURE / OUTDOOR → military green, raw earth clay, storm grey, burnt copper',
      '• HISTORY / RELIGION / PHILOSOPHY / POLITICS → deep crimson, aged gold, midnight blue, parchment white',
      'RULE: For VERSUS/SPLIT format — the dividing energy line MUST use the thematic accent color above, never default to neon cyan/purple.',
      'RULE: NEVER apply neon/cyberpunk/electric-blue tones unless the video content is explicitly about technology, AI, or digital products.',
      palette ? `Brand palette anchors (use as secondary accents): ${palette}` : '',
      avoidColors ? `COMPETITOR DIFFERENTIATION — AVOID these as dominant tones (already saturating the market in this niche): ${avoidColors}` : '',
      crowdPattern ? `Do NOT replicate this saturated competitor visual pattern: "${crowdPattern}"` : '',
      'OBJECTIVE: Stand out in the YouTube feed. Be visually distinct from competitors while staying 100% true to the video\'s theme and emotions.',
    ].filter(Boolean).join('\n');

    // === SLOT 6: FACE INTEGRATION ===
    // When a face image is attached to the request, instruct the model to USE that real person.
    // Never describe facial traits as text — the model must anchor to the actual photo.
    const faceLayer = useFace && selectedFace
      ? `CREATOR FACE (mandatory): The reference photo of the real creator is attached to this request as an image. You MUST use that exact real person's face — do NOT generate a fictional or AI-invented face. Preserve 100% of their real identity: bone structure, eyes, nose, mouth, hair, skin tone, piercing or any distinctive features. Required expression: ${requiredEmotion || selectedFace.expression_type} — make it hyper-expressive and over-the-top cinematic, but the face must unmistakably be the same real person from the reference photo.`
      : 'NO people or faces. Focus entirely on objects, environments, and graphic elements.';

    return `━━━ ROLE & MISSION ━━━
You are the world's best YouTube thumbnail graphic designer — a creative director with 15+ years of experience studying viral content across every niche: crime, tech, finance, sports, entertainment, history, lifestyle. You have analyzed over 50,000 high-performing thumbnails and understand exactly what makes a human stop mid-scroll and click. You think in terms of visual hierarchy, emotional triggers, color psychology, negative space, and compositional tension. Your thumbnails consistently achieve CTR above 15%. You NEVER produce generic or predictable compositions. You invent unexpected, surprising, and visually stunning executions while staying completely true to the video's content and emotional DNA.

Your task: generate the single most visually impactful, click-worthy YouTube thumbnail possible for this specific video — 16:9 aspect ratio, maximum CTR optimized. Surprise the viewer. Make it impossible to ignore.

━━━ LAYER 1: VISUAL STYLE & RENDERING ━━━
${styleLayer}

━━━ LAYER 2: COMPOSITION FORMAT (physical layout) ━━━
${formatLayer}

━━━ LAYER 2.5: THEMATIC COLOR PALETTE — CONTENT-ADAPTIVE ━━━
${colorPaletteLayer}

━━━ LAYER 3: HERO OBJECT & SCRIPT DNA ━━━
${heroLayer}

━━━ LAYER 4: VISUAL TWIST — ANGLE "${angle.name.toUpperCase()}" ━━━
${twistLayer}

━━━ LAYER 5: BRAND ADN & MARKET CONTRAST ━━━
${adnLayer}

━━━ LAYER 6: CREATOR FACE ━━━
${faceLayer}

FINAL REQUIREMENTS: Ultra-sharp. Maximum visual punch. Vibrant. Palette faithful to the video's content. Visually distinct from competitors.

${textMode === 'ai' ? `━━━ LAYER 7: TIPOGRAFIA Y TEXTO — OVERLAY TECHNIQUE ━━━
⚠️ MANDATORY TEXT REQUIREMENT — NON-NEGOTIABLE: This thumbnail MUST contain physically rendered, clearly readable text. Text generation is OBLIGATORY. An image without visible text is a failed generation. You MUST render at least 1 word. There are NO exceptions. Even if the composition seems full, text MUST be present somewhere in the frame.

You are a senior YouTube thumbnail creative director with 15+ years of experience studying viral content psychology. You have analyzed over 50,000 high-performing thumbnails and understand exactly which words stop a human mid-scroll. Typography is a surgical tool — one perfectly chosen word doubles CTR; five mediocre words destroy the image.

TECHNIQUE: OVERLAY — text is rendered in the highest visual plane, ON TOP of all scene elements. The text sits above the hero object, above backgrounds, above all graphic elements. It is the last layer rendered.

━━ ANTI-HALLUCINATION PROTOCOL — NON-NEGOTIABLE ━━
BEFORE designing anything: commit to your exact words. Spell each word letter by letter internally. COUNT the letters. Only then render.
PROHIBITED text structures — these ALWAYS cause hallucination, NEVER use them:
✗ Numbered lists (1. 2. 3.)
✗ Bullet point lists
✗ Sentences or phrases longer than 3 words
✗ Document panels, evidence boards, info boxes, label systems
✗ Any element requiring more than one line of body text
✗ Arrows pointing to labeled elements
✗ Multi-line structured text of any kind
RULE: If a composition format (from Layer 2) naturally implies a document or list with text content, that document/list must be rendered as a GRAPHIC ELEMENT with no readable characters — solid color bands, abstract shapes, redaction bars — NEVER actual words inside it.
SIMPLICITY IS ACCURACY: a 4-letter common word rendered perfectly beats a 10-letter invented word. When uncertain between two options, always choose the shorter, simpler, more common word. A single word rendered with absolute precision is a stronger creative decision than two words with any rendering doubt.

━━ WORD SELECTION — SENIOR CREATIVE JUDGMENT ━━
Select 1 primary word (mandatory) and optionally 1 secondary word (only if it adds unique emotional information the primary does not cover). Maximum 2 words total across ALL text elements.
Source material: the video's hook, tension, promise, and the psychological angle from Layers 3 and 4.
Apply the correct psychological trigger for this specific content:
• SHOCK / DISSONANCE: A word that creates instant cognitive conflict — something unexpected, impossible, or contradictory to what the viewer assumed. (ex: "NUNCA", "IMPOSIBLE", "TODO")
• CURIOSITY GAP: A word that implies there is hidden information the viewer does not yet have — they must click to complete the picture. (ex: "SECRETO", "FILTRADO", "REAL", "OCULTO")
• URGENCY / DANGER: A word that signals something critical is happening right now, creating FOMO or threat response. (ex: "ALERTA", "AHORA", "ULTIMO")
• IDENTITY CHALLENGE: A word that speaks directly to the viewer's self-concept, making them feel personally called out. (ex: "VOS", "TODOS", "NADIE", "YO")
• VALIDATION / REVELATION: A word that confirms something the viewer suspected but never saw confirmed. (ex: "CONFIRMADO", "EXPUESTO", "VERDAD")
The word MUST be thematically coherent with the psychological angle of this specific variant (Layer 4). Use the video's original language — match the language of the hook/title/tension.

━━ PLACEMENT — OVERLAY RULES ━━
Text goes ON TOP of the scene. These rules are absolute:
1. FACE PROTECTION: If the composition contains a human face, text must NEVER cover the eyes or mouth. Eyes and mouth are the #1 CTR emotional triggers — covering them kills the click. Place text above the face, below the chin, or in lateral space.
2. HERO PROTECTION: Primary text must not completely obscure the hero object or face — it can overlap edges but the subject must remain clearly readable as a visual.
3. NATURAL NEGATIVE SPACE: Identify the area of the composition with the least visual information (often upper corners, lower band, or lateral margins) and anchor the primary text there.
4. SIZE: Primary text must be large enough to read at 120x68px (mobile thumbnail size). It must be the largest typographic element.
5. HIERARCHY: If using a secondary word — it must be visually subordinate (smaller size, lower contrast, or different weight) to the primary.

━━ TYPOGRAPHIC TREATMENT — MATCH CONTENT THEME ━━
Select font style and rendering coherent with the content theme from Layer 2.5:
CRIMEN/PELIGRO/ACCION/DRAMA: Ultra-bold slab serif, distressed grunge texture, charcoal-black or blood red, aggressive forward italic. Feel: stamped on metal, scraped into concrete, worn stencil.
TECNOLOGIA/IA/DIGITAL/SOFTWARE: Clean geometric sans-serif, holographic shimmer or electric glow edges, cyan or white on dark. Feel: projected hologram, LED screen, neon sign.
DINERO/PODER/LUJO/NEGOCIOS: Gold or chrome 3D metallic extrusion, wide-tracking all-caps, deep drop shadows. Feel: engraved in marble, stamped in gold foil, embossed leather.
MISTERIO/SECRETOS/CONSPIRACION: Worn red stamp stencil, classified document typewriter font, burned or torn edges. Feel: stamped on a classified file — single word only, maximum impact.
DEPORTE/ENERGIA/COMPETICION: Ultra-compressed italic slab, explosive 3D chrome, motion blur trailing edges. Feel: blazing through the air, forged in fire.
HISTORIA/POLITICA/RELIGION: Aged serif, gold emboss or stone carving effect, dramatic patina. Feel: carved in stone, ancient inscription.
SUPERVIVENCIA/AVENTURA/NATURALEZA: Military stencil, raw brushstroke paint, earth tones. Feel: painted on rock, burned into wood.

━━ RENDERING TECHNIQUE ━━
Text must appear physically embedded in the visual world — 3D extrusion, neon glow, painted surface, spray paint, stamped ink, hologram overlay, etched material. NOT a flat digital sticker. Letterforms must respect the thumbnail's lighting (cast shadows, receive light from the key light source) and color palette (Layer 2.5). Perfect kerning. Zero merged characters. Zero overlapping glyphs. Zero letter bleed. Every character must be individually distinct and perfectly legible.

⚠️ FINAL MANDATORY CHECK: Before finalizing the image, confirm that at least 1 clearly readable word is visible in the frame. If no text is present — you MUST add it now. Text is REQUIRED, not optional.` : `REGLA ABSOLUTA — CERO TEXTO EN LA IMAGEN: PROHIBIDO renderizar texto, palabras, letras, numeros o tipografia en cualquier parte de la imagen — ni en pantallas, senales, banners, barras, badges, carteles, ni en ningun otro lugar. Cualquier elemento de diseno que normalmente contendria texto debe mostrar UNICAMENTE color solido, formas geometricas, patrones visuales abstractos o iconos graficos — NUNCA caracteres legibles. El texto se aplica exclusivamente en post-produccion. VIOLAR ESTA REGLA ES EL ERROR #1 — EVITAR A TODA COSTA.`}

UNIVERSO VISUAL CERRADO — ANTI-ALUCINACION: Renderiza UNICAMENTE los elementos visuales explicitamente descritos en las capas anteriores. PROHIBIDO agregar elementos por asociacion cultural o de genero: no inventar logotipos, marcas, insignias, iconos no especificados, efectos de franquicia, pantallas con contenido, fondos de escenografia no mencionados, ni ningun elemento decorativo que no este descripto literalmente arriba. Si el estilo evoca un genero (noticiero, cine de accion, documental), renderiza SOLO la estetica visual del genero (iluminacion, color, composicion) — NO sus elementos de UI, marcos de programa, graficos de produccion ni branding inventado. Cada pixel debe justificarse en alguna de las capas anteriores.`;
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
    const variantTextMode = baseVariant.ai_metadata?.text_mode || 'none';

    const masterPrompt = buildMasterPrompt({ project, angle, style, formats: safeFormats, selectedFace, useFace, brandKit, textMode: variantTextMode });

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
  async function generateAndSaveVariant({ project, angle, style, formats, imagePrompt, textMode: tMode = 'none', faceImageUrl = null, parentId = null }) {
    const isRealAngleId = angle.id && !String(angle.id).startsWith('ai-');
    const { data: inserted, error: insertErr } = await supabase
      .from('thumbnail_variants')
      .insert({
        project_id: project.id,
        angle_id: isRealAngleId ? angle.id : null,
        overlay_text: null,
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
          text_mode: tMode,
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
      const safetyFallback = buildSafetyFallbackPrompt(angle, project, style);
      const dataUrl = await generateImage(imagePrompt, faceImageUrl, safetyFallback);
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

    // Auto-cleanup: mark stuck variants (generating=true, sin imagen, >5min) como error
    const STUCK_MS = 5 * 60 * 1000;
    const now = Date.now();
    const stuckIds = [];
    for (const project of projects) {
      for (const v of (project.thumbnail_variants || [])) {
        if (v.ai_metadata?.generating && !v.image_url &&
            (now - new Date(v.created_at).getTime()) > STUCK_MS) {
          stuckIds.push(v.id);
          v.ai_metadata = { ...v.ai_metadata, generating: false, error: 'Generación interrumpida — reintentá' };
        }
      }
    }
    if (stuckIds.length > 0) {
      for (const id of stuckIds) {
        const v = projects.flatMap(p => p.thumbnail_variants || []).find(x => x.id === id);
        await supabase.from('thumbnail_variants').update({ ai_metadata: v.ai_metadata }).eq('id', id);
      }
    }
  }

  async function cancelStuckVariant(variantId) {
    await supabase.from('thumbnail_variants').delete().eq('id', variantId);
    await reloadProjects();
    render();
  }

  render();
}
