import { supabase } from '../lib/supabase.js';
import { getState, subscribe } from '../lib/state.js';
import { setActiveProject } from '../lib/projects.js';
import { icon } from '../icons.js';
import { callAI, generateImage, callAIWithImages, translateCelebrityIfNeeded, critiqueAndRefinePrompt, critiqueImageForRefinement, IMAGE_GEN_MODEL_CELEBRITY } from '../lib/intelligence.js';
import { toast, confirmDialog, inputDialog } from '../lib/toast.js';
import { showLoader, updateLoader, hideLoader, ensureLoaderStyles } from '../lib/loader.js';
import { openVideoSwitcher } from '../components/video-switcher.js';

// ─── Creative Config ────────────────────────────────────────────────────────

const FORMATS = [
  {
    id: 'versus',
    label: 'Duelo de Titanes',
    subtitle: 'Versus / Split Screen',
    emoji: '⚔️',
    desc: 'Contraste visual extremo. Composición de confrontación inventada por un diseñador gráfico experto.',
    composition: `FORMAT: DUELO DE TITANES (Confrontation / Versus / Before-After). You are a world-class YouTube thumbnail graphic designer. DO NOT use a generic line down the middle — that is amateur and boring. Instead, choose the single most visually explosive execution for this specific content from the creative approaches below, and push it to its maximum potential:

OPTION A — TORN WORLD SPLIT: The canvas is dramatically split diagonally with a jagged torn edge, as if reality divided in two. Each world (left vs right) is a completely different environment, atmosphere, and color temperature. Objects or debris scatter along the tear edge in 3D perspective.

OPTION B — COLLISION EPICENTER: Both elements meet at dead center, generating a shockwave burst, energy impact, or shatter point that organically divides the composition. No line — pure kinetic energy. Particles fly outward from the collision point.

OPTION C — BEFORE / AFTER TEMPORAL CONTRAST: Left side = the "before" world — muted, desaturated, dim, beaten-down. Right side = the dramatic "after" — saturated, lit, transformed, powerful. A sharp but organic edge (light spill, smoke wall, broken frame) separates the two states. The subject may appear on both sides showing transformation.

OPTION D — WORLD VS WORLD ENVIRONMENTAL CLASH: Each half contains a completely different environment that embodies the contrast — wealth vs poverty, fire vs ice, chaos vs order, city vs nature, past vs future. The subject inhabits their respective world. The contrast between environments IS the composition — no explicit divider needed beyond the natural environmental boundary.

OPTION E — DIAGONAL POWER SPLIT: A bold diagonal slash divides the frame from upper-left to lower-right at 45°. Each triangle-half has its own lighting, color world, and subject positioning. The dividing angle creates aggressive dynamic tension. Elements lean INTO the diagonal.

OPTION F — FACE DUALITY EXTREME CLOSE-UP: Two dramatically different expressions or states of the same subject fill each half of the frame in extreme close-up — joy vs rage, before vs after, weak vs powerful, trapped vs free. The split happens at the nose bridge or center of the face. Maximum facial expression contrast.

CHOSEN EXECUTION: Select ONE option above that best matches the Layer 3 content themes. Execute it at 100% creative intensity — no holding back. Both compositional halves must create irresistible visual tension. CRITICAL: All colors MUST derive from the content thematic palette in Layer 2.5 — never use neon/tech tones unless the content is explicitly tech-related.`,
  },
  {
    id: 'authority',
    label: 'Autoridad Tech',
    subtitle: 'Hero Object / Objeto de Deseo',
    emoji: '🖥️',
    desc: 'Foco en el objeto con profundidad de campo extrema. El creador proyecta liderazgo total.',
    composition: `FORMAT: AUTORIDAD — HERO OBJECT DOMINANCE. You are a world-class YouTube thumbnail graphic designer. Design the composition so the hero object commands absolute visual authority. Choose the most impactful execution for this specific content:

OPTION A — FLOATING OBJECT IN DRAMATIC VOID: The hero object floats in an impossibly dramatic environment — suspended in space, emerging from a dark abyss, levitating above chaos. The background is rich with atmospheric depth (volumetric light rays, fog, particles) that makes the object feel mythic and unreachable.

OPTION B — OVERSIZED OBJECT / HUMAN DWARFED: The object is rendered at absurd scale — a phone the size of a building, a stack of money towering over a city, a product that fills the entire frame. The human subject (if present) stands at its base, dwarfed, pointing upward in awe or greed. Scale contrast creates instant visual shock.

OPTION C — HAND REVEAL DRAMATIC LIGHTING: A hand emerges from darkness in extreme close-up, holding or presenting the hero object under a single dramatic spotlight. Everything outside the spotlight is consumed by deep shadow. The object glows as if radioactive with internal light. Hyper-sharp product photography meets cinematic noir.

OPTION D — CREATOR COMMAND POSE: Subject positioned in extreme authority pose (leaning forward, arms spread, or standing over the frame) with the hero object integrated into their posture as a weapon, shield, or prize. Environmental context reinforces the power dynamic — throne room, wreckage, command center, vault. Background color temperature from Layer 2.5.

CHOSEN EXECUTION: Select ONE option above that creates the maximum sense of desire, authority, and "I need to know more." Hero object must be unmistakably sharp and dominant. Bokeh, atmosphere, and accent colors all derive from Layer 2.5.`,
  },
  {
    id: 'shock',
    label: 'Shock / Caja Negra',
    subtitle: 'Misterio / Curiosity Gap',
    emoji: '🖤',
    desc: 'Psicología de la curiosidad. Diseñado para crear una brecha de intriga irresistible.',
    composition: `FORMAT: SHOCK — CURIOSITY GAP / PSYCHOLOGICAL MYSTERY. You are a world-class YouTube thumbnail graphic designer who understands the psychology of the curiosity gap. The viewer must feel physically compelled to click to resolve the tension. Choose the most psychologically effective execution:

OPTION A — THE CENSORED SECRET: A key element — a face, an object, an amount, a location — is deliberately hidden behind a solid bold geometric bar, heavy pixelation, or strategic shadow that feels intentional and provocative. The surrounding context makes the hidden element's identity obvious enough to be tantalizing but impossible to confirm without clicking.

OPTION B — THE HALF-REVEALED MYSTERY: Something enormous or surprising is cut off by the frame edge — only a portion visible (oversized hand, huge number, dramatic structure edge, shadow of something unseen). The composition forces the viewer's brain to imagine what's outside the frame. Maximum negative space tension.

OPTION C — THE EXTREME REACTION CLOSE-UP: Face in absolute extreme close-up — only eyes and forehead visible, or mouth agape in pure shock. The viewer reads the emotion viscerally before processing the context. The subject's gaze direction points to something off-camera that we cannot see. Dark vignette crushes the edges. A single harsh light source carves the face with deep shadows.

OPTION D — THE BROKEN FOURTH WALL: Subject stares DIRECTLY into camera with an expression of "you won't believe what I found" — intimate conspiratorial eye contact. One hand points or gestures toward a dark, fogged area of the frame where the secret object/scene is barely visible. Feels like forbidden knowledge being shared.

CHOSEN EXECUTION: Select ONE option that creates maximum psychological tension for this content. The image must feel incomplete without clicking. Ambient light and accent glow color from Layer 2.5. Cinematic crop feel, heavy vignette edges.`,
  },
  {
    id: 'breaking',
    label: 'Alerta / Breaking News',
    subtitle: 'Urgencia Total',
    emoji: '🚨',
    desc: 'Urgencia visual máxima. Diseñado para detener el scroll con sensación de evento inmediato.',
    composition: `FORMAT: ALERTA — MAXIMUM URGENCY / BREAKING EVENT. You are a world-class YouTube thumbnail graphic designer who specializes in high-urgency visual communication. Design for one purpose: make the viewer feel something important is happening RIGHT NOW and they must watch. Choose the most effective urgency execution:

OPTION A — THE BROADCAST CRISIS FRAME: Broadcast news visual language — bold solid color band graphic at bottom third (pure color/shape, ZERO text or letters). Subject in urgent forward-lean pose centered in frame as if delivering an emergency announcement. Hard rim lighting separates subject from dramatic background. Graphic icon badge (symbol only, no letters) in upper corner signals alert category. Color palette from Layer 2.5.

OPTION B — DRAMATIC EVENT BACKDROP: Subject positioned in confident foreground stance while a massive high-energy event unfolds behind them — transformation, energy surge, crowd movement, dramatic shift. The juxtaposition of composed subject against intense background creates extreme visual tension. Subject appears aware of what is unfolding behind them.

OPTION C — THE COUNTDOWN / URGENCY GRAPHIC OVERLAY: Abstract countdown or urgency graphic element — a cracked frame around the image, warning stripe borders (graphic pattern only, no text), concentric circle shock waves, or a flashing alert icon rendered as a pure geometric shape. The entire image feels like a system alert. Colors scream danger from Layer 2.5 thematic palette.

OPTION D — THE EVIDENCE REVEAL: Document, photograph, screenshot, or physical evidence presented dramatically — held up toward camera, scattered on a surface with dramatic overhead lighting, or partially torn to reveal something underneath. The subject's hand or face frames the reveal. Feels like proof of something shocking being shown to the viewer.

CHOSEN EXECUTION: Select ONE option that creates the most urgent "this just happened" feeling for this specific content. ALL text/letters/numbers in the image = ZERO. Pure visual language only. Alert colors from Layer 2.5.`,
  },
  {
    id: 'reaction',
    label: 'Emoción Pura',
    subtitle: 'Face / Reacción',
    emoji: '🤳',
    desc: 'La cara del creador ES la miniatura — o el creador reaccionando a un personaje famoso. El formato #1 de YouTube en 2026: el 40% de los clics vienen de la zona de emoción del frame.',
    composition: `FORMAT: EMOCIÓN PURA — FACE-FORWARD REACTION (the #1 highest-CTR composition format on YouTube 2026, validated by eye-tracking: 40% of clicks originate from the face/emotion zone). You are a world-class YouTube thumbnail designer. BEFORE choosing any composition option, READ LAYER 3 carefully and decide which execution path applies:

━━━ PATH A — CELEBRITY / PUBLIC FIGURE AS HERO ━━━
Apply this path ONLY if the HERO ELEMENT in Layer 3 names a specific recognizable person: a celebrity, musician, athlete, politician, actor, historical icon, or famous public figure (examples: Shakira, Michael Jackson, Elon Musk, Cristiano Ronaldo, Taylor Swift, etc.).

In Path A: THE CELEBRITY IS THE PRIMARY VISUAL ANCHOR.
- The celebrity must occupy 50–60% of the frame in a position that makes their identity INSTANTLY recognizable — their signature features, iconic pose, characteristic style, or defining visual trait must be identifiable by any viewer in 0.2 seconds even at thumbnail size. Do not invent a generic face — represent this specific person's well-known visual identity.
- The creator's face (if present from Layer 6) appears in a SECONDARY, SMALLER position — typically right side or upper corner — and expresses a visceral emotion DIRECTED AT the celebrity: shock, disbelief, excitement, awe, fear, or admiration. The creator does NOT compete with the celebrity for visual dominance — they AMPLIFY the emotional reading for the viewer.
- If Layer 6 contains NO creator face, fill the secondary zone with a dramatic environmental element, strong graphic accent, or bold color from Layer 2.5 that contextualizes the celebrity's presence.
- VISUAL RELATIONSHIP IS THE STORY: The celebrity and creator face must connect through eye-line direction — the creator visually reacts TO the celebrity. This tension between the two subjects IS the thumbnail narrative. The viewer asks: "What did [celebrity] do that caused that reaction?"
- Lighting: celebrity = key-lit dominant subject; creator face (if present) = complementary accent rim light from behind. Background from Layer 2.5 thematic palette matching the video's emotional temperature.

━━━ PATH B — CREATOR FACE AS HERO (no specific celebrity in Layer 3) ━━━
Apply this path if the HERO ELEMENT in Layer 3 is abstract, conceptual, a generic object, a place, a topic (finanzas, negocios, salud, tecnología, etc.), or any non-recognizable/non-celebrity subject. In this path, the CREATOR'S FACE from the Layer 6 reference photo IS the primary visual anchor. Choose ONE of the following executions:

OPTION B1 — THE OVERSIZED EMOTION FRAME: Creator's face anchored to the TOP-LEFT, filling 60–70% of the canvas. Expression cinematically over-the-top: eyes impossibly wide, jaw dropped, eyebrows at maximum height, or face contorted in pure shock/disbelief/triumph (2x more intense than any natural human expression). Background: single dramatically contrasting solid color or bold gradient that punches the skin tone forward — zero environment, zero texture, pure chromatic contrast. One accent visual element (an object, arrow, icon — zero text or letters) in the upper-right negative space implies the cause of the emotion. The viewer's brain reads the emotion in 0.1 seconds and MUST know what caused it.

OPTION B2 — THE CONSPIRATORIAL LEAN: Creator in tight 3/4 close-up, leaning TOWARD the camera — as if sharing a forbidden secret directly with the viewer. Eyes locked into the camera with an "I know something you don't" intensity. One hand raised naturally toward the face (finger to lips, cupping the jaw, or pointing off-frame). Background: deep vignette darkness with a single sharp rim light in the Layer 2.5 accent color isolating the face from the void. Simultaneously intimate and urgent.

OPTION B3 — THE EMOTION + EVIDENCE DIPTYCH: Creator face LEFT 55% — pure raw emotion matching the emotion_label from Layer 3. RIGHT 45%: ONE concrete visual element (product, chart silhouette, symbolic object, graphic icon) showing the WHY of the emotion. Hard boundary (color shift, shadow edge, or light spill) separates the two zones. Zero text — the composition tells the complete story in 0.3 seconds.

OPTION B4 — THE MACRO SCALE EXPRESSION: Creator face at MASSIVE scale — only the eye-to-jaw zone visible, top of head and chin both cropped off. Skin texture, the fire in the eyes, the jaw tension — all rendered at cinematic macro scale that makes the emotion feel physically overwhelming. Background: single oversaturated bold color from Layer 2.5 for maximum skin-tone contrast. Zero environmental elements, zero distractions.

ABSOLUTE RULES (apply to BOTH Path A and Path B):
(1) The dominant expression — whether celebrity, creator, or both — MUST match the emotion_label from Layer 3 (SORPRESA/AUTORIDAD/MIEDO/DUDA). Exaggerated 2x beyond natural.
(2) Dramatic studio or cinematic lighting ONLY — volumetric key light carving facial geometry, colored rim lights from behind. Natural ambient lighting is NOT allowed.
(3) All accent colors from Layer 2.5 thematic palette — NEVER generic defaults.
(4) Zero text, letters, or words anywhere in the image.
(5) The composition must pop at 150px mobile thumbnail size — the primary face must remain the instant focal point at any display size.`,
  },
  {
    id: 'colorblock',
    label: 'Color Block',
    subtitle: 'Impacto Geométrico',
    emoji: '🟥',
    desc: 'Bloques geométricos de color como arquitectura principal. El trend de mayor crecimiento en 2026 — se diferencia instantáneamente en feeds saturados de fotorrealismo.',
    composition: `FORMAT: COLOR BLOCK — GEOMETRIC CHROMATIC ARCHITECTURE (the fastest-growing CTR composition trend of 2026, dominating finance, motivation, and brand channels — especially powerful in dark mode feeds where pure color geometry creates instant scroll-stopping contrast against complex photorealistic competition). You are a world-class YouTube thumbnail designer and senior brand strategist who understands that in a feed saturated with complex imagery, pure color geometry commands attention faster than any photograph. The color structure IS the communication. Choose the most visually explosive execution:

OPTION A — THE DIAGONAL CHROMATIC SLASH: The frame is divided by a razor-sharp diagonal line cutting from one corner to the opposite (upper-left to lower-right, or upper-right to lower-left — choose the direction that creates maximum tension for this content). Each geometric triangle zone has its own FLAT SOLID bold color from the Layer 2.5 thematic palette — one warm-saturated anchor color, one cool-dark contrast. The subject (face or object) straddles the dividing line, partially bathed in each color zone — existing at the collision point of two worlds. No gradients, no textures in the color zones — PURE FLAT fills with maximum pigment intensity. Complementary color pairs for maximum contrast: red/white, electric orange/near-black, cobalt blue/warm yellow, deep purple/gold. The diagonal generates aggressive forward momentum that makes the eye move across the frame.

OPTION B — THE ARCHITECTURAL BAND SPLIT: The frame uses bold horizontal or vertical solid-color bands of dramatically different hues. One dominant anchor band (55-65% of frame area) and one or two high-contrast accent bands. The subject is fully placed within one color zone, cleanly isolated as if printed on a graphic poster — zero background complexity, zero depth simulation. A secondary visual element (object, icon silhouette, symbolic shape — zero letters) lives in the contrasting band. Each zone: absolutely flat color, zero gradients, zero noise, zero texture. The composition reads as designed — like a premium advertising campaign where every pixel has a purpose. Colors all from Layer 2.5 content theme.

OPTION C — THE CORNER INVASION FRAME: Bold geometric color shapes (oversized rectangles, aggressive angled blocks, thick L-brackets, diagonal wedges) burst in from multiple corners or frame edges, creating a "graphic design layer" that frames the subject without covering their face or key elements. Each shape is a flat saturated solid color — confident, oversized, unmissable. The subject appears to exist in front of the color geometry, creating a dimensional layering effect (subject → color shapes → background). Maximum 3 colors total: one for the geometric invasion shapes, one for the background zone, one accent. Derive every color from the Layer 2.5 content palette — never generic defaults.

OPTION D — THE CHROMATIC TRIPTYCH: Frame divided into exactly 3 vertical bands of sharply contrasting colors. The central band (widest, 50% of frame) anchors the primary subject in full contrast against its color. The flanking left and right bands (25% each) are narrower, bolder accent colors that create symmetric bracket tension around the center. The overall composition reads as a graphic design system — mathematical, intentional, premium. The subject is photographically real (photorealistic face or object) but the color architecture makes the entire frame feel designed rather than captured. All 3 colors from Layer 2.5 thematic palette, chosen for maximum three-way contrast.

CHOSEN EXECUTION: Select ONE option that creates the most graphically powerful "designed-not-shot" impact for this content. ABSOLUTE RULES: (1) Maximum 3 colors in the ENTIRE frame — no exceptions. (2) ALL background zones are FLAT SOLID FILLS — zero gradients, zero textures, zero atmospheric effects, zero noise. (3) Subject must be razor-sharp with clean edges, maximally contrasted against their color zone. (4) The composition must read with equal impact in light mode AND dark mode feeds. (5) Zero text or letters in the image. (6) Derive every color from Layer 2.5 thematic content palette — never generic reds, blues, or yellows as defaults. The color choices must be EARNED by the content's emotional temperature.`,
  },
];

const STYLES = [
  {
    id: 'hyperrealist',
    label: 'Master Studio (UHD)',
    subtitle: '8K Realismo',
    emoji: '📸',
    keywords: 'Ultra-photorealistic, 8k resolution, raw photography masterwork, intricate skin textures with visible pores, volumetric studio lighting, professional color grading, extreme sharpness, zero artifacting, zero AI-look.',
    lighting: 'VISUAL STYLE — MASTER STUDIO HYPERREALISM: Execute this as a professional commercial photographer with a $50,000 studio setup. Three-point lighting: sharp key light from 45° carving dramatic facial geometry, soft fill eliminating dead shadows, tight separation rim light that pops the subject off the background. 8K ultra-sharp rendering — skin pores, fabric threads, material grain all visible. Color science: neutral-to-warm grade with precise skin tone accuracy. Every surface must look physically real and tangible — this image could be mistaken for a photograph. Zero cartoon artifacts, zero plastic skin, zero AI glow. Maximum photographic credibility.',
  },
  {
    id: 'mrbeast',
    label: 'Estilo Explosivo',
    subtitle: 'High CTR',
    emoji: '🔥',
    keywords: 'Hyper-punchy MrBeast-level CTR aesthetic, extreme color saturation, crushed blacks, micro-contrast maximum, cartoonish-realism skin, vivid glowing rim lights, super-charged visual impact that stops the scroll instantly.',
    lighting: 'VISUAL STYLE — EXPLOSIVE HIGH-CTR: Execute this like a viral thumbnail designer who has studied 10,000 top-performing YouTube videos. Hyper-saturated color grading — blacks crushed to pure black, highlights almost blown out, every color pushed 40% beyond natural saturation. Intense rim lights wrapping subjects from behind — color derived from content thematic palette (Layer 2.5): action/drama/intensity → blazing orange-red rims; tech/digital → electric blue-white; money/power → blinding golden-white; mystery/tension → deep crimson-purple. Skin treatment: retouched to cartoonish sharpness while remaining humanly recognizable — zero pores visible, every feature slightly exaggerated. Background elements: flat with punchy graphic quality. The image must feel like it has an internal light source radiating energy outward. Micro-contrast cranked to absolute maximum on every edge.',
  },
  {
    id: 'cyberpunk',
    label: 'Neon Future',
    subtitle: 'Sci-Fi',
    emoji: '🌆',
    keywords: 'Cyberpunk cinematic masterwork, dual neon color splits, deep midnight blue shadows, futuristic chrome and glass textures, holographic volumetric glow, synthwave atmosphere, rain-slicked surfaces, moody neon-noir.',
    lighting: 'VISUAL STYLE — NEON FUTURE SCI-FI: Execute this as a concept artist for a AAA sci-fi film production. Dual neon color split lighting: cyan from camera-left, magenta from camera-right, creating dramatic colored shadow geometry on every surface. Deep midnight blue fills all ambient areas. Holographic glow emanates from surfaces as if screens or energy sources are nearby — volumetric light beams cut through atmospheric haze. All surfaces: metallic, wet, rain-slicked, or chrome that catches and reflects the neon sources. Raindrops or fog particles caught in the light beams. APPLY THIS STYLE ONLY when the content involves technology, AI, digital products, sci-fi, or futuristic themes — it must be coherent with Layer 2.5 content palette.',
  },
  {
    id: 'minimal',
    label: 'Meta Ads Bold',
    subtitle: 'Impacto Limpio',
    emoji: '◼️',
    keywords: 'Swiss graphic design mastery, bold commercial photography, single-color bold background, geometric negative space, precision drop shadows, clinical sharpness, zero decorative noise, advertising campaign quality.',
    lighting: 'VISUAL STYLE — META ADS BOLD MINIMALISM: Execute this as a senior art director at a top-tier advertising agency. The power is in radical simplicity and negative space. Flat even product-photography lighting — no dramatic shadows, no atmospheric effects, no distractions. Single bold solid-color background: derive the most impactful and content-appropriate color from Layer 2.5 (NOT a generic default — choose based on the video theme). Subjects are ultra-sharp with clean hard-edged drop shadows creating graphic separation. Zero noise, zero texture, zero decorative elements. The composition breathes — generous negative space around the subject makes it feel confident and premium. Every element must have a reason to exist. If in doubt: remove it. The result should feel like a $100,000 advertising campaign.',
  },
  {
    id: 'cinematic',
    label: 'Epic Movie',
    subtitle: 'Hollywood',
    emoji: '🎬',
    keywords: 'Hollywood A-list movie poster craft, anamorphic lens flares, dramatic cinematic shadows, rich film color grade matched to emotional content, 35mm film grain texture, golden ratio composition, epic atmospheric depth.',
    lighting: 'VISUAL STYLE — EPIC HOLLYWOOD CINEMATIC: Execute this as a cinematographer and poster designer for a $200M Hollywood production. Every lighting and color decision must serve the emotional content from Layer 2.5 and Layer 3. Lighting matched to content emotional temperature: action/drama/intensity → extreme high-contrast side or under-lighting with deep actor shadows; historical/power → warm golden-hour side light casting long dramatic shadows; mystery/revelation → single harsh overhead or side spotlight, everything else swallowed by near-black. Anamorphic horizontal lens flares in the thematic accent color — subtle, elegant, not cartoonish. Color grade: derive from content mood — tension/triumph → teal shadows with warm-orange highlights; mystery/revelation → desaturated cold teal; wealth/power → rich warm golden tones with lifted shadows. 35mm film grain overlay at 15% — it feels shot on film, not rendered by AI. Epic atmospheric backdrop with atmospheric perspective depth. The result should look like a real movie poster.',
  },
  {
    id: 'neominimal',
    label: 'Neo-Minimal',
    subtitle: 'Trend 2026',
    emoji: '⬜',
    desc: 'El trend #1 del 2026. Un sujeto, 2-3 colores, máximo impacto. Legible a 150px en mobile.',
    keywords: 'neo-minimalist YouTube thumbnail 2026, single bold subject, maximum 2-3 color palette, generous negative space, clean geometric composition, strong contrast ratio, zero visual noise, premium brand feel, mobile-first design, readable at any thumbnail size.',
    lighting: 'VISUAL STYLE — NEO-MINIMAL 2026 (the #1 CTR trend for mobile-first consumption): Execute this as a senior art director who treats "less is more" as an absolute law. RULES: ONE dominant subject only — remove everything else. Maximum 3 colors in the entire frame (including the subject). Generous negative space around the subject — it must breathe. Lighting: flat, even, clean product photography — no dramatic shadows, no atmospheric effects, no haze, no particles. Background: single bold solid color derived from Layer 2.5 thematic palette (choose the most emotionally resonant color for this specific content — NOT a generic default). Subject must have razor-sharp clean edges, as if precision-cut and placed on the background. ZERO textures, ZERO gradients on background, ZERO decorative noise. The entire composition must communicate the concept in 0.3 seconds at 150px width — if it reads as complex at small size, it has failed. Remove any element that does not directly reinforce the single core message. Final result must feel premium, confident, and impossibly clean — like a $200 product on a white background. Mental test before finalizing: does it still create an immediate visual impact at thumbnail size? If not — simplify further.',
  },
];

