/**
 * ClickAngle Toast Notification System
 * Replaces native browser alert() / confirm() with branded UI.
 */

function ensureContainer() {
    let container = document.getElementById('ca-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'ca-toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
    return container;
}

const ICONS = {
    success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
};

const COLORS = {
    success: { border: '#10b981', icon: '#10b981', bar: '#10b981' },
    error:   { border: '#ef4444', icon: '#ef4444', bar: '#ef4444' },
    info:    { border: '#818cf8', icon: '#818cf8', bar: '#818cf8' },
    warning: { border: '#f59e0b', icon: '#f59e0b', bar: '#f59e0b' },
};

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {number} duration ms (0 = no auto-dismiss)
 */
export function toast(message, type = 'info', duration = 3500) {
    const container = ensureContainer();
    const colors = COLORS[type] || COLORS.info;
    const iconSvg = ICONS[type] || ICONS.info;

    const el = document.createElement('div');
    el.style.cssText = `
        pointer-events: all;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        background: #0f0f14;
        border: 1px solid ${colors.border}55;
        border-left: 3px solid ${colors.border};
        border-radius: 10px;
        padding: 12px 16px;
        min-width: 260px;
        max-width: 380px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03);
        transform: translateX(120%);
        transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease;
        opacity: 0;
        position: relative;
        overflow: hidden;
    `;

    el.innerHTML = `
        <div style="color:${colors.icon}; flex-shrink:0; margin-top:1px;">${iconSvg}</div>
        <div style="font-size:13px; color:#e2e8f0; line-height:1.45; flex:1;">${message}</div>
        <button style="background:none;border:none;color:#64748b;cursor:pointer;padding:0;flex-shrink:0;line-height:1;font-size:16px;margin-top:-1px;" class="ca-toast-close">×</button>
        ${duration > 0 ? `<div class="ca-toast-bar" style="position:absolute;bottom:0;left:0;height:2px;background:${colors.bar};width:100%;transform-origin:left;"></div>` : ''}
    `;

    container.appendChild(el);

    // Animate in
    requestAnimationFrame(() => {
        el.style.transform = 'translateX(0)';
        el.style.opacity = '1';
    });

    // Animate progress bar
    const bar = el.querySelector('.ca-toast-bar');
    if (bar && duration > 0) {
        bar.style.transition = `transform ${duration}ms linear`;
        requestAnimationFrame(() => { bar.style.transform = 'scaleX(0)'; });
    }

    const dismiss = () => {
        el.style.transform = 'translateX(120%)';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
    };

    el.querySelector('.ca-toast-close')?.addEventListener('click', dismiss);
    if (duration > 0) setTimeout(dismiss, duration);

    return dismiss;
}

/**
 * Branded confirm dialog — replaces native confirm().
 * Returns a Promise<boolean>.
 */
export function confirmDialog(message, { title = 'Confirmar acción', confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false } = {}) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 99998;
            background: rgba(0,0,0,0.7);
            display: flex; align-items: center; justify-content: center;
            backdrop-filter: blur(4px);
            animation: caFadeIn 0.15s ease;
        `;

        overlay.innerHTML = `
            <style>
                @keyframes caFadeIn { from { opacity:0; } to { opacity:1; } }
                @keyframes caSlideUp { from { transform:translateY(16px); opacity:0; } to { transform:translateY(0); opacity:1; } }
            </style>
            <div style="
                background: #0f0f14;
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 14px;
                padding: 28px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 24px 64px rgba(0,0,0,0.7);
                animation: caSlideUp 0.2s cubic-bezier(0.34,1.56,0.64,1);
            ">
                <div style="font-size:15px; font-weight:700; color:#f1f5f9; margin-bottom:10px;">${title}</div>
                <div style="font-size:13px; color:#94a3b8; line-height:1.6; margin-bottom:24px; white-space:pre-line;">${message}</div>
                <div style="display:flex; gap:10px; justify-content:flex-end;">
                    <button id="ca-confirm-cancel" style="
                        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
                        color: #94a3b8; border-radius: 8px; padding: 8px 18px;
                        font-size: 13px; font-weight: 600; cursor: pointer;
                    ">${cancelLabel}</button>
                    <button id="ca-confirm-ok" style="
                        background: ${danger ? '#dc2626' : '#6366f1'}; border: none;
                        color: white; border-radius: 8px; padding: 8px 18px;
                        font-size: 13px; font-weight: 700; cursor: pointer;
                        box-shadow: 0 4px 12px ${danger ? 'rgba(220,38,38,0.4)' : 'rgba(99,102,241,0.4)'};
                    ">${confirmLabel}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const resolve_and_remove = (val) => {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.15s';
            setTimeout(() => overlay.remove(), 150);
            resolve(val);
        };

        overlay.querySelector('#ca-confirm-cancel').addEventListener('click', () => resolve_and_remove(false));
        overlay.querySelector('#ca-confirm-ok').addEventListener('click', () => resolve_and_remove(true));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) resolve_and_remove(false); });
    });
}

