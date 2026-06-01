# DEVLOG — ClickAngle

Registro cronológico de todo lo que se construye, modifica o elimina en la app.
Actualizar este archivo al cierre de cada sesión de desarrollo o tras cada cambio significativo.

---

## Estado actual de la app (al 2026-05-28)

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
| `brand` | `brand.js` | Brand Kit — YT ADN card + análisis visual (accesible desde Settings) |
| `cerebro` | `cerebro.js` | Análisis ADN del canal + inteligencia de contenido (lee guiones) |
| `espionaje` | `espionaje.js` | Análisis de miniaturas de competidores |
| `angulos` | `angulos.js` | Generación de ángulos/conceptos para miniaturas |
| `engine` | `engine.js` | Fábrica creativa — generador de miniaturas IA (formatos + estilos) |
| `editor` | `editor.js` | Editor y simulador de miniaturas |
| `settings` | `settings.js` | Config API Key, Face Vault, Canal de YouTube (ADN), ajustes de usuario |
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

### 2026-06-01 — Lightbox, upgrades de modelos IA, recomendaciones IA en Fábrica Creativa

#### Contexto
Sesión de mejoras en tres frentes: (1) rediseño del lightbox de miniaturas con descarga y navegación, (2) upgrade estratégico de todos los modelos Gemini con investigación de capacidades actuales, (3) sistema de recomendaciones IA real en la Fábrica Creativa reemplazando el keyword matching.

---

#### `src/panels/engine.js` + `style.css` — Lightbox rediseñado

**Antes:** lightbox simple con solo imagen, sin descarga, sin navegación.

**Ahora:**
- Barra superior con contador (`1 / 3`), botón **DESCARGAR MINIATURA** (gradiente rojo primario, glow), botón cerrar
- Flechas de navegación `‹ ›` (círculos glass con hover rojo) para navegar entre imágenes del **mismo ángulo**
- Soporte de teclado: `ArrowLeft`, `ArrowRight`, `Escape`
- Cierra al clickear el fondo

**Lógica de agrupación:**
- `data-angle-group="angle-${globalIdx}"` en imágenes de `renderAngleCard` (imagen principal + strip)
- `data-angle-group="drawer-${cardIdx}"` en imágenes de `renderVariantDrawerCard`
- Al abrir, `openLightboxForImg(img)` colecta todas las imágenes del grupo y navega dentro de ellas

**Estado de módulo** (persiste entre renders):
```js
let lbImages = []; // [{src, name}]
let lbIdx = 0;
```
Funciones: `closeLightbox`, `lbNav(delta)`, `lbDownload()`, `updateLightboxUI()`, `openLightboxForImg(img)`

**Archivos modificados:** `src/panels/engine.js`, `style.css`

---

#### `src/lib/intelligence.js` — Upgrade estratégico de modelos Gemini

**Investigación realizada:** Revisión completa de la documentación oficial de Gemini API (junio 2026).

**Modelos de texto — MODEL_MAPPING actualizado:**
```js
// Antes: todo apuntaba a 'gemini-3-flash-preview'
// Ahora:
IMAGE_GEN:            'gemini-3.5-flash',  // builder del visual prompt
ANGLES_GENERATION:    'gemini-3.5-flash',  // ángulos psicológicos
SCRIPT_ANALYSIS:      'gemini-3.5-flash',  // análisis de guión
CHANNEL_DNA_ANALYSIS: 'gemini-3.5-flash',  // análisis multimodal YouTube
CONTEXT_ANALYSIS:     'gemini-3.5-flash',  // contexto para imagen
ESPIONAGE_ANALYSIS:   'gemini-3.5-flash',  // análisis de competidores
FORMAT_STYLE_REC:     'gemini-3.5-flash',  // NUEVO: recomendación formato/estilo

CHANNEL_ADN:          'gemini-3.1-flash-lite',
ADN_INTERVIEW:        'gemini-3.1-flash-lite',
ADN_SYNTHESIS:        'gemini-3.1-flash-lite',
BRANDING_ANALYSIS:    'gemini-3.1-flash-lite',
STYLE_ANALYSIS:       'gemini-3.1-flash-lite',
FACE_ANALYSIS:        'gemini-3.1-flash-lite',
```