// ─── Use-case labels (shown on format/style cards) ──────────────────────────

const FORMAT_USE_CASES = {
  versus:     'Comparaciones A vs B · Antes/Después · "¿Cuál es mejor?" · Debates · Transformaciones',
  authority:  'Tutoriales · Reviews de producto · Guías paso a paso · "El mejor X del mercado"',
  shock:      'Secretos revelados · "Nadie te dijo esto" · Misterios · Cosas ocultas · Curiosidades',
  breaking:   'Noticias urgentes · Advertencias del sector · FOMO · "Esto está pasando ahora"',
  reaction:   'Opiniones personales · Reacciones · Storytime · "Mi verdad sobre..." · Experiencias',
  colorblock: 'Finanzas · Motivación · Marca personal · Mensajes directos · Una idea, máximo impacto',
};

const STYLE_USE_CASES = {
  hyperrealist: 'Lifestyle · Vlog · Tech reviews · Todo nicho donde la credibilidad visual es clave',
  mrbeast:      'Entretenimiento · Retos · Gaming · Reacciones · Contenido viral de alto impacto',
  cyberpunk:    'Inteligencia Artificial · Tech futurista · Gaming · Criptomonedas · Ciencia · Sci-fi',
  minimal:      'Negocios · Coaching · Finanzas · Marcas premium · Cursos online · Contenido corporativo',
  cinematic:    'Documentales · Historias personales · Viajes · Drama · Motivación épica · Storytelling',
  neominimal:   'Productividad · Educación · Branding minimalista · Finanzas · Contenido premium 2026',
};

// ─── Main Panel ─────────────────────────────────────────────────────────────

function thumbLoaderHTML(title = 'Generando miniatura...', detail = 'IA PROCESANDO') {
  ensureLoaderStyles();
  return `
  <div style="position:absolute;inset:0;z-index:10;background:rgba(6,6,10,0.88);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;">
    <div style="position:absolute;inset:0;pointer-events:none;overflow:hidden;">
      <div style="position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(220,38,38,.5),transparent);animation:ca-scanline 2.4s cubic-bezier(.4,0,.6,1) infinite;"></div>
    </div>
    <div style="position:absolute;top:8px;left:8px;width:12px;height:12px;border-top:2px solid rgba(220,38,38,.5);border-left:2px solid rgba(220,38,38,.5);"></div>
    <div style="position:absolute;top:8px;right:8px;width:12px;height:12px;border-top:2px solid rgba(220,38,38,.5);border-right:2px solid rgba(220,38,38,.5);"></div>
    <div style="position:absolute;bottom:8px;left:8px;width:12px;height:12px;border-bottom:2px solid rgba(220,38,38,.5);border-left:2px solid rgba(220,38,38,.5);"></div>
    <div style="position:absolute;bottom:8px;right:8px;width:12px;height:12px;border-bottom:2px solid rgba(220,38,38,.5);border-right:2px solid rgba(220,38,38,.5);"></div>
    <div style="position:relative;width:60px;height:60px;margin-bottom:12px;flex-shrink:0;">
      <div style="position:absolute;inset:0;border-radius:50%;border:1px solid rgba(220,38,38,.1);"></div>
      <div style="position:absolute;inset:0;border-radius:50%;border:2px solid transparent;border-top-color:#DC2626;border-right-color:rgba(220,38,38,.25);animation:ca-spin-cw 1.6s linear infinite;"></div>
      <div style="position:absolute;inset:8px;border-radius:50%;border:2px solid transparent;border-bottom-color:#ef4444;border-left-color:rgba(239,68,68,.2);animation:ca-spin-ccw 1s linear infinite;"></div>
      <div style="position:absolute;inset:16px;border-radius:50%;border:1px solid transparent;border-top-color:rgba(248,113,113,.6);animation:ca-spin-cw 0.7s linear infinite;"></div>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
        <div style="width:10px;height:10px;border-radius:50%;background:radial-gradient(circle,#ef4444,#DC2626);animation:ca-pulse-core 1.8s ease-in-out infinite;"></div>
      </div>
    </div>
    <div style="font-size:9px;font-weight:900;color:#fff;letter-spacing:1.5px;text-transform:uppercase;text-align:center;margin-bottom:6px;padding:0 12px;line-height:1.3;">${title}</div>
    <div style="display:flex;align-items:center;gap:4px;">
      <span style="width:3px;height:3px;border-radius:50%;background:#DC2626;display:inline-block;animation:ca-blink 1.1s ease-in-out infinite;"></span>
      <span style="width:3px;height:3px;border-radius:50%;background:#DC2626;display:inline-block;animation:ca-blink 1.1s ease-in-out .3s infinite;"></span>
      <span style="width:3px;height:3px;border-radius:50%;background:#DC2626;display:inline-block;animation:ca-blink 1.1s ease-in-out .6s infinite;"></span>
      <div style="font-size:7px;color:#DC2626;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-left:4px;">${detail}</div>
    </div>
  </div>`;
}

// ─── Lightbox state — persists across renders ────────────────────────────────
let lbImages = []; // [{src, name}]
let lbIdx    = 0;

function closeLightbox() {
  const lb = document.getElementById('thumb-lightbox');
  if (!lb) return;
  lb.classList.remove('active');
  setTimeout(() => { const img = lb.querySelector('img'); if (img) img.src = ''; }, 260);
}

function lbNav(delta) {
  const next = lbIdx + delta;
  if (next < 0 || next >= lbImages.length) return;
  lbIdx = next;
  updateLightboxUI();
}

