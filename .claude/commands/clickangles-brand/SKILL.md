---
name: clickangles-brand
description: Brandbook completo de ClickAngles. Úsalo cuando necesites diseñar, modificar o revisar cualquier elemento visual de la app — componentes, pantallas, íconos, colores, tipografía — para garantizar consistencia con el design system oficial basado en el logo real analizado.
---

Tienes acceso al brandbook completo de **ClickAngles**, incluyendo el análisis detallado del logo oficial. Toda implementación visual debe adherirse estrictamente a estas guías. Antes de escribir cualquier código de UI, consulta este documento como referencia canónica.

---

## IDENTIDAD DE MARCA

**Nombre del producto:** ClickAngles
**Versión:** v2.0
**Tagline:** "Plataforma de Ingeniería de CTR para Creadores de Contenido Tech/IA"
**Audiencia:** Creadores de contenido de tecnología e IA (YouTube, redes sociales)
**Idioma de la UI:** Español
**Propósito:** SaaS premium para ingeniería de thumbnails, análisis de CTR y estrategia de contenido con IA

**Módulos principales de la app:**
- Brand Kit (gestión de paletas)
- El Cerebro (análisis con IA)
- Espionaje (inteligencia competitiva)
- Fábrica Creativa (generador de thumbnails)
- Editor & Simulador
- Dashboard (analíticas)

**Personalidad de marca:** Técnico · Preciso · Premium · Poderoso · Cinematográfico · Inteligencia Artificial
**Metáforas visuales clave:** Play button · Ángulos anidados · Click · Red neuronal · Cristal · Robótica · Video/YouTube

---

## LOGO OFICIAL — ANÁLISIS COMPLETO

### Variantes del logo

| Variante | Descripción | Uso recomendado |
|----------|-------------|-----------------|
| **Wordmark puro** | Solo texto "ClickAngles" en 3D | Headers, títulos de sección |
| **Logo horizontal** | Ícono cristal + cursor + wordmark | Header principal de la app, presentaciones |
| **Logo hero** | Mano robótica + ícono + wordmark | Portadas, thumbnails, material de marketing |
| **Ícono solo** | Play button triple anidado en cristal | App icon, favicon, avatar, sidebar |

---

### ÍCONO PRINCIPAL (App Icon)

**Forma geométrica base:**
- Triángulo de reproducción (play button) con esquinas redondeadas
- Referencia directa a YouTube/video content — el dominio del negocio
- **3 niveles concéntricos anidados:** marco externo → marco medio → triángulo interno
- Los triángulos anidados representan literalmente "Angles" (ángulos dentro de ángulos)
- Perspectiva tridimensional — se ve la cara frontal y el grosor lateral del cristal

**Material: Glassmorphism 3D (renderizado, no CSS plano)**
- Grosor de cristal visible en las aristas — el triángulo tiene volumen Z real
- Reflejo especular: líneas de luz blanca `#FFFFFF` brillante en aristas superiores
- Semi-transparencia interior: frosted glass con `rgba(200,200,200,0.15–0.25)`
- Tinting neutro gris-plata sobre el cristal
- Refracción sutil visible en la cara lateral
- NO es glassmorphism CSS plano — es una ilusión de objeto 3D renderizado

**Red neuronal interior (elemento clave de identidad):**
- 15–20 nodos circulares rojos con glow distribuidos dentro del triángulo
- Líneas de conexión finas rojizas entre nodos (grafo / constelación)
- Fuente de luz central: punto focal rojo intenso `#FF2200` con bloom y lens flare
- Gradient de intensidad: más brillante en el centro, se desvanece hacia bordes
- Colores de la red: `#FF3300` (centro) → `#CC2222` (medio) → `#880000` (bordes)
- Representa: IA, redes neuronales, conectividad, procesamiento inteligente

---

### TIPOGRAFÍA DEL LOGO

**Fuente display:** Bold condensada extrema, peso 900 — estilo cercano a **Bebas Neue**, **Bank Gothic Bold**, o **Anton**
- Sin serif, terminaciones limpias y rectas
- Cuerpo ancho y compacto, ligeramente condensado
- Caracteres con apertura amplia (la "C" es muy abierta, la "A" tiene vértice agudo)
- Tratamiento 3D con extrusión lateral — cara frontal + cara de profundidad (Z-depth)
- Bevel sutil en las aristas de las letras

**"Click"** — color blanco/plata metálico:
- Cara frontal: Blanco `#FFFFFF` → plata `#D0D0D0`
- Cara lateral / sombra: Gris medio `#808080` → gris oscuro `#404040`
- Highlight especular: blanco puro en aristas superiores
- Efecto: cromo/plata 3D