**Modelo de imagen — ciclo de esta sesión:**
1. `gemini-2.5-flash-image` → `gemini-3.1-flash-image` (upgrade)
2. `gemini-3.1-flash-image` → `gemini-2.5-flash-image` (revertido)

**Razón del revert:** `gemini-3.1-flash-image` tiene filtros más estrictos para likenesses de celebridades (error codes internos `29310472` y `15236754`). Cuando se nombra una celebridad en el prompt, la omite silenciosamente sin devolver error. El modelo viejo era más permisivo. La calidad visual de `gemini-3.1-flash-image` es notablemente superior — se documentó para retomarlo con la estrategia de "traducción de celebridades" (ver ideas pendientes).

**Nuevo prompt `FORMAT_STYLE_REC`:** Sistema de recomendación de formato y estilo vía IA real. Describe los 6 formatos y 6 estilos con IDs exactos y le pide a Gemini que recomiende basado en el DNA del video. Reemplaza el keyword matching determinista anterior que solo cubría 4/6 formatos y 0 estilos.

**Archivos modificados:** `src/lib/intelligence.js`

---

#### `src/panels/engine.js` — Recomendaciones IA en Fábrica Creativa

**Antes:** Paso 1 usaba `recommendFormats()` (keyword matching hardcodeado, solo 4/6 formatos, 0 estilos). Paso 2 no tenía ninguna recomendación.

**Ahora:**

**`fetchAIRecs(project)`** — función async que:
- Se dispara al entrar al Paso 1 por primera vez para ese proyecto
- Llama `callAI('FORMAT_STYLE_REC', content)` con el DNA del video (título, hook, tensión, promesa, héroe, ángulos seleccionados)
- Devuelve `{ formats: [...], style: {...} }`
- Cachea el resultado por proyecto (`aiRecsProjectId`)
- Estado: `null` = no iniciado, `false` = cargando, `{...}` = listo

**Summary bar (`#engine-summary-bar`)** — barra de chips centrada ENCIMA de la barra de pasos:
- Muestra formato(s) y estilo seleccionados/recomendados en todo momento
- 3 estados por chip: **rojo sólido** = usuario seleccionó, **verde punteado** = IA recomienda, **gris placeholder** = aún sin datos
- Spinner "Analizando tu video..." mientras carga
- Se actualiza desde `render()` y desde `rerenderStep()` via `updateSummaryBar()`

**Paso 1 (Formato):** Overlay glassmorphism centrado sobre las cards con mensaje grande "Analizando y recomendando un formato basado en tu video" + dots pulsantes. Cards deshabilitadas (`pointer-events:none`, `opacity:0.12`) mientras carga.

**Paso 2 (Estilo):** Badge `✦ IA` en esquina superior izquierda de la card recomendada (igual al de formatos). Borde verde en card recomendada.

**Eliminado:** texto largo de razones de recomendación que aparecía debajo de los chips — todo se consolidó en la summary bar.

**Archivos modificados:** `src/panels/engine.js`

---

#### Investigación documentada: modelos de imagen Gemini (junio 2026)

| Modelo | Estado | Celebridades | Notas |
|---|---|---|---|
| `gemini-2.5-flash-image` | Activo | ✅ Permisivo | El que usa la app actualmente |
| `gemini-3.1-flash-image` | GA (28 mayo) | ⚠️ Estricto | Calidad notablemente superior, pero omite celebridades silenciosamente |
| `gemini-3-pro-image` | GA (28 mayo) | ⚠️ Igual o más estricto | Usa Thinking interno, máxima calidad |
| `imagen-4.0-generate-001` | GA | ⚠️ Similar | API diferente, límite 480 tokens (incompatible con prompts actuales) |

**Parámetro `imageConfig` — diferencia detectada:**
- Modelo viejo (`gemini-2.5-flash-image`): acepta `imageConfig: { aspectRatio: '16:9' }`
- Modelo nuevo (`gemini-3.1-flash-image`): requiere `responseFormat: { image: { aspectRatio: '16:9', imageSize: '2K' } }`
- No afecta al modelo actual pero documentado para cuando se migre.

