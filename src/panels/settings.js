import { supabase } from '../lib/supabase.js';
import { getState, setState } from '../lib/state.js';
import { icon } from '../icons.js';
import { checkApiKey } from '../lib/intelligence.js';
import { renderADNSection, renderFaceVaultSection, renderGaleriaSection } from './brand.js';

export function renderSettings(container) {
  const { currentUser } = getState();
  if (!currentUser) {
    container.innerHTML = '<div class="loading-spinner">Inicia sesión para configurar</div>';
    return;
  }

  renderSettingsUI(container, null);

  supabase.rpc('get_masked_api_keys').then(({ data, error }) => {
    if (!error && data) {
      renderSettingsUI(container, data);
    }
  }).catch(err => console.error('Error fetching masked keys:', err));
}

function renderSettingsUI(container, maskedKeys) {
  const { currentUser } = getState();
  const isAdmin = currentUser?.role === 'admin';
  const googlePlaceholder = (maskedKeys?.google_ai_key_set) ? maskedKeys.google_ai_key_masked : 'AIza...';
  const keyStatus = maskedKeys?.google_ai_key_set;

  const apiKeyStatusClass = getState().apiKeyStatus === 'connected' ? 'badge-success' : (getState().apiKeyStatus === 'disconnected' ? 'badge-warning' : 'badge-danger');
  const apiKeyStatusLabel = getState().apiKeyStatus === 'connected' ? 'Conectada' : (getState().apiKeyStatus === 'disconnected' ? 'Desconectada' : 'No Vinculada');

  const html = `<div class="animate-in">
    <div class="section-header">
      <div>
        <h2 class="section-title">${icon('cog', 22)} Configuración</h2>
        <p class="section-subtitle">API key e identidad de marca del canal</p>
      </div>
    </div>

    <div class="settings-accordions">

      <!-- 1. Google AI Key -->
      <details class="settings-accordion">
        <summary class="settings-accordion-header">
          <span class="settings-accordion-lead">${icon('key', 16)}<span>Google AI Key</span></span>
          <span id="api-key-status-badge" class="badge ${apiKeyStatusClass}" style="font-size:10px;">${apiKeyStatusLabel}</span>
          <span class="settings-accordion-chevron">${icon('chevronDown', 14)}</span>
        </summary>
        <div class="settings-accordion-body">
          <div class="card" style="max-width:600px;">
            <p class="text-sm text-muted mb-md">Tus claves se guardan <strong>encriptadas</strong> en la base de datos. Nunca se exponen en texto plano.</p>
            <div class="form-group">
              <label class="form-label">Google AI Studio Key</label>
              <input type="password" class="form-input" id="google-key-input"
                placeholder="${googlePlaceholder}"
                value=""
                autocomplete="off" spellcheck="false" data-lpignore="true" data-1p-ignore="true" />
              <p class="text-xs text-muted mt-xs">
                ${keyStatus
                  ? `${icon('check', 12)} Clave configurada — dejá el campo vacío para mantenerla, o ingresá una nueva para reemplazarla.`
                  : `Obtenla en <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="text-accent">Google AI Studio</a>`}
              </p>
            </div>
            <div id="save-keys-feedback" style="display:none;" class="mb-md"></div>
            <div class="flex gap-sm mt-md">
              <button class="btn btn-primary btn-sm" id="btn-save-keys">${icon('save', 14)} Guardar Keys</button>
              <button class="btn btn-secondary btn-sm" id="btn-test-keys">${icon('refresh', 14)} Testear Conexión</button>
            </div>
            <div class="text-xs text-muted mt-md" style="padding:var(--space-sm);background:var(--bg-tertiary);border-radius:var(--radius-sm);border:1px solid var(--border);">
              ${icon('lock', 12)} <strong>Seguridad:</strong> Las claves se encriptan con AES-256. Nunca se transmiten ni se muestran en texto plano.
            </div>
          </div>
        </div>
      </details>

      <!-- 2. ADN Estratégico -->
      <details class="settings-accordion">
        <summary class="settings-accordion-header">
          <span class="settings-accordion-lead">${icon('brain', 16)}<span>ADN Estratégico</span></span>
          <span class="settings-accordion-desc">De qué trata el canal</span>
          <span class="settings-accordion-chevron">${icon('chevronDown', 14)}</span>
        </summary>
        <div class="settings-accordion-body" id="section-adn"></div>
      </details>

      <!-- 3. Face Vault -->
      <details class="settings-accordion">
        <summary class="settings-accordion-header">
          <span class="settings-accordion-lead">${icon('camera', 16)}<span>Face Vault</span></span>
          <span class="settings-accordion-desc">Expresiones del creador</span>
          <span class="settings-accordion-chevron">${icon('chevronDown', 14)}</span>
        </summary>
        <div class="settings-accordion-body" id="section-face-vault"></div>
      </details>

      <!-- 4. Galería de Éxitos -->
      <details class="settings-accordion">
        <summary class="settings-accordion-header">
          <span class="settings-accordion-lead">${icon('star', 16)}<span>Galería de Éxitos</span></span>
          <span class="settings-accordion-desc">Miniaturas exitosas del canal</span>
          <span class="settings-accordion-chevron">${icon('chevronDown', 14)}</span>
        </summary>
        <div class="settings-accordion-body" id="section-galeria"></div>
      </details>

    </div>

    ${isAdmin ? `
    <!-- ADMIN: Gestión de Usuarios -->
    <div style="margin-top:var(--space-xl);">
      <div class="section-header" style="margin-bottom:var(--space-md);">
        <div>
          <h3 style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;color:#f59e0b;">
            ${icon('user', 16)} Gestión de Usuarios <span style="font-size:10px;background:rgba(245,158,11,0.2);color:#f59e0b;padding:2px 8px;border-radius:4px;font-weight:700;">ADMIN</span>
          </h3>
          <p class="section-subtitle">Crear, bloquear o eliminar usuarios de la plataforma</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-open-create-user" style="background:#f59e0b;border-color:#f59e0b;">
          ${icon('user', 14)} Crear Usuario
        </button>
      </div>

      <!-- Create User Modal (hidden by default) -->
      <div id="create-user-modal" style="display:none;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-lg);margin-bottom:var(--space-lg);">
        <h4 style="margin-bottom:var(--space-md);font-size:14px;">Nuevo Usuario</h4>
        <div class="grid-2" style="gap:var(--space-md);margin-bottom:var(--space-md);">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="new-user-email" placeholder="usuario@email.com" />
          </div>
          <div class="form-group">
            <label class="form-label">Duración del acceso</label>
            <select class="form-select" id="new-user-duration">
              <option value="7days">7 días</option>
              <option value="14days">14 días</option>
              <option value="1month" selected>1 mes</option>
              <option value="2months">2 meses</option>
              <option value="3months">3 meses</option>
              <option value="forever">Para siempre</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Rol</label>
            <select class="form-select" id="new-user-role">
              <option value="user" selected>Usuario (cliente)</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
        <div id="create-user-feedback" style="display:none;margin-bottom:var(--space-md);"></div>
        <div class="flex gap-sm">
          <button class="btn btn-primary btn-sm" id="btn-confirm-create-user" style="background:#f59e0b;border-color:#f59e0b;">${icon('user', 14)} Crear y Generar Link</button>
          <button class="btn btn-ghost btn-sm" id="btn-cancel-create-user">Cancelar</button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="card" id="users-table-container">
        <div style="display:flex;align-items:center;gap:10px;color:rgba(255,255,255,0.3);padding:20px;">
          <div class="loader" style="width:16px;height:16px;border-width:2px"></div> Cargando usuarios...
        </div>
      </div>
    </div>
    ` : ''}
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

  // ---- ADMIN: User Management ----
  if (isAdmin) {
    loadUsersTable();

    document.getElementById('btn-open-create-user')?.addEventListener('click', () => {
      const modal = document.getElementById('create-user-modal');
      if (modal) modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('btn-cancel-create-user')?.addEventListener('click', () => {
      document.getElementById('create-user-modal').style.display = 'none';
      document.getElementById('create-user-feedback').style.display = 'none';
    });

    document.getElementById('btn-confirm-create-user')?.addEventListener('click', async () => {
      const email = document.getElementById('new-user-email')?.value.trim();
      const duration_type = document.getElementById('new-user-duration')?.value;
      const role = document.getElementById('new-user-role')?.value;
      const feedback = document.getElementById('create-user-feedback');
      const btn = document.getElementById('btn-confirm-create-user');

      if (!email) {
        feedback.style.display = 'block';
        feedback.innerHTML = `<div class="text-xs" style="color:var(--danger);">Ingresá un email válido.</div>`;
        return;
      }

      const originalHtml = btn.innerHTML;
      btn.innerHTML = `<span class="animate-pulse">${icon('clock', 14)}</span> Creando...`;
      btn.disabled = true;
      feedback.style.display = 'block';
      feedback.innerHTML = `<div class="text-xs" style="color:var(--accent);">Creando usuario y generando link de acceso...</div>`;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(
          `https://ahbrflukfncghlyscogq.supabase.co/functions/v1/invite-user`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ email, duration_type, role })
          }
        );
        const result = await response.json();
        if (!response.ok || result.error) throw new Error(result.error || 'Error desconocido');

        feedback.innerHTML = `
          <div class="card" style="border-left:3px solid var(--success);background:rgba(16,185,129,0.05);padding:var(--space-md);">
            <div class="text-xs" style="color:var(--success);font-weight:700;margin-bottom:8px;">${icon('check', 14)} Usuario creado exitosamente</div>
            ${result.magic_link ? `
              <div class="text-xs text-muted" style="margin-bottom:6px;">Link de acceso (válido por 1 hora):</div>
              <div style="background:var(--surface-3);padding:8px;border-radius:6px;word-break:break-all;font-size:10px;font-family:monospace;color:var(--text-secondary);">${result.magic_link}</div>
              <button class="btn btn-secondary btn-sm" style="margin-top:8px;font-size:11px;" onclick="navigator.clipboard.writeText('${result.magic_link}').then(()=>this.innerHTML='¡Copiado!')">
                ${icon('copy', 12)} Copiar link
              </button>
            ` : '<div class="text-xs text-muted">El usuario fue creado. Generá un link manualmente desde Supabase si es necesario.</div>'}
          </div>`;

        document.getElementById('new-user-email').value = '';
        loadUsersTable();

      } catch (err) {
        feedback.innerHTML = `<div class="text-xs" style="color:var(--danger);">${icon('alertTriangle', 12)} Error: ${err.message}</div>`;
      } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    });
  }

  // Keep API key badge in sync — handles race between render and checkApiKey resolution
  const syncApiBadge = () => {
    const el = container.querySelector('#api-key-status-badge');
    if (!el) return;
    const s = getState().apiKeyStatus;
    el.className = `badge ${s === 'connected' ? 'badge-success' : s === 'disconnected' ? 'badge-warning' : 'badge-danger'}`;
    el.textContent = s === 'connected' ? 'Conectada' : s === 'disconnected' ? 'Desconectada' : 'No Vinculada';
  };
  syncApiBadge();
  checkApiKey().then(syncApiBadge);

  // Initialize brand kit accordion sections
  const { activeChannelId } = getState();
  if (activeChannelId) {
    const adnSection = container.querySelector('#section-adn');
    const faceSection = container.querySelector('#section-face-vault');
    const galeriaSection = container.querySelector('#section-galeria');
    if (adnSection) renderADNSection(adnSection, activeChannelId);
    if (faceSection) renderFaceVaultSection(faceSection, activeChannelId);
    if (galeriaSection) renderGaleriaSection(galeriaSection, activeChannelId);
  }
}

