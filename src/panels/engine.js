import { supabase } from '../lib/supabase.js';
import { getState } from '../lib/state.js';
import { icon } from '../icons.js';
import { callAI, generateImage } from '../lib/intelligence.js';

// ─── Creative Config ────────────────────────────────────────────────────────

const FORMATS = [
  {
    id: 'versus',
    label: 'Duelo de Titanes',
    subtitle: 'Versus',
    emoji: '⚔️',
    desc: 'Contraste visual extremo. Composición simétrica con una línea de luz divisoria vibrante.',
    prompt: 'COMPOSITION: Extreme contrast split-screen symmetry, aggressive 50/50 vertical division, electric glowing neon dividing line, dramatic face-to-face confrontation framing, wide angle, high action tension.',
  },
  {
    id: 'authority',
    label: 'Autoridad Tech',
    subtitle: 'Objeto de Deseo',
    emoji: '🖥️',
    desc: 'Foco en el objeto con profundidad de campo extrema. El creador proyecta liderazgo.',
    prompt: 'COMPOSITION: Macro focus on hero technology object in extreme foreground with shallow depth of field, creator in background with confident power pose, sharp professional studio lighting, anamorphic bokeh.',
  },
  {
    id: 'shock',
    label: 'Shock / Caja Negra',
    subtitle: 'Misterio',
    emoji: '🖤',
    desc: 'Psicología de la curiosidad. Elementos censurados y atmósfera de suspense cinematográfica.',
    prompt: 'COMPOSITION: Heavy curiosity-gap framing, key element redacted with high-contrast black bar, moody cinematic shadows, mysterious volumetric fog, extreme facial expression of shock and disbelief.',
  },
  {
    id: 'breaking',
    label: 'Alerta / Breaking News',
    subtitle: 'Urgencia Total',
    emoji: '🚨',
    desc: 'Estética de noticia de última hora. Colores de alerta y saturación máxima.',
    prompt: 'COMPOSITION: High-urgency broadcast aesthetic, heavy TV news chyron overlays, vibrant red and yellow warning color grading, high-speed shutter look, intense broadcast lighting, saturated punchy colors.',
  },
];

const STYLES = [
  {
    id: 'hyperrealist',
    label: 'Master Studio (UHD)',
    subtitle: '8K Realismo',
    emoji: '📸',
    keywords: 'Ultra-photorealistic, 8k resolution, raw photography style, intricate skin textures, volumetric studio lighting, professional color grading, extreme sharpness, masterwork.',
  },
  {
    id: 'mrbeast',
    label: 'Estilo Explosivo',
    subtitle: 'High CTR',
    emoji: '🔥',
    keywords: 'MrBeast aesthetic, extremely saturated vibrant colors, high micro-contrast, glowing rim lights, intense facial highlights, sharp cartoonish realism, super-punchy visual impact.',
  },
  {
    id: 'cyberpunk',
    label: 'Neon Future',
    subtitle: 'Sci-Fi',
    emoji: '🌆',
    keywords: 'Cyberpunk cinematic lighting, neon cyan and magenta accents, deep blue shadows, futuristic tech textures, holographic glow, synthwave color palette, moody atmosphere.',
  },
  {
    id: 'minimal',
    label: 'Meta Ads Bold',
    subtitle: 'Impacto Limpio',
    emoji: '◼️',
    keywords: 'Clean commercial photography, bold minimalist design, solid vibrant background, sharp drop shadows, focused subjects, Swiss design influence, negative space authority.',
  },
  {
    id: 'cinematic',
    label: 'Epic Movie',
    subtitle: 'Hollywood',
    emoji: '🎬',
    keywords: 'Cinematic film quality, Hollywood movie poster composition, anamorphic lens flares, dramatic shadows, highly saturated epic colors, 35mm film grain, golden ratio.',
  },
];

// ─── Main Panel ─────────────────────────────────────────────────────────────