---

### 2026-05-28 (sesión 2) — Brand Kit → Settings + YouTube ADN en prompts + Fix SIN ROSTRO

#### Contexto
Tres objetivos: (1) consolidar el Brand Kit dentro del panel Settings para que el usuario configure todo en un solo lugar, (2) inyectar el ADN de YouTube en los prompts de generación de ángulos y de miniaturas para que la IA tenga contexto real del canal, (3) corregir el bug donde "SIN ROSTRO" seguía generando caras inventadas con IA.

---

#### `src/panels/brand.js` — Extraída función exportable + fixes

**Nuevo helper `timeAgo(isoStr)`** (antes de `fmtNum`):
- Calcula días transcurridos desde un ISO string → devuelve "hoy", "hace 1 día", "hace N días".
- Usado para mostrar cuándo se hizo el último análisis de YouTube en la UI.

**Firma de `buildYoutubeADNCard` extendida:**
```js
// Antes:
buildYoutubeADNCard(ytAdn, ytChannel)
// Después:
buildYoutubeADNCard(ytAdn, ytChannel, analyzedAt = null, videoCount = 0)
```
Muestra metadata en la card analizada: `"hace X días · Y videos"` debajo del nombre del canal.

**Fix input blanco:** Los dos inputs de `@handle` de YouTube tenían `class="input"` (clase inexistente en style.css) → cambiados a `class="form-input"` (usa el branding de la app correctamente).

**Nueva función exportable `renderYoutubeADNSection(container, channelId)`:**
- Renderiza skeleton HTML sincrónicamente (cumple regla del router: nunca `await` antes de retornar).
- Luego en background: fetchea `brand_kits.detailed_adn` de Supabase.
- Extrae `youtube_analysis`, `youtube_channel`, `youtube_analyzed_at`, `youtube_video_count`.
- Monta la card con `buildYoutubeADNCard(ytAdn, ytChannel, analyzedAt, videoCount)`.
- Handler `analyzeYtChannel`: al guardar el análisis, ahora también persiste el timestamp y el conteo de videos:
  ```js
  detailed_adn: {
    ...existingAdn,
    youtube_analysis: analysis,
    youtube_channel: ytData.channel,
    youtube_analyzed_at: new Date().toISOString(),
    youtube_video_count: ytData.topVideos?.length || 0,
  }
  ```
- Al re-analizar, re-renderiza solo la sección (no toda la página Brand Kit).

**Archivos modificados:** `src/panels/brand.js`

---

#### `src/panels/settings.js` — Accordion "Canal de YouTube" reemplaza "ADN Estratégico"

Import actualizado: `renderADNSection` → `renderYoutubeADNSection` (desde brand.js).

El segundo accordion del panel Settings cambió completamente:
```
Antes: "ADN Estratégico" — entrevista de 3 preguntas sobre el canal
Ahora: "Canal de YouTube" — análisis con IA via YouTube Data API + Gemini Vision
```

HTML del nuevo accordion:
```html
<details class="settings-accordion">
  <summary class="settings-accordion-header">
    <span class="settings-accordion-lead">[youtubePlay icon] Canal de YouTube</span>
    <span class="settings-accordion-desc">Análisis estratégico con IA</span>
    <span class="settings-accordion-chevron">[chevronDown icon]</span>
  </summary>
  <div class="settings-accordion-body" id="section-adn"></div>
</details>
```

Al abrir el accordion: `renderYoutubeADNSection(adnSection, activeChannelId)` se llama y maneja su propio ciclo de vida (skeleton → fetch → render). Corrige también el bug del accordion vacío que antes mostraba contenido en blanco hasta que el fetch terminaba.

**Archivos modificados:** `src/panels/settings.js`

---

#### `main.js` — Ruta `#brand` eliminada

- Eliminado: `import { renderBrand } from './src/panels/brand.js'`
- Eliminado: `registerRoute('brand', renderBrand)`

El panel Brand Kit deja de existir como ruta independiente. Todo su contenido relevante ahora vive dentro de Settings. `brand.js` sigue exportando sus funciones pero no es una ruta de la app.