/**
 * Branded input dialog — replaces native prompt().
 * Returns Promise<string|null>
 */
export function inputDialog(message, { title = 'Editar', defaultValue = '', placeholder = '', confirmLabel = 'Guardar' } = {}) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 99998;
            background: rgba(0,0,0,0.7);
            display: flex; align-items: center; justify-content: center;
            backdrop-filter: blur(4px);
            animation: caFadeIn 0.15s ease;
        `;

        overlay.innerHTML = `
            <style>
                @keyframes caFadeIn { from { opacity:0; } to { opacity:1; } }
                @keyframes caSlideUp { from { transform:translateY(16px); opacity:0; } to { transform:translateY(0); opacity:1; } }
            </style>
            <div style="
                background: #0f0f14;
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 14px;
                padding: 28px;
                max-width: 420px;
                width: 90%;
                box-shadow: 0 24px 64px rgba(0,0,0,0.7);
                animation: caSlideUp 0.2s cubic-bezier(0.34,1.56,0.64,1);
            ">
                <div style="font-size:15px; font-weight:700; color:#f1f5f9; margin-bottom:6px;">${title}</div>
                <div style="font-size:13px; color:#94a3b8; margin-bottom:16px;">${message}</div>
                <input id="ca-input-field" type="text" value="${defaultValue.replace(/"/g, '&quot;')}" placeholder="${placeholder}"
                    style="width:100%; box-sizing:border-box; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12);
                    color:#f1f5f9; border-radius:8px; padding:10px 14px; font-size:14px; outline:none; margin-bottom:20px;
                    transition: border-color 0.15s;" />
                <div style="display:flex; gap:10px; justify-content:flex-end;">
                    <button id="ca-input-cancel" style="
                        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
                        color: #94a3b8; border-radius: 8px; padding: 8px 18px;
                        font-size: 13px; font-weight: 600; cursor: pointer;
                    ">Cancelar</button>
                    <button id="ca-input-ok" style="
                        background: #6366f1; border: none;
                        color: white; border-radius: 8px; padding: 8px 18px;
                        font-size: 13px; font-weight: 700; cursor: pointer;
                        box-shadow: 0 4px 12px rgba(99,102,241,0.4);
                    ">${confirmLabel}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const input = overlay.querySelector('#ca-input-field');
        input.focus();
        input.select();
        input.addEventListener('focus', () => { input.style.borderColor = '#6366f1'; });
        input.addEventListener('blur', () => { input.style.borderColor = 'rgba(255,255,255,0.12)'; });

        const resolve_and_remove = (val) => {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.15s';
            setTimeout(() => overlay.remove(), 150);
            resolve(val);
        };

        overlay.querySelector('#ca-input-cancel').addEventListener('click', () => resolve_and_remove(null));
        overlay.querySelector('#ca-input-ok').addEventListener('click', () => resolve_and_remove(input.value.trim() || null));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') resolve_and_remove(input.value.trim() || null);
            if (e.key === 'Escape') resolve_and_remove(null);
        });
        overlay.addEventListener('click', (e) => { if (e.target === overlay) resolve_and_remove(null); });
    });
}