async function lbDownload() {
  const item = lbImages[lbIdx];
  if (!item?.src) return;
  try {
    const resp = await fetch(item.src);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = item.name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch { const a = document.createElement('a'); a.href = item.src; a.download = item.name; document.body.appendChild(a); a.click(); document.body.removeChild(a); }
}

function updateLightboxUI() {
  const lbImg     = document.getElementById('thumb-lightbox-img');
  const lbCounter = document.getElementById('lbcounter');
  const lbPrev    = document.getElementById('lbprev');
  const lbNext    = document.getElementById('lbnext');
  if (!lbImg) return;
  lbImg.src = lbImages[lbIdx]?.src || '';
  const multi = lbImages.length > 1;
  if (lbCounter) lbCounter.textContent = multi ? `${lbIdx + 1} / ${lbImages.length}` : '';
  if (lbPrev) { lbPrev.style.display = multi ? 'flex' : 'none'; lbPrev.disabled = lbIdx === 0; }
  if (lbNext) { lbNext.style.display = multi ? 'flex' : 'none'; lbNext.disabled = lbIdx === lbImages.length - 1; }
}

function openLightboxForImg(clickedImg) {
  const group = clickedImg.dataset.angleGroup;
  if (group) {
    const groupEls = [...document.querySelectorAll(`.thumb-preview-trigger[data-angle-group="${group}"]`)];
    lbImages = groupEls.map(el => ({ src: el.dataset.preview, name: el.dataset.name || 'miniatura.png' }));
    lbIdx = Math.max(0, groupEls.indexOf(clickedImg));
  } else {
    lbImages = [{ src: clickedImg.dataset.preview, name: clickedImg.dataset.name || 'miniatura.png' }];
    lbIdx = 0;
  }
  updateLightboxUI();
  document.getElementById('thumb-lightbox')?.classList.add('active');
}

export async function renderEngine(container) {
  const { activeChannelId } = getState();
  if (!activeChannelId) { container.innerHTML = '<div class="loading-spinner">Selecciona un canal</div>'; return; }

  showLoader(container, { title: 'Cargando proyectos...', subtitle: 'Sincronizando miniaturas y configuración de marca', detail: 'CONSULTANDO BD' });

  let projects, brandKit, faceList;
  try {
    const [projectsRes, brandKitRes, facesRes] = await Promise.all([
      supabase.from('projects').select('*, thumbnail_variants(*)').eq('channel_id', activeChannelId).order('created_at', { ascending: false }),
      supabase.from('brand_kits').select('*').eq('channel_id', activeChannelId).maybeSingle(),
      supabase.from('face_vault').select('*').eq('channel_id', activeChannelId),
    ]);
    if (projectsRes.error) throw projectsRes.error;
    projects = projectsRes.data || [];
    brandKit = brandKitRes.data;
    faceList = facesRes.data || [];
  } catch (fetchErr) {
    console.error('Engine data fetch failed:', fetchErr);
    container.innerHTML = `
      <div style="padding:40px;text-align:center;">
        <div style="font-size:18px;font-weight:700;margin-bottom:8px;">Error cargando proyectos</div>
        <div class="text-muted" style="margin-bottom:16px;">${fetchErr.message || 'Supabase no respondió correctamente'}</div>
        <button class="btn btn-primary" onclick="location.hash='#engine';location.reload();">Reintentar</button>
      </div>`;
    return;
  }

  // UI State — prefer the globally active project if it exists in our loaded list
  const globalActiveId = getState().activeProjectId;
  let selectedProjectId = (globalActiveId && projects.find(p => p.id === globalActiveId))
    ? globalActiveId
    : (projects[0]?.id || null);
  let workflowStep = 1;
  let selectedFormats = [];
  let selectedStyleId = null;
  let isGenerating = false;           // true only during batch "Generate All" / "Sintetizar"
  let generatingAnglesSet = new Set(); // per-angle index: allows concurrent individual generation
  let generatingControllers = new Map(); // angleIndex -> AbortController
  let expandingVariantsSet = new Set(); // per-variant id: allows concurrent expansion
  let batchAngleSelection = null; // null = all selected; array of indices = specific selection
  let faceEnabled = null;         // null = follow DNA match default; true/false = explicit user choice
  let selectedExpressionId = null; // persists face select across renders
  let aiRecs          = null; // null=not fetched | false=loading | {formats,style}=done
  let aiRecsProjectId = null; // project ID for which aiRecs was computed
  let textMode = 'none';           // 'none' | 'ai' | 'canvas' — persists text mode across renders
  let agentMode = false;           // Modo Agente: draft → image critique → refined final
  let anglesPage = 0;              // pagination for step 5 angle cards
  let variantsPage = 0;            // pagination for history section
  let useCelebrityModel = false;   // true = use gemini-2.5 permissive model for real person likenesses
  let detectedCelebrity = null;    // null=unchecked | false=none | true=celebrity found in hero_object

  // Auto-matched face from DNA (set during render based on emotion_label)
  let autoMatchedFaceId = null;

  function getProject() { return projects.find(p => p.id === selectedProjectId); }

  // Cleanup any previous subscription stored on the container
  if (container._cleanup) { container._cleanup(); container._cleanup = null; }

  // ─── FIXED BOTTOM NAV ─────────────────────────────────────────────────────

  function syncEngineNav() {
    const project = getProject();
    const selectedAngles = project?.logic_dna?.selected_angles || [];
    const activeAngleIndices = batchAngleSelection ?? selectedAngles.map((_, i) => i);
    const canGoStep2 = selectedFormats.length > 0;
    const canGoStep3 = canGoStep2 && !!selectedStyleId;
    const canGoStep4 = canGoStep3;
    const canGenerate = canGoStep4 && activeAngleIndices.length > 0 && !isGenerating;
    const isLastStep = workflowStep === 4;

    let footer = document.getElementById('engine-fixed-nav');
    if (!footer) {
      footer = document.createElement('div');
      footer.id = 'engine-fixed-nav';
      document.body.appendChild(footer);
      const cleanup = () => {
        document.getElementById('engine-fixed-nav')?.remove();
        window.removeEventListener('hashchange', cleanup);
      };
      window.addEventListener('hashchange', cleanup);
    }

    const sidebarW = document.getElementById('sidebar')?.offsetWidth ?? 72;
    footer.style.cssText = `
      position: fixed; bottom: 0; left: ${sidebarW}px; right: 0;
      padding: 28px 40px 18px;
      background: linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%);
      backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
      display: flex; justify-content: space-between; align-items: center;
      z-index: 100; pointer-events: all;
      transition: left 0.2s ease;
    `;

    const nextDisabled = (workflowStep === 1 && !canGoStep2) || (workflowStep === 2 && !canGoStep3);
    const nextHint = workflowStep === 1 && !canGoStep2
      ? 'Elegí al menos un formato'
      : workflowStep === 2 && !canGoStep3
        ? 'Elegí un estilo visual'
        : '';

    footer.innerHTML = `
      <!-- Anterior -->
      <button id="engine-btn-prev"
        style="display:flex;align-items:center;gap:8px;padding:10px 22px;border-radius:var(--radius-md);
          font-size:13px;font-weight:700;cursor:${workflowStep === 1 ? 'default' : 'pointer'};
          background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);
          color:${workflowStep === 1 ? 'rgba(255,255,255,0.2)' : 'var(--text-secondary)'};
          transition:all 0.15s;pointer-events:${workflowStep === 1 ? 'none' : 'all'};">
        ${icon('arrowLeft', 14)} Anterior
      </button>

      <!-- Centro: hint o paso -->
      <span style="font-size:11px;color:rgba(255,255,255,0.3);font-weight:600;letter-spacing:0.5px;">
        ${nextHint || `PASO ${workflowStep} DE 4`}
      </span>

      <!-- Siguiente o Generar -->
      ${isLastStep
        ? `<button id="engine-btn-generate" ${!canGenerate ? 'disabled' : ''}
            style="display:flex;align-items:center;gap:10px;padding:13px 32px;
              border-radius:var(--radius-md);font-size:14px;font-weight:900;
              letter-spacing:1.5px;text-transform:uppercase;
              border:2px solid ${canGenerate ? 'rgba(220,38,38,0.6)' : 'rgba(255,255,255,0.08)'};
              background:${canGenerate ? 'linear-gradient(135deg, var(--accent), var(--accent-dark))' : 'rgba(255,255,255,0.04)'};
              color:${canGenerate ? 'white' : 'rgba(255,255,255,0.18)'};
              cursor:${canGenerate ? 'pointer' : 'not-allowed'};
              box-shadow:${canGenerate ? '0 0 28px rgba(220,38,38,0.4)' : 'none'};">
            ${isGenerating
              ? `${icon('clock', 16)} Generando...`
              : `${icon('rocket', 16)} GENERAR ${activeAngleIndices.length} MINIATURA${activeAngleIndices.length !== 1 ? 'S' : ''}`}
          </button>`
        : `<button id="engine-btn-next" ${nextDisabled ? 'disabled' : ''}
            style="display:flex;align-items:center;gap:8px;padding:10px 22px;
              border-radius:var(--radius-md);font-size:13px;font-weight:700;
              border:1.5px solid ${nextDisabled ? 'rgba(255,255,255,0.08)' : 'rgba(220,38,38,0.5)'};
              background:${nextDisabled ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg, var(--accent), var(--accent-dark))'};
              color:${nextDisabled ? 'rgba(255,255,255,0.18)' : 'white'};
              cursor:${nextDisabled ? 'not-allowed' : 'pointer'};
              box-shadow:${nextDisabled ? 'none' : '0 0 18px rgba(220,38,38,0.3)'};
              transition:all 0.15s;">
            Siguiente ${icon('arrowRight', 14)}
          </button>`
      }
    `;

    // Bind nav events
    document.getElementById('engine-btn-prev')?.addEventListener('click', () => {
      if (workflowStep > 1) { workflowStep--; render(); }
    });
    document.getElementById('engine-btn-next')?.addEventListener('click', () => {
      if (!nextDisabled && workflowStep < 4) { workflowStep++; render(); }
    });
    document.getElementById('engine-btn-generate')?.addEventListener('click', () => {
      if (canGenerate) {
        const btnGenerate = document.getElementById('btn-generate-master');
        btnGenerate?.click();
      }
    });
  }

  // ─── SUMMARY BAR ──────────────────────────────────────────────────────────

  function renderSummaryBar() {
    const isLoadingRecs = aiRecs === false;
    const hasRecs       = aiRecs && aiRecs !== false;
    const chip = (emoji, labelTop, labelMain, accent) =>
      `<div style="display:flex;align-items:center;gap:8px;padding:7px 16px;border-radius:20px;
        background:${accent === 'red' ? 'rgba(220,38,38,0.12)' : 'rgba(16,185,129,0.08)'};
        border:${accent === 'red' ? '1px solid rgba(220,38,38,0.4)' : '1px dashed rgba(16,185,129,0.45)'};">
        <span style="font-size:18px;line-height:1;">${emoji}</span>
        <div>
          <div style="font-size:9px;font-weight:800;color:${accent === 'red' ? 'var(--accent)' : '#10b981'};letter-spacing:1px;text-transform:uppercase;margin-bottom:1px;">${labelTop}</div>
          <div style="font-size:12px;font-weight:800;color:var(--text-primary);white-space:nowrap;">${labelMain}</div>
        </div>
      </div>`;
    const placeholder = (label) =>
      `<div style="padding:7px 16px;border-radius:20px;background:var(--bg-secondary);border:1px dashed rgba(255,255,255,0.06);">
        <div style="font-size:9px;font-weight:800;color:var(--text-muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:2px;">${label}</div>
        <div style="font-size:12px;color:var(--text-muted);">—</div>
      </div>`;
    const divider = `<div style="width:1px;height:32px;background:var(--border);opacity:0.35;flex-shrink:0;"></div>`;

    let formatChips, styleChip;

    if (isLoadingRecs) {
      formatChips = `<div style="display:flex;align-items:center;gap:8px;padding:7px 18px;border-radius:20px;background:var(--bg-secondary);border:1px solid var(--border);">
        <span style="width:6px;height:6px;border-radius:50%;background:var(--accent);display:inline-block;animation:ca-blink 1.1s ease-in-out infinite;"></span>
        <span style="font-size:11px;color:var(--text-tertiary);font-weight:600;">Analizando tu video...</span>
      </div>`;
      styleChip = '';
    } else if (selectedFormats.length > 0) {
      formatChips = selectedFormats.map(id => {
        const f = FORMATS.find(x => x.id === id);
        return chip(f?.emoji, 'Formato', f?.label, 'red');
      }).join('');
      const s = STYLES.find(x => x.id === selectedStyleId);
      styleChip = selectedStyleId
        ? chip(s?.emoji, 'Estilo', s?.label, 'red')
        : hasRecs && aiRecs.style
          ? chip(STYLES.find(x => x.id === aiRecs.style.id)?.emoji, '✦ IA recomienda', STYLES.find(x => x.id === aiRecs.style.id)?.label, 'green')
          : placeholder('Estilo');
    } else if (hasRecs && aiRecs.formats.length > 0) {
      formatChips = aiRecs.formats.slice(0, 2).map(r => {
        const f = FORMATS.find(x => x.id === r.id);
        return chip(f?.emoji, '✦ IA recomienda', f?.label, 'green');
      }).join('');
      styleChip = aiRecs.style
        ? chip(STYLES.find(x => x.id === aiRecs.style.id)?.emoji, '✦ IA recomienda', STYLES.find(x => x.id === aiRecs.style.id)?.label, 'green')
        : placeholder('Estilo');
    } else {
      formatChips = placeholder('Formato');
      styleChip   = placeholder('Estilo');
    }

    return `<div style="display:flex;justify-content:center;align-items:center;gap:10px;margin-bottom:var(--space-md);flex-wrap:wrap;padding:0 2px;">
      ${formatChips}
      ${styleChip ? divider : ''}
      ${styleChip}
    </div>`;
  }

  function updateSummaryBar() {
    const el = document.getElementById('engine-summary-bar');
    if (el) el.innerHTML = renderSummaryBar();
  }

  // ─── RENDER ROOT ──────────────────────────────────────────────────────────

  function render() {
    const project = getProject();
    const variants = project?.thumbnail_variants || [];
    const selectedAngles = project?.logic_dna?.selected_angles || [];

    if (!document.getElementById('thumb-lightbox')) {
      const lb = document.createElement('div');
      lb.id = 'thumb-lightbox';
      lb.innerHTML = `
        <div id="lbbar">
          <span id="lbcounter"></span>
          <button id="lbdl">${icon('download', 15)} DESCARGAR MINIATURA</button>
          <button id="lbclose" title="Cerrar (Esc)">${icon('x', 16)}</button>
        </div>
        <button id="lbprev" title="Anterior (←)">&#8249;</button>
        <img id="thumb-lightbox-img" src="" alt="Previsualización" />
        <button id="lbnext" title="Siguiente (→)">&#8250;</button>
      `;
      document.body.appendChild(lb);
      lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
      document.getElementById('lbclose').addEventListener('click', closeLightbox);
      document.getElementById('lbprev').addEventListener('click', (e) => { e.stopPropagation(); lbNav(-1); });
      document.getElementById('lbnext').addEventListener('click', (e) => { e.stopPropagation(); lbNav(1); });
      document.getElementById('lbdl').addEventListener('click', async (e) => { e.stopPropagation(); await lbDownload(); });
      document.addEventListener('keydown', function lbKeyHandler(e) {
        if (!document.getElementById('thumb-lightbox')?.classList.contains('active')) return;
        if (e.key === 'ArrowLeft')  { e.preventDefault(); lbNav(-1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); lbNav(1); }
        else if (e.key === 'Escape') closeLightbox();
      });
    }

    if (project?.logic_dna?.visual_briefing?.emotion_label && faceList.length > 0) {
      const emotionLabel = project.logic_dna.visual_briefing.emotion_label;
      const match = faceList.find(f => f.expression_type === emotionLabel);
      autoMatchedFaceId = match?.id || faceList[0]?.id || null;
    } else {
      autoMatchedFaceId = faceList[0]?.id || null;
    }

    const canGoStep2 = selectedFormats.length > 0;
    const canGoStep3 = canGoStep2 && !!selectedStyleId;
    const canGoStep4 = canGoStep3;
    const activeAngleIndices = batchAngleSelection ?? selectedAngles.map((_, i) => i);
    const canGenerate = canGoStep4 && activeAngleIndices.length > 0 && !isGenerating;
    const stepDone = [canGoStep2, canGoStep3, canGoStep4, false];
    const canAccess = [true, canGoStep2, canGoStep3, canGoStep4];
    const stepDefs = [
      { label: 'Formato', desc: 'Composición visual' },
      { label: 'Estilo', desc: 'Look visual' },
      { label: 'Rostro', desc: 'Face Vault' },
      { label: 'Ángulos', desc: 'Generar' },
    ];

    container.innerHTML = `<div class="animate-in">
      <div class="section-header" style="margin-bottom:var(--space-lg);">
        <div>
          <h2 class="section-title">${icon('cog', 22)} Fábrica Creativa</h2>
          <p class="section-subtitle">DNA Chain → Miniatura de alto CTR</p>
        </div>
      </div>

      <!-- Summary bar: formato + estilo seleccionado/recomendado -->
      <div id="engine-summary-bar">${renderSummaryBar()}</div>

      <!-- Progress bar — compacto -->
      <div style="display:flex;align-items:center;margin-bottom:var(--space-md);padding:0 2px;gap:0;">
        ${stepDefs.map((s, i) => {
          const n = i + 1;
          const isActive = workflowStep === n;
          const isDone = stepDone[i];
          const accessible = canAccess[i];
          return `
          <div class="step-tab" data-step="${n}" ${!accessible ? 'disabled' : ''}
            style="display:flex;align-items:center;gap:6px;flex-shrink:0;cursor:${accessible ? 'pointer' : 'default'};opacity:${!accessible ? 0.35 : 1};">
            <div style="width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;transition:all 0.2s;flex-shrink:0;
              ${isDone
                ? 'background:linear-gradient(135deg,var(--accent),var(--accent-dark));color:white;'
                : isActive
                  ? 'background:var(--accent);color:white;box-shadow:0 0 10px rgba(220,38,38,0.4);'
                  : 'background:var(--bg-elevated);color:var(--text-tertiary);border:1px solid var(--border);'}">
              ${isDone ? icon('check', 8) : n}
            </div>
            <div style="font-size:11px;font-weight:${isActive ? '700' : '500'};white-space:nowrap;
              color:${isActive ? 'var(--text-primary)' : isDone ? 'var(--text-secondary)' : 'var(--text-tertiary)'};">${s.label}</div>
          </div>
          ${i < stepDefs.length - 1 ? `<div style="flex:1;height:1px;margin:0 8px;
            background:${isDone ? 'var(--accent)' : 'var(--border)'};opacity:${isDone ? '0.35' : '0.15'};"></div>` : ''}`;
        }).join('')}
      </div>

      <!-- Step content -->
      <div id="step-content" style="min-height:300px;padding-bottom:90px;">
        ${workflowStep === 1 ? renderFormatStep()
          : workflowStep === 2 ? renderStyleStep()
          : workflowStep === 3 ? renderFaceStep()
          : renderAnglesStep(project, selectedAngles)}
      </div>

      <!-- Hidden generate button — triggered by fixed nav -->
      ${workflowStep === 4 ? `
        <button id="btn-generate-master" ${!canGenerate ? 'disabled' : ''} style="display:none;">generate</button>
      ` : ''}

    </div>`;

    bindEvents();
    syncEngineNav();
  }

  // ─── DNA CHECKLIST ────────────────────────────────────────────────────────

  function renderDNAChecklist(project) {
    const vb = project?.logic_dna?.visual_briefing;
    const adnData = brandKit?.detailed_adn;
    const adn = adnData?.synthesis || adnData || {};
    const ytAnalysis = adnData?.youtube_analysis || null;
    const styleSummary = brandKit?.style_summary;
    const marketContrast = project?.logic_dna?.market_contrast;

    const heroObject = vb?.hero_object;
    const emotionLabel = vb?.emotion_label;
    const matchedFace = faceList.find(f => f.id === autoMatchedFaceId);
    const visualStyle = styleSummary?.visual_style || styleSummary?.winning_pattern;
    const avoidColors = marketContrast?.avoid_colors || [];
    const brandTone = adn?.tone || ytAnalysis?.channel_archetype || null;

    const checkItem = (ok, label, value) => `
      <div class="flex items-start gap-sm" style="padding:6px 0; border-bottom:1px solid var(--border);">
        <span style="color:${ok ? 'var(--success)' : 'var(--text-tertiary)'}; font-size:14px; flex-shrink:0; margin-top:1px;">${ok ? '✅' : '⬜'}</span>
        <div>
          <div class="text-xs font-bold" style="color:${ok ? 'var(--text-primary)' : 'var(--text-muted)'};">${label}</div>
          ${ok && value ? `<div class="text-xs text-muted" style="margin-top:2px; line-height:1.4;">${value}</div>` : ''}
        </div>
      </div>`;

    const allReady = heroObject && emotionLabel && matchedFace && visualStyle;

    return `
    <div class="card mb-md" style="background:linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05)); border-color:rgba(99,102,241,0.3);">
      <div class="flex items-center justify-between mb-sm">
        <div class="text-xs font-bold" style="letter-spacing:1px; text-transform:uppercase; color:#818cf8;">🧬 DNA Chain — Insumos para la Fábrica</div>
        ${allReady
        ? `<span class="badge" style="background:rgba(16,185,129,0.2); color:var(--success); font-size:9px;">✅ LISTO PARA SINTETIZAR</span>`
        : `<span class="badge badge-neutral" style="font-size:9px; opacity:0.7;">Completá los pilares</span>`}
      </div>
      ${checkItem(!!heroObject, 'Objeto Héroe Detectado', heroObject)}
      ${checkItem(!!(emotionLabel && matchedFace), 'Cara Seleccionada por Match', matchedFace ? `${matchedFace.expression_type} — match con emoción "${emotionLabel}"` : emotionLabel ? `"${emotionLabel}" detectada, sin foto con ese label en Face Vault` : null)}
      ${checkItem(!!visualStyle, 'Estilo Visual de Galería', visualStyle)}
      ${checkItem(!!brandTone, 'Identidad del Canal', brandTone)}
      ${checkItem(!!ytAnalysis, 'YouTube ADN', ytAnalysis ? `"${ytAnalysis.channel_archetype}" · ${ytAnalysis.content_pillars?.slice(0,2).join(', ')}` : null)}
      ${checkItem(avoidColors.length > 0, 'Restricción de Mercado', avoidColors.length > 0 ? `Evitar: ${avoidColors.join(', ')}` : null)}
    </div>`;
  }

  // ─── Partial re-render (step content only — no header/progress/nav flash) ──

  function rerenderStep() {
    const el = document.getElementById('step-content');
    if (!el) { render(); return; }
    const project = getProject();
    const selectedAngles = project?.logic_dna?.selected_angles || [];
    el.innerHTML = workflowStep === 1 ? renderFormatStep()
      : workflowStep === 2 ? renderStyleStep()
      : workflowStep === 3 ? renderFaceStep()
      : renderAnglesStep(project, selectedAngles);
    bindStepContentEvents();
    syncEngineNav();
    updateSummaryBar();
  }

  // ─── STEP 1: Proyecto ─────────────────────────────────────────────────────

  function renderProjectStep() {
    const selectedProject = getProject();

    const projectListHTML = projects.length === 0 ? `
      <div style="text-align:center;padding:var(--space-xl);opacity:0.5;">
        ${icon('brain', 32)}
        <p class="text-sm text-muted mt-md">Sin proyectos. Procesá un guión en El Cerebro.</p>
      </div>
    ` : `
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:var(--space-md);">
        ${projects.map(p => {
          const pAngles = p.logic_dna?.selected_angles || [];
          const pVariants = p.thumbnail_variants || [];
          const hasVB = !!p.logic_dna?.visual_briefing;
          const isActive = p.id === selectedProjectId;
          return `
          <div class="project-row" data-project-id="${p.id}" style="
            display:flex;align-items:center;gap:12px;padding:12px 14px;
            background:${isActive ? 'rgba(220,38,38,0.08)' : 'var(--bg-card)'};
            border:1px solid ${isActive ? 'var(--accent)' : 'var(--border)'};
            border-radius:var(--radius-md);cursor:pointer;transition:all 0.15s;">
            <span style="color:${isActive ? 'var(--accent)' : 'var(--text-tertiary)'};flex-shrink:0;">${icon('folder', 16)}</span>
            <div style="flex:1;min-width:0;">
              <div class="font-bold" style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${isActive ? 'var(--text-primary)' : 'var(--text-secondary)'};">${p.title}</div>
              ${p.logic_dna?.hook ? `<div class="text-xs text-muted" style="margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:0.65;">${p.logic_dna.hook}</div>` : ''}
              <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;">
                ${pAngles.length > 0 ? `<span class="badge badge-neutral" style="font-size:9px;">${pAngles.length} ángulos</span>` : ''}
                ${pVariants.length > 0 ? `<span class="badge badge-accent" style="font-size:9px;">${pVariants.length} miniatura${pVariants.length !== 1 ? 's' : ''}</span>` : ''}
                ${hasVB ? `<span class="badge" style="font-size:9px;background:rgba(99,102,241,0.2);color:#818cf8;">🧬 DNA</span>` : ''}
              </div>
            </div>
            <div style="display:flex;gap:5px;flex-shrink:0;">
              <button class="btn-rename-project" data-project-id="${p.id}" data-project-title="${p.title.replace(/"/g, '&quot;')}"
                style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;background:rgba(129,140,248,0.1);border:1px solid rgba(129,140,248,0.25);border-radius:6px;cursor:pointer;color:#818cf8;"
                title="Renombrar">
                ${icon('edit', 11)}
              </button>
              <button class="btn-delete-project" data-project-id="${p.id}"
                style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.25);border-radius:6px;cursor:pointer;color:#ef4444;"
                title="Eliminar">
                ${icon('trash', 11)}
              </button>
            </div>
          </div>`;
        }).join('')}
      </div>`;

    return `
    <div>
      ${selectedProject ? `
      <!-- Selected project display -->
      <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(220,38,38,0.08);border:1px solid var(--accent);border-radius:var(--radius-md);margin-bottom:var(--space-md);">
        <span style="color:var(--accent);flex-shrink:0;">${icon('folder', 16)}</span>
        <div style="flex:1;min-width:0;">
          <div class="font-bold" style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${selectedProject.title}</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:3px;">
            ${(selectedProject.logic_dna?.selected_angles||[]).length > 0 ? `<span class="badge badge-neutral" style="font-size:9px;">${selectedProject.logic_dna.selected_angles.length} ángulos</span>` : ''}
            ${(selectedProject.thumbnail_variants||[]).length > 0 ? `<span class="badge badge-accent" style="font-size:9px;">${selectedProject.thumbnail_variants.length} miniatura${selectedProject.thumbnail_variants.length !== 1 ? 's' : ''}</span>` : ''}
            ${selectedProject.logic_dna?.visual_briefing ? `<span class="badge" style="font-size:9px;background:rgba(99,102,241,0.2);color:#818cf8;">🧬 DNA</span>` : ''}
          </div>
        </div>
        <span style="color:var(--success);font-size:18px;flex-shrink:0;">✓</span>
      </div>
      ` : ''}

      <!-- CTA button -->
      <button id="btn-open-project-modal"
        style="width:100%;padding:14px 20px;background:var(--accent);border:none;border-radius:var(--radius-md);cursor:pointer;color:white;font-size:13px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:8px;">
        ${icon('folder', 15)} ${selectedProject ? 'CAMBIAR PROYECTO O VIDEO' : 'ELEGÍ TU PROYECTO O VIDEO'}
      </button>
    </div>`;
  }

  // ─── Project modal overlay ────────────────────────────────────────────────

  function openProjectModal() {
    document.getElementById('project-modal-overlay')?.remove();

    let modalSelectedId = selectedProjectId;

    function buildProjectRows(filter) {
      const q = (filter || '').toLowerCase();
      const filtered = q
        ? projects.filter(p =>
            p.title.toLowerCase().includes(q) ||
            (p.logic_dna?.hook || '').toLowerCase().includes(q))
        : projects;

      if (filtered.length === 0) return `
        <div style="text-align:center;padding:40px;opacity:0.5;">
          ${icon('brain', 32)}
          <p class="text-sm text-muted" style="margin-top:12px;">Sin resultados.</p>
        </div>`;

      return filtered.map(p => {
        const pAngles = p.logic_dna?.selected_angles || [];
        const pVariants = p.thumbnail_variants || [];
        const hasVB = !!p.logic_dna?.visual_briefing;
        const isActive = p.id === modalSelectedId;
        return `
        <div class="modal-project-row" data-project-id="${p.id}" style="
          display:flex;align-items:center;gap:12px;padding:14px 16px;
          background:${isActive ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.03)'};
          border:1.5px solid ${isActive ? 'var(--accent)' : 'rgba(255,255,255,0.07)'};
          border-radius:10px;cursor:pointer;transition:all 0.15s;margin-bottom:8px;">
          <span style="color:${isActive ? 'var(--accent)' : 'var(--text-tertiary)'};flex-shrink:0;">${icon('folder', 18)}</span>
          <div style="flex:1;min-width:0;">
            <div class="font-bold" style="font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${isActive ? 'var(--text-primary)' : 'var(--text-secondary)'};">${p.title}</div>
            ${p.logic_dna?.hook ? `<div class="text-xs text-muted" style="margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:0.6;">${p.logic_dna.hook}</div>` : ''}
            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:5px;">
              ${pAngles.length > 0 ? `<span class="badge badge-neutral" style="font-size:9px;">${pAngles.length} ángulos</span>` : ''}
              ${pVariants.length > 0 ? `<span class="badge badge-accent" style="font-size:9px;">${pVariants.length} miniatura${pVariants.length !== 1 ? 's' : ''}</span>` : ''}
              ${hasVB ? `<span class="badge" style="font-size:9px;background:rgba(99,102,241,0.2);color:#818cf8;">🧬 DNA</span>` : ''}
            </div>
          </div>
          <div style="display:flex;gap:5px;flex-shrink:0;">
            <button class="modal-btn-rename" data-project-id="${p.id}" data-project-title="${p.title.replace(/"/g, '&quot;')}"
              style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:rgba(129,140,248,0.1);border:1px solid rgba(129,140,248,0.25);border-radius:7px;cursor:pointer;color:#818cf8;"
              title="Renombrar">
              ${icon('edit', 12)}
            </button>
            <button class="modal-btn-delete" data-project-id="${p.id}"
              style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.25);border-radius:7px;cursor:pointer;color:#ef4444;"
              title="Eliminar">
              ${icon('trash', 12)}
            </button>
          </div>
        </div>`;
      }).join('');
    }

    const overlay = document.createElement('div');
    overlay.id = 'project-modal-overlay';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:9999;
      background:rgba(0,0,0,0.75);
      backdrop-filter:blur(8px);
      -webkit-backdrop-filter:blur(8px);
      display:flex;align-items:center;justify-content:center;
      padding:20px;
    `;

    overlay.innerHTML = `
      <div style="
        background:var(--bg-secondary);
        border:1px solid var(--border);
        border-radius:16px;
        width:100%;
        max-width:680px;
        max-height:85vh;
        display:flex;
        flex-direction:column;
        overflow:hidden;
        box-shadow:0 24px 80px rgba(0,0,0,0.6);
      ">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;border-bottom:1px solid var(--border);flex-shrink:0;">
          <div>
            <div class="font-bold" style="font-size:16px;">Seleccioná tu proyecto o video</div>
            <div class="text-xs text-muted" style="margin-top:2px;">${projects.length} proyecto${projects.length !== 1 ? 's' : ''} disponible${projects.length !== 1 ? 's' : ''}</div>
          </div>
          <button id="modal-close-btn" style="width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:8px;cursor:pointer;color:var(--text-secondary);font-size:16px;">✕</button>
        </div>

        <div style="padding:14px 24px;border-bottom:1px solid var(--border);flex-shrink:0;">
          <div style="position:relative;">
            <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-tertiary);pointer-events:none;">${icon('search', 14)}</span>
            <input id="modal-search-input" type="text" placeholder="Buscá por título o tema del video..."
              style="width:100%;padding:10px 12px 10px 36px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-size:13px;box-sizing:border-box;outline:none;" />
          </div>
        </div>

        <div id="modal-project-list" style="flex:1;overflow-y:auto;padding:16px 24px;">
          ${buildProjectRows()}
        </div>

        <div style="padding:16px 24px;border-top:1px solid var(--border);flex-shrink:0;">
          <button id="modal-confirm-btn"
            ${!modalSelectedId ? 'disabled' : ''}
            style="width:100%;padding:14px 20px;background:${modalSelectedId ? 'var(--accent)' : 'rgba(255,255,255,0.08)'};border:none;border-radius:10px;cursor:${modalSelectedId ? 'pointer' : 'not-allowed'};color:${modalSelectedId ? 'white' : 'var(--text-tertiary)'};font-size:14px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;transition:all 0.2s;">
            ${modalSelectedId ? '🚀 VAMOS A CREAR' : 'Seleccioná un proyecto primero'}
          </button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('modal-search-input')?.focus(), 50);

    function updateConfirmBtn() {
      const btn = document.getElementById('modal-confirm-btn');
      if (!btn) return;
      if (modalSelectedId) {
        btn.disabled = false;
        btn.style.background = 'var(--accent)';
        btn.style.color = 'white';
        btn.style.cursor = 'pointer';
        btn.textContent = '🚀 VAMOS A CREAR';
      } else {
        btn.disabled = true;
        btn.style.background = 'rgba(255,255,255,0.08)';
        btn.style.color = 'var(--text-tertiary)';
        btn.style.cursor = 'not-allowed';
        btn.textContent = 'Seleccioná un proyecto primero';
      }
    }

    function refreshList() {
      const filter = document.getElementById('modal-search-input')?.value || '';
      const list = document.getElementById('modal-project-list');
      if (list) list.innerHTML = buildProjectRows(filter);
      bindModalRowEvents();
    }

    function bindModalRowEvents() {
      overlay.querySelectorAll('.modal-project-row').forEach(row => {
        row.addEventListener('click', (e) => {
          if (e.target.closest('.modal-btn-rename') || e.target.closest('.modal-btn-delete')) return;
          modalSelectedId = row.dataset.projectId;
          refreshList();
          updateConfirmBtn();
        });
      });

      overlay.querySelectorAll('.modal-btn-rename').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const projectId = btn.dataset.projectId;
          const currentTitle = btn.dataset.projectTitle;
          const newTitle = await inputDialog('Ingresá el nuevo nombre para este proyecto', {
            title: 'Renombrar Proyecto',
            defaultValue: currentTitle,
            placeholder: 'Nombre del proyecto...',
            confirmLabel: 'Renombrar',
          });
          if (!newTitle || newTitle === currentTitle) return;
          try {
            const { error } = await supabase.from('projects').update({ title: newTitle }).eq('id', projectId);
            if (error) throw error;
            await reloadProjects();
            refreshList();
            toast('Proyecto renombrado', 'success', 2500);
          } catch (err) {
            toast('Error al renombrar: ' + err.message, 'error');
          }
        });
      });

      overlay.querySelectorAll('.modal-btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const projectId = btn.dataset.projectId;
          const project = projects.find(p => p.id === projectId);
          if (!project) return;
          const variantCount = (project.thumbnail_variants || []).length;
          const ok = await confirmDialog(
            `¿Eliminar "${project.title}"?\nSe borrarán ${variantCount} miniatura${variantCount !== 1 ? 's' : ''} y todos los datos. Esta acción no se puede deshacer.`,
            { title: 'Eliminar Proyecto', confirmLabel: 'Eliminar', danger: true }
          );
          if (!ok) return;
          try {
            for (const v of (project.thumbnail_variants || [])) {
              if (v.image_url) {
                const parts = v.image_url.split('/public/thumbnails/');
                if (parts.length > 1) await supabase.storage.from('thumbnails').remove([parts[1]]).catch(() => {});
              }
            }
            await supabase.from('thumbnail_variants').delete().eq('project_id', projectId);
            const { error } = await supabase.from('projects').delete().eq('id', projectId);
            if (error) throw error;
            if (modalSelectedId === projectId) modalSelectedId = null;
            if (selectedProjectId === projectId) {
              selectedProjectId = null;
              workflowStep = 1;
              selectedFormats = [];
              selectedStyleId = null;
              batchAngleSelection = null;
            }
            await reloadProjects();
            refreshList();
            updateConfirmBtn();
            toast('Proyecto eliminado', 'success', 2500);
          } catch (err) {
            toast('Error al eliminar: ' + err.message, 'error');
          }
        });
      });
    }

    document.getElementById('modal-close-btn').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('modal-search-input').addEventListener('input', refreshList);
    document.getElementById('modal-confirm-btn').addEventListener('click', () => {
      if (!modalSelectedId) return;
      const projectChanged = selectedProjectId !== modalSelectedId;
      if (projectChanged) {
        selectedProjectId = modalSelectedId;
        // Sync with global state so workflow bar and other panels stay in sync
        setActiveProject(modalSelectedId);
        selectedFormats = [];
        selectedStyleId = null;
        batchAngleSelection = null;
        faceEnabled = null;
        selectedExpressionId = null;
        textMode = 'none';
        agentMode = false;
        anglesPage = 0;
        variantsPage = 0;
        workflowStep = 2;
      }
      overlay.remove();
      if (projectChanged) {
        render();
      } else {
        rerenderStep();
      }
    });

    bindModalRowEvents();
  }

  // ─── STEP 2: Formato ──────────────────────────────────────────────────────

  async function fetchAIRecs(project) {
    if (aiRecs !== null) return; // already loading or done
    aiRecs = false; // mark as loading
    rerenderStep();
    try {
      const dna    = project.logic_dna || {};
      const angles = (dna.selected_angles || [])
        .map(a => `- ${a.name}: ${a.psychology || a.psychology_text || ''}`)
        .join('\n');
      const content = [
        `TÍTULO DEL VIDEO: ${project.title}`,
        `HOOK: ${dna.hook || '—'}`,
        `TENSIÓN: ${dna.tension || '—'}`,
        `PROMESA: ${dna.promise || '—'}`,
        `OBJETO HÉROE: ${dna.visual_briefing?.hero_object || '—'}`,
        `CONFLICTO CENTRAL: ${dna.visual_briefing?.central_conflict || '—'}`,
        `ÁNGULOS PSICOLÓGICOS SELECCIONADOS:\n${angles || '—'}`,
      ].join('\n');
      const result = await callAI('FORMAT_STYLE_REC', content);
      aiRecs = {
        formats: Array.isArray(result?.recommended_formats) ? result.recommended_formats : [],
        style:   result?.recommended_style || null,
      };
    } catch (err) {
      console.warn('[fetchAIRecs] failed:', err);
      aiRecs = { formats: [], style: null };
    }
    rerenderStep();
  }

  // Analyzes project DNA and returns format recommendations with reasons.
  // Deterministic — no API call. Runs on the logic_dna already in the project.
  function recommendFormats(project) {
    const dna = project?.logic_dna || {};
    const hook       = (dna.hook || '').toLowerCase();
    const tension    = (dna.tension || '').toLowerCase();
    const promise    = (dna.promise || '').toLowerCase();
    const hero       = (dna.visual_briefing?.hero_object || '').toLowerCase();
    const conflict   = (dna.visual_briefing?.central_conflict || '').toLowerCase();
    const title      = (project.title || '').toLowerCase();
    const angles     = dna.selected_angles || [];
    const angleNames = angles.map(a => (a.name || '').toLowerCase()).join(' ');
    const anglePsych = angles.map(a => (a.psychology || a.psychology_text || '').toLowerCase()).join(' ');
    const all = [hook, tension, promise, hero, conflict, title, angleNames, anglePsych].join(' ');

    const recs = [];

    // ── VERSUS ──
    const versusHits = ['vs ', 'versus', ' contra ', 'comparar', 'comparativ', 'mejor que', 'peor que',
      'diferencia', 'contraste extremo', 'antes y después', 'ganador', 'perdedor', 'duelo', 'batalla']
      .filter(k => all.includes(k)).length;
    if (versusHits >= 1 || angleNames.includes('contraste')) {
      recs.push({
        id: 'versus',
        reason: versusHits >= 2
          ? 'El guión es una comparación directa — el split screen es el formato más reconocido y efectivo para este tema.'
          : 'El ángulo de Contraste Extremo genera el mayor impacto visual con la composición dividida.',
        confidence: versusHits >= 2 || angleNames.includes('contraste') ? 'alta' : 'media',
      });
    }

    // ── AUTHORITY ──
    const authHits = ['autoridad', 'experto', 'definitiv', 'solución', 'tutorial', 'cómo ', 'guía',
      'sistema', 'herramienta', 'dominar', 'master', 'mejor manera', 'paso a paso']
      .filter(k => all.includes(k)).length;
    if (authHits >= 1 || angleNames.includes('autoridad')) {
      recs.push({
        id: 'authority',
        reason: 'El objeto héroe del guión domina visualmente. La composición de autoridad lo pone al frente y comunica liderazgo técnico en 0.3 segundos.',
        confidence: angleNames.includes('autoridad') ? 'alta' : 'media',
      });
    }

    // ── SHOCK ──
    const shockHits = ['curiosidad', 'secreto', 'oculto', 'nadie te', 'no te dijeron', 'misterio',
      'revela', 'increíble', 'impactante', 'sorpresa', 'no puedo creer', 'descubr']
      .filter(k => all.includes(k)).length;
    if (shockHits >= 1 || angleNames.includes('curiosidad')) {
      recs.push({
        id: 'shock',
        reason: 'El gap de curiosidad del guión pide ocultamiento estratégico. La caja negra genera el itch mental que obliga el clic.',
        confidence: angleNames.includes('curiosidad') ? 'alta' : 'media',
      });
    }

    // ── BREAKING ──
    const breakingHits = ['urgencia', 'urgente', 'fomo', 'ahora', 'peligro', 'error', 'falló',
      'noticia', 'alerta', 'advertencia', 'cuidado', 'obsoleto', 'cancelad', 'breaking',
      'se acaba', 'último momento', 'ya no', 'murió', 'fin de']
      .filter(k => all.includes(k)).length;
    if (breakingHits >= 1 || angleNames.includes('urgencia') || angleNames.includes('miedo')) {
      recs.push({
        id: 'breaking',
        reason: 'El tono de urgencia y alerta del guión encaja perfectamente con la estética de noticia de última hora — máxima saturación emocional.',
        confidence: (angleNames.includes('urgencia') || angleNames.includes('miedo')) ? 'alta' : 'media',
      });
    }

    // Sort: alta confidence first
    recs.sort((a, b) => (a.confidence === 'alta' ? -1 : 1) - (b.confidence === 'alta' ? -1 : 1));
    return recs;
  }

  function renderFormatStep() {
    const project = getProject();
    if (project && project.id !== aiRecsProjectId) { aiRecs = null; aiRecsProjectId = project.id; }
    if (project && aiRecs === null) fetchAIRecs(project);
    const recs          = (aiRecs && aiRecs !== false) ? aiRecs.formats : [];
    const recMap        = Object.fromEntries(recs.map(r => [r.id, r]));
    const isLoadingRecs = aiRecs === false;

    return `
    <div>
      <div style="font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:var(--space-md);">
        Elegí el formato de composición — podés seleccionar varios
      </div>

      <div style="position:relative;${isLoadingRecs ? 'min-height:220px;' : ''}">
        ${isLoadingRecs ? `
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:5;background:rgba(10,10,10,0.88);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);border-radius:12px;padding:40px 20px;text-align:center;">
          <div style="display:flex;gap:7px;margin-bottom:16px;">
            <span style="width:9px;height:9px;border-radius:50%;background:var(--accent);display:inline-block;animation:ca-blink 1.1s ease-in-out infinite;"></span>
            <span style="width:9px;height:9px;border-radius:50%;background:var(--accent);display:inline-block;animation:ca-blink 1.1s ease-in-out .3s infinite;"></span>
            <span style="width:9px;height:9px;border-radius:50%;background:var(--accent);display:inline-block;animation:ca-blink 1.1s ease-in-out .6s infinite;"></span>
          </div>
          <div style="font-size:15px;font-weight:700;color:var(--text-primary);margin-bottom:6px;">Analizando y recomendando un formato basado en tu video</div>
          <div style="font-size:12px;color:var(--text-tertiary);">La IA está procesando el DNA del video...</div>
        </div>` : ''}
        <div style="display:flex;flex-wrap:wrap;gap:10px;${isLoadingRecs ? 'pointer-events:none;opacity:0.12;' : ''}">
        ${FORMATS.map(f => {
          const isSelected = selectedFormats.includes(f.id);
          const rec = recMap[f.id];
          const isHighRec = rec?.confidence === 'alta';
          const useCase = FORMAT_USE_CASES[f.id] || '';
          return `
          <div class="card format-card" data-format-id="${f.id}" style="
            cursor:pointer;padding:14px 12px;transition:all 0.15s;position:relative;
            flex:1 1 150px;min-width:138px;max-width:200px;
            display:flex;flex-direction:column;align-items:center;text-align:center;
            ${isSelected
              ? 'border-color:var(--accent);background:rgba(220,38,38,0.07);'
              : isHighRec
                ? 'border-color:rgba(16,185,129,0.35);'
                : ''}">
            <div style="position:absolute;top:8px;right:8px;width:18px;height:18px;border-radius:50%;
              border:2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'};
              background:${isSelected ? 'var(--accent)' : 'transparent'};
              display:flex;align-items:center;justify-content:center;color:white;">
              ${isSelected ? icon('check', 9) : ''}
            </div>
            ${isHighRec && !isSelected ? `<div style="position:absolute;top:8px;left:8px;font-size:8px;font-weight:900;letter-spacing:1px;text-transform:uppercase;padding:2px 6px;border-radius:3px;background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.35);">✦ IA</div>` : ''}
            <div style="font-size:34px;margin-bottom:8px;margin-top:${isHighRec ? '16px' : '4px'};">${f.emoji}</div>
            <div class="font-bold" style="font-size:13px;line-height:1.3;margin-bottom:3px;">${f.label}</div>
            <div class="text-xs" style="color:${isHighRec ? '#10b981' : 'var(--accent)'};">${f.subtitle}</div>
            ${useCase ? `
            <div style="margin-top:auto;padding-top:10px;width:100%;">
              <div style="border-top:1px solid var(--border);padding-top:8px;">
                <div style="font-size:9px;font-weight:800;color:var(--text-tertiary);letter-spacing:0.8px;text-transform:uppercase;margin-bottom:4px;">Ideal si tu video trata de:</div>
                <div style="font-size:11px;color:var(--text-secondary);line-height:1.5;">${useCase}</div>
              </div>
            </div>` : ''}
          </div>`;
        }).join('')}
        </div>
      </div>
    </div>`;
  }

  // ─── STEP 3: Estilo visual ────────────────────────────────────────────────

  function renderStyleStep() {
    const styleRec      = (aiRecs && aiRecs !== false) ? aiRecs.style : null;
    const isLoadingRecs = aiRecs === false;
    return `
    <div>
      <div style="font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:var(--space-md);">
        Elegí el estilo visual de tu miniatura
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;">
        ${STYLES.map(s => {
          const isSelected = selectedStyleId === s.id;
          const isRec      = styleRec?.id === s.id;
          const useCase = STYLE_USE_CASES[s.id] || '';
          return `
          <div class="card style-card" data-style-id="${s.id}" style="
            cursor:pointer;padding:14px 12px;transition:all 0.15s;position:relative;
            flex:1 1 150px;min-width:138px;max-width:200px;
            display:flex;flex-direction:column;align-items:center;text-align:center;
            ${isSelected ? 'border-color:var(--accent);background:rgba(220,38,38,0.07);box-shadow:0 0 0 1px var(--accent);' : isRec ? 'border-color:rgba(16,185,129,0.35);' : ''}">
            <div style="position:absolute;top:8px;right:8px;width:18px;height:18px;border-radius:50%;
              border:2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'};
              background:${isSelected ? 'var(--accent)' : 'transparent'};
              display:flex;align-items:center;justify-content:center;color:white;">
              ${isSelected ? icon('check', 9) : ''}
            </div>
            ${isRec && !isSelected ? `<div style="position:absolute;top:8px;left:8px;font-size:8px;font-weight:900;letter-spacing:1px;text-transform:uppercase;padding:2px 6px;border-radius:3px;background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.35);">✦ IA</div>` : ''}
            <div style="font-size:34px;margin-bottom:8px;margin-top:${isRec ? '16px' : '4px'};">${s.emoji}</div>
            <div class="font-bold" style="font-size:13px;line-height:1.3;margin-bottom:3px;">${s.label}</div>
            <div class="text-xs" style="color:${isRec ? '#10b981' : 'var(--accent)'};">${s.subtitle}</div>
            ${useCase ? `
            <div style="margin-top:auto;padding-top:10px;width:100%;">
              <div style="border-top:1px solid var(--border);padding-top:8px;">
                <div style="font-size:9px;font-weight:800;color:var(--text-tertiary);letter-spacing:0.8px;text-transform:uppercase;margin-bottom:4px;">Ideal si tu canal es de:</div>
                <div style="font-size:11px;color:var(--text-secondary);line-height:1.5;">${useCase}</div>
              </div>
            </div>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  // ─── STEP 4: Rostro del creador ───────────────────────────────────────────

  async function detectCelebrity() {
    const heroObject = getProject()?.logic_dna?.visual_briefing?.hero_object || '';
    if (!heroObject) { detectedCelebrity = false; rerenderStep(); return; }
    try {
      const translated = await translateCelebrityIfNeeded(heroObject);
      detectedCelebrity = translated !== heroObject;
    } catch {
      detectedCelebrity = false;
    }
    rerenderStep();
  }

  function renderFaceStep() {
    const matchedFace = faceList.find(f => f.id === autoMatchedFaceId);
    const effectiveUseFace = faceEnabled !== null ? faceEnabled : !!matchedFace;
    const effectiveExpressionId = selectedExpressionId || autoMatchedFaceId;
    const hasFaces = faceList.length > 0;

    // Trigger celebrity detection on first render of this step
    if (detectedCelebrity === null) detectCelebrity();

    const celebSection = (() => {
      if (detectedCelebrity === null) return `
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:var(--radius-md);background:var(--bg-tertiary);border:1px solid var(--border);margin-bottom:var(--space-lg);">
          <span style="font-size:14px;animation:ca-blink 1.1s ease-in-out infinite;">🔍</span>
          <span style="font-size:12px;color:var(--text-tertiary);">Analizando si hay una celebridad en este video...</span>
        </div>`;
      if (!detectedCelebrity) return '';
      return `
        <div style="margin-bottom:var(--space-lg);padding:14px 16px;border-radius:var(--radius-md);
          background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.3);">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
            <span style="font-size:16px;">🎬</span>
            <span style="font-size:11px;font-weight:900;letter-spacing:1px;text-transform:uppercase;color:#f59e0b;">Celebridad detectada en este video</span>
          </div>
          <p style="font-size:11px;color:var(--text-secondary);margin-bottom:12px;line-height:1.5;">
            El objeto héroe de este video incluye una persona real. Elegí cómo generarla:
          </p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div id="celeb-opt-quality" style="cursor:pointer;padding:10px 12px;border-radius:var(--radius-md);text-align:center;transition:all 0.15s;
              border:2px solid ${!useCelebrityModel ? 'var(--accent)' : 'var(--border)'};
              background:${!useCelebrityModel ? 'rgba(220,38,38,0.08)' : 'var(--bg-secondary)'};">
              <div style="font-size:20px;margin-bottom:4px;">⭐</div>
              <div style="font-size:12px;font-weight:700;margin-bottom:2px;">Máxima calidad</div>
              <div style="font-size:10px;color:var(--text-muted);line-height:1.4;">Descriptor visual de la celebridad — sin nombre real</div>
              ${!useCelebrityModel ? `<div style="margin-top:6px;font-size:9px;padding:2px 8px;border-radius:20px;background:var(--accent);color:white;display:inline-block;font-weight:700;">SELECCIONADO</div>` : ''}
            </div>
            <div id="celeb-opt-celebrity" style="cursor:pointer;padding:10px 12px;border-radius:var(--radius-md);text-align:center;transition:all 0.15s;
              border:2px solid ${useCelebrityModel ? 'rgba(245,158,11,0.7)' : 'var(--border)'};
              background:${useCelebrityModel ? 'rgba(245,158,11,0.07)' : 'var(--bg-secondary)'};">
              <div style="font-size:20px;margin-bottom:4px;">🎭</div>
              <div style="font-size:12px;font-weight:700;margin-bottom:2px;">Con celebridad</div>
              <div style="font-size:10px;color:var(--text-muted);line-height:1.4;">Genera el rostro real — modelo anterior, menor calidad</div>
              ${useCelebrityModel ? `<div style="margin-top:6px;font-size:9px;padding:2px 8px;border-radius:20px;background:rgba(245,158,11,0.8);color:white;display:inline-block;font-weight:700;">SELECCIONADO</div>` : ''}
            </div>
          </div>
        </div>`;
    })();

    return `
    <div>
      ${celebSection}
      <div style="font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:var(--space-md);">
        ¿Incluir el rostro del creador?
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:var(--space-lg);max-width:480px;">

        <!-- CON ROSTRO -->
        <div id="face-opt-yes" style="cursor:pointer;padding:12px 14px;border-radius:var(--radius-md);border:2px solid ${effectiveUseFace ? 'var(--accent)' : 'var(--border)'};
          background:${effectiveUseFace ? 'rgba(220,38,38,0.07)' : 'var(--bg-tertiary)'};transition:all 0.15s;text-align:center;">
          <div style="font-size:24px;margin-bottom:6px;">🤳</div>
          <div class="font-bold" style="font-size:13px;margin-bottom:3px;">Con rostro</div>
          <div style="font-size:11px;color:var(--text-muted);line-height:1.4;">Incluye la foto del creador del Face Vault</div>
          ${useCelebrityModel && effectiveUseFace ? `<div style="margin-top:4px;font-size:9px;color:#f59e0b;font-weight:700;">+ junto a la celebridad</div>` : ''}
          ${effectiveUseFace ? `<div style="margin-top:6px;font-size:9px;padding:2px 8px;border-radius:20px;background:var(--accent);color:white;display:inline-block;font-weight:700;">SELECCIONADO</div>` : ''}
        </div>

        <!-- SIN ROSTRO -->
        <div id="face-opt-no" style="cursor:pointer;padding:12px 14px;border-radius:var(--radius-md);border:2px solid ${!effectiveUseFace ? 'rgba(99,102,241,0.6)' : 'var(--border)'};
          background:${!effectiveUseFace ? 'rgba(99,102,241,0.06)' : 'var(--bg-tertiary)'};transition:all 0.15s;text-align:center;">
          <div style="font-size:24px;margin-bottom:6px;">🎬</div>
          <div class="font-bold" style="font-size:13px;margin-bottom:3px;">Sin rostro</div>
          <div style="font-size:11px;color:var(--text-muted);line-height:1.4;">Centrada en el objeto o escena, sin cara</div>
          ${!effectiveUseFace ? `<div style="margin-top:6px;font-size:9px;padding:2px 8px;border-radius:20px;background:rgba(99,102,241,0.7);color:white;display:inline-block;font-weight:700;">SELECCIONADO</div>` : ''}
        </div>
      </div>

      ${effectiveUseFace ? `
      <div style="border-top:1px solid var(--border);padding-top:var(--space-md);">
        ${!hasFaces ? `
        <div style="padding:16px;background:rgba(220,38,38,0.06);border:1px solid rgba(220,38,38,0.2);border-radius:var(--radius-md);display:flex;align-items:center;gap:12px;">
          ${icon('alertTriangle', 18)}
          <div>
            <div class="font-bold text-sm" style="color:var(--accent);">No hay fotos en Face Vault</div>
            <div class="text-xs text-muted">Subí fotos del creador en Brand Kit → Face Vault para usar esta opción.</div>
          </div>
        </div>
        ` : `
        <div style="font-size:10px;font-weight:700;color:var(--text-tertiary);letter-spacing:0.5px;margin-bottom:8px;">Elegí la expresión a usar</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          ${faceList.map(f => {
            const isActive = (f.id === effectiveExpressionId);
            return `
            <div class="face-opt-card" data-face-id="${f.id}" style="cursor:pointer;display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:var(--radius-md);
              border:2px solid ${isActive ? 'var(--accent)' : 'var(--border)'};
              background:${isActive ? 'rgba(220,38,38,0.07)' : 'var(--bg-tertiary)'};transition:all 0.15s;">
              ${f.image_url ? `<img src="${f.image_url}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" />` : `<div style="width:32px;height:32px;border-radius:50%;background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;">${icon('user', 14)}</div>`}
              <div>
                <div class="font-bold" style="font-size:11px;">${f.expression_type || 'Sin etiqueta'}</div>
              </div>
              ${isActive ? `<span style="margin-left:4px;color:var(--accent);">${icon('check', 12)}</span>` : ''}
            </div>`;
          }).join('')}
        </div>
        `}
      </div>` : ''}
    </div>`;
  }

  // ─── Generation helpers ───────────────────────────────────────────────────

  function getGenContext() {
    const project = getProject();
    if (!project) return null;
    const style = STYLES.find(s => s.id === selectedStyleId);
    const formats = selectedFormats.map(fid => FORMATS.find(f => f.id === fid)).filter(Boolean);
    if (!style || formats.length === 0) return null;
    const matchedFace = faceList.find(f => f.id === autoMatchedFaceId);
    const useFace = faceEnabled !== null ? faceEnabled : !!matchedFace;
    const expressionId = selectedExpressionId || autoMatchedFaceId;
    const selectedFace = faceList.find(f => f.id === expressionId);
    return { project, style, formats, useFace, selectedFace, textMode, useCelebrity: useCelebrityModel };
  }

  async function generateSingleAngle(angleIndex, overrideTextMode = null, signal = null) {
    const effectiveTextMode = overrideTextMode !== null ? overrideTextMode : textMode;
    let ctx = getGenContext();

    // Fallback for Regenerar: if no UI context (user hasn't gone through the workflow
    // this session), reconstruct style/format from the existing variant's saved metadata.
    // textMode always comes from the current UI toggle — that's the whole point of Regenerar.
    if (!ctx) {
      const project = getProject();
      if (!project) return;
      const angle = (project.logic_dna?.selected_angles || [])[angleIndex];
      if (!angle) return;

      const existing = (project.thumbnail_variants || [])
        .filter(v => v.ai_metadata?.angle_name === angle.name && !v.ai_metadata?.parent_id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      if (!existing?.ai_metadata) {
        toast('Seleccioná estilo y formato antes de generar.', 'error');
        return;
      }

      const savedStyle = STYLES.find(s => s.label === existing.ai_metadata.style);
      const formatLabels = (existing.ai_metadata.format || '').split(' + ').map(s => s.trim()).filter(Boolean);
      const savedFormats = formatLabels.map(lbl => FORMATS.find(f => f.label === lbl)).filter(Boolean);

      if (!savedStyle || savedFormats.length === 0) {
        toast('Seleccioná estilo y formato antes de generar.', 'error');
        return;
      }

      const faceImageUrl = existing.ai_metadata.face_image_url || null;
      const useFace = !!faceImageUrl;
      const selectedFace = faceList.find(f => f.image_url === faceImageUrl) || null;

      ctx = { project, style: savedStyle, formats: savedFormats, useFace, selectedFace, textMode: effectiveTextMode };
    }

    const { project, style, formats, useFace, selectedFace } = ctx;
    const tMode = effectiveTextMode; // always use the explicitly captured mode
    const angle = (project.logic_dna?.selected_angles || [])[angleIndex];
    if (!angle) return;
    const imagePrompt = buildMasterPrompt({ project, angle, style, formats, selectedFace, useFace, brandKit, textMode: tMode, useCelebrity: useCelebrityModel });
    await generateAndSaveVariant({ project, angle, style, formats, imagePrompt, textMode: tMode, faceImageUrl: useFace ? (selectedFace?.image_url || null) : null, useCelebrity: useCelebrityModel, signal });
  }

  // ─── STEP 5: Ángulos + Generar ────────────────────────────────────────────

  function renderAnglesStep(project, selectedAngles) {
    if (!project) return `<div class="card" style="text-align:center;padding:var(--space-2xl);opacity:0.5;">${icon('folder', 40)}<p class="text-sm text-muted mt-md">Seleccioná un proyecto primero</p></div>`;
    if (selectedAngles.length === 0) return `<div class="card" style="text-align:center;padding:var(--space-xl);opacity:0.6;">${icon('crosshair', 32)}<p class="text-sm text-muted mt-sm">Este proyecto no tiene ángulos.<br/>Volvé a El Cerebro y elegí ángulos.</p></div>`;

    const CARDS_PER_PAGE = 4;
    const letters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'];
    const totalPages = Math.ceil(selectedAngles.length / CARDS_PER_PAGE);
    const safePage = Math.min(anglesPage, Math.max(0, totalPages - 1));
    const pageAngles = selectedAngles.slice(safePage * CARDS_PER_PAGE, (safePage + 1) * CARDS_PER_PAGE);
    const variants = project.thumbnail_variants || [];
    const masters = variants.filter(v => !v.ai_metadata?.parent_id);
    const children = variants.filter(v => !!v.ai_metadata?.parent_id);
    const allGenerated = selectedAngles.every(a => masters.some(v => v.ai_metadata?.angle_name === a.name));

    const renderAngleCard = (angle, globalIdx) => {
      const angleMasters = masters
        .filter(v => v.ai_metadata?.angle_name === angle.name)
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      const latest = angleMasters[0] || null;
      const allAngleChildren = children.filter(c => angleMasters.some(m => c.ai_metadata?.parent_id === m.id));
      const olderVersions = angleMasters.slice(1);
      const allHistory = [...allAngleChildren, ...olderVersions];
      const isGen = latest?.ai_metadata?.generating || generatingAnglesSet.has(globalIdx);
      const hasImg = !!latest?.image_url;
      const hasError = !!latest?.ai_metadata?.error;
      const safeTitle = project.title.slice(0, 20).replace(/\s+/g, '-');
      const isExpanding = expandingVariantsSet.has(latest?.id);
      // Detectar ángulos de alto riesgo clickbait (MIEDO/URGENCIA/FOMO)
      const isHighRiskAngle = /miedo|urgencia|fomo|amenaza|peligro/i.test(angle.name || '') ||
                              /miedo|urgencia|fomo/i.test(angle.psychology || angle.psychology_text || '');

      return `
      <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:16px;animation:fadeIn 0.3s ease both;">
        <div style="display:flex;min-height:210px;">
          <!-- Left: info + actions -->
          <div style="flex:1;padding:18px 20px;border-right:1px solid var(--border);display:flex;flex-direction:column;gap:8px;min-width:0;">
            <div style="display:flex;align-items:flex-start;gap:10px;">
              <div style="flex-shrink:0;width:30px;height:30px;border-radius:50%;background:var(--accent);color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;">
                ${letters[globalIdx] || globalIdx + 1}
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:14px;font-weight:800;line-height:1.3;">${angle.name}</div>
                ${angle.psychology || angle.psychology_text
                  ? `<div style="font-size:11px;color:var(--text-secondary);line-height:1.5;margin-top:4px;">${(angle.psychology || angle.psychology_text).slice(0, 160)}</div>`
                  : ''}
                ${isHighRiskAngle ? `
                <div style="margin-top:8px;padding:6px 10px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:var(--radius-sm);display:flex;align-items:flex-start;gap:6px;">
                  <span style="font-size:12px;flex-shrink:0;">⚠️</span>
                  <span style="font-size:10px;color:#f59e0b;line-height:1.5;"><strong>Ángulo de alto impacto:</strong> Asegurate de que el video cumpla lo que la miniatura promete. Un CTR alto con poco watch time le dice al algoritmo que defraudaste al espectador.</span>
                </div>` : ''}
              </div>
              <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                ${latest?.style_preset ? `<span class="badge badge-accent" style="font-size:9px;">${latest.style_preset}</span>` : ''}
                ${hasImg ? `<span style="font-size:13px;font-weight:800;color:${(latest.impact_score||0)>=90?'var(--success)':'var(--accent)'};">${latest.impact_score||0}</span>` : ''}
              </div>
            </div>
            <!-- Actions -->
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:auto;padding-top:8px;border-top:1px solid rgba(255,255,255,0.05);">
              ${isGen
                ? `<span class="text-xs text-accent animate-pulse">${icon('clock', 12)} Generando...</span>
                   <button class="btn btn-xs btn-cancel-angle" data-angle-index="${globalIdx}" style="margin-left:auto;font-size:10px;padding:3px 10px;border:1px solid rgba(220,38,38,0.4);background:rgba(220,38,38,0.08);color:#ef4444;border-radius:var(--radius-sm);cursor:pointer;">✕ Cancelar</button>`
                : hasImg
                  ? `<button class="btn btn-secondary btn-xs btn-download" data-src="${latest.image_url}" data-name="miniatura-${safeTitle}-${letters[globalIdx]}.jpg">${icon('download', 11)} Descargar</button>
                     <button class="btn btn-secondary btn-xs btn-generate-angle" data-angle-index="${globalIdx}" ${generatingAnglesSet.has(globalIdx) ? 'disabled' : ''} style="font-size:10px;">${icon('rocket', 10)} Regenerar</button>
                     ${!isExpanding ? `
                     <div style="display:flex;align-items:center;gap:4px;margin-left:auto;">
                       <select class="form-select" id="expand-count-${latest.id}" style="font-size:10px;padding:2px 4px;height:26px;width:60px;">
                         ${[1,2,3,4,5,6,7,8].map(n=>`<option value="${n}"${n===1?' selected':''}>${n}x</option>`).join('')}
                       </select>
                       <button class="btn btn-primary btn-xs btn-expand-variant" data-variant-id="${latest.id}" ${expandingVariantsSet.has(latest.id)?'disabled':''} style="white-space:nowrap;">${icon('plus',10)} Variación</button>
                     </div>` : `<span class="text-xs text-accent animate-pulse" style="margin-left:auto;">${icon('clock',10)} Variando...</span>`}`
                  : hasError
                    ? `<span class="text-xs" style="color:var(--danger);">${icon('alertTriangle', 11)} Error</span>
                       <button class="btn btn-primary btn-xs btn-generate-angle" data-angle-index="${globalIdx}" ${generatingAnglesSet.has(globalIdx) ? 'disabled' : ''}>Reintentar</button>`
                    : `<button class="btn btn-primary btn-sm btn-generate-angle" data-angle-index="${globalIdx}" ${isGenerating || generatingAnglesSet.has(globalIdx) ? 'disabled' : ''} style="font-weight:700;">${icon('rocket', 13)} Generar miniatura</button>`
              }
            </div>
          </div>
          <!-- Right: thumbnail -->
          <div style="width:360px;flex-shrink:0;position:relative;background:var(--bg-tertiary);">
            ${isGen
              ? thumbLoaderHTML()
              : hasImg
                ? `<img src="${latest.image_url}" class="thumb-preview-trigger" data-preview="${latest.image_url}" data-angle-group="angle-${globalIdx}" data-name="miniatura-${safeTitle}-${letters[globalIdx]}.png"
                     style="width:100%;height:100%;object-fit:cover;cursor:zoom-in;display:block;" />
                   ${latest.overlay_text ? `<div style="position:absolute;bottom:0;left:0;right:0;padding:6px 8px;background:linear-gradient(transparent,rgba(0,0,0,0.85));">
                     <div style="font-family:var(--font-impact);font-size:13px;color:white;letter-spacing:2px;">${latest.overlay_text}</div>
                   </div>` : ''}`
                : hasError
                  ? `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:6px;padding:16px;text-align:center;">
                       <span style="color:var(--danger);opacity:0.7;">${icon('alertTriangle', 28)}</span>
                       <div style="font-size:10px;color:var(--text-tertiary);line-height:1.4;">${latest.ai_metadata.error.slice(0,80)}</div>
                     </div>`
                  : `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:8px;opacity:0.3;">
                       ${icon('image', 36)}
                       <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;">Sin generar</div>
                     </div>`
            }
          </div>
        </div>
        ${allHistory.length > 0 ? `
        <div style="border-top:1px solid var(--border);padding:12px 20px;background:rgba(0,0,0,0.12);">
          <div style="font-size:10px;font-weight:700;color:var(--text-tertiary);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">
            ${allAngleChildren.length > 0 && olderVersions.length > 0
              ? `Variaciones (${allAngleChildren.length}) · Versiones anteriores (${olderVersions.length})`
              : allAngleChildren.length > 0
                ? `Variaciones (${allAngleChildren.length})`
                : `Versiones anteriores (${olderVersions.length})`}
          </div>
          <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;">
            ${allHistory.map((c, ci) => {
              const isOld = olderVersions.includes(c);
              const isStuck = c.ai_metadata?.generating && !c.image_url;
              return `
              <div style="flex-shrink:0;width:180px;border-radius:var(--radius-md);overflow:hidden;position:relative;aspect-ratio:16/9;background:var(--bg-tertiary);${isOld ? 'opacity:0.75;' : ''}">
                ${c.image_url
                  ? `<img src="${c.image_url}" class="thumb-preview-trigger" data-preview="${c.image_url}" data-angle-group="angle-${globalIdx}" data-name="var-${letters[globalIdx]}-${ci+1}.png" style="width:100%;height:100%;object-fit:cover;cursor:zoom-in;" />`
                  : isStuck
                    ? `${thumbLoaderHTML('', '')}
                       <button class="btn-cancel-variant" data-variant-id="${c.id}" title="Cancelar" style="position:absolute;bottom:6px;left:50%;transform:translateX(-50%);background:rgba(220,38,38,0.9);border:none;border-radius:3px;padding:2px 8px;cursor:pointer;color:white;font-size:9px;font-weight:700;z-index:20;white-space:nowrap;display:flex;align-items:center;gap:3px;">${icon('x',8)} Cancelar</button>`
                    : `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:4px;padding:8px;text-align:center;">
                         <div style="color:var(--danger);opacity:0.7;">${icon('alertTriangle',12)}</div>
                         <div style="color:var(--text-tertiary);font-size:8px;">Error</div>
                       </div>`
                }
                ${isOld ? `<div style="position:absolute;top:4px;left:4px;background:rgba(0,0,0,0.7);border-radius:3px;padding:1px 5px;font-size:9px;color:rgba(255,255,255,0.7);">anterior</div>` : ''}
                ${!isStuck ? `<button class="btn-delete-variant" data-variant-id="${c.id}" title="Eliminar" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);border:none;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:white;">${icon('trash',9)}</button>` : ''}
                ${c.image_url ? `<button class="btn-download" data-src="${c.image_url}" data-name="var-${letters[globalIdx]}-${ci+1}.png" style="position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,0.6);border:none;border-radius:var(--radius-sm);padding:2px 6px;cursor:pointer;color:white;font-size:9px;display:flex;align-items:center;gap:3px;">${icon('download',9)}</button>` : ''}
              </div>`;
            }).join('')}
          </div>
        </div>` : ''}
      </div>`;
    };

    return `
    <div>
      <!-- Header: text mode toggle + Agent Mode + Generar Todas -->
      <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 18px;margin-bottom:var(--space-lg);">

        <!-- Text mode selector -->
        <div style="font-size:10px;font-weight:700;color:var(--text-tertiary);letter-spacing:0.8px;text-transform:uppercase;margin-bottom:12px;">✍️ ¿Tu miniatura lleva texto?</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;">
          <div id="text-opt-none" style="cursor:pointer;padding:12px 8px;border-radius:var(--radius-md);border:2px solid ${textMode === 'none' ? 'var(--accent)' : 'var(--border)'};background:${textMode === 'none' ? 'rgba(220,38,38,0.06)' : 'var(--bg-tertiary)'};transition:all 0.15s;text-align:center;">
            <div style="font-size:20px;margin-bottom:5px;">🚫</div>
            <div class="font-bold" style="font-size:11px;margin-bottom:2px;color:${textMode === 'none' ? 'var(--text-primary)' : 'var(--text-secondary)'};">SIN TEXTO</div>
            <div style="font-size:9px;color:var(--text-muted);line-height:1.4;">Solo imagen pura</div>
            ${textMode === 'none' ? `<div style="margin-top:6px;font-size:9px;padding:2px 8px;border-radius:20px;background:var(--accent);color:white;display:inline-block;font-weight:700;">ACTIVO</div>` : ''}
          </div>
          <div id="text-opt-canvas" style="cursor:pointer;padding:12px 8px;border-radius:var(--radius-md);border:2px solid ${textMode === 'canvas' ? 'rgba(16,185,129,0.7)' : 'var(--border)'};background:${textMode === 'canvas' ? 'rgba(16,185,129,0.06)' : 'var(--bg-tertiary)'};transition:all 0.15s;text-align:center;">
            <div style="font-size:20px;margin-bottom:5px;">🖼️</div>
            <div class="font-bold" style="font-size:11px;margin-bottom:2px;color:${textMode === 'canvas' ? '#10b981' : 'var(--text-secondary)'};">TEXTO CANVAS</div>
            <div style="font-size:9px;color:var(--text-muted);line-height:1.4;">Tipografía perfecta<br/>sobre imagen limpia</div>
            ${textMode === 'canvas' ? `<div style="margin-top:6px;font-size:9px;padding:2px 8px;border-radius:20px;background:#10b981;color:white;display:inline-block;font-weight:700;">ACTIVO</div>` : ''}
          </div>
          <div id="text-opt-ai" style="cursor:pointer;padding:12px 8px;border-radius:var(--radius-md);border:2px solid ${textMode === 'ai' ? 'rgba(99,102,241,0.6)' : 'var(--border)'};background:${textMode === 'ai' ? 'rgba(99,102,241,0.06)' : 'var(--bg-tertiary)'};transition:all 0.15s;text-align:center;">
            <div style="font-size:20px;margin-bottom:5px;">✍️</div>
            <div class="font-bold" style="font-size:11px;margin-bottom:2px;color:${textMode === 'ai' ? '#818cf8' : 'var(--text-secondary)'};">TEXTO IA</div>
            <div style="font-size:9px;color:var(--text-muted);line-height:1.4;">IA elige fuente,<br/>posición y estilo</div>
            ${textMode === 'ai' ? `<div style="margin-top:6px;font-size:9px;padding:2px 8px;border-radius:20px;background:rgba(99,102,241,0.7);color:white;display:inline-block;font-weight:700;">ACTIVO</div>` : ''}
          </div>
        </div>

        <!-- Agent Mode toggle -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:var(--radius-md);border:1px solid ${agentMode ? 'rgba(251,191,36,0.4)' : 'var(--border)'};background:${agentMode ? 'rgba(251,191,36,0.05)' : 'var(--bg-tertiary)'};margin-bottom:14px;cursor:pointer;" id="toggle-agent-mode">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="font-size:18px;">🤖</div>
            <div>
              <div style="font-size:11px;font-weight:700;color:${agentMode ? '#fbbf24' : 'var(--text-secondary)'};">MODO AGENTE</div>
              <div style="font-size:9px;color:var(--text-muted);">Draft → Crítica visual → Miniatura potenciada (2× tiempo)</div>
            </div>
          </div>
          <div style="width:36px;height:20px;border-radius:10px;background:${agentMode ? '#fbbf24' : 'var(--border)'};position:relative;transition:background 0.2s;flex-shrink:0;">
            <div style="width:16px;height:16px;border-radius:50%;background:white;position:absolute;top:2px;left:${agentMode ? '18px' : '2px'};transition:left 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>
          </div>
        </div>

        <!-- Generate All button -->
        <div style="display:flex;justify-content:flex-end;">
          <button id="btn-generate-all" class="btn btn-primary" ${isGenerating ? 'disabled' : ''}
            style="background:linear-gradient(135deg,var(--accent),#9333ea);font-weight:800;white-space:nowrap;">
            ${isGenerating
              ? `<span class="animate-pulse">${icon('clock',14)}</span> Generando...`
              : `${icon('rocket',14)} Generar Todas`}
          </button>
        </div>
      </div>

      <!-- Angle cards (paginated) -->
      <div>
        ${pageAngles.map((a, pi) => renderAngleCard(a, safePage * CARDS_PER_PAGE + pi)).join('')}
      </div>

      ${totalPages > 1 ? `
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:var(--space-md);">
        <button class="btn btn-secondary btn-sm angles-page-btn" data-page="${safePage - 1}" ${safePage === 0 ? 'disabled' : ''}>${icon('arrowLeft',12)}</button>
        ${Array.from({length:totalPages},(_,i)=>`
          <button class="btn btn-sm angles-page-btn ${i===safePage?'btn-primary':'btn-secondary'}" data-page="${i}"
            style="min-width:32px;font-size:12px;">${i+1}</button>`).join('')}
        <button class="btn btn-secondary btn-sm angles-page-btn" data-page="${safePage + 1}" ${safePage >= totalPages-1 ? 'disabled' : ''}>${icon('arrowRight',12)}</button>
      </div>` : ''}

      <!-- Test & Compare callout -->
      ${masters.length > 0 ? `
      <div style="background:linear-gradient(135deg,rgba(16,185,129,0.07),rgba(99,102,241,0.04));border:1px solid rgba(16,185,129,0.22);border-radius:var(--radius-lg);padding:16px 20px;margin-top:var(--space-lg);display:flex;align-items:flex-start;gap:14px;">
        <div style="font-size:26px;flex-shrink:0;margin-top:2px;">🧪</div>
        <div>
          <div style="font-weight:800;font-size:13px;color:#10b981;margin-bottom:5px;">Tus miniaturas están listas para el Test & Compare de YouTube</div>
          <div style="font-size:11px;color:var(--text-secondary);line-height:1.6;margin-bottom:10px;">YouTube Studio te permite testear hasta 3 variantes simultáneamente. Mide cuál <strong>retiene mejor</strong> al espectador — no solo el CTR. Es gratis para todos los canales elegibles.</div>
          <div style="font-size:11px;color:var(--text-secondary);line-height:2;">
            <span style="color:#10b981;font-weight:800;">①</span>&nbsp; Descargá 2 o 3 de tus miniaturas generadas<br/>
            <span style="color:#10b981;font-weight:800;">②</span>&nbsp; En YouTube Studio → tu video → <span style="background:rgba(16,185,129,0.12);padding:1px 6px;border-radius:4px;font-weight:700;color:#10b981;">Miniatura → Probar y comparar</span><br/>
            <span style="color:#10b981;font-weight:800;">③</span>&nbsp; Subí las variantes. YouTube las rota automáticamente entre tu audiencia y te dice cuál gana en 3-14 días.
          </div>
        </div>
      </div>` : ''}
    </div>`;
  }

  // ─── Shared thumbnail drawer card (for history section) ──────────────────

  function renderVariantDrawerCard(latest, olderVersions, variantChildren, project, cardIdx) {
    const isGen = !!latest.ai_metadata?.generating;
    const hasImg = !!latest.image_url;
    const hasError = !!latest.ai_metadata?.error;
    const isExpanding = expandingVariantsSet.has(latest.id);
    const safeTitle = project.title.slice(0, 20).replace(/\s+/g, '-');
    const angleName = latest.ai_metadata?.angle_name || '—';
    const allSubItems = [...variantChildren, ...olderVersions]; // shown in bottom strip

    return `
    <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:12px;animation:fadeIn 0.3s ease both;animation-delay:${cardIdx*0.04}s;">
      <div style="display:flex;min-height:140px;">
        <!-- Left: info + actions -->
        <div style="flex:1;padding:18px 20px;border-right:1px solid var(--border);display:flex;flex-direction:column;gap:6px;min-width:0;">
          <!-- Title row -->
          <div style="display:flex;align-items:flex-start;gap:8px;">
            <div style="flex:1;min-width:0;">
              <div style="font-size:15px;font-weight:800;line-height:1.3;color:var(--text-primary);">${angleName}</div>
              ${latest.overlay_text ? `<div style="font-size:11px;font-weight:700;letter-spacing:1px;color:var(--text-tertiary);margin-top:2px;text-transform:uppercase;">${latest.overlay_text}</div>` : ''}
            </div>
            <span style="flex-shrink:0;font-size:13px;font-weight:800;color:${(latest.impact_score||0)>=90?'var(--success)':'var(--accent)'};">${latest.impact_score||0}</span>
          </div>
          <!-- Badges -->
          <div style="display:flex;gap:5px;flex-wrap:wrap;">
            ${latest.style_preset ? `<span class="badge badge-accent" style="font-size:9px;">${latest.style_preset}</span>` : ''}
            ${latest.ai_metadata?.format ? `<span class="badge" style="font-size:9px;background:rgba(99,102,241,0.15);color:#818cf8;">${latest.ai_metadata.format}</span>` : ''}
            ${olderVersions.length > 0 ? `<span class="badge badge-neutral" style="font-size:9px;">${olderVersions.length} versión${olderVersions.length!==1?'es':''} anterior${olderVersions.length!==1?'es':''}</span>` : ''}
          </div>
          <!-- Actions -->
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:auto;padding-top:8px;border-top:1px solid rgba(255,255,255,0.05);">
            ${isGen
              ? `<span class="text-xs text-accent animate-pulse">${icon('clock',12)} Generando...</span>`
              : hasImg
                ? `<button class="btn btn-secondary btn-xs btn-download" data-src="${latest.image_url}" data-name="miniatura-${safeTitle}-${cardIdx+1}.jpg">${icon('download',11)} Descargar</button>
                   ${!isExpanding ? `
                   <div style="display:flex;align-items:center;gap:4px;">
                     <select class="form-select" id="expand-count-${latest.id}" style="font-size:10px;padding:2px 4px;height:26px;width:60px;">
                       ${[1,2,3,4,5,6,7,8].map(n=>`<option value="${n}"${n===1?' selected':''}>${n}x</option>`).join('')}
                     </select>
                     <button class="btn btn-primary btn-xs btn-expand-variant" data-variant-id="${latest.id}" ${expandingVariantsSet.has(latest.id)?'disabled':''} style="white-space:nowrap;">${icon('plus',10)} Variación</button>
                   </div>` : `<span class="text-xs text-accent animate-pulse">${icon('clock',10)} Variando...</span>`}
                   <button class="btn-delete-variant btn btn-secondary btn-xs" data-variant-id="${latest.id}" style="margin-left:auto;color:var(--danger);">${icon('trash',11)}</button>`
                : hasError
                  ? `<span class="text-xs" style="color:var(--danger);">${icon('alertTriangle',11)} Error</span>
                     <button class="btn-delete-variant btn btn-secondary btn-xs" data-variant-id="${latest.id}" style="margin-left:auto;color:var(--danger);">${icon('trash',11)}</button>`
                  : `<span class="text-xs text-muted">Sin imagen</span>`
            }
          </div>
        </div>
        <!-- Right: thumbnail -->
        <div style="width:260px;flex-shrink:0;position:relative;background:var(--bg-tertiary);">
          ${isGen
            ? thumbLoaderHTML()
            : hasImg
              ? `<img src="${latest.image_url}" class="thumb-preview-trigger" data-preview="${latest.image_url}" data-angle-group="drawer-${cardIdx}" data-name="miniatura-${safeTitle}-${cardIdx+1}.png"
                   style="width:100%;height:100%;object-fit:cover;cursor:zoom-in;display:block;" />
                 ${latest.overlay_text ? `<div style="position:absolute;bottom:0;left:0;right:0;padding:6px 8px;background:linear-gradient(transparent,rgba(0,0,0,0.85));">
                   <div style="font-family:var(--font-impact);font-size:13px;color:white;letter-spacing:2px;">${latest.overlay_text}</div>
                 </div>` : ''}`
              : hasError
                ? `<div style="display:flex;align-items:center;justify-content:center;height:100%;padding:16px;opacity:0.5;">${icon('alertTriangle',28)}</div>`
                : `<div style="display:flex;align-items:center;justify-content:center;height:100%;opacity:0.2;">${icon('image',36)}</div>`
          }
        </div>
      </div>
      ${allSubItems.length > 0 ? `
      <div style="border-top:1px solid var(--border);padding:12px 20px;background:rgba(0,0,0,0.15);">
        <div style="font-size:10px;font-weight:700;color:var(--text-tertiary);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">
          ${variantChildren.length > 0 && olderVersions.length > 0
            ? `Variaciones (${variantChildren.length}) · Versiones previas (${olderVersions.length})`
            : variantChildren.length > 0
              ? `Variaciones (${variantChildren.length})`
              : `Versiones previas (${olderVersions.length})`}
        </div>
        <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;">
          ${allSubItems.map((c, ci) => {
            const isOld = olderVersions.includes(c);
            const isStuck = c.ai_metadata?.generating && !c.image_url;
            return `
            <div style="flex-shrink:0;width:140px;border-radius:var(--radius-md);overflow:hidden;position:relative;aspect-ratio:16/9;background:var(--bg-tertiary);${isOld?'opacity:0.7;':''}">
              ${c.image_url
                ? `<img src="${c.image_url}" class="thumb-preview-trigger" data-preview="${c.image_url}" data-angle-group="drawer-${cardIdx}" data-name="var-${cardIdx+1}-${ci+1}.png" style="width:100%;height:100%;object-fit:cover;cursor:zoom-in;" />`
                : isStuck
                  ? `${thumbLoaderHTML('', '')}
                     <button class="btn-cancel-variant" data-variant-id="${c.id}" title="Cancelar generación" style="position:absolute;bottom:6px;left:50%;transform:translateX(-50%);background:rgba(220,38,38,0.9);border:none;border-radius:3px;padding:2px 8px;cursor:pointer;color:white;font-size:9px;font-weight:700;z-index:20;white-space:nowrap;display:flex;align-items:center;gap:3px;">${icon('x',8)} Cancelar</button>`
                  : `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:4px;padding:8px;text-align:center;">
                       <div style="color:var(--danger);opacity:0.7;">${icon('alertTriangle',12)}</div>
                       <div style="color:var(--text-tertiary);font-size:8px;">Error</div>
                     </div>`
              }
              ${isOld ? `<div style="position:absolute;top:4px;left:4px;background:rgba(0,0,0,0.7);border-radius:3px;padding:1px 5px;font-size:9px;color:rgba(255,255,255,0.7);">anterior</div>` : ''}
              ${!isStuck ? `<button class="btn-delete-variant" data-variant-id="${c.id}" title="Eliminar" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);border:none;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:white;">${icon('trash',9)}</button>` : ''}
              ${c.image_url ? `<button class="btn-download" data-src="${c.image_url}" data-name="var-${cardIdx+1}-${ci+1}.png" style="position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,0.6);border:none;border-radius:var(--radius-sm);padding:2px 5px;cursor:pointer;color:white;font-size:9px;display:flex;align-items:center;gap:3px;">${icon('download',9)}</button>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>` : ''}
    </div>`;
  }

  // ─── Variants history ─────────────────────────────────────────────────────

  function renderVariantsHistory(project, variants) {
    if (variants.length === 0) return '';
    const CARDS_PER_PAGE = 4;
    const allMasters = variants.filter(v => !v.ai_metadata?.parent_id)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    const children = variants.filter(v => !!v.ai_metadata?.parent_id);
    if (allMasters.length === 0) return '';

    // Group masters by angle_name so duplicates collapse into one card
    const groupMap = new Map();
    for (const m of allMasters) {
      const key = m.ai_metadata?.angle_name || m.id;
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key).push(m);
    }
    const groups = [...groupMap.values()]; // each group: [latest, ...older]
    const generating = variants.filter(v => v.ai_metadata?.generating).length;

    const totalPages = Math.ceil(groups.length / CARDS_PER_PAGE);
    const safePage = Math.min(variantsPage, Math.max(0, totalPages - 1));
    const pageGroups = groups.slice(safePage * CARDS_PER_PAGE, (safePage + 1) * CARDS_PER_PAGE);

    return `
    <div class="mt-lg" id="variants-history-section">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-md);">
        <div class="text-xs font-bold text-muted" style="letter-spacing:1px;text-transform:uppercase;">${icon('image',12)} Miniaturas generadas (${groups.length} ángulo${groups.length!==1?'s':''}${allMasters.length > groups.length ? ` · ${allMasters.length} total` : ''})</div>
        ${generating > 0 ? `<span class="text-xs text-accent animate-pulse">${icon('clock',12)} Generando ${generating}...</span>` : ''}
      </div>

      ${pageGroups.map((group, pi) => {
        const [latest, ...olderVersions] = group;
        const mChildren = children.filter(c => c.ai_metadata?.parent_id === latest.id);
        return renderVariantDrawerCard(latest, olderVersions, mChildren, project, safePage * CARDS_PER_PAGE + pi);
      }).join('')}

      ${totalPages > 1 ? `
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:var(--space-md);">
        <button class="btn btn-secondary btn-sm variants-page-btn" data-page="${safePage-1}" ${safePage===0?'disabled':''}>${icon('arrowLeft',12)}</button>
        ${Array.from({length:totalPages},(_,i)=>`
          <button class="btn btn-sm variants-page-btn ${i===safePage?'btn-primary':'btn-secondary'}" data-page="${i}"
            style="min-width:32px;font-size:12px;">${i+1}</button>`).join('')}
        <button class="btn btn-secondary btn-sm variants-page-btn" data-page="${safePage+1}" ${safePage>=totalPages-1?'disabled':''}>${icon('arrowRight',12)}</button>
      </div>` : ''}
    </div>`;
  }

  // ─── EVENTS ───────────────────────────────────────────────────────────────

  function bindEvents() {
    bindStepContentEvents();

    container.querySelectorAll('.step-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const n = parseInt(btn.dataset.step);
        if (!btn.disabled) { workflowStep = n; render(); }
      });
    });

    document.getElementById('btn-prev-step')?.addEventListener('click', () => {
      if (workflowStep > 1) { workflowStep--; render(); }
    });
    document.getElementById('btn-next-step')?.addEventListener('click', () => {
      if (workflowStep < 5) { workflowStep++; render(); }
    });

    // ── nav GENERAR TODAS (step 5 bottom nav) — delegates to in-step btn ──
    document.getElementById('btn-generate-master')?.addEventListener('click', () => {
      document.getElementById('btn-generate-all')?.click();
    });

    // ── History section: pagination ──
    container.querySelectorAll('.variants-page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        variantsPage = parseInt(btn.dataset.page);
        render();
      });
    });

    // ── History section: delete-variant ──
    document.querySelectorAll('#variants-history-section .btn-delete-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const variantId = btn.dataset.variantId;
        const project = getProject();
        if (!project) return;
        const variant = (project.thumbnail_variants || []).find(v => v.id === variantId);
        if (variant?.image_url) {
          const parts = variant.image_url.split('/public/thumbnails/');
          if (parts.length > 1) await supabase.storage.from('thumbnails').remove([parts[1]]).catch(()=>{});
        }
        const { error } = await supabase.from('thumbnail_variants').delete().eq('id', variantId);
        if (error) { toast('Error al eliminar: ' + error.message, 'error'); return; }
        await reloadProjects();
        render();
      });
    });

    // ── History section: cancel stuck variant ──
    document.querySelectorAll('#variants-history-section .btn-cancel-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await cancelStuckVariant(btn.dataset.variantId);
      });
    });

    // ── History section: lightbox + download ──
    document.querySelectorAll('#variants-history-section .thumb-preview-trigger').forEach(img => {
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightboxForImg(img);
      });
    });
    document.querySelectorAll('#variants-history-section .btn-download').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const src = btn.dataset.src, name = btn.dataset.name;
        try {
          const resp = await fetch(src);
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
          setTimeout(()=>URL.revokeObjectURL(url),1000);
        } catch { const a=document.createElement('a'); a.href=src; a.download=name; document.body.appendChild(a); a.click(); document.body.removeChild(a); }
      });
    });

    // ── History section: expand-variant ──
    document.querySelectorAll('#variants-history-section .btn-expand-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const variantId = btn.dataset.variantId;
        if (expandingVariantsSet.has(variantId)) return;
        const countSelect = document.getElementById(`expand-count-${variantId}`);
        const count = Math.min(parseInt(countSelect?.value || '1'), 8);
        const project = getProject();
        if (!project) return;
        const baseVariant = (project.thumbnail_variants || []).find(v => v.id === variantId);
        if (!baseVariant) return;
        expandingVariantsSet.add(variantId);
        render();
        try {
          for (let i = 0; i < count; i++) {
            const variationPrompt = buildVariationPrompt(baseVariant, project, i, count);
            const isRealAngleId = baseVariant.angle_id && !String(baseVariant.angle_id).startsWith('ai-');
            const { data: inserted, error: insertErr } = await supabase
              .from('thumbnail_variants')
              .insert({
                project_id: project.id,
                angle_id: isRealAngleId ? baseVariant.angle_id : null,
                overlay_text: baseVariant.overlay_text,
                style_preset: baseVariant.style_preset,
                impact_score: Math.floor(Math.random() * 20) + 80,
                ai_metadata: {
                  prompt: variationPrompt,
                  angle_name: baseVariant.ai_metadata?.angle_name || '',
                  format: baseVariant.ai_metadata?.format || '',
                  style: baseVariant.style_preset,
                  generating: true,
                  parent_id: variantId,
                  face_image_url: baseVariant.ai_metadata?.face_image_url || null,
                }
              })
              .select()
              .single();
            if (insertErr) throw insertErr;
            await reloadProjects();
            render(); // muestra spinner inline en la card recién insertada

            try {
              const variationFaceUrl = baseVariant.ai_metadata?.face_image_url || null;
              const dataUrl = await generateImage(variationPrompt, variationFaceUrl);
              const userId = getState().session?.user?.id;
              const blob = await fetch(dataUrl).then(r => r.blob());
              const mimeType = blob.type || 'image/jpeg';
              const ext = mimeType.includes('png') ? 'png' : 'jpg';
              const fileName = `${userId}/thumbnails/${project.id}/${inserted.id}.${ext}`;
              const { error: uploadError } = await supabase.storage.from('thumbnails').upload(fileName, blob, { contentType: mimeType });
              if (uploadError) throw new Error(`Upload falló: ${uploadError.message}`);
              const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(fileName);
              await supabase.from('thumbnail_variants').update({
                image_url: urlData.publicUrl,
                ai_metadata: { ...inserted.ai_metadata, generating: false }
              }).eq('id', inserted.id);
            } catch (imgErr) {
              console.error('Variation image gen failed:', imgErr);
              await supabase.from('thumbnail_variants').update({
                ai_metadata: { ...inserted.ai_metadata, generating: false, error: imgErr.message }
              }).eq('id', inserted.id);
            }
          }
        } catch (err) {
          console.error('Expand error:', err);
          toast('Error al generar variaciones: ' + err.message, 'error');
        } finally {
          expandingVariantsSet.delete(variantId);
          await reloadProjects();
          render();
        }
      });
    });
  }

  // ── Step-content events: re-bound after rerenderStep() ───────────────────

  function bindStepContentEvents_REMOVE() {
    // ── Rename project ──
    container.querySelectorAll('.btn-rename-project').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const projectId = btn.dataset.projectId;
        const currentTitle = btn.dataset.projectTitle;
        const newTitle = await inputDialog('Ingresá el nuevo nombre para este proyecto', {
          title: 'Renombrar Proyecto',
          defaultValue: currentTitle,
          placeholder: 'Nombre del proyecto...',
          confirmLabel: 'Renombrar',
        });
        if (!newTitle || newTitle === currentTitle) return;
        try {
          const { error } = await supabase.from('projects').update({ title: newTitle }).eq('id', projectId);
          if (error) throw error;
          await reloadProjects();
          render();
          toast('Proyecto renombrado', 'success', 2500);
        } catch (err) {
          console.error('Rename project error:', err);
          toast('Error al renombrar: ' + err.message, 'error');
        }
      });
    });

    container.querySelectorAll('.btn-delete-project').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const projectId = btn.dataset.projectId;
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const variantCount = (project.thumbnail_variants || []).length;
        const confirmMsg = `¿Eliminar "${project.title}"?\nSe borrarán ${variantCount} miniatura${variantCount !== 1 ? 's' : ''} y todos los datos del proyecto. Esta acción no se puede deshacer.`;
        const ok = await confirmDialog(confirmMsg, { title: 'Eliminar Proyecto', confirmLabel: 'Eliminar', danger: true });
        if (!ok) return;

        try {
          // Delete variant images from storage
          const variants = project.thumbnail_variants || [];
          for (const v of variants) {
            if (v.image_url) {
              const urlParts = v.image_url.split('/public/thumbnails/');
              if (urlParts.length > 1) {
                await supabase.storage.from('thumbnails').remove([urlParts[1]]).catch(() => {});
              }
            }
          }

          // Delete thumbnail_variants (cascade may handle this, but explicit is safer)
          await supabase.from('thumbnail_variants').delete().eq('project_id', projectId);

          // Delete the project itself
          const { error } = await supabase.from('projects').delete().eq('id', projectId);
          if (error) throw error;

          // Reset selected project if it was the deleted one
          if (selectedProjectId === projectId) {
            selectedProjectId = null;
            workflowStep = 1;
            selectedFormats = [];
            selectedStyleId = null;
            batchAngleSelection = null;
          }

          await reloadProjects();
          if (!selectedProjectId && projects.length > 0) {
            selectedProjectId = projects[0].id;
          }
          render();
          toast('Proyecto eliminado', 'success', 2500);
        } catch (err) {
          console.error('Delete project error:', err);
          toast('Error al eliminar el proyecto: ' + err.message, 'error');
        }
      });
    });


    bindStepContentEvents();

    container.querySelectorAll('.step-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const n = parseInt(btn.dataset.step);
        if (!btn.disabled) { workflowStep = n; render(); }
      });
    });

    document.getElementById('btn-prev-step')?.addEventListener('click', () => {
      if (workflowStep > 1) { workflowStep--; render(); }
    });
    document.getElementById('btn-next-step')?.addEventListener('click', () => {
      if (workflowStep < 5) { workflowStep++; render(); }
    });
  }

  // ── Step-content events (re-bound after rerenderStep) ────────────────────

  function bindStepContentEvents_REMOVE2() {
    // ── Project list toggle button ──
    document.getElementById('btn-toggle-project-list')?.addEventListener('click', () => {
      const panel = document.getElementById('project-list-panel');
      if (!panel) return;
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });

    // ── Project row selection (Step 1) — no auto-advance ──
    container.querySelectorAll('.project-row').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.btn-rename-project') || e.target.closest('.btn-delete-project')) return;
        if (selectedProjectId !== el.dataset.projectId) {
          selectedProjectId = el.dataset.projectId;
          selectedFormats = [];
          selectedStyleId = null;
          batchAngleSelection = null;
        }
        // Close dropdown, update selected display — no step advance
        const panel = document.getElementById('project-list-panel');
        if (panel) panel.style.display = 'none';
        // Update next button state
        const nextBtn = document.getElementById('btn-next-step');
        if (nextBtn) nextBtn.disabled = false;
        rerenderStep();
      });
    });

    // ── Format card selection (no full re-render) ──
    container.querySelectorAll('.format-card').forEach(card => {
      card.addEventListener('click', () => {
        const fid = card.dataset.formatId;
        if (selectedFormats.includes(fid)) {
          selectedFormats = selectedFormats.filter(x => x !== fid);
        } else {
          selectedFormats.push(fid);
        }
        rerenderStep();
        // Update next button state
        const nextBtn = document.getElementById('btn-next-step');
        if (nextBtn) nextBtn.disabled = selectedFormats.length === 0;
      });
    });

    // ── Style card selection (no full re-render) ──
    container.querySelectorAll('.style-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedStyleId = selectedStyleId === card.dataset.styleId ? null : card.dataset.styleId;
        rerenderStep();
        // Update generate button state
        const project = getProject();
        const selectedAngles = project?.logic_dna?.selected_angles || [];
        const genBtn = document.getElementById('btn-generate-master');
        if (genBtn) genBtn.disabled = !selectedStyleId || selectedAngles.length === 0;
      });
    });


    container.querySelectorAll('.btn-delete-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const variantId = btn.dataset.variantId;
        const project = getProject();
        if (!project) return;
        const variant = (project.thumbnail_variants || []).find(v => v.id === variantId);
        try {
          if (variant?.image_url) {
            const urlParts = variant.image_url.split('/public/thumbnails/');
            if (urlParts.length > 1) {
              await supabase.storage.from('thumbnails').remove([urlParts[1]]).catch(() => { });
            }
          }
          const { error } = await supabase.from('thumbnail_variants').delete().eq('id', variantId);
          if (error) throw error;
          await reloadProjects();
          render();
        } catch (err) {
          console.error('Delete variant error:', err);
          toast('Error al eliminar: ' + err.message, 'error');
        }
      });
    });

    // ── Cancel stuck variant (spinner cards) ──
    container.querySelectorAll('.btn-cancel-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await cancelStuckVariant(btn.dataset.variantId);
      });
    });

    container.querySelectorAll('.thumb-preview-trigger').forEach(img => {
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightboxForImg(img);
      });
    });

    container.querySelectorAll('.btn-download').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const src = btn.dataset.src;
        const name = btn.dataset.name;
        try {
          const resp = await fetch(src);
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch {
          const a = document.createElement('a');
          a.href = src;
          a.download = name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      });
    });


    // Face toggle — re-render so the visual (slider position, colors) updates correctly
    container.querySelector('#check-use-face')?.addEventListener('change', (e) => {
      faceEnabled = e.target.checked;
      render();
    });

    // Face select — persist selection across renders
    container.querySelector('#select-expression-step3')?.addEventListener('change', (e) => {
      selectedExpressionId = e.target.value;
    });


    // ── GENERATE MASTER BATCH ──
    document.getElementById('btn-generate-master')?.addEventListener('click', async () => {
      const project = getProject();
      const selectedAngles = project?.logic_dna?.selected_angles || [];
      const activeIndices = batchAngleSelection ?? selectedAngles.map((_, i) => i);
      const anglesToGenerate = selectedAngles.filter((_, i) => activeIndices.includes(i));
      if (!project || anglesToGenerate.length === 0 || !selectedStyleId || selectedFormats.length === 0) return;

      const style = STYLES.find(s => s.id === selectedStyleId);
      const formats = selectedFormats.map(fid => FORMATS.find(f => f.id === fid)).filter(Boolean);
      const matchedFaceAtGen = faceList.find(f => f.id === autoMatchedFaceId);
      const useFace = faceEnabled !== null ? faceEnabled : !!matchedFaceAtGen;
      const expressionId = selectedExpressionId || autoMatchedFaceId;
      const selectedFace = faceList.find(f => f.id === expressionId);
      isGenerating = true;
      render();

      showLoader(container, {
        title: 'Sintetizando Miniaturas',
        subtitle: `Generando ${anglesToGenerate.length} variante${anglesToGenerate.length !== 1 ? 's' : ''} — DNA Chain completo activo`,
        detail: `ÁNGULO 1 / ${anglesToGenerate.length} — INICIANDO`,
      });

      try {
        for (let i = 0; i < anglesToGenerate.length; i++) {
          const angle = anglesToGenerate[i];
          const angleLetter = ['A', 'B', 'C', 'D', 'E'][activeIndices[i]] || (activeIndices[i] + 1);
          updateLoader({
            title: `Sintetizando Ángulo ${angleLetter}`,
            subtitle: `"${angle.name}" — aplicando Visual Twist único + ADN de Marca`,
            detail: `VARIANTE ${i + 1} DE ${anglesToGenerate.length} — IMAGE GENERATION`,
          });
          const imagePrompt = buildMasterPrompt({ project, angle, style, formats, selectedFace, useFace, brandKit, textMode, useCelebrity: useCelebrityModel });
          await generateAndSaveVariant({ project, angle, style, formats, imagePrompt, textMode, faceImageUrl: useFace ? (selectedFace?.image_url || null) : null, useCelebrity: useCelebrityModel });
        }
        hideLoader();
        toast(`✅ Batch completado — ${anglesToGenerate.length} miniatura${anglesToGenerate.length !== 1 ? 's' : ''} generada${anglesToGenerate.length !== 1 ? 's' : ''}`, 'success', 4000);
      } catch (err) {
        hideLoader();
        console.error('Batch generate error:', err);
        toast('Error al generar batch: ' + err.message, 'error');
      } finally {
        isGenerating = false;
        await reloadProjects();
        render();
      }
    });

    // ── EXPAND variants ──
    container.querySelectorAll('.btn-expand-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const variantId = btn.dataset.variantId;
        if (expandingVariantsSet.has(variantId)) return;

        const countSelect = document.getElementById(`expand-count-${variantId}`);
        const count = Math.min(parseInt(countSelect?.value || '1'), 5);
        const project = getProject();
        if (!project) return;

        const allVariants = project.thumbnail_variants || [];
        const baseVariant = allVariants.find(v => v.id === variantId);
        if (!baseVariant) return;

        expandingVariantsSet.add(variantId);
        rerenderStep();

        try {
          for (let i = 0; i < count; i++) {
            const variationPrompt = buildVariationPrompt(baseVariant, project, i, count);

            const isRealAngleId = baseVariant.angle_id && !String(baseVariant.angle_id).startsWith('ai-');
            const { data: inserted, error: insertErr } = await supabase
              .from('thumbnail_variants')
              .insert({
                project_id: project.id,
                angle_id: isRealAngleId ? baseVariant.angle_id : null,
                overlay_text: baseVariant.overlay_text,
                style_preset: baseVariant.style_preset,
                impact_score: Math.floor(Math.random() * 20) + 80,
                ai_metadata: {
                  prompt: variationPrompt,
                  angle_name: baseVariant.ai_metadata?.angle_name || '',
                  format: baseVariant.ai_metadata?.format || '',
                  style: baseVariant.style_preset,
                  generating: true,
                  parent_id: variantId,
                  face_image_url: baseVariant.ai_metadata?.face_image_url || null,
                }
              })
              .select()
              .single();
            if (insertErr) throw insertErr;
            await reloadProjects();
            rerenderStep(); // muestra spinner inline en la card recién insertada

            try {
              const variationFaceUrl = baseVariant.ai_metadata?.face_image_url || null;
              const dataUrl = await generateImage(variationPrompt, variationFaceUrl);
              const userId = getState().session?.user?.id;
              const blob = await fetch(dataUrl).then(r => r.blob());
              const mimeType = blob.type || 'image/jpeg';
              const ext = mimeType.includes('png') ? 'png' : 'jpg';
              const fileName = `${userId}/thumbnails/${project.id}/${inserted.id}.${ext}`;
              const { error: uploadError } = await supabase.storage.from('thumbnails').upload(fileName, blob, { contentType: mimeType });
              if (uploadError) throw new Error(`Upload falló: ${uploadError.message}`);
              const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(fileName);

              await supabase.from('thumbnail_variants').update({
                image_url: urlData.publicUrl,
                ai_metadata: { ...inserted.ai_metadata, generating: false }
              }).eq('id', inserted.id);
            } catch (imgErr) {
              console.error('Variation image gen failed:', imgErr);
              await supabase.from('thumbnail_variants').update({
                ai_metadata: { ...inserted.ai_metadata, generating: false, error: imgErr.message }
              }).eq('id', inserted.id);
            }
          }
        } catch (err) {
          console.error('Expand error:', err);
          toast('Error al generar variaciones: ' + err.message, 'error');
        } finally {
          expandingVariantsSet.delete(variantId);
          await reloadProjects();
          render();
        }
      });
    });
  }

  // ── Step-content events: re-bound after rerenderStep() ──────────────────

  function bindStepContentEvents() {
    // ── Project modal button ──
    document.getElementById('btn-open-project-modal')?.addEventListener('click', openVideoSwitcher);

    // ── Format card selection (step 2) ──
    container.querySelectorAll('.format-card').forEach(card => {
      card.addEventListener('click', () => {
        const fid = card.dataset.formatId;
        if (selectedFormats.includes(fid)) {
          selectedFormats = selectedFormats.filter(x => x !== fid);
        } else {
          selectedFormats.push(fid);
        }
        rerenderStep();
        const nextBtn = document.getElementById('btn-next-step');
        if (nextBtn) nextBtn.disabled = selectedFormats.length === 0;
      });
    });

    // ── Style card selection (step 3) ──
    container.querySelectorAll('.style-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedStyleId = selectedStyleId === card.dataset.styleId ? null : card.dataset.styleId;
        rerenderStep();
        const nextBtn = document.getElementById('btn-next-step');
        if (nextBtn) nextBtn.disabled = !selectedStyleId;
      });
    });

    // ── Face YES/NO (step 4) ──
    document.getElementById('face-opt-yes')?.addEventListener('click', () => {
      faceEnabled = true;
      rerenderStep();
    });
    document.getElementById('face-opt-no')?.addEventListener('click', () => {
      faceEnabled = false;
      rerenderStep();
    });

    // ── Celebrity model toggle (step 4) ──
    document.getElementById('celeb-opt-quality')?.addEventListener('click', () => {
      useCelebrityModel = false;
      rerenderStep();
    });
    document.getElementById('celeb-opt-celebrity')?.addEventListener('click', () => {
      useCelebrityModel = true;
      rerenderStep();
    });

    // ── Text mode toggle (step 5) ──
    document.getElementById('text-opt-none')?.addEventListener('click', () => {
      textMode = 'none';
      rerenderStep();
    });
    document.getElementById('text-opt-canvas')?.addEventListener('click', () => {
      textMode = 'canvas';
      rerenderStep();
    });
    document.getElementById('text-opt-ai')?.addEventListener('click', () => {
      textMode = 'ai';
      rerenderStep();
    });

    // ── Agent Mode toggle ──
    document.getElementById('toggle-agent-mode')?.addEventListener('click', () => {
      agentMode = !agentMode;
      rerenderStep();
    });

    // ── Face expression card selection (step 4) ──
    container.querySelectorAll('.face-opt-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedExpressionId = card.dataset.faceId;
        rerenderStep();
      });
    });


    // ── Angle pagination (step 5) ──
    container.querySelectorAll('.angles-page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        anglesPage = parseInt(btn.dataset.page);
        rerenderStep();
      });
    });

    // ── Per-card generate (step 5) — concurrent per angle ──
    container.querySelectorAll('.btn-generate-angle').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (isGenerating) return; // batch en progreso: esperar
        const angleIdx = parseInt(btn.dataset.angleIndex);
        if (generatingAnglesSet.has(angleIdx)) return; // este ángulo ya genera
        const capturedTextMode = textMode;
        const controller = new AbortController();
        generatingControllers.set(angleIdx, controller);
        generatingAnglesSet.add(angleIdx);
        rerenderStep();
        try {
          await generateSingleAngle(angleIdx, capturedTextMode, controller.signal);
        } catch (err) {
          if (err.name !== 'AbortError') toast('Error al generar: ' + err.message, 'error');
        } finally {
          generatingAnglesSet.delete(angleIdx);
          generatingControllers.delete(angleIdx);
          await reloadProjects();
          render();
        }
      });
    });

    // ── Cancel in-progress generation ──
    container.querySelectorAll('.btn-cancel-angle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const angleIdx = parseInt(btn.dataset.angleIndex);
        generatingControllers.get(angleIdx)?.abort();
      });
    });

    // ── Generate All (step 5) ──
    document.getElementById('btn-generate-all')?.addEventListener('click', async () => {
      if (isGenerating) return;
      const project = getProject();
      if (!project) return;
      const angles = project.logic_dna?.selected_angles || [];
      const variants = project.thumbnail_variants || [];
      const masters = variants.filter(v => !v.ai_metadata?.parent_id);
      const pending = angles.reduce((acc, a, i) => {
        if (!masters.some(v => v.ai_metadata?.angle_name === a.name)) acc.push(i);
        return acc;
      }, []);
      if (pending.length === 0) {
        toast('Todas las miniaturas ya fueron generadas.', 'info', 2500);
        return;
      }
      isGenerating = true;
      render();
      showLoader(container, {
        title: 'Generando Todas las Miniaturas',
        subtitle: `${pending.length} ángulo${pending.length!==1?'s':''} en cola`,
        detail: `INICIANDO`,
      });
      try {
        for (let qi = 0; qi < pending.length; qi++) {
          const angleIdx = pending[qi];
          const angle = angles[angleIdx];
          const letters = ['A','B','C','D','E','F','G','H'];
          updateLoader({
            title: `Generando Ángulo ${letters[angleIdx] || angleIdx+1}`,
            subtitle: `"${angle.name}"`,
            detail: `MINIATURA ${qi+1} DE ${pending.length}`,
          });
          generatingAnglesSet.add(angleIdx);
          await generateSingleAngle(angleIdx);
          await reloadProjects();
          generatingAnglesSet.delete(angleIdx);
        }
        hideLoader();
        toast(`✅ ${pending.length} miniatura${pending.length!==1?'s':''} generada${pending.length!==1?'s':''}`, 'success', 4000);
      } catch (err) {
        hideLoader();
        toast('Error al generar: ' + err.message, 'error');
      } finally {
        generatingAnglesSet.clear();
        isGenerating = false;
        await reloadProjects();
        render();
      }
    });

    // ── Step-content expand-variant (step 5 cards) ──
    container.querySelectorAll('#step-content .btn-expand-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const variantId = btn.dataset.variantId;
        if (expandingVariantsSet.has(variantId)) return;
        const countSelect = document.getElementById(`expand-count-${variantId}`);
        const count = Math.min(parseInt(countSelect?.value || '1'), 8);
        const project = getProject();
        if (!project) return;
        const baseVariant = (project.thumbnail_variants || []).find(v => v.id === variantId);
        if (!baseVariant) return;
        expandingVariantsSet.add(variantId);
        rerenderStep();
        try {
          for (let i = 0; i < count; i++) {
            const variationPrompt = buildVariationPrompt(baseVariant, project, i, count);
            const isRealAngleId = baseVariant.angle_id && !String(baseVariant.angle_id).startsWith('ai-');
            const { data: inserted, error: insertErr } = await supabase.from('thumbnail_variants').insert({
              project_id: project.id,
              angle_id: isRealAngleId ? baseVariant.angle_id : null,
              overlay_text: baseVariant.overlay_text,
              style_preset: baseVariant.style_preset,
              impact_score: Math.floor(Math.random() * 20) + 80,
              ai_metadata: { prompt: variationPrompt, angle_name: baseVariant.ai_metadata?.angle_name||'', format: baseVariant.ai_metadata?.format||'', style: baseVariant.style_preset, generating: true, parent_id: variantId, face_image_url: baseVariant.ai_metadata?.face_image_url||null }
            }).select().single();
            if (insertErr) throw insertErr;
            await reloadProjects();
            rerenderStep(); // muestra spinner inline en la card recién insertada
            try {
              const dataUrl = await generateImage(variationPrompt, baseVariant.ai_metadata?.face_image_url || null);
              const userId = getState().session?.user?.id;
              const blob = await fetch(dataUrl).then(r => r.blob());
              const mimeType = blob.type || 'image/jpeg';
              const ext = mimeType.includes('png') ? 'png' : 'jpg';
              const fileName = `${userId}/thumbnails/${project.id}/${inserted.id}.${ext}`;
              await supabase.storage.from('thumbnails').upload(fileName, blob, { contentType: mimeType });
              const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(fileName);
              await supabase.from('thumbnail_variants').update({ image_url: urlData.publicUrl, ai_metadata: { ...inserted.ai_metadata, generating: false } }).eq('id', inserted.id);
            } catch (imgErr) {
              await supabase.from('thumbnail_variants').update({ ai_metadata: { ...inserted.ai_metadata, generating: false, error: imgErr.message } }).eq('id', inserted.id);
            }
          }
          toast(`✅ ${count} variación${count!==1?'es':''} generada${count!==1?'s':''}`, 'success', 3000);
        } catch (err) {
          toast('Error al variar: ' + err.message, 'error');
        } finally {
          expandingVariantsSet.delete(variantId);
          await reloadProjects();
          render();
        }
      });
    });

    // ── Step-content delete-variant + download + lightbox (step 5 cards) ──
    container.querySelectorAll('#step-content .btn-delete-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const variantId = btn.dataset.variantId;
        const project = getProject();
        if (!project) return;
        const variant = (project.thumbnail_variants || []).find(v => v.id === variantId);
        if (variant?.image_url) {
          const parts = variant.image_url.split('/public/thumbnails/');
          if (parts.length > 1) await supabase.storage.from('thumbnails').remove([parts[1]]).catch(()=>{});
        }
        await supabase.from('thumbnail_variants').delete().eq('id', variantId);
        await reloadProjects();
        render();
      });
    });
    container.querySelectorAll('#step-content .btn-cancel-variant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await cancelStuckVariant(btn.dataset.variantId);
      });
    });
    container.querySelectorAll('#step-content .btn-download, #step-content .thumb-preview-trigger').forEach(el => {
      el.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (el.classList.contains('thumb-preview-trigger')) {
          openLightboxForImg(el);
        } else {
          const src = el.dataset.src, name = el.dataset.name;
          try {
            const resp = await fetch(src);
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
            setTimeout(()=>URL.revokeObjectURL(url),1000);
          } catch { const a=document.createElement('a'); a.href=el.dataset.src; a.download=el.dataset.name; document.body.appendChild(a); a.click(); document.body.removeChild(a); }
        }
      });
    });
  }

  // ── Helper: build a clean IMAGE_SAFETY fallback prompt ────────────────────
  // Preserves thematic relevance (hero, hook, angle) without the heavy FORMAT
  // language that triggers the safety filter. Called before generateImage so
  // the retried generation is still coherent with the video.
  function buildSafetyFallbackPrompt(angle, project, style) {
    const vb = project?.logic_dna?.visual_briefing || {};
    const heroObject = vb.hero_object || '';
    const centralConflict = vb.central_conflict || '';
    const hook = project.logic_dna?.hook || '';
    const tension = project.logic_dna?.tension || '';
    const promise = project.logic_dna?.promise || '';
    const psychAngle = angle.psychology || angle.psychology_text || '';

    const lines = [
      `Create a visually striking YouTube thumbnail in 16:9 format.`,
      style?.lighting ? `Visual rendering style: ${style.lighting}` : '',
      heroObject ? `Central element (must dominate the composition): ${heroObject}` : '',
      centralConflict ? `Visual drama to portray: ${centralConflict}` : '',
      hook ? `Hook concept: ${hook}` : '',
      tension ? `Core tension: ${tension}` : '',
      promise ? `Promise: ${promise}` : '',
      `Psychological angle: "${angle.name}"${psychAngle ? ` — ${psychAngle.slice(0, 120)}` : ''}.`,
      `Requirements: High-impact composition. Professional cinematic lighting. Vibrant colors. Ultra-sharp. No text, letters, or words anywhere in the image.`,
    ];
    return lines.filter(Boolean).join('\n');
  }

  // ── Helper: build master prompt (DNA Chain — Fusión de Capas) ──────────────
  // Slot order: [ESTILO_VISUAL] + [FORMATO_CREATIVO] + [OBJETO_HEROE] + [VISUAL_TWIST] + [ADN_MARCA]
  function buildMasterPrompt({ project, angle, style, formats, selectedFace, useFace, brandKit, textMode = 'none', heroOverride = null, useCelebrity = false }) {
    // === LAYER 1: VISUAL STYLE (lighting, textures, rendering quality) ===
    const styleLayer = [
      style.lighting,
      `Additional style keywords: ${style.keywords}`,
    ].filter(Boolean).join('\n');

    // === LAYER 2: CREATIVE FORMAT (physical composition layout) ===
    const formatLayer = formats.map(f => f.composition).join('\nCOMBINED WITH:\n');

    // === LAYER 3: HERO OBJECT (from Cerebro visual_briefing + script DNA) ===
    const vb = project?.logic_dna?.visual_briefing || {};
    // heroOverride: used when celebrity translation has replaced the real name with visual descriptors
    const heroObject = heroOverride || vb.hero_object || project.logic_dna?.hook || '';
    const centralConflict = vb.central_conflict || project.logic_dna?.tension || '';
    const requiredEmotion = vb.required_emotion || '';
    const heroLayer = [
      heroObject ? `HERO ELEMENT (mandatory, must dominate the visual): ${heroObject}` : '',
      centralConflict ? `Visual drama to portray: ${centralConflict}` : '',
      project.logic_dna?.hook ? `Hook: ${project.logic_dna.hook}` : '',
      project.logic_dna?.tension ? `Tension: ${project.logic_dna.tension}` : '',
      project.logic_dna?.promise ? `Promise: ${project.logic_dna.promise}` : '',
    ].filter(Boolean).join('\n');

    // === LAYER 4: VISUAL TWIST (unique per angle — the A/B/C differentiator) ===
    const twistLayer = angle.visual_twist
      ? `VISUAL TWIST — THIS IS THE CORE DIFFERENTIATOR FOR THIS VARIANT:\n${angle.visual_twist}\nThis twist must be unmistakably visible in the final image. Make it the defining creative decision.`
      : `Psychological angle: "${angle.name}"${angle.psychology_text ? ` — ${angle.psychology_text}` : ''}`;

    // === LAYER 5: BRAND ADN (tone, identity, gallery style, market contrast) ===
    const adnData = brandKit?.detailed_adn;
    const adn = adnData?.synthesis || adnData || {};
    const ytAnalysis = adnData?.youtube_analysis || null;
    // Campos del ADN — YouTube ADN tiene precedencia sobre el formato viejo de entrevista
    const brandTone = adn.tone || ytAnalysis?.channel_archetype || '';
    const brandBranding = adn.branding || ytAnalysis?.visual_signature || '';
    const styleSummary = brandKit?.style_summary || {};
    const winningStyle = styleSummary.visual_style || styleSummary.winning_pattern || '';
    const palette = styleSummary.palette?.join(', ') || '';
    const composition = styleSummary.composition || '';
    const mc = project?.logic_dna?.market_contrast || {};
    const avoidColors = mc.avoid_colors?.join(', ') || '';
    const crowdPattern = mc.crowd_pattern || '';
    const adnLayer = [
      (brandTone || brandBranding) ? `Brand tone & archetype: ${brandTone}. Visual identity: ${brandBranding}.` : '',
      // YouTube ADN — datos reales del canal (condicional, no bloquea si no existe)
      ytAnalysis?.visual_signature ? `Channel's proven visual signature (from top-performing videos): ${ytAnalysis.visual_signature}` : '',
      ytAnalysis?.audience_psychology ? `Audience psychology — what makes THIS specific audience stop and click: ${ytAnalysis.audience_psychology}` : '',
      ytAnalysis?.performance_insights ? `What drives performance in this channel: ${ytAnalysis.performance_insights}` : '',
      ytAnalysis?.differentiation ? `Channel market differentiation (use this to stand out): ${ytAnalysis.differentiation}` : '',
      // Galería de éxitos
      winningStyle ? `Creator's proven visual style from winning thumbnails: ${winningStyle}` : '',
      composition ? `Composition signature: ${composition}` : '',
      palette ? `Brand palette: ${palette}` : '',
      avoidColors ? `Market contrast — AVOID these competitor colors as dominant: ${avoidColors}` : '',
      crowdPattern ? `Do NOT replicate this crowd pattern: "${crowdPattern}"` : '',
    ].filter(Boolean).join('\n');

    // === LAYER 2.5: THEMATIC COLOR PALETTE (content-adaptive, competition-aware) ===
    const colorPaletteLayer = [
      'Derive the dominant color palette EXCLUSIVELY from the video\'s content themes described in Layer 3 — NOT from format or style aesthetic defaults. Apply the matching color family:',
      '• ACTION / VIOLENCE / EXPLOSIONS / WAR / CRIME / NARCO / DRUGS → burning reds, deep charcoal-black, molten oranges, hellfire yellows — raw danger palette',
      '• TECHNOLOGY / AI / DIGITAL / SOFTWARE / APPS / CHATGPT / ROBOTS / INTERNET → electric blue, cyan, cool white-grey, vibrant purple — precision tech palette',
      '• MYSTERY / SECRETS / CONSPIRACY / HIDDEN TRUTH / INVESTIGATION → deep purples, near-black, blood red accents, harsh single spotlight white',
      '• MONEY / POWER / LUXURY / WEALTH / BUSINESS / FINANCE → golds, deep navy, champagne tones, emerald green — prestige palette',
      '• SPORT / COMPETITION / PHYSICAL ENERGY / TRAINING → electric yellow, vivid green, intense royal blue — kinetic saturated palette',
      '• SURVIVAL / NATURE / ADVENTURE / OUTDOOR → military green, raw earth clay, storm grey, burnt copper',
      '• HISTORY / RELIGION / PHILOSOPHY / POLITICS → deep crimson, aged gold, midnight blue, parchment white',
      'RULE: For VERSUS/SPLIT format — the dividing energy line MUST use the thematic accent color above, never default to neon cyan/purple.',
      'RULE: NEVER apply neon/cyberpunk/electric-blue tones unless the video content is explicitly about technology, AI, or digital products.',
      palette ? `Brand palette anchors (use as secondary accents): ${palette}` : '',
      avoidColors ? `COMPETITOR DIFFERENTIATION — AVOID these as dominant tones (already saturating the market in this niche): ${avoidColors}` : '',
      crowdPattern ? `Do NOT replicate this saturated competitor visual pattern: "${crowdPattern}"` : '',
      'OBJECTIVE: Stand out in the YouTube feed. Be visually distinct from competitors while staying 100% true to the video\'s theme and emotions.',
    ].filter(Boolean).join('\n');

    // === LAYER 6: FACE / CELEBRITY INTEGRATION ===
    // 4 combinations: (useFace + useCelebrity) | (useCelebrity only) | (useFace only) | (none)
    const faceLayer = (() => {
      if (useFace && useCelebrity && selectedFace) {
        return `DUAL PERSON COMPOSITION — CELEBRITY + CREATOR REACTION:
PRIMARY subject (celebrity): ${heroObject} — must occupy 50–60% of the frame. Their most iconic visual identity must be instantly recognizable in 0.2 seconds at thumbnail size. Use their well-known appearance: signature features, iconic style, characteristic pose. Do NOT invent a generic person.
SECONDARY subject (creator): The reference photo of the real creator is attached to this request. They appear in a SMALLER, SECONDARY position — right side or upper corner — expressing a visceral emotion (shock, disbelief, excitement, awe) DIRECTED AT the celebrity. Preserve 100% of the creator's real facial identity from the photo: bone structure, eyes, hair, skin tone.
Required creator expression: ${requiredEmotion || selectedFace.expression_type} — hyper-expressive, 2x over-the-top cinematic.
NARRATIVE RULE: The celebrity and creator must connect through eye-line direction. The creator visually reacts TO the celebrity. This visual tension IS the thumbnail story. The creator does NOT compete for dominance — they AMPLIFY the emotional reading.`;
      }
      if (!useFace && useCelebrity) {
        return `CELEBRITY SUBJECT (mandatory): ${heroObject} — generate with their most iconic and immediately recognizable visual identity. Must be identifiable by any viewer in 0.2 seconds at thumbnail size. Use their signature physical features, iconic style elements, or characteristic pose. Required emotional expression: ${requiredEmotion || 'intense, over-the-top cinematic, commanding'} — 2x exaggerated beyond natural. This is the primary and only human element in the composition.`;
      }
      if (useFace && !useCelebrity && selectedFace) {
        return `CREATOR FACE (mandatory): The reference photo of the real creator is attached to this request as an image. You MUST use that exact real person's face — do NOT generate a fictional or AI-invented face. Preserve 100% of their real identity: bone structure, eyes, nose, mouth, hair, skin tone, and any distinctive features. Required expression: ${requiredEmotion || selectedFace.expression_type} — make it hyper-expressive and over-the-top cinematic, but the face must unmistakably be the same real person from the reference photo.`;
      }
      return `NO HUMAN PRESENCE — ABSOLUTE RULE: Zero faces, zero people, zero bodies, zero hands, zero silhouettes, zero humanoid shapes of any kind. If any option in LAYER 2 describes a face-based composition, SKIP that option entirely and choose the next available option that builds visual impact using only objects, environments, graphic elements, symbols, or abstract visual language. This rule is NON-NEGOTIABLE and overrides any face-related instruction in any other layer.`;
    })();

    // Hard preamble only when absolutely no person is in the image — prevents AI-generated faces
    const noFacePreamble = (!useFace && !useCelebrity) ? `🚫 HARD CONSTRAINT — READ BEFORE ANYTHING ELSE: This thumbnail must contain ZERO human faces, people, or body parts of any kind. No real faces, no AI-generated faces, no silhouettes, no hands, no humanoid figures. Any composition option in LAYER 2 that involves a person's face or body MUST be skipped. Build maximum visual impact using only objects, environments, graphic design, symbols, and abstract elements. This constraint cannot be overridden by any instruction that follows.

` : '';

    return `${noFacePreamble}━━━ ROLE & MISSION ━━━
You are the world's best YouTube thumbnail graphic designer — a creative director with 15+ years of experience studying viral content across every niche: crime, tech, finance, sports, entertainment, history, lifestyle. You have analyzed over 50,000 high-performing thumbnails and understand exactly what makes a human stop mid-scroll and click. You think in terms of visual hierarchy, emotional triggers, color psychology, negative space, and compositional tension. Your thumbnails consistently achieve CTR above 15%. You NEVER produce generic or predictable compositions. You invent unexpected, surprising, and visually stunning executions while staying completely true to the video's content and emotional DNA.

Your task: generate the single most visually impactful, click-worthy YouTube thumbnail possible for this specific video — 16:9 aspect ratio, maximum CTR optimized. Surprise the viewer. Make it impossible to ignore.

━━━ LAYER 1: VISUAL STYLE & RENDERING ━━━
${styleLayer}

━━━ LAYER 2: COMPOSITION FORMAT (physical layout) ━━━
${formatLayer}

━━━ LAYER 2.5: THEMATIC COLOR PALETTE — CONTENT-ADAPTIVE ━━━
${colorPaletteLayer}

━━━ LAYER 3: HERO OBJECT & SCRIPT DNA ━━━
${heroLayer}

━━━ LAYER 4: VISUAL TWIST — ANGLE "${angle.name.toUpperCase()}" ━━━
${twistLayer}

━━━ LAYER 5: BRAND ADN & MARKET CONTRAST ━━━
${adnLayer}

━━━ LAYER 6: CREATOR FACE ━━━
${faceLayer}

FINAL REQUIREMENTS: Ultra-sharp. Maximum visual punch. Vibrant. Palette faithful to the video's content. Visually distinct from competitors.

${(textMode === 'ai') ? `━━━ LAYER 7: TIPOGRAFIA Y TEXTO — OVERLAY TECHNIQUE ━━━
⚠️ MANDATORY TEXT REQUIREMENT — NON-NEGOTIABLE: This thumbnail MUST contain physically rendered, clearly readable text. Text generation is OBLIGATORY. An image without visible text is a failed generation. You MUST render at least 1 word. There are NO exceptions. Even if the composition seems full, text MUST be present somewhere in the frame.