**Archivos modificados:** `main.js`

---

#### `src/panels/cerebro.js` — YouTube ADN inyectado en generación de ángulos

**Variable de closure nueva:**
```js
let channelYtAnalysis = null; // cargado en step 1, enriquece la generación de ángulos
```

**En el handler de step 1** (después de fetchear el brand kit):
```js
channelYtAnalysis = brandKit?.detailed_adn?.youtube_analysis || null;
```

**En `generateAnglesForVideo()`** — el objeto `context` ahora incluye condicionalmente el ADN de YouTube:
```js
const context = {
  hook, tension, promise, visual_briefing, existing_angles,
  ...(channelYtAnalysis && {
    channel_archetype: channelYtAnalysis.channel_archetype,
    audience_psychology: channelYtAnalysis.audience_psychology,
    content_pillars: channelYtAnalysis.content_pillars,
  }),
};
```

Inyección condicional: si el canal no tiene ADN analizado, el flujo funciona igual que antes. Si lo tiene, la IA genera ángulos que respetan el arquetipo del canal y la psicología específica de su audiencia.

**Archivos modificados:** `src/panels/cerebro.js`

---

#### `src/panels/engine.js` — YouTube ADN en Layer 5 + DNA Checklist + Fix SIN ROSTRO

**DNA Checklist (`renderDNAChecklist`):**
- Antes usaba el campo muerto `brandKit.detailed_adn.synthesis.tone` (no existe en formato YouTube ADN).
- Ahora: `ytAnalysis = adnData?.youtube_analysis || null` con fallback chain correcto.
- Agregado nuevo checkitem "YouTube ADN" que muestra arquetipo + primeros 2 pilares de contenido:
  ```js
  ${checkItem(!!ytAnalysis, 'YouTube ADN', ytAnalysis
    ? `"${ytAnalysis.channel_archetype}" · ${ytAnalysis.content_pillars?.slice(0,2).join(', ')}`
    : null)}
  ```

