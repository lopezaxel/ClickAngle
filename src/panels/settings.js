import { supabase } from '../lib/supabase.js';
import { getState, setState } from '../lib/state.js';
import { icon } from '../icons.js';

export async function renderSettings(container) {
    const { currentUser } = getState();
    if (!currentUser) {
        container.innerHTML = '<div class="loading-spinner">Inicia sesión para configurar</div>';
        return;
    }

    container.innerHTML = `<div class="loading-spinner"><span class="animate-pulse">${icon('clock', 24)}</span></div>`;

    // Fetch current profile for keys
    const { data: profile } = await supabase
        .from('profiles')
        .select('google_ai_key, fal_ai_key')
        .eq('id', currentUser.id)
        .single();

    const googleKey = profile?.google_ai_key || '';
    const falKey = profile?.fal_ai_key || '';

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
          <span class="badge badge-accent">Seguro</span>
        </div>
        <p class="text-sm text-muted mb-md">Estas llaves se guardan en tu perfil y se usan para la generación de imágenes e IA.</p>
        
        <div class="form-group">
          <label class="form-label">Google AI Studio Key</label>
          <div style="position:relative;">
            <input type="password" class="form-input" id="google-key-input" placeholder="AIza..." value="${googleKey}" />
            <button class="btn-toggle-pass" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-tertiary);">${icon('eye', 16)}</button>
          </div>
          <p class="text-xs text-muted mt-xs">Obtenla en <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-accent">Google AI Studio</a></p>
        </div>
        
        <div class="form-group">
          <label class="form-label">Fal.AI Key (opcional)</label>
          <input type="password" class="form-input" id="fal-key-input" placeholder="fal-..." value="${falKey}" />
        </div>
        
        <button class="btn btn-primary btn-sm mt-md" id="btn-save-keys">${icon('save', 14)} Guardar Keys</button>
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

    // Toggle password visibility
    container.querySelectorAll('.btn-toggle-pass').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            const isPass = input.type === 'password';
            input.type = isPass ? 'text' : 'password';
            btn.innerHTML = isPass ? icon('eyeOff', 16) : icon('eye', 16);
        });
    });

    // Save logic
    document.getElementById('btn-save-keys')?.addEventListener('click', async () => {
        const googleVal = document.getElementById('google-key-input').value;
        const falVal = document.getElementById('fal-key-input').value;
        const btn = document.getElementById('btn-save-keys');

        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<span class="animate-pulse">${icon('clock', 14)}</span> Guardando...`;
        btn.disabled = true;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    google_ai_key: googleVal,
                    fal_ai_key: falVal
                })
                .eq('id', currentUser.id);

            if (error) throw error;

            alert('¡Configuración guardada correctamente!');
        } catch (err) {
            alert('Error al guardar: ' + err.message);
        } finally {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    });
}