You are a senior YouTube thumbnail creative director with 15+ years of experience studying viral content psychology. You have analyzed over 50,000 high-performing thumbnails and understand exactly which words stop a human mid-scroll. Typography is a surgical tool — one perfectly chosen word doubles CTR; five mediocre words destroy the image.

TECHNIQUE: OVERLAY — text is rendered in the highest visual plane, ON TOP of all scene elements. The text sits above the hero object, above backgrounds, above all graphic elements. It is the last layer rendered.

━━ ANTI-HALLUCINATION PROTOCOL — NON-NEGOTIABLE ━━
BEFORE designing anything: commit to your exact words. Spell each word letter by letter internally. COUNT the letters. Only then render.
PROHIBITED text structures — these ALWAYS cause hallucination, NEVER use them:
✗ Numbered lists (1. 2. 3.)
✗ Bullet point lists
✗ Sentences or phrases longer than 3 words
✗ Document panels, evidence boards, info boxes, label systems
✗ Any element requiring more than one line of body text
✗ Arrows pointing to labeled elements
✗ Multi-line structured text of any kind
RULE: If a composition format (from Layer 2) naturally implies a document or list with text content, that document/list must be rendered as a GRAPHIC ELEMENT with no readable characters — solid color bands, abstract shapes, redaction bars — NEVER actual words inside it.
SIMPLICITY IS ACCURACY: a 4-letter common word rendered perfectly beats a 10-letter invented word. When uncertain between two options, always choose the shorter, simpler, more common word. A single word rendered with absolute precision is a stronger creative decision than two words with any rendering doubt.