**Layer 5 — Brand ADN & Market Contrast (reescrito):**
- Los campos anteriores `synthesis.tone` y `synthesis.branding` no existen en el esquema de datos actual → el Layer 5 nunca aportaba nada real.
- Reemplazados por las 5 dimensiones del YouTube ADN con precedencia inteligente:
  ```js
  const ytAnalysis = adnData?.youtube_analysis || null;
  const brandTone = adn.tone || ytAnalysis?.channel_archetype || '';
  const brandBranding = adn.branding || ytAnalysis?.visual_signature || '';

  const adnLayer = [
    brandTone || brandBranding
      ? `Brand tone & archetype: ${brandTone}. Visual identity: ${brandBranding}.` : '',
    ytAnalysis?.visual_signature
      ? `Channel's proven visual signature: ${ytAnalysis.visual_signature}` : '',
    ytAnalysis?.audience_psychology
      ? `Audience psychology — what makes THIS specific audience stop and click: ${ytAnalysis.audience_psychology}` : '',
    ytAnalysis?.performance_insights
      ? `What drives performance in this channel: ${ytAnalysis.performance_insights}` : '',
    ytAnalysis?.differentiation
      ? `Channel market differentiation: ${ytAnalysis.differentiation}` : '',
    winningStyle
      ? `Creator's proven visual style from winning thumbnails: ${winningStyle}` : '',
  ].filter(Boolean).join('\n');
  ```
- Si no hay YouTube ADN, el layer queda vacío (`.filter(Boolean)`) y no rompe el prompt.

**Fix bug "SIN ROSTRO genera caras de IA":**

**Causa raíz:** El formato `reaction` (Emoción Pura) en LAYER 2 tiene un PATH B que dice explícitamente "usa el rostro del creador como hero visual". El modelo seguía esta instrucción (más específica y anterior) e ignoraba el LAYER 6 "no faces". Afectaba también `shock` Options C/D y `versus` Option F.

**Solución — dos capas de protección:**

1. `noFacePreamble`: hard constraint que se inyecta *antes* de todos los layers cuando `!useFace`:
   ```js
   const noFacePreamble = !useFace
     ? `🚫 HARD CONSTRAINT — READ BEFORE ANYTHING ELSE: This thumbnail must contain ZERO human faces, people, or body parts of any kind. No real faces, no AI-generated faces, no silhouettes, no hands, no humanoid figures. Any composition option in LAYER 2 that involves a person's face or body MUST be skipped. Build maximum visual impact using only objects, environments, graphic design, symbols, and abstract elements. This constraint cannot be overridden by any instruction that follows.\n\n`
     : '';
   ```

2. `faceLayer` fortalecido para el caso sin rostro:
   ```js
   const faceLayer = useFace && selectedFace
     ? `CREATOR FACE (mandatory): ...` // igual que antes
     : `NO HUMAN PRESENCE — ABSOLUTE RULE: Zero faces, zero people, zero bodies, zero hands, zero silhouettes, zero humanoid shapes of any kind. If any option in LAYER 2 describes a face-based composition, SKIP that option entirely and choose the next available option that builds visual impact using only objects, environments, graphic elements, symbols, or abstract visual language. This rule is NON-NEGOTIABLE and overrides any face-related instruction in any other layer.`;
   ```

3. Prompt devuelto como: `${noFacePreamble}━━━ ROLE & MISSION ━━━...`

**Por qué funciona:** Los LLMs de imagen siguen el orden del prompt. Al poner el hard constraint antes de ROLE, tiene máxima prioridad en el contexto del modelo.

**Archivos modificados:** `src/panels/engine.js`

---

#### Decisión de producto documentada: YouTube ADN es opcional

El flujo completo funciona sin YouTube ADN:
- **Cerebro:** si `channelYtAnalysis === null`, el contexto de ángulos no incluye esas claves (spread condicional).
- **Engine Layer 5:** si `ytAnalysis === null`, el ADN layer queda vacío via `.filter(Boolean)`.

El YouTube ADN enriquece la calidad de las salidas pero nunca bloquea el flujo. Esto permite que usuarios nuevos (sin análisis realizado) usen la app sin fricción.

---

### 2026-05-28 — YouTube API + ADN Canal + Mejoras al Simulador

#### Contexto
Dos objetivos principales: (1) mejorar el ADN estratégico del canal con datos objetivos reales de YouTube y visión de Gemini sobre las miniaturas reales, (2) refinar el Simulador para que filtre por proyecto activo y tenga placeholders realistas.

---

#### `supabase/functions/youtube-channel/index.ts` — NUEVA Edge Function

Proxy seguro para la YouTube Data API v3. La API key está en Supabase Secrets (`YOUTUBE_API_KEY`), nunca llega al browser.

**Flujo:**
1. Recibe POST `{ handle, includeImages }` con CORS handling.
2. `channels?part=snippet,statistics,brandingSettings&forHandle={handle}` (1 unidad).
3. `search?part=snippet&channelId={id}&order=viewCount&maxResults=20&type=video` (100 unidades).
4. `videos?part=statistics&id={videoIds}` (1 unidad por 50 videos).
5. Convierte las top 7 miniaturas a base64 via `thumbnailToBase64()` para Gemini Vision.
6. Devuelve `{ channel, topVideos, thumbnailImages: [{ title, views, base64 }] }`.

**Costo:** ~102 unidades/análisis completo. Free tier ~96 análisis/día.
**Deploy:** `supabase functions deploy youtube-channel --project-ref ahbrflukfncghlyscogq`

---

#### `src/lib/intelligence.js` — Nuevo prompt y función multimodal

**Nuevo `SYSTEM_PROMPTS.CHANNEL_DNA_ANALYSIS`:**
Prompt que recibe estadísticas del canal + títulos de top videos (texto) + imágenes base64 de las miniaturas (visual). Extrae 7 dimensiones: `content_pillars`, `title_patterns`, `visual_signature`, `audience_psychology`, `performance_insights`, `differentiation`, `channel_archetype`.

**Nueva función `callAIWithImages(promptType, textContent, images, context)`:**
Versión multimodal de `callAI`. Construye un request Gemini con `inlineData` parts para hasta 7 imágenes JPEG base64 además del texto. Timeout 120s. Misma lógica de retry/error handling que `callAI`.

---

#### `src/panels/brand.js` — Nueva sección "ADN del Canal YouTube"

**Nueva card encima del ADN Estratégico existente.** Dos estados:

- **Sin analizar:** Input `@handle` + botón "Analizar Canal" + Enter key. Muestra error inline en la card si falla.
- **Analizado:** 
  - Info del canal (avatar, nombre, handle, subs, videos, vistas).
  - Arquetipo del canal en itálica roja grande.
  - Pillars de contenido como badges.
  - Grid 2 columnas con los 5 insights (Patrones en Títulos, Firma Visual, Psicología del Espectador, Performance Insights, Diferenciación).
  - Botón "Re-analizar" que despliega inline el input de handle.

**Helpers nuevos a nivel de módulo:**
- `fmtNum(n)` — formatea números grandes (1.2M, 500K, etc.).
- `buildYoutubeADNCard(ytAdn, ytChannel)` — genera el HTML de la card.

**Handler `analyzeYtChannel()`:**
1. Llama `supabase.functions.invoke('youtube-channel', { body: { handle, includeImages: true } })`.
2. Llama `callAIWithImages('CHANNEL_DNA_ANALYSIS', textContent, thumbnailImages, context)`.
3. Upsert a `brand_kits.detailed_adn` usando spread para no pisar datos existentes:
   ```js
   detailed_adn: { ...existingAdn, youtube_analysis: analysis, youtube_channel: ytData.channel }
   ```
4. Re-render completo de la página Brand Kit.

**Archivos modificados:** `src/panels/brand.js`, `src/lib/intelligence.js`, `supabase/functions/youtube-channel/index.ts` (nuevo)

---

#### `src/panels/editor.js` — Mejoras al Simulador

**Filtrado por proyecto activo:**
- El simulador ahora muestra solo las miniaturas del `activeProjectId` del state global, no todas las del canal.
- Suscripción al state con `subscribe()` detecta cambios de `activeProjectId` y recarga el picker. Usa `container.isConnected` para limpiar la suscripción al desmontar el panel.
- Consulta: `supabase.from('thumbnail_variants').select(...).eq('project_id', projectId)` — directo por proyecto.

**Placeholders realistas:**
- Las posiciones vacías del feed usan Lorem Picsum (`https://picsum.photos/seed/{n+10}/{w}/{h}`) en lugar de bloques de color plano.
- Función `buildThumbOverlay(title, i)` agrega texto YouTube-style encima: divide el título en 2 líneas de 3 palabras, con colores accent alternados de `OVERLAY_ACCENT` array.
- Avatares circulares: `picsum.photos/seed/{n+50}/40/40` (fotos de cara consistentes).

