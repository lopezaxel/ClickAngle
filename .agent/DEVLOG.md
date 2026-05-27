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

### 2026-05-27 — Sesión de UX y navegación (Cerebro + Fábrica Creativa)

#### Contexto
Sesión de mejoras de flujo de usuario centradas en dos paneles: El Cerebro (agregado de selector de proyectos como Step 0) y la Fábrica Creativa (refactor de navegación y UI).

---

#### `src/lib/projects.js` — Nuevas funciones

Agregadas dos funciones que faltaban para el CRUD completo de proyectos:

```js
export async function renameProject(projectId, newTitle)
// Actualiza el título en Supabase y en el state global

export async function deleteProject(projectId)
// Elimina en Supabase, filtra del state global, reasigna activeProjectId si era el activo
```

---

#### `src/panels/cerebro.js` — Step 0 (selector de proyectos)

**Nuevo selector de proyectos como primer paso del flujo:**
- `step` siempre inicia en `0` (era 1 o 2 dependiendo del proyecto activo).
- `step 0` muestra todos los proyectos del canal como cards seleccionables antes de permitir pegar un guión.
- Al seleccionar un proyecto existente con DNA guardado, `loadProjectData(project)` restaura el estado completo (script, análisis, ángulos, ángulos seleccionados) y salta a step 1 o 2.
- Nuevas variables de estado: `viewMode` ('grid' | 'list'), `currentPage`, `PAGE_SIZE_GRID = 9`, `PAGE_SIZE_LIST = 10`.

**`renderStep0()`:**
- Vista grilla (3 columnas) y vista lista (1 columna), toggle con 2 botones.
- Paginación para no sobrecargar la sección.
- Cada card tiene botones de acción: **Renombrar** (via `inputDialog`) y **Eliminar** (via `confirmDialog` + `deleteProject`).
- Botón "Nuevo Video" para crear un proyecto fresco.
- Clase `cerebro-card-wrapper` en el contenedor externo para hover CSS.

**Botón "← Tus Videos" en steps 1 y 2:**
- Aparece como botón secundario encima del título en los pasos 1+ para volver al selector.
- Estilos: `btn btn-secondary btn-sm` — visible y clickeable.

---

#### `src/components/workflow.js` — Navbar de flujo

**Quitar números de los pasos:**
- Los círculos de paso ahora muestran un ícono SVG (`brain`, `eye`, `cog`, `scissors`) en lugar del número `1/2/3/4`.
- El campo `step` en `WORKFLOW_STEPS` queda pero ya no se renderiza.

```js
// Antes:
<div class="workflow-step-number">${step.step}</div>
// Después:
<div class="workflow-step-number">${icon(step.icon, 13)}</div>
```

---

#### `style.css` — Tres cambios visuales

1. **Conectores del workflow:** verde → rojo (`.workflow-connector--done { background: var(--accent); }`).
2. **Círculos de pasos completados:** verde → gradiente rojo (`.workflow-step--done .workflow-step-number`).
3. **Hover de cards del Cerebro (bug fix):** Reemplazado JS `mouseenter`/`mouseleave` (que se quedaban pegados) por CSS puro:

```css
.cerebro-card-wrapper { transition: border-color 0.15s ease, transform 0.15s ease; }
.cerebro-card-wrapper:hover { border-color: var(--accent) !important; transform: translateY(-1px); }
```

---

#### `src/panels/engine.js` — Fábrica Creativa (5 cambios)

**1. Quitar Paso 1 (selección de proyectos):**
- `workflowStep` inicia siempre en `1` (antes era `selectedProjectId ? 2 : 1`).
- `stepDefs` reducido de 5 a 4 ítems (eliminado `'Proyecto'`).
- Condiciones `canGo` renumeradas: `canGoStep2` (formatos), `canGoStep3` (estilo), `canGoStep4` (rostro → ángulos).
- Routing de contenido: paso 1 → Formato, 2 → Estilo, 3 → Rostro, 4 → Ángulos.
- `renderProjectStep()` y `openProjectModal()` quedan como dead code (no eliminado para no romper referencias indirectas).

**2. Barra de progreso más compacta:**
- Círculos: `28px → 20px`.
- Eliminada la línea `desc` debajo del label de cada paso.
- Márgenes reducidos.

**3. Cards de formato y estilo más legibles:**
- Texto de caso de uso: `9px → 11px`.
- Label de categoría: `8px → 9px`.

**4. Eliminar pill del proyecto:**
- Bloque HTML de `icon('folder')` + título del proyecto activo eliminado del área sobre la barra de progreso.

**5. Cards del Face Vault más chicas:**
- `padding: 24px 20px → 12px 14px`.
- Emoji: `font-size 36px → 24px`.
- `max-width: 480px` en el grid.

