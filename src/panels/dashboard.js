import { CREATIVE_DATA, METRICS, ALERTS, RECENT_PROJECTS } from '../data/mockData.js';
import { icon } from '../icons.js';

function drawChart(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const w = rect.width, h = rect.height;
  const pad = { top: 20, right: 20, bottom: 30, left: 40 };
  const cW = w - pad.left - pad.right, cH = h - pad.top - pad.bottom;

  const maxVal = 50;
  ctx.strokeStyle = '#1A1A1A'; ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (cH / 5) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    ctx.fillStyle = '#666'; ctx.font = '10px Inter'; ctx.textAlign = 'right';
    ctx.fillText(`${maxVal - i * 10}`, pad.left - 8, y + 3);
  }
  ctx.fillStyle = '#666'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
  CREATIVE_DATA.labels.forEach((l, i) => {
    ctx.fillText(l, pad.left + (cW / (CREATIVE_DATA.labels.length - 1)) * i, h - 8);
  });

  CREATIVE_DATA.datasets.forEach((ds, di) => {
    const pts = ds.data.map((v, i) => ({
      x: pad.left + (cW / (ds.data.length - 1)) * i,
      y: pad.top + cH - (v / maxVal) * cH
    }));

    // Area fill
    ctx.beginPath(); ctx.moveTo(pts[0].x, pad.top + cH);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, pad.top + cH); ctx.closePath();
    const g = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH);
    const baseColor = ds.color;
    g.addColorStop(0, baseColor + '40'); g.addColorStop(1, baseColor + '00');
    ctx.fillStyle = g; ctx.fill();

    // Line
    ctx.beginPath(); ctx.strokeStyle = ds.color; ctx.lineWidth = 2.5;
    ctx.setLineDash([]);
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // Points
    pts.forEach((p, i) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = ds.color; ctx.fill();
      if (i === pts.length - 1) {
        ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = ds.color; ctx.lineWidth = 2; ctx.stroke();
      }
    });
  });
}

export function renderDashboard(container) {
  const html = `<div class="animate-in">
    <div class="section-header">
      <div>
        <h2 class="section-title">Dashboard Creativo</h2>
        <p class="section-subtitle">Resumen de tu actividad creativa y producción</p>
      </div>
      <div class="tabs">
        <button class="tab active">7 Días</button><button class="tab">30 Días</button>
        <button class="tab">90 Días</button><button class="tab">12 Meses</button>
      </div>
    </div>

    <div class="grid-4 mb-lg">
      <div class="metric-card accent">
        <div class="metric-label">${METRICS.activeProjects.label}</div>
        <div class="metric-value glow-accent">${METRICS.activeProjects.value}</div>
        <div class="metric-change up">${icon('trendUp', 12)} ${METRICS.activeProjects.change}</div>
      </div>
      <div class="metric-card success">
        <div class="metric-label">${METRICS.thumbnails.label}</div>
        <div class="metric-value glow-success">${METRICS.thumbnails.value}</div>
        <div class="metric-change up">${icon('trendUp', 12)} ${METRICS.thumbnails.change}</div>
      </div>
      <div class="metric-card accent">
        <div class="metric-label">${METRICS.anglesUsed.label}</div>
        <div class="metric-value glow-accent">${METRICS.anglesUsed.value}</div>
        <div class="metric-change up">${icon('trendUp', 12)} ${METRICS.anglesUsed.change}</div>
      </div>
      <div class="metric-card success">
        <div class="metric-label">${METRICS.avgScore.label}</div>
        <div class="metric-value glow-success">${METRICS.avgScore.value}</div>
        <div class="metric-change up">${icon('trendUp', 12)} ${METRICS.avgScore.change}</div>
      </div>
    </div>

    <div class="grid-2 mb-lg" style="grid-template-columns: 2fr 1fr;">
      <div class="chart-container">
        <div class="card-header">
          <div class="card-title">Actividad Creativa</div>
          <div class="flex gap-md items-center">
            <div class="flex gap-xs items-center"><span style="width:10px;height:3px;background:#DC2626;border-radius:2px;display:inline-block;"></span><span class="text-xs text-muted">Proyectos</span></div>
            <div class="flex gap-xs items-center"><span style="width:10px;height:3px;background:#10B981;border-radius:2px;display:inline-block;"></span><span class="text-xs text-muted">Miniaturas</span></div>
          </div>
        </div>
        <canvas class="chart-canvas" id="ctr-chart"></canvas>
      </div>
      <div class="card" style="max-height:320px; overflow-y:auto;">
        <div class="card-header">
          <div class="card-title">Alertas del Sistema</div>
          <span class="badge badge-warning">${ALERTS.length}</span>
        </div>
        <div class="flex flex-col gap-sm">
          ${ALERTS.map(a => `
            <div class="card" style="padding:var(--space-md); border-left: 3px solid ${a.type === 'warning' ? 'var(--warning)' : a.type === 'success' ? 'var(--success)' : 'var(--accent)'};">
              <div class="flex items-center gap-sm mb-sm">
                <span class="status-dot ${a.type === 'warning' ? 'warning' : a.type === 'success' ? 'online' : ''}"></span>
                <span style="font-size:12px;font-weight:600;">${a.title}</span>
              </div>
              <p style="font-size:11px;color:var(--text-secondary);line-height:1.5;">${a.message}</p>
              <span class="text-xs text-muted mt-sm" style="display:block;">${a.time}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="section-header">
      <div class="card-title">Proyectos Recientes</div>
      <button class="btn btn-secondary btn-sm">${icon('arrowRight', 14)} Ver todos</button>
    </div>
    <div class="grid-4">
      ${RECENT_PROJECTS.map(p => `
        <div class="thumbnail-card">
          <div class="thumb-img" style="background: linear-gradient(135deg, #1a1a2e, #16213e);">
            ${icon('image', 32)}
          </div>
          <div class="thumb-info">
            <div style="font-size:13px;font-weight:600;margin-bottom:4px;" class="truncate">${p.title}</div>
            <div class="flex items-center justify-between">
              <span class="badge badge-accent">${p.angle}</span>
              <span class="text-sm ${p.score >= 90 ? 'text-success' : 'text-accent'} font-bold">${p.score}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="card mt-lg" style="border: 1px solid rgba(16, 185, 129, 0.2); background: rgba(16, 185, 129, 0.03);">
      <div class="card-header">
        <div>
          <div class="card-title">${icon('crosshair', 16)} Productividad Mensual</div>
          <div class="card-subtitle">Objetivo: 20 proyectos y 50 miniaturas por mes</div>
        </div>
        <span class="badge badge-success">En camino</span>
      </div>
      <div class="progress-bar" style="height:8px;">
        <div class="progress-bar-fill" style="width: 84%;"></div>
      </div>
      <div class="flex justify-between mt-sm">
        <span class="text-xs text-muted">0 proyectos</span>
        <span class="text-xs text-success font-bold">18 proyectos actuales</span>
        <span class="text-xs text-muted">20 objetivo</span>
      </div>
    </div>
  </div>`;

  container.innerHTML = html;
  requestAnimationFrame(() => {
    const canvas = document.getElementById('ctr-chart');
    if (canvas) drawChart(canvas);
  });
}