**`style.css` — Botones de paginación del simulador:**
```css
.sim-picker-nav {
  background: rgba(220, 38, 38, 0.12);
  border: 1px solid rgba(220, 38, 38, 0.4);
  color: var(--accent);
}
.sim-picker-nav:hover:not(:disabled) {
  background: rgba(220, 38, 38, 0.22);
  box-shadow: 0 0 14px rgba(220, 38, 38, 0.3);
}
```
Overlay CSS: `.sim-thumb-overlay`, `.sim-thumb-overlay-l1`, `.sim-thumb-overlay-l2`.

---

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

## Ideas pendientes (próxima sesión)

### 🔴 PRIORITARIA — Traducción de celebridades para usar `gemini-3.1-flash-image`

**Problema:** `gemini-3.1-flash-image` genera imágenes de calidad notablemente superior pero sus filtros de seguridad omiten silenciosamente a celebridades reales (MJ, Shakira, Elon, etc.) sin devolver error. `gemini-2.5-flash-image` sí las renderiza pero con menor calidad visual.

**Solución diseñada (no implementada):**
Antes de llamar a `generateImage`, interceptar el `hero_object` del prompt cuando contiene un nombre de persona real y pasarlo por `gemini-3.1-flash-lite` para "traducirlo" a descriptores visuales puros sin nombrar a la persona:

```
Input:  "Michael Jackson"
Output: "iconic male pop star, black curly hair, sequined red jacket, single white glove, moonwalk dance pose, spotlight stage, 1980s aesthetic"
```

