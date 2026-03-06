import { supabase } from '../lib/supabase.js';
import { getState, setState } from '../lib/state.js';
import { icon } from '../icons.js';
import { checkApiKey } from '../lib/intelligence.js';

export async function renderSettings(container) {
  const { currentUser } = getState();
  if (!currentUser) {
    container.innerHTML = '<div class="loading-spinner">Inicia sesión para configurar</div>';
    return;
  }

  // Show a local loader while fetching keys
  container.innerHTML = `<div class="loading-spinner"><span class="animate-pulse">${icon('clock', 24)}</span></div>`;

  // Fetch masked keys via secure RPC
  let maskedKeys = { google_ai_key_masked: '', fal_ai_key_masked: '', google_ai_key_set: false, fal_ai_key_set: false };
  try {
    const { data, error } = await supabase.rpc('get_masked_api_keys');
    if (error) throw error;
    if (data) maskedKeys = data;
  } catch (err) {
    console.error('Error fetching masked keys:', err);
  }

  const googlePlaceholder = (maskedKeys && maskedKeys.google_ai_key_set) ? maskedKeys.google_ai_key_masked : 'AIza...';
  const falPlaceholder = (maskedKeys && maskedKeys.fal_ai_key_set) ? maskedKeys.fal_ai_key_masked : 'fal-...';

  const html = `<div class="animate-in">
    <div class="section-header">
      <div>
        <h2 class="section-title">${icon('cog', 22)} Configuración</h2>
        <p class="section-subtitle">API keys y preferencias del sistema</p>
      </div>
    </div>
    
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <div class="card-title">${icon('key', 16)} API Keys</div>
          <div class="flex items-center gap-xs">
            <span class="badge ${getState().apiKeyStatus === 'connected' ? 'badge-success' : (getState().apiKeyStatus === 'disconnected' ? 'badge-warning' : 'badge-danger')}">
                ${getState().apiKeyStatus === 'connected' ? 'Conectada' : (getState().apiKeyStatus === 'disconnected' ? 'Desconectada' : 'No Vinculada')}
            </span>
            <span class="badge badge-accent">${icon('lock', 12)} Encriptado</span>
          </div>
        </div>
        <p class="text-sm text-muted mb-md">Tus claves se guardan <strong>encriptadas</strong> en la base de datos. Nunca se exponen en texto plano.</p>
        
        <div class="form-group">
          <label class="form-label">Google AI Studio Key</label>
          <input type="password" class="form-input" id="google-key-input" 
            placeholder="${googlePlaceholder}" 
            value=""
            autocomplete="off"
            spellcheck="false"
            data-lpignore="true"
            data-1p-ignore="true" />
          <p class="text-xs text-muted mt-xs">
            ${maskedKeys.google_ai_key_set
      ? `${icon('check', 12)} Clave configurada — dejá el campo vacío para mantenerla, o ingresá una nueva para reemplazarla.`
      : `Obtenla en <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="text-accent">Google AI Studio</a>`}
          </p>
        </div>
        
        <div class="form-group">
          <label class="form-label">Fal.AI Key (opcional)</label>
          <input type="password" class="form-input" id="fal-key-input" 
            placeholder="${falPlaceholder}" 
            value=""
            autocomplete="off"
            spellcheck="false"
            data-lpignore="true"
            data-1p-ignore="true" />
          <p class="text-xs text-muted mt-xs">
            ${maskedKeys.fal_ai_key_set
      ? `${icon('check', 12)} Clave configurada — dejá el campo vacío para mantenerla, o ingresá una nueva para reemplazarla.`
      : 'Opcional — para generación de imágenes avanzada'}
          </p>
        </div>
        
        <div id="save-keys-feedback" style="display:none;" class="mb-md"></div>
        <button class="btn btn-primary btn-sm mt-md" id="btn-save-keys">${icon('save', 14)} Guardar Keys</button>
        
        <div class="text-xs text-muted mt-md" style="padding:var(--space-sm);background:var(--surface-2);border-radius:var(--radius-sm);border:1px solid var(--border);">
          ${icon('lock', 12)} <strong>Seguridad:</strong> Las claves se encriptan con AES-256 antes de almacenarse. 
          Nunca se transmiten ni se muestran en texto plano después de guardarlas.
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <div class="card-title">${icon('sliders', 16)} Preferencias</div>
        </div>
        <div class="form-group">
          <label class="form-label">Tema de Interfaz</label>
          <select class="form-select">
            <option selected>Dark Mode (Default)</option>
            <option disabled>Ultra Dark (Próximamente)</option>
            <option disabled>Glassmorphism (Próximamente)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Idioma</label>
          <select class="form-select">
            <option selected>Español</option>
            <option>English</option>
          </select>
        </div>
      </div>
    </div>
  </div>`;

  container.innerHTML = html;

  const btn = document.getElementById('btn-save-keys');
  if (btn) {
    btn.onclick = async () => {
      const googleVal = document.getElementById('google-key-input').value.trim();
      const falVal = document.getElementById('fal-key-input').value.trim();
      const feedback = document.getElementById('save-keys-feedback');

      const originalHtml = btn.innerHTML;
      btn.innerHTML = `<span class="animate-pulse">${icon('clock', 14)}</span> Encriptando y guardando...`;
      btn.disabled = true;
      feedback.style.display = 'none';

      try {
        const params = {};
        if (googleVal) params.p_google_ai_key = googleVal;
        if (falVal) params.p_fal_ai_key = falVal;

        const { error } = await supabase.rpc('save_user_api_keys', params);
        if (error) throw error;

        // Clear the input fields after saving
        const googleInput = document.getElementById('google-key-input');
        if (googleInput) googleInput.value = '';

        const falInput = document.getElementById('fal-key-input');
        if (falInput) falInput.value = '';

        if (feedback) {
          feedback.style.display = 'block';
          feedback.innerHTML = `<div class="text-xs" style="color:var(--success);">${icon('check', 12)} Claves guardadas. Validando conexión...</div>`;
        }

        if (btn) {
          btn.innerHTML = originalHtml;
          btn.disabled = false;
        }

        // Re-verify key status. This will trigger a global state update and a re-render.
        // We do not await it here so we don't throw errors if elements vanish during its execution.
        checkApiKey();

      } catch (err) {
        console.error('Save keys error:', err);
        feedback.style.display = 'block';
        feedback.innerHTML = `<div class="text-xs" style="color:var(--danger);">${icon('alertTriangle', 12)} Error: ${err.message}</div>`;
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    };
  }
}
