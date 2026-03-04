import { supabase } from '../lib/supabase.js';
import { getState } from '../lib/state.js';
import { icon } from '../icons.js';

function drawChart(canvas, chartData) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const w = rect.width, h = rect.height;
  const pad = { top: 20, right: 20, bottom: 30, left: 40 };
  const cW = w - pad.left - pad.right, cH = h - pad.top - pad.bottom;

  const maxVal = Math.max(10, ...chartData.flatMap(ds => ds.data));
  ctx.strokeStyle = '#1A1A1A'; ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (cH / 5) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    ctx.fillStyle = '#666'; ctx.font = '10px Inter'; ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(maxVal - i * (maxVal / 5))}`, pad.left - 8, y + 3);
  }

  chartData.forEach((ds) => {
    if (ds.data.length === 0) return;
    const pts = ds.data.map((v, i) => ({
      x: pad.left + (ds.data.length > 1 ? (cW / (ds.data.length - 1)) * i : cW / 2),
      y: pad.top + cH - (v / maxVal) * cH
    }));

    ctx.beginPath(); ctx.moveTo(pts[0].x, pad.top + cH);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, pad.top + cH); ctx.closePath();
    const g = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH);
    g.addColorStop(0, ds.color + '40'); g.addColorStop(1, ds.color + '00');
    ctx.fillStyle = g; ctx.fill();

    ctx.beginPath(); ctx.strokeStyle = ds.color; ctx.lineWidth = 2.5;
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    pts.forEach((p, i) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = ds.color; ctx.fill();
    });
  });
}

export async function renderDashboard(container) {
  const { activeChannelId } = getState();
  if (!activeChannelId) { container.innerHTML = '<div class="loading-spinner">Selecciona un canal</div>'; return; }

  container.innerHTML = `<div class="loading-spinner"><span class="animate-pulse">${icon('clock', 24)}</span></div>`;

  // Fetch metrics
  const [projectsRes, variantsRes, anglesRes, recentRes] = await Promise.all([
    supabase.from('projects').select('id', { count: 'exact' }).eq('channel_id', activeChannelId),
    supabase.from('thumbnail_variants').select('id, impact_score, project_id, projects!inner(channel_id)').eq('projects.channel_id', activeChannelId),
    supabase.from('user_favorite_angles').select('id', { count: 'exact' }).eq('channel_id', activeChannelId),
    supabase.from('projects').select('*, thumbnail_variants(count)').eq('channel_id', activeChannelId).order('created_at', { ascending: false }).limit(4),
  ]);

  const projectCount = projectsRes.count || 0;
  const thumbnailCount = variantsRes.data?.length || 0;
  const anglesUsed = anglesRes.count || 0;
  const avgScore = thumbnailCount > 0
    ? Math.round(variantsRes.data.reduce((sum, v) => sum + (v.impact_score || 0), 0) / thumbnailCount)
    : 0;
  const recentProjects = recentRes.data || [];

  const html = `<div class="animate-in">
    <div class="section-header">
      <div>
        <h2 class="section-title">Dashboard Creativo</h2>
        <p class="section-subtitle">Resumen de tu actividad creativa y producción</p>
      </div>
    </div>

    <div class="grid-4 mb-lg">
      <div class="metric-card accent">
        <div class="metric-label">Proyectos</div>
        <div class="metric-value glow-accent">${projectCount}</div>
      </div>
      <div class="metric-card success">
        <div class="metric-label">Miniaturas Generadas</div>
        <div class="metric-value glow-success">${thumbnailCount}</div>
      </div>
      <div class="metric-card accent">
        <div class="metric-label">Ángulos Favoritos</div>
        <div class="metric-value glow-accent">${anglesUsed}</div>
      </div>
      <div class="metric-card success">
        <div class="metric-label">Score Promedio</div>
        <div class="metric-value glow-success">${avgScore || '—'}</div>
      </div>
    </div>

    <div class="grid-2 mb-lg" style="grid-template-columns: 2fr 1fr;">
      <div class="chart-container">
        <div class="card-header">
          <div class="card-title">Actividad Creativa</div>
        </div>
        <canvas class="chart-canvas" id="ctr-chart"></canvas>
      </div>
      <div class="card" style="display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:var(--space-xl);">
        <div style="color:var(--accent);margin-bottom:var(--space-md);">${icon('crosshair', 48)}</div>
        <div style="font-size:36px;font-weight:800;color:var(--accent-light);">${projectCount}</div>
        <div class="text-sm text-muted">Proyectos totales</div>
      </div>
    </div>

    <div class="section-header">
      <div class="card-title">Proyectos Recientes</div>
    </div>
    ${recentProjects.length > 0 ? `
    <div class="grid-4">
      ${recentProjects.map(p => `
        <div class="thumbnail-card">
          <div class="thumb-img" style="background: linear-gradient(135deg, #1a1a2e, #16213e);">
            ${icon('image', 32)}
          </div>
          <div class="thumb-info">
            <div style="font-size:13px;font-weight:600;margin-bottom:4px;" class="truncate">${p.title}</div>
            <div class="flex items-center justify-between">
              <span class="badge badge-${p.status === 'published' ? 'success' : 'neutral'}">${p.status}</span>
              <span class="text-xs text-muted">${new Date(p.created_at).toLocaleDateString('es')}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>` : `
    <div class="card" style="text-align:center;padding:var(--space-xl);color:var(--text-tertiary);">
      ${icon('image', 32)}
      <p class="text-sm text-muted mt-md">Sin proyectos aún. Creá tu primer proyecto en la Fábrica Creativa.</p>
    </div>`}
  </div>`;

  container.innerHTML = html;
  requestAnimationFrame(() => {
    const canvas = document.getElementById('ctr-chart');
    if (canvas) drawChart(canvas, [
      { label: 'Proyectos', data: [projectCount], color: '#DC2626' },
      { label: 'Miniaturas', data: [thumbnailCount], color: '#10B981' },
    ]);
  });
}