**"Angles"** — color rojo profundo:
- Cara frontal: Rojo medio `#CC2222` → rojo oscuro `#AA1111`
- Cara lateral / sombra: Rojo casi negro `#3B0000` → `#1A0000`
- Highlight: Rojo brillante `#EE3333` en aristas superiores
- Efecto: rojo carmesí metálico 3D

> **DIFERENCIA CRÍTICA con la UI:** El rojo del logo es MÁS oscuro y profundo (`#AA1111–#CC2222`) que el rojo funcional de la UI (`#DC2626`). El logo usa rojo carmesí con presencia 3D; la UI usa rojo brillante para CTAs planos. Ambos coexisten — el logo es brand, la UI es funcional.

---

### ELEMENTOS SECUNDARIOS DEL LOGO

**Cursor 3D (variante horizontal):**
- Cursor de flecha estándar renderizado en glassmorphism (mismo cristal que el ícono)
- Nodos rojos glowing en las puntas y articulaciones del cursor
- Se superpone sobre el play button — el cursor "toca" el ícono
- Representa "Click" de forma literal y visual

**Mano robótica (variante hero):**
- Material: cromo/plata metálica con articulaciones mecánicas visibles
- Circuitos y venas rojas luminosas corriendo por el interior de la estructura
- Gesto: dedo índice extendido apuntando al logo
- El rojo de los circuitos coincide con el rojo del wordmark
- Representa: IA interactuando con el contenido — "el click de la inteligencia artificial"

**Estrella de 4 puntas ✦ (firma de marca):**
- Color: blanco `#FFFFFF`
- Tamaño: pequeño, posición esquina inferior derecha
- Aparece en todas las variantes — elemento de firma/sello de la marca

**Fondo del logo:**
- Negro profundo `#0A0A0A` o gris carbón `#1A1A1A` con textura sutil
- El logo nunca aparece sobre fondos claros o blancos

---

## PALETA DE COLORES

### Colores de marca (Logo)

| Nombre | Hex | Uso |
|--------|-----|-----|
| Rojo carmesí brand | `#CC2222` | Color principal del wordmark "Angles" |
| Rojo brand oscuro | `#AA1111` | Profundidad y sombra del wordmark |
| Rojo brand sombra | `#3B0000` | Cara lateral/extrusión del wordmark |
| Rojo neuronal | `#FF3300` | Punto focal de la red neuronal del ícono |
| Rojo neuronal medio | `#CC2222` | Nodos y líneas de la red neuronal |
| Plata wordmark | `#D0D0D0` | Cara frontal de "Click" |
| Cromo sombra | `#404040` | Cara lateral de "Click" |

### Colores funcionales de la UI

| Nombre | Hex | Uso |
|--------|-----|-----|
| Accent (rojo UI) | `#DC2626` | Botones primarios, highlights, CTAs activos |
| Accent Light | `#EF4444` | Texto de énfasis, glows en UI |
| Accent Dark | `#B91C1C` | Gradiente profundo en botones |
| Accent Glow | `rgba(220, 38, 38, 0.25)` | Sombras de énfasis |
| Accent Subtle | `rgba(220, 38, 38, 0.08)` | Fondos de hover suave |

### Fondos (Dark Mode — obligatorio)

| Nombre | Hex | Uso |
|--------|-----|-----|
| BG Primary | `#0A0A0A` | Fondo de página principal |
| BG Secondary | `#111111` | Sidebar, topbar |
| BG Tertiary | `#1A1A1A` | Inputs, tabs, botones secundarios |
| Card BG | `#141414` | Tarjetas, paneles, modales |
| Card Hover | `#1C1C1C` | Estado hover de tarjetas |
| Elevated BG | `#1E1E1E` | Dropdowns, tooltips |

### Texto

| Nombre | Hex | Uso |
|--------|-----|-----|
| Text Primary | `#F5F5F5` | Títulos, cuerpo principal |
| Text Secondary | `#A3A3A3` | Subtítulos, labels, texto secundario |
| Text Tertiary | `#666666` | Texto muted, disabled |
| Text Muted | `#4A4A4A` | Placeholders, hints |

### Semánticos

| Nombre | Hex | Uso |
|--------|-----|-----|
| Success | `#10B981` | Métricas positivas, estados completados |
| Success Light | `#34D399` | Texto success sobre fondos oscuros |
| Warning | `#F59E0B` | Badges admin, precaución |
| Danger | `#EF4444` | Acciones destructivas, errores |

