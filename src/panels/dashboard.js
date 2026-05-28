import { supabase } from '../lib/supabase.js';
import { getState, setActiveChannel } from '../lib/state.js';
import { icon } from '../icons.js';
import { navigateTo } from '../router.js';

export function renderDashboard(container) {
  const { currentUser, channels, activeChannelId } = getState();
  const channelList = channels || [];
  const firstName = currentUser?.full_name?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Creador';

  // No channels yet
  if (channelList.length === 0) {
    container.innerHTML = buildEmptyStateHTML(firstName);
    bindEmptyStateEvents(container);
    return;
  }

  const activeChannel = channelList.find(c => c.id === activeChannelId) || channelList[0];

  // Skeleton-first: render immediately, then fetch in background
  container.innerHTML = buildDashboardHTML(firstName, activeChannel, channelList);
  bindEvents(container, channelList);
  fetchStats(container, activeChannel.id);
}

// ─── HTML builders ────────────────────────────────────────────────────────────

function buildDashboardHTML(firstName, activeChannel, channels) {
  const multiChannel = channels.length > 1;

  const channelBadge = multiChannel ? `
    <div class="dash-channel-badge">
      <span class="dash-channel-dot"></span>
      <select class="dash-channel-select" id="dash-channel-switch" title="Cambiar canal">
        ${channels.map(ch => `<option value="${ch.id}" ${ch.id === activeChannel.id ? 'selected' : ''}>${ch.name}</option>`).join('')}
      </select>
    </div>
  ` : `
    <div class="dash-channel-badge">
      <span class="dash-channel-dot"></span>
      <span>${activeChannel.name}</span>
    </div>
  `;

  return `
    <div class="dashboard-home animate-in">

      <!-- Hero -->
      <div class="dash-hero">
        <div class="dash-hero-left">
          ${channelBadge}
          <h1 class="dash-greeting">Hola, ${firstName} 👋</h1>
          <p class="dash-subtitle">Tu suite creativa está lista. Genera miniaturas de ALTO CTR en segundos.</p>
          <div class="dash-hero-actions">
            <button class="btn btn-primary btn-lg" id="dash-btn-new-project">
              ${icon('plus', 18)} Nuevo Video
            </button>
          </div>
        </div>
        <div class="dash-hero-right">
          <div class="dash-stats-grid">
            <div class="dash-stat">
              <div class="dash-stat-icon" style="color:var(--accent);">${icon('folder', 20)}</div>
              <div class="dash-stat-value stat-skeleton" id="dash-stat-projects">0</div>
              <div class="dash-stat-label">PROYECTOS ACTIVOS</div>
            </div>
            <div class="dash-stat">
              <div class="dash-stat-icon" style="color:var(--warning);">${icon('trendUp', 20)}</div>
              <div class="dash-stat-value stat-skeleton" id="dash-stat-week">0</div>
              <div class="dash-stat-label">MINIATURAS ESTA SEMANA</div>
            </div>
            <div class="dash-stat">
              <div class="dash-stat-icon" style="color:var(--success);">${icon('image', 20)}</div>
              <div class="dash-stat-value stat-skeleton" id="dash-stat-thumbnails">0</div>
              <div class="dash-stat-label">CREATIVOS GENERADOS</div>
            </div>
            <div class="dash-stat">
              <div class="dash-stat-icon" style="color:var(--accent);">${icon('trendUp', 20)}</div>
              <div class="dash-stat-value stat-skeleton" id="dash-stat-score">—</div>
              <div class="dash-stat-label">SCORE PROMEDIO</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="dash-section">
        <div class="dash-section-header">
          ${icon('bolt', 15)} <span>Acciones Rápidas</span>
        </div>
        <div class="dash-actions-grid">
          <button class="dash-action-card" data-action="cerebro">
            <div class="dash-action-icon">${icon('plus', 22)}</div>
            <div class="dash-action-title">Nuevo Video</div>
            <div class="dash-action-desc">Inicia un nuevo video desde cero</div>
          </button>
          <button class="dash-action-card" data-action="engine">
            <div class="dash-action-icon" style="color:var(--success);">${icon('image', 22)}</div>
            <div class="dash-action-title">Fábrica Creativa</div>
            <div class="dash-action-desc">Ver todos tus creativos guardados</div>
          </button>
          <button class="dash-action-card" data-action="simulator">
            <div class="dash-action-icon" style="color:var(--warning);">${icon('monitor', 22)}</div>
            <div class="dash-action-title">Simulador</div>
            <div class="dash-action-desc">Probá tu miniatura en el feed de YouTube</div>
          </button>
        </div>
      </div>

      <!-- Recent Projects -->
      <div class="dash-section">
        <div class="dash-section-header">
          ${icon('clock', 15)} <span>Proyectos Recientes</span>
        </div>
        <div id="dash-recent-projects" class="dash-recent-grid">
          ${buildProjectSkeletons()}
        </div>
      </div>

    </div>
  `;
}