Esto bypasea el filtro de celebridades (que detecta el nombre, no la descripción visual) mientras preserva el concepto. Permitiría migrar `IMAGE_GEN_MODEL` a `gemini-3.1-flash-image` permanentemente.

**Archivos a modificar:** `src/lib/intelligence.js` — nueva función `translateHeroToVisualDescriptors()`, nuevo prompt `HERO_TRANSLATOR` en SYSTEM_PROMPTS. Llamar antes de `generateImage` en `generateAndSaveVariant()` de `engine.js`.

**Costo:** 1 call extra de texto por generación (baratísimo con flash-lite). Latencia adicional: ~300ms.

---

### 🟡 IMPORTANTE — Modo Agente: Critique-and-Refine de miniaturas

**Idea:** Toggle opt-in en el Paso 4 de la Fábrica Creativa que activa un loop de 2 generaciones:

1. **Draft:** Generar imagen con el prompt actual
2. **Critique:** Enviar el draft generado a `gemini-3.5-flash` con visión: *"¿El objeto héroe está presente? ¿La composición sigue el formato elegido? ¿Qué falta para máximo impacto de CTR? Dá 3 mejoras concretas al prompt."*
3. **Refine:** Incorporar la crítica al prompt original
4. **Final:** Generar la imagen final con el prompt reforzado

**UX pensada:** El usuario ve el draft + la crítica en texto + el resultado final. Botón "Modo Agente 🤖" en el step 4, desactivado por defecto. Se procesa por ángulo individualmente.

**Costo:** ~2x precio de generación de imagen por miniatura + 1 call de texto con imagen adjunta.

**Archivos a modificar:** `engine.js` — nueva función `generateWithAgentLoop()`, nuevo estado `agentModeEnabled`, UI en `renderAnglesStep()`.

---

### 🟢 MENOR — Fix `imageConfig` → `responseFormat` para `gemini-3.1-flash-image`

Cuando se migre a `gemini-3.1-flash-image`, el payload de `generateImage()` en `intelligence.js` necesita actualizar el parámetro de aspect ratio:

```js
// Actual (funciona con gemini-2.5-flash-image):
generationConfig: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio: '16:9' } }

// Nuevo (requerido por gemini-3.1-flash-image):
generationConfig: { responseModalities: ['TEXT', 'IMAGE'], responseFormat: { image: { aspectRatio: '16:9', imageSize: '2K' } } }
```

Hacer este fix junto con la implementación de la traducción de celebridades.

---

## Decisiones de arquitectura registradas

| Decisión | Razón |
|---|---|
| Vanilla JS (sin React/Vue) | Simplicidad, carga rápida, control total |
| Entry point en `main.js` raíz (no `src/main.js`) | `src/main.js` es scaffold de Vite sin usar |
| API key de Gemini en Supabase cifrada (RPC `get_decrypted_api_key`) | Nunca exponer keys en cliente |
| caché localStorage `ca_cache_v1_<userId>` en auth | Stale-while-revalidate para carga percibida más rápida |
| Hash-based routing | SPA sin SSR, compatible con Vercel static deploy |
| YouTube ADN como enriquecimiento opcional | Inyección condicional en Cerebro y Engine — nunca bloquea el flujo si no hay análisis |
| Brand Kit dentro de Settings (no ruta propia) | El usuario configura todo (API key, cara, YouTube ADN) en un solo lugar antes de usar la app |
| Hard preamble en prompts de imagen para no-face | Los LLMs siguen orden del prompt — poner constraint antes de ROLE le da máxima prioridad sobre instrucciones de layers posteriores |
| `gemini-2.5-flash-image` para generación de imagen | `gemini-3.1-flash-image` tiene calidad superior pero filtros que omiten celebridades silenciosamente — revertido hasta implementar traducción de celebridades |
| `gemini-3.5-flash` para tareas críticas de texto | Modelo GA más capaz actualmente — mejora ángulos, análisis de guión y prompts de imagen |
| `gemini-3.1-flash-lite` para tareas de configuración | Baja frecuencia, tarea simple — ahorra costo sin impactar calidad perceptible |

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