━━ WORD SELECTION — SENIOR CREATIVE JUDGMENT ━━
Select 1 primary word (mandatory) and optionally 1 secondary word (only if it adds unique emotional information the primary does not cover). Maximum 2 words total across ALL text elements.
Source material: the video's hook, tension, promise, and the psychological angle from Layers 3 and 4.
Apply the correct psychological trigger for this specific content:
• SHOCK / DISSONANCE: A word that creates instant cognitive conflict — something unexpected, impossible, or contradictory to what the viewer assumed. (ex: "NUNCA", "IMPOSIBLE", "TODO")
• CURIOSITY GAP: A word that implies there is hidden information the viewer does not yet have — they must click to complete the picture. (ex: "SECRETO", "FILTRADO", "REAL", "OCULTO")
• URGENCY / DANGER: A word that signals something critical is happening right now, creating FOMO or threat response. (ex: "ALERTA", "AHORA", "ULTIMO")
• IDENTITY CHALLENGE: A word that speaks directly to the viewer's self-concept, making them feel personally called out. (ex: "VOS", "TODOS", "NADIE", "YO")
• VALIDATION / REVELATION: A word that confirms something the viewer suspected but never saw confirmed. (ex: "CONFIRMADO", "EXPUESTO", "VERDAD")
The word MUST be thematically coherent with the psychological angle of this specific variant (Layer 4). LANGUAGE RULE — MANDATORY: All text rendered inside the image MUST be in SPANISH. The target audience is Spanish-speaking — English words in the image create immediate disconnection and destroy CTR. No exceptions.