### Bordes y Glass

| Nombre | Valor | Uso |
|--------|-------|-----|
| Border | `#222222` | Bordes estándar de cards y elementos |
| Border Light | `#2A2A2A` | Bordes sutiles en hover |
| Border Accent | `rgba(220, 38, 38, 0.3)` | Bordes de énfasis/selección |
| Glass BG | `rgba(20, 20, 20, 0.80)` | Fondos glassmorphism UI |
| Glass Border | `rgba(255, 255, 255, 0.06)` | Bordes en elementos glass |
| Glass Blur | `20px` | backdrop-filter estándar |

### Gradientes canónicos

```css
/* Botón primario */
background: linear-gradient(135deg, #DC2626, #B91C1C);

/* Wordmark en UI (versión CSS simplificada) */
background: linear-gradient(135deg, #F5F5F5, #EF4444);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;

/* Progress bars */
background: linear-gradient(90deg, #DC2626, #EF4444);

/* Glow radial en login/hero */
background: radial-gradient(ellipse at 50% 0%, rgba(220, 38, 38, 0.08) 0%, transparent 60%);

/* Red neuronal (para elementos decorativos de fondo) */
background: radial-gradient(circle at center, rgba(255,51,0,0.4) 0%, rgba(204,34,34,0.2) 40%, transparent 70%);
```

---

## TIPOGRAFÍA

### Fuentes

| Fuente | Rol | Pesos | Origen |
|--------|-----|-------|--------|
| **Inter** | UI completa — toda la interfaz funcional | 300–900 | Google Fonts |
| **Bebas Neue / Anton** | Display — títulos hero, wordmark en UI | 400 (son monoweight) | Google Fonts |
| **Bangers** | Impacto especial — thumbnails dramáticos | 400 | Google Fonts |
| **SF Mono / Fira Code** | Código, valores técnicos | 400, 500 | Sistema / Google Fonts |

> El logo usa una fuente display bold condensada (estilo Bebas Neue). Para replicar el estilo del logo en la UI, usar `font-family: 'Bebas Neue', 'Anton', sans-serif` con `letter-spacing: 0.02em`.

### Escala tipográfica

| Elemento | Tamaño | Peso | Color |
|----------|--------|------|-------|
| Título hero / logo text | `clamp(32px, 5vw, 64px)` | 900 display | gradiente white→red |
| Título de sección | `20px` | 700 Inter | `#F5F5F5` |
| Título de tarjeta | `14px` | 600 Inter | `#F5F5F5` |
| Label de navegación | `13px` | 500 Inter | `#A3A3A3` → activo `#F5F5F5` |
| Cuerpo de texto | `13–14px` | 400 Inter | `#A3A3A3` |
| Texto pequeño | `12px` | 400–500 | `#666666` |
| Micro texto / badges | `11px` | 700 | varía |
| Valor de métrica | `32px` | 800 Inter | `#F5F5F5` + glow rojo |
| Fuente base fluida | `clamp(12px, 0.85vw, 16px)` | — | — |

---

## ESTILO GLASSMORPHISM — GUÍA DE IMPLEMENTACIÓN

### Glassmorphism CSS (UI — versión plana)

Para elementos de interfaz como cards flotantes, modales, overlays:

```css
.glass-element {
  background: rgba(20, 20, 20, 0.80);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}
```

### Glassmorphism Brand (replicando el estilo del logo en UI)

Para elementos que quieran evocar el estilo del ícono — bordes cristalinos con brillo:

```css
.glass-brand {
  background: rgba(30, 30, 35, 0.60);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-top: 1px solid rgba(255, 255, 255, 0.22);  /* highlight superior */
  border-left: 1px solid rgba(255, 255, 255, 0.14); /* highlight lateral */
  box-shadow:
    0 0 0 1px rgba(0,0,0,0.3),                       /* borde exterior sutil */
    inset 0 1px 0 rgba(255,255,255,0.08),             /* brillo interior superior */
    0 8px 32px rgba(0,0,0,0.4),                       /* sombra profunda */
    0 0 20px rgba(220, 38, 38, 0.15);                 /* glow rojo ambiental */
  border-radius: 12px;
}
```

### Red neuronal decorativa (CSS — para fondos o elementos hero)

