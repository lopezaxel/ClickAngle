import { CTR_DATA, METRICS, ALERTS, RECENT_PROJECTS } from '../data/mockData.js';
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

  ctx.strokeStyle = '#1A1A1A'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (cH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    ctx.fillStyle = '#666'; ctx.font = '10px Inter'; ctx.textAlign = 'right';
    ctx.fillText(`${(20 - i * 5)}%`, pad.left - 8, y + 3);
  }
  ctx.fillStyle = '#666'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
  CTR_DATA.labels.forEach((l, i) => {
    ctx.fillText(l, pad.left + (cW / (CTR_DATA.labels.length - 1)) * i, h - 8);
  });

  CTR_DATA.datasets.forEach((ds, di) => {
    const pts = ds.data.map((v, i) => ({
      x: pad.left + (cW / (ds.data.length - 1)) * i,
      y: pad.top + cH - (v / 20) * cH
    }));
    if (di === 0) {
      ctx.beginPath(); ctx.moveTo(pts[0].x, pad.top + cH);
      pts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pts[pts.length - 1].x, pad.top + cH); ctx.closePath();
      const g = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH);
      g.addColorStop(0, 'rgba(220, 38, 38, 0.3)'); g.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = g; ctx.fill();
    }
    ctx.beginPath(); ctx.strokeStyle = ds.color; ctx.lineWidth = di === 0 ? 2.5 : 1;
    if (di > 0) ctx.setLineDash([5, 5]); else ctx.setLineDash([]);
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke(); ctx.setLineDash([]);
    if (di === 0) pts.forEach((p, i) => {
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
        <h2 class="section-title">Dashboard de Estrategia</h2>
        <p class="section-subtitle">Análisis de rendimiento CTR en tiempo real</p>
      </div>
      <div class="tabs">
        <button class="tab active">7 Días</button><button class="tab">30 Días</button>
        <button class="tab">90 Días</button><button class="tab">12 Meses</button>
      </div>
    </div>

    <div class="grid-4 mb-lg">
      <div class="metric-card accent">
        <div class="metric-label">${METRICS.avgCTR.label}</div>
        <div class="metric-value glow-accent">${METRICS.avgCTR.value}</div>
        <div class="metric-change up">${icon('trendUp', 12)} ${METRICS.avgCTR.change}</div>
      </div>
      <div class="metric-card success">
        <div class="metric-label">${METRICS.impressions.label}</div>
        <div class="metric-value glow-success">${METRICS.impressions.value}</div>
        <div class="metric-change up">${icon('trendUp', 12)} ${METRICS.impressions.change}</div>
      </div>
      <div class="metric-card accent">
        <div class="metric-label">${METRICS.totalClicks.label}</div>
        <div class="metric-value glow-accent">${METRICS.totalClicks.value}</div>
        <div class="metric-change up">${icon('trendUp', 12)} ${METRICS.totalClicks.change}</div>
      </div>
      <div class="metric-card success">
        <div class="metric-label">${METRICS.thumbScore.label}</div>
        <div class="metric-value glow-success">${METRICS.thumbScore.value}</div>
        <div class="metric-change up">${icon('trendUp', 12)} ${METRICS.thumbScore.change}</div>
      </div>
    </div>

    <div class="grid-2 mb-lg" style="grid-template-columns: 2fr 1fr;">
      <div class="chart-container">
        <div class="card-header">
          <div class="card-title">Evolución CTR</div>
          <div class="flex gap-md items-center">
            <div class="flex gap-xs items-center"><span style="width:10px;height:3px;background:#DC2626;border-radius:2px;display:inline-block;"></span><span class="text-xs text-muted">Tu CTR</span></div>
            <div class="flex gap-xs items-center"><span style="width:10px;height:3px;background:#333;border-radius:2px;display:inline-block;border:1px dashed #555;"></span><span class="text-xs text-muted">Benchmark</span></div>
            <div class="flex gap-xs items-center"><span style="width:10px;height:3px;background:#10B981;border-radius:2px;display:inline-block;border:1px dashed #10B981;"></span><span class="text-xs text-muted">Target 2026</span></div>
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
              <span class="text-sm ${parseFloat(p.ctr) >= 10 ? 'text-success' : 'text-accent'} font-bold">${p.ctr}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="card mt-lg" style="border: 1px solid rgba(16, 185, 129, 0.2); background: rgba(16, 185, 129, 0.03);">
      <div class="card-header">
        <div>
          <div class="card-title">${icon('crosshair', 16)} Benchmark 2026</div>
          <div class="card-subtitle">Target CTR: 5-15% para contenido Tech/IA</div>
        </div>
        <span class="badge badge-success">En camino</span>
      </div>
      <div class="progress-bar" style="height:8px;">
        <div class="progress-bar-fill" style="width: 92%;"></div>
      </div>
      <div class="flex justify-between mt-sm">
        <span class="text-xs text-muted">5% mínimo</span>
        <span class="text-xs text-success font-bold">13.8% actual</span>
        <span class="text-xs text-muted">15% óptimo</span>
      </div>
    </div>
  </div>`;

  container.innerHTML = html;
  requestAnimationFrame(() => {
    const canvas = document.getElementById('ctr-chart');
    if (canvas) drawChart(canvas);
  });
}