━━ PLACEMENT — OVERLAY RULES ━━
Text goes ON TOP of the scene. These rules are absolute:
1. FACE PROTECTION: If the composition contains a human face, text must NEVER cover the eyes or mouth. Eyes and mouth are the #1 CTR emotional triggers — covering them kills the click. Place text above the face, below the chin, or in lateral space.
2. HERO PROTECTION: Primary text must not completely obscure the hero object or face — it can overlap edges but the subject must remain clearly readable as a visual.
3. NATURAL NEGATIVE SPACE: Identify the area of the composition with the least visual information (often upper corners, lower band, or lateral margins) and anchor the primary text there.
4. SIZE: Primary text must be large enough to read at 120x68px (mobile thumbnail size). It must be the largest typographic element.
5. HIERARCHY: If using a secondary word — it must be visually subordinate (smaller size, lower contrast, or different weight) to the primary.

━━ TYPOGRAPHIC TREATMENT — MATCH CONTENT THEME ━━
Select font style and rendering coherent with the content theme from Layer 2.5:
CRIMEN/PELIGRO/ACCION/DRAMA: Ultra-bold slab serif, distressed grunge texture, charcoal-black or blood red, aggressive forward italic. Feel: stamped on metal, scraped into concrete, worn stencil.
TECNOLOGIA/IA/DIGITAL/SOFTWARE: Clean geometric sans-serif, holographic shimmer or electric glow edges, cyan or white on dark. Feel: projected hologram, LED screen, neon sign.
DINERO/PODER/LUJO/NEGOCIOS: Gold or chrome 3D metallic extrusion, wide-tracking all-caps, deep drop shadows. Feel: engraved in marble, stamped in gold foil, embossed leather.
MISTERIO/SECRETOS/CONSPIRACION: Worn red stamp stencil, classified document typewriter font, burned or torn edges. Feel: stamped on a classified file — single word only, maximum impact.
DEPORTE/ENERGIA/COMPETICION: Ultra-compressed italic slab, explosive 3D chrome, motion blur trailing edges. Feel: blazing through the air, forged in fire.
HISTORIA/POLITICA/RELIGION: Aged serif, gold emboss or stone carving effect, dramatic patina. Feel: carved in stone, ancient inscription.
SUPERVIVENCIA/AVENTURA/NATURALEZA: Military stencil, raw brushstroke paint, earth tones. Feel: painted on rock, burned into wood.

