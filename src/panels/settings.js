import { supabase } from '../lib/supabase.js';
import { getState, setState } from '../lib/state.js';
import { icon } from '../icons.js';
import { checkApiKey } from '../lib/intelligence.js';

export function renderSettings(container) {
  const { currentUser } = getState();
  if (!currentUser) {
    container.innerHTML = '<div class="loading-spinner">Inicia sesión para configurar</div>';
    return;
  }

  // RENDER IMMEDIATELY (synchronous) with a placeholder for the key field
  // Then fetch the masked key in the background — avoids the 8s Panel Render Timeout
  renderSettingsUI(container, null);

  // Fire-and-forget: fetch real key data in background (never blocks the router)
  supabase.rpc('get_masked_api_keys').then(({ data, error }) => {
    if (!error && data) {
      renderSettingsUI(container, data);
    }
  }).catch(err => console.error('Error fetching masked keys:', err));
}

function renderSettingsUI(container, maskedKeys) {
  const googlePlaceholder = (maskedKeys?.google_ai_key_set) ? maskedKeys.google_ai_key_masked : 'AIza...';
  const keyStatus = maskedKeys?.google_ai_key_set;


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
            ${keyStatus
      ? `${icon('check', 12)} Clave configurada — dejá el campo vacío para mantenerla, o ingresá una nueva para reemplazarla.`
      : `Obtenla en <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="text-accent">Google AI Studio</a>`}
          </p>
        </div>
        
        </div>
        
        <div id="save-keys-feedback" style="display:none;" class="mb-md"></div>
        <div class="flex gap-sm mt-md">
          <button class="btn btn-primary btn-sm" id="btn-save-keys">
            ${icon('save', 14)} Guardar Keys
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-test-keys">
            ${icon('refresh', 14)} Testear Conexión
          </button>
        </div>
        
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
      const googleVal = document.getElementById('google-key-input')?.value.trim() || '';
      const feedback = document.getElementById('save-keys-feedback');

      const originalHtml = btn.innerHTML;
      btn.innerHTML = `<span class="animate-pulse">${icon('clock', 14)}</span> Encriptando y guardando...`;
      btn.disabled = true;
      if (feedback) feedback.style.display = 'none';

      try {
        const params = {};
        if (googleVal) params.p_google_ai_key = googleVal;
        
        // Only run RPC if there's actually something to save
        if (Object.keys(params).length > 0) {
          const { error } = await supabase.rpc('save_user_api_keys', params);
          if (error) throw error;
        }

        // Clear the input fields after saving
        const googleInput = document.getElementById('google-key-input');
        if (googleInput) googleInput.value = '';

        if (feedback) {
          feedback.style.display = 'block';
          feedback.innerHTML = `<div class="text-xs" style="color:var(--accent);"><span class="animate-pulse">${icon('clock', 12)}</span> Claves guardadas en DB. Validando conexión con Google...</div>`;
        }

        const isValid = await checkApiKey();

        if (isValid) {
            if (feedback) {
              feedback.innerHTML = `<div class="card" style="border-left: 3px solid var(--success); background: rgba(16, 185, 129, 0.05); padding: var(--space-sm) var(--space-md);">
                <div class="text-xs" style="color:var(--success); font-weight:700;">${icon('check', 14)} ¡Conexión exitosa!</div>
                <div class="text-xs text-muted">Google AI está vinculado y listo para procesar tus guiones.</div>
              </div>`;
            }
            // Re-render settings after a short delay to update placeholders
            setTimeout(() => {
              const { data } = supabase.rpc('get_masked_api_keys').then(r => {
                if (!r.error && r.data) renderSettingsUI(container, r.data);
              });
            }, 2000);
        } else {
            if (feedback) {
              feedback.innerHTML = `<div class="card" style="border-left: 3px solid var(--danger); background: rgba(220, 38, 38, 0.05); padding: var(--space-sm) var(--space-md);">
                <div class="text-xs" style="color:var(--danger); font-weight:700;">${icon('alertTriangle', 14)} La validación falló</div>
                <div class="text-xs text-muted">Asegúrate de que la API Key sea correcta y tenga habilitado el servicio Gemini API en Google Cloud.</div>
              </div>`;
            }
        }

        if (btn) {
          btn.innerHTML = originalHtml;
          btn.disabled = false;
        }

      } catch (err) {
        console.error('Save keys error:', err);
        if (feedback) {
          feedback.style.display = 'block';
          feedback.innerHTML = `<div class="text-xs" style="color:var(--danger);">${icon('alertTriangle', 12)} Error al guardar: ${err.message}</div>`;
        }
        if (btn) {
          btn.innerHTML = originalHtml;
          btn.disabled = false;
        }
      }
    };
  }

  // Handle Test Connection
  const testBtn = document.getElementById('btn-test-keys');
  if (testBtn) {
    testBtn.onclick = async () => {
      const originalHtml = testBtn.innerHTML;
      const feedback = document.getElementById('save-keys-feedback');
      
      testBtn.innerHTML = `<span class="animate-pulse">${icon('clock', 14)}</span> Testeando...`;
      testBtn.disabled = true;
      feedback.style.display = 'block';
      feedback.innerHTML = `<div class="text-xs" style="color:var(--accent);"><span class="animate-pulse">${icon('clock', 12)}</span> Verificando estado actual...</div>`;

      const isValid = await checkApiKey();
      
      if (isValid) {
        feedback.innerHTML = `<div class="card" style="border-left: 3px solid var(--success); background: rgba(16, 185, 129, 0.05); padding: var(--space-sm) var(--space-md);">
          <div class="text-xs" style="color:var(--success); font-weight:700;">${icon('check', 14)} Conexión activa</div>
          <div class="text-xs text-muted">Todo funciona correctamente. Google AI está respondiendo.</div>
        </div>`;
      } else {
        feedback.innerHTML = `<div class="card" style="border-left: 3px solid var(--danger); background: rgba(220, 38, 38, 0.05); padding: var(--space-sm) var(--space-md);">
          <div class="text-xs" style="color:var(--danger); font-weight:700;">${icon('alertTriangle', 14)} No hay conexión</div>
          <div class="text-xs text-muted">No pudimos comunicarnos con Google AI. Verifica tu clave o tu conexión a internet.</div>
        </div>`;
      }
      
      testBtn.innerHTML = originalHtml;
      testBtn.disabled = false;
    };
  }
}
