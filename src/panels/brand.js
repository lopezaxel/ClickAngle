import { BRAND_KIT } from '../data/mockData.js';
import { icon } from '../icons.js';

export function renderBrand(container) {
  container.innerHTML = `<div class="animate-in">
    <div class="section-header">
      <div>
        <h2 class="section-title">${icon('palette', 22)} Identidad Visual</h2>
        <p class="section-subtitle">Define tu marca para consistencia en todas las miniaturas</p>
      </div>
      <button class="btn btn-primary btn-sm">${icon('save', 14)} Guardar Cambios</button>
    </div>

    <div class="grid-2" style="grid-template-columns: 1fr 1fr;">
      <div>
        <div class="card mb-md">
          <div class="card-header">
            <div class="card-title">${icon('camera', 16)} Face Vault</div>
            <span class="badge badge-accent">4 Expresiones</span>
          </div>
          <p class="text-sm text-muted mb-md">Sube fotos con diferentes expresiones. La IA seleccionará la mejor según el ángulo elegido.</p>
          <div class="grid-4 mb-md" style="grid-template-columns: repeat(4, 1fr);">
            ${BRAND_KIT.faces.map(f => `
              <div class="card" style="text-align:center; padding: var(--space-md); cursor:pointer;">
                <div style="width:48px;height:48px;border-radius:50%;background:var(--bg-tertiary);border:1px solid var(--border);margin:0 auto var(--space-sm);display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);">${icon('user', 20)}</div>
                <div class="text-xs font-bold">${f.label}</div>
              </div>
            `).join('')}
          </div>
          <div class="upload-zone" style="padding: var(--space-lg);">
            <div style="opacity:0.4;margin-bottom:var(--space-sm);">${icon('upload', 32)}</div>
            <div class="upload-zone-text">Subir nueva expresión</div>
            <div class="upload-zone-hint">PNG, JPG — Fondo transparente recomendado</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">${icon('image', 16)} Logo del Canal</div></div>
          <div class="flex items-center gap-lg">
            <div style="width:80px; height:80px; border-radius: var(--radius-lg); background: linear-gradient(135deg, var(--accent), var(--accent-dark)); display:flex; align-items:center; justify-content:center; color:white; box-shadow: 0 0 30px var(--accent-glow);">
              ${icon('crosshair', 32)}
            </div>
            <div>
              <div style="font-size:14px; font-weight:600; margin-bottom:4px;">ClickAngles Studio</div>
              <div class="text-xs text-muted mb-sm">Logo actual — 512x512px</div>
              <button class="btn btn-secondary btn-sm">${icon('upload', 14)} Cambiar Logo</button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="card mb-md">
          <div class="card-header">
            <div class="card-title">${icon('palette', 16)} Paleta de Colores</div>
            <span class="badge badge-success">Máx. Contraste</span>
          </div>
          <p class="text-sm text-muted mb-md">Colores optimizados para máximo contraste en miniaturas de YouTube (Mobile-first).</p>
          <div class="flex gap-md mb-lg" style="flex-wrap:wrap;">
            ${BRAND_KIT.colors.map(c => `
              <div style="text-align:center;">
                <div class="color-swatch" style="background: ${c}; width:56px; height:56px;"></div>
                <div class="text-xs text-muted mt-sm font-mono">${c}</div>
              </div>
            `).join('')}
            <div style="text-align:center;">
              <div class="color-swatch" style="width:56px; height:56px; display:flex; align-items:center; justify-content:center; background: var(--bg-tertiary); border-style: dashed; color:var(--text-tertiary);">${icon('plus', 16)}</div>
              <div class="text-xs text-muted mt-sm">Añadir</div>
            </div>
          </div>
          <div class="card" style="padding: var(--space-md); background: var(--bg-tertiary);">
            <div class="text-xs font-bold mb-sm text-muted">VISTA PREVIA DE CONTRASTE</div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-sm);">
              <div style="background: #DC2626; color: white; padding: var(--space-md); border-radius: var(--radius-md); text-align:center; font-family: var(--font-impact); font-size: 18px; letter-spacing: 1px;">TEXTO CLARO</div>
              <div style="background: #0A0A0A; color: #10B981; padding: var(--space-md); border-radius: var(--radius-md); text-align:center; font-family: var(--font-impact); font-size: 18px; letter-spacing: 1px;">TEXTO NEÓN</div>
              <div style="background: #F5F5F5; color: #0A0A0A; padding: var(--space-md); border-radius: var(--radius-md); text-align:center; font-family: var(--font-impact); font-size: 18px; letter-spacing: 1px;">ALTO IMPACTO</div>
              <div style="background: linear-gradient(135deg, #DC2626, #B91C1C); color: white; padding: var(--space-md); border-radius: var(--radius-md); text-align:center; font-family: var(--font-impact); font-size: 18px; letter-spacing: 1px;">GRADIENTE</div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">${icon('type', 16)} Tipografía</div></div>
          <div class="form-group">
            <label class="form-label">Fuente de Interfaz</label>
            <div class="card" style="padding: var(--space-md); background: var(--bg-tertiary);">
              <div style="font-family: var(--font-sans); font-size: 24px; font-weight: 700; margin-bottom: var(--space-xs);">Inter — Font Principal</div>
              <div style="font-family: var(--font-sans); font-size: 14px; color: var(--text-secondary);">ABCDEFGHIJKLM abcdefghijklm 0123456789</div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Fuente de Miniaturas</label>
            <div class="card" style="padding: var(--space-md); background: var(--bg-tertiary);">
              <div style="font-family: var(--font-impact); font-size: 28px; letter-spacing: 2px; margin-bottom: var(--space-xs); color: var(--accent-light);">BANGERS — THUMBNAILS</div>
              <div style="font-family: var(--font-impact); font-size: 16px; color: var(--text-secondary); letter-spacing: 1px;">ABCDEFGHIJKLM 0123456789</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}
