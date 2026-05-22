# DEVLOG — ClickAngle

Registro cronológico de todo lo que se construye, modifica o elimina en la app.
Actualizar este archivo al cierre de cada sesión de desarrollo o tras cada cambio significativo.

---

## Estado actual de la app (al 2026-05-22)

### Stack
- **Frontend:** Vanilla JS SPA + Vite 7 (sin frameworks)
- **Auth + DB:** Supabase (Pro, us-west-2, Postgres)
- **IA:** Gemini API vía `@google/genai` (modelos text + imagen)
- **Monitoreo:** Sentry (`@sentry/browser`)
- **Pagos:** Whop (webhook configurado)
- **Deploy:** (no registrado aún — completar)

### Módulos / Librerías (`src/lib/`)

| Archivo | Qué hace |
|---|---|
| `state.js` | Estado global pub/sub — `getState()`, `setState()`, `subscribe()` |
| `auth.js` | Init de auth Supabase, carga de datos de usuario con caché localStorage (`ca_cache_v1_<userId>`), CRUD de canales. Usa `getState().session.user` para mutaciones — NUNCA `supabase.auth.getUser()` en mutaciones. |
| `intelligence.js` | Toda la IA: `callAI(promptType, userContent, context)` con `SYSTEM_PROMPTS` + `MODEL_MAPPING`. Generación de imágenes con `generateImage(prompt, faceImageUrl)`. API key cifrada en Supabase (`get_decrypted_api_key` RPC), nunca en cliente. |
| `supabase.js` | Cliente Supabase (URL y anon key son públicas, van hardcodeadas) |
| `projects.js` | Lógica de proyectos (carpetas de videos) |
| `sentry.js` | Inicialización de Sentry para monitoreo de errores |
| `toast.js` | Helpers UI: `toast()`, `confirmDialog()`, `inputDialog()` |
| `loader.js` | Overlay de carga: `showLoader()`, `updateLoader()`, `hideLoader()` |

### Paneles (`src/panels/`)

| Ruta hash | Archivo | Qué hace |
|---|---|---|
| `login` | `login.js` | Login / registro de usuarios |
| `setup` | `setup.js` | Onboarding inicial del canal |
| `channel-selector` | `channel-selector.js` | Hub — switcher de canales |
| `dashboard` | `dashboard.js` | Analytics CTR con charts |
| `brand` | `brand.js` | Brand Kit — entrevista ADN + análisis de estilo |
| `cerebro` | `cerebro.js` | Análisis ADN del canal + inteligencia de contenido (lee guiones) |
| `espionaje` | `espionaje.js` | Análisis de miniaturas de competidores |
| `angulos` | `angulos.js` | Generación de ángulos/conceptos para miniaturas |
| `engine` | `engine.js` | Fábrica creativa — generador de miniaturas IA (formatos + estilos) |
| `editor` | `editor.js` | Editor y simulador de miniaturas |
| `settings` | `settings.js` | Config API Key, Face Vault, ajustes de usuario |
| `admin` | `admin.js` | Panel admin — gestión de usuarios y suscripciones |

### Tabla Supabase (tablas conocidas)

| Tabla | Campos clave |
|---|---|
| `profiles` | `id, email, full_name, avatar_url, subscription_tier, role, created_at` |
| `subscriptions` | `user_id, status, duration_type, start_date, end_date, block_date` |
| `channels` | datos del canal, `owner_id` |
| `channel_members` | `channel_id, user_id, role` |

**Lógica de acceso:** `status === 'blocked'` → usuario bloqueado (excepto `role === 'admin'`). `status === 'load_error'` → fail-open (permitir acceso).

### Flujo de renderizado
`main.js` → suscribe a state → `renderApp()` → decide pantalla (loading → login → blocked → layout) → `router.js` (hash-based, timeout 45s por panel) → panel correspondiente.

**Regla crítica del router:** Todo panel que necesite datos de Supabase debe renderizar skeleton UI sincrónicamente y luego fetchear en background. Nunca `await` antes de retornar del render.

---

## Historial de cambios

### 2026-05-22
- **Sentry agregado** — `@sentry/browser` instalado, `src/lib/sentry.js` creado, integrado en la app para monitoreo de errores en producción.

