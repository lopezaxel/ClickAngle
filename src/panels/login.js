import { signIn, signUp } from '../lib/auth.js';
import { icon } from '../icons.js';

export function renderLogin(container) {
    let mode = 'login'; // 'login' | 'register'
    let loading = false;
    let errorMsg = '';

    function render() {
        container.innerHTML = `
    <div class="login-wrapper">
      <div class="login-card animate-in">
        <div class="login-header">
          <div class="login-logo">
            <div class="logo-icon" style="color:white;width:48px;height:48px;border-radius:var(--radius-lg);background:linear-gradient(135deg, var(--accent), var(--accent-dark));display:flex;align-items:center;justify-content:center;box-shadow:0 0 30px var(--accent-glow);">
              ${icon('crosshair', 24)}
            </div>
            <div>
              <h1 style="font-size:24px;font-weight:800;margin:0;">ClickAngles</h1>
              <span class="version-badge" style="font-size:10px;">v2.0</span>
            </div>
          </div>
          <p class="text-sm text-muted" style="margin-top:var(--space-md);text-align:center;">
            Plataforma de Ingeniería de CTR para Creadores de Contenido
          </p>
        </div>

        <div class="login-tabs">
          <button class="login-tab ${mode === 'login' ? 'active' : ''}" id="tab-login">Iniciar Sesión</button>
          <button class="login-tab ${mode === 'register' ? 'active' : ''}" id="tab-register">Registrarse</button>
        </div>

        ${errorMsg ? `<div class="login-error">${icon('alertTriangle', 14)} ${errorMsg}</div>` : ''}

        <form id="auth-form" class="login-form">
          ${mode === 'register' ? `
            <div class="form-group">
              <label class="form-label">Nombre Completo</label>
              <input type="text" class="form-input" id="input-name" placeholder="Tu nombre" required />
            </div>
          ` : ''}
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="input-email" placeholder="tu@email.com" required />
          </div>
          <div class="form-group">
            <label class="form-label">Contraseña</label>
            <input type="password" class="form-input" id="input-password" placeholder="••••••••" minlength="6" required />
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;padding:var(--space-md);font-size:15px;font-weight:700;" ${loading ? 'disabled' : ''}>
            ${loading ? `<span class="animate-pulse">${icon('clock', 16)}</span> ${mode === 'login' ? 'Ingresando...' : 'Registrando...'}` :
                `${icon(mode === 'login' ? 'bolt' : 'user', 16)} ${mode === 'login' ? 'Ingresar' : 'Crear Cuenta'}`}
          </button>
        </form>

        <div class="text-xs text-muted" style="text-align:center;margin-top:var(--space-lg);">
          ${mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}
          <a href="#" id="switch-mode" style="color:var(--accent-light);text-decoration:none;font-weight:600;">
            ${mode === 'login' ? 'Registrate' : 'Iniciá sesión'}
          </a>
        </div>
      </div>
    </div>`;

        // Bind events
        document.getElementById('tab-login')?.addEventListener('click', () => { mode = 'login'; errorMsg = ''; render(); });
        document.getElementById('tab-register')?.addEventListener('click', () => { mode = 'register'; errorMsg = ''; render(); });
        document.getElementById('switch-mode')?.addEventListener('click', (e) => {
            e.preventDefault();
            mode = mode === 'login' ? 'register' : 'login';
            errorMsg = '';
            render();
        });

        document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('input-email').value;
            const password = document.getElementById('input-password').value;

            loading = true;
            errorMsg = '';
            render();

            try {
                if (mode === 'login') {
                    await signIn(email, password);
                } else {
                    const fullName = document.getElementById('input-name')?.value || '';
                    await signUp(email, password, fullName);
                }
                // Auth state change handler in main.js will handle the redirect
            } catch (err) {
                errorMsg = err.message || 'Error de autenticación';
                loading = false;
                render();
            }
        });
    }

    render();
}
