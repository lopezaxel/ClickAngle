import { icon } from '../icons.js';
import { getState, subscribe } from '../lib/state.js';
import { supabase } from '../lib/supabase.js';

// ─── Fake YouTube content ────────────────────────────────────────────────────
const YT_DATA = [
  { title: 'Cómo hacer crecer tu canal de YouTube en 2026 (estrategia real)', ch: 'CreatorPRO', views: '128K', time: 'hace 3 días', dur: '14:32' },
  { title: 'El ERROR que cometen todos los nuevos YouTubers', ch: 'VideoMarketing', views: '89K', time: 'hace 1 semana', dur: '9:18' },
  { title: 'Probé publicar todos los días durante 30 días — esto pasó', ch: 'ExperimentoYT', views: '1.2M', time: 'hace 2 semanas', dur: '22:05' },
  { title: 'La VERDAD sobre el nuevo algoritmo de YouTube (2026)', ch: 'AlgoritmoMX', views: '456K', time: 'hace 4 días', dur: '18:44' },
  { title: '5 herramientas de IA que uso para mis miniaturas en 2026', ch: 'TechCreador', views: '67K', time: 'hace 5 días', dur: '11:27' },
  { title: 'De 0 a 100K suscriptores — mi historia completa', ch: 'GrowthHacker', views: '2.3M', time: 'hace 1 mes', dur: '31:12' },
  { title: 'Por qué tus miniaturas NO generan clicks (análisis honesto)', ch: 'CTRExpert', views: '234K', time: 'hace 6 días', dur: '16:08' },
  { title: 'El nicho más rentable de YouTube ahora mismo', ch: 'NegociosDigital', views: '178K', time: 'hace 2 días', dur: '13:55' },
  { title: 'Analicé 1000 thumbnails virales — esto tienen en común', ch: 'ClickAngles', views: '345K', time: 'hace 1 semana', dur: '19:33' },
  { title: 'Mi setup completo para grabar YouTube en casa (2026)', ch: 'SetupCreador', views: '92K', time: 'hace 3 semanas', dur: '24:16' },
  { title: 'Cómo monetizar tu canal más rápido con estas estrategias', ch: 'IngresoYT', views: '512K', time: 'hace 2 semanas', dur: '17:42' },
  { title: 'Shorts vs Videos largos en 2026 — cuál te da más suscriptores', ch: 'FormatoYT', views: '784K', time: 'hace 5 días', dur: '8:59' },
];

function picsumUrl(seed, w = 320, h = 180) {
  return `https://picsum.photos/seed/${seed + 10}/${w}/${h}`;
}

// YouTube-style clickbait text overlay over Picsum photos
const OVERLAY_ACCENT = ['#FFD700', '#FFFFFF', '#FF4444', '#FFD700', '#FFFFFF', '#00E5FF', '#FFD700', '#FF4444', '#FFFFFF', '#FFD700', '#00E5FF', '#FF4444'];

function buildThumbOverlay(title, i) {
  const clean = title.replace(/[()—–]/g, '').trim().split(' ');
  const line1 = clean.slice(0, 3).join(' ').toUpperCase();
  const line2 = clean.slice(3, 6).join(' ').toUpperCase();
  const accent = OVERLAY_ACCENT[i % OVERLAY_ACCENT.length];
  return `
    <div class="sim-thumb-overlay">
      <div class="sim-thumb-overlay-l1" style="color:${accent};">${line1}</div>
      ${line2 ? `<div class="sim-thumb-overlay-l2">${line2}</div>` : ''}
    </div>`;
}

const THUMBS_PER_PAGE = 4;