### ~2026-04 al ~2026-05 (estimado por commits)
- **Whop + webhook configurado** — integración de pagos con Whop, webhook para manejo de suscripciones.
- **Cajones de ángulos** — ajustes en el panel `angulos.js` (cambios en la UI/lógica de los cajones de ángulos).
- **Logo incrustado** — logo de la app integrado en la UI.
- **Opciones de texto en miniaturas** — se agregó opción "CON texto" y "SIN texto" en la generación de miniaturas (`engine.js`).
- **Carpetas para videos** — implementado sistema de carpetas/proyectos para organizar videos (`src/lib/projects.js`).
- **Face Vault movido a Settings** — la funcionalidad de Face Vault se relocalizo desde otro panel a `settings.js`.
- **Cambio de estilo y variación de miniaturas** — ajustes visuales y nuevas variaciones en el motor de generación.
- **Fábrica creativa mejorada** — múltiples iteraciones sobre `engine.js`.

### ~2026-03-12
- **Bug Gemini API 404 resuelto** — modelos con sufijo `-preview` obligatorio en v1beta. Documentado en LOG_DE_ERRORES.
- **Error 400 / JSON malformado resuelto** — `response_mime_type: "application/json"` en `generationConfig`, schema en el prompt, optional chaining en la UI.

### 2026-03-11
- **Bugs masivos de auth/routing resueltos** — ver `.agent/LOG_DE_ERRORES.md` para detalle completo. Resumen:
  - Router con timeout 45s, skeleton-first obligatorio en todos los paneles.
  - Deduplicación de `loadUserChannels` con lock `let promise = null`.
  - Event delegation en `container` (no `document.getElementById`).
  - Logout síncrono: limpiar localStorage `sb-*` y state ANTES de `supabase.auth.signOut()`.
  - `channels.length` incluido en `significantChange` de `main.js`.
  - `getUser()` en background (fire-and-forget), nunca bloqueante.
  - Timeouts de queries Supabase >= 25s para tolerar cold starts.

### ~2026-03-10
- **Pantalla negra / cierre de sesión** resuelto — router robusto con colas, auth timeout 15s sin wipes de sesión.

### ~2026-03-09
- **Conexión API Key colgando** resuelto — endpoint cambiado a `v1beta`, timeout 8s, parsing JSON robusto.

### ~2026-03 (primeras semanas)
- **Migración a Supabase Pro** — reducción de tiempo de carga, cold starts manejables.
- **Branding y logo** — nuevo diseño de la app cargado.
- **Panel Admin** — gestión de usuarios y suscripciones (`admin.js`).
- **Login** — pantalla de login completa (`login.js`).
- **Nueva sidebar** — rediseño de la barra lateral, F5 funciona correctamente.
- **Face Vault + Fábrica Creativa** — conexión exitosa, primeras miniaturas generadas con Gemini.
- **Brand Kit funcionando** — entrevista ADN + análisis de estilo (`brand.js`).
- **Cerebro funcionando** — lectura de guiones, análisis de canal (`cerebro.js`).
- **Armado inicial** — estructura base de la app, Supabase conectado, dashboard simple.

---

## Decisiones de arquitectura registradas

| Decisión | Razón |
|---|---|
| Vanilla JS (sin React/Vue) | Simplicidad, carga rápida, control total |
| Entry point en `main.js` raíz (no `src/main.js`) | `src/main.js` es scaffold de Vite sin usar |
| API key de Gemini en Supabase cifrada (RPC `get_decrypted_api_key`) | Nunca exponer keys en cliente |
| caché localStorage `ca_cache_v1_<userId>` en auth | Stale-while-revalidate para carga percibida más rápida |
| Hash-based routing | SPA sin SSR, compatible con Vercel static deploy |

---

## Cómo actualizar este archivo

Al cerrar una sesión de trabajo, agregar una entrada en **Historial de cambios** con:

```
### YYYY-MM-DD
- **Qué se hizo**: descripción breve
- **Archivos modificados**: `src/panels/xxx.js`, etc.
- **Por qué**: motivación o problema que resolvió
- **Qué se quitó** (si aplica): qué se eliminó y por qué
```

Si el cambio introduce una nueva regla arquitectónica, agregarla también a la tabla de **Decisiones de arquitectura**.