export async function renderEngine(container) {
  const { activeChannelId } = getState();
  if (!activeChannelId) { container.innerHTML = '<div class="loading-spinner">Selecciona un canal</div>'; return; }

  container.innerHTML = `<div class="loading-spinner"><span class="animate-pulse">${icon('clock', 24)}</span></div>`;

  const [projectsRes, brandKitRes, facesRes] = await Promise.all([
    supabase.from('projects').select('*, thumbnail_variants(*)').eq('channel_id', activeChannelId).order('created_at', { ascending: false }),
    supabase.from('brand_kits').select('*').eq('channel_id', activeChannelId).maybeSingle(),
    supabase.from('face_vault').select('*').eq('channel_id', activeChannelId),
  ]);

  const projects = projectsRes.data || [];
  const brandKit = brandKitRes.data;
  const faceList = facesRes.data || [];

  // UI State
  let selectedProjectId = projects[0]?.id || null;
  let workflowStep = 1;          // 1, 2, 3
  let selectedFormats = [];      // array of format ids (multi-select)
  let selectedStyleId = null;
  let selectedAngleId = null;
  let isGenerating = false;
  let expandingVariantId = null; // variant being expanded with more variations

  function getProject() { return projects.find(p => p.id === selectedProjectId); }

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

    container.innerHTML = `<div class="animate-in">
      <div class="section-header">
        <div>
          <h2 class="section-title">${icon('cog', 22)} Fábrica Creativa</h2>
          <p class="section-subtitle">Construí tu miniatura maestra en 3 pasos</p>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:280px 1fr; gap:var(--space-lg);">

        <!-- ── LEFT: Project folders ── -->
        <div>
          <div class="text-xs font-bold text-muted mb-sm" style="letter-spacing:1px; text-transform:uppercase;">${icon('folder', 12)} Proyectos</div>
          ${projects.length === 0 ? `
            <div class="card" style="text-align:center; padding:var(--space-xl); opacity:0.6;">
              ${icon('brain', 32)}
              <p class="text-sm text-muted mt-sm">Sin proyectos aún.<br/>Procesá un guión en El Cerebro.</p>
            </div>
          ` : projects.map(p => {
      const pAngles = p.logic_dna?.selected_angles || [];
      const pVariants = p.thumbnail_variants || [];
      const isActive = p.id === selectedProjectId;
      return `
            <div class="card project-folder" data-project-id="${p.id}"
              style="cursor:pointer; margin-bottom:var(--space-sm); padding:var(--space-md); transition:all 0.15s;
                ${isActive ? 'border-color:var(--accent); background:rgba(220,38,38,0.05);' : ''}">
              <div class="flex items-center gap-sm mb-xs">
                <span style="color:${isActive ? 'var(--accent)' : 'var(--text-tertiary)'};">${icon('folder', 16)}</span>
                <div class="text-sm font-bold" style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${p.title}">${p.title}</div>
              </div>
              <div class="flex gap-xs" style="flex-wrap:wrap;">
                <span class="badge badge-neutral" style="font-size:9px;">${pAngles.length} ángulo${pAngles.length !== 1 ? 's' : ''}</span>
                <span class="badge ${pVariants.length > 0 ? 'badge-accent' : 'badge-neutral'}" style="font-size:9px;">${pVariants.length} miniatura${pVariants.length !== 1 ? 's' : ''}</span>
                <span class="badge badge-neutral" style="font-size:9px;">${new Date(p.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}</span>
              </div>
            </div>`;
    }).join('')}
        </div>

        <!-- ── RIGHT: Workflow ── -->
        <div>
          ${!project ? `
            <div class="card" style="text-align:center; padding:var(--space-2xl); opacity:0.5;">
              ${icon('folder', 48)}
              <p class="text-sm text-muted mt-md">Seleccioná un proyecto</p>
            </div>
          ` : renderWorkflow(project, selectedAngles, variants)}
        </div>

      </div>
    </div>`;

    bindEvents();
  }

  // ─── WORKFLOW ─────────────────────────────────────────────────────────────

  function renderWorkflow(project, selectedAngles, variants) {
    const canGoStep2 = selectedFormats.length > 0;
    const canGoStep3 = canGoStep2 && selectedStyleId;
    const canGenerate = canGoStep3 && selectedAngleId;

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
        { n: 3, label: 'Ángulo & Generar', ok: canGenerate },
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
        ? `<span class="animate-pulse">${icon('clock', 16)}</span> Generando Miniatura...`
        : `${icon('rocket', 16)} GENERAR MINIATURA MAESTRA`}
        </button>
      `}
    </div>
    `}

    <!-- Generated variants (shown below workflow if any) -->
    ${renderVariantsHistory(project, variants)}
    `;
  }

  // ─── STEP 1: Formato ──────────────────────────────────────────────────────

  function renderStep1() {
    return `
    <div>
      <div class="text-xs font-bold text-muted mb-md" style="letter-spacing:1px; text-transform:uppercase;">${icon('layout', 12)} Elegí el formato de composición (podés seleccionar varios)</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-md);">
        ${FORMATS.map(f => {
      const isSelected = selectedFormats.includes(f.id);
      return `
          <div class="card format-card" data-format-id="${f.id}" style="cursor:pointer; padding:var(--space-md); transition:all 0.15s; position:relative;
            ${isSelected ? 'border-color:var(--accent); background:rgba(220,38,38,0.07);' : ''}">
            <div style="position:absolute; top:10px; right:10px; width:20px; height:20px; border-radius:50%;
              border:2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'};
              background:${isSelected ? 'var(--accent)' : 'transparent'};
              display:flex; align-items:center; justify-content:center; color:white; font-size:11px;">
              ${isSelected ? icon('check', 10) : ''}
            </div>
            <div style="font-size:28px; margin-bottom:var(--space-sm);">${f.emoji}</div>
            <div class="font-bold" style="font-size:14px;">${f.label}</div>
            <div class="text-xs text-accent mb-xs">${f.subtitle}</div>
            <div class="text-xs text-muted" style="line-height:1.5;">${f.desc}</div>
          </div>`;
    }).join('')}
      </div>
      ${selectedFormats.length === 0 ? `<p class="text-xs text-muted mt-md" style="text-align:center; opacity:0.6;">Seleccioná al menos un formato para continuar</p>` : `
        <p class="text-xs text-accent mt-md" style="text-align:center;">${icon('check', 12)} ${selectedFormats.length} formato${selectedFormats.length > 1 ? 's' : ''} seleccionado${selectedFormats.length > 1 ? 's' : ''}</p>
      `}
    </div>`;
  }

  // ─── STEP 2: Estilo ───────────────────────────────────────────────────────

  function renderStep2() {
    return `
    <div>
      <div class="text-xs font-bold text-muted mb-md" style="letter-spacing:1px; text-transform:uppercase;">${icon('palette', 12)} Elegí el estilo visual</div>
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
            <div class="text-xs text-muted" style="line-height:1.5; font-style:italic;">"${s.keywords.split(',').slice(0, 3).join(', ')}..."</div>
          </div>`;
    }).join('')}
      </div>
      ${!selectedStyleId ? `<p class="text-xs text-muted mt-md" style="text-align:center; opacity:0.6;">Seleccioná un estilo visual para continuar</p>` : `
        <p class="text-xs text-accent mt-md" style="text-align:center;">${icon('check', 12)} Estilo: <strong>${STYLES.find(s => s.id === selectedStyleId)?.label}</strong></p>
      `}
    </div>`;
  }

  // ─── STEP 3: Ángulo + Generar ─────────────────────────────────────────────

  function renderStep3(project, selectedAngles, variants) {
    const selectedFaceId = document.getElementById?.('select-expression-step3')?.value || '';
    return `
    <div>
      <!-- Summary of selections -->
      <div class="card mb-md" style="background:var(--bg-tertiary); border:none; padding:var(--space-md);">
        <div class="text-xs font-bold text-muted mb-sm" style="letter-spacing:1px; text-transform:uppercase;">Resumen de tu configuración</div>
        <div class="flex gap-md" style="flex-wrap:wrap;">
          <div>
            <span class="text-xs text-muted">Formatos:</span>
            <div class="flex gap-xs mt-xs" style="flex-wrap:wrap;">
              ${selectedFormats.map(fid => {
      const f = FORMATS.find(x => x.id === fid);
      return `<span class="badge badge-neutral" style="font-size:9px;">${f?.emoji} ${f?.label}</span>`;
    }).join('')}
            </div>
          </div>
          <div>
            <span class="text-xs text-muted">Estilo:</span>
            <div class="mt-xs">
              ${(() => { const s = STYLES.find(x => x.id === selectedStyleId); return `<span class="badge badge-accent" style="font-size:9px;">${s?.emoji} ${s?.label}</span>`; })()}
            </div>
          </div>
        </div>
      </div>

      <!-- Text Suggestion Selector (NEW) -->
      <div class="card mb-md" style="background:var(--bg-tertiary); border: 1px solid var(--accent); padding:var(--space-md);">
        <label class="form-label">${icon('bolt', 12)} Texto Sugerido por IA</label>
        <div class="flex gap-xs mb-sm" style="flex-wrap:wrap;">
          ${(project.logic_dna?.text_suggestions || []).map(txt => `
            <button class="badge badge-accent btn-suggestion-text" style="cursor:pointer; border:none; font-size:10px; padding:6px 10px;" data-text="${txt}">
              ${txt}
            </button>
          `).join('')}
        </div>
        <div class="form-group mb-0">
          <input type="text" class="form-input" id="custom-overlay-text" placeholder="O escribe tu propio texto de impacto..." value="${project.title.toUpperCase()}" style="font-size:12px; font-weight:800; letter-spacing:1px;" />
        </div>
      </div>

      <!-- Face toggle & selector -->
      <div class="flex gap-md mb-md items-end" style="flex-wrap:wrap; background: var(--bg-tertiary); padding: var(--space-md); border-radius: var(--radius-md);">
        <div class="flex items-center gap-sm" style="min-width: 150px; margin-bottom: var(--space-xs);">
            <input type="checkbox" id="check-use-face" style="width:18px;height:18px;cursor:pointer;" checked />
            <label for="check-use-face" class="text-xs font-bold cursor-pointer">Usar mi rostro en la miniatura</label>
        </div>
        
        <div class="form-group" style="flex:1; min-width:180px; margin-bottom:0;">
          <label class="form-label">${icon('camera', 12)} Expresión Seleccionada</label>
          <select class="form-select" id="select-expression-step3" style="font-size:12px;">
            ${faceList.map(f => `<option value="${f.id}">${f.expression_type}</option>`).join('')}
            ${faceList.length === 0 ? '<option value="">Sin rostros en el Vault</option>' : ''}
          </select>
        </div>
      </div>

      <!-- Angle cards -->
      <div class="text-xs font-bold text-muted mb-sm" style="letter-spacing:1px; text-transform:uppercase;">${icon('crosshair', 12)} Seleccioná el Ángulo Psicológico</div>
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:var(--space-sm); margin-bottom:var(--space-md);">
        ${selectedAngles.map(a => {
      const isSelected = selectedAngleId === a.id;
      const angleVariants = variants.filter(v => v.angle_id === a.id);
      return `
          <div class="card angle-select-card" data-angle-id="${a.id}" style="cursor:pointer; padding:var(--space-md); transition:all 0.15s; position:relative;
            ${isSelected ? 'border-color:var(--accent); background:rgba(220,38,38,0.07);' : ''}">
            <div style="position:absolute; top:10px; right:10px; width:20px; height:20px; border-radius:50%;
              border:2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'};
              background:${isSelected ? 'var(--accent)' : 'transparent'};
              display:flex; align-items:center; justify-content:center; color:white; font-size:11px;">
              ${isSelected ? icon('check', 10) : ''}
            </div>
            <div style="color:var(--accent); margin-bottom:var(--space-xs);">${icon('crosshair', 18)}</div>
            <div class="font-bold" style="font-size:13px; padding-right:24px;">${a.name}</div>
            ${a.title ? `<div class="text-xs text-muted" style="font-style:italic; margin-top:2px;">"${a.title}"</div>` : ''}
            ${angleVariants.length > 0 ? `<div class="text-xs text-accent mt-sm">${icon('image', 10)} ${angleVariants.length} generada${angleVariants.length > 1 ? 's' : ''}</div>` : ''}
          </div>`;
    }).join('')}
      </div>

      ${!selectedAngleId ? `<p class="text-xs text-muted" style="text-align:center; opacity:0.6;">Seleccioná un ángulo para activar la generación</p>` : `
        <p class="text-xs text-accent" style="text-align:center;">${icon('check', 12)} Ángulo listo — podés generar tu miniatura maestra</p>
      `}
    </div>`;
  }

  // ─── Variants history ─────────────────────────────────────────────────────

  function renderVariantsHistory(project, variants) {
    if (variants.length === 0) return '';
    const generating = variants.filter(v => v.ai_metadata?.generating).length;
    // Group: master variants (no parent_id) first, then their children
    const masters = variants.filter(v => !v.ai_metadata?.parent_id);
    const children = variants.filter(v => !!v.ai_metadata?.parent_id);

    const renderCard = (v, i, isChild = false) => {
      const isGen = v.ai_metadata?.generating;
      const hasError = v.ai_metadata?.error;
      const isExpanding = expandingVariantId === v.id;
      const imgSrc = v.image_url || v.ai_metadata?.data_url || null;
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

    // Interleave masters with their children
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
    // Project folder
    container.querySelectorAll('.project-folder').forEach(el => {
      el.addEventListener('click', () => {
        if (selectedProjectId !== el.dataset.projectId) {
          selectedProjectId = el.dataset.projectId;
          workflowStep = 1;
          selectedFormats = [];
          selectedStyleId = null;
          selectedAngleId = null;
        }
        render();
      });
    });

    // Step tabs
    container.querySelectorAll('.step-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const n = parseInt(btn.dataset.step);
        if (!btn.disabled) { workflowStep = n; render(); }
      });
    });

    // Prev / Next
    document.getElementById('btn-prev-step')?.addEventListener('click', () => {
      if (workflowStep > 1) { workflowStep--; render(); }
    });
    document.getElementById('btn-next-step')?.addEventListener('click', () => {
      if (workflowStep < 3) { workflowStep++; render(); }
    });

    // Format cards (multi-select)
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

    // Style cards (single-select)
    container.querySelectorAll('.style-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedStyleId = selectedStyleId === card.dataset.styleId ? null : card.dataset.styleId;
        render();
      });
    });

    // Angle cards (single-select)
    container.querySelectorAll('.angle-select-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedAngleId = selectedAngleId === card.dataset.angleId ? null : card.dataset.angleId;
        render();
      });
    });

    // Delete variant buttons
    container.querySelectorAll('.btn-delete-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const variantId = btn.dataset.variantId;
        const project = getProject();
        if (!project) return;

        // Find variant to also delete from storage
        const variant = (project.thumbnail_variants || []).find(v => v.id === variantId);

        try {
          // Delete from storage if we have a URL
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
          alert('Error al eliminar: ' + err.message);
        }
      });
    });

    // Thumbnail image click → lightbox preview
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

    // Suggestion text buttons
    container.querySelectorAll('.btn-suggestion-text').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById('custom-overlay-text');
        if (input) input.value = btn.dataset.text.toUpperCase();
        container.querySelectorAll('.btn-suggestion-text').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Download buttons — direct PNG download
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
          // Fallback if fetch fails (e.g. data URL)
          const a = document.createElement('a');
          a.href = src;
          a.download = name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      });
    });

    // ── GENERATE MASTER (1 image) ──
    document.getElementById('btn-generate-master')?.addEventListener('click', async () => {
      const project = getProject();
      if (!project || !selectedAngleId || !selectedStyleId || selectedFormats.length === 0) return;

      const angle = (project.logic_dna?.selected_angles || []).find(a => a.id === selectedAngleId);
      const style = STYLES.find(s => s.id === selectedStyleId);
      const formats = selectedFormats.map(fid => FORMATS.find(f => f.id === fid)).filter(Boolean);

      const useFace = document.getElementById('check-use-face')?.checked;
      const expressionId = document.getElementById('select-expression-step3')?.value;
      const selectedFace = faceList.find(f => f.id === expressionId);

      const customText = document.getElementById('custom-overlay-text')?.value || project.title;

      isGenerating = true;
      render();

      try {
        const imagePrompt = buildMasterPrompt({ project, angle, style, formats, selectedFace, useFace, brandKit });
        await generateAndSaveVariant({ project, angle, style, formats, imagePrompt, overlayText: customText.toUpperCase() });
      } catch (err) {
        console.error('Generate error:', err);
        alert('Error al generar: ' + err.message);
      } finally {
        isGenerating = false;
        render();
      }
    });

    // ── EXPAND: generate N more variations from a base variant ──
    container.querySelectorAll('.btn-expand-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (expandingVariantId) return; // Prevent double-click

        const variantId = btn.dataset.variantId;
        const countSelect = document.getElementById(`expand-count-${variantId}`);
        const count = Math.min(parseInt(countSelect?.value || '1'), 5); // Cap at 5
        const project = getProject();
        if (!project) return;

        const allVariants = project.thumbnail_variants || [];
        const baseVariant = allVariants.find(v => v.id === variantId);
        if (!baseVariant) return;

        expandingVariantId = variantId;
        render();

        try {
          const basePrompt = baseVariant.ai_metadata?.prompt || project.title;
          for (let i = 0; i < count; i++) {
            const variationPrompt = `${basePrompt}\n\nVariation ${i + 1} of ${count}: create a distinctly different interpretation keeping the same psychological angle, branding ADN, and video context. Change composition or color treatment while keeping the face (if present) and core message.`;

            // Insert placeholder + generate image without intermediate render
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
                }
              })
              .select()
              .single();
            if (insertErr) throw insertErr;

            try {
              const dataUrl = await generateImage(variationPrompt);
              const { data: sessionData } = await supabase.auth.getSession();
              const userId = sessionData?.session?.user?.id;
              const blob = await fetch(dataUrl).then(r => r.blob());
              const fileName = `${userId}/thumbnails/${project.id}/${inserted.id}.png`;
              await supabase.storage.from('thumbnails').upload(fileName, blob, { contentType: 'image/png', upsert: true });
              const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(fileName);

              await supabase.from('thumbnail_variants').update({
                image_url: urlData.publicUrl,
                ai_metadata: { ...inserted.ai_metadata, generating: false, data_url: dataUrl }
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
          alert('Error al generar variaciones: ' + err.message);
        } finally {
          expandingVariantId = null;
          await reloadProjects();
          render();
        }
      });
    });
  }

  // ── Helper: build master prompt ──────────────────────────────────────────
  function buildMasterPrompt({ project, angle, style, formats, selectedFace, useFace, brandKit }) {
    const formatInstructions = formats.map(f => f.prompt).join(' COMBINED WITH: ');
    const adnData = brandKit?.detailed_adn?.synthesis || brandKit?.detailed_adn || {};
    const visual = brandKit?.visual_config || {};

    return `High-impact YouTube thumbnail, 16:9 aspect ratio.
CHANNEL ADN:
- Tone: ${adnData.tone || 'Professional'}
- Branding: ${adnData.branding || 'Modern'}
- Audience: ${adnData.audience_profile || 'Tech enthusiasts'}

VISUAL IDENTITY (BRAND KIT):
- Primary Font/Typography: "${visual.font?.id || 'Impact'}" (Bold, high readability)
- Defined Color Palette: ${visual.palette?.colors?.join(', ') || 'Vivid Colors'} (${visual.palette?.name || 'High Contrast'})
- Colors usage: Use ${visual.palette?.colors?.[0] || 'Red'} for accents and primary focus.

VIDEO CONTEXT (SCRIPT DNA):
- Hook: ${project.logic_dna?.hook || ''}
- Tension: ${project.logic_dna?.tension || ''}
- Promise: ${project.logic_dna?.promise || ''}

PSYCHOLOGICAL ANGLE: "${angle.name}"
${angle.psychology_text ? `Psychology: ${angle.psychology_text}` : ''}

COMPOSITION FORMAT: ${formatInstructions}
VISUAL STYLE: ${style.keywords}

${useFace && selectedFace && brandKit?.face_analysis ? `
CREATOR FACE INTEGRATION (CRITICAL):
- You MUST perfectly feature the creator's exact real face.
- Do NOT invent different facial features. You must take the creator's exact identity and embed it professionally into the thumbnail.
- Facial Traits to respect absolutely: ${JSON.stringify(brandKit.face_analysis)}
- EXPRESSION DIRECTIVE: The expression of the creator's face MUST adapt dynamically to the video's theme and psychological angle. If the video is shocking, the face MUST have a shocking expression. If the video is sad, the face MUST be sad. 
- You must analyze the Hook, Tension, and Promise, and apply the perfect hyper-expressive emotion to the creator's face.
- High fidelity to the creator's facial structure is mandatory for branding consistency.` : 'DO NOT include the creator face or any people. Focus purely on the objects and environment.'}

Professional YouTube CTR-optimized composition. Cinematic lighting. No borders. Vibrant colors. High contrast.
`;
  }

  // ── Helper: generate one image and save to DB ─────────────────────────────
  async function generateAndSaveVariant({ project, angle, style, formats, imagePrompt, overlayText, parentId = null }) {
    // Insert placeholder
    // angle.id may be a real UUID (from click_angles table) or a virtual AI id like "ai-xxx"
    // Only pass angle_id if it's a valid UUID to avoid FK constraint violation
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
        }
      })
      .select()
      .single();
    if (insertErr) throw insertErr;

    // Reload to show placeholder immediately
    await reloadProjects();
    render();

    try {
      const dataUrl = await generateImage(imagePrompt);

      // Upload to storage
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      const blob = await fetch(dataUrl).then(r => r.blob());
      const fileName = `${userId}/thumbnails/${project.id}/${inserted.id}.png`;
      await supabase.storage.from('thumbnails').upload(fileName, blob, { contentType: 'image/png', upsert: true });
      const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(fileName);

      await supabase.from('thumbnail_variants').update({
        image_url: urlData.publicUrl,
        ai_metadata: { ...inserted.ai_metadata, generating: false, data_url: dataUrl }
      }).eq('id', inserted.id);

    } catch (imgErr) {
      console.error('Image gen failed:', imgErr);
      await supabase.from('thumbnail_variants').update({
        ai_metadata: { ...inserted.ai_metadata, generating: false, error: imgErr.message }
      }).eq('id', inserted.id);
    }

    await reloadProjects();
    render();
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