export function renderSimulator(container) {
  let activeView = 'mobile';
  let selectedUrl = '';
  let pickerPage = 0;
  let allThumbnails = [];
  let currentProjectId = getState().activeProjectId;

  // ── Initial render (sync) ────────────────────────────────────────────────
  function render() {
    container.innerHTML = buildShell();
    bindEvents();
  }

  // ── Shell layout ─────────────────────────────────────────────────────────
  function buildShell() {
    return `
      <div class="sim-wrapper animate-in">

        <div class="section-header" style="margin-bottom:var(--space-md);">
          <div>
            <h2 class="section-title">${icon('monitor', 22)} Simulador de Miniaturas</h2>
            <p class="section-subtitle">Así se ve tu miniatura compitiendo en el feed real de YouTube</p>
          </div>
          ${selectedUrl ? `
          <button class="btn btn-secondary btn-sm" id="sim-blur-btn">
            ${icon('eye', 15)} Blur Test
          </button>` : ''}
        </div>

        <!-- Thumbnail picker -->
        ${buildPickerSection()}

        <!-- View tabs -->
        <div class="sim-tabs">
          <button class="sim-tab ${activeView === 'mobile' ? 'active' : ''}" data-view="mobile">${icon('smartphone', 14)} Mobile</button>
          <button class="sim-tab ${activeView === 'desktop' ? 'active' : ''}" data-view="desktop">${icon('monitor', 14)} Desktop</button>
          <button class="sim-tab ${activeView === 'search' ? 'active' : ''}" data-view="search">${icon('search', 14)} Búsqueda</button>
        </div>

        <!-- Active view -->
        <div id="sim-view">
          ${buildView()}
        </div>

      </div>
    `;
  }

  function buildView() {
    if (activeView === 'mobile')  return buildMobileView();
    if (activeView === 'desktop') return buildDesktopView();
    return buildSearchView();
  }

  // ── Picker ────────────────────────────────────────────────────────────────
  function buildPickerSection() {
    return `<div class="sim-picker" id="sim-picker">${buildPickerContent()}</div>`;
  }

  function buildPickerContent() {
    const totalPages = Math.max(1, Math.ceil(allThumbnails.length / THUMBS_PER_PAGE));
    const start = pickerPage * THUMBS_PER_PAGE;
    const pageThumbs = allThumbnails.slice(start, start + THUMBS_PER_PAGE);
    const hasPrev = pickerPage > 0;
    const hasNext = pickerPage < totalPages - 1;

    let thumbsHtml;
    if (!currentProjectId) {
      thumbsHtml = `
        <div class="sim-picker-empty">
          ${icon('film', 20)}
          <span>Seleccioná un video activo desde la barra superior para ver sus miniaturas</span>
        </div>`;
    } else if (allThumbnails.length === 0) {
      thumbsHtml = `
        <div class="sim-picker-empty">
          ${icon('image', 20)}
          <span>Este video no tiene miniaturas aún. Generá una en la Fábrica Creativa.</span>
        </div>`;
    } else {
      thumbsHtml = pageThumbs.map(v => `
        <button class="sim-picker-thumb ${v.image_url === selectedUrl ? 'selected' : ''}" data-url="${v.image_url}" title="${v.projectTitle || ''}">
          <img src="${v.image_url}" alt="" onerror="this.parentElement.style.display='none'" />
          ${v.image_url === selectedUrl ? `<div class="sim-picker-selected-badge">${icon('check', 10)}</div>` : ''}
        </button>
      `).join('');
    }

    return `
      <div class="sim-picker-header">
        <span class="sim-picker-label">${icon('image', 14)} Elegí tu miniatura</span>
        ${allThumbnails.length > THUMBS_PER_PAGE
          ? `<span class="sim-picker-pages">${pickerPage + 1} / ${totalPages}</span>`
          : `<span class="sim-picker-count">${allThumbnails.length} miniatura${allThumbnails.length !== 1 ? 's' : ''}</span>`
        }
      </div>
      <div class="sim-picker-row">
        <button class="sim-picker-nav" id="sim-prev" ${!hasPrev ? 'disabled' : ''} title="Anterior">
          ${icon('arrowLeft', 16)}
        </button>
        <div class="sim-picker-grid" id="sim-picker-grid">
          ${thumbsHtml}
        </div>
        <button class="sim-picker-nav" id="sim-next" ${!hasNext ? 'disabled' : ''} title="Siguiente">
          ${icon('arrowRight', 16)}
        </button>
      </div>
    `;
  }

  function refreshPicker() {
    const el = container.querySelector('#sim-picker');
    if (el) el.innerHTML = buildPickerContent();
  }

  // ── Event binding ─────────────────────────────────────────────────────────
  function bindEvents() {
    if (currentProjectId) loadThumbnails(currentProjectId);

    const unsubscribe = subscribe((s) => {
      if (!container.isConnected) { unsubscribe(); return; }
      if (s.activeProjectId !== currentProjectId) {
        currentProjectId = s.activeProjectId;
        selectedUrl = '';
        pickerPage = 0;
        allThumbnails = [];
        refreshPicker();
        if (currentProjectId) loadThumbnails(currentProjectId);
      }
    });

    container.addEventListener('click', e => {
      // View tabs
      const tab = e.target.closest('.sim-tab');
      if (tab) {
        activeView = tab.dataset.view;
        container.querySelectorAll('.sim-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        refreshView();
        return;
      }

      // Picker thumbs
      const thumb = e.target.closest('.sim-picker-thumb');
      if (thumb && thumb.dataset.url) {
        selectedUrl = selectedUrl === thumb.dataset.url ? '' : thumb.dataset.url;
        refreshPicker();
        refreshView();
        return;
      }

      // Pagination
      if (e.target.closest('#sim-prev')) { pickerPage = Math.max(0, pickerPage - 1); refreshPicker(); return; }
      if (e.target.closest('#sim-next')) { pickerPage = Math.min(Math.ceil(allThumbnails.length / THUMBS_PER_PAGE) - 1, pickerPage + 1); refreshPicker(); return; }

      // Blur test
      if (e.target.closest('#sim-blur-btn')) {
        document.querySelectorAll('.sim-active-img').forEach(img => {
          img.style.filter = 'blur(10px)';
          setTimeout(() => { img.style.filter = 'none'; }, 600);
        });
        return;
      }
    });

  }

  function refreshView() {
    const viewEl = container.querySelector('#sim-view');
    if (viewEl) viewEl.innerHTML = buildView();
  }

  function refreshAll() {
    render();
    bindEvents();
  }

  // ── Thumbnail loader (async, background) ─────────────────────────────────
  async function loadThumbnails(projectId) {
    try {
      const { data } = await supabase
        .from('thumbnail_variants')
        .select('id, image_url, project_id')
        .eq('project_id', projectId)
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(40);

      if (!container.querySelector('#sim-picker')) return;

      allThumbnails = (data || []).filter(v => v.image_url).map(v => ({ image_url: v.image_url }));
      refreshPicker();
    } catch (err) {
      console.error('Simulator: error loading thumbnails', err);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILE VIEW — iPhone frame with YouTube app inside
  // ═══════════════════════════════════════════════════════════════════════════
  function buildMobileView() {
    const feed = buildMobileFeed();
    return `
      <div class="sim-mobile-wrapper">
        <div class="sim-phone">
          <!-- Physical buttons -->
          <div class="sim-phone-vol-up"></div>
          <div class="sim-phone-vol-down"></div>
          <div class="sim-phone-power"></div>

          <!-- Screen -->
          <div class="sim-phone-screen">
            <!-- Status bar -->
            <div class="sim-status-bar">
              <span class="sim-status-time">9:41</span>
              <div class="sim-status-icons">
                <svg width="15" height="11" viewBox="0 0 15 11" fill="white"><rect x="0" y="4" width="3" height="7" rx="1"/><rect x="4" y="2.5" width="3" height="8.5" rx="1"/><rect x="8" y="1" width="3" height="10" rx="1"/><rect x="12" y="0" width="3" height="11" rx="1"/></svg>
                <svg width="16" height="12" viewBox="0 0 16 12" fill="white" style="margin:0 2px;"><path d="M8 2.4C5.6 2.4 3.4 3.4 1.8 5L0 3.2C2.2 1.2 5 0 8 0s5.8 1.2 8 3.2L14.2 5C12.6 3.4 10.4 2.4 8 2.4z"/><path d="M8 6.4C6.6 6.4 5.4 7 4.6 7.8L2.8 6C4.2 4.8 6 4 8 4s3.8.8 5.2 2L11.4 7.8C10.6 7 9.4 6.4 8 6.4z"/><circle cx="8" cy="11" r="1.5"/></svg>
                <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="white" stroke-opacity=".35"/><rect x="1.5" y="1.5" width="16" height="9" rx="2.5" fill="white"/><path d="M23 4v4a2 2 0 000-4z" fill="white" fill-opacity=".4"/></svg>
              </div>
            </div>

            <!-- Dynamic Island -->
            <div class="sim-dynamic-island"></div>

            <!-- YouTube app chrome -->
            <div class="sim-yt-topbar">
              <svg width="90" height="20" viewBox="0 0 90 20"><path d="M17.5 3.4H2.5A2.5 2.5 0 000 5.9v8.2a2.5 2.5 0 002.5 2.5h15a2.5 2.5 0 002.5-2.5V5.9a2.5 2.5 0 00-2.5-2.5zM8 13.4V6.6l6 3.4-6 3.4z" fill="#FF0000"/><text x="24" y="15" font-family="Arial" font-weight="bold" font-size="13" fill="white">YouTube</text></svg>
              <div style="display:flex;gap:14px;align-items:center;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent-dark));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;">T</div>
              </div>
            </div>

            <!-- Filter chips -->
            <div class="sim-filter-chips">
              ${['Todos','Gaming','Música','Tecnología','Cocina','Finanzas','Noticias'].map((c,i) =>
                `<span class="sim-chip${i===0?' active':''}">  ${c}</span>`
              ).join('')}
            </div>

            <!-- Video feed -->
            <div class="sim-yt-feed">
              ${feed}
            </div>

            <!-- Bottom nav -->
            <div class="sim-yt-bottomnav">
              <div class="sim-nav-item active"><svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span>Inicio</span></div>
              <div class="sim-nav-item"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="2" y="2" width="8" height="13" rx="2"/><rect x="14" y="9" width="8" height="13" rx="2"/></svg><span>Shorts</span></div>
              <div class="sim-nav-item"><div style="width:36px;height:26px;border:2px solid rgba(255,255,255,0.6);border-radius:6px;display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div><span>Crear</span></div>
              <div class="sim-nav-item"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg><span>Suscripciones</span></div>
              <div class="sim-nav-item"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg><span>Biblioteca</span></div>
            </div>
          </div>
        </div>
        <p class="sim-hint">Tu miniatura aparece en posición destacada del feed</p>
      </div>
    `;
  }

  function buildMobileFeed() {
    return YT_DATA.slice(0, 8).map((v, i) => {
      const isActive = i === 1;
      return `
        <div class="sim-mobile-card">
          <div class="sim-mobile-thumb${isActive ? ' sim-active-slot' : ''}">
            ${isActive
              ? (selectedUrl
                  ? `<img src="${selectedUrl}" class="sim-active-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" style="width:100%;height:100%;object-fit:cover;" /><div class="sim-empty-slot" style="display:none;">Tu miniatura</div>`
                  : `<div class="sim-empty-slot">Tu miniatura aquí</div>`)
              : `<img src="${picsumUrl(i)}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />${buildThumbOverlay(v.title, i)}`
            }
            <span class="sim-dur">${v.dur}</span>
          </div>
          <div class="sim-mobile-info">
            <div class="sim-mobile-avatar" style="background-image:url(${picsumUrl(i + 50, 40, 40)});background-size:cover;"></div>
            <div>
              <div class="sim-mobile-title">${isActive ? 'Tu video · título aquí' : v.title}</div>
              <div class="sim-mobile-meta">${isActive ? 'Tu Canal' : `${v.ch} · ${v.views} vistas · ${v.time}`}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DESKTOP VIEW — Full-width YouTube home page
  // ═══════════════════════════════════════════════════════════════════════════
  function buildDesktopView() {
    return `
      <div class="sim-desktop-yt">

        <!-- YT Header -->
        <div class="sim-yt-header">
          <div class="sim-yt-header-left">
            <svg width="24" height="18" viewBox="0 0 24 18" fill="none"><line x1="0" y1="2" x2="24" y2="2" stroke="white" stroke-width="2"/><line x1="0" y1="9" x2="24" y2="9" stroke="white" stroke-width="2"/><line x1="0" y1="16" x2="24" y2="16" stroke="white" stroke-width="2"/></svg>
            <svg width="100" height="22" viewBox="0 0 100 22"><path d="M19.5 4H2.5A2.5 2.5 0 000 6.5v9a2.5 2.5 0 002.5 2.5h17a2.5 2.5 0 002.5-2.5v-9A2.5 2.5 0 0019.5 4zM9 14.5V7.5l7 3.5-7 3.5z" fill="#FF0000"/><text x="27" y="16" font-family="Arial" font-weight="bold" font-size="15" fill="white">YouTube</text></svg>
          </div>
          <div class="sim-yt-searchbar">
            <input class="sim-yt-search-input" placeholder="Buscar" readonly />
            <button class="sim-yt-search-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></button>
            <button class="sim-yt-mic-btn"><svg width="16" height="20" viewBox="0 0 16 20" fill="none"><rect x="4.5" y="0.5" width="7" height="12" rx="3.5" stroke="white" stroke-width="1.5"/><path d="M1.5 9.5a6.5 6.5 0 0013 0" stroke="white" stroke-width="1.5" stroke-linecap="round"/><line x1="8" y1="16" x2="8" y2="19.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg></button>
          </div>
          <div class="sim-yt-header-right">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent-dark));display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:white;cursor:pointer;">T</div>
          </div>
        </div>

        <!-- Filter chips -->
        <div class="sim-yt-chips">
          ${['Todos','Gaming','Música','Tecnología','Diseño','Finanzas','Cocina','Deportes','Noticias','Entretenimiento','Ciencia'].map((c,i)=>
            `<span class="sim-yt-chip${i===0?' active':''}">${c}</span>`
          ).join('')}
        </div>

        <!-- Main grid -->
        <div class="sim-yt-grid">
          ${YT_DATA.map((v, i) => {
            const isActive = i === 0;
            return `
              <div class="sim-yt-card">
                <div class="sim-yt-card-thumb${isActive ? ' sim-active-slot' : ''}">
                  ${isActive
                    ? (selectedUrl
                        ? `<img src="${selectedUrl}" class="sim-active-img" onerror="this.style.display='none'" style="width:100%;height:100%;object-fit:cover;" />`
                        : `<div class="sim-empty-slot sim-empty-slot--sm">Tu miniatura aquí</div>`)
                    : `<img src="${picsumUrl(i)}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />${buildThumbOverlay(v.title, i)}`
                  }
                  <span class="sim-dur">${v.dur}</span>
                </div>
                <div class="sim-yt-card-info">
                  <div class="sim-yt-card-avatar" style="background-image:url(${picsumUrl(i + 50, 40, 40)});background-size:cover;"></div>
                  <div style="flex:1;min-width:0;">
                    <div class="sim-yt-card-title">${isActive ? 'Tu video · título del video' : v.title}</div>
                    <div class="sim-yt-card-meta">${isActive ? 'Tu Canal' : v.ch}</div>
                    <div class="sim-yt-card-meta">${isActive ? '' : `${v.views} vistas · ${v.time}`}</div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SEARCH VIEW — YouTube search results
  // ═══════════════════════════════════════════════════════════════════════════
  function buildSearchView() {
    return `
      <div class="sim-search-yt">

        <!-- YT Header with search active -->
        <div class="sim-yt-header">
          <div class="sim-yt-header-left">
            <svg width="24" height="18" viewBox="0 0 24 18" fill="none"><line x1="0" y1="2" x2="24" y2="2" stroke="white" stroke-width="2"/><line x1="0" y1="9" x2="24" y2="9" stroke="white" stroke-width="2"/><line x1="0" y1="16" x2="24" y2="16" stroke="white" stroke-width="2"/></svg>
            <svg width="100" height="22" viewBox="0 0 100 22"><path d="M19.5 4H2.5A2.5 2.5 0 000 6.5v9a2.5 2.5 0 002.5 2.5h17a2.5 2.5 0 002.5-2.5v-9A2.5 2.5 0 0019.5 4zM9 14.5V7.5l7 3.5-7 3.5z" fill="#FF0000"/><text x="27" y="16" font-family="Arial" font-weight="bold" font-size="15" fill="white">YouTube</text></svg>
          </div>
          <div class="sim-yt-searchbar">
            <input class="sim-yt-search-input" value="miniaturas youtube 2026" readonly style="color:white;" />
            <button class="sim-yt-search-btn" style="background:var(--bg-tertiary);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></button>
          </div>
          <div class="sim-yt-header-right">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent-dark));display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:white;">T</div>
          </div>
        </div>

        <!-- Search filter tabs -->
        <div class="sim-search-filters">
          ${['Todos','Videos','Canales','Listas','Fecha de subida','Tipo','Duración'].map((f,i)=>
            `<span class="sim-search-filter${i===0?' active':''}">${f}</span>`
          ).join('')}
        </div>

        <div style="font-size:11px;color:var(--text-secondary);padding:8px 16px 4px;">Aproximadamente 12.400.000 resultados</div>

        <!-- Search results -->
        <div class="sim-search-results">
          ${YT_DATA.slice(0, 7).map((v, i) => {
            const isActive = i === 0;
            return `
              <div class="sim-search-card${isActive ? ' sim-search-card--active' : ''}">
                <div class="sim-search-thumb${isActive ? ' sim-active-slot' : ''}">
                  ${isActive
                    ? (selectedUrl
                        ? `<img src="${selectedUrl}" class="sim-active-img" onerror="this.style.display='none'" style="width:100%;height:100%;object-fit:cover;" />`
                        : `<div class="sim-empty-slot">Tu miniatura aquí</div>`)
                    : `<img src="${picsumUrl(i)}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />${buildThumbOverlay(v.title, i)}`
                  }
                  <span class="sim-dur">${v.dur}</span>
                </div>
                <div class="sim-search-info">
                  <div class="sim-search-title">${isActive ? 'Tu video · título del video aquí' : v.title}</div>
                  <div class="sim-search-meta">${isActive ? 'Tu Canal' : `${v.views} vistas · ${v.time} · ${v.ch}`}</div>
                  <div class="sim-search-desc">${isActive ? 'Descripción de tu video...' : `${v.ch} te muestra cómo ${v.title.toLowerCase()}. Todo lo que necesitás saber en un solo video.`}</div>
                  <div class="sim-search-channel-row">
                    <div class="sim-search-avatar" style="background-image:url(${picsumUrl(i + 50, 40, 40)});background-size:cover;"></div>
                    <span style="font-size:11px;color:var(--text-secondary);">${isActive ? 'Tu Canal' : v.ch}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  render();
}