function buildProjectSkeletons() {
  return Array(4).fill(0).map(() => `
    <div class="dash-project-card dash-project-skeleton">
      <div class="dash-skeleton-line" style="width:55%;height:13px;margin-bottom:7px;"></div>
      <div class="dash-skeleton-line" style="width:35%;height:10px;"></div>
    </div>
  `).join('');
}

function buildEmptyStateHTML(firstName) {
  return `
    <div class="dashboard-home animate-in">
      <div class="dash-hero dash-hero--center">
        <div class="dash-channel-badge">
          <span class="dash-channel-dot"></span>
          <span>Sin canal activo</span>
        </div>
        <h1 class="dash-greeting">Hola, ${firstName} 👋</h1>
        <p class="dash-subtitle">Tu suite creativa está lista. Creá tu primer canal para empezar a generar miniaturas de ALTO CTR.</p>
        <div class="dash-hero-actions">
          <button class="btn btn-primary btn-lg" id="dash-btn-create-channel">
            ${icon('rocket', 18)} Crear mi primer canal
          </button>
        </div>
      </div>
    </div>
  `;
}

function buildRecentProjectsHTML(projects) {
  if (!projects.length) {
    return `<p class="text-sm" style="color:var(--text-secondary);padding:8px 0;">Aún no hay proyectos. ¡Creá el primero!</p>`;
  }
  return projects.map(p => {
    const date = new Date(p.updated_at || p.created_at);
    const dateStr = date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    return `
      <div class="dash-project-card" data-project-id="${p.id}" role="button" tabindex="0">
        <div class="dash-project-icon">${icon('film', 18)}</div>
        <div class="dash-project-info">
          <div class="dash-project-title">${p.title || 'Sin título'}</div>
          <div class="dash-project-date">${dateStr}</div>
        </div>
        <div class="dash-project-arrow">${icon('arrowRight', 14)}</div>
      </div>
    `;
  }).join('');
}

// ─── Async data fetch ─────────────────────────────────────────────────────────

async function fetchStats(container, channelId) {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [projectsRes, variantsRes, recentRes] = await Promise.all([
      supabase.from('projects').select('id', { count: 'exact' }).eq('channel_id', channelId),
      supabase.from('thumbnail_variants')
        .select('id, impact_score, created_at, project_id, projects!inner(channel_id)')
        .eq('projects.channel_id', channelId),
      supabase.from('projects').select('id, title, created_at, updated_at')
        .eq('channel_id', channelId)
        .order('updated_at', { ascending: false })
        .limit(4),
    ]);

    if (!container.querySelector('.dashboard-home')) return;

    const projectCount = projectsRes.count || 0;
    const allVariants = variantsRes.data || [];
    const thumbnailCount = allVariants.length;
    const weeklyCount = allVariants.filter(v => v.created_at >= weekAgo).length;
    const avgScore = thumbnailCount > 0
      ? Math.round(allVariants.reduce((sum, v) => sum + (v.impact_score || 0), 0) / thumbnailCount)
      : 0;

    const set = (id, val) => {
      const el = container.querySelector(`#${id}`);
      if (el) { el.textContent = val; el.classList.remove('stat-skeleton'); }
    };
    set('dash-stat-projects', projectCount);
    set('dash-stat-week', weeklyCount);
    set('dash-stat-thumbnails', thumbnailCount);
    set('dash-stat-score', avgScore || '—');

    const recentEl = container.querySelector('#dash-recent-projects');
    if (recentEl) recentEl.innerHTML = buildRecentProjectsHTML(recentRes.data || []);

  } catch (err) {
    console.error('Dashboard stats error:', err);
    ['dash-stat-projects', 'dash-stat-week', 'dash-stat-thumbnails', 'dash-stat-score'].forEach(id => {
      const el = container.querySelector(`#${id}`);
      if (el) { el.textContent = '—'; el.classList.remove('stat-skeleton'); }
    });
    const recentEl = container.querySelector('#dash-recent-projects');
    if (recentEl) recentEl.innerHTML = '';
  }
}

// ─── Event binding ────────────────────────────────────────────────────────────

function bindEvents(container, channels) {
  container.addEventListener('click', (e) => {
    if (e.target.closest('#dash-btn-new-project')) {
      navigateTo('cerebro');
      return;
    }
    const actionCard = e.target.closest('.dash-action-card');
    if (actionCard) {
      navigateTo(actionCard.dataset.action);
      return;
    }
    const projectCard = e.target.closest('.dash-project-card[data-project-id]');
    if (projectCard) {
      navigateTo('cerebro');
      return;
    }
  });

  const channelSwitch = container.querySelector('#dash-channel-switch');
  if (channelSwitch) {
    channelSwitch.addEventListener('change', (e) => {
      setActiveChannel(e.target.value);
      navigateTo('dashboard');
    });
  }
}

function bindEmptyStateEvents(container) {
  container.addEventListener('click', (e) => {
    if (e.target.closest('#dash-btn-create-channel')) {
      navigateTo('channel-selector');
    }
  });
}