**6. Navegación fija al fondo (principal cambio de esta sesión):**
- **Eliminado** el bloque de nav estático `<!-- Bottom nav -->` del HTML de `render()`.
- **Agregada** función `syncEngineNav()` que crea/actualiza un `div#engine-fixed-nav` en `document.body`.
- Limpieza automática en `hashchange`.
- Estilos: `position: fixed; bottom: 0; left: ${sidebarW}px; right: 0` — respeta el ancho del sidebar.
- Fondo glassmorphism: `linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)` + `backdrop-filter: blur(4px)` — idéntico al CTA de ángulos en El Cerebro.
- Layout: `[← Anterior]` izquierda · `[PASO X DE 4 / hint]` centro · `[Siguiente →]` o `[🚀 GENERAR N MINIATURAS]` derecha.
- El botón generar (paso 4) dispara un `btn-generate-master` oculto que conserva la lógica existente de generación.
- `syncEngineNav()` se llama desde `render()` y desde `rerenderStep()` para que el estado del nav se actualice al seleccionar formatos/estilos.
- `padding-bottom: 90px` agregado a `#step-content` para que el contenido no quede tapado.

---

#### Bug corregido: hover persistente en cards

**Problema:** Las cards de El Cerebro mostraban borde rojo permanente después del `mouseout`. El handler JS usaba `closest('[style*="border-radius:12px"]')` para actualizar el padre — selector frágil que fallaba al mover el mouse sobre los botones de acción hijos.

**Solución:** Clase CSS `cerebro-card-wrapper` en el contenedor externo, hover manejado 100% por CSS. Todos los handlers JS `mouseenter`/`mouseleave` eliminados.

---

### 2026-05-27 — Sesión de ajustes pre-lanzamiento (mercado 2026)

#### Contexto
Sesión de análisis de mercado + ajustes estratégicos previos al lanzamiento. Se investigaron tendencias actuales de YouTube thumbnails 2026 y se cruzaron contra el estado de la app para identificar gaps y oportunidades.

#### `src/panels/engine.js` — Fábrica Creativa

**Nuevos formatos de composición (FORMATS array):**
- **🤳 Emoción Pura** (`reaction`) — Formato #1 de CTR en YouTube 2026. Composición de DOS caminos inteligentes leídos desde el `hero_object` del Layer 3:
  - **PATH A (celebridad)**: si el video habla de un personaje famoso (Shakira, Michael Jackson, etc.), el famoso es el anchor visual principal y el creador reacciona secundariamente hacia él.
  - **PATH B (creador)**: si no hay celebridad, el rostro del creador (Face Vault, Paso 4) es el subject principal con 4 opciones de ejecución (Oversized Emotion, Conspiratorial Lean, Diptych, Macro Scale).
- **🟥 Color Block** (`colorblock`) — Trend de mayor crecimiento en 2026. Bloques geométricos de color planos como arquitectura principal. 4 opciones: Diagonal Slash, Architectural Bands, Corner Invasion, Chromatic Triptych. Reglas absolutas: máx. 3 colores, fondos 100% flat, todo derivado de la paleta temática del video.

**Nuevo estilo visual (STYLES array):**
- **⬜ Neo-Minimal** (`neominimal`) — Trend 2026. Un sujeto, máx. 3 colores, negative space generoso, fondos flat, legible a 150px en mobile. Para: productividad, finanzas, educación, branding premium.

**Constantes de casos de uso:**
- `FORMAT_USE_CASES` — mapeo `id → texto "Ideal si tu video trata de:"` para los 6 formatos.
- `STYLE_USE_CASES` — mapeo `id → texto "Ideal si tu canal es de:"` para los 6 estilos.

**Rediseño de cards (Paso 2 y Paso 3):**
- Cambiado de `display:grid; grid-template-columns:1fr 1fr` / `repeat(3,1fr)` a `display:flex; flex-wrap:wrap; gap:10px`.
- Cada card ahora es vertical (`flex-direction:column; align-items:center; text-align:center`), `min-width:138px; flex:1 1 150px`.
- Sección inferior en cada card: separador + "Ideal si tu video/canal trata de:" + texto de caso de uso en 9px.

**Callout Test & Compare (Paso 5):**
- Se muestra automáticamente cuando `masters.length > 0` (hay al menos 1 miniatura generada).
- Explica en 3 pasos exactos cómo usar YouTube Studio → Miniatura → Probar y comparar.

**Badge anti-clickbait (Paso 5):**
- `renderAngleCard`: detecta ángulos con nombre/psicología que contiene `miedo|urgencia|fomo|amenaza|peligro`.
- Muestra un aviso ⚠️ amarillo dentro de la card advirtiendo sobre el riesgo de watch time bajo.

#### `src/panels/angulos.js` — Biblioteca de Ángulos

- **Callout Test & Compare**: banner compacto debajo del header explicando el flujo de 3 pasos.
- **Badge anti-clickbait**: ícono ⚠️ en header de card para categorías con `miedo|urgencia|fomo` en su nombre de categoría.

#### Investigación de mercado realizada
- Validados 4 formatos existentes contra tendencias 2026: todos vigentes.
- Gaps identificados: Emoción Pura (face/reaction) y Color Block faltaban — agregados.
- Fuentes: TubeTuner, BananaThumbnail, 1of10, ThumbMagic, Growthos.

---

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
