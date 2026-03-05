import { createChannel } from '../lib/auth.js';
import { icon } from '../icons.js';

export function renderEmptyState(container) {
  // Reset container style in case a router transition was in progress
  container.style.opacity = '1';
  container.style.transform = 'none';
  container.style.transition = 'none';

  container.innerHTML = `
  <div class="animate-in" style="display:flex;align-items:center;justify-content:center;min-height:60vh;">
    <div style="text-align:center;max-width:480px;">
      <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg, var(--accent), var(--accent-dark));display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-lg);box-shadow:0 0 40px var(--accent-glow);">
        ${icon('crosshair', 36)}
      </div>
      <h2 style="font-size:24px;font-weight:800;margin-bottom:var(--space-sm);">¡Bienvenido a ClickAngles!</h2>
      <p class="text-muted" style="margin-bottom:var(--space-xl);line-height:1.6;">
        Creá tu primer canal para empezar a diseñar miniaturas de alto impacto con ángulos psicológicos.
      </p>
      
      <div class="card" style="text-align:left;max-width:400px;margin:0 auto;">
        <div class="card-title mb-md">${icon('plus', 16)} Crear Canal</div>
        <form id="create-channel-form">
          <div class="form-group">
            <label class="form-label">Nombre del Canal</label>
            <input type="text" class="form-input" id="channel-name" placeholder="Ej: Mi Canal Tech" required />
          </div>
          <div class="form-group">
            <label class="form-label">Handle de YouTube (opcional)</label>
            <input type="text" class="form-input" id="channel-handle" placeholder="@micanal" />
          </div>
          <div class="form-group">
            <label class="form-label">Nicho</label>
            <select class="form-select" id="channel-niche">
              <option value="Tech/IA" selected>Tech/IA</option>
              <option value="Gaming">Gaming</option>
              <option value="Educación">Educación</option>
              <option value="Entretenimiento">Entretenimiento</option>
              <option value="Lifestyle">Lifestyle</option>
              <option value="Negocios">Negocios</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;" id="btn-create-channel">
            ${icon('rocket', 16)} Crear Canal
          </button>
        </form>
      </div>
    </div>
  </div>`;

  document.getElementById('create-channel-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('channel-name').value;
    const handle = document.getElementById('channel-handle').value;
    const niche = document.getElementById('channel-niche').value;
    const btn = document.getElementById('btn-create-channel');

    btn.disabled = true;
    btn.innerHTML = `<span class="animate-pulse">${icon('clock', 16)}</span> Creando...`;

    try {
      await createChannel(name, handle, niche);
      // State change will trigger re-render via main.js
    } catch (err) {
      alert('Error al crear canal: ' + err.message);
      btn.disabled = false;
      btn.innerHTML = `${icon('rocket', 16)} Crear Canal`;
    }
  });
}