━━ RENDERING TECHNIQUE ━━
Text must appear physically embedded in the visual world — 3D extrusion, neon glow, painted surface, spray paint, stamped ink, hologram overlay, etched material. NOT a flat digital sticker. Letterforms must respect the thumbnail's lighting (cast shadows, receive light from the key light source) and color palette (Layer 2.5). Perfect kerning. Zero merged characters. Zero overlapping glyphs. Zero letter bleed. Every character must be individually distinct and perfectly legible.

⚠️ FINAL MANDATORY CHECK: Before finalizing the image, confirm that at least 1 clearly readable word is visible in the frame. If no text is present — you MUST add it now. Text is REQUIRED, not optional.` : `ABSOLUTE RULE — ZERO TEXT IN THE IMAGE: No text, words, letters, numbers, or typography anywhere in the image — not on screens, signs, banners, badges, posters, or any surface. CRITICAL: Do NOT generate blank rectangular color bars, empty banner shapes, horizontal color bands, or ANY element that visually resembles a text placeholder — even if empty. Every single element in the composition must be a photographic, environmental, figurative, or atmospheric visual element that exists in the physical world of the scene. There is no "space reserved for text" — the composition is 100% complete as rendered. Text is applied exclusively in post-production. GENERATING A BLANK BAR OR RECTANGLE IS THE SAME VIOLATION AS GENERATING TEXT — BOTH ARE FORBIDDEN.`}

UNIVERSO VISUAL CERRADO — ANTI-ALUCINACION: Renderiza UNICAMENTE los elementos visuales explicitamente descritos en las capas anteriores. PROHIBIDO agregar elementos por asociacion cultural o de genero: no inventar logotipos, marcas, insignias, iconos no especificados, efectos de franquicia, pantallas con contenido, fondos de escenografia no mencionados, ni ningun elemento decorativo que no este descripto literalmente arriba. Si el estilo evoca un genero (noticiero, cine de accion, documental), renderiza SOLO la estetica visual del genero (iluminacion, color, composicion) — NO sus elementos de UI, marcos de programa, graficos de produccion ni branding inventado. Cada pixel debe justificarse en alguna de las capas anteriores.`;
  }

  // ── Helper: build a full variation prompt from project data ──────────────
  function buildVariationPrompt(baseVariant, project, variationIndex, totalCount) {
    const angleName = baseVariant.ai_metadata?.angle_name || '';
    const angle = (project.logic_dna?.selected_angles || []).find(a => a.name === angleName)
      || { name: angleName, visual_twist: '', psychology_text: '' };

    const styleLabel = baseVariant.style_preset || '';
    const style = STYLES.find(s => s.label === styleLabel) || STYLES[0];

    const formatStr = baseVariant.ai_metadata?.format || '';
    const formatLabels = formatStr.split(' + ').map(s => s.trim()).filter(Boolean);
    const resolvedFormats = formatLabels.map(lbl => FORMATS.find(f => f.label === lbl)).filter(Boolean);
    const safeFormats = resolvedFormats.length > 0 ? resolvedFormats : [FORMATS[0]];

    const faceImageUrl = baseVariant.ai_metadata?.face_image_url || null;
    const useFace = !!faceImageUrl;
    const selectedFace = faceList.find(f => f.image_url === faceImageUrl) || null;
    const variantTextMode = baseVariant.ai_metadata?.text_mode || 'none';

    const masterPrompt = buildMasterPrompt({ project, angle, style, formats: safeFormats, selectedFace, useFace, brandKit, textMode: variantTextMode });

    const dimensionOptions = [
      'Shift the dominant color temperature significantly (if warm palette → go cool; if cool → go warm). Keep all other elements intact.',
      'Reframe the composition (if tight close-up → go wider with environmental context; if wide → go tighter on the hero element). Keep angle and subject identical.',
      'Change the lighting drama (if subtle atmospheric → push to extreme high-contrast; if harsh → go moody and cinematic). Same subject, same angle, different emotional intensity.',
    ];
    const dimension = dimensionOptions[variationIndex % dimensionOptions.length];

    return `${masterPrompt}

━━━ VARIATION DIRECTIVE — VARIANT ${variationIndex + 1} OF ${totalCount} ━━━
This is a creative variation of an existing thumbnail for the same video, psychological angle, and brand identity.
PRESERVE ABSOLUTELY: the psychological angle "${angleName}", the brand ADN, the subject matter and video context${useFace ? ', and the creator face identity (same real person)' : ''}.
CHANGE — exactly one creative dimension:
→ ${dimension}
The viewer must instantly recognize this as the same concept and video, but with a distinctly different visual energy.
Do NOT replicate the same composition, color palette, or lighting mood as the base version.`;
  }

  // ── Helper: generate one image and save to DB ─────────────────────────────
  // Inserts placeholder, immediately updates UI, then generates image in background
  async function generateAndSaveVariant({ project, angle, style, formats, imagePrompt, textMode: tMode = 'none', faceImageUrl = null, parentId = null, signal = null, useCelebrity = false }) {

    // ── Step 0: Celebrity translation (quality model only) ──
    // When useCelebrity=true the user chose the permissive model — keep the real name as-is.
    // When useCelebrity=false translate any celebrity name to visual descriptors so the
    // quality model (gemini-3.1-flash-image) can still render them without being blocked.
    const rawHero = project?.logic_dna?.visual_briefing?.hero_object || '';
    let finalPrompt = imagePrompt;
    let translatedHero = rawHero;
    if (!useCelebrity && rawHero && rawHero.length > 2) {
      translatedHero = await translateCelebrityIfNeeded(rawHero);
      if (translatedHero !== rawHero) {
        finalPrompt = imagePrompt.split(rawHero).join(translatedHero);
      }
    }
    // Choose the image generation model based on user's celebrity preference
    const imageModel = useCelebrity ? IMAGE_GEN_MODEL_CELEBRITY : null; // null = default quality model

    // ── Step 1: Prompt critic (Level 1) ──
    // Silently reinforces the prompt before generation — every generation benefits.
    const videoContext = { hook: project.logic_dna?.hook || '', angle: angle.name };
    finalPrompt = await critiqueAndRefinePrompt(finalPrompt, videoContext);

    const isRealAngleId = angle.id && !String(angle.id).startsWith('ai-');
    const { data: inserted, error: insertErr } = await supabase
      .from('thumbnail_variants')
      .insert({
        project_id: project.id,
        angle_id: isRealAngleId ? angle.id : null,
        overlay_text: null,
        style_preset: style.label,
        impact_score: Math.floor(Math.random() * 20) + 80,
        ai_metadata: {
          prompt: finalPrompt,
          angle_name: angle.name,
          format: formats.map(f => f.label).join(' + '),
          style: style.label,
          generating: true,
          parent_id: parentId,
          face_image_url: faceImageUrl || null,
          text_mode: tMode,
          translated_hero: translatedHero !== rawHero ? translatedHero : undefined,
          agent_mode: agentMode,
        }
      })
      .select()
      .single();
    if (insertErr) throw insertErr;

    // ── Immediately show placeholder in UI ──
    if (!project.thumbnail_variants) project.thumbnail_variants = [];
    project.thumbnail_variants.push(inserted);
    render();

    try {
      const safetyFallback = buildSafetyFallbackPrompt(angle, project, style);

      // ── Step 2: Agent Mode (Level 2) — draft → image critique → refined final ──
      if (agentMode) {
        // 2a. Generate draft (not saved, just held in memory)
        const draftDataUrl = await generateImage(finalPrompt, faceImageUrl, safetyFallback, signal, imageModel);
        // 2b. Critique the draft image
        const draftBase64 = draftDataUrl.split(',')[1];
        const improvement = await critiqueImageForRefinement(draftBase64, {
          hook: project.logic_dna?.hook || '',
          angle: angle.name,
          style: style.label,
        });
        // 2c. Append improvement instructions and regenerate
        if (improvement) {
          finalPrompt = `${finalPrompt}\n\n━━━ AGENT IMPROVEMENT — MANDATORY CORRECTIONS ━━━\n${improvement}`;
        }
      }

      const dataUrl = await generateImage(finalPrompt, faceImageUrl, safetyFallback, signal, imageModel);

      // ── Step 3: Canvas text compositing (if textMode === 'canvas') ──
      let finalDataUrl = dataUrl;
      if (tMode === 'canvas') {
        const textSuggestions = project.logic_dna?.text_suggestions || [];
        const angleIndex = (project.logic_dna?.selected_angles || []).findIndex(a => a.name === angle.name);
        const overlayText = textSuggestions[angleIndex >= 0 ? angleIndex % textSuggestions.length : 0] || textSuggestions[0] || '';
        if (overlayText) {
          finalDataUrl = await compositeTextOnImage(dataUrl, overlayText);
        }
      }

      // ── Step 4: Resize to 1280×720 JPEG (YouTube standard, <2MB) ──
      finalDataUrl = await resizeImageTo720p(finalDataUrl);

      const userId = getState().session?.user?.id;
      const blob = await fetch(finalDataUrl).then(r => r.blob());
      const mimeType = 'image/jpeg';
      const ext = 'jpg';
      const fileName = `${userId}/thumbnails/${project.id}/${inserted.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('thumbnails').upload(fileName, blob, { contentType: mimeType });
      if (uploadError) throw new Error(`Upload falló: ${uploadError.message}`);
      const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(fileName);

      await supabase.from('thumbnail_variants').update({
        image_url: urlData.publicUrl,
        ai_metadata: { ...inserted.ai_metadata, generating: false }
      }).eq('id', inserted.id);

      // ── Update local variant so UI reflects completed image ──
      const localVariant = project.thumbnail_variants.find(v => v.id === inserted.id);
      if (localVariant) {
        localVariant.image_url = urlData.publicUrl;
        localVariant.ai_metadata = { ...inserted.ai_metadata, generating: false };
      }
      render();

    } catch (imgErr) {
      if (imgErr.name === 'AbortError') {
        // User cancelled — delete the placeholder cleanly
        await supabase.from('thumbnail_variants').delete().eq('id', inserted.id).catch(() => {});
        const localIdx = project.thumbnail_variants?.findIndex(v => v.id === inserted.id);
        if (localIdx !== -1) project.thumbnail_variants.splice(localIdx, 1);
        throw imgErr;
      }
      console.error('Image gen failed:', imgErr);
      await supabase.from('thumbnail_variants').update({
        ai_metadata: { ...inserted.ai_metadata, generating: false, error: imgErr.message }
      }).eq('id', inserted.id);

      const localVariant = project.thumbnail_variants.find(v => v.id === inserted.id);
      if (localVariant) {
        localVariant.ai_metadata = { ...inserted.ai_metadata, generating: false, error: imgErr.message };
      }
      render();
    }
  }

  // ── Helper: resize any image to exactly 1280×720 (YouTube standard) ─────────
  // Output is always JPEG at 0.92 quality (~300-600KB, well within YouTube's 2MB limit).
  function resizeImageTo720p(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 1280, 720);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  // ── Helper: composite text overlay onto an image using Canvas API ────────────
  function compositeTextOnImage(dataUrl, text) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const word = text.toUpperCase().trim();
        const fontSize = Math.max(Math.floor(canvas.width * 0.1), 48);
        const padX = Math.floor(canvas.width * 0.05);
        const padY = Math.floor(canvas.height * 0.05);

        // Dark gradient bar behind text for universal readability
        const gradH = fontSize * 2.2;
        const grad = ctx.createLinearGradient(0, canvas.height - gradH, 0, canvas.height);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.72)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, canvas.height - gradH, canvas.width, gradH);

        // Text: Impact bold white + thick black stroke
        ctx.font = `900 ${fontSize}px Impact, "Arial Black", sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        const textY = canvas.height - padY;

        ctx.strokeStyle = 'rgba(0,0,0,0.95)';
        ctx.lineWidth = Math.floor(fontSize * 0.14);
        ctx.lineJoin = 'round';
        ctx.strokeText(word, padX, textY);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(word, padX, textY);

        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(dataUrl); // fallback: return original if canvas fails
      img.src = dataUrl;
    });
  }

  async function reloadProjects() {
    const { data: updated } = await supabase
      .from('projects').select('*, thumbnail_variants(*)')
      .eq('channel_id', activeChannelId).order('created_at', { ascending: false });
    projects.length = 0;
    (updated || []).forEach(p => projects.push(p));

    // Auto-cleanup: mark stuck variants (generating=true, sin imagen, >5min) como error
    const STUCK_MS = 5 * 60 * 1000;
    const now = Date.now();
    const stuckIds = [];
    for (const project of projects) {
      for (const v of (project.thumbnail_variants || [])) {
        if (v.ai_metadata?.generating && !v.image_url &&
            (now - new Date(v.created_at).getTime()) > STUCK_MS) {
          stuckIds.push(v.id);
          v.ai_metadata = { ...v.ai_metadata, generating: false, error: 'Generación interrumpida — reintentá' };
        }
      }
    }
    if (stuckIds.length > 0) {
      for (const id of stuckIds) {
        const v = projects.flatMap(p => p.thumbnail_variants || []).find(x => x.id === id);
        await supabase.from('thumbnail_variants').update({ ai_metadata: v.ai_metadata }).eq('id', id);
      }
    }
  }

  async function cancelStuckVariant(variantId) {
    await supabase.from('thumbnail_variants').delete().eq('id', variantId);
    await reloadProjects();
    render();
  }

  render();
}