async function loadUsersTable() {
  const tableContainer = document.getElementById('users-table-container');
  if (!tableContainer) return;

  const { data: users, error } = await supabase.rpc('admin_list_users');
  if (error) {
    tableContainer.innerHTML = `<div class="text-xs" style="color:var(--danger);">Error cargando usuarios: ${error.message}</div>`;
    return;
  }

  const durationLabel = { '7days': '7 días', '14days': '14 días', '1month': '1 mes', '2months': '2 meses', '3months': '3 meses', 'forever': 'Para siempre' };
  const statusColor = { active: 'var(--success)', blocked: 'var(--danger)', sin_suscripcion: '#f59e0b', deleted: 'var(--text-tertiary)' };
  const statusLabel = { active: 'Activo', blocked: 'Bloqueado', sin_suscripcion: 'Sin suscripción', deleted: 'Eliminado' };

  const { icon: iconFn } = await import('../icons.js');

  tableContainer.innerHTML = `
    <div class="card-header" style="margin-bottom:var(--space-md);">
      <div class="card-title">${iconFn('user', 14)} Usuarios registrados (${users.length})</div>
    </div>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="color:var(--text-tertiary);text-align:left;">
            <th style="padding:8px 12px;border-bottom:1px solid var(--border);">Email</th>
            <th style="padding:8px 12px;border-bottom:1px solid var(--border);">Rol</th>
            <th style="padding:8px 12px;border-bottom:1px solid var(--border);">Estado</th>
            <th style="padding:8px 12px;border-bottom:1px solid var(--border);">Duración</th>
            <th style="padding:8px 12px;border-bottom:1px solid var(--border);">Vence</th>
            <th style="padding:8px 12px;border-bottom:1px solid var(--border);">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => {
            const isCurrentAdmin = u.user_role === 'admin';
            const venceText = u.duration_type === 'forever' ? 'Nunca'
              : u.end_date ? new Date(u.end_date).toLocaleDateString('es-AR') : '—';
            const color = statusColor[u.status] || 'var(--text-tertiary)';
            return `
              <tr style="border-bottom:1px solid var(--border);" data-user-id="${u.user_id}">
                <td style="padding:10px 12px;">
                  <div style="font-weight:600;">${u.full_name || '—'}</div>
                  <div style="color:var(--text-tertiary);font-size:11px;">${u.email}</div>
                </td>
                <td style="padding:10px 12px;">
                  <span style="font-size:10px;padding:2px 8px;border-radius:4px;background:${isCurrentAdmin ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)'};color:${isCurrentAdmin ? '#f59e0b' : 'var(--text-tertiary)'};">
                    ${isCurrentAdmin ? 'ADMIN' : 'USER'}
                  </span>
                </td>
                <td style="padding:10px 12px;">
                  <span style="font-size:11px;font-weight:700;color:${color};">${statusLabel[u.status] || u.status}</span>
                </td>
                <td style="padding:10px 12px;color:var(--text-secondary);">${durationLabel[u.duration_type] || '—'}</td>
                <td style="padding:10px 12px;color:var(--text-secondary);">${venceText}</td>
                <td style="padding:10px 12px;">
                  ${isCurrentAdmin ? '<span style="color:var(--text-tertiary);font-size:11px;">—</span>' : `
                    <div class="flex gap-xs">
                      ${u.status === 'active'
                        ? `<button class="btn btn-secondary btn-sm" style="font-size:10px;padding:3px 8px;" data-action="block" data-uid="${u.user_id}">Bloquear</button>`
                        : `<button class="btn btn-secondary btn-sm" style="font-size:10px;padding:3px 8px;color:var(--success);" data-action="unblock" data-uid="${u.user_id}">Activar</button>`
                      }
                      <button class="btn btn-sm" style="font-size:10px;padding:3px 8px;background:rgba(220,38,38,0.1);color:var(--danger);border:1px solid rgba(220,38,38,0.3);" data-action="delete" data-uid="${u.user_id}">Eliminar</button>
                    </div>
                  `}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Bind action buttons
  tableContainer.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      const uid = btn.dataset.uid;

      if (action === 'delete') {
        if (!confirm('¿Eliminar este usuario y TODOS sus datos? Esta acción es irreversible.')) return;
        btn.disabled = true;
        const { error } = await supabase.rpc('admin_delete_user', { target_user_id: uid });
        if (error) { alert('Error: ' + error.message); btn.disabled = false; return; }
      } else {
        btn.disabled = true;
        const newStatus = action === 'block' ? 'blocked' : 'active';
        const { error } = await supabase.rpc('admin_set_user_status', { target_user_id: uid, new_status: newStatus });
        if (error) { alert('Error: ' + error.message); btn.disabled = false; return; }
      }
      loadUsersTable();
    });
  });
}