```css
/* Efecto de nodo pulsante */
.neural-node {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #FF3300;
  box-shadow: 0 0 8px rgba(255,51,0,0.8), 0 0 16px rgba(255,51,0,0.4);
  animation: neuralPulse 2s ease-in-out infinite;
}

@keyframes neuralPulse {
  0%, 100% { box-shadow: 0 0 8px rgba(255,51,0,0.8), 0 0 16px rgba(255,51,0,0.4); }
  50%       { box-shadow: 0 0 12px rgba(255,51,0,1.0), 0 0 24px rgba(255,51,0,0.6); }
}

/* Línea de conexión */
.neural-line {
  background: linear-gradient(90deg, transparent, rgba(204,34,34,0.6), transparent);
  height: 1px;
  animation: neuralFlow 3s ease-in-out infinite;
}
```

---

## COMPONENTES — REGLAS DE ESTILO

### Botones

```css
/* Primario */
.btn-primary {
  background: linear-gradient(135deg, #DC2626, #B91C1C);
  color: white;
  box-shadow: 0 0 20px rgba(220, 38, 38, 0.25);
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
}
.btn-primary:hover {
  box-shadow: 0 0 30px rgba(220, 38, 38, 0.4);
  transform: translateY(-1px);
}

/* Secundario */
.btn-secondary {
  background: #1A1A1A;
  border: 1px solid #222222;
  color: #F5F5F5;
  border-radius: 8px;
}

/* Ghost */
.btn-ghost {
  background: transparent;
  color: #A3A3A3;
  border-radius: 8px;
}
.btn-ghost:hover { background: #1A1A1A; }

/* Danger */
.btn-danger {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #EF4444;
  border-radius: 8px;
}

/* Ícono cuadrado */
.btn-icon {
  width: 36px;
  height: 36px;
  background: #1A1A1A;
  border: 1px solid #222222;
  border-radius: 8px;
}
```

### Tarjetas (Cards)

```css
/* Estándar */
.card {
  background: #141414;
  border: 1px solid #222222;
  border-radius: 12px;
  padding: clamp(14px, 1.25vw, 24px);
  transition: border-color 0.15s, background 0.15s;
}
.card:hover {
  border-color: #2A2A2A;
  background: #1C1C1C;
}

/* Glass UI */
.card-glass {
  background: rgba(20, 20, 20, 0.80);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

/* Glass Brand (estilo logo) */
.card-glass-brand {
  background: rgba(30, 30, 35, 0.60);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-top: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(220,38,38,0.12);
  border-radius: 12px;
}

/* Métrica */
.metric-card .value {
  font-size: 32px;
  font-weight: 800;
  font-family: 'Inter', sans-serif;
  text-shadow: 0 0 20px rgba(220, 38, 38, 0.4);
}
```

### Inputs y formularios

```css
input, textarea, select {
  background: #1A1A1A;
  border: 1px solid #222222;
  color: #F5F5F5;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  transition: border-color 0.15s, box-shadow 0.15s;
}
input:focus {
  border-color: #DC2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
  outline: none;
}
```

### Badges / Pills

```css
.badge {
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
}
/* accent: bg #DC2626 | success: #10B981 | warning: #F59E0B | danger: #EF4444 | neutral: #333 */
```

### Íconos

- Sistema: SVG monochrome, `currentColor`
- Tamaño por defecto: `20×20px` | SM: `16px` | LG: `24px` | XL: `32px`
- Estilo: stroke-based, `stroke-width: 1.8`
- **Regla:** Siempre `currentColor` — nunca fill sólido propio

---

## ESPACIADO & LAYOUT

### Variables de espacio fluidas

```css
--space-xs:  clamp(3px, 0.25vw, 4px);
--space-sm:  clamp(6px, 0.5vw, 8px);
--space-md:  clamp(10px, 0.9vw, 16px);
--space-lg:  clamp(14px, 1.25vw, 24px);
--space-xl:  clamp(18px, 1.7vw, 32px);
--space-2xl: clamp(24px, 2.5vw, 48px);
```

### Border Radius

| Nombre | Valor | Uso |
|--------|-------|-----|
| sm | `6px` | Badges, pills pequeñas |
| md | `8px` | Inputs, botones, íconos de app |
| lg | `12px` | Tarjetas, paneles |
| xl | `16px` | Modales, panels destacados |
| full | `9999px` | Pills de estado |

### Layout principal

```
Sidebar:    clamp(200px, 16vw, 260px) — bg: #111111 — border-right: 1px #222222
Topbar:     clamp(52px, 4.5vw, 64px)  — bg: #111111 — border-bottom: 1px #222222
Workspace:  flex: 1 — padding: clamp(12px, 1.5vw, 32px) — overflow: auto
```

---

## EFECTOS VISUALES

### Sombras de énfasis (Glow)

