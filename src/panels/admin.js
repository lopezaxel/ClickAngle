import { supabase } from '../lib/supabase.js';
import { getState } from '../lib/state.js';
import { icon } from '../icons.js';

export async function renderAdmin(container) {
  const { currentUser } = getState();
  if (currentUser?.role !== 'admin') {
    container.innerHTML = '<div style="padding:40px;color:var(--danger);">Acceso denegado.</div>';
    return;
  }

  container.innerHTML = `<div class="animate-in">
    <div class="section-header">
      <div>
        <h2 class="section-title">${icon('barChart', 22)} Admin Panel</h2>
        <p class="section-subtitle">Métricas globales de la plataforma</p>
      </div>
      <button class="btn btn-secondary btn-sm" id="btn-refresh-metrics">${icon('refresh', 14)} Actualizar</button>
    </div>
    <div id="admin-metrics-content">
      <div style="display:flex;align-items:center;gap:12px;color:rgba(255,255,255,0.3);padding:40px;">
        <div class="loader" style="width:20px;height:20px;border-width:2px"></div>
        Cargando métricas...
      </div>
    </div>
  </div>`;

  document.getElementById('btn-refresh-metrics')?.addEventListener('click', () => loadMetrics(container));
  await loadMetrics(container);
}

async function loadMetrics(container) {
  const metricsContainer = container.querySelector('#admin-metrics-content');
  if (!metricsContainer) return;

  const { data: metrics, error } = await supabase.rpc('admin_get_metrics');
  if (error) {
    metricsContainer.innerHTML = `<div class="card" style="border-left:3px solid var(--danger);color:var(--danger);">${icon('alertTriangle', 14)} Error: ${error.message}</div>`;
    return;
  }

  const m = metrics;

  metricsContainer.innerHTML = `
    <!-- Métricas de usuarios -->
    <div style="margin-bottom:var(--space-lg);">
      <div class="sidebar-section-label" style="margin-bottom:var(--space-md);">USUARIOS</div>
      <div class="grid-4" style="gap:var(--space-md);">
        ${metricCard(icon('user', 18), 'Total Usuarios', m.total_users, 'var(--text-primary)')}
        ${metricCard(icon('check', 18), 'Activos', m.active_users, 'var(--success)')}
        ${metricCard(icon('lock', 18), 'Bloqueados', m.blocked_users, 'var(--danger)')}
        ${metricCard(icon('alertTriangle', 18), 'Vencen en 7 días', m.expiring_soon, '#f59e0b')}
      </div>
    </div>

    <!-- Métricas de uso -->
    <div style="margin-bottom:var(--space-lg);">
      <div class="sidebar-section-label" style="margin-bottom:var(--space-md);">USO DE LA PLATAFORMA</div>
      <div class="grid-4" style="gap:var(--space-md);">
        ${metricCard(icon('image', 18), 'Miniaturas Generadas', m.total_thumbnails, 'var(--accent)')}
        ${metricCard(icon('folder', 18), 'Proyectos Creados', m.total_projects, '#6366f1')}
        ${metricCard(icon('grid', 18), 'Canales Creados', m.total_channels, '#8b5cf6')}
        ${metricCard(icon('user', 18), 'Fotos en Face Vault', m.total_faces, '#06b6d4')}
      </div>
    </div>

    <!-- Nuevos este mes -->
    <div class="card" style="margin-bottom:var(--space-lg);border-left:3px solid var(--success);">
      <div class="card-header">
        <div class="card-title">${icon('user', 14)} Nuevos usuarios este mes</div>
      </div>
      <div style="font-size:36px;font-weight:800;color:var(--success);">${m.new_users_this_month}</div>
    </div>

    <!-- Top usuarios -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">${icon('barChart', 14)} Top usuarios por miniaturas generadas</div>
      </div>
      ${m.top_users_thumbnails && m.top_users_thumbnails.length > 0
        ? `<div style="display:flex;flex-direction:column;gap:var(--space-sm);">
            ${m.top_users_thumbnails.map((u, i) => `
              <div style="display:flex;align-items:center;gap:var(--space-md);padding:var(--space-sm) 0;border-bottom:1px solid var(--border);">
                <span style="font-size:18px;font-weight:800;color:var(--text-tertiary);width:24px;">${i + 1}</span>
                <div style="flex:1;">
                  <div style="font-size:13px;font-weight:600;">${u.full_name || u.email}</div>
                  <div style="font-size:11px;color:var(--text-tertiary);">${u.email}</div>
                </div>
                <span class="badge badge-accent">${u.thumbnail_count} miniaturas</span>
              </div>
            `).join('')}
          </div>`
        : '<div class="text-sm text-muted">Aún no hay datos de miniaturas.</div>'
      }
    </div>
  `;
}

function metricCard(iconHtml, label, value, color) {
  return `
    <div class="card" style="text-align:center;">
      <div style="color:${color};margin-bottom:var(--space-sm);">${iconHtml}</div>
      <div style="font-size:32px;font-weight:800;color:${color};">${value ?? 0}</div>
      <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;">${label}</div>
    </div>
  `;
}
