import { supabase } from '../lib/supabase.js';
import { getState } from '../lib/state.js';
import { icon } from '../icons.js';
import { callAI } from '../lib/intelligence.js';

export async function renderEngine(container) {
  const { activeChannelId } = getState();
  if (!activeChannelId) { container.innerHTML = '<div class="loading-spinner">Selecciona un canal</div>'; return; }

  container.innerHTML = `<div class="loading-spinner"><span class="animate-pulse">${icon('clock', 24)}</span></div>`;

  // Fetch angles for selector
  const { data: angles } = await supabase.from('click_angles').select('*').order('name');

  // Fetch face vault for expression selector
  const { data: faces } = await supabase
    .from('face_vault')
    .select('*')
    .eq('channel_id', activeChannelId);

  // Fetch recent projects with variants
  const { data: projects } = await supabase
    .from('projects')
    .select('*, thumbnail_variants(*)')
    .eq('channel_id', activeChannelId)
    .order('created_at', { ascending: false })
    .limit(1);

  const lastProject = projects?.[0];
  const variants = lastProject?.thumbnail_variants || [];
  const faceList = faces || [];
  const angleList = angles || [];

  let html = `<div class="animate-in">
    <div class="section-header">
      <div>
        <h2 class="section-title">${icon('cog', 22)} Fábrica Creativa</h2>
        <p class="section-subtitle">Generación por lotes de miniaturas de alto impacto</p>
      </div>
      <div class="flex gap-sm">
        <button class="btn btn-secondary btn-sm">${icon('grid', 14)} Historial</button>
        <button class="btn btn-primary" id="btn-generate">${icon('rocket', 16)} Generar</button>
      </div>
    </div>

    <div class="grid-3 mb-lg">
      <div class="card">
        <div class="card-title mb-md">${icon('file', 16)} Script</div>
        <div class="form-group"><label class="form-label">Título</label>
        <input type="text" class="form-input" id="project-title" placeholder="Título del video" /></div>
        <div class="form-group"><label class="form-label">Resumen</label>
        <textarea class="form-textarea" id="project-summary" style="min-height:80px;" placeholder="Descripción breve del contenido"></textarea></div>
      </div>

      <div class="card">
        <div class="card-title mb-md">${icon('crosshair', 16)} Ángulo</div>
        <div class="form-group"><label class="form-label">Ángulo</label>
        <select class="form-select" id="select-angle">
          ${angleList.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
        </select></div>
        <div class="form-group mt-md"><label class="form-label">Estilo</label>
        <div class="tabs"><button class="tab active">Tech</button><button class="tab">Minimal</button><button class="tab">Dramático</button></div></div>
      </div>

      <div class="card">
        <div class="card-title mb-md">${icon('sliders', 16)} Parámetros</div>
        <div class="form-group"><label class="form-label">Variantes</label>
        <div class="tabs" style="margin-bottom:0;"><button class="tab">3</button><button class="tab active">6</button><button class="tab">10</button></div></div>
        <div class="form-group"><label class="form-label">Expresión</label>
        <select class="form-select" id="select-expression">
          ${faceList.length > 0
      ? faceList.map(f => `<option value="${f.id}">${f.expression_type}</option>`).join('')
      : '<option disabled selected>Sin expresiones — sube en Brand Kit</option>'}
        </select></div>
        <div class="form-group"><label class="form-label">Resolución</label>
        <select class="form-select"><option selected>1280×720</option><option>1920×1080</option></select></div>
      </div>
    </div>

    ${variants.length > 0 ? `
    <div class="card mb-lg" style="border-color:var(--accent);background:rgba(220,38,38,0.03);">
      <div class="flex items-center justify-between mb-sm">
        <div class="flex items-center gap-sm"><span class="status-dot online"></span><span class="text-sm font-bold">${variants.length} variantes — "${lastProject.title}"</span></div>
        <span class="text-xs text-muted">${new Date(lastProject.created_at).toLocaleDateString('es')}</span></div>
      <div class="progress-bar"><div class="progress-bar-fill" style="width:100%;"></div></div>
    </div>

    <div class="section-header"><div class="card-title">${icon('image', 16)} Variantes</div></div>
    <div class="grid-3">
      ${variants.map((v, i) => `<div class="thumbnail-card" style="animation:fadeIn 0.4s ease both;animation-delay:${i * 0.1}s;">
        <div class="thumb-img" style="background:linear-gradient(${135 + i * 30}deg,#0a0a1a,#1a0a2e);position:relative;">
          ${v.status === 'processing' 
            ? `<div class="flex flex-col items-center justify-center h-full gap-sm">
                 <div class="animate-pulse">${icon('clock', 32)}</div>
                 <div class="text-xs opacity-70">Generando...</div>
               </div>` 
            : v.image_url
              ? `<img src="${v.image_url}" alt="" style="width:100%;height:100%;object-fit:cover;" />`
              : v.status === 'error'
                ? `<div class="flex flex-col items-center justify-center h-full text-danger">
                     ${icon('alertTriangle', 32)}
                     <div class="text-xs">Error de Gen</div>
                   </div>`
                : `<div class="flex flex-col items-center justify-center h-full p-md text-center">
                     <div style="font-size:10px; text-transform:uppercase; letter-spacing:1px; opacity:0.5; margin-bottom:var(--space-xs);">Concepto Visual</div>
                     <div style="font-size:11px; opacity:0.8; line-height:1.4;">${v.ai_metadata?.prompt?.slice(0, 80)}...</div>
                   </div>`
          }
          <div style="position:absolute;bottom:0;left:0;right:0;padding:8px;background:linear-gradient(transparent,rgba(0,0,0,0.8));">
            <div style="font-family:var(--font-impact);font-size:18px;color:white;letter-spacing:2px;">${v.overlay_text || ''}</div></div></div>
        <div class="thumb-info">
          <div class="flex items-center justify-between mb-sm">
            <span class="badge badge-accent">${v.style_preset || 'default'}</span>
            <span class="font-bold ${v.impact_score >= 90 ? 'text-success' : 'text-accent'}">${v.impact_score || 0}</span></div></div>
      </div>`).join('')}
    </div>` : `
    <div class="card" style="text-align:center;padding:var(--space-2xl);color:var(--text-tertiary);">
      ${icon('image', 48)}
      <p class="text-sm text-muted mt-md">Aún no hay variantes generadas. Configura los parámetros y haz clic en "Generar".</p>
    </div>`}
  </div>`;

  container.innerHTML = html;

  // Auto-select expression based on angle (Phase 3 automation)
  document.getElementById('select-angle')?.addEventListener('change', (e) => {
    const angleId = e.target.value;
    const angle = angleList.find(a => a.id === angleId);
    const expressionSelect = document.getElementById('select-expression');

    if (angle && expressionSelect) {
      // Mapping logic: Keywords in angle description/name -> Expression type
      const mapping = {
        'ERROR': ['preocupado', 'sorpresa', 'pensando'],
        'CONTRASTE': ['sorpresa', 'confianza'],
        'RECOMPENSA': ['confianza', 'señalando'],
        'CURIOSIDAD': ['pensando', 'sorpresa']
      };

      const normalizedAngle = angle.name.toUpperCase();
      let targetExpression = 'confianza'; // default

      for (const [key, exprs] of Object.entries(mapping)) {
        if (normalizedAngle.includes(key)) {
          // Find first matching expression in user's vault
          const found = faceList.find(f => exprs.includes(f.expression_type.toLowerCase()));
          if (found) {
            targetExpression = found.id;
            break;
          }
        }
      }

      if (expressionSelect.querySelector(`option[value="${targetExpression}"]`)) {
        expressionSelect.value = targetExpression;
      }
    }
  });

  // Generate button
  const btn = document.getElementById('btn-generate');
  if (btn) {
    btn.addEventListener('click', async () => {
      const title = document.getElementById('project-title')?.value;
      const summary = document.getElementById('project-summary')?.value;
      const angleId = document.getElementById('select-angle')?.value;

      if (!title) { alert('Ingresa un título'); return; }

      btn.innerHTML = `<span class="animate-pulse">${icon('clock', 16)}</span> Creando proyecto...`;
      btn.disabled = true;

      try {
        // Create project
        const { data: project, error } = await supabase
          .from('projects')
          .insert({ channel_id: activeChannelId, title, summary, status: 'draft' })
          .select()
          .single();
        if (error) throw error;

        // High Level AI Logic: Generate 6 creative prompt variations using Gemini
        const generationContext = {
          title,
          summary,
          angle: angleList.find(a => a.id === angleId)
        };
        
        btn.innerHTML = `<span class="animate-pulse">${icon('brain', 16)}</span> Ideando variantes...`;
        
        const aiVariations = await callAI('IMAGE_GEN', `Genera 6 variaciones de miniaturas para este video. Título: ${title}. Resumen: ${summary}. Ángulo: ${generationContext.angle?.name}`, generationContext);
        const variantsToProcess = Array.isArray(aiVariations) ? aiVariations : (aiVariations.variations || []);

        // Insert variants as 'processing'
        const variantData = variantsToProcess.slice(0, 6).map((v, i) => ({
          project_id: project.id,
          angle_id: angleId,
          overlay_text: v.overlay_text || title.toUpperCase(),
          style_preset: v.style || ['tech', 'minimal', 'dramatic', 'neon', 'clean', 'bold'][i],
          impact_score: Math.floor(Math.random() * 20) + 80,
          status: 'processing',
          ai_metadata: {
            prompt: v.visual_prompt || v.prompt || title,
            angle_name: generationContext.angle?.name
          }
        }));

        const { data: insertedVariants, error: vError } = await supabase.from('thumbnail_variants').insert(variantData).select();
        if (vError) throw vError;

        renderEngine(container); // Show cards with loaders

        // Update variants to 'ready' immediately since we are focusing on Strategy/Concepts now
        await supabase.from('thumbnail_variants')
          .update({ status: 'ready' })
          .eq('project_id', project.id);
        
        renderEngine(container);

        btn.innerHTML = `${icon('rocket', 16)} Generar`;
        btn.disabled = false;
      } catch (err) {
        alert('Error: ' + err.message);
        btn.innerHTML = `${icon('rocket', 16)} Generar`;
        btn.disabled = false;
      }
    });
  }
}