```css
/* Acento rojo — elementos primarios */
box-shadow: 0 0 20px rgba(220, 38, 38, 0.25);
box-shadow: 0 0 30px rgba(220, 38, 38, 0.4);  /* hover */

/* Rojo neuronal — elementos decorativos brand */
box-shadow: 0 0 12px rgba(255, 51, 0, 0.8), 0 0 24px rgba(255, 51, 0, 0.4);

/* Success */
box-shadow: 0 0 20px rgba(16, 185, 129, 0.25);

/* Login card / hero */
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(220, 38, 38, 0.25);
```

### Transiciones

```css
transition: all 0.15s ease;                          /* rápida — hover inmediato */
transition: all 0.25s ease;                          /* normal — estándar */
transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); /* dramática — entradas de panel */
```

### Animaciones clave

```css
@keyframes glow {
  0%, 100% { box-shadow: 0 0 20px rgba(220, 38, 38, 0.25); }
  50%       { box-shadow: 0 0 30px rgba(220, 38, 38, 0.5); }
}
@keyframes neuralPulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50%       { opacity: 1;   transform: scale(1.15); }
}
@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
@keyframes neuralFlow {
  0%   { opacity: 0; transform: scaleX(0); }
  50%  { opacity: 1; transform: scaleX(1); }
  100% { opacity: 0; transform: scaleX(0); }
}
```

---

## FILOSOFÍA DE DISEÑO

**Estética:** Tech-cinematic premium dark — inspiración: Vercel · Linear · Raycast · Figma dark · Cyberpunk limpio

**El logo define la aspiración visual:** El logo es 3D renderizado, glassmorphism real, con profundidad cinematográfica. La UI replica esa sensación mediante:
- Fondos ultra oscuros como telón
- Glass CSS que evoca el cristal del ícono
- Glow rojo que evoca la red neuronal
- Tipografía bold condensada para momentos de impacto

**Principios:**
1. **Dark first siempre:** Todo sobre fondos `#0A0A0A–#1A1A1A`. Nunca light mode.
2. **Dos rojos con propósitos distintos:** `#DC2626` para UI funcional / `#CC2222–#AA1111` para brand y momentos cinematográficos.
3. **Glass como lenguaje de profundidad:** El cristal del logo debe sentirse en los elementos premium de la UI.
4. **La red neuronal es la firma:** El patrón de nodos rojos conectados puede aparecer como textura de fondo, decoración de hero, o elementos de loading.
5. **Glow con jerarquía:** Solo en elementos de máxima prioridad y en momentos de actividad.
6. **Densidad informativa precisa:** Interfaces técnicas sin ruido visual.

**Lo que NUNCA hacer:**
- Fondos claros o blanco
- Colores fuera del design system
- Fuentes distintas a Inter (UI) o Bebas Neue/Anton (display)
- Bordes redondeados > 16px en UI normal
- Glassmorphism sin backdrop-filter (debe verse difuminado)
- Mezclar estilos de ícono (stroke vs fill)
- Rojo saturado brillante donde corresponde el rojo carmesí del brand

---

## STACK TÉCNICO

- **Bundler:** Vite
- **Framework:** Vanilla JavaScript + Vanilla CSS (sin frameworks UI)
- **AI:** Google Generative AI (`@google/genai`)
- **Backend/Auth:** Supabase (`@supabase/supabase-js`)
- **Fuentes:** Google Fonts — Inter + Bebas Neue + Bangers
- **CSS:** Variables nativas (`--var`), sin Tailwind, sin preprocessors

---

## CHECKLIST ANTES DE IMPLEMENTAR UI

- [ ] ¿El fondo usa los valores del dark palette (`#0A0A0A–#1E1E1E`)?
- [ ] ¿Los colores de acento son del design system?
- [ ] ¿La tipografía es Inter (UI) o Bebas Neue (display)?
- [ ] ¿Los border-radius siguen la escala (6/8/12/16px)?
- [ ] ¿Los íconos son stroke-based y usan `currentColor`?
- [ ] ¿Los estados hover tienen transición de `0.15s–0.25s`?
- [ ] ¿Los elementos primarios tienen glow rojo apropiado?
- [ ] ¿El espaciado usa las variables `--space-*` o sus equivalentes fluidos?
- [ ] ¿Los inputs tienen focus state con borde rojo + glow?
- [ ] ¿Los botones primarios usan el gradiente `#DC2626 → #B91C1C`?
- [ ] ¿Los elementos glass tienen `backdrop-filter: blur(20px+)` real?
- [ ] ¿El estilo evoca la profundidad y cinematografía del logo?
