/**
 * ClickAngle — Global Operation Loader
 * Full-panel overlay with tech-styled animation for long async operations.
 * Usage:
 *   showLoader(container, { title, subtitle, detail })
 *   updateLoader({ title, subtitle, detail })   ← update mid-operation
 *   hideLoader()
 */

const LOADER_ID = 'ca-global-loader';

const STYLES = `
  @keyframes ca-spin-cw  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
  @keyframes ca-spin-ccw { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }
  @keyframes ca-pulse-core { 0%,100% { opacity:.5; transform:scale(.85); box-shadow:0 0 12px rgba(220,38,38,.3); }
                             50%      { opacity:1; transform:scale(1.1);  box-shadow:0 0 32px rgba(220,38,38,.7); } }
  @keyframes ca-fade-in  { from { opacity:0; } to { opacity:1; } }
  @keyframes ca-fade-out { from { opacity:1; } to { opacity:0; } }
  @keyframes ca-blink    { 0%,100% { opacity:.2; } 50% { opacity:1; } }
  @keyframes ca-scanline {
    0%   { transform: translateY(-100%); opacity: 0; }
    10%  { opacity: .15; }
    90%  { opacity: .15; }
    100% { transform: translateY(500%); opacity: 0; }
  }
`;

export function ensureLoaderStyles() {
  if (!document.getElementById('ca-loader-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'ca-loader-styles';
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);
  }
}

export function showLoader(container, { title = 'Procesando...', subtitle = '', detail = '' } = {}) {
  hideLoader(false); // remove any existing, no animation

  ensureLoaderStyles();

  // Ensure container is positioned so the absolute overlay fills it
  const pos = window.getComputedStyle(container).position;
  if (pos === 'static') {
    container.style.position = 'relative';
    container.dataset.loaderAddedPosition = 'true';
  }

  const overlay = document.createElement('div');
  overlay.id = LOADER_ID;
  overlay.style.cssText = `
    position: absolute; inset: 0; z-index: 900;
    background: rgba(6, 6, 10, 0.88);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    border-radius: inherit;
    animation: ca-fade-in 0.25s ease forwards;
    overflow: hidden;
  `;

  overlay.innerHTML = `
    <!-- Scanline sweep -->
    <div style="
      position:absolute; inset:0; pointer-events:none; overflow:hidden;
    ">
      <div style="
        position:absolute; left:0; right:0; height:2px;
        background: linear-gradient(90deg, transparent, rgba(220,38,38,.5), transparent);
        animation: ca-scanline 2.4s cubic-bezier(.4,0,.6,1) infinite;
      "></div>
    </div>

    <!-- Corner accents -->
    <div style="position:absolute;top:16px;left:16px;width:24px;height:24px;border-top:2px solid rgba(220,38,38,.5);border-left:2px solid rgba(220,38,38,.5);border-radius:2px 0 0 0;"></div>
    <div style="position:absolute;top:16px;right:16px;width:24px;height:24px;border-top:2px solid rgba(220,38,38,.5);border-right:2px solid rgba(220,38,38,.5);border-radius:0 2px 0 0;"></div>
    <div style="position:absolute;bottom:16px;left:16px;width:24px;height:24px;border-bottom:2px solid rgba(220,38,38,.5);border-left:2px solid rgba(220,38,38,.5);border-radius:0 0 0 2px;"></div>
    <div style="position:absolute;bottom:16px;right:16px;width:24px;height:24px;border-bottom:2px solid rgba(220,38,38,.5);border-right:2px solid rgba(220,38,38,.5);border-radius:0 0 2px 0;"></div>

    <!-- Spinner rings -->
    <div style="position:relative; width:110px; height:110px; margin-bottom:28px; flex-shrink:0;">
      <!-- Track ring -->
      <div style="position:absolute;inset:0;border-radius:50%;border:1px solid rgba(220,38,38,.1);"></div>
      <!-- Ring 1 — slow CW -->
      <div style="position:absolute;inset:0;border-radius:50%;
        border:2px solid transparent;
        border-top-color:#DC2626;
        border-right-color:rgba(220,38,38,.25);
        animation:ca-spin-cw 1.6s linear infinite;"></div>
      <!-- Ring 2 — faster CCW, inset -->
      <div style="position:absolute;inset:12px;border-radius:50%;
        border:2px solid transparent;
        border-bottom-color:#ef4444;
        border-left-color:rgba(239,68,68,.2);
        animation:ca-spin-ccw 1s linear infinite;"></div>
      <!-- Ring 3 — innermost CW -->
      <div style="position:absolute;inset:24px;border-radius:50%;
        border:1px solid transparent;
        border-top-color:rgba(248,113,113,.6);
        border-right-color:rgba(248,113,113,.1);
        animation:ca-spin-cw 0.7s linear infinite;"></div>
      <!-- Core pulse -->
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
        <div style="width:18px;height:18px;border-radius:50%;
          background:radial-gradient(circle, #ef4444, #DC2626);
          animation:ca-pulse-core 1.8s ease-in-out infinite;"></div>
      </div>
    </div>

    <!-- Texts -->
    <div id="${LOADER_ID}-title" style="
      font-size:17px; font-weight:900; color:#fff;
      letter-spacing:1.5px; text-transform:uppercase;
      text-align:center; margin-bottom:10px; padding:0 32px;
      line-height:1.3;
    ">${title}</div>

    <div id="${LOADER_ID}-subtitle" style="
      font-size:12px; color:rgba(255,255,255,.4);
      text-align:center; max-width:320px; line-height:1.6;
      padding:0 24px; min-height:18px;
    ">${subtitle}</div>

    <!-- Detail / progress line -->
    <div style="margin-top:20px; display:flex; align-items:center; gap:8px;">
      <span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:#DC2626;animation:ca-blink 1.1s ease-in-out infinite;"></span>
      <span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:#DC2626;animation:ca-blink 1.1s ease-in-out .3s infinite;"></span>
      <span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:#DC2626;animation:ca-blink 1.1s ease-in-out .6s infinite;"></span>
      <div id="${LOADER_ID}-detail" style="
        font-size:10px; color:#DC2626; font-weight:800;
        letter-spacing:2px; text-transform:uppercase;
        margin-left:4px; min-height:14px;
      ">${detail}</div>
    </div>
  `;

  container.appendChild(overlay);
}

/**
 * Update loader text mid-operation (e.g. progress steps).
 * Only updates the fields that are provided.
 */
export function updateLoader({ title, subtitle, detail } = {}) {
  if (title != null) {
    const el = document.getElementById(`${LOADER_ID}-title`);
    if (el) el.textContent = title;
  }
  if (subtitle != null) {
    const el = document.getElementById(`${LOADER_ID}-subtitle`);
    if (el) el.textContent = subtitle;
  }
  if (detail != null) {
    const el = document.getElementById(`${LOADER_ID}-detail`);
    if (el) el.textContent = detail;
  }
}

/**
 * Hide and remove the loader overlay.
 * @param {boolean} animated - whether to fade out (default true)
 */
export function hideLoader(animated = true) {
  const overlay = document.getElementById(LOADER_ID);
  if (!overlay) return;

  // Restore container position if we added it
  const parent = overlay.parentElement;
  if (parent?.dataset.loaderAddedPosition) {
    parent.style.position = '';
    delete parent.dataset.loaderAddedPosition;
  }

  if (animated) {
    overlay.style.animation = 'ca-fade-out 0.2s ease forwards';
    setTimeout(() => overlay.remove(), 200);
  } else {
    overlay.remove();
  }
}
