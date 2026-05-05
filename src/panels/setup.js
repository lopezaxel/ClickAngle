import { supabase } from '../lib/supabase.js';
import { getState } from '../lib/state.js';
import { signOut } from '../lib/auth.js';
import { icon } from '../icons.js';

export function renderSetup(container) {
  let loading = false;
  let errorMsg = '';

  function render() {
    container.innerHTML = `
    <div class="login-wrapper">
      <div class="login-card animate-in">
        <div class="login-header">
          <div class="login-logo">
            <img src="/logo.png" style="width:56px;height:56px;border-radius:var(--radius-lg);object-fit:cover;" alt="ClickAngles" />
            <div>
              <h1 style="font-size:24px;font-weight:800;margin:0;">ClickAngles</h1>
              <span class="version-badge" style="font-size:10px;">Bienvenido/a</span>
            </div>
          </div>
          <p class="text-sm text-muted" style="margin-top:var(--space-md);text-align:center;">
            Completá tu perfil para comenzar a usar la plataforma
          </p>
        </div>

        ${errorMsg ? `<div class="login-error">${icon('alertTriangle', 14)} ${errorMsg}</div>` : ''}

        <form id="setup-form" class="login-form">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
            <div class="form-group" style="margin:0;">
              <label class="form-label">Nombre</label>
              <input type="text" class="form-input" id="input-nombre" placeholder="Tu nombre" required autocomplete="given-name" />
            </div>
            <div class="form-group" style="margin:0;">
              <label class="form-label">Apellido</label>
              <input type="text" class="form-input" id="input-apellido" placeholder="Tu apellido" required autocomplete="family-name" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Contraseña</label>
            <input type="password" class="form-input" id="input-password" placeholder="Mínimo 6 caracteres" minlength="6" required autocomplete="new-password" />
          </div>
          <div class="form-group">
            <label class="form-label">Confirmar contraseña</label>
            <input type="password" class="form-input" id="input-password2" placeholder="Repetí tu contraseña" minlength="6" required autocomplete="new-password" />
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;padding:var(--space-md);font-size:15px;font-weight:700;" ${loading ? 'disabled' : ''}>
            ${loading
              ? `<span class="animate-pulse">${icon('clock', 16)}</span> Guardando...`
              : `${icon('bolt', 16)} Completar perfil`}
          </button>
        </form>
      </div>
    </div>`;

    container.querySelector('#setup-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nombre   = container.querySelector('#input-nombre').value.trim();
      const apellido = container.querySelector('#input-apellido').value.trim();
      const password = container.querySelector('#input-password').value;
      const password2 = container.querySelector('#input-password2').value;

      if (password !== password2) {
        errorMsg = 'Las contraseñas no coinciden.';
        render();
        return;
      }

      loading = true;
      errorMsg = '';
      render();

      try {
        const { error: pwError } = await supabase.auth.updateUser({ password });
        if (pwError) throw pwError;

        const { currentUser } = getState();
        const fullName = `${nombre} ${apellido}`.trim();

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('id', currentUser.id);
        if (profileError) throw profileError;

        // Cierra la sesión → renderApp muestra el login para que ingrese normalmente
        signOut();

      } catch (err) {
        errorMsg = err.message || 'Error al guardar el perfil. Intentá de nuevo.';
        loading = false;
        render();
      }
    });
  }

  render();
}
